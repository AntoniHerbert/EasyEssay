import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote, Heart, Bookmark, Copy, Trash2 } from "lucide-react";
import { type QuotePayload } from "@shared/schema";
import type { ExplorePlugin, CardProps, DetailProps, CreateFormProps, PluginUtils } from "../types";
import type { ExploreItem } from "@shared/schema";
import { useState, useEffect } from "react";
import { Link } from "wouter";

const colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";

const handleUseQuote = (item: ExploreItem, utils: Pick<PluginUtils, "navigate" | "toast">) => {
  const payload = item.payload as QuotePayload;
  const quoteText = `"${item.title}" — ${payload.author}${payload.source ? ` (${payload.source})` : ""}`;
  navigator.clipboard.writeText(quoteText);
  utils.toast({
    title: "Copied!",
    description: "Quote copied to clipboard.",
  });
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const QuoteCard = ({ item, utils }: CardProps) => {
  const payload = item.payload as QuotePayload;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-quote-${item.id}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge className={colorClass}>
            <Quote className="w-3 h-3 mr-1" />
            Quote
          </Badge>
          {item.isFeatured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <blockquote className="italic text-lg mb-2 border-l-4 border-muted-foreground/30 pl-4">
          "{item.title}"
        </blockquote>
        <p className="text-sm text-muted-foreground mb-3">
          — {payload.author}
          {payload.source && <span className="ml-1">({payload.source})</span>}
        </p>
        <div className="flex items-center justify-between border-t border-border pt-3 mt-3">
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

const QuoteDetail = ({ item, utils, isOwner }: DetailProps) => {
  const payload = item.payload as QuotePayload;

  return (
    <div className="space-y-4">
      <blockquote className="italic text-xl border-l-4 border-muted-foreground/30 pl-4 py-2">
        "{item.title}"
      </blockquote>
      <p className="text-muted-foreground">
        — {payload.author}
        {payload.source && <span className="ml-1">({payload.source})</span>}
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
              Delete
            </Button>
          )}
        </div>
        <Button
          onClick={() => handleUseQuote(item, utils)}
          data-testid="btn-use-item"
        >
          <Copy className="w-4 h-4 mr-1" />
          Copy Quote
        </Button>
      </div>
    </div>
  );
};

const QuoteForm = ({ onChange, initialData }: CreateFormProps) => {
  const [author, setAuthor] = useState(initialData?.author || "");
  const [source, setSource] = useState(initialData?.source || "");

  useEffect(() => {
    onChange({ author, source: source || undefined });
  }, [author, source, onChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Author</Label>
        <Input
          placeholder="Who said this quote?"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Source (Optional)</Label>
        <Input
          placeholder="Book, speech, interview..."
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>
    </div>
  );
};

export const QuotePlugin: ExplorePlugin<QuotePayload> = {
  type: "quote",
  label: "Quotes",
  icon: Quote,
  colorClass,
  CardComponent: QuoteCard,
  DetailComponent: QuoteDetail,
  CreateFormComponent: QuoteForm,
  validatePayload: (payload) => !!payload.author?.trim(),
  buildPayload: (formData) => ({
    author: formData.author || "",
    source: formData.source,
  }),
  onUse: handleUseQuote,
};
