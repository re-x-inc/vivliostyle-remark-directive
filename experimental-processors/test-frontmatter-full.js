import documentProcessor from './document-processor-vfm-exact.js';

const testMarkdown = `---
title: Test Document
author: Test User
date: 2024-01-15
lang: ja
description: This is a test document
keywords: [test, vivliostyle, vfm]
---

# Test Heading

This is a test paragraph.

:::div{.note}
This is a note.
:::
`;

async function test() {
  console.log('Testing document processor with full document output...\n');
  
  // partial: false で完全なHTMLドキュメントを生成
  const processor = documentProcessor({ 
    partial: false,
    title: 'Default Title',  // フロントマターで上書きされるはず
    language: 'en'          // フロントマターで上書きされるはず
  }, {});
  
  try {
    const result = await processor.process(testMarkdown);
    
    console.log('\n=== Result ===');
    console.log('Has contents:', !!result.contents);
    console.log('Has value:', !!result.value);
    
    const output = result.contents || result.value;
    
    console.log('\n=== Output Preview ===');
    console.log(output.substring(0, 800) + '...');
    
    console.log('\n=== Checks ===');
    console.log('Has <!doctype html>:', output.includes('<!doctype html>'));
    console.log('Has <html lang="ja">:', output.includes('<html lang="ja">'));
    console.log('Has <title>Test Document</title>:', output.includes('<title>Test Document</title>'));
    console.log('Has <meta name="author":', output.includes('<meta name="author"'));
    console.log('Has <meta name="description":', output.includes('<meta name="description"'));
    console.log('Has <meta name="keywords":', output.includes('<meta name="keywords"'));
    console.log('Contains <div class="note">:', output.includes('<div class="note">'));
    console.log('Contains frontmatter as content:', output.includes('title: Test Document'));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();