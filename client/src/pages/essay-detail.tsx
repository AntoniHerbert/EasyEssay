import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Star, Users, Eye, Calendar, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { type Essay, type PeerReview, type ReviewCategory, type CorrectionObject } from "@shared/schema";

const REVIEW_CATEGORIES: { key: ReviewCategory; label: string; description: string; color: string }[] = [
  { key: 'grammar', label: 'Grammar & Mechanics', description: 'Spelling, punctuation, syntax', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { key: 'style', label: 'Style & Voice', description: 'Writing style, tone, word choice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { key: 'clarity', label: 'Clarity & Flow', description: 'Sentence structure, transitions', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { key: 'structure', label: 'Structure & Organization', description: 'Logical flow, paragraph structure', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { key: 'content', label: 'Content & Ideas', description: 'Argument strength, evidence, depth', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { key: 'research', label: 'Research & Evidence', description: 'Sources, citations, support', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
];

export default function EssayDetail() {
  const { user } = useAuth();
  const [match, params] = useRoute("/essay/:id");
  const essayId = params?.id;
  
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null);
  const [activeCategory, setActiveCategory] = useState<ReviewCategory>('grammar');
  const [correctionComment, setCorrectionComment] = useState("");
  const [categoryScores, setCategoryScores] = useState({
    grammar: 100,
    style: 100,
    clarity: 100,
    structure: 100,
    content: 100,
    research: 100
  });
  const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essay, isLoading: essayLoading } = useQuery<Essay>({
    queryKey: [`/api/essays/${essayId}`],
    enabled: !!essayId,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<PeerReview[]>({
    queryKey: [`/api/essays/${essayId}/peer-reviews`],
    enabled: !!essayId,
  });

  const getOrCreateReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/essays/${essayId}/peer-reviews`, {
        grammarScore: categoryScores.grammar,
        styleScore: categoryScores.style,
        clarityScore: categoryScores.clarity,
        structureScore: categoryScores.structure,
        contentScore: categoryScores.content,
        researchScore: categoryScores.research,
        overallScore: Object.values(categoryScores).reduce((sum, score) => sum + score, 0),
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setActiveReviewId(data.id);
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
    },
    onError: (error: any) => {
      toast({
        title: "Cannot review",
        description: error?.message || "You cannot review your own essay.",
        variant: "destructive",
      });
    },
  });

  const addCorrectionMutation = useMutation({
    mutationFn: async (data: { reviewId: string; correction: CorrectionObject }) => {
      return apiRequest("POST", `/api/peer-reviews/${data.reviewId}/corrections`, data.correction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
      setSelectedText("");
      setSelectionRange(null);
      setCorrectionComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedStr = selection.toString();
      const range = selection.getRangeAt(0);
      const essayContent = document.getElementById('essay-content');
      
      if (essayContent && essayContent.contains(range.commonAncestorContainer)) {
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(essayContent);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const start = preCaretRange.toString().length;
        const end = start + selectedStr.length;
        
        setSelectedText(selectedStr);
        setSelectionRange({ start, end });
      }
    }
  };

  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);

  useEffect(() => {
    if (reviews.length > 0 && user?.id) {
      const currentUserReview = reviews.find(r => r.reviewerId === user.id);
      if (currentUserReview) {
        setActiveReviewId(currentUserReview.id);
        setCategoryScores({
          grammar: currentUserReview.grammarScore,
          style: currentUserReview.styleScore,
          clarity: currentUserReview.clarityScore,
          structure: currentUserReview.structureScore,
          content: currentUserReview.contentScore,
          research: currentUserReview.researchScore,
        });
      }
    }
  }, [reviews, user?.id]);

  const handleSubmitCorrection = async () => {
    if (!correctionComment.trim()) {
      toast({
        title: "Missing information",
        description: "Please add a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      let reviewId: string = activeReviewId || "";
      if (!reviewId) {
        const review = await getOrCreateReviewMutation.mutateAsync();
        reviewId = review.id;
      }
      
      await addCorrectionMutation.mutateAsync({
        reviewId,
        correction: {
          category: activeCategory,
          selectedText: selectedText || "",
          textStartIndex: selectionRange?.start || 0,
          textEndIndex: selectionRange?.end || 0,
          comment: correctionComment,
        }
      });
    } catch (error) {
    }
  };

  const handleSubmitReview = async () => {
    if (!allCategoriesReviewed) {
      toast({
        title: "Incomplete review",
        description: "Please complete all six category scores before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!activeReviewId) {
      await getOrCreateReviewMutation.mutateAsync();
      toast({
        title: "Review submitted",
        description: "Your peer review has been saved successfully.",
      });
      return;
    }

    const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    
    try {
      await apiRequest("PATCH", `/api/peer-reviews/${activeReviewId}`, {
        grammarScore: categoryScores.grammar,
        styleScore: categoryScores.style,
        clarityScore: categoryScores.clarity,
        structureScore: categoryScores.structure,
        contentScore: categoryScores.content,
        researchScore: categoryScores.research,
        overallScore,
        isSubmitted: true,
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
      
      toast({
        title: "Review submitted",
        description: "Your peer review has been locked and submitted successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to submit review",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentUserReview = reviews.find(r => r.reviewerId === user?.id);
  
  const isReviewSubmitted = currentUserReview?.isSubmitted ?? false;

  const getCategoryCorrections = (category: ReviewCategory) => {
    if (!currentUserReview) return [];
    return currentUserReview.corrections.filter(c => c.category === category);
  };

  const isCategoryReviewed = (category: ReviewCategory) => {
    return categoryScores[category] !== 100;
  };

  const allCategoriesReviewed = REVIEW_CATEGORIES.every(cat => isCategoryReviewed(cat.key));

  const reviewedCategoriesCount = REVIEW_CATEGORIES.filter(cat => isCategoryReviewed(cat.key)).length;
  const reviewProgress = (reviewedCategoriesCount / REVIEW_CATEGORIES.length) * 100;

  const renderHighlightedText = (text: string) => {
    if (!viewingReviewId) {
      return <span>{text}</span>;
    }

    const viewingReview = reviews.find(r => r.id === viewingReviewId);
    if (!viewingReview || viewingReview.corrections.length === 0) {
      return <span>{text}</span>;
    }

    const sortedCorrections = [...viewingReview.corrections].sort((a, b) => a.textStartIndex - b.textStartIndex);

    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    sortedCorrections.forEach((correction, idx) => {
      if (correction.textStartIndex > lastIndex) {
        segments.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, correction.textStartIndex)}
          </span>
        );
      }

      const category = REVIEW_CATEGORIES.find(c => c.key === correction.category);
      const highlightClass = category ? category.color : 'bg-yellow-200 dark:bg-yellow-800';

      segments.push(
        <mark
          key={`highlight-${idx}`}
          className={`${highlightClass} px-1 rounded cursor-pointer transition-opacity hover:opacity-80`}
          title={correction.comment}
          data-testid={`highlight-${idx}`}
        >
          {text.substring(correction.textStartIndex, correction.textEndIndex)}
        </mark>
      );

      lastIndex = correction.textEndIndex;
    });

    if (lastIndex < text.length) {
      segments.push(
        <span key="text-end">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return <>{segments}</>;
  };

  if (!match || !essayId) {
    return <div>Essay not found</div>;
  }

  if (essayLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-muted rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const essayData = essay as Essay;
  const overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
  const maxScore = 1200;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">{essayData?.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback>
                  {essayData?.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{essayData?.authorName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{essayData ? new Date(essayData.createdAt).toLocaleDateString() : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{essayData?.wordCount} words</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{overallScore}/{maxScore}</div>
          <div className="text-sm text-muted-foreground">Overall Score</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Essay Content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Essay Content</CardTitle>
                {viewingReviewId && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setViewingReviewId(null)}
                    data-testid="clear-highlights"
                  >
                    Clear Highlights
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div 
                id="essay-content"
                className="prose dark:prose-invert max-w-none break-words leading-relaxed whitespace-pre-wrap cursor-text"
                onMouseUp={handleTextSelection}
                data-testid="essay-content"
              >
                {essayData?.content && renderHighlightedText(essayData.content)}
              </div>
            </CardContent>
          </Card>

          {/* Peer Corrections Display - Filtered by viewing review */}
          {(() => {
            const reviewsToShow = viewingReviewId 
              ? reviews.filter(r => r.id === viewingReviewId)
              : reviews;
            
            const hasComments = reviewsToShow.some(r => r.corrections.length > 0);

            if (!hasComments) return null;

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {viewingReviewId ? "Selected Review Comments" : "Peer Review Comments"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reviewsToShow.map((review) => {
                      if (review.corrections.length === 0) return null;
                      
                      return (
                        <div key={review.id} className="space-y-3 pb-4 border-b last:border-b-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">Reviewer: {review.reviewerId}</div>
                              <div className="text-xs text-muted-foreground">
                                Overall Score: {review.overallScore}/1200 ({review.corrections.length} comments)
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {REVIEW_CATEGORIES.map((cat) => {
                              const categoryCorrections = review.corrections.filter(c => c.category === cat.key);
                              if (categoryCorrections.length === 0) return null;
                              
                              return (
                                <div key={cat.key} className="space-y-2">
                                  <Badge className={cat.color + " text-xs"}>
                                    {cat.label} ({categoryCorrections.length})
                                  </Badge>
                                  <div className="space-y-2 pl-3">
                                    {categoryCorrections.map((correction, idx) => (
                                      <div 
                                        key={idx} 
                                        className="p-2 bg-muted/30 rounded text-sm"
                                        data-testid={`correction-${idx}`}
                                      >
                                        {correction.selectedText && (
                                          <div className="italic mb-1">"{correction.selectedText}"</div>
                                        )}
                                        <p className="text-muted-foreground">{correction.comment}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Review Panel */}
        <div className="space-y-4">
          {essay?.authorId === user?.id ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Your Essay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                  <p className="mb-2">This is your essay.</p>
                  <p>You cannot review your own work, but you can see reviews from others below.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Peer Review
                </CardTitle>
                {/* Progress Indicator */}
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{reviewedCategoriesCount} of {REVIEW_CATEGORIES.length} categories reviewed</span>
                    <span>{Math.round(reviewProgress)}%</span>
                  </div>
                  <Progress value={reviewProgress} className="h-2" />
                </div>
              </CardHeader>
              <CardContent>
              <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ReviewCategory)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  {REVIEW_CATEGORIES.map((cat) => (
                    <TabsTrigger 
                      key={cat.key} 
                      value={cat.key}
                      className="text-xs py-2 relative"
                      data-testid={`tab-${cat.key}`}
                    >
                      <span className="flex items-center gap-1">
                        {cat.label.split(' ')[0]}
                        {isCategoryReviewed(cat.key) && (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        )}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {REVIEW_CATEGORIES.map((category) => (
                  <TabsContent key={category.key} value={category.key} className="space-y-4 mt-4">
                    {/* Category Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                        <Badge className={category.color}>
                          {categoryScores[category.key]}/200
                        </Badge>
                      </div>
                      <Slider
                        value={[categoryScores[category.key]]}
                        onValueChange={(value) => 
                          !isReviewSubmitted && setCategoryScores(prev => ({ ...prev, [category.key]: value[0] }))
                        }
                        max={200}
                        min={0}
                        step={5}
                        className="w-full"
                        disabled={isReviewSubmitted}
                        data-testid={`slider-${category.key}`}
                      />
                    </div>

                    <Separator />

                    {/* Text Selection & Comment */}
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">
                        Add a comment to justify your score (optionally select text from the essay to reference)
                      </div>
                      
                      {selectedText && (
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium mb-1">Selected Text:</div>
                          <div className="text-sm break-words italic">"{selectedText}"</div>
                        </div>
                      )}
                      
                      <Textarea
                        value={correctionComment}
                        onChange={(e) => setCorrectionComment(e.target.value)}
                        placeholder={isReviewSubmitted ? "Review is submitted and locked" : "Explain your evaluation for this category..."}
                        className="min-h-[80px]"
                        disabled={isReviewSubmitted}
                        data-testid={`comment-${category.key}`}
                      />

                      <Button 
                        onClick={handleSubmitCorrection}
                        disabled={isReviewSubmitted || !correctionComment.trim() || addCorrectionMutation.isPending}
                        className="w-full"
                        size="sm"
                        data-testid={`add-correction-${category.key}`}
                      >
                        {addCorrectionMutation.isPending ? "Adding..." : isReviewSubmitted ? "Review Submitted" : "Add Comment to This Category"}
                      </Button>
                    </div>

                    {/* Category Corrections */}
                    {getCategoryCorrections(category.key).length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Your Comments ({getCategoryCorrections(category.key).length})</div>
                          {getCategoryCorrections(category.key).map((correction, idx) => (
                            <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                              {correction.selectedText && (
                                <div className="italic mb-1">"{correction.selectedText}"</div>
                              )}
                              <div className="text-muted-foreground">{correction.comment}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              {/* Submit Review Button */}
              <div className="mt-6 pt-4 border-t space-y-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-primary">{overallScore}/1200</div>
                  <div className="text-xs text-muted-foreground">Overall Score ({Math.round((overallScore / 1200) * 100)}%)</div>
                </div>
                {isReviewSubmitted ? (
                  <div className="text-xs text-green-600 text-center font-medium">
                    ✓ Review submitted and locked
                  </div>
                ) : !allCategoriesReviewed ? (
                  <div className="text-xs text-destructive text-center">
                    Please complete all 6 categories by adjusting their scores before submitting
                  </div>
                ) : null}
                <Button 
                  onClick={handleSubmitReview}
                  disabled={isReviewSubmitted || !allCategoriesReviewed || getOrCreateReviewMutation.isPending}
                  className="w-full"
                  data-testid="submit-review"
                >
                  {isReviewSubmitted ? "Review Locked ✓" : getOrCreateReviewMutation.isPending ? "Submitting..." : "Submit Complete Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Existing Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviews.map((review) => {
                    const isActive = viewingReviewId === review.id;
                    const isAI = review.reviewerId === "AI";
                    
                    return (
                      <div 
                        key={review.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        } ${isAI ? 'border-blue-300 dark:border-blue-700' : ''}`}
                        onClick={() => setViewingReviewId(isActive ? null : review.id)}
                        data-testid={`review-card-${review.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium flex items-center gap-2">
                            {isAI ? (
                              <>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  🤖 AI Analysis
                                </span>
                                {isActive && <span className="text-primary">(Viewing)</span>}
                              </>
                            ) : (
                              <>
                                Reviewer {isActive && <span className="text-primary">(Viewing)</span>}
                              </>
                            )}
                          </div>
                          <Badge variant={isActive ? "default" : "outline"}>
                            {review.overallScore}/1200
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                          <div>Grammar: {review.grammarScore}/200</div>
                          <div>Style: {review.styleScore}/200</div>
                          <div>Clarity: {review.clarityScore}/200</div>
                          <div>Structure: {review.structureScore}/200</div>
                          <div>Content: {review.contentScore}/200</div>
                          <div>Research: {review.researchScore}/200</div>
                        </div>
                        {review.corrections.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {review.corrections.length} comment{review.corrections.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}