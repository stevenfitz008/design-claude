import React, { useEffect, useRef } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '@/stores/canvasStore';
import { handleCropOnTransform } from '@/utils/cropUtils';

// Crop calculation function (exact copy from working test and useSimpleCrop)
const getCrop = (image: HTMLImageElement, size: { width: number; height: number }, clipPosition: string) => {
  const width = size.width;
  const height = size.height;
  const aspectRatio = width / height;

  let newWidth;
  let newHeight;

  const imageRatio = image.width / image.height;

  if (aspectRatio >= imageRatio) {
    newWidth = image.width;
    newHeight = image.width / aspectRatio;
  } else {
    newWidth = image.height * aspectRatio;
    newHeight = image.height;
  }

  let x = 0;
  let y = 0;
  if (clipPosition === 'left-top') {
    x = 0;
    y = 0;
  } else if (clipPosition === 'left-middle') {
    x = 0;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'left-bottom') {
    x = 0;
    y = image.height - newHeight;
  } else if (clipPosition === 'center-top') {
    x = (image.width - newWidth) / 2;
    y = 0;
  } else if (clipPosition === 'center-middle') {
    x = (image.width - newWidth) / 2;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'center-bottom') {
    x = (image.width - newWidth) / 2;
    y = image.height - newHeight;
  } else if (clipPosition === 'right-top') {
    x = image.width - newWidth;
    y = 0;
  } else if (clipPosition === 'right-middle') {
    x = image.width - newWidth;
    y = (image.height - newHeight) / 2;
  } else if (clipPosition === 'right-bottom') {
    x = image.width - newWidth;
    y = image.height - newHeight;
  }

  return {
    cropX: x,
    cropY: y,
    cropWidth: newWidth,
    cropHeight: newHeight,
  };
};

interface SimpleTransformerProps {
  stageRef: React.RefObject<any>;
}

