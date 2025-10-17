export interface HighlightedText {
  text: string;
  type?: "grammar" | "style" | "clarity" | "structure" | "error";
  correctionId?: string;
  startIndex: number;
  endIndex: number;
}

export interface AnalysisStats {
  errors: number;
  grammar: number;
  style: number;
  clarity: number;
  structure: number;
}
