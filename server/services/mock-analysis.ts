import { type CorrectionObject } from '@shared/schema';

interface AIReviewResult {
  grammarScore: number;
  styleScore: number;
  clarityScore: number;
  structureScore: number;
  contentScore: number;
  researchScore: number;
  overallScore: number;
  corrections: CorrectionObject[];
}

export function getMockAIReview(title: string, content: string): AIReviewResult {
  const corrections: CorrectionObject[] = [];

  if (content.indexOf("However") >= 0) {
    corrections.push({
      category: "grammar",
      selectedText: "However",
      textStartIndex: content.indexOf("However"),
      textEndIndex: content.indexOf("However") + 7,
      comment: "Add a comma after transitional words at the beginning of a sentence. Should be: 'However,'"
    });
  }

  if (content.indexOf("it's") >= 0) {
    corrections.push({
      category: "grammar",
      selectedText: "it's",
      textStartIndex: content.indexOf("it's"),
      textEndIndex: content.indexOf("it's") + 4,
      comment: "Incorrect use of contraction. Use 'its' (possessive) instead of 'it's' (it is)."
    });
  }

  if (content.indexOf("very important") >= 0) {
    corrections.push({
      category: "style",
      selectedText: "very important",
      textStartIndex: content.indexOf("very important"),
      textEndIndex: content.indexOf("very important") + 14,
      comment: "Replace weak intensifiers with stronger, more precise vocabulary. Consider: 'crucial' or 'essential'"
    });
  }

  if (content.indexOf("In conclusion") >= 0) {
    corrections.push({
      category: "style",
      selectedText: "In conclusion",
      textStartIndex: content.indexOf("In conclusion"),
      textEndIndex: content.indexOf("In conclusion") + 13,
      comment: "Vary your transitional phrases to avoid repetitive language. Try: 'To conclude' or 'Ultimately'"
    });
  }

  if (content.indexOf("this") >= 0) {
    corrections.push({
      category: "clarity",
      selectedText: "this",
      textStartIndex: content.indexOf("this"),
      textEndIndex: content.indexOf("this") + 4,
      comment: "Vague pronoun reference. Specify what 'this' refers to for better clarity."
    });
  }

  const firstParagraph = content.split('\n\n')[0];
  if (firstParagraph) {
    corrections.push({
      category: "structure",
      selectedText: firstParagraph.substring(0, Math.min(100, firstParagraph.length)),
      textStartIndex: 0,
      textEndIndex: Math.min(100, firstParagraph.length),
      comment: "The opening paragraph would benefit from a clear thesis statement to guide readers through your argument."
    });
  }

  corrections.push({
    category: "content",
    selectedText: "",
    textStartIndex: 0,
    textEndIndex: 0,
    comment: "Your main arguments are well-developed. Consider adding more specific examples or evidence to strengthen your claims."
  });

  corrections.push({
    category: "research",
    selectedText: "",
    textStartIndex: 0,
    textEndIndex: 0,
    comment: "Consider citing authoritative sources to support your key points. This would add credibility to your arguments."
  });

  const grammarIssues = corrections.filter(c => c.category === 'grammar').length;
  const styleIssues = corrections.filter(c => c.category === 'style').length;
  const clarityIssues = corrections.filter(c => c.category === 'clarity').length;
  const structureIssues = corrections.filter(c => c.category === 'structure').length;

  const grammarScore = Math.max(120, 180 - (grammarIssues * 20));
  const styleScore = Math.max(120, 170 - (styleIssues * 15));
  const clarityScore = Math.max(130, 175 - (clarityIssues * 20));
  const structureScore = Math.max(140, 180 - (structureIssues * 15));
  const contentScore = 165;
  const researchScore = 155;

  const overallScore = grammarScore + styleScore + clarityScore + structureScore + contentScore + researchScore;

  return {
    grammarScore,
    styleScore,
    clarityScore,
    structureScore,
    contentScore,
    researchScore,
    overallScore,
    corrections: corrections.filter(c => c.textStartIndex >= 0)
  };
}
