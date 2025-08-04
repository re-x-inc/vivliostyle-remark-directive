import documentProcessorRevive from './document-processor-revive.js';

const testMarkdown = `# Test Document

This is a test paragraph with **bold** and *italic* text.

:::div{.note}
This is a note container using directive syntax.
It should be converted to a div with class="note".
:::

:::div{.warning}
This is a warning container.
Multiple paragraphs are supported.

- Item 1
- Item 2
:::

## Code Example

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

:::div{.tip}
**Tip:** You can use Markdown inside containers too!
:::
`;

async function test() {
  console.log('Testing documentProcessorRevive...\n');
  console.log('Input Markdown:');
  console.log('─'.repeat(50));
  console.log(testMarkdown);
  console.log('─'.repeat(50));
  
  try {
    const processor = documentProcessorRevive();
    const result = await processor.process(testMarkdown);
    
    console.log('\n\nOutput HTML:');
    console.log('═'.repeat(50));
    console.log(result.toString());
    console.log('═'.repeat(50));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();