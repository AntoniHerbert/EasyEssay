import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next"; 
import i18n from "@/lib/i18n"; 
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Heart, Bookmark, ChevronRight, Trash2 } from "lucide-react";
import { type EssayTopicPayload } from "@shared/schema";
import type { ExplorePlugin, CardProps, DetailProps, CreateFormProps, PluginUtils } from "../types";
import type { ExploreItem } from "@shared/schema";

const colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";

const handleUseTopic = (item: ExploreItem, utils: Pick<PluginUtils, "navigate" | "toast">) => {
  const payload = item.payload as EssayTopicPayload;
  const params = new URLSearchParams();
  
  params.set("section", "write");
  params.set("t", Date.now().toString());
  params.set("title", item.title);
  
  params.set("topicId", item.id);
  
  params.set("source", "explore");

  if (payload.description) {
    params.set("prompt", payload.description);
  }

  localStorage.removeItem("selectedRubric");
  
  utils.toast({
    title: i18n.t('explore.toast.topic_loaded'),
    description: i18n.t('explore.toast.topic_loaded_desc'),
  });
  
  utils.navigate("/?" + params.toString());
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const EssayTopicCard = ({ item, utils }: CardProps) => {
  const { t } = useTranslation();
  const payload = item.payload as EssayTopicPayload;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-topic-${item.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className={colorClass}>
            <FileText className="w-3 h-3 mr-1" />
            {t('explore.types.essay_topic')}
          </Badge>
          {item.isFeatured && <Badge variant="secondary">{t('explore.card.featured')}</Badge>}
        </div>
        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
        {payload.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{payload.description}</p>
        )}
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

const EssayTopicDetail = ({ item, utils, isOwner }: DetailProps) => {
  const { t } = useTranslation(); 
  const payload = item.payload as EssayTopicPayload;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        {payload.description || t('explore.detail.no_desc')}
      </p>
      {item.authorId && item.authorName && (
        <div className="pt-2 border-t border-border">
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
              {t('explore.detail.delete')}
            </Button>
          )}
        </div>
        <Button
          onClick={() => handleUseTopic(item, utils)}
          data-testid="btn-use-item"
        >
          <ChevronRight className="w-4 h-4 mr-1" />
          {t('explore.detail.use_this')}
        </Button>
      </div>
    </div>
  );
};

const EssayTopicForm = ({ onChange, initialData }: CreateFormProps) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState(initialData?.description || "");

  useEffect(() => {
    onChange({ description });
  }, [description, onChange]);

  return (
    <div className="space-y-2">
      <Label>{t('explore.create.labels.desc')}</Label>
      <Textarea
        placeholder={t('explore.create.placeholders.desc')}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
      />
    </div>
  );
};

export const EssayTopicPlugin: ExplorePlugin<EssayTopicPayload> = {
  type: "essay_topic",
  label: "Topics",
  icon: FileText,
  colorClass,
  CardComponent: EssayTopicCard,
  DetailComponent: EssayTopicDetail,
  CreateFormComponent: EssayTopicForm,
  validatePayload: (payload) => !!payload.description?.trim(),
  buildPayload: (formData) => ({
    description: formData.description || "",
  }),
  onUse: handleUseTopic,
};