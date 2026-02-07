import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { type Essay, type Community, type CommunityMember, type CommunityTopic, type TopicSubmission, type JoinRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Bookmark, Users, Clock, BookOpen, UserPlus, Plus, Crown, LogOut, FileText, Calendar, ChevronRight, ArrowLeft, Search, Copy, Check, Lock, Globe, UserCheck, UserX, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";

interface CommunityWithMembership extends Community {
  isMember?: boolean;
  userRole?: string;
}

function LikeButton({ essayId }: { essayId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ["/api/essays", essayId, "likes"];

  const { data: likeData, isLoading } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/essays/${essayId}/likes`);
      return res.json();
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/essays/${essayId}/like`, {});
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return { count: 0, isLiked: true };

        const wasLiked = old.isLiked;
        return {
          ...old,
          count: wasLiked ? Math.max(0, old.count - 1) : old.count + 1,
          isLiked: !wasLiked
        };
      });

      return { previousData };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast({ 
        title: "Erro", 
        description: "Não foi possível registrar seu like.", 
        variant: "destructive" 
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  const count = likeData?.count ?? 0;
  const isLiked = likeData?.isLiked ?? false; 

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        toggleLikeMutation.mutate();
      }}
      disabled={isLoading || toggleLikeMutation.isPending}
      className={`transition-all duration-200 px-2 group ${
        isLiked 
          ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" 
          : "text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
      }`}
      data-testid={`button-like-${essayId}`}
    >
      <Heart 
        className={`w-4 h-4 mr-1.5 transition-transform duration-200 group-active:scale-90 ${
          isLiked ? "fill-current scale-110" : "fill-none"
        }`} 
      />
      <span className="text-sm font-medium tabular-nums">
        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : count}
      </span>
    </Button>
  );
}

interface CommunityPage {
  data: Community[];
  nextCursor: string | null;
}

interface EssayPage {
  data: Essay[];
  nextCursor: string | null;
}

