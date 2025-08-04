import rehypeRaw from 'rehype-raw';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import vfmFigure from '@vivliostyle/vfm/lib/plugins/figure.js';

const figureHast = vfmFigure.hast || vfmFigure.figureHast || vfmFigure;

/**
 * Create Hypertext AST handlers and transformers.
 * @returns {Array} Array of handlers and transformers.
 */
export const reviveRehype = [
  [
    remarkRehype,
    {
      allowDangerousHtml: true,
    },
  ],
  rehypeRaw,
  figureHast,
  rehypeStringify,
];