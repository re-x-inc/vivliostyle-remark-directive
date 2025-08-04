import documentProcessorRevive from './document-processor-revive.js';

export default {
  title: 'Vivliostyle Remark Directive Sample (Revive)',
  author: 'Your Name',
  language: 'ja',
  
  theme: 'theme.css',
  
  size: 'A4',
  
  entry: [
    {
      path: 'sample/sample.md',
      preprocessor: documentProcessorRevive,
    }
  ],
  
  output: [
    'output.html',
    'output.pdf'
  ]
};