import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Essay, type CommunityTopic, type RubricCategory } from "@shared/schema";
import { Save, Wand2, ArrowLeft, X, ListChecks, LayoutTemplate } from "lucide-react";
import { useLocation, useSearch, Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { useTranslation } from "react-i18next"; 


interface SelectedRubric {
  name: string;
  categories: RubricCategory[];
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
  const { user } = useAuth();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmittingToTopic, setIsSubmittingToTopic] = useState(false);
  const [selectedRubric, setSelectedRubric] = useState<SelectedRubric | null>(null);
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
      const essayData: Record<string, unknown> = {
        title: title || "Untitled Essay",
        content: finalContent,
        isPublic: false,
      };

      if (selectedRubric) {
        essayData.rubric = selectedRubric.categories;
        essayData.rubricName = selectedRubric.name;
      }

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
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      queryClient.invalidateQueries({ queryKey: [`/api/essays?authorId=${user?.id}`] });
      
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
        const essayData: Record<string, unknown> = {
        title: title || "Untitled Essay",
        content: finalContent,
        isPublic: false,
      };
      
      if (selectedRubric) {
        essayData.rubric = selectedRubric.categories;
        essayData.rubricName = selectedRubric.name;
      }
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
        title: "Content required",
        description: "Please add a title and content before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!topicId) return;

    setIsSubmittingToTopic(true);

    try {
      await apiRequest("POST", `/api/topics/${topicId}/submissions`, {
        title: title || "Untitled Essay",
        content: finalContent,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
      queryClient.invalidateQueries({ queryKey: ["/api/topics", topicId, "submissions"] });
      
      toast({
        title: "Essay submitted!",
        description: "Your essay has been submitted for review.",
      });

      setTimeout(() => {
        setLocation(`/?section=community&communityId=${communityId}&topicId=${topicId}`);
      }, 1000);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit essay. Please try again.",
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
              Back
            </Button>
            <div>
              <span className="text-sm text-muted-foreground">Writing for topic:</span>
              <Badge variant="secondary" className="ml-2">{topic.title}</Badge>
            </div>
          </div>
          <Button
            onClick={handleSubmitToTopic}
            disabled={isSubmittingToTopic || !title.trim() || !(templateMode ? buildContentFromTemplate : content).trim()}
            data-testid="button-submit-to-topic"
          >
            {isSubmittingToTopic ? "Submitting..." : "Submit to Topic"}
          </Button>
        </div>
      )}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">{t('editor.header')}</h2>
          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
            {t('editor.words', { count: wordCount })}
          </span>
        </div>
        <div className="flex items-center space-x-2">

          {!topicId && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveEssayMutation.mutate()}
                disabled={saveEssayMutation.isPending}
                data-testid="button-save"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !(templateMode ? buildContentFromTemplate : content).trim()}
                data-testid="button-analyze"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </>
          )}
        </div>
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
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Template Mode</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearTemplate}
                data-testid="btn-clear-template"
              >
                <X className="w-3 h-3 mr-1" />
                Exit Template
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
            placeholder="Start writing your essay..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] text-base leading-relaxed bg-transparent border-none shadow-none resize-none px-0"
            data-testid="textarea-content"
          />
        )}
      </CardContent>
            {selectedRubric && (
        <div className="px-6 py-3 bg-purple-50 dark:bg-purple-950/30 border-t border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Scoring Rubric: {selectedRubric.name}
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
            AI and community reviewers will score your essay on these categories.
          </p>
        </div>
      )}
    </Card>
  );
}
