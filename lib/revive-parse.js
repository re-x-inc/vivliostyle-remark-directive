import remarkBreaks from 'remark-breaks';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';

/**
 * Create Markdown AST parsers with directive support.
 * @param {boolean} hardLineBreaks - Add `<br>` at the position of hard line breaks, without needing spaces.
 * @param {boolean} enableMath - Enable math syntax (not used in this simplified version).
 * @returns {Array} Array of parsers and plugins.
 */
export function reviveParse(hardLineBreaks = false, enableMath = false) {
  const plugins = [
    [remarkParse],
    [remarkGfm],
    ...(hardLineBreaks ? [[remarkBreaks]] : []),
    [remarkDirective],
    [remarkFrontmatter],
  ];
  
  return plugins;
}