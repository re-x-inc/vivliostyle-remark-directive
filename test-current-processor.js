import documentProcessor from './document-processor.js';

async function test() {
  console.log('🧪 Testing current document processor...\n');
  
  const markdown = `---
title: Test Document
author: Test Author
---

# Test Heading

This is a test paragraph.

:::div{.note}
This is a note container.
:::

:::div{.warning}
This is a warning container.
:::
`;

  try {
    const processor = documentProcessor();
    const result = await processor.process(markdown);
    
    console.log('\n✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();