# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vivliostyle project demonstrating remark-containers integration for document generation from Markdown. The project converts Markdown files with custom directive containers (like `:::div{.note}`) into styled HTML and PDF documents using Vivliostyle.

## Key Commands

```bash
# Preview document with live reload
npm run preview

# Build HTML and PDF outputs
npm run build

# Generate PDF only
npm run pdf

# Test document processor directly
node test-processor.js

# Debug directive parsing (development utility)
node debug-directive.js
```

## Architecture

### Core Components

- **`document-processor.js`**: Main unified processor pipeline that handles Markdown → HTML transformation
  - Uses remark-directive for `:::div{.class}` syntax
  - Integrates VFM figure plugin for image handling
  - Handles frontmatter and line breaks
  - Custom `directiveHandler()` converts container directives to HTML divs

- **`vivliostyle.config.js`**: Vivliostyle configuration
  - Defines document metadata (title, author, language)
  - Sets A4 page size and CSS theme
  - Configures input/output paths
  - Integrates document processor

- **`theme.css`**: Complete CSS theme for print and screen
  - Page setup for A4 with headers/footers
  - Container styles for .note, .warning, .tip, .info, .caution, .important, .danger
  - Typography optimized for Japanese text
  - Print-specific styles for page breaks

### Container System

The project uses remark-directive syntax for styled containers:

```markdown
:::div{.note}
Content here
:::
```

Supported container classes: `note`, `warning`, `tip`, `info`, `caution`, `important`, `danger`, `custom`

Each container gets automatic icons and styling via CSS pseudo-elements.

### File Structure

- `sample/sample.md` - Source document with directive examples
- `output.html/` - Generated HTML output with assets
- `output.pdf` - Generated PDF document
- Test files: `test-processor.js`, `debug-directive.js`

## Development Notes

- Project uses ES modules (`"type": "module"`)
- Japanese language default with Noto Sans JP font stack
- Unified processor pipeline handles: parse → directive → rehype → stringify
- VFM integration for enhanced figure handling
- Print-optimized with page break controls

## Testing Strategy

Use `test-processor.js` to verify document processor functionality with sample Markdown containing directive containers. The debug utility helps troubleshoot directive parsing issues.