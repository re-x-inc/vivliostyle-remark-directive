import documentProcessor from './document-processor-vfm-exact.js';

const testMarkdown = `---
title: Test Document
author: Test User
date: 2024-01-15
---

# Test Heading

This is a test paragraph.

:::div{.note}
This is a note.
:::
`;

async function test() {
  console.log('Testing document processor with frontmatter...\n');
  
  const processor = documentProcessor({}, {});
  
  try {
    const result = await processor.process(testMarkdown);
    
    console.log('\n=== Result ===');
    console.log('Has contents:', !!result.contents);
    console.log('Has value:', !!result.value);
    
    const output = result.contents || result.value;
    
    console.log('\n=== Output Preview ===');
    console.log(output.substring(0, 500) + '...');
    
    console.log('\n=== Checks ===');
    console.log('Contains <title>:', output.includes('<title>'));
    console.log('Contains Test Document in title:', output.includes('<title>') && output.includes('Test Document'));
    console.log('Contains <div class="note">:', output.includes('<div class="note">'));
    console.log('Contains frontmatter as content:', output.includes('title: Test Document'));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();