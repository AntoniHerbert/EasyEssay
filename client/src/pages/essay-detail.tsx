import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useRoute, Link } from "wouter";
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
import { type Essay, type PeerReview, type ReviewCategory, type CorrectionObject, PeerReviewWithProfile } from "@shared/schema";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopReviewDrawer } from "../components/DesktopReviewDrawer"; 
import { MobileReviewDrawer } from "../components/MobileReviewDrawer";

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
  data: PeerReviewWithProfile[];
  nextCursor: string | null;
}

export default function EssayDetail() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [match, params] = useRoute("/essay/:id");
  const essayId = params?.id;

  const isMobile = useIsMobile();

  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{start: number; end: number} | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('grammar');
  const [correctionComment, setCorrectionComment] = useState("");
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({
    grammar: 100, style: 100, clarity: 100, structure: 100, content: 100, research: 100
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
    const allReviews = reviewsData?.pages.flatMap((page) => page.data) || [];
    
    return allReviews.filter(review => 
      review.isSubmitted === true || 
      review.reviewerId === user?.id || 
      review.reviewerId === "AI"
    );
  }, [reviewsData, user?.id]);

  const essayData = essay as Essay;
  const hasCustomRubric = essayData?.rubric && essayData.rubric.length > 0;

  const REVIEW_CATEGORIES = useMemo(() => {
    if (hasCustomRubric) {
      return essayData.rubric!.map((cat, idx) => ({
        key: cat.name as ReviewCategory,
        label: cat.name,
        description: cat.description || '',
        color: RUBRIC_COLORS[idx % RUBRIC_COLORS.length],
        maxScore: cat.maxScore,
      }));
    }
    return [
      { key: 'grammar' as ReviewCategory, label: t('essay_detail.categories.grammar.label'), description: t('essay_detail.categories.grammar.desc'), color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', maxScore: 200 },
      { key: 'style' as ReviewCategory, label: t('essay_detail.categories.style.label'), description: t('essay_detail.categories.style.desc'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', maxScore: 200 },
      { key: 'clarity' as ReviewCategory, label: t('essay_detail.categories.clarity.label'), description: t('essay_detail.categories.clarity.desc'), color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', maxScore: 200 },
      { key: 'structure' as ReviewCategory, label: t('essay_detail.categories.structure.label'), description: t('essay_detail.categories.structure.desc'), color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', maxScore: 200 },
      { key: 'content' as ReviewCategory, label: t('essay_detail.categories.content.label'), description: t('essay_detail.categories.content.desc'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', maxScore: 200 },
      { key: 'research' as ReviewCategory, label: t('essay_detail.categories.research.label'), description: t('essay_detail.categories.research.desc'), color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', maxScore: 200 }
    ];
  }, [hasCustomRubric, essayData?.rubric, t]);

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

  useEffect(() => {
    if (hasCustomRubric && REVIEW_CATEGORIES.length > 0 && Object.keys(rubricScores).length === 0) {
      const initialRubricScores: Record<string, number> = {};
      REVIEW_CATEGORIES.forEach(cat => {
        initialRubricScores[cat.key] = Math.floor((cat.maxScore || 200) / 2);
      });
      setRubricScores(initialRubricScores);
      if (REVIEW_CATEGORIES[0]) setActiveCategory(String(REVIEW_CATEGORIES[0].key));
    }
  }, [hasCustomRubric, REVIEW_CATEGORIES]);

  const getOrCreateReviewMutation = useMutation({
    mutationFn: async () => {
      const rubricScoresArray = hasCustomRubric 
        ? REVIEW_CATEGORIES.map(cat => ({
            categoryName: String(cat.key),
            score: rubricScores[cat.key] ?? Math.floor((cat.maxScore || 200) / 2),
            maxScore: cat.maxScore || 200,
          }))
        : null;

      let overallScore = hasCustomRubric && rubricScoresArray
        ? rubricScoresArray.reduce((sum, rs) => sum + rs.score, 0)
        : Object.values(categoryScores).reduce((sum, score) => sum + score, 0);

      const payload = hasCustomRubric
        ? { grammarScore: 100, styleScore: 100, clarityScore: 100, structureScore: 100, contentScore: 100, researchScore: 100, overallScore, rubricScores: rubricScoresArray }
        : { grammarScore: categoryScores.grammar, styleScore: categoryScores.style, clarityScore: categoryScores.clarity, structureScore: categoryScores.structure, contentScore: categoryScores.content, researchScore: categoryScores.research, overallScore };

      const response = await apiRequest("POST", `/api/essays/${essayId}/peer-reviews`, payload);
      return await response.json();
    },
    onSuccess: (data) => {
      setActiveReviewId(data.id);
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
    }
  });

  const addCorrectionMutation = useMutation({
    mutationFn: async (data: { reviewId: string; [key: string]: any }) => {
      const { reviewId, ...payload } = data;
      
      return apiRequest("POST", `/api/peer-reviews/${reviewId}/corrections`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}`] });
      
      setSelectedText("");
      setSelectionRange(null);
      setCorrectionComment("");
      
      toast({
        title: t('essay_detail.toast.comment_added'),
        description: t('essay_detail.toast.comment_saved'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('essay_detail.toast.submit_failed'),
        description: error.message || t('common.try_again'),
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
      setReviewLikes(prev => ({ ...prev, [reviewId]: { count: data.count, isLiked: data.isLiked } }));
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
            setReviewLikes(prev => ({ ...prev, [review.id]: { count: data.count, isLiked: data.isLiked } }));
          }
        } catch (error) {}
      }
    };
    if (reviews.length > 0) fetchLikes();
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
        setSelectedText(selectedStr);
        setSelectionRange({ start, end: start + selectedStr.length });
      }
    }
  };

  const handleSubmitCorrection = async () => {
    if (!correctionComment.trim()) {
      toast({
        title: t('essay_detail.toast.missing_info'),
        description: t('essay_detail.toast.missing_comment'),
        variant: "destructive",
      });
      return;
    }

    try {
      let reviewId: string = activeReviewId || "";
      if (!reviewId) {
        const review = await getOrCreateReviewMutation.mutateAsync();
        reviewId = review.id;
        setActiveReviewId(review.id);
      }

      const currentScores = hasCustomRubric 
        ? {
            rubricScores: REVIEW_CATEGORIES.map(cat => ({
              categoryName: String(cat.key),
              score: rubricScores[cat.key] ?? Math.floor((cat.maxScore || 200) / 2),
              maxScore: cat.maxScore || 200,
            }))
          }
        : {
            grammarScore: categoryScores.grammar,
            styleScore: categoryScores.style,
            clarityScore: categoryScores.clarity,
            structureScore: categoryScores.structure,
            contentScore: categoryScores.content,
            researchScore: categoryScores.research,
          };
      
      await addCorrectionMutation.mutateAsync({
        reviewId,
        ...currentScores,
        category: activeCategory as ReviewCategory,
        selectedText: selectedText || "",
        textStartIndex: selectionRange?.start || 0,
        textEndIndex: selectionRange?.end || 0,
        comment: correctionComment,
      });
    } catch (error: any) {
      console.error("Erro detalhado ao criar comentário/review:", error);
      
      let errorMessage = t('common.try_again');
      if (error && error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no Backend",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async () => {
    if (!allCategoriesReviewed) {
      toast({ title: t('essay_detail.toast.incomplete'), description: t('essay_detail.toast.incomplete_desc'), variant: "destructive" });
      return;
    }
    try {
      let rId = activeReviewId;
      if (!rId) {
        const review = await getOrCreateReviewMutation.mutateAsync();
        rId = review.id;
      }

      const rubricScoresArray = hasCustomRubric 
        ? REVIEW_CATEGORIES.map(cat => ({
            categoryName: String(cat.key),
            score: rubricScores[cat.key] ?? Math.floor((cat.maxScore || 200) / 2),
            maxScore: cat.maxScore || 200,
          }))
        : null;

      let overallScore = hasCustomRubric && rubricScoresArray
        ? rubricScoresArray.reduce((sum, rs) => sum + rs.score, 0)
        : Object.values(categoryScores).reduce((sum, score) => sum + score, 0);

      const payload = hasCustomRubric
        ? { overallScore, rubricScores: rubricScoresArray, isSubmitted: true, grammarScore: 100, styleScore: 100, clarityScore: 100, structureScore: 100, contentScore: 100, researchScore: 100 }
        : { ...categoryScores, overallScore, isSubmitted: true };

      await apiRequest("PATCH", `/api/peer-reviews/${rId}`, payload);
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}`] });
      toast({ title: t('essay_detail.toast.submitted'), description: t('essay_detail.toast.submitted_locked') });
    } catch (error) {
      toast({ title: t('essay_detail.toast.submit_failed'), description: t('common.try_again'), variant: "destructive" });
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

  const allCategoriesReviewed = REVIEW_CATEGORIES.every(cat => isCategoryReviewed(String(cat.key)));
  const reviewedCategoriesCount = REVIEW_CATEGORIES.filter(cat => isCategoryReviewed(String(cat.key))).length;
  const reviewProgress = (reviewedCategoriesCount / REVIEW_CATEGORIES.length) * 100;

  const getReviewerName = (review: PeerReviewWithProfile) => {
    if (review.reviewerId === "AI") return "AI";
    return review.reviewerName || "Anonymous Student";
  };

  const renderHighlightedText = (text: string) => {
    if (!viewingReviewId) return <span>{text}</span>;
    const viewingReview = reviews.find(r => r.id === viewingReviewId);
    if (!viewingReview || viewingReview.corrections.length === 0) return <span>{text}</span>;

    const sortedCorrections = [...viewingReview.corrections].sort((a, b) => a.textStartIndex - b.textStartIndex);
    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    sortedCorrections.forEach((correction, idx) => {
      if (correction.textStartIndex > lastIndex) {
        segments.push(<span key={`text-${idx}`}>{text.substring(lastIndex, correction.textStartIndex)}</span>);
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
    if (lastIndex < text.length) segments.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    return <>{segments}</>;
  };

  if (!match || !essayId) return <div>{t('essay_detail.not_found')}</div>;

  if (essayLoading) return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (<div key={i} className="h-4 bg-muted rounded w-full"></div>))}
        </div>
      </div>
    </div>
  );

  const isAuthor = user?.id === essayData?.authorId;
  const myCurrentScore = hasCustomRubric 
    ? Object.values(rubricScores).reduce((sum, score) => sum + score, 0)
    : Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
  const maxScore = hasCustomRubric
    ? REVIEW_CATEGORIES.reduce((sum, cat) => sum + (cat.maxScore || 200), 0)
    : 1200;

  const aiReview = reviews.find(r => r.reviewerId === "AI");
  const humanReviewsCount = essayData?.reviewCount || 0;

  let headerScore = 0;
  let headerLabel = "";

  if (viewingReviewId) {
    const vr = reviews.find(r => r.id === viewingReviewId);
    headerScore = vr ? vr.overallScore : 0;
    headerLabel = t('essay_detail.scores.selected_review');
  } else if (!isAuthor && !isReviewSubmitted) {
    headerScore = myCurrentScore;
    headerLabel = t('essay_detail.scores.current_score');
  } else {
    if ((essayData?.averageScore || 0) === 0 && aiReview) {
      headerScore = aiReview.overallScore;
      headerLabel = t('essay_detail.comments.ai_label');
    } else {
      headerScore = essayData?.averageScore || 0;
      headerLabel = humanReviewsCount > 0 
        ? t('essay_detail.scores.average', { count: humanReviewsCount }) 
        : (aiReview ? t('essay_detail.comments.ai_label') : t('essay_detail.scores.no_reviews'));
    }
  }

  // --- COMPONENTE ISOLADO DO PAINEL DE REVISÃO ---
const ReviewFormContent = (
    <div className="space-y-4">
      {isAuthor ? (
        <Card className="border-0 shadow-none">
          <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />{t('essay_detail.panel.your_essay_title')}</CardTitle></CardHeader>
          <CardContent><div className="text-sm text-muted-foreground text-center py-8"><p className="mb-2">{t('essay_detail.panel.this_is_your_essay')}</p><p>{t('essay_detail.panel.your_essay_desc')}</p></div></CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />{t('essay_detail.panel.peer_review_title')}</CardTitle>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('essay_detail.panel.progress', { reviewed: reviewedCategoriesCount, total: REVIEW_CATEGORIES.length })}</span>
                <span>{Math.round(reviewProgress)}%</span>
              </div>
              <Progress value={reviewProgress} className="h-2" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                {REVIEW_CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.key} value={cat.key} className="text-xs py-2 relative" data-testid={`tab-${cat.key}`}>
                    <span className="flex items-center gap-1">
                      {cat.label.split(' ')[0]}
                      {isCategoryReviewed(String(cat.key)) && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {REVIEW_CATEGORIES.map((category) => {
                const cMax = category.maxScore || 200;
                const cScore = hasCustomRubric ? (rubricScores[category.key] ?? Math.floor(cMax / 2)) : (categoryScores[category.key] ?? 100);
                return (
                  <TabsContent key={category.key} value={category.key} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                        <Badge className={category.color}>{cScore}/{cMax}</Badge>
                      </div>
                      <Slider
                        value={[cScore]}
                        max={cMax}
                        min={0}
                        step={Math.max(1, Math.floor(cMax / 20))}
                        className="w-full"
                        disabled={isReviewSubmitted}
                        onValueChange={(val) => !isReviewSubmitted && (hasCustomRubric ? setRubricScores(p => ({ ...p, [category.key]: val[0] })) : setCategoryScores(p => ({ ...p, [category.key]: val[0] })))}
                        data-testid={`slider-${category.key}`}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">{t('essay_detail.panel.comment_instruction')}</div>
                      {selectedText && <div className="p-3 bg-muted rounded-lg"><div className="text-sm font-medium mb-1">{t('essay_detail.comments.selected_text_label')}</div><div className="text-sm italic">"{selectedText}"</div></div>}
                      <Textarea value={correctionComment} onChange={(e) => setCorrectionComment(e.target.value)} placeholder={isReviewSubmitted ? t('essay_detail.panel.placeholder_locked') : t('essay_detail.panel.placeholder_active')} className="min-h-[80px]" disabled={isReviewSubmitted} data-testid={`comment-${category.key}`} />
                      <Button onClick={handleSubmitCorrection} disabled={isReviewSubmitted || !correctionComment.trim() || addCorrectionMutation.isPending} className="w-full" size="sm" data-testid={`add-correction-${category.key}`}>
                        {addCorrectionMutation.isPending ? t('essay_detail.panel.btn_adding') : isReviewSubmitted ? t('essay_detail.panel.btn_submitted') : t('essay_detail.panel.btn_add')}
                      </Button>
                    </div>
                    {getCategoryCorrections(String(category.key)).length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{t('essay_detail.comments.your_comments')} ({getCategoryCorrections(String(category.key)).length})</div>
                          {getCategoryCorrections(String(category.key)).map((correction, idx) => (
                            <div key={idx} className="p-2 bg-muted/50 rounded text-xs">
                              {correction.selectedText && <div className="italic mb-1">"{correction.selectedText}"</div>}
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
            <div className="mt-6 pt-4 border-t space-y-3">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">{headerScore}/{maxScore}</div>
                <div className="text-xs text-muted-foreground">{t('essay_detail.scores.overall')} ({Math.round((headerScore / maxScore) * 100)}%)</div>
              </div>
              {isReviewSubmitted ? <div className="text-xs text-green-600 text-center font-medium">{t('essay_detail.panel.msg_locked')}</div> : !allCategoriesReviewed ? <div className="text-xs text-destructive text-center">{t('essay_detail.panel.msg_incomplete')}</div> : null}
              <Button onClick={handleSubmitReview} disabled={isReviewSubmitted || !allCategoriesReviewed || getOrCreateReviewMutation.isPending} className="w-full" data-testid="submit-review">
                {isReviewSubmitted ? t('essay_detail.panel.submit_locked') : getOrCreateReviewMutation.isPending ? t('essay_detail.panel.submit_loading') : t('essay_detail.panel.submit_action')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // 2. APENAS A LISTA DE REVIEWS DA COMUNIDADE
const CommunityReviewsList = reviews.length > 0 ? (
    // Restauramos as classes padrão do Card (fundo branco/escuro, bordas e sombras)
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />{t('essay_detail.community_reviews.title')} ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reviews.map((review) => {
            const isActive = viewingReviewId === review.id;
            const isAI = review.reviewerId === "AI";
            return (
              <div key={review.id} className={`p-3 border rounded-lg cursor-pointer transition-all bg-card ${isActive ? 'border-primary bg-primary/5' : 'hover:border-primary/50'} ${isAI ? 'border-blue-300 dark:border-blue-700' : ''}`} onClick={() => setViewingReviewId(isActive ? null : review.id)} data-testid={`review-card-${review.id}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    {isAI ? (
                      <><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">🤖 {t('essay_detail.comments.ai_label')}</span>{isActive && <span className="text-primary">({t('essay_detail.comments.viewing')})</span>}</>
                    ) : (
                      <>{t('essay_detail.comments.reviewer')} {getReviewerName(review)} {isActive && <span className="text-primary">({t('essay_detail.comments.viewing')})</span>}</>
                    )}
                  </div>
                  <Badge variant={isActive ? "default" : "outline"}>{hasCustomRubric ? (review.rubricScores ? `${review.rubricScores.reduce((s, r) => s + r.score, 0)}/${maxScore}` : `${review.overallScore}/${maxScore}`) : `${review.overallScore}/1200`}</Badge>
                </div>
                {hasCustomRubric ? (
                  review.rubricScores ? (
                    <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                      {review.rubricScores.map((rs, idx) => (
                        <div key={idx} className="truncate" title={rs.categoryName}>{rs.categoryName}: {rs.score}/{rs.maxScore}</div>
                      ))}
                    </div>
                  ) : <div className="text-xs text-muted-foreground mb-2">{t('essay_detail.scores.custom_missing')}</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                    <div>{t('essay_detail.categories.grammar.label').split(' ')[0]}: {review.grammarScore}/200</div>
                    <div>{t('essay_detail.categories.style.label').split(' ')[0]}: {review.styleScore}/200</div>
                    <div>{t('essay_detail.categories.clarity.label').split(' ')[0]}: {review.clarityScore}/200</div>
                    <div>{t('essay_detail.categories.structure.label').split(' ')[0]}: {review.structureScore}/200</div>
                    <div>{t('essay_detail.categories.content.label').split(' ')[0]}: {review.contentScore}/200</div>
                    <div>{t('essay_detail.categories.research.label').split(' ')[0]}: {review.researchScore}/200</div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  {review.corrections.length > 0 && <div className="text-xs text-muted-foreground">{t('essay_detail.comments.count', { count: review.corrections.length })}</div>}
                  {!review.corrections.length && <div />}
                  <Button variant="ghost" size="sm" className={`h-7 px-2 ${reviewLikes[review.id]?.isLiked ? 'text-red-500' : 'text-muted-foreground'}`} onClick={(e) => { e.stopPropagation(); toggleReviewLikeMutation.mutate(review.id); }} disabled={toggleReviewLikeMutation.isPending} data-testid={`button-like-review-${review.id}`}>
                    <Heart className={`w-4 h-4 mr-1 ${reviewLikes[review.id]?.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-xs">{reviewLikes[review.id]?.count || 0}</span>
                  </Button>
                </div>
              </div>
            );
          })}
          {hasNextPage && (
            <div className="flex justify-center mt-4 pt-2 border-t">
              <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} size="sm" className="w-full">
                {isFetchingNextPage ? (<><Loader2 className="mr-2 h-3 w-3 animate-spin" />{t('essay_detail.community_reviews.loading_more')}</>) : t('essay_detail.community_reviews.load_older')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ) : null;

return (
  <div className="min-h-screen flex flex-col relative pb-[200px] md:pb-8">
    
    {/* CABEÇALHO */}
    <div className="max-w-7xl w-full mx-auto p-4 md:p-6 pb-0">
      <div className="grid grid-cols-[auto_1fr] md:flex md:items-start gap-x-4 gap-y-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="col-span-2 row-start-2 md:col-auto md:row-auto md:flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold break-words">{essayData?.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback>{essayData?.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
              </Avatar>
              {isAuthor ? (
                <span className="font-medium text-sm pl-2">{essayData?.authorName}</span>
              ) : (
                <Link href={`/profile/${essayData?.authorId}`}>
                  <Button variant="ghost" size="sm" className="font-medium hover:text-primary p-0 h-auto ml-2">{essayData?.authorName}</Button>
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Calendar className="w-4 h-4" />
              <span>{essayData ? new Date(essayData.createdAt).toLocaleDateString(i18n.language) : ''}</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Eye className="w-4 h-4" />
              <span>{t('essay.words_count', { count: essayData?.wordCount })}</span>
            </div>
          </div>
        </div>

        <div className="col-start-2 row-start-1 justify-self-end md:col-auto md:row-auto md:justify-self-auto md:ml-auto text-right pl-2">
          <div className="text-2xl font-bold text-primary">{headerScore}/{maxScore}</div>
          <div className="text-sm text-muted-foreground">{headerLabel}</div>
        </div>
      </div>
    </div>

    {/* ÁREA PRINCIPAL: GRID CSS */}
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 flex-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-6 items-start pb-8">
      
      {/* LINHA 1, COLUNA 1: Texto da Redação */}
      <div className="row-start-1 col-start-1 min-w-0">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('essay_detail.content.title')}</CardTitle>
              {viewingReviewId && (
                <Button variant="outline" size="sm" onClick={() => setViewingReviewId(null)} data-testid="clear-highlights">
                  {t('essay_detail.content.clear_highlights')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div id="essay-content" className="prose dark:prose-invert max-w-none break-words leading-relaxed whitespace-pre-wrap cursor-text" onMouseUp={handleTextSelection} onTouchEnd={handleTextSelection} data-testid="essay-content">
              {essayData?.content && renderHighlightedText(essayData.content)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LINHA 2, COLUNA 1: Destaques de Erros */}
      <div className="row-start-2 col-start-1 min-w-0 space-y-4">
        {(() => {
          const reviewsToShow = viewingReviewId ? reviews.filter(r => r.id === viewingReviewId) : reviews;
          const hasComments = reviewsToShow.some(r => r.corrections.length > 0);
          if (!hasComments) return null;
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {viewingReviewId ? t('essay_detail.comments.selected_title') : t('essay_detail.comments.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {reviewsToShow.map((review) => {
                    if (review.corrections.length === 0) return null;
                    return (
                      <div key={review.id} className="space-y-3 pb-4 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">
                            {t('essay_detail.comments.reviewer')}: {review.reviewerId === "AI" || review.reviewerId === user?.id ? (
                              getReviewerName(review)
                            ) : (
                              <Link href={`/profile/${review.reviewerId}`}>
                                <Button variant="ghost" size="sm" className="font-medium hover:text-primary p-0 h-auto ml-1">{getReviewerName(review)}</Button>
                              </Link>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('essay_detail.scores.overall')}: {hasCustomRubric ? (review.rubricScores ? `${review.rubricScores.reduce((sum, rs) => sum + rs.score, 0)}/${maxScore}` : `${review.overallScore}/${maxScore}`) : `${review.overallScore}/1200`}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {REVIEW_CATEGORIES.map((cat) => {
                            const categoryCorrections = review.corrections.filter(c => c.category === cat.key);
                            if (categoryCorrections.length === 0) return null;
                            return (
                              <div key={cat.key} className="space-y-2">
                                <Badge className={cat.color + " text-xs"}>{cat.label}</Badge>
                                <div className="space-y-2 pl-3">
                                  {categoryCorrections.map((correction, idx) => (
                                    <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
                                      {correction.selectedText && <div className="italic mb-1">"{correction.selectedText}"</div>}
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

        {/* Comunidade no Mobile */}
        <div className="md:hidden mt-4">
          {CommunityReviewsList}
        </div>
      </div>

      {/* COLUNA 2: Injetamos o Drawer que gerencia as posições sobrepostas */}
      {!isMobile && (
        <DesktopReviewDrawer 
          reviewForm={ReviewFormContent}
          communityReviews={CommunityReviewsList}
        />
      )}

    </div>

    {/* DRAWER MOBILE */}
    {isMobile && (
      <MobileReviewDrawer>
        {ReviewFormContent}
      </MobileReviewDrawer>
    )}

  </div>
);
}