export function CommunityFeed() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
   
  const [activeTab, setActiveTab] = useState("essays");
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [selectedTopicView, setSelectedTopicView] = useState<CommunityTopic | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTopicDialogOpen, setCreateTopicDialogOpen] = useState(false);
   
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDescription, setNewCommunityDescription] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [newTopicDeadline, setNewTopicDeadline] = useState("");
  const [newCommunityIsPublic, setNewCommunityIsPublic] = useState(true);
   
  const [communitySearch, setCommunitySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(""); 
  const [communityFilter, setCommunityFilter] = useState<'all' | 'member'>('all');
   
  const [codeCopied, setCodeCopied] = useState(false);
  const [transferLeadershipDialogOpen, setTransferLeadershipDialogOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string | null>(null);
    
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(communitySearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [communitySearch]);

  const { 
    data: essaysData, 
    fetchNextPage: fetchNextEssays, 
    hasNextPage: hasNextEssays, 
    isFetchingNextPage: isFetchingNextEssays, 
    isLoading: essaysLoading 
  } = useInfiniteQuery<EssayPage>({
    queryKey: ["/api/essays", "public", selectedTopic, sortBy],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("isPublic", "true");
      if (pageParam) params.append("cursor", pageParam as string);
      
      const res = await apiRequest("GET", `/api/essays?${params.toString()}`);
      return res.json();
    },
  });

  const allEssays = useMemo(() => {
    return essaysData?.pages.flatMap((page) => page.data) || [];
  }, [essaysData]);

  const { 
    data: communitiesData, 
    fetchNextPage: fetchNextCommunities, 
    hasNextPage: hasNextCommunities, 
    isFetchingNextPage: isFetchingNextCommunities, 
    isLoading: communitiesLoading 
  } = useInfiniteQuery<CommunityPage>({
    queryKey: ["/api/communities", communityFilter, debouncedSearch],
    enabled: activeTab === "communities",
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.append("cursor", pageParam as string);
      if (debouncedSearch) params.append("q", debouncedSearch);
      
      if (communityFilter === "member" && user?.id) {
        params.append("userId", user.id);
      }

      const res = await apiRequest("GET", `/api/communities?${params.toString()}`);
      return res.json();
    },
  });

  const allCommunities = useMemo(() => {
    return communitiesData?.pages.flatMap((page) => page.data) || [];
  }, [communitiesData]);

  const { data: userCommunities = [] } = useQuery<CommunityMember[]>({
    queryKey: ["/api/user/communities"],
    enabled: activeTab === "communities" && !!user,
  });

  const { data: userPendingRequests = [] } = useQuery<JoinRequest[]>({
    queryKey: ["/api/user/pending-requests"],
    enabled: activeTab === "communities" && !!user,
  });

  const hasPendingRequest = (communityId: string) => {
    return userPendingRequests.some(r => r.communityId === communityId);
  };

  const { data: communityTopics = [], isLoading: topicsLoading } = useQuery<CommunityTopic[]>({
    queryKey: ["/api/communities", selectedCommunity?.id, "topics"],
    enabled: !!selectedCommunity,
  });

  const { data: communityMembers = [] } = useQuery<CommunityMember[]>({
    queryKey: ["/api/communities", selectedCommunity?.id, "members"],
    enabled: !!selectedCommunity,
  });

  interface SubmissionWithEssay extends TopicSubmission {
    essay?: Essay;
  }

  const { data: topicSubmissions = [], isLoading: submissionsLoading } = useQuery<SubmissionWithEssay[]>({
    queryKey: ["/api/topics", selectedTopicView?.id, "submissions"],
    enabled: !!selectedTopicView,
  });


  const createTopicMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; deadline?: string }) => {
      return apiRequest("POST", `/api/communities/${selectedCommunity?.id}/topics`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "topics"] });
      setCreateTopicDialogOpen(false);
      setNewTopicTitle("");
      setNewTopicDescription("");
      setNewTopicDeadline("");
      toast({
        title: t('community_feed.toast.topic_created'),
        description: t('community_feed.toast.topic_desc'),
      });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.topic_failed'), description: t('community_feed.toast.topic_failed_desc'), variant: "destructive" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (essayId: string) => {
      return apiRequest("POST", `/api/essays/${essayId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/essays"] });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: t('community_feed.toast.like_failed_desc'), variant: "destructive" });
    },
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; isPublic: boolean }) => {
      return apiRequest("POST", "/api/communities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); 
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      setCreateDialogOpen(false);
      setNewCommunityName("");
      setNewCommunityDescription("");
      setNewCommunityIsPublic(true);
      toast({ title: t('community_feed.toast.comm_created'), description: t('community_feed.toast.comm_created_desc') });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.comm_failed'), description: t('community_feed.toast.comm_failed_desc'), variant: "destructive" });
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/join`, {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] }); 
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/pending-requests"] });
      if (data.type === 'request') {
        toast({ title: t('community_feed.toast.request_sent'), description: t('community_feed.toast.request_sent_desc') });
      } else {
        toast({ title: t('community_feed.toast.joined'), description: t('community_feed.toast.joined_desc') });
      }
    },
    onError: (error: any) => {
      const message = error?.message || t('community_feed.toast.join_failed_desc');
      toast({ title: t('community_feed.toast.join_failed'), description: message, variant: "destructive" });
    },
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return apiRequest("POST", `/api/communities/${communityId}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      setSelectedCommunity(null);
      toast({ title: t('community_feed.toast.left'), description: t('community_feed.toast.left_desc') });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.leave_failed'), description: t('community_feed.toast.leave_failed_desc'), variant: "destructive" });
    },
  });

  const getUserMembership = (communityId: string) => {
    return userCommunities.find((m: CommunityMember) => m.communityId === communityId);
  };

  const selectedCommunityMembership = selectedCommunity ? getUserMembership(selectedCommunity.id) : undefined;
  const isSelectedCommunityLeader = selectedCommunityMembership?.role === 'leader';

  const { data: joinRequests = [] } = useQuery<JoinRequest[]>({
    queryKey: ["/api/communities", selectedCommunity?.id, "join-requests"],
    enabled: !!selectedCommunity && isSelectedCommunityLeader,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ communityId, requestId }: { communityId: string; requestId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/join-requests/${requestId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "join-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      toast({ title: t('community_feed.toast.req_approved'), description: "The user has been added to the community." });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: "Failed to approve request.", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ communityId, requestId }: { communityId: string; requestId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/join-requests/${requestId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "join-requests"] });
      toast({ title: t('community_feed.toast.req_rejected'), description: "The join request has been rejected." });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: "Failed to reject request.", variant: "destructive" });
    },
  });

  const promoteMemberMutation = useMutation({
    mutationFn: async ({ communityId, userId }: { communityId: string; userId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/members/${userId}/promote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      toast({ title: t('community_feed.toast.promoted'), description: "The member is now a leader." });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: "Failed to promote member.", variant: "destructive" });
    },
  });

  const demoteMemberMutation = useMutation({
    mutationFn: async ({ communityId, userId }: { communityId: string; userId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/members/${userId}/demote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      toast({ title: t('community_feed.toast.demoted'), description: "The leader is now a regular member." });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: "Failed to demote leader.", variant: "destructive" });
    },
  });

  const transferLeadershipMutation = useMutation({
    mutationFn: async ({ communityId, newLeaderId }: { communityId: string; newLeaderId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/transfer-leadership`, { newLeaderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/communities"] });
      setSelectedCommunity(null);
      toast({ title: t('community_feed.toast.transferred'), description: t('community_feed.toast.transferred_desc') });
    },
    onError: () => {
      toast({ title: t('community_feed.toast.action_failed'), description: "Failed to transfer leadership.", variant: "destructive" });
    },
  });

  const getAvatarImage = (authorName: string) => {
    const avatars = [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    ];
    const hash = authorName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return avatars[hash % avatars.length];
  };

  const getTopicBadge = (title: string, content: string) => {
    const text = (title + " " + content).toLowerCase();
    
    if (text.includes("technology") || text.includes("ai") || text.includes("computer") || text.includes("digital")) {
      return { key: "technology", color: "bg-primary/10 text-primary" };
    } else if (text.includes("environment") || text.includes("climate") || text.includes("sustainability")) {
      return { key: "environment", color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" };
    } else if (text.includes("literature") || text.includes("story") || text.includes("narrative")) {
      return { key: "literature", color: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100" };
    } else if (text.includes("science") || text.includes("research") || text.includes("study")) {
      return { key: "science", color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" };
    } else {
      return { key: "general", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" };
    }
  };

  const getReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

    const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAccuracyScore = () => {
    return Math.floor(Math.random() * 10) + 90;
  };

  const renderEssaysFeed = () => {
    if (essaysLoading && !allEssays.length) {
      return (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('community_feed.essays.title')}</h2>
            <p className="text-muted-foreground">{t('community_feed.essays.subtitle')}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[150px]" data-testid="select-topic">
                <SelectValue placeholder={t('community_feed.communities.filters.all_topics')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('community_feed.communities.filters.all_topics')}</SelectItem>
                <SelectItem value="technology">{t('community_feed.communities.filters.technology')}</SelectItem>
                <SelectItem value="science">{t('community_feed.communities.filters.science')}</SelectItem>
                <SelectItem value="literature">{t('community_feed.communities.filters.literature')}</SelectItem>
                <SelectItem value="environment">{t('community_feed.communities.filters.environment')}</SelectItem>
              </SelectContent>
            </Select>
     {/*        <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]" data-testid="select-sort">
                <SelectValue placeholder="Most Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>*/}
          </div>
        </div>

        {allEssays.length === 0 && !essaysLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('community_feed.essays.no_essays')}</h3>
              <p className="text-muted-foreground">
                {t('community_feed.essays.be_first')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {allEssays
              .filter(essay => essay.authorId !== user?.id)
              .map((essay: Essay) => {
              const topic = getTopicBadge(essay.title, essay.content);
              const readingTime = getReadingTime(essay.wordCount);
              
              return (
              <Card key={essay.id} className="hover:shadow-md transition-shadow" data-testid={`community-essay-${essay.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarImage src= {getInitials(essay.authorName || "User")} alt={essay.authorName} />
                            <AvatarFallback>
                          {    getInitials(essay.authorName || "User")}
                            </AvatarFallback>
                          </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/profile/${essay.authorId}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-medium hover:text-primary p-0 h-auto block truncate max-w-[80px] sm:max-w-fit"
                            data-testid={`button-author-${essay.authorId}`}
                          >
                            {essay.authorName}
                          </Button>
                        </Link>
                        <span className="text-muted-foreground text-sm shrink-0">
                          {new Date(essay.updatedAt).toLocaleDateString(i18n.language)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full shrink-0 ${topic.color}`}>
                          {t(`community_feed.communities.filters.${topic.key}`)}
                        </span>
                      </div>
                      
                      <Link href={`/essay/${essay.id}`}>
                        <h3 className="text-xl font-semibold mb-3 hover:text-primary cursor-pointer transition-colors break-words" data-testid={`essay-title-${essay.id}`}>
                          {essay.title}
                        </h3>
                      </Link>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-3 break-words">
                        {essay.content.substring(0, 300)}...
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{readingTime} {t('community_feed.communities.card.min_read')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{essay.wordCount} {t('community_feed.communities.card.words')}</span>
                          </div>{/* 
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>{accuracyScore}% accuracy</span>
                          </div>*/}
                        </div> 
                        <div className="flex items-center space-x-3">
                          <LikeButton essayId={essay.id} />
                          {/*
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-primary transition-colors"
                            data-testid={`button-comment-${essay.id}`}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            <span className="text-sm">
                              {Math.floor(Math.random() * 20) + 1}
                            </span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-bookmark-${essay.id}`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>*/}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
            
            {/* Load More Button for Essays */}
{hasNextEssays && (
            <div className="text-center py-4">
              <Button 
                variant="secondary" 
                size="lg" 
                onClick={() => fetchNextEssays()}
                disabled={isFetchingNextEssays}
                data-testid="button-load-more"
              >
                {isFetchingNextEssays ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('community_feed.essays.load_more')
                )}
              </Button>
            </div>
          )}
          {!hasNextEssays && allEssays.length > 0 && (
             <p className="text-center text-muted-foreground text-sm mt-4">
               {t('community_feed.essays.end_of_list')}
             </p>
          )}
          </div>
        )}
      </div>
    );
  };

  const renderCommunitiesList = () => {
    if (communitiesLoading && !allCommunities.length) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('community_feed.communities.title')}</h2>
            <p className="text-muted-foreground">{t('community_feed.communities.subtitle')}</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0" data-testid="button-create-community">
                <Plus className="w-4 h-4 mr-2" />
                {t('community_feed.communities.create_btn')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('community_feed.dialogs.create_community.title')}</DialogTitle>
                <DialogDescription>
                  {t('community_feed.dialogs.create_community.desc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="community-name">{t('community_feed.dialogs.create_community.name_label')}</Label>
                  <Input
                    id="community-name"
                    placeholder={t('community_feed.dialogs.create_community.name_placeholder')}
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    data-testid="input-community-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="community-description">{t('community_feed.dialogs.create_community.desc_label')}</Label>
                  <Textarea
                    id="community-description"
                    placeholder={t('community_feed.dialogs.create_community.desc_placeholder')}
                    value={newCommunityDescription}
                    onChange={(e) => setNewCommunityDescription(e.target.value)}
                    data-testid="input-community-description"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('community_feed.dialogs.create_community.type_label')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {newCommunityIsPublic ? t('community_feed.dialogs.create_community.public_desc') : t('community_feed.dialogs.create_community.private_desc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {newCommunityIsPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <Switch
                      checked={newCommunityIsPublic}
                      onCheckedChange={setNewCommunityIsPublic}
                      data-testid="switch-community-public"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  {t('community_feed.dialogs.create_community.cancel')}
                </Button>
                <Button 
                  onClick={() => createCommunityMutation.mutate({ 
                    name: newCommunityName, 
                    description: newCommunityDescription,
                    isPublic: newCommunityIsPublic,
                  })}
                  disabled={!newCommunityName.trim() || createCommunityMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createCommunityMutation.isPending ? t('community_feed.dialogs.create_community.creating') : t('community_feed.dialogs.create_community.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter toggle and search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="flex space-x-1 bg-muted rounded-lg p-1 w-fit">
            {[
              { key: "all", label: t('community_feed.communities.filters.all') },
              { key: "member", label: t('community_feed.communities.filters.member') },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={communityFilter === filter.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setCommunityFilter(filter.key as 'all' | 'member')}
                className={communityFilter === filter.key ? "shadow-sm" : ""}
                data-testid={`filter-${filter.key}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('community_feed.communities.search_placeholder')}
              value={communitySearch}
              onChange={(e) => setCommunitySearch(e.target.value)}
              className="pl-10"
              data-testid="input-community-search"
            />
          </div>
        </div>

        {allCommunities.length === 0 && !communitiesLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('community_feed.communities.no_communities')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('community_feed.communities.be_first_community')}
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-community">
                <Plus className="w-4 h-4 mr-2" />
                {t('community_feed.communities.create_btn')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allCommunities.map((community: Community) => {
              const membership = getUserMembership(community.id);
              const isMember = !!membership;
              const isLeader = membership?.role === 'leader';

              return (
                <Card 
                  key={community.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCommunity(community)}
                  data-testid={`community-card-${community.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{community.name}</h3>
                          {community.isPublic ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {t('community_feed.communities.card.public')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              {t('community_feed.communities.card.private')}
                            </Badge>
                          )}
                          {isLeader && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              {t('community_feed.communities.card.leader')}
                            </Badge>
                          )}
                          {isMember && !isLeader && (
                            <Badge variant="outline">{t('community_feed.communities.card.member')}</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {community.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{t('community_feed.communities.card.members_count', { count: community.memberCount })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            <span>{t('community_feed.communities.card.led_by', { name: community.leaderName })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!isMember && (
                          hasPendingRequest(community.id) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              data-testid={`button-pending-${community.id}`}
                            >
                              <Clock className="w-4 h-4 mr-1" />
                              {t('community_feed.communities.card.pending')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => joinCommunityMutation.mutate(community.id)}
                              disabled={joinCommunityMutation.isPending}
                              data-testid={`button-join-${community.id}`}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              {community.isPublic ? t('community_feed.communities.card.join') : t('community_feed.communities.card.request_join')}
                            </Button>
                          )
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Load More Button for Communities */}
            {hasNextCommunities && (
              <div className="flex justify-center mt-8 pb-8">
                <Button 
                  variant="outline" 
                  onClick={() => fetchNextCommunities()} 
                  disabled={isFetchingNextCommunities}
                  className="w-full sm:w-auto min-w-[150px]"
                >
                  {isFetchingNextCommunities ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('library.loading_more', 'Loading more...')}
                    </>
                  ) : (
                    t('library.load_more', 'Load More')
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCommunityDetail = () => {
    if (!selectedCommunity) return null;
      
    const membership = getUserMembership(selectedCommunity.id);
    const isLeader = membership?.role === 'leader';
    const isMember = !!membership;

    return (
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCommunity(null)}
          className="mb-4"
          data-testid="button-back-communities"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('community_feed.communities.back_btn')}
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{selectedCommunity.name}</CardTitle>
                  {isLeader && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      {t('community_feed.detail.leader_badge')}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {selectedCommunity.description || "No description"}
                </CardDescription>
                {selectedCommunity.code && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">{t('community_feed.detail.share_code')}</span>
                    <Badge 
                      variant="outline" 
                      className="font-mono text-base cursor-pointer hover:bg-accent"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCommunity.code);
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                        toast({
                          title: t('community_feed.detail.code_copied'),
                          description: t('community_feed.detail.code_copied_desc'),
                        });
                      }}
                      data-testid="badge-community-code"
                    >
                      {selectedCommunity.code}
                      {codeCopied ? (
                        <Check className="w-3 h-3 ml-1 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedCommunity.leaderId === user?.id && (
                  <Dialog open={transferLeadershipDialogOpen} onOpenChange={setTransferLeadershipDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        data-testid="button-transfer-leadership"
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        {t('community_feed.detail.transfer_leadership')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('community_feed.dialogs.transfer.title')}</DialogTitle>
                        <DialogDescription>
                          {t('community_feed.dialogs.transfer.desc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {communityMembers.filter((m: CommunityMember) => m.userId !== user?.id).map((member: CommunityMember) => (
                          <div 
                            key={member.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedNewLeader === member.userId ? 'bg-primary/10 border border-primary' : 'bg-muted/50 hover:bg-muted'}`}
                            onClick={() => setSelectedNewLeader(member.userId)}
                            data-testid={`select-new-leader-${member.userId}`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{member.username}</p>
                              {member.role === 'leader' && (
                                <p className="text-xs text-muted-foreground">{t('community_feed.detail.leader_badge')}</p>
                              )}
                            </div>
                            {selectedNewLeader === member.userId && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTransferLeadershipDialogOpen(false)}>
                          {t('community_feed.dialogs.transfer.cancel')}
                        </Button>
                        <Button 
                          onClick={() => {
                            if (selectedNewLeader) {
                              transferLeadershipMutation.mutate({ communityId: selectedCommunity.id, newLeaderId: selectedNewLeader });
                              setTransferLeadershipDialogOpen(false);
                              setSelectedNewLeader(null);
                            }
                          }}
                          disabled={!selectedNewLeader || transferLeadershipMutation.isPending}
                          data-testid="button-confirm-transfer"
                        >
                          {t('community_feed.dialogs.transfer.confirm')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {isMember && !isLeader && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => leaveCommunityMutation.mutate(selectedCommunity.id)}
                    disabled={leaveCommunityMutation.isPending}
                    data-testid="button-leave-community"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    {t('community_feed.detail.leave')}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{t('community_feed.communities.card.members_count', { count: selectedCommunity.memberCount })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4" />
                <span>{t('community_feed.communities.card.led_by', { name: selectedCommunity.leaderName })}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLeader && !selectedCommunity.isPublic && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                {t('community_feed.detail.pending_requests', { count: joinRequests.filter(r => r.status === 'pending').length })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {joinRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">{t('community_feed.detail.no_pending')}</p>
              ) : (
                <div className="space-y-3">
                  {joinRequests.filter(r => r.status === 'pending').map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`join-request-${request.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{request.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {t('community_feed.detail.requested_on', { date: new Date(request.createdAt).toLocaleDateString(i18n.language) })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveRequestMutation.mutate({ communityId: selectedCommunity.id, requestId: request.id })}
                          disabled={approveRequestMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          {t('community_feed.detail.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequestMutation.mutate({ communityId: selectedCommunity.id, requestId: request.id })}
                          disabled={rejectRequestMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          {t('community_feed.detail.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isMember && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('community_feed.detail.topics_title')}</h3>
              {isLeader && (
              <Dialog open={createTopicDialogOpen} onOpenChange={setCreateTopicDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-create-topic">
                    <Plus className="w-4 h-4 mr-1" />
                    {t('community_feed.detail.create_topic')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('community_feed.dialogs.create_topic.title')}</DialogTitle>
                    <DialogDescription>
                      {t('community_feed.dialogs.create_topic.desc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic-title">{t('community_feed.dialogs.create_topic.title_label')}</Label>
                      <Input
                        id="topic-title"
                        placeholder={t('community_feed.dialogs.create_topic.title_placeholder')}
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        data-testid="input-topic-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-description">{t('community_feed.dialogs.create_topic.desc_label')}</Label>
                      <Textarea
                        id="topic-description"
                        placeholder={t('community_feed.dialogs.create_topic.desc_placeholder')}
                        value={newTopicDescription}
                        onChange={(e) => setNewTopicDescription(e.target.value)}
                        data-testid="input-topic-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-deadline">{t('community_feed.dialogs.create_topic.deadline_label')}</Label>
                      <Input
                        id="topic-deadline"
                        type="date"
                        value={newTopicDeadline}
                        onChange={(e) => setNewTopicDeadline(e.target.value)}
                        data-testid="input-topic-deadline"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setCreateTopicDialogOpen(false)}
                      data-testid="button-cancel-topic"
                    >
                      {t('community_feed.dialogs.create_topic.cancel')}
                    </Button>
                    <Button 
                      onClick={() => createTopicMutation.mutate({ 
                        title: newTopicTitle, 
                        description: newTopicDescription,
                        deadline: newTopicDeadline || undefined
                      })}
                      disabled={!newTopicTitle.trim() || createTopicMutation.isPending}
                      data-testid="button-submit-topic"
                    >
                      {createTopicMutation.isPending ? t('community_feed.dialogs.create_topic.creating') : t('community_feed.dialogs.create_topic.create')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {topicsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : communityTopics.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h4 className="font-medium mb-1">{t('community_feed.topic.empty.no_topics')}</h4>
                <p className="text-sm text-muted-foreground">
                  {isLeader 
                    ? t('community_feed.topic.empty.create_first')
                    : t('community_feed.topic.empty.leader_hasnt_created')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {communityTopics.map((topic: CommunityTopic) => (
                <Card 
                  key={topic.id} 
                  className="hover:shadow-sm transition-shadow cursor-pointer" 
                  onClick={() => setSelectedTopicView(topic)}
                  data-testid={`topic-card-${topic.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{topic.title}</h4>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {topic.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {topic.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{t('community_feed.topic.due_date', { date: new Date(topic.deadline).toLocaleDateString(i18n.language) })}</span>
                            </div>
                          )}
                          <Badge variant={topic.isActive ? "default" : "secondary"} className="text-xs">
                            {topic.isActive ? t('community_feed.topic.active') : t('community_feed.topic.closed')}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">{t('community_feed.detail.members_title', { count: communityMembers.length })}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {communityMembers.map((member: CommunityMember) => {
              const isPrimaryLeader = selectedCommunity.leaderId === member.userId;
              const canPromote = isLeader && member.role !== 'leader' && member.userId !== user?.id;
              const canDemote = selectedCommunity.leaderId === user?.id && member.role === 'leader' && member.userId !== user?.id;
                
              return (
                <Card key={member.id} className="p-3" data-testid={`member-card-${member.id}`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                          <AvatarFallback>
                           {member.username ? member.username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                          </AvatarFallback>
                        </Avatar>
                      <div className="flex-1 min-w-0">
                          {user?.id === member.userId ? (
                                <span className="font-medium text-sm truncate block">
                                  {member.username}
                                </span>
                              ) : (
                                <Link href={`/profile/${member.userId}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="font-medium hover:text-primary p-0 h-auto truncate justify-start"
                                  >
                                    {member.username}
                                  </Button>
                                </Link>
                              )}                        
                            {member.role === 'leader' && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Crown className="w-3 h-3" />
                            <span>{isPrimaryLeader ? t('community_feed.detail.primary_leader') : t('community_feed.detail.leader_badge')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(canPromote || canDemote) && (
                      <div className="flex gap-1">
                        {canPromote && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-7"
                            onClick={() => promoteMemberMutation.mutate({ communityId: selectedCommunity.id, userId: member.userId })}
                            disabled={promoteMemberMutation.isPending}
                            data-testid={`button-promote-${member.userId}`}
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            {t('community_feed.detail.promote')}
                          </Button>
                        )}
                        {canDemote && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs h-7"
                            onClick={() => demoteMemberMutation.mutate({ communityId: selectedCommunity.id, userId: member.userId })}
                            disabled={demoteMemberMutation.isPending}
                            data-testid={`button-demote-${member.userId}`}
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            {t('community_feed.detail.demote')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTopicDetail = () => {
    if (!selectedTopicView || !selectedCommunity) return null;
      
    const membership = getUserMembership(selectedCommunity.id);
    const isLeader = membership?.role === 'leader';
    const isMember = !!membership;
    const hasSubmitted = topicSubmissions.some((s: TopicSubmission) => s.userId === user?.id);

    return (
      <div>
        <Button 
          variant="ghost" 
          onClick={() => setSelectedTopicView(null)}
          className="mb-4"
          data-testid="button-back-topics"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('community_feed.topic.back_btn')}
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedTopicView.title}</CardTitle>
                {selectedTopicView.description && (
                  <CardDescription className="mt-2">
                    {selectedTopicView.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant={selectedTopicView.isActive ? "default" : "secondary"}>
                {selectedTopicView.isActive ? t('community_feed.topic.active') : t('community_feed.topic.closed')}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {selectedTopicView.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{t('community_feed.topic.due_date', { date: new Date(selectedTopicView.deadline).toLocaleDateString(i18n.language) })}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{t('community_feed.topic.submissions_count', { count: topicSubmissions.length })}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLeader && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                {t('community_feed.topic.leader_dashboard')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(() => {
                const participatingMembers = communityMembers.filter((m: CommunityMember) => m.role !== 'leader');
                const participantCount = participatingMembers.length;
                const participantUserIds = new Set(participatingMembers.map((m: CommunityMember) => m.userId));
                const memberSubmissions = topicSubmissions.filter((s: TopicSubmission) => participantUserIds.has(s.userId));
                const memberSubmissionCount = memberSubmissions.length;
                const submittedUserIds = new Set(memberSubmissions.map((s: TopicSubmission) => s.userId));
                const notSubmittedMembers = participatingMembers.filter(
                  (m: CommunityMember) => !submittedUserIds.has(m.userId)
                );
                  
                if (participantCount === 0) {
                  return (
                    <div className="text-center py-6 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>{t('community_feed.topic.empty.no_members_track')}</p>
                    </div>
                  );
                }
                  
                const unreviewedSubmissions = (memberSubmissions as SubmissionWithEssay[]).filter(s => !s.isReviewed);
                const totalUnreviewedWords = unreviewedSubmissions.reduce((sum, s) => sum + (s.essay?.wordCount || 0), 0);
                const reviewTimeMinutes = Math.ceil(totalUnreviewedWords / 200);
                  
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">{t('community_feed.topic.stats.submission_rate')}</p>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={participantCount > 0 ? (memberSubmissionCount / participantCount) * 100 : 0} 
                            className="flex-1"
                          />
                          <span className="text-lg font-semibold">
                            {participantCount > 0 
                              ? Math.round((memberSubmissionCount / participantCount) * 100) 
                              : 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {memberSubmissionCount} of {participantCount} members
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">{t('community_feed.topic.stats.avg_words')}</p>
                        <p className="text-2xl font-semibold">
                          {memberSubmissionCount > 0 
                            ? Math.round(
                                (memberSubmissions as SubmissionWithEssay[])
                                  .filter(s => s.essay?.wordCount)
                                  .reduce((sum, s) => sum + (s.essay?.wordCount || 0), 0) / 
                                Math.max((memberSubmissions as SubmissionWithEssay[]).filter(s => s.essay?.wordCount).length, 1)
                              )
                            : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('community_feed.topic.stats.words_per_essay')}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">{t('community_feed.topic.stats.review_status')}</p>
                        <p className="text-2xl font-semibold">
                          {memberSubmissions.filter((s: TopicSubmission) => s.isReviewed).length}/{memberSubmissionCount}
                        </p>
                        <p className="text-xs text-muted-foreground">{t('community_feed.topic.stats.reviewed')}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">{t('community_feed.topic.stats.time_review')}</p>
                        <p className="text-2xl font-semibold">
                          {unreviewedSubmissions.length === 0 
                            ? t('community_feed.topic.stats.done') 
                            : reviewTimeMinutes < 60 
                              ? `${reviewTimeMinutes} min` 
                              : `${Math.floor(reviewTimeMinutes / 60)}h ${reviewTimeMinutes % 60}m`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('community_feed.topic.stats.pending_essays', { count: unreviewedSubmissions.length })}
                        </p>
                      </div>
                    </div>

                    {notSubmittedMembers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <Clock className="w-4 h-4" />
                          {t('community_feed.topic.stats.not_submitted', { count: notSubmittedMembers.length })}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {notSubmittedMembers.map((member: CommunityMember) => (
                            <div 
                              key={member.id} 
                              className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-full px-3 py-1"
                              data-testid={`not-submitted-${member.userId}`}
                            >
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={getAvatarImage(member.username)} alt={member.username} />
                                <AvatarFallback className="text-xs">{member.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {isMember && !isLeader && selectedTopicView.isActive && !hasSubmitted && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{t('community_feed.topic.submit_panel.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('community_feed.topic.submit_panel.desc')}</p>
                </div>
                <Button 
                  onClick={() => setLocation(`/?topicId=${selectedTopicView.id}&communityId=${selectedCommunity.id}`)}
                  data-testid="button-submit-essay"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('community_feed.topic.submit_panel.btn')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasSubmitted && !isLeader && (
          <Card className="mb-6 border-green-500/20 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{t('community_feed.topic.submit_panel.submitted_msg')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {isLeader && <Check className="w-5 h-5 text-green-600 dark:text-green-400" />}
            {isLeader ? t('community_feed.topic.submissions_list.title_leader') : t('community_feed.topic.submissions_list.title')} ({topicSubmissions.length})
          </h3>
            
          {submissionsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : topicSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h4 className="font-medium mb-1">{t('community_feed.topic.submissions_list.no_submissions')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('community_feed.topic.submissions_list.be_first')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {topicSubmissions.map((submission: TopicSubmission) => (
                <Card key={submission.id} data-testid={`submission-card-${submission.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={getAvatarImage(submission.username)} alt={submission.username} />
                          <AvatarFallback>{submission.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{submission.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(submission.createdAt).toLocaleDateString(i18n.language)}
                            </span>
                            {submission.isReviewed ? (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                {t('community_feed.topic.submissions_list.reviewed')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {t('community_feed.topic.submissions_list.pending_review')}
                              </Badge>
                            )}
                          </div>
                          <Link href={`/essay/${submission.essayId}`}>
                            <Button variant="link" className="p-0 h-auto text-primary" data-testid={`link-essay-${submission.essayId}`}>
                              {t('community_feed.topic.submissions_list.view_essay')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="essays" data-testid="tab-essays">
            <BookOpen className="w-4 h-4 mr-2" />
            {t('community_feed.tabs.essays')}
          </TabsTrigger>
          <TabsTrigger value="communities" data-testid="tab-communities">
            <Users className="w-4 h-4 mr-2" />
            {t('community_feed.tabs.communities')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="essays">
          {renderEssaysFeed()}
        </TabsContent>

        <TabsContent value="communities">
          {selectedTopicView 
            ? renderTopicDetail() 
            : selectedCommunity 
              ? renderCommunityDetail() 
              : renderCommunitiesList()}
        </TabsContent>
      </Tabs>
    </div>
  );
}