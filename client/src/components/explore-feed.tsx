import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ExploreItem, type ExploreContentType, type CategoryListPayload, type EssayTopicPayload, type QuotePayload, type TemplatePayload, type CategoryItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Search, Plus, Heart, Bookmark, BookOpen, FileText, Quote, LayoutTemplate, ListChecks, User, Trash2, ChevronRight, X, Copy } from "lucide-react";

interface ExploreItemWithStatus extends ExploreItem {
  isLiked?: boolean;
  isSaved?: boolean;
}

type FilterType = 'all' | 'my_content' | 'saved' | ExploreContentType;

const CONTENT_TYPE_CONFIG: Record<ExploreContentType, { icon: typeof ListChecks; color: string }> = {
  category_list: { icon: ListChecks, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  essay_topic: { icon: FileText, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  quote: { icon: Quote, color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  template: { icon: LayoutTemplate, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

export function ExploreFeed() {
  const { t } = useTranslation(); // <--- Hook
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<ExploreContentType>("essay_topic");
  const [selectedItem, setSelectedItem] = useState<ExploreItemWithStatus | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newQuoteAuthor, setNewQuoteAuthor] = useState("");
  const [newQuoteSource, setNewQuoteSource] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [newCategories, setNewCategories] = useState<CategoryItem[]>([{ name: "", maxScore: 100 }]);

  const { data: exploreItems = [], isLoading } = useQuery<ExploreItemWithStatus[]>({
    queryKey: ["/api/explore"],
  });

  const { data: savedItems = [] } = useQuery<ExploreItemWithStatus[]>({
    queryKey: ["/api/explore/saved"],
    enabled: activeFilter === 'saved',
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { type: ExploreContentType; title: string; subtitle?: string; payload: any }) => {
      return apiRequest("POST", "/api/explore", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: t('explore.toast.created'), description: t('explore.toast.created_desc') });
    },
    onError: () => {
      toast({ title: t('explore.toast.create_failed'), description: t('explore.toast.create_failed_desc'), variant: "destructive" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/explore/${itemId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/explore/saved"] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/explore/${itemId}/save`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      queryClient.invalidateQueries({ queryKey: ["/api/explore/saved"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/explore/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      setSelectedItem(null);
      toast({ title: t('explore.toast.deleted'), description: t('explore.toast.deleted_desc') });
    },
  });

  const resetForm = () => {
    setNewTitle("");
    setNewSubtitle("");
    setNewDescription("");
    setNewQuoteAuthor("");
    setNewQuoteSource("");
    setNewTemplateContent("");
    setNewCategories([{ name: "", maxScore: 100 }]);
  };

  const handleCreate = () => {
    let payload: any;
    
    switch (createType) {
      case "category_list":
        payload = { categories: newCategories.filter(c => c.name.trim()) };
        break;
      case "essay_topic":
        payload = { description: newDescription };
        break;
      case "quote":
        payload = { author: newQuoteAuthor, source: newQuoteSource || undefined };
        break;
      case "template":
        const gapMarkers = (newTemplateContent.match(/\[([^\]]+)\]/g) || []).map(m => ({
          placeholder: m,
          hint: "",
        }));
        payload = { templateContent: newTemplateContent, gapMarkers };
        break;
    }

    createItemMutation.mutate({
      type: createType,
      title: newTitle,
      subtitle: newSubtitle || undefined,
      payload,
    });
  };

  const getFilteredItems = () => {
    let items = activeFilter === 'saved' ? savedItems : exploreItems;
    
    if (activeFilter === 'my_content') {
      items = items.filter(item => item.authorId === user?.id);
    } else if (activeFilter !== 'all' && activeFilter !== 'saved') {
      items = items.filter(item => item.type === activeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        (item.subtitle || "").toLowerCase().includes(query)
      );
    }
    
    return items;
  };

  const filteredItems = getFilteredItems();

  const renderCategoryListCard = (item: ExploreItemWithStatus) => {
    const payload = item.payload as CategoryListPayload;
    const totalScore = payload.categories.reduce((sum, c) => sum + c.maxScore, 0);
    
    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedItem(item)}
        data-testid={`card-category-${item.id}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={CONTENT_TYPE_CONFIG.category_list.color}>
              <ListChecks className="w-3 h-3 mr-1" />
              {t('explore.types.category_list')}
            </Badge>
            {item.isFeatured && <Badge variant="secondary">{t('explore.card.featured')}</Badge>}
          </div>
          <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
          {item.subtitle && <p className="text-sm text-muted-foreground mb-3">{item.subtitle}</p>}
          <div className="flex flex-wrap gap-1 mb-3">
            {payload.categories.slice(0, 4).map((cat, i) => (
              <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{cat.name}</span>
            ))}
            {payload.categories.length > 4 && (
              <span className="text-xs text-muted-foreground">{t('explore.card.more', { count: payload.categories.length - 4 })}</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t('explore.card.total_points', { score: totalScore })}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleLikeMutation.mutate(item.id); }}
                data-testid={`btn-like-${item.id}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {item.likesCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleSaveMutation.mutate(item.id); }}
                data-testid={`btn-save-${item.id}`}
              >
                <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderEssayTopicCard = (item: ExploreItemWithStatus) => {
    const payload = item.payload as EssayTopicPayload;
    
    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setSelectedItem(item)}
        data-testid={`card-topic-${item.id}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={CONTENT_TYPE_CONFIG.essay_topic.color}>
              <FileText className="w-3 h-3 mr-1" />
              {t('explore.types.essay_topic')}
            </Badge>
          </div>
          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          {payload.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{payload.description}</p>
          )}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.authorName}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleLikeMutation.mutate(item.id); }}
                data-testid={`btn-like-${item.id}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {item.likesCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleSaveMutation.mutate(item.id); }}
                data-testid={`btn-save-${item.id}`}
              >
                <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQuoteCard = (item: ExploreItemWithStatus) => {
    const payload = item.payload as QuotePayload;
    
    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-shadow"
        data-testid={`card-quote-${item.id}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={CONTENT_TYPE_CONFIG.quote.color}>
              <Quote className="w-3 h-3 mr-1" />
              {t('explore.types.quote')}
            </Badge>
          </div>
          <blockquote className="text-lg italic mb-3 border-l-4 border-primary/30 pl-4">
            "{item.title}"
          </blockquote>
          <p className="text-sm text-muted-foreground mb-3">— {payload.author}</p>
          {payload.source && (
            <p className="text-xs text-muted-foreground mb-3">{payload.source}</p>
          )}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => {
                navigator.clipboard.writeText(`"${item.title}" — ${payload.author}`);
                toast({ title: t('explore.toast.copied'), description: t('explore.toast.copied_desc') });
              }}
              data-testid={`btn-copy-${item.id}`}
            >
              <Copy className="w-4 h-4 mr-1" />
              {t('explore.card.copy')}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => toggleLikeMutation.mutate(item.id)}
                data-testid={`btn-like-${item.id}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {item.likesCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => toggleSaveMutation.mutate(item.id)}
                data-testid={`btn-save-${item.id}`}
              >
                <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTemplatePreview = (content: string) => {
    const parts = content.split(/(\[[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span key={i} className="inline-block bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 mx-0.5 font-medium text-sm">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderTemplateCard = (item: ExploreItemWithStatus) => {
    const payload = item.payload as TemplatePayload;
    const gapCount = payload.gapMarkers?.length || 0;
    
    return (
      <Card 
        key={item.id} 
        className="hover:shadow-md transition-shadow cursor-pointer h-auto"
        onClick={() => setSelectedItem(item)}
        data-testid={`card-template-${item.id}`}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={CONTENT_TYPE_CONFIG.template.color}>
              <LayoutTemplate className="w-3 h-3 mr-1" />
              {t('explore.types.template')}
            </Badge>
            <div className="flex items-center gap-2">
              {item.isFeatured && <Badge variant="secondary">{t('explore.card.featured')}</Badge>}
              <span className="text-xs bg-muted px-2 py-1 rounded">{t('explore.card.blanks', { count: gapCount })}</span>
            </div>
          </div>
          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          {item.subtitle && <p className="text-sm text-muted-foreground mb-3">{item.subtitle}</p>}
          <div className="bg-muted/50 p-4 rounded-lg border border-border mb-3">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {renderTemplatePreview(payload.templateContent)}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {item.authorName}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleLikeMutation.mutate(item.id); }}
                data-testid={`btn-like-${item.id}`}
              >
                <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                {item.likesCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={(e) => { e.stopPropagation(); toggleSaveMutation.mutate(item.id); }}
                data-testid={`btn-save-${item.id}`}
              >
                <Bookmark className={`w-4 h-4 ${item.isSaved ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCard = (item: ExploreItemWithStatus) => {
    switch (item.type) {
      case 'category_list':
        return renderCategoryListCard(item);
      case 'essay_topic':
        return renderEssayTopicCard(item);
      case 'quote':
        return renderQuoteCard(item);
      case 'template':
        return renderTemplateCard(item);
      default:
        return null;
    }
  };

  const renderItemDetail = () => {
    if (!selectedItem) return null;
    
    const isOwner = selectedItem.authorId === user?.id;
    
    return (
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className={CONTENT_TYPE_CONFIG[selectedItem.type].color}>
                {t(`explore.types.${selectedItem.type}`)}
              </Badge>
              {selectedItem.isFeatured && <Badge variant="secondary">{t('explore.card.featured')}</Badge>}
            </div>
            <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
            {selectedItem.subtitle && (
              <DialogDescription>{selectedItem.subtitle}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            {selectedItem.type === 'category_list' && (
              <div className="space-y-2">
                {(selectedItem.payload as CategoryListPayload).categories.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-muted-foreground">{t('explore.detail.max_score', { score: cat.maxScore })}</span>
                  </div>
                ))}
              </div>
            )}
            
            {selectedItem.type === 'essay_topic' && (
              <p className="text-muted-foreground">
                {(selectedItem.payload as EssayTopicPayload).description || t('explore.detail.no_desc')}
              </p>
            )}
            
            {selectedItem.type === 'template' && (
              <div className="bg-muted/50 p-4 rounded-lg border border-border max-h-[50vh] overflow-y-auto">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {renderTemplatePreview((selectedItem.payload as TemplatePayload).templateContent)}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteItemMutation.mutate(selectedItem.id)}
                  data-testid="btn-delete-item"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t('explore.detail.delete')}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {selectedItem.type !== 'quote' && (
                <Button 
                  data-testid="btn-use-item"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set("section", "write");
                    
                    if (selectedItem.type === 'essay_topic') {
                      params.set("title", selectedItem.title);
                      const payload = selectedItem.payload as EssayTopicPayload;
                      if (payload.description) {
                        params.set("prompt", payload.description);
                      }
                      localStorage.removeItem("selectedRubric");
                      toast({ title: t('explore.toast.topic_loaded'), description: t('explore.toast.topic_loaded_desc') });
                    } else if (selectedItem.type === 'template') {
                      const payload = selectedItem.payload as TemplatePayload;
                      params.set("content", payload.templateContent);
                      localStorage.removeItem("selectedRubric");
                      toast({ title: t('explore.toast.template_loaded'), description: t('explore.toast.template_loaded_desc') });
                    } else if (selectedItem.type === 'category_list') {
                      const payload = selectedItem.payload as CategoryListPayload;
                      localStorage.setItem("selectedRubric", JSON.stringify({
                        name: selectedItem.title,
                        categories: payload.categories
                      }));
                      toast({ 
                        title: t('explore.toast.rubric_selected'), 
                        description: t('explore.toast.rubric_desc', { categories: payload.categories.map(c => c.name).join(", ") })
                      });
                    }
                    
                    setSelectedItem(null);
                    setLocation("/?" + params.toString());
                  }}
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  {t('explore.detail.use_this')}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderCreateDialog = () => (
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('explore.create.title')}</DialogTitle>
          <DialogDescription>{t('explore.create.desc')}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('explore.create.labels.type')}</Label>
            <Select value={createType} onValueChange={(v) => setCreateType(v as ExploreContentType)}>
              <SelectTrigger data-testid="select-create-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essay_topic">{t('explore.types.essay_topic')}</SelectItem>
                <SelectItem value="quote">{t('explore.types.quote')}</SelectItem>
                <SelectItem value="template">{t('explore.types.template')}</SelectItem>
                <SelectItem value="category_list">{t('explore.types.category_list')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{createType === 'quote' ? t('explore.create.labels.quote_text') : t('explore.create.labels.title')}</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={createType === 'quote' ? t('explore.create.placeholders.quote') : t('explore.create.placeholders.title')}
              data-testid="input-create-title"
            />
          </div>
          
          {createType !== 'quote' && (
            <div className="space-y-2">
              <Label>{t('explore.create.labels.subtitle')}</Label>
              <Input
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder={t('explore.create.placeholders.subtitle')}
                data-testid="input-create-subtitle"
              />
            </div>
          )}
          
          {createType === 'essay_topic' && (
            <div className="space-y-2">
              <Label>{t('explore.create.labels.desc')}</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('explore.create.placeholders.desc')}
                data-testid="input-create-description"
              />
            </div>
          )}
          
          {createType === 'quote' && (
            <>
              <div className="space-y-2">
                <Label>{t('explore.create.labels.author')}</Label>
                <Input
                  value={newQuoteAuthor}
                  onChange={(e) => setNewQuoteAuthor(e.target.value)}
                  placeholder={t('explore.create.placeholders.author')}
                  data-testid="input-quote-author"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('explore.create.labels.source')}</Label>
                <Input
                  value={newQuoteSource}
                  onChange={(e) => setNewQuoteSource(e.target.value)}
                  placeholder={t('explore.create.placeholders.source')}
                  data-testid="input-quote-source"
                />
              </div>
            </>
          )}
          
          {createType === 'template' && (
            <div className="space-y-2">
              <Label>{t('explore.create.labels.template')}</Label>
              <Textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                placeholder={t('explore.create.placeholders.template')}
                className="min-h-[200px] font-mono text-sm"
                data-testid="input-template-content"
              />
              <p className="text-xs text-muted-foreground">
                {t('explore.create.hint')}
              </p>
            </div>
          )}
          
          {createType === 'category_list' && (
            <div className="space-y-2">
              <Label>{t('explore.create.labels.categories')}</Label>
              {newCategories.map((cat, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={cat.name}
                    onChange={(e) => {
                      const updated = [...newCategories];
                      updated[i].name = e.target.value;
                      setNewCategories(updated);
                    }}
                    placeholder={t('explore.create.placeholders.category_name')}
                    className="flex-1"
                    data-testid={`input-category-name-${i}`}
                  />
                  <Input
                    type="number"
                    value={cat.maxScore}
                    onChange={(e) => {
                      const updated = [...newCategories];
                      updated[i].maxScore = parseInt(e.target.value) || 100;
                      setNewCategories(updated);
                    }}
                    placeholder={t('explore.create.placeholders.score')}
                    className="w-20"
                    data-testid={`input-category-score-${i}`}
                  />
                  {newCategories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setNewCategories(newCategories.filter((_, j) => j !== i))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewCategories([...newCategories, { name: "", maxScore: 100 }])}
                data-testid="btn-add-category"
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('explore.create.add_category')}
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>{t('explore.create.cancel')}</Button>
          <Button
            onClick={handleCreate}
            disabled={!newTitle.trim() || createItemMutation.isPending}
            data-testid="btn-submit-create"
          >
            {createItemMutation.isPending ? t('explore.create.submitting') : t('explore.create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-muted rounded w-1/3 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-6 bg-muted rounded w-1/4 mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('explore.header.title')}</h2>
          <p className="text-muted-foreground">{t('explore.header.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="mt-4 sm:mt-0" data-testid="btn-create-content">
          <Plus className="w-4 h-4 mr-2" />
          {t('explore.header.create_btn')}
        </Button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('explore.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-explore"
          />
        </div>
        
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-2">
            {[
              { key: 'all' as FilterType, label: t('explore.filters.all') },
              { key: 'my_content' as FilterType, label: t('explore.filters.my_content') },
              { key: 'saved' as FilterType, label: t('explore.filters.saved') },
              { key: 'category_list' as FilterType, label: t('explore.filters.category_list') },
              { key: 'essay_topic' as FilterType, label: t('explore.filters.essay_topic') },
              { key: 'quote' as FilterType, label: t('explore.filters.quote') },
              { key: 'template' as FilterType, label: t('explore.filters.template') },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeFilter === filter.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                data-testid={`filter-${filter.key}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('explore.empty.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || activeFilter !== 'all'
                ? t('explore.empty.desc_search')
                : t('explore.empty.desc_default')}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="btn-create-first">
              <Plus className="w-4 h-4 mr-2" />
              {t('explore.empty.btn_create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => renderCard(item))}
        </div>
      )}

      {renderItemDetail()}
      {renderCreateDialog()}
    </div>
  );
}