const SimpleTransformer: React.FC<SimpleTransformerProps> = ({ stageRef }) => {
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const { selection, elements, updateElement } = useCanvasStore();

  useEffect(() => {
    const stage = stageRef.current;
    console.log('🔧 SimpleTransformer: useEffect called', { stage: !!stage, selection });
    if (!stage) {
      console.log('❌ SimpleTransformer: No stage found');
      return;
    }

    // Create or get the transformer
    let transformer = transformerRef.current;
    if (!transformer) {
      transformer = new Konva.Transformer({
        anchorStroke: '#48aff0',
        anchorFill: 'white', 
        anchorSize: 10,
        borderStroke: '#48aff0',
        borderStrokeWidth: 2,
        borderDash: [4, 4],
        keepRatio: false,
        ignoreStroke: true,
        boundBoxFunc: (oldBox, newBox) => {
          // Limit resize to prevent tiny elements
          if (newBox.width < 10 || newBox.height < 10) {
            return oldBox;
          }
          return newBox;
        },
      });

      // Transform event handler - Handle crop during transform (like working test)
      transformer.on('transform', () => {
        console.log('🔧 SimpleTransformer: Transform in progress');
        const nodes = transformer.nodes();
        nodes.forEach((node: any) => {
          const element = elements.find(el => el.id === node.id());
          if (element && element.type === 'image') {
            // Reset scale on transform (Konva best practice)
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.setAttrs({
              scaleX: 1,
              scaleY: 1,
              width: node.width() * scaleX,
              height: node.height() * scaleY,
            });
            
            // Reapply crop if it exists (same as working test)
            const lastCropUsed = node.getAttr('lastCropUsed');
            if (lastCropUsed) {
              // Find the stage and apply crop using the same method
              const stage = (window as any).konvaStage;
              if (stage) {
                const layers = stage.getLayers();
                const elementsLayer = layers[1];
                if (elementsLayer) {
                  const originalImage = node.image();
                  if (originalImage) {
                    // Calculate and apply crop (same as useSimpleCrop)
                    const crop = getCrop(originalImage, { width: node.width(), height: node.height() }, lastCropUsed);
                    node.setAttrs({
                      cropX: crop.cropX,
                      cropY: crop.cropY,
                      cropWidth: crop.cropWidth,
                      cropHeight: crop.cropHeight
                    });
                  }
                }
              }
            }
          }
        });
      });
      
      // Drag start event for feedback
      transformer.on('dragstart', () => {
        console.log('🔧 SimpleTransformer: Drag started');
      });

      transformer.on('transformend', () => {
        console.log('🔧 SimpleTransformer: Transform ended');
        const nodes = transformer.nodes();
        nodes.forEach((node: any) => {
          const id = node.id();
          const element = elements.find(el => el.id === id);
          if (!element) {
            console.warn('⚠️ SimpleTransformer: Element not found for node', id);
            return;
          }

          // Get current transform values
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const newWidth = Math.max(5, node.width() * scaleX);
          const newHeight = Math.max(5, node.height() * scaleY);

          console.log('🔧 SimpleTransformer: Updating element', { 
            id, 
            type: element.type,
            oldWidth: element.width,
            oldHeight: element.height,
            newWidth, 
            newHeight,
            scaleX,
            scaleY 
          });

          // Update element in store
          updateElement(id, {
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation()
          });

          // Reset scale to 1 to avoid cumulative scaling
          node.scaleX(1);
          node.scaleY(1);
          node.width(newWidth);
          node.height(newHeight);

          // Handle crop for image elements during transform
          if (element.type === 'image' && element.cropData) {
            try {
              handleCropOnTransform(node);
            } catch (error) {
              console.warn('⚠️ SimpleTransformer: Error handling crop on transform', error);
            }
          }
        });
      });

      // Add transformer to the same layer as the elements (layer 1) for better interaction
      const layers = stage.getLayers();
      const elementsLayer = layers[1]; // Get the elements layer (index 1)
      console.log('🔧 SimpleTransformer: Adding transformer to elements layer', { 
        totalLayers: layers.length, 
        elementsLayer: !!elementsLayer,
        layerIndex: 1 
      });
      
      if (elementsLayer) {
        elementsLayer.add(transformer);
        // Move transformer to top to ensure it's above all images
        transformer.moveToTop();
        console.log('✅ SimpleTransformer: Added transformer to elements layer and moved to top');
      } else {
        console.error('❌ SimpleTransformer: Elements layer not found at index 1');
      }

      transformerRef.current = transformer;
    }

    if (selection.length === 0) {
      console.log('🔧 SimpleTransformer: No selection, clearing transformer');
      transformer.nodes([]);
      return;
    }

    console.log('🔧 SimpleTransformer: Processing selection', { selectionLength: selection.length, selection });

    // Find the selected nodes in the elements layer (second layer - index 1)
    const layers = stage.getLayers();
    const elementsLayer = layers[1]; // Get the elements layer (index 1)
    console.log('🔧 SimpleTransformer: Layer info', { 
      totalLayers: layers.length, 
      elementsLayer: !!elementsLayer,
      layerIndex: 1 
    });
    
    if (!elementsLayer) {
      console.error('❌ SimpleTransformer: No elements layer found at index 1');
      return;
    }
    
    const selectedNodes = selection.map(id => {
      const node = elementsLayer.findOne(`#${id}`);
      console.log(`🔧 SimpleTransformer: Looking for node #${id}`, { 
        found: !!node,
        nodeClass: node?.getClassName(),
        nodeType: node?.getType() 
      });
      return node;
    }).filter(node => node);
    
    console.log('🔧 SimpleTransformer: Found nodes', { selectedNodesCount: selectedNodes.length });
    
    if (selectedNodes.length === 0) {
      console.log('❌ SimpleTransformer: No nodes found for selection');
      return;
    }

    // Check element types in selection
    const selectedElements = selection.map(id => elements.find(el => el.id === id)).filter(Boolean);
    const hasOnlyTextElements = selectedElements.length > 0 && selectedElements.every(el => el?.type === 'text');
    const hasOnlyImageElements = selectedElements.length > 0 && selectedElements.every(el => el?.type === 'image');

    // Configure transformer based on element types
    if (hasOnlyTextElements) {
      // Text elements: horizontal resize only
      transformer.enabledAnchors(['middle-left', 'middle-right']);
      transformer.rotateEnabled(false);
      transformer.keepRatio(false);
    } else if (hasOnlyImageElements) {
      // Image elements: enable all resize handles and rotation
      transformer.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']);
      transformer.rotateEnabled(selection.length === 1);
      transformer.keepRatio(false); // Allow free resize for images
    } else {
      // Other elements (shapes, etc.): full resize capabilities  
      transformer.enabledAnchors(['top-left', 'top-center', 'top-right', 'middle-right', 'bottom-right', 'bottom-center', 'bottom-left', 'middle-left']);
      transformer.rotateEnabled(selection.length === 1);
      transformer.keepRatio(false);
    }

    // Attach nodes to transformer
    console.log('🔧 SimpleTransformer: Attaching nodes to transformer', { nodeCount: selectedNodes.length });
    transformer.nodes(selectedNodes);
    
    // Move transformer to top to ensure handles are always visible above images
    transformer.moveToTop();
    
    // Enable transformer interaction
    transformer.listening(true);
    
    console.log('✅ SimpleTransformer: Transform setup complete', { 
      nodeCount: transformer.nodes().length,
      listening: transformer.listening()
    });
  }, [selection, elements, stageRef, updateElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transformerRef.current) {
        transformerRef.current.destroy();
        transformerRef.current = null;
      }
    };
  }, []);

  return null; // This component doesn't render anything directly
};

export default SimpleTransformer;