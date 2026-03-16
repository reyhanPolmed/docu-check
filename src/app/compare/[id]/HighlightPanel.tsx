"use client";

import { useMemo } from "react";

interface HighlightPanelProps {
  content: string;
  ranges: [number, number][]; // Array of [startOrig, endOrig]
}

export default function HighlightPanel({ content, ranges }: HighlightPanelProps) {
  // Sort ranges to process text linearly
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);

  // Construct text chunks (highlighted vs normal)
  const renderContent = useMemo(() => {
    if (ranges.length === 0) {
      return <span>{content}</span>;
    }

    const result = [];
    let currentIndex = 0;

    for (let i = 0; i < sortedRanges.length; i++) {
      const [start, end] = sortedRanges[i];

      // Add normal text before the highlight
      if (start > currentIndex) {
        result.push(
          <span key={`text-${i}`}>
            {content.substring(currentIndex, start)}
          </span>
        );
      }

      // Add highlighted text
      // We take max to prevent negative slicing if ranges overlap weirdly
      if (end >= start && end > currentIndex) {
        const actualStart = Math.max(start, currentIndex);
        // +1 because end is inclusive in our generator
        const sliceEnd = Math.min(end + 1, content.length);
        
        if (sliceEnd > actualStart) {
          result.push(
            <mark key={`mark-${i}`} className="highlight">
              {content.substring(actualStart, sliceEnd)}
            </mark>
          );
          currentIndex = sliceEnd;
        }
      }
    }

    // Add remaining text
    if (currentIndex < content.length) {
      result.push(
        <span key="text-end">
          {content.substring(currentIndex)}
        </span>
      );
    }

    return result;
  }, [content, sortedRanges, ranges.length]);

  return <div style={{ whiteSpace: 'pre-wrap' }}>{renderContent}</div>;
}
