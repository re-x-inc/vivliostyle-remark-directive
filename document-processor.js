import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { hast as vfmFigure } from "@vivliostyle/vfm/lib/plugins/figure.js";
import { visit } from "unist-util-visit";

/**
 * Fix broken directive patterns in markdown before remark processes them.
 *
 * Problem: :::div{.table-dense} is used with GFM tables in three broken patterns:
 *   A) Directive on own line, but table rows are line-wrapped and closing ::: is inline
 *   B) Directive + table content on the same line
 *   C) Directive embedded inside a table cell (| :::div{...} | col | ...)
 *
 * All patterns also suffer from Prettier-style line wrapping that breaks table row
 * boundaries. This preprocessor collects the entire block, reconstructs proper
 * GFM table rows, and outputs clean :::directive / table / ::: structure.
 */
function preprocessDirectivePatterns(content) {
  // Normalize line endings (some files have \r\n)
  content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = content.split("\n");
  const result = [];
  let i = 0;
  let inCodeFence = false;

  while (i < lines.length) {
    const line = lines[i];

    // Track code fences — skip processing inside them
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
      result.push(line);
      i++;
      continue;
    }
    if (inCodeFence) {
      result.push(line);
      i++;
      continue;
    }

    // Pattern C: | :::div{.table-dense} | col |...
    // Table rows are on separate lines (not wrapped), just remove directive from first cell
    const tdPatternC = line.match(/^\|\s*:::div\{(\.table-dense)\}\s*\|(.+)$/);
    if (tdPatternC) {
      result.push(`:::div{${tdPatternC[1]}}`);
      // Output the header row without the directive (empty first cell preserved)
      result.push(`|${tdPatternC[2]}`);
      i++;
      continue;
    }

    // Pattern B: :::div{.table-dense} | col |...
    const tdPatternB = line.match(/^:::div\{(\.table-dense)\}\s+(\|.+)$/);
    if (tdPatternB) {
      const collected = collectUntilClose(tdPatternB[2], lines, i + 1);
      i = collected.nextIndex;
      const table = reconstructTableBlock(collected.text);
      result.push(`:::div{${tdPatternB[1]}}`);
      result.push(table);
      result.push(":::");
      continue;
    }

    // Pattern A: :::div{.table-dense} on its own line
    if (/^:::div\{\.table-dense\}\s*$/.test(line)) {
      const collected = collectUntilClose("", lines, i + 1);
      i = collected.nextIndex;
      const table = reconstructTableBlock(collected.text);
      result.push(":::div{.table-dense}");
      result.push(table);
      result.push(":::");
      continue;
    }

    // Generic non-table-dense directives: just fix line splitting
    // Pattern C generic: | :::div{.class} | ...
    const genC = line.match(/^\|\s*:::div\{([^}]+)\}\s*\|(.+)$/);
    if (genC) {
      result.push(`:::div{${genC[1]}}`);
      result.push(`|${genC[2]}`);
      if (i + 1 < lines.length) {
        const sep = lines[i + 1].match(/^\|\s*[-:]+\s*\|(.+)$/);
        if (sep) {
          result.push(`|${sep[1]}`);
          i++;
        }
      }
      i++;
      continue;
    }

    // Pattern B generic: :::div{.class} | col |...
    const genB = line.match(/^(:::div\{[^}]+\})\s+(\|.+)$/);
    if (genB) {
      result.push(genB[1]);
      result.push(genB[2]);
      i++;
      continue;
    }

    // Closing ::: at end of a table row
    const closingPattern = line.match(/^(\|.*?)\s*:::\s*\|?\s*$/);
    if (closingPattern) {
      let tableRow = closingPattern[1].trimEnd();
      if (!tableRow.endsWith("|")) tableRow += " |";
      result.push(tableRow);
      result.push(":::");
      i++;
      continue;
    }

    result.push(line);
    i++;
  }

  return result.join("\n");
}

/** Collect lines from startIndex until a closing ::: is found. */
function collectUntilClose(initial, lines, startIndex) {
  let text = initial;
  let i = startIndex;
  while (i < lines.length) {
    const cl = lines[i];
    const m = cl.match(/^(.*?)\s*:::\s*\|?\s*$/);
    if (m) {
      if (m[1].trim()) text += " " + m[1];
      i++;
      break;
    }
    text += " " + cl;
    i++;
  }
  return { text: text.trim(), nextIndex: i };
}

/**
 * Reconstruct a proper GFM table from line-wrapped pipe-delimited text.
 * Determines column count from the separator row, then groups cells into rows.
 */
function reconstructTableBlock(text) {
  text = text.replace(/\s+/g, " ").trim();
  if (!text.includes("|")) return text;

  // Split by | — each cell becomes an element, row boundaries become ""
  const rawCells = text.split("|").map((s) => s.trim());

  // Find separator: consecutive cells matching /^[-:]+$/
  let sepStart = -1,
    sepCount = 0;
  for (let j = 0; j < rawCells.length; j++) {
    if (/^[-:]+$/.test(rawCells[j])) {
      if (sepStart < 0) sepStart = j;
      sepCount++;
    } else if (sepStart >= 0) {
      break;
    }
  }
  if (sepStart < 0 || sepCount < 2) return text; // not a recognizable table

  const colCount = sepCount;
  const groupSize = colCount + 1; // each row = colCount cells + 1 boundary ""

  // Group cells into rows: [boundary, cell1, ..., cellN]
  const rows = [];
  for (let j = 0; j < rawCells.length; j += groupSize) {
    const group = rawCells.slice(j, j + groupSize);
    const cells = group.slice(1); // skip the boundary element
    if (cells.length === 0) continue;
    while (cells.length < colCount) cells.push("");
    rows.push("| " + cells.join(" | ") + " |");
  }

  return rows.join("\n");
}

export default function documentProcessor(factoryOptions = {}) {
  return {
    process: async function (entry, methodOptions = {}) {
      let content = "";
      if (typeof entry === "string") {
        content = entry;
      } else if (entry && entry.contents) {
        content = entry.contents;
      } else if (entry && entry.content) {
        content = entry.content;
      } else if (entry && entry.value) {
        content = entry.value;
      }

      // Pre-process content to fix broken directive patterns
      let processedContent = preprocessDirectivePatterns(content);

      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter, ["yaml", "toml"])
        .use(remarkGfm)
        .use(remarkDirective)
        .use(() => (tree, file) => {
          // Extract layout from frontmatter
          const yamlNode = tree.children.find(
            (child) => child.type === "yaml"
          );
          if (yamlNode) {
            const layoutMatch = yamlNode.value.match(
              /layout:\s*['"]?([\w-]+)['"]?/
            );
            if (layoutMatch) {
              file.data.layout = layoutMatch[1];
            }
            const chapterMatch = yamlNode.value.match(
              /chapter:\s*['"]?(\d+)['"]?/
            );
            if (chapterMatch) {
              file.data.chapter = chapterMatch[1];
            }
            // Extract summary (supports multi-line YAML with | or single-line)
            const summaryMatch = yamlNode.value.match(
              /summary:\s*\|?\s*\n?([\s\S]*?)(?=\n\w|\n---|$)/
            );
            if (summaryMatch) {
              file.data.summary = summaryMatch[1]
                .trim()
                .replace(/\n\s*/g, "");
            } else {
              const singleLineSummary = yamlNode.value.match(
                /summary:\s*['"]?([^\n'"]+)['"]?/
              );
              if (singleLineSummary) {
                file.data.summary = singleLineSummary[1].trim();
              }
            }
            // Extract learning_points (YAML list)
            const lpMatch = yamlNode.value.match(
              /learning_points:\s*\n((?:\s*-\s*.+\n?)+)/
            );
            if (lpMatch) {
              file.data.learningPoints = lpMatch[1]
                .split("\n")
                .map((l) => l.replace(/^\s*-\s*/, "").trim())
                .filter(Boolean);
            }
          }

          // Flatten directives to standard HAST nodes
          visit(
            tree,
            ["containerDirective", "leafDirective", "textDirective"],
            (node) => {
              const data = node.data || (node.data = {});
              data.hName = node.name || "div";
              data.hProperties = {};

              for (const [key, value] of Object.entries(
                node.attributes || {}
              )) {
                if (key === "class") {
                  data.hProperties.className = value.split(" ");
                } else if (key.startsWith(".")) {
                  if (!data.hProperties.className)
                    data.hProperties.className = [];
                  data.hProperties.className.push(key.slice(1));
                } else if (key === "id") {
                  data.hProperties.id = value;
                } else if (key.startsWith("#")) {
                  data.hProperties.id = key.slice(1);
                } else {
                  data.hProperties[key] = value;
                }
              }
            }
          );
        })
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeRaw)
        .use(vfmFigure)
        .use(rehypeSlug)
        .use(rehypeStringify, { allowDangerousHtml: true });

      const result = await processor.process(processedContent);

      const layout = result.data.layout || "";
      const chapterNum = result.data.chapter || "";
      const summary = result.data.summary || "";
      const learningPoints = result.data.learningPoints || [];
      let outputString = result.toString();

      // Inject chapter summary + learning points HTML after the first </h2>
      if (layout === "chapter" && (summary || learningPoints.length)) {
        let injectedHtml = "";
        if (summary) {
          injectedHtml += `<div class="chapter-summary">${summary}</div>`;
        }
        if (learningPoints.length) {
          const items = learningPoints.map((p) => `<li>${p}</li>`).join("");
          injectedHtml += `<div class="chapter-learning-points"><ul>${items}</ul></div>`;
        }
        outputString = outputString.replace(
          /<\/h2>/,
          `</h2>${injectedHtml}`
        );
      }

      // Final fallback: if output still contains :::div, the parser failed.
      outputString = outputString
        .replace(/<p>:::div\{(.+?)\}(.*?)<\/p>/gs, (match, attrs, body) => {
          let classAttr = "";
          let idAttr = "";
          const classMatch = attrs.match(/\.([\w-]+)/);
          const idMatch = attrs.match(/#([\w-]+)/);
          if (classMatch) classAttr = ` class="${classMatch[1]}"`;
          if (idMatch) idAttr = ` id="${idMatch[1]}"`;
          return `<div${idAttr}${classAttr}>${body}`;
        })
        .replace(/<p>:::<\/p>/g, "</div>")
        .replace(/(<t[dh][^>]*>)\s*:::div\{[^}]+\}\s*/g, "$1")
        .replace(/\s*:::\s*(<\/t[dh]>)/g, "$1");

      // Build stylesheet link tags from factoryOptions.style
      const styleTags = (factoryOptions.style || [])
        .map(
          (s) =>
            `<link rel="stylesheet" type="text/css" href="${encodeURI(s)}">`
        )
        .join("\n");

      const lang = factoryOptions.language || "ja";
      const title = factoryOptions.title || "";

      // Return a complete HTML document
      return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
${title ? `<title>${title}</title>` : ""}
<meta name="layout" content="${layout}">
${styleTags}
</head>
<body>
<div class="document-wrapper" data-layout="${layout}"${chapterNum ? ` data-chapter="${chapterNum}"` : ""}>
${outputString}
</div>
</body>
</html>`;
    },
  };
}
