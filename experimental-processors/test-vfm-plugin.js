import documentProcessor from './document-processor-vfm-plugin.js';
import fs from 'fs/promises';

async function test() {
  console.log('🧪 Testing VFM plugin processor...\n');
  
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

![Test Image](test.png)
`;

  try {
    const processor = documentProcessor();
    console.log('✅ Processor created successfully\n');
    
    const result = await processor.process(markdown);
    console.log('✅ Processing completed\n');
    
    console.log('📄 Output HTML:');
    console.log('================');
    console.log(result.toString());
    console.log('================\n');
    
    // Check for expected content
    const html = result.toString();
    console.log('🔍 Content checks:');
    console.log('- Contains <div class="note">:', html.includes('<div class="note">'));
    console.log('- Contains <div class="warning">:', html.includes('<div class="warning">'));
    console.log('- Contains <figure>:', html.includes('<figure>'));
    console.log('- Contains frontmatter data:', html.includes('Test Document') || html.includes('Test Author'));
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
  }
}

test();