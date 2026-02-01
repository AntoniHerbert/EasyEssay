import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Essay, type CommunityTopic, type RubricCategory, ESSAY_TYPES, type EssayType } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Wand2, ArrowLeft, X, ListChecks, LayoutTemplate } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/auth-context";

const DEFAULT_RUBRIC: RubricCategory[] = [
  { id: 'grammar', name: 'Grammar', maxScore: 200, description: 'Spelling, punctuation, syntax' },
  { id: 'style', name: 'Style', maxScore: 200, description: 'Writing style, tone, word choice' },
  { id: 'clarity', name: 'Clarity', maxScore: 200, description: 'Sentence structure, transitions' },
  { id: 'structure', name: 'Structure', maxScore: 200, description: 'Logical flow, paragraph organization' },
  { id: 'content', name: 'Content', maxScore: 200, description: 'Argument strength, evidence, depth' },
  { id: 'research', name: 'Research', maxScore: 200, description: 'Sources, citations, support' },
];

interface SelectedRubric {
  name: string;
  categories: RubricCategory[];
  essayType?: string | null;
}

interface EssayEditorProps {
  essayId?: string;
  onEssayChange?: (essay: Essay) => void;
}

interface TemplatePart {
  type: 'static' | 'blank';
  content: string;
  placeholder?: string;
}

