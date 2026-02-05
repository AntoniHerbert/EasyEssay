import type { FC } from "react";
import type { LucideIcon } from "lucide-react";
import type { ExploreItem, ExploreContentType } from "@shared/schema";

export interface ExploreItemWithStatus extends ExploreItem {
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface PluginUtils {
  navigate: (path: string) => void;
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  toggleLike: (itemId: string) => void;
  toggleSave: (itemId: string) => void;
  deleteItem: (itemId: string) => void;
  closeDetail: () => void;
}

export interface CardProps {
  item: ExploreItemWithStatus;
  utils: PluginUtils;
}

export interface DetailProps {
  item: ExploreItemWithStatus;
  utils: PluginUtils;
  isOwner: boolean;
}

export interface CreateFormProps<T = any> {
  onChange: (payload: T) => void;
  initialData?: T;
}

export interface ExplorePlugin<TPayload = any> {
  type: ExploreContentType;
  label: string;
  icon: LucideIcon;
  colorClass: string;
  CardComponent: FC<CardProps>;
  DetailComponent: FC<DetailProps>;
  CreateFormComponent: FC<CreateFormProps<TPayload>>;
  validatePayload: (payload: TPayload) => boolean;
  buildPayload?: (formData: any) => TPayload;
  onUse?: (item: ExploreItem, utils: Pick<PluginUtils, "navigate" | "toast">) => void;
}

export type PluginRegistry = Record<ExploreContentType, ExplorePlugin>;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}
