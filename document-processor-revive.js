import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { reviveParse } from './lib/revive-parse.js';
import { reviveRehype } from './lib/revive-rehype.js';

/**
 * Directive handler plugin
 * Transforms containerDirective nodes (:::div{.class}) into HTML div elements
 */
function directiveHandler() {
  return function transformer(tree) {
    console.log('\n🔄 directiveHandler transformer called');
    
    visit(tree, 'containerDirective', (node) => {
      console.log('\n📦 Found containerDirective:', {
        name: node.name,
        attributes: node.attributes,
        children: node.children?.length || 0
      });
      
      if (node.name === 'div' && node.attributes && node.attributes.class) {
        const className = node.attributes.class;
        console.log(`  → Converting to HTML div with class: ${className}`);
        
        node.data = {
          hName: 'div',
          hProperties: {
            className: [className]
          }
        };
      }
    });
    
    return tree;
  };
}

/**
 * Document processor using revive-parse and revive-rehype
 * @param {Object} options - Processor options
 * @param {Object} metadata - Document metadata
 * @returns {Object} Processor object with process method
 */
export default function documentProcessorRevive(options = {}, metadata = {}) {
  console.log('\n🔧 documentProcessorRevive called:', { options, metadata });
  
  // Build the processor with revive plugins
  const processor = unified();
  
  // Apply reviveParse plugins
  const parsePlugins = reviveParse(true); // Enable hard line breaks
  parsePlugins.forEach(plugin => {
    if (Array.isArray(plugin)) {
      processor.use(...plugin);
    } else {
      processor.use(plugin);
    }
  });
  
  // Add our directive handler
  processor.use(directiveHandler);
  
  // Apply reviveRehype plugins
  reviveRehype.forEach(plugin => {
    if (Array.isArray(plugin)) {
      processor.use(...plugin);
    } else {
      processor.use(plugin);
    }
  });
  
  // Return wrapped processor
  return {
    ...processor,
    process: async function(file) {
      console.log('\n📝 Processor.process() called');
      console.log('Input type:', typeof file);
      console.log('Input preview:', typeof file === 'string' ? file.substring(0, 100) + '...' : 'VFile object');
      
      try {
        const startTime = Date.now();
        const result = await processor.process(file);
        const endTime = Date.now();
        
        console.log('\n✅ Processing complete:', {
          duration: `${endTime - startTime}ms`,
          outputLength: result.toString().length,
          outputPreview: result.toString().substring(0, 100) + '...'
        });
        
        return result;
      } catch (error) {
        console.error('\n❌ Processing error:', error);
        throw error;
      }
    },
    
    processSync: function(file) {
      console.log('\n📝 Processor.processSync() called');
      
      try {
        const result = processor.processSync(file);
        console.log('✅ Sync processing complete');
        return result;
      } catch (error) {
        console.error('\n❌ Sync processing error:', error);
        throw error;
      }
    }
  };
}