export function EssayEditor({ essayId, onEssayChange }: EssayEditorProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmittingToTopic, setIsSubmittingToTopic] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<SelectedRubric | null>(null);
  const [selectedEssayType, setSelectedEssayType] = useState<EssayType | "">("");
  const [templateMode, setTemplateMode] = useState(false);
  const [templateParts, setTemplateParts] = useState<TemplatePart[]>([]);
  const [templateDismissed, setTemplateDismissed] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const searchParams = new URLSearchParams(searchString);
  const topicId = searchParams.get("topicId");
  const communityId = searchParams.get("communityId");
  const prefillTitle = searchParams.get("title");
  const prefillContent = searchParams.get("content");
  const prompt = searchParams.get("prompt");
  
  const { data: topic } = useQuery<CommunityTopic>({
    queryKey: ["/api/topics", topicId],
    enabled: !!topicId,
  });

  const { data: essay } = useQuery({
    queryKey: [`/api/essays/${essayId}`],
    enabled: !!essayId,
  });

  useEffect(() => {
    if (essay && typeof essay === 'object' && 'title' in essay && 'content' in essay) {
      setTitle(essay.title as string);
      setContent(essay.content as string);
      const savedEssayType = (essay as Essay).essayType;
      if (savedEssayType && ESSAY_TYPES.includes(savedEssayType as EssayType)) {
        setSelectedEssayType(savedEssayType as EssayType);
      }
      onEssayChange?.(essay as Essay);
    }
  }, [essay, onEssayChange]);

  const parseTemplateContent = (templateContent: string): TemplatePart[] => {
    const parts: TemplatePart[] = [];
    const regex = /(\[[^\]]+\])/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(templateContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'static',
          content: templateContent.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'blank',
        content: '',
        placeholder: match[1].slice(1, -1),
      });
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < templateContent.length) {
      parts.push({
        type: 'static',
        content: templateContent.slice(lastIndex),
      });
    }
    
    return parts;
  };

  useEffect(() => {
    if (!essayId && !essay && !templateDismissed) {
      if (prefillTitle && !title) {
        setTitle(prefillTitle);
      }
      if (prefillContent && !content) {
        const hasPlaceholders = /\[[^\]]+\]/.test(prefillContent);
        if (hasPlaceholders) {
          setTemplateMode(true);
          setTemplateParts(parseTemplateContent(prefillContent));
        } else {
          setContent(prefillContent);
        }
      }
    }
  }, [prefillTitle, prefillContent, essayId, essay, title, content, templateDismissed]);

  useEffect(() => {
    if (!essayId) {
      const storedRubric = localStorage.getItem("selectedRubric");
      if (storedRubric) {
        try {
          const parsed = JSON.parse(storedRubric) as SelectedRubric;
          setSelectedRubric(parsed);
          if (parsed.essayType && ESSAY_TYPES.includes(parsed.essayType as EssayType)) {
            setSelectedEssayType(parsed.essayType as EssayType);
          }
        } catch {
          localStorage.removeItem("selectedRubric");
        }
      }
    }
  }, [essayId]);

  const clearRubric = () => {
    setSelectedRubric(null);
    localStorage.removeItem("selectedRubric");
  };

  const clearTemplate = () => {
    const finalContent = buildContentFromTemplate;
    setContent(finalContent);
    setTemplateMode(false);
    setTemplateParts([]);
    setTemplateDismissed(true);
  };

  const updateBlankContent = (index: number, value: string) => {
    const updated = [...templateParts];
    updated[index] = { ...updated[index], content: value };
    setTemplateParts(updated);
  };

  const buildContentFromTemplate = useMemo(() => {
    if (!templateMode) return content;
    return templateParts.map(part => 
      part.type === 'static' ? part.content : part.content || `[${part.placeholder}]`
    ).join('');
  }, [templateMode, templateParts, content]);

  const wordCount = (templateMode ? buildContentFromTemplate : content).trim().split(/\s+/).filter(word => word.length > 0).length;

  const { data: userProfile } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id,
  });

  const saveEssayMutation = useMutation({
    mutationFn: async () => {
      const finalContent = templateMode ? buildContentFromTemplate : content;
      
      const rubric = selectedRubric ? selectedRubric.categories : DEFAULT_RUBRIC;
      const rubricName = selectedRubric ? selectedRubric.name : "Standard";
      
      const essayData: Record<string, unknown> = {
        title: title || t('editor.untitled'),
        content: finalContent,
        isPublic: false,
        rubric,
        rubricName,
        essayType: selectedEssayType || null,
      };

      if (essayId) {
        return apiRequest("PUT", `/api/essays/${essayId}`, essayData);
      } else {
        return apiRequest("POST", "/api/essays", essayData);
      }
    },
    onSuccess: async (response) => {
      const savedEssay = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      onEssayChange?.(savedEssay);
      toast({
        title: t('editor.toast.saved_title'),
        description: t('editor.toast.saved_desc'),
      });
    },
    onError: () => {
      toast({
        title: t('editor.toast.save_failed_title'),
        description: t('editor.toast.save_failed_desc'),
        variant: "destructive",
      });
    },
  });

  const analyzeEssayMutation = useMutation({
    mutationFn: async (data: { id: string }) => {
      return apiRequest("POST", `/api/essays/${data.id}/analyze`);
    },
    onSuccess: async (response, variables) => {
      const aiReview = await response.json();
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}/peer-reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/essays/${essayId}`] });
      
      toast({
        title: t('editor.toast.analysis_complete'),
        description: t('editor.toast.analysis_desc', { count: aiReview.corrections?.length || 0 }),
      });

      setTimeout(() => {
        setLocation(`/essay/${variables.id}`);
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: t('editor.toast.analysis_failed'),
        description: error.message || t('editor.toast.analysis_failed_default'),
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = async () => {
    const finalContent = templateMode ? buildContentFromTemplate : content;
    if (!title.trim() || !finalContent.trim()) {
      toast({
        title: t('editor.toast.content_req_title'),
        description: t('editor.toast.content_req_desc'),
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let currentEssayId = essayId;
      
      const rubric = selectedRubric ? selectedRubric.categories : DEFAULT_RUBRIC;
      const rubricName = selectedRubric ? selectedRubric.name : "Standard";
      
      const essayData: Record<string, unknown> = {
        title: title || t('editor.untitled'),
        content: finalContent,
        isPublic: false,
        rubric,
        rubricName,
        essayType: selectedEssayType || null,
      };
      
      if (!currentEssayId) {
        const saveResponse = await apiRequest("POST", "/api/essays", essayData);
        const savedEssay = await saveResponse.json();
        currentEssayId = savedEssay.id;
        onEssayChange?.(savedEssay);
      } else {
        await apiRequest("PUT", `/api/essays/${currentEssayId}`, essayData);
      }

      await analyzeEssayMutation.mutateAsync({ id: currentEssayId! });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitToTopic = async () => {
    const finalContent = templateMode ? buildContentFromTemplate : content;
    if (!title.trim() || !finalContent.trim()) {
      toast({
        title: t('editor.toast.content_req_title'),
        description: t('editor.toast.submit_req_desc'),
        variant: "destructive",
      });
      return;
    }

    if (!topicId) return;

    setIsSubmittingToTopic(true);

    try {
      await apiRequest("POST", `/api/topics/${topicId}/submissions`, {
        title: title || t('editor.untitled'),
        content: finalContent,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "submissions"] });
      
      toast({
        title: t('editor.toast.submitted_title'),
        description: t('editor.toast.submitted_desc'),
      });

      setTimeout(() => {
        setLocation(`/?section=community&communityId=${communityId}&topicId=${topicId}`);
      }, 1000);
    } catch (error) {
      toast({
        title: t('editor.toast.submit_failed_title'),
        description: t('editor.toast.submit_failed_desc'),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingToTopic(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border border-border overflow-hidden">
      {topicId && topic && (
        <div className="p-3 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation(`/?section=community&communityId=${communityId}&topicId=${topicId}`)}
              data-testid="button-back-to-topic"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t('editor.back')}
            </Button>
            <div>
              <span className="text-sm text-muted-foreground">{t('editor.topic_context')}</span>
              <Badge variant="secondary" className="ml-2">{topic.title}</Badge>
            </div>
          </div>
          <Button
            onClick={handleSubmitToTopic}
            disabled={isSubmittingToTopic || !title.trim() || !(templateMode ? buildContentFromTemplate : content).trim()}
            data-testid="button-submit-to-topic"
          >
            {isSubmittingToTopic ? t('editor.submitting') : t('editor.submit_topic')}
          </Button>
        </div>
      )}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t('editor.header')}</h2>
        <Select 
          value={selectedEssayType} 
          onValueChange={(v) => setSelectedEssayType(v as EssayType)}
          disabled={!!selectedRubric}
        >
          <SelectTrigger className="w-[200px]" data-testid="select-essay-type">
            <SelectValue placeholder={t('editor.essay_type_select')} />
          </SelectTrigger>
          <SelectContent>
            {ESSAY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`editor.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <Input
            type="text"
            placeholder={t('editor.placeholders.title')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none shadow-none text-foreground placeholder-muted-foreground px-0"
            data-testid="input-title"
          />
        </div>
        
        {templateMode ? (
          <div className="space-y-0" data-testid="template-editor">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">{t('editor.template_mode')}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearTemplate}
                data-testid="btn-clear-template"
              >
                <X className="w-3 h-3 mr-1" />
                {t('editor.exit_template')}
              </Button>
            </div>
            <div className="min-h-[400px] text-base leading-relaxed">
              {templateParts.map((part, index) => (
                part.type === 'static' ? (
                  <span
                    key={index}
                    className="bg-muted/60 text-muted-foreground select-none px-1 rounded whitespace-pre-wrap"
                    style={{ cursor: 'default' }}
                  >
                    {part.content}
                  </span>
                ) : (
                  <span key={index} className="inline-block align-baseline">
                    <input
                      type="text"
                      value={part.content}
                      onChange={(e) => updateBlankContent(index, e.target.value)}
                      placeholder={part.placeholder}
                      className="inline-block min-w-[120px] max-w-[300px] px-2 py-0.5 mx-0.5 bg-amber-50 dark:bg-amber-900/30 border-2 border-dashed border-amber-400 dark:border-amber-600 rounded text-amber-900 dark:text-amber-100 placeholder:text-amber-400 dark:placeholder:text-amber-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      style={{ width: `${Math.max(120, (part.content || part.placeholder || '').length * 10)}px` }}
                      data-testid={`template-blank-${index}`}
                    />
                  </span>
                )
              ))}
            </div>
          </div>
        ) : (
          <Textarea
            placeholder={t('editor.placeholders.content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] text-base leading-relaxed bg-transparent border-none shadow-none resize-none px-0"
            data-testid="textarea-content"
          />
        )}
      </CardContent>
      
      {!topicId && (
        <div className="px-6 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('editor.words', { count: wordCount })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveEssayMutation.mutate()}
              disabled={saveEssayMutation.isPending}
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveEssayMutation.isPending ? t('editor.saving') : t('editor.save')}
            </Button>
            <Button
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !(templateMode ? buildContentFromTemplate : content).trim()}
              data-testid="button-analyze"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isAnalyzing ? t('editor.analyzing') : t('editor.analyze')}
            </Button>
          </div>
        </div>
      )}
      
      {selectedRubric && (
        <div className="px-6 py-3 bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                {t('editor.rubric_label', { name: selectedRubric.name })}
                {selectedRubric.essayType && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t(`editor.types.${selectedRubric.essayType}`)}
                  </Badge>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800 dark:text-purple-400"
              onClick={clearRubric}
              data-testid="btn-clear-rubric"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedRubric.categories.map((cat, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
              >
                {cat.name}: {cat.maxScore} pts
              </Badge>
            ))}
          </div>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
            {t('editor.rubric_desc')}
          </p>
        </div>
      )}
    </Card>
  );
}