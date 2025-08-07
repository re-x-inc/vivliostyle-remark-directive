import { VFM, readMetadata } from '@vivliostyle/vfm';

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
`;

async function test() {
  console.log('Testing VFM metadata extraction...\n');
  
  // Step 1: Extract metadata from markdown
  const metadata = readMetadata(testMarkdown);
  console.log('=== Extracted Metadata ===');
  console.log(JSON.stringify(metadata, null, 2));
  
  // Step 2: Process with VFM using metadata
  const vfm = VFM({ partial: false }, metadata);
  const result = await vfm.process(testMarkdown);
  
  const output = result.contents || result.value;
  
  console.log('\n=== Output Preview ===');
  console.log(output.substring(0, 600) + '...');
  
  console.log('\n=== Checks ===');
  console.log('Has <html lang="ja">:', output.includes('<html lang="ja">'));
  console.log('Has <title>Test Document</title>:', output.includes('<title>Test Document</title>'));
  console.log('Has <meta name="author" content="Test User">:', output.includes('<meta name="author" content="Test User">'));
  console.log('Has <meta name="description":', output.includes('<meta name="description"'));
  console.log('Has <meta name="keywords":', output.includes('<meta name="keywords"'));
}

test();