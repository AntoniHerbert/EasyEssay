import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Essay } from "@shared/schema";
import { Save, Wand2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

interface EssayEditorProps {
  essayId?: string;
  onEssayChange?: (essay: Essay) => void;
}

export function EssayEditor({ essayId, onEssayChange }: EssayEditorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;

  const { data: userProfile } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
    enabled: !!user?.id,
  });

  const saveEssayMutation = useMutation({
    mutationFn: async () => {
      const essayData = {
        title: title || "Untitled Essay",
        content,
        isPublic: false,
      };

      if (essayId) {
        return apiRequest("PUT", `/api/essays/${essayId}`, essayData);
      } else {
        return apiRequest("POST", "/api/essays", essayData);
      }
    },
    onSuccess: async (response) => {
      const savedEssay = await response.json();
      queryClient.invalidateQueries({ queryKey: [`/api/essays?authorId=${user?.id}`] });
      onEssayChange?.(savedEssay);
      toast({
        title: "Essay saved",
        description: "Your essay has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "Failed to save essay. Please try again.",
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
      queryClient.invalidateQueries({ queryKey: [`/api/essays?authorId=${user?.id}`] });
      
      toast({
        title: "AI Analysis complete",
        description: `AI review generated with ${aiReview.corrections?.length || 0} suggestions. Redirecting to view...`,
      });

      setTimeout(() => {
        setLocation(`/essay/${variables.id}`);
      }, 1500);
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze essay. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Content required",
        description: "Please add a title and content before analyzing.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let currentEssayId = essayId;
      if (!currentEssayId) {
        const saveResponse = await apiRequest("POST", "/api/essays", {
          title: title || "Untitled Essay",
          content,
          isPublic: false,
        });
        const savedEssay = await saveResponse.json();
        currentEssayId = savedEssay.id;
        onEssayChange?.(savedEssay);
      }

      await analyzeEssayMutation.mutateAsync({ id: currentEssayId! });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">Essay Editor</h2>
          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
            {wordCount} words
          </span>
        </div>
        <div className="flex items-center space-x-2">
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
            disabled={isAnalyzing || !content.trim()}
            data-testid="button-analyze"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Essay Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent border-none shadow-none text-foreground placeholder-muted-foreground px-0"
            data-testid="input-title"
          />
        </div>
        
        <Textarea
          placeholder="Start writing your essay..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] text-base leading-relaxed bg-transparent border-none shadow-none resize-none px-0"
          data-testid="textarea-content"
        />
      </CardContent>
    </Card>
  );
}
