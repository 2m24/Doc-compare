import React, { useEffect, useRef } from 'react';
import { renderHtmlDifferences } from '../utils/textComparison';

const DocumentPreview = ({ document, diffs, title, containerId }) => {
  const contentRef = useRef(null);
  const containerRef = useRef(null);

  const content = diffs ? renderHtmlDifferences(diffs) : document.originalHtmlContent;

  // Enhanced scroll synchronization between containers
  useEffect(() => {
    if (!containerRef.current || !containerId) return;

    const container = containerRef.current;
    let isSyncing = false;

    const handleScroll = () => {
      if (isSyncing) return;
      
      const sourceContainer = container;
      const sourceId = sourceContainer.id;
      
      // Determine the target container ID
      const targetId = sourceId.includes('left') 
        ? sourceId.replace('left', 'right') 
        : sourceId.replace('right', 'left');
      const targetContainer = document.getElementById(targetId);
      
      if (targetContainer && targetContainer !== sourceContainer) {
        // Calculate scroll ratio
        const sourceMaxScroll = Math.max(1, sourceContainer.scrollHeight - sourceContainer.clientHeight);
        const targetMaxScroll = Math.max(1, targetContainer.scrollHeight - targetContainer.clientHeight);
        
        const scrollRatio = sourceContainer.scrollTop / sourceMaxScroll;
        const targetScrollTop = Math.round(targetMaxScroll * scrollRatio);
        
        // Prevent infinite loop
        isSyncing = true;
        targetContainer.scrollTop = targetScrollTop;
        
        // Reset flag after a short delay
        setTimeout(() => {
          isSyncing = false;
        }, 50);
      }
    };

    // Handle mouse wheel scrolling
    const handleWheel = (e) => {
      if (isSyncing) return;
      
      e.preventDefault();
      
      const sourceContainer = container;
      const sourceId = sourceContainer.id;
      
      // Determine the target container ID
      const targetId = sourceId.includes('left') 
        ? sourceId.replace('left', 'right') 
        : sourceId.replace('right', 'left');
      const targetContainer = document.getElementById(targetId);
      
      // Calculate new scroll position
      const delta = e.deltaY;
      const newScrollTop = Math.max(0, Math.min(
        sourceContainer.scrollHeight - sourceContainer.clientHeight,
        sourceContainer.scrollTop + delta
      ));
      
      // Apply scroll to both containers
      if (targetContainer) {
        const sourceMaxScroll = Math.max(1, sourceContainer.scrollHeight - sourceContainer.clientHeight);
        const targetMaxScroll = Math.max(1, targetContainer.scrollHeight - targetContainer.clientHeight);
        
        const scrollRatio = newScrollTop / sourceMaxScroll;
        const targetScrollTop = Math.round(targetMaxScroll * scrollRatio);
        
        isSyncing = true;
        sourceContainer.scrollTop = newScrollTop;
        targetContainer.scrollTop = targetScrollTop;
        
        setTimeout(() => {
          isSyncing = false;
        }, 50);
      }
    };

    // Handle drag scrolling
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      startY = e.clientY;
      startScrollTop = container.scrollTop;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };

    const handleMouseMove = (e) => {
      if (!isDragging || isSyncing) return;
      
      e.preventDefault();
      
      const deltaY = startY - e.clientY;
      const newScrollTop = Math.max(0, Math.min(
        container.scrollHeight - container.clientHeight,
        startScrollTop + deltaY
      ));
      
      const sourceId = container.id;
      const targetId = sourceId.includes('left') 
        ? sourceId.replace('left', 'right') 
        : sourceId.replace('right', 'left');
      const targetContainer = document.getElementById(targetId);
      
      if (targetContainer) {
        const sourceMaxScroll = Math.max(1, container.scrollHeight - container.clientHeight);
        const targetMaxScroll = Math.max(1, targetContainer.scrollHeight - targetContainer.clientHeight);
        
        const scrollRatio = newScrollTop / sourceMaxScroll;
        const targetScrollTop = Math.round(targetMaxScroll * scrollRatio);
        
        isSyncing = true;
        container.scrollTop = newScrollTop;
        targetContainer.scrollTop = targetScrollTop;
        
        setTimeout(() => {
          isSyncing = false;
        }, 50);
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'default';
      container.style.userSelect = 'auto';
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerId]);

  // Enhanced content scaling and height management
  useEffect(() => {
    if (!contentRef.current || !containerRef.current || !content) return;

    const adjustScale = () => {
      try {
        const contentElement = contentRef.current;
        const container = containerRef.current;
        
        if (!contentElement || !container) return;
        
        // Reset transform to measure natural size
        contentElement.style.transform = 'none';
        contentElement.style.width = 'auto';
        contentElement.style.height = 'auto';
        
        // Measure content and container
        const contentWidth = contentElement.scrollWidth;
        const containerWidth = container.clientWidth - 32; // Account for padding
        
        // Set minimum height to match container height
        const containerHeight = container.clientHeight - 32; // Account for padding
        const contentHeight = contentElement.scrollHeight;
        
        if (contentWidth > containerWidth) {
          const scale = containerWidth / contentWidth;
          contentElement.style.transform = `scale(${scale})`;
          contentElement.style.transformOrigin = 'top left';
          contentElement.style.width = `${100 / scale}%`;
          
          // Ensure scaled content maintains proper height
          const scaledHeight = Math.max(contentHeight * scale, containerHeight);
          contentElement.style.height = `${contentHeight}px`;
          contentElement.style.minHeight = `${containerHeight / scale}px`;
        } else {
          contentElement.style.transform = 'none';
          contentElement.style.width = '100%';
          contentElement.style.height = 'auto';
          contentElement.style.minHeight = `${containerHeight}px`;
        }
      } catch (error) {
        console.warn('Error adjusting document scale:', error);
      }
    };

    // Adjust scale after content loads and on resize
    const timer = setTimeout(adjustScale, 200);
    
    const resizeObserver = new ResizeObserver(adjustScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [content]);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ height: '100%' }}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"></div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 truncate">
              {title}
            </h3>
            <p className="text-sm text-gray-600 truncate mt-0.5" title={document.name}>
              📄 {document.name}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div 
        className="flex-1 overflow-auto bg-white select-none" 
        id={containerId} 
        ref={containerRef}
        style={{ 
          scrollBehavior: 'smooth',
          height: 'calc(100% - 80px)', // Account for header height
          cursor: 'grab'
        }}
      >
        <div className="p-4">
          <div 
            ref={contentRef}
            className="word-document-preview bg-white shadow-sm border border-gray-100 rounded-lg p-6 select-text"
            dangerouslySetInnerHTML={{ __html: content || '' }}
            style={{ 
              transition: 'transform 0.2s ease-out',
              cursor: 'auto'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;