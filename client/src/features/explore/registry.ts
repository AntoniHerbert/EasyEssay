import type { ExploreContentType } from "@shared/schema";
import type { ExplorePlugin, PluginRegistry } from "./types";
import { CategoryListPlugin } from "./plugins/CategoryListPlugin";
import { EssayTopicPlugin } from "./plugins/EssayTopicPlugin";
import { QuotePlugin } from "./plugins/QuotePlugin";
import { TemplatePlugin } from "./plugins/TemplatePlugin";

export const EXPLORE_PLUGINS: PluginRegistry = {
  category_list: CategoryListPlugin,
  essay_topic: EssayTopicPlugin,
  quote: QuotePlugin,
  template: TemplatePlugin,
};

export const getPlugin = (type: ExploreContentType): ExplorePlugin | undefined => {
  return EXPLORE_PLUGINS[type];
};

export const getAllPlugins = (): ExplorePlugin[] => {
  return Object.values(EXPLORE_PLUGINS);
};

export const getPluginTypes = (): ExploreContentType[] => {
  return Object.keys(EXPLORE_PLUGINS) as ExploreContentType[];
};
