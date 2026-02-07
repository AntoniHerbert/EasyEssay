import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Share, Check, Clock, Globe, FileText, Eye, Trash2, Users, Loader2, Archive } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Link } from "wouter";
import { type Essay, type Community, type CommunityMember } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EssayLibraryProps {
  onEditEssay?: (essayId: string) => void;
}

interface EnrichedEssay extends Essay {
  communityId?: string | null;
  communityName?: string | null;
  topicTitle?: string | null;
}

interface EssayPage {
  data: EnrichedEssay[];
  nextCursor: string | null;
}

interface UserCommunityResponse extends CommunityMember {
  community: Community;
}

export function EssayLibrary({ onEditEssay }: EssayLibraryProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: userCommunities = [] } = useQuery<UserCommunityResponse[]>({
    queryKey: ["/api/user/communities"],
    enabled: !!user?.id,
  });

  const communitiesList = useMemo(() => {
    return userCommunities
      .filter(uc => uc && uc.community)
      .map(uc => uc.community);
  }, [userCommunities]);

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading 
  } = useInfiniteQuery<EssayPage>({
    queryKey: [`/api/essays`, user?.id, debouncedSearch, activeFilter, communityFilter], 
    
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      
      params.append("authorId", user?.id || "");
      
      if (pageParam) params.append("cursor", pageParam as string);
      if (debouncedSearch) params.append("q", debouncedSearch);
      
      if (activeFilter === "drafts") {
         params.append("status", "drafts");
      } else if (activeFilter === "analyzed") {
         params.append("status", "analyzed");
      } else if (activeFilter === "communities") {
         params.append("communityId", communityFilter);
      }

      const res = await apiRequest("GET", `/api/essays?${params.toString()}`);
      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user?.id,
  });

  const allEssays = useMemo(() => {
    return data?.pages
      .flatMap((page) => page.data || [])
      .filter((essay) => essay && essay.id) || [];
  }, [data]);

  const deleteEssayMutation = useMutation({
    mutationFn: async (essayId: string) => {
      return apiRequest("DELETE", `/api/essays/${essayId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/essays`] });
      toast({
        title: t('library.toast.deleted_title'),
        description: t('library.toast.deleted_desc'),
      });
    },
    onError: () => {
      toast({
        title: t('library.toast.delete_failed_title'),
        description: t('library.toast.delete_failed_desc'),
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ essayId, isPublic }: { essayId: string; isPublic: boolean }) => {
      return apiRequest("PUT", `/api/essays/${essayId}`, { isPublic });
    },
    onSuccess: async (response) => {
      const updatedEssay = await response.json();
      
      queryClient.setQueryData(
        [`/api/essays`, user?.id, debouncedSearch, activeFilter, communityFilter], 
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: EssayPage) => ({
              ...page,
              data: page.data.map((e: EnrichedEssay) => e.id === updatedEssay.id ? { ...e, ...updatedEssay } : e)
            }))
          };
      });

      toast({
        title: updatedEssay.isPublic 
          ? t('library.toast.published_title') 
          : t('library.toast.unpublished_title'),
        description: updatedEssay.isPublic 
          ? t('library.toast.published_desc')
          : t('library.toast.unpublished_desc'),
      });
    },
    onError: () => {
      toast({
        title: t('library.toast.action_failed_title'),
        description: t('library.toast.action_failed_desc'),
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (essay: EnrichedEssay) => {
    if (essay.isPublic) {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs rounded-full">
          <Globe className="w-3 h-3 mr-1 inline" />
          {t('library.status.published')}
        </span>
      );
    } else if (essay.isAnalyzed) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs rounded-full">
          <Check className="w-3 h-3 mr-1 inline" />
          {t('library.status.analyzed')}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-xs rounded-full">
          <Clock className="w-3 h-3 mr-1 inline" />
          {t('library.status.draft')}
        </span>
      );
    }
  };

  const getCommunityBadge = (essay: EnrichedEssay) => {
    if (essay.communityName) {
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 text-xs rounded-full">
          <Users className="w-3 h-3 mr-1 inline" />
          {essay.communityName}
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('library.header.title')}</h2>
          <p className="text-muted-foreground">{t('library.header.subtitle')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('library.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
              data-testid="input-search"
            />
          </div>
          <Button onClick={() => onEditEssay?.("")} data-testid="button-new-essay">
            <Plus className="w-4 h-4 mr-2" />
            {t('library.new_essay')}
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex sm:flex-nowrap justify-between gap-1 bg-muted rounded-lg p-1 mb-6 w-full sm:w-fit">
          {[
            { key: "all", label: t('library.filters.all') },
            { key: "drafts", label: t('library.filters.drafts') },
            { key: "communities", label: t('library.filters.communities') },
            { key: "analyzed", label: t('library.filters.analyzed') },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveFilter(filter.key);
                if (filter.key !== "communities") {
                  setCommunityFilter("all");
                }
              }}
              className={`${activeFilter === filter.key ? "shadow-sm" : ""} px-0 sm:px-3`}
              data-testid={`filter-${filter.key}`}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        
        {/* Dropdown de filtro por comunidade (Aparece apenas na aba Communities) */}
        {activeFilter === "communities" && communitiesList.length > 0 && (
          <Select value={communityFilter} onValueChange={setCommunityFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-community-filter">
              <SelectValue placeholder={t('library.community_filter.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('library.community_filter.all')}</SelectItem>
              {communitiesList.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Essays Grid */}
      {allEssays.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('library.empty.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? t('library.empty.desc_search') 
                : activeFilter === "communities" 
                  ? t('library.empty.no_community_essays')
                  : t('library.empty.desc_default')
              }
            </p>
            {!searchQuery && activeFilter !== "communities" && (
              <Button onClick={() => onEditEssay?.("")} data-testid="button-create-first">
                <Plus className="w-4 h-4 mr-2" />
                {t('library.empty.create')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allEssays.map((essay: EnrichedEssay) => (
              <Card key={essay.id} className="hover:shadow-md transition-shadow" data-testid={`essay-card-${essay.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1 mr-2">
                      {essay.title}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {essay.communityId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1"
                          onClick={() => togglePublishMutation.mutate({
                            essayId: essay.id,
                            isPublic: !essay.isPublic
                          })}
                          disabled={togglePublishMutation.isPending}
                          data-testid={`button-toggle-public-${essay.id}`}
                          title={essay.isPublic 
                            ? t('library.card.archive_tooltip', 'Arquivar (Tornar Privado)') 
                            : t('library.card.publish_tooltip', 'Tornar Público na Comunidade')}
                        >
                          {essay.isPublic ? (
                            <Archive className="w-4 h-4 text-muted-foreground hover:text-orange-500 transition-colors" />
                          ) : (
                            <Globe className="w-4 h-4 text-muted-foreground hover:text-blue-500 transition-colors" />
                          )}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-destructive hover:text-destructive"
                            data-testid={`button-delete-${essay.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('library.alert.delete_title')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('library.alert.delete_desc', { title: essay.title })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('library.alert.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEssayMutation.mutate(essay.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t('library.alert.confirm')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {essay.content.substring(0, 150)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span>{new Date(essay.updatedAt).toLocaleDateString(i18n.language)}</span>
                    <span>{t('library.card.words', { count: essay.wordCount })}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                  {/* Badges na esquerda com wrap para segurança */}
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(essay)}
                      {getCommunityBadge(essay)}
                    </div>

                    {/* Botão de Ação na direita */}
                    <div>
                      {essay.isAnalyzed ? (
                        <Link href={`/essay/${essay.id}`}>
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4 mr-1" /> {t('library.card.view')}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => onEditEssay?.(essay.id)}>
                          <Edit className="w-4 h-4 mr-1" /> {t('library.card.edit')}
                        </Button>
                      )}
                  </div>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-8 pb-8">
              <Button 
                variant="outline" 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto min-w-[150px]"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('library.loading_more', 'Carregando mais...')}
                  </>
                ) : (
                  t('library.load_more', 'Carregar mais')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}