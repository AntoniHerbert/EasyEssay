import { useState, useCallback, useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type ExploreContentType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Search, Plus, BookOpen } from "lucide-react";
import { EXPLORE_PLUGINS, getPlugin, getAllPlugins } from "@/features/explore/registry";
import type { ExploreItemWithStatus, PaginatedResponse, PluginUtils } from "@/features/explore/types";

type FilterType = 'all' | 'my_content' | 'saved' | ExploreContentType;

export function ExploreFeed() {
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
  const [creationPayload, setCreationPayload] = useState<any>({});

  const getTypeFilter = (): ExploreContentType | undefined => {
    if (activeFilter === 'all' || activeFilter === 'my_content' || activeFilter === 'saved') {
      return undefined;
    }
    return activeFilter;
  };

  const getAuthorFilter = (): string | undefined => {
    if (activeFilter === 'my_content' && user?.id) {
      return user.id;
    }
    return undefined;
  };

  const debouncedSearchQuery = searchQuery;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery<PaginatedResponse<ExploreItemWithStatus>>({
    queryKey: ["/api/explore", activeFilter, user?.id, debouncedSearchQuery],
    queryFn: async ({ pageParam }) => {
      if (activeFilter === 'saved') {
        const params = new URLSearchParams();
        params.set('limit', '20');
        if (pageParam) params.set('cursor', pageParam as string);
        const res = await fetch(`/api/explore/saved?${params.toString()}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      }
      
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (pageParam) params.set('cursor', pageParam as string);
      const typeFilter = getTypeFilter();
      const authorFilter = getAuthorFilter();
      if (typeFilter) params.set('type', typeFilter);
      if (authorFilter) params.set('authorId', authorFilter);
      if (debouncedSearchQuery) params.set('q', debouncedSearchQuery);
      
      const res = await fetch(`/api/explore?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: { type: ExploreContentType; title: string; subtitle?: string; payload: any; essayType?: string }) => {
      return apiRequest("POST", "/api/explore", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      setCreateDialogOpen(false);
      resetForm();
      toast({ title: "Created!", description: "Your content has been added to Explore." });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not create content.", variant: "destructive" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/explore/${itemId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("POST", `/api/explore/${itemId}/save`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/explore/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      setSelectedItem(null);
      toast({ title: "Deleted", description: "Content removed." });
    },
  });

  const resetForm = () => {
    setNewTitle("");
    setNewSubtitle("");
    setCreationPayload({});
  };

  const handleCreate = () => {
    const plugin = getPlugin(createType);
    if (!plugin) return;
    
    const payload = plugin.buildPayload ? plugin.buildPayload(creationPayload) : creationPayload;
    
    if (!plugin.validatePayload(payload) && createType !== 'essay_topic') {
      toast({ title: "Incomplete", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    createItemMutation.mutate({
      type: createType,
      title: newTitle,
      subtitle: newSubtitle || undefined,
      payload,
      essayType: creationPayload.essayType,
    });
  };

  const pluginUtils: PluginUtils = useMemo(() => ({
    navigate: setLocation,
    toast,
    toggleLike: (itemId: string) => toggleLikeMutation.mutate(itemId),
    toggleSave: (itemId: string) => toggleSaveMutation.mutate(itemId),
    deleteItem: (itemId: string) => deleteItemMutation.mutate(itemId),
    closeDetail: () => setSelectedItem(null),
  }), [setLocation, toast, toggleLikeMutation, toggleSaveMutation, deleteItemMutation]);

  const handlePayloadChange = useCallback((payload: any) => {
    setCreationPayload(payload);
  }, []);

  const allItems = data?.pages.flatMap(page => page.items) ?? [];

  const renderCard = (item: ExploreItemWithStatus) => {
    const Plugin = EXPLORE_PLUGINS[item.type];
    if (!Plugin) return null;
    return (
      <div key={item.id} onClick={() => setSelectedItem(item)}>
        <Plugin.CardComponent item={item} utils={pluginUtils} />
      </div>
    );
  };

  const renderItemDetail = () => {
    if (!selectedItem) return null;
    
    const isOwner = selectedItem.authorId === user?.id;
    const Plugin = EXPLORE_PLUGINS[selectedItem.type];
    if (!Plugin) return null;
    
    return (
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className={Plugin.colorClass}>
                <Plugin.icon className="w-3 h-3 mr-1" />
                {Plugin.label}
              </Badge>
              {selectedItem.isFeatured && <Badge variant="secondary">Featured</Badge>}
            </div>
            <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
            {selectedItem.subtitle && (
              <DialogDescription>{selectedItem.subtitle}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="py-4">
            <Plugin.DetailComponent item={selectedItem} utils={pluginUtils} isOwner={isOwner} />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderCreateDialog = () => {
    const ActivePlugin = EXPLORE_PLUGINS[createType];
    if (!ActivePlugin) return null;
    
    return (
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Content</DialogTitle>
            <DialogDescription>Add content for others to discover and use.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={createType} onValueChange={(v) => {
                setCreateType(v as ExploreContentType);
                setCreationPayload({});
              }}>
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAllPlugins().map((plugin) => (
                    <SelectItem key={plugin.type} value={plugin.type}>
                      <div className="flex items-center gap-2">
                        <plugin.icon className="w-4 h-4" />
                        {plugin.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{createType === 'quote' ? 'Quote Text' : 'Title'}</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={createType === 'quote' ? 'Enter the quote...' : 'Enter a title...'}
                data-testid="input-create-title"
              />
            </div>
            
            {createType !== 'quote' && (
              <div className="space-y-2">
                <Label>Subtitle (Optional)</Label>
                <Input
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="Brief description..."
                  data-testid="input-create-subtitle"
                />
              </div>
            )}
            
            <ActivePlugin.CreateFormComponent 
              onChange={handlePayloadChange} 
              initialData={creationPayload}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!newTitle.trim() || createItemMutation.isPending}
              data-testid="btn-submit-create"
            >
              {createItemMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Explore</h2>
            <p className="text-muted-foreground">Discover writing resources, topics, and templates</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
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

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'my_content', label: 'My Content' },
    { key: 'saved', label: 'Saved' },
    ...getAllPlugins().map(plugin => ({ key: plugin.type as FilterType, label: plugin.label })),
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Explore</h2>
          <p className="text-muted-foreground">Discover writing resources, topics, and templates</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="mt-4 sm:mt-0" data-testid="btn-create-content">
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-explore"
          />
        </div>
        
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 pb-2">
            {filterButtons.map((filter) => (
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

      {allItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || activeFilter !== 'all'
                ? "Try adjusting your search or filters."
                : "Be the first to add content!"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="btn-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Create Content
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allItems.map(item => renderCard(item))}
          
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                data-testid="btn-load-more"
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      )}

      {renderItemDetail()}
      {renderCreateDialog()}
    </div>
  );
}
