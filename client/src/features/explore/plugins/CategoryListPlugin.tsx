import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ListChecks, Heart, Bookmark, ChevronRight, Plus, Trash2 } from "lucide-react";
import { type CategoryListPayload, type CategoryItem, ESSAY_TYPES, type EssayType } from "@shared/schema";
import type { ExplorePlugin, CardProps, DetailProps, CreateFormProps, PluginUtils } from "../types";
import type { ExploreItem } from "@shared/schema";

const colorClass = "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";

const handleUseCategory = (item: ExploreItem, utils: Pick<PluginUtils, "navigate" | "toast">) => {
  const payload = item.payload as CategoryListPayload;
  const effectiveEssayType = payload.essayType || null;

  localStorage.setItem("selectedRubric", JSON.stringify({
    name: item.title,
    categories: payload.categories,
    essayType: effectiveEssayType,
  }));
  
  if (effectiveEssayType) {
    localStorage.setItem("selectedEssayType", effectiveEssayType);
  }

  utils.toast({
    title: i18n.t('explore.toast.rubric_selected'),
    description: i18n.t('explore.toast.rubric_desc', { 
      categories: payload.categories.map(c => c.name).join(", ") 
    }),
  });
  utils.navigate("/?section=write&t=" + Date.now());
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const CategoryListCard = ({ item, utils }: CardProps) => {
  const { t } = useTranslation();
  const payload = item.payload as CategoryListPayload;
  const totalScore = payload.categories.reduce((sum, c) => sum + c.maxScore, 0);
  
  const essayType = payload.essayType;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-category-${item.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={colorClass}>
              <ListChecks className="w-3 h-3 mr-1" />
              {t('explore.types.category_list')}
            </Badge>
            {essayType && (
              <Badge variant="outline" className="text-xs">
                {t(`editor.types.${essayType}`)}
              </Badge>
            )}
          </div>
          {item.isFeatured && <Badge variant="secondary">{t('explore.card.featured')}</Badge>}
        </div>
        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
        {item.subtitle && <p className="text-sm text-muted-foreground mb-3">{item.subtitle}</p>}
        <div className="flex flex-wrap gap-1 mb-3">
          {payload.categories.slice(0, 4).map((cat, i) => (
            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{cat.name}</span>
          ))}
          {payload.categories.length > 4 && (
            <span className="text-xs text-muted-foreground">
              {t('explore.card.more', { count: payload.categories.length - 4 })}
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground mb-3">
          {t('explore.card.total_points', { score: totalScore })}
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

const CategoryListDetail = ({ item, utils, isOwner }: DetailProps) => {
  const { t } = useTranslation();
  const payload = item.payload as CategoryListPayload;
  const essayType = payload.essayType;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {essayType && (
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <span className="text-sm text-muted-foreground">{t('explore.create.labels.essay_type_optional').replace('(Optional)', '').trim()}:</span>
            <Badge variant="outline">{t(`editor.types.${essayType}`)}</Badge>
          </div>
        )}
        <div className="space-y-2">
          {payload.categories.map((cat, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">{cat.name}</span>
              <span className="text-sm text-muted-foreground">{t('explore.detail.max_score', { score: cat.maxScore })}</span>
            </div>
          ))}
        </div>
      </div>
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
          onClick={() => handleUseCategory(item, utils)}
          data-testid="btn-use-item"
        >
          <ChevronRight className="w-4 h-4 mr-1" />
          {t('explore.detail.use_this')}
        </Button>
      </div>
    </div>
  );
};

const CategoryListForm = ({ onChange, initialData }: CreateFormProps) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryItem[]>(
    initialData?.categories || [{ name: "", maxScore: 100 }]
  );
  const [essayType, setEssayType] = useState<EssayType | "">(initialData?.essayType || "");

  useEffect(() => {
    onChange({ categories: categories.filter(c => c.name.trim()), essayType: essayType || undefined });
  }, [categories, essayType, onChange]);

  const addCategory = () => setCategories([...categories, { name: "", maxScore: 100 }]);
  const removeCategory = (index: number) => setCategories(categories.filter((_, i) => i !== index));
  const updateCategory = (index: number, field: keyof CategoryItem, value: string | number) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('explore.create.labels.essay_type_optional')}</Label>
        <Select value={essayType} onValueChange={(v) => setEssayType(v as EssayType)}>
          <SelectTrigger>
            <SelectValue placeholder={t('explore.create.placeholders.select_essay_type_rubric')} />
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
      <div className="space-y-2">
        <Label>{t('explore.create.labels.scoring_categories')}</Label>
        {categories.map((cat, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              placeholder={t('explore.create.placeholders.category_name')}
              value={cat.name}
              onChange={(e) => updateCategory(index, "name", e.target.value)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder={t('explore.create.placeholders.score')}
              value={cat.maxScore}
              onChange={(e) => updateCategory(index, "maxScore", parseInt(e.target.value) || 0)}
              className="w-20"
            />
            {categories.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeCategory(index)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCategory}>
          <Plus className="w-4 h-4 mr-1" /> {t('explore.create.add_category')}
        </Button>
      </div>
    </div>
  );
};

export const CategoryListPlugin: ExplorePlugin<CategoryListPayload> = {
  type: "category_list",
  label: "Categories",
  icon: ListChecks,
  colorClass,
  CardComponent: CategoryListCard,
  DetailComponent: CategoryListDetail,
  CreateFormComponent: CategoryListForm,
  validatePayload: (payload) => {
    return payload.categories && payload.categories.some(c => c.name.trim());
  },
  buildPayload: (formData) => ({
    categories: formData.categories || [],
    essayType: formData.essayType || undefined,
  }),
  onUse: handleUseCategory,
};