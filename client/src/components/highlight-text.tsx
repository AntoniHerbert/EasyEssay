import { type Correction } from "@shared/schema";
import { type HighlightedText } from "@/types/analysis";

interface HighlightTextProps {
  text: string;
  corrections: Correction[];
  onCorrectionClick?: (correction: Correction) => void;
}

export function HighlightText({ text, corrections, onCorrectionClick }: HighlightTextProps) {
  if (corrections.length === 0) {
    return <div className="prose prose-lg max-w-none leading-relaxed">{text}</div>;
  }

  const sortedCorrections = [...corrections].sort((a, b) => a.startIndex - b.startIndex);
  
  const segments: Array<{ text: string; correction?: Correction }> = [];
  let lastIndex = 0;

  sortedCorrections.forEach((correction) => {
    if (correction.startIndex > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, correction.startIndex)
      });
    }

    segments.push({
      text: text.slice(correction.startIndex, correction.endIndex),
      correction
    });

    lastIndex = correction.endIndex;
  });

  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex)
    });
  }

  const getHighlightClass = (type: string, severity: string) => {
    const baseClasses = "cursor-pointer transition-colors";
    
    switch (type) {
      case "grammar":
        return `${baseClasses} grammar-highlight`;
      case "style":
        return `${baseClasses} style-highlight`;
      case "clarity":
        return `${baseClasses} clarity-highlight`;
      case "structure":
        return `${baseClasses} error-highlight`;
      default:
        return severity === "error" 
          ? `${baseClasses} error-highlight`
          : `${baseClasses} grammar-highlight`;
    }
  };

  return (
    <div className="prose prose-lg max-w-none leading-relaxed">
      {segments.map((segment, index) => (
        <span key={index}>
          {segment.correction ? (
            <span
              className={getHighlightClass(segment.correction.type, segment.correction.severity)}
              title={segment.correction.explanation}
              onClick={() => onCorrectionClick?.(segment.correction!)}
              data-testid={`highlight-${segment.correction.type}-${index}`}
            >
              {segment.text}
            </span>
          ) : (
            segment.text
          )}
        </span>
      ))}
    </div>
  );
}
