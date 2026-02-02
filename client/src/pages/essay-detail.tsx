import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
import { ArrowLeft, MessageSquare, Users, Eye, Calendar, CheckCircle2, Heart, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { type Essay, type PeerReview, type ReviewCategory, type CorrectionObject, type RubricCategory, type RubricScore } from "@shared/schema";

const DEFAULT_REVIEW_CATEGORIES: { key: ReviewCategory; label: string; description: string; color: string }[] = [
  { key: 'grammar', label: 'Grammar & Mechanics', description: 'Spelling, punctuation, syntax', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { key: 'style', label: 'Style & Voice', description: 'Writing style, tone, word choice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { key: 'clarity', label: 'Clarity & Flow', description: 'Sentence structure, transitions', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { key: 'structure', label: 'Structure & Organization', description: 'Logical flow, paragraph structure', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { key: 'content', label: 'Content & Ideas', description: 'Argument strength, evidence, depth', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { key: 'research', label: 'Research & Evidence', description: 'Sources, citations, support', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' }
];

const RUBRIC_COLORS = [
  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
];

interface ReviewPage {
  data: PeerReview[];
  nextCursor: string | null;
}

export default function EssayDetail() {
  const { user } = useAuth();
  const [match, params] = useRoute("/essay/:id");
  const essayId = params?.id;
  
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('grammar');
  const [correctionComment, setCorrectionComment] = useState("");
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({
    grammar: 100,
    style: 100,
    clarity: 100,
    structure: 100,
    content: 100,
    research: 100
  });
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);
  const [reviewLikes, setReviewLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essay, isLoading: essayLoading } = useQuery<Essay>({
    queryKey: [`/api/essays/${essayId}`],
    enabled: !!essayId,
  });

  const { 
    data: reviewsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: reviewsLoading 
  } = useInfiniteQuery<ReviewPage>({
    queryKey: [`/api/essays/${essayId}/peer-reviews`],
    enabled: !!essayId,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append("cursor", pageParam as string);
      const res = await apiRequest("GET", `/api/essays/${essayId}/peer-reviews?${params.toString()}`);
      return res.json();
    },
  });

  const reviews = useMemo(() => {
    return reviewsData?.pages.flatMap((page) => page.data) || [];
  }, [reviewsData]);

  const hasCustomRubric = essay?.rubric && essay.rubric.length > 0;

  const REVIEW_CATEGORIES = hasCustomRubric
    ? essay.rubric!.map((cat, idx) => ({
        key: cat.name as ReviewCategory,
        label: cat.name,
        description: cat.description || '',
        color: RUBRIC_COLORS[idx % RUBRIC_COLORS.length],
        maxScore: cat.maxScore,
      }))
    : DEFAULT_REVIEW_CATEGORIES.map(cat => ({ ...cat, maxScore: 200 }));

  const getOrCreateReviewMutation = useMutation({
    mutationFn: async () => {
      const rubricScoresArray = hasCustomRubric && REVIEW_CATEGORIES.length > 0
        ? REVIEW_CATEGORIES.map(cat => ({
            categoryName: String(cat.key),
            score: rubricScores[cat.key] ?? Math.floor((cat.maxScore || 200) / 2),
            maxScore: cat.maxScore || 200,
          }))
        : null;

      let overallScore: number;
      if (hasCustomRubric && rubricScoresArray) {
        overallScore = rubricScoresArray.reduce((sum, rs) => sum + rs.score, 0);
      } else {
        overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
      }

      const payload: Record<string, unknown> = hasCustomRubric
        ? {
            grammarScore: 100,
            styleScore: 100,
            clarityScore: 100,
            structureScore: 100,
            contentScore: 100,
            researchScore: 100,
            overallScore,
            rubricScores: rubricScoresArray,
          }
        : {
            ...categoryScores, overallScore,
          };

      const response = await apiRequest("POST", `/api/essays/${essayId}/peer-reviews`, payload);
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

  const toggleReviewLikeMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await apiRequest("POST", `/api/peer-reviews/${reviewId}/likes`);
      return { reviewId, data: await response.json() };
    },
    onSuccess: ({ reviewId, data }) => {
      setReviewLikes(prev => ({
        ...prev,
        [reviewId]: { count: data.count, isLiked: data.isLiked }
      }));
    },
    onError: () => {
      toast({
        title: "Failed to like review",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    const fetchLikes = async () => {
      for (const review of reviews) {
        if (reviewLikes[review.id]) continue;
        try {
          const response = await fetch(`/api/peer-reviews/${review.id}/likes`);
          if (response.ok) {
            const data = await response.json();
            setReviewLikes(prev => ({
              ...prev,
              [review.id]: { count: data.count, isLiked: data.isLiked }
            }));
          }
        } catch (error) {
        }
      }
    };
    if (reviews.length > 0) {
      fetchLikes();
    }
  }, [reviews, reviewLikes]);

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
    if (hasCustomRubric && REVIEW_CATEGORIES.length > 0 && Object.keys(rubricScores).length === 0) {
      const initialRubricScores: Record<string, number> = {};
      REVIEW_CATEGORIES.forEach(cat => {
        initialRubricScores[cat.key] = Math.floor((cat.maxScore || 200) / 2);
      });
      setRubricScores(initialRubricScores);
      if (REVIEW_CATEGORIES[0]) {
        setActiveCategory(String(REVIEW_CATEGORIES[0].key));
      }
    }
  }, [hasCustomRubric, REVIEW_CATEGORIES.length]);

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
        if (currentUserReview.rubricScores && currentUserReview.rubricScores.length > 0) {
          const loadedRubricScores: Record<string, number> = {};
          currentUserReview.rubricScores.forEach(rs => {
            loadedRubricScores[rs.categoryName] = rs.score;
          });
          setRubricScores(loadedRubricScores);
        }
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
          category: activeCategory as ReviewCategory,
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
        description: `Please complete all ${REVIEW_CATEGORIES.length} category scores before submitting.`,
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

    const rubricScoresArray = hasCustomRubric && REVIEW_CATEGORIES.length > 0
      ? REVIEW_CATEGORIES.map(cat => ({
          categoryName: String(cat.key),
          score: rubricScores[cat.key] ?? Math.floor((cat.maxScore || 200) / 2),
          maxScore: cat.maxScore || 200,
        }))
      : null;

    let overallScore: number;
    if (hasCustomRubric && rubricScoresArray) {
      overallScore = rubricScoresArray.reduce((sum, rs) => sum + rs.score, 0);
    } else {
      overallScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    }

    const payload = hasCustomRubric
      ? { overallScore, rubricScores: rubricScoresArray, isSubmitted: true, grammarScore: 100, styleScore: 100, clarityScore: 100, structureScore: 100, contentScore: 100, researchScore: 100 }
      : { ...categoryScores, overallScore, isSubmitted: true };
    
    try {
      await apiRequest("PATCH", `/api/peer-reviews/${activeReviewId}`, payload);
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
  const getCategoryCorrections = (category: string) => currentUserReview ? currentUserReview.corrections.filter(c => c.category === category) : [];
  
  const isCategoryReviewed = (category: string) => {
    if (hasCustomRubric) {
      const catInfo = REVIEW_CATEGORIES.find(c => c.key === category);
      const defaultScore = catInfo ? Math.floor((catInfo.maxScore || 200) / 2) : 100;
      return rubricScores[category] !== undefined && rubricScores[category] !== defaultScore;
    }
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
  
  // --- LÓGICA DE EXIBIÇÃO DE NOTA ---
  const myCurrentScore = hasCustomRubric 
    ? Object.values(rubricScores).reduce((sum, score) => sum + score, 0)
    : Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
  const maxScore = hasCustomRubric
    ? REVIEW_CATEGORIES.reduce((sum, cat) => sum + (cat.maxScore || 200), 0)
    : 1200;

  // Se sou o autor, vejo a média do backend. Se sou revisor, vejo minha nota local.
  const isAuthor = user?.id === essayData.authorId;
  const headerScore = isAuthor ? essayData.averageScore : myCurrentScore;
  const headerLabel = isAuthor ? (essayData.reviewCount > 0 ? "Average Score" : "No reviews") : "Your Score";

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
                <AvatarFallback>{essayData?.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
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
          <div className="text-2xl font-bold text-primary">{headerScore}/{maxScore}</div>
          <div className="text-sm text-muted-foreground">{headerLabel}</div>
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
                className="prose dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap cursor-text"
                onMouseUp={handleTextSelection}
                data-testid="essay-content"
              >
                {essayData?.content && renderHighlightedText(essayData.content)}
              </div>
            </CardContent>
          </Card>

          {/* Peer Corrections Display */}
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
                                Overall Score: {
                                  hasCustomRubric
                                    ? review.rubricScores
                                      ? `${review.rubricScores.reduce((sum, rs) => sum + rs.score, 0)}/${maxScore}`
                                      : `${review.overallScore}/${maxScore}`
                                    : `${review.overallScore}/1200`
                                } ({review.corrections.length} comments)
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
                
                {REVIEW_CATEGORIES.map((category) => {
                  const maxScore = category.maxScore || 200;
                  const currentScore = hasCustomRubric 
                    ? (rubricScores[category.key] ?? Math.floor(maxScore / 2))
                    : (categoryScores[category.key] ?? 100);
                  
                  return (
                  <TabsContent key={category.key} value={category.key} className="space-y-4 mt-4">
                    {/* Category Score */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                        <Badge className={category.color}>
                          {currentScore}/{maxScore}
                        </Badge>
                      </div>
                      <Slider
                        value={[currentScore]}
                        onValueChange={(value) => {
                          if (!isReviewSubmitted) {
                            if (hasCustomRubric) {
                              setRubricScores(prev => ({ ...prev, [category.key]: value[0] }));
                            } else {
                              setCategoryScores(prev => ({ ...prev, [category.key]: value[0] }));
                            }
                          }
                        }}
                        max={maxScore}
                        min={0}
                        step={Math.max(1, Math.floor(maxScore / 20))}
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
                          <div className="text-sm italic">"{selectedText}"</div>
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
                  );
                })}
              </Tabs>

              {/* Submit Review Button */}
              <div className="mt-6 pt-4 border-t space-y-3">
                <div className="text-center">
                  {hasCustomRubric ? (
                    <>
                      <div className="text-xl font-bold text-primary">
                        {Object.values(rubricScores).reduce((sum, score) => sum + score, 0)}/
                        {REVIEW_CATEGORIES.reduce((sum, cat) => sum + (cat.maxScore || 200), 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Custom Rubric Score ({Math.round((Object.values(rubricScores).reduce((sum, score) => sum + score, 0) / REVIEW_CATEGORIES.reduce((sum, cat) => sum + (cat.maxScore || 200), 0)) * 100)}%)
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-primary">{myCurrentScore}/{maxScore}</div>
                      <div className="text-xs text-muted-foreground">Your Review Score ({Math.round((myCurrentScore / maxScore) * 100)}%)</div>
                    </>
                  )}
                </div>
                {isReviewSubmitted ? (
                  <div className="text-xs text-green-600 text-center font-medium">
                    ✓ Review submitted and locked
                  </div>
                ) : !allCategoriesReviewed ? (
                  <div className="text-xs text-destructive text-center">
                    Please complete all {REVIEW_CATEGORIES.length} categories by adjusting their scores before submitting
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
                            {hasCustomRubric
                              ? review.rubricScores
                                ? `${review.rubricScores.reduce((sum, s) => sum + s.score, 0)}/${maxScore}`
                                : `${review.overallScore}/${maxScore}`
                              : `${review.overallScore}/1200`
                            }
                          </Badge>
                        </div>
                        {hasCustomRubric ? (
                          review.rubricScores ? (
                            <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                              {review.rubricScores.map((rs, idx) => (
                                <div key={idx} className="truncate" title={rs.categoryName}>
                                  {rs.categoryName}: {rs.score}/{rs.maxScore}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground mb-2">
                              Custom rubric scores not available for this review
                            </div>
                          )
                        ) : (
                          <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                            <div>Grammar: {review.grammarScore}/200</div>
                            <div>Style: {review.styleScore}/200</div>
                            <div>Clarity: {review.clarityScore}/200</div>
                            <div>Structure: {review.structureScore}/200</div>
                            <div>Content: {review.contentScore}/200</div>
                            <div>Research: {review.researchScore}/200</div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {review.corrections.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {review.corrections.length} comment{review.corrections.length !== 1 ? 's' : ''}
                            </div>
                          )}
                          {!review.corrections.length && <div />}
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 px-2 ${reviewLikes[review.id]?.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReviewLikeMutation.mutate(review.id);
                            }}
                            disabled={toggleReviewLikeMutation.isPending}
                            data-testid={`button-like-review-${review.id}`}
                          >
                            <Heart className={`w-4 h-4 mr-1 ${reviewLikes[review.id]?.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs">{reviewLikes[review.id]?.count || 0}</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {hasNextPage && (
                  <div className="flex justify-center mt-4 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => fetchNextPage()} 
                      disabled={isFetchingNextPage}
                      size="sm"
                      className="w-full"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Loading more...
                        </>
                      ) : (
                        'Load More Reviews'
                      )}
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}