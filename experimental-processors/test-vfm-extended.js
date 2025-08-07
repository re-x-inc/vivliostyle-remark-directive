import documentProcessor from './document-processor-vfm-wrapper.js';
import fs from 'fs';

const testMarkdown = `---
title: Test Document
---

# Test VFM Extended

This is a test of the VFM extended processor.

:::div{.note}
This is a note container using remark-directive.
:::

:::div{.warning}
This is a warning message.
:::

Regular paragraph.

## VFM Features

**Bold text** and *italic text*.

![Image test](test.png)

This should preserve VFM figure handling.
`;

async function test() {
  console.log('Testing VFM extended processor...\n');
  
  const processor = documentProcessor();
  
  try {
    const result = await processor.process(testMarkdown);
    
    console.log('Result type:', typeof result);
    console.log('Has contents:', !!result.contents);
    console.log('Has value:', !!result.value);
    
    const output = result.contents || result.value || result.toString();
    
    // Check for directive conversion
    console.log('\nDirective conversions:');
    console.log('- Contains <div class="note">:', output.includes('<div class="note">'));
    console.log('- Contains <div class="warning">:', output.includes('<div class="warning">'));
    
    // Check for VFM features
    console.log('\nVFM features:');
    console.log('- Contains <figure>:', output.includes('<figure>'));
    console.log('- Contains <strong>:', output.includes('<strong>'));
    console.log('- Contains <em>:', output.includes('<em>'));
    
    // Write output for inspection
    fs.writeFileSync('test-vfm-extended-output.html', output);
    console.log('\nOutput written to test-vfm-extended-output.html');
    
    // Show a snippet
    console.log('\nOutput snippet:');
    const snippet = output.substring(0, 500);
    console.log(snippet + '...');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();