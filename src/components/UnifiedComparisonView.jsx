import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, RotateCcw, Eye, EyeOff } from 'lucide-react';

const UnifiedComparisonView = ({ comparison, leftDocument, rightDocument }) => {
  const containerRef = useRef(null);
  const [currentChange, setCurrentChange] = useState(0);
  const [showUnchanged, setShowUnchanged] = useState(true);
  const [unifiedContent, setUnifiedContent] = useState([]);

  // Create unified content from comparison data
  const createUnifiedContent = useCallback(() => {
    if (!comparison || !leftDocument || !rightDocument) return [];

    const unified = [];
    const maxLength = Math.max(
      comparison.leftDiffs?.length || 0,
      comparison.rightDiffs?.length || 0
    );

    for (let i = 0; i < maxLength; i++) {
      const leftDiff = comparison.leftDiffs?.[i];
      const rightDiff = comparison.rightDiffs?.[i];

      // Determine the change type and content
      if (leftDiff && rightDiff) {
        if (leftDiff.type === 'unchanged' && rightDiff.type === 'unchanged') {
          // Unchanged content - show original
          if (showUnchanged) {
            unified.push({
              id: `unchanged-${i}`,
              type: 'unchanged',
              content: leftDiff.content || rightDiff.content,
              leftLineNumber: leftDiff.lineNumber,
              rightLineNumber: rightDiff.lineNumber,
              index: i
            });
          }
        } else if (leftDiff.type === 'removed' && rightDiff.type === 'added') {
          // Modified content - show both old and new
          unified.push({
            id: `modified-${i}`,
            type: 'modified',
            oldContent: leftDiff.content,
            newContent: rightDiff.content,
            leftLineNumber: leftDiff.lineNumber,
            rightLineNumber: rightDiff.lineNumber,
            index: i
          });
        } else if (leftDiff.type === 'removed' && rightDiff.type === 'empty') {
          // Deleted content
          unified.push({
            id: `removed-${i}`,
            type: 'removed',
            content: leftDiff.content,
            leftLineNumber: leftDiff.lineNumber,
            rightLineNumber: null,
            index: i
          });
        } else if (leftDiff.type === 'empty' && rightDiff.type === 'added') {
          // Added content
          unified.push({
            id: `added-${i}`,
            type: 'added',
            content: rightDiff.content,
            leftLineNumber: null,
            rightLineNumber: rightDiff.lineNumber,
            index: i
          });
        }
      } else if (leftDiff && leftDiff.type === 'removed') {
        // Only left content (removed)
        unified.push({
          id: `removed-${i}`,
          type: 'removed',
          content: leftDiff.content,
          leftLineNumber: leftDiff.lineNumber,
          rightLineNumber: null,
          index: i
        });
      } else if (rightDiff && rightDiff.type === 'added') {
        // Only right content (added)
        unified.push({
          id: `added-${i}`,
          type: 'added',
          content: rightDiff.content,
          leftLineNumber: null,
          rightLineNumber: rightDiff.lineNumber,
          index: i
        });
      }
    }

    return unified;
  }, [comparison, leftDocument, rightDocument, showUnchanged]);

  // Update unified content when dependencies change
  useEffect(() => {
    setUnifiedContent(createUnifiedContent());
  }, [createUnifiedContent]);

  // Get all changes (non-unchanged items)
  const changes = unifiedContent.filter(item => item.type !== 'unchanged');

  // Navigation functions
  const navigateToNext = useCallback(() => {
    if (changes.length === 0) return;
    
    const nextIndex = (currentChange + 1) % changes.length;
    setCurrentChange(nextIndex);
    
    const targetElement = document.getElementById(changes[nextIndex].id);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the element
      highlightElement(targetElement);
    }
  }, [changes, currentChange]);

  const navigateToPrevious = useCallback(() => {
    if (changes.length === 0) return;
    
    const prevIndex = currentChange === 0 ? changes.length - 1 : currentChange - 1;
    setCurrentChange(prevIndex);
    
    const targetElement = document.getElementById(changes[prevIndex].id);
    if (targetElement) {
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the element
      highlightElement(targetElement);
    }
  }, [changes, currentChange]);

  const resetView = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentChange(0);
    }
  }, []);

  // Highlight element temporarily
  const highlightElement = (element) => {
    const originalBoxShadow = element.style.boxShadow;
    const originalTransition = element.style.transition;
    
    element.style.transition = 'box-shadow 0.3s ease';
    element.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.3)';
    
    setTimeout(() => {
      element.style.boxShadow = originalBoxShadow;
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 300);
    }, 1500);
  };

  // Render content based on type
  const renderUnifiedItem = (item) => {
    const baseClasses = "unified-item border-l-4 p-4 mb-2 rounded-r-lg transition-all duration-200";
    
    switch (item.type) {
      case 'unchanged':
        return (
          <div
            key={item.id}
            id={item.id}
            className={`${baseClasses} border-l-gray-300 bg-gray-50/30 hover:bg-gray-50`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 font-mono">
                L{item.leftLineNumber} | R{item.rightLineNumber}
              </span>
            </div>
            <div 
              className="word-document-preview text-sm"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        );

      case 'added':
        return (
          <div
            key={item.id}
            id={item.id}
            className={`${baseClasses} border-l-green-500 bg-green-50 hover:bg-green-100`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-green-700 font-semibold">+ ADDED</span>
              <span className="text-xs text-gray-500 font-mono">
                R{item.rightLineNumber}
              </span>
            </div>
            <div 
              className="word-document-preview text-sm"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        );

      case 'removed':
        return (
          <div
            key={item.id}
            id={item.id}
            className={`${baseClasses} border-l-red-500 bg-red-50 hover:bg-red-100`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-red-700 font-semibold">- REMOVED</span>
              <span className="text-xs text-gray-500 font-mono">
                L{item.leftLineNumber}
              </span>
            </div>
            <div 
              className="word-document-preview text-sm opacity-75 line-through"
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
          </div>
        );

      case 'modified':
        return (
          <div
            key={item.id}
            id={item.id}
            className={`${baseClasses} border-l-yellow-500 bg-yellow-50 hover:bg-yellow-100`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-yellow-700 font-semibold">~ MODIFIED</span>
              <span className="text-xs text-gray-500 font-mono">
                L{item.leftLineNumber} → R{item.rightLineNumber}
              </span>
            </div>
            
            {/* Old content */}
            <div className="mb-3">
              <div className="text-xs text-red-600 font-medium mb-1">Before:</div>
              <div 
                className="word-document-preview text-sm bg-red-100 p-2 rounded border-l-2 border-red-300 opacity-75 line-through"
                dangerouslySetInnerHTML={{ __html: item.oldContent }}
              />
            </div>
            
            {/* New content */}
            <div>
              <div className="text-xs text-green-600 font-medium mb-1">After:</div>
              <div 
                className="word-document-preview text-sm bg-green-100 p-2 rounded border-l-2 border-green-300"
                dangerouslySetInnerHTML={{ __html: item.newContent }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!comparison || !leftDocument || !rightDocument) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No comparison data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header with controls */}
      <div className="border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-sm"></div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Unified Comparison View
              </h3>
              <p className="text-sm text-gray-600">
                {leftDocument.name} ↔ {rightDocument.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle unchanged content */}
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showUnchanged 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={showUnchanged ? 'Hide unchanged content' : 'Show unchanged content'}
            >
              {showUnchanged ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showUnchanged ? 'Hide' : 'Show'} Unchanged
            </button>
            
            {/* Navigation controls */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={navigateToPrevious}
                disabled={changes.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous change"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-500 min-w-[50px] text-center px-2">
                {changes.length > 0 ? `${currentChange + 1}/${changes.length}` : '0/0'}
              </span>
              <button
                onClick={navigateToNext}
                disabled={changes.length === 0}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next change"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button
                onClick={resetView}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
                title="Reset to top"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-gray-700">
              {unifiedContent.filter(item => item.type === 'added').length} additions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-gray-700">
              {unifiedContent.filter(item => item.type === 'removed').length} deletions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span className="text-gray-700">
              {unifiedContent.filter(item => item.type === 'modified').length} modifications
            </span>
          </div>
          {showUnchanged && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-sm"></div>
              <span className="text-gray-700">
                {unifiedContent.filter(item => item.type === 'unchanged').length} unchanged
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unified content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {unifiedContent.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-lg font-medium">No changes to display</p>
              <p className="text-sm">The documents appear to be identical</p>
            </div>
          </div>
        ) : (
          unifiedContent.map(renderUnifiedItem)
        )}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs font-medium text-gray-600 mb-2">Legend</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
            <span className="text-gray-600">Added content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
            <span className="text-gray-600">Removed content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-yellow-500 rounded-sm"></div>
            <span className="text-gray-600">Modified content</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-2 bg-gray-400 rounded-sm"></div>
            <span className="text-gray-600">Unchanged content</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedComparisonView;