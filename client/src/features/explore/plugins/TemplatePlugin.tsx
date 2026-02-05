import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutTemplate, Heart, Bookmark, ChevronRight, Trash2 } from "lucide-react";
import { type TemplatePayload } from "@shared/schema";
import type { ExplorePlugin, CardProps, DetailProps, CreateFormProps, PluginUtils } from "../types";
import type { ExploreItem } from "@shared/schema";
import { useState, useEffect } from "react";
import { Link } from "wouter";

const colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";

const renderTemplatePreview = (content: string) => {
  const parts = content.split(/(\[[^\]]+\])/g);
  return parts.map((part, index) => {
    if (part.match(/^\[[^\]]+\]$/)) {
      return (
        <span key={index} className="bg-primary/20 text-primary px-1 rounded font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
};

const handleUseTemplate = (item: ExploreItem, utils: Pick<PluginUtils, "navigate" | "toast">) => {
  const payload = item.payload as TemplatePayload;
  localStorage.setItem("selectedTemplate", JSON.stringify({
    title: item.title,
    content: payload.templateContent,
  }));
  localStorage.removeItem("selectedRubric");
  utils.toast({
    title: "Template loaded",
    description: "Fill in the template to write your essay!",
  });
  utils.navigate("/?section=write&t=" + Date.now());
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const TemplateCard = ({ item, utils }: CardProps) => {
  const payload = item.payload as TemplatePayload;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-template-${item.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className={colorClass}>
            <LayoutTemplate className="w-3 h-3 mr-1" />
            Template
          </Badge>
          {item.isFeatured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-muted-foreground mb-2">{item.subtitle}</p>}
        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded mb-3 whitespace-pre-wrap">
          {renderTemplatePreview(payload.templateContent)}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          {item.authorId && item.authorName ? (
            <Link
              href={`/profile/${item.authorId}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs">
                  {getInitials(item.authorName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{item.authorName}</span>
            </Link>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(e) => { e.stopPropagation(); utils.toggleLike(item.id); }}
              data-testid={`btn-like-${item.id}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {item.likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(e) => { e.stopPropagation(); utils.toggleSave(item.id); }}
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

const TemplateDetail = ({ item, utils, isOwner }: DetailProps) => {
  const payload = item.payload as TemplatePayload;

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg border border-border max-h-[50vh] overflow-y-auto">
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {renderTemplatePreview(payload.templateContent)}
        </div>
      </div>
      {item.authorId && item.authorName && (
        <div>
          <Link
            href={`/profile/${item.authorId}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit"
          >
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {getInitials(item.authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{item.authorName}</span>
          </Link>
        </div>
      )}
      <div className="flex justify-between pt-4">
        <div>
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => utils.deleteItem(item.id)}
              data-testid="btn-delete-item"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
        <Button
          onClick={() => handleUseTemplate(item, utils)}
          data-testid="btn-use-item"
        >
          <ChevronRight className="w-4 h-4 mr-1" />
          Use This
        </Button>
      </div>
    </div>
  );
};

const TemplateForm = ({ onChange, initialData }: CreateFormProps) => {
  const [templateContent, setTemplateContent] = useState(initialData?.templateContent || "");

  useEffect(() => {
    const gapMarkers = (templateContent.match(/\[([^\]]+)\]/g) || []).map((m: string) => ({
      placeholder: m,
      hint: "",
    }));
    onChange({ templateContent, gapMarkers });
  }, [templateContent, onChange]);

  return (
    <div className="space-y-2">
      <Label>Template Content</Label>
      <p className="text-xs text-muted-foreground">
        Use [brackets] for fill-in sections, e.g., "The [topic] is important because [reason]."
      </p>
      <Textarea
        placeholder="Write your template here with [placeholders] for fill-in sections..."
        value={templateContent}
        onChange={(e) => setTemplateContent(e.target.value)}
        rows={8}
      />
      {templateContent && (
        <div className="text-sm">
          <span className="font-medium">Preview:</span>
          <div className="mt-1 p-2 bg-muted rounded">
            {renderTemplatePreview(templateContent)}
          </div>
        </div>
      )}
    </div>
  );
};

export const TemplatePlugin: ExplorePlugin<TemplatePayload> = {
  type: "template",
  label: "Templates",
  icon: LayoutTemplate,
  colorClass,
  CardComponent: TemplateCard,
  DetailComponent: TemplateDetail,
  CreateFormComponent: TemplateForm,
  validatePayload: (payload) => !!payload.templateContent?.trim(),
  buildPayload: (formData) => ({
    templateContent: formData.templateContent || "",
    gapMarkers: formData.gapMarkers || [],
  }),
  onUse: handleUseTemplate,
};
