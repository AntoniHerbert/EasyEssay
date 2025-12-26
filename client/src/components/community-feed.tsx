import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { type Essay, type Community, type CommunityMember, type CommunityTopic, type TopicSubmission } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Bookmark, Users, Clock, BookOpen, UserPlus, User, Plus, Crown, LogOut, FileText, Calendar, ChevronRight, ArrowLeft, Search, Copy, Check, Lock, Globe, UserCheck, UserX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { type JoinRequest } from "@shared/schema";
import { useAuth } from "@/contexts/auth-context";

interface CommunityWithMembership extends Community {
  isMember?: boolean;
  userRole?: string;
}

export function CommunityFeed() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  
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
  const [communitySearch, setCommunitySearch] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);
  const [newCommunityIsPublic, setNewCommunityIsPublic] = useState(true);
  const [communityFilter, setCommunityFilter] = useState<'all' | 'member'>('all');
  const [transferLeadershipDialogOpen, setTransferLeadershipDialogOpen] = useState(false);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essays = [], isLoading } = useQuery({
    queryKey: ["/api/essays?isPublic=true"],
  });

  const { data: allCommunities = [], isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
    enabled: activeTab === "communities",
  });

  const { data: userCommunities = [], isLoading: userCommunitiesLoading } = useQuery<CommunityMember[]>({
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
        title: "Topic created",
        description: "Your topic has been created for community members to write about!",
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create topic. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reviewSubmissionMutation = useMutation({
    mutationFn: async (submissionId: string) => {
      return apiRequest("PATCH", `/api/submissions/${submissionId}/review`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics", selectedTopicView?.id, "submissions"] });
      toast({
        title: "Marked as reviewed",
        description: "The submission has been marked as reviewed.",
      });
    },
    onError: () => {
      toast({
        title: "Review failed",
        description: "Failed to mark as reviewed. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Action failed",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
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
      toast({
        title: "Community created",
        description: "Your community has been created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      });
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
        toast({
          title: "Request sent",
          description: "Your request to join has been sent to the leader for approval.",
        });
      } else {
        toast({
          title: "Joined community",
          description: "You have joined the community!",
        });
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to join community. Please try again.";
      toast({
        title: "Join failed",
        description: message,
        variant: "destructive",
      });
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
      toast({
        title: "Left community",
        description: "You have left the community.",
      });
    },
    onError: () => {
      toast({
        title: "Leave failed",
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
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
      toast({ title: "Request approved", description: "The user has been added to the community." });
    },
    onError: () => {
      toast({ title: "Approval failed", description: "Failed to approve request.", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ communityId, requestId }: { communityId: string; requestId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/join-requests/${requestId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "join-requests"] });
      toast({ title: "Request rejected", description: "The join request has been rejected." });
    },
    onError: () => {
      toast({ title: "Rejection failed", description: "Failed to reject request.", variant: "destructive" });
    },
  });

  const promoteMemberMutation = useMutation({
    mutationFn: async ({ communityId, userId }: { communityId: string; userId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/members/${userId}/promote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      toast({ title: "Member promoted", description: "The member is now a leader." });
    },
    onError: () => {
      toast({ title: "Promotion failed", description: "Failed to promote member.", variant: "destructive" });
    },
  });

  const demoteMemberMutation = useMutation({
    mutationFn: async ({ communityId, userId }: { communityId: string; userId: string }) => {
      return apiRequest("POST", `/api/communities/${communityId}/members/${userId}/demote`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", selectedCommunity?.id, "members"] });
      toast({ title: "Leader demoted", description: "The leader is now a regular member." });
    },
    onError: () => {
      toast({ title: "Demotion failed", description: "Failed to demote leader.", variant: "destructive" });
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
      toast({ title: "Leadership transferred", description: "You have transferred primary leadership to another member." });
    },
    onError: () => {
      toast({ title: "Transfer failed", description: "Failed to transfer leadership.", variant: "destructive" });
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
      return { label: "Technology", color: "bg-primary/10 text-primary" };
    } else if (text.includes("environment") || text.includes("climate") || text.includes("sustainability")) {
      return { label: "Environment", color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" };
    } else if (text.includes("literature") || text.includes("story") || text.includes("narrative")) {
      return { label: "Literature", color: "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100" };
    } else if (text.includes("science") || text.includes("research") || text.includes("study")) {
      return { label: "Science", color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100" };
    } else {
      return { label: "General", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100" };
    }
  };

  const getReadingTime = (wordCount: number) => {
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getAccuracyScore = () => {
    return Math.floor(Math.random() * 10) + 90;
  };

  const renderEssaysFeed = () => {
    if (isLoading) {
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
            <h2 className="text-2xl font-bold mb-2">Community Essays</h2>
            <p className="text-muted-foreground">Discover and learn from essays shared by other writers</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-[150px]" data-testid="select-topic">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="literature">Literature</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]" data-testid="select-sort">
                <SelectValue placeholder="Most Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {(essays as Essay[]).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No community essays yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your essay with the community!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {(essays as Essay[])
              .filter(essay => essay.authorId !== user?.id)
              .map((essay: Essay) => {
              const topic = getTopicBadge(essay.title, essay.content);
              const readingTime = getReadingTime(essay.wordCount);
              const accuracyScore = getAccuracyScore();
              
              return (
                <Card key={essay.id} className="hover:shadow-md transition-shadow" data-testid={`community-essay-${essay.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={getAvatarImage(essay.authorName)} 
                          alt={essay.authorName}
                        />
                        <AvatarFallback>
                          {essay.authorName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link href={`/profile/${essay.authorId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="font-medium hover:text-primary p-0 h-auto"
                              data-testid={`button-author-${essay.authorId}`}
                            >
                              {essay.authorName}
                            </Button>
                          </Link>
                          <span className="text-muted-foreground text-sm">
                            {new Date(essay.updatedAt).toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${topic.color}`}>
                            {topic.label}
                          </span>
                        </div>
                        
                        <Link href={`/essay/${essay.id}`}>
                          <h3 className="text-xl font-semibold mb-3 hover:text-primary cursor-pointer transition-colors" data-testid={`essay-title-${essay.id}`}>
                            {essay.title}
                          </h3>
                        </Link>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {essay.content.substring(0, 300)}...
                        </p>
                        
                        <div className="flex items-center justify-between">
                        <div className="flex space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{readingTime} min read</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-4 h-4" />
                              <span>{essay.wordCount} words</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              <span>{accuracyScore}% accuracy</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLikeMutation.mutate(essay.id)}
                              disabled={toggleLikeMutation.isPending}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                              data-testid={`button-like-${essay.id}`}
                            >
                              <Heart className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {Math.floor(Math.random() * 100) + 10}
                              </span>
                            </Button>
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
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <div className="text-center">
              <Button variant="secondary" size="lg" data-testid="button-load-more">
                Load More Essays
              </Button>
            </div>
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
          Back to Communities
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
                      Leader
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {selectedCommunity.description || "No description"}
                </CardDescription>
                {selectedCommunity.code && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Share Code:</span>
                    <Badge 
                      variant="outline" 
                      className="font-mono text-base cursor-pointer hover:bg-accent"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedCommunity.code);
                        setCodeCopied(true);
                        setTimeout(() => setCodeCopied(false), 2000);
                        toast({
                          title: "Code copied!",
                          description: "Share this code with others to join your community.",
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
                        Transfer Leadership
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Transfer Primary Leadership</DialogTitle>
                        <DialogDescription>
                          Select a member to become the new primary leader. You will become a regular member after transferring.
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
                                <p className="text-xs text-muted-foreground">Current Leader</p>
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
                          Cancel
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
                          Transfer Leadership
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
                    Leave
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{selectedCommunity.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4" />
                <span>Led by {selectedCommunity.leaderName}</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isLeader && !selectedCommunity.isPublic && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Pending Join Requests ({joinRequests.filter(r => r.status === 'pending').length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {joinRequests.filter(r => r.status === 'pending').length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending requests</p>
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
                            Requested {new Date(request.createdAt).toLocaleDateString()}
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
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequestMutation.mutate({ communityId: selectedCommunity.id, requestId: request.id })}
                          disabled={rejectRequestMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Reject
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
              <h3 className="text-lg font-semibold">Topics</h3>
              {isLeader && (
              <Dialog open={createTopicDialogOpen} onOpenChange={setCreateTopicDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-create-topic">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Topic</DialogTitle>
                    <DialogDescription>
                      Create a topic for your community members to write essays about.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic-title">Topic Title</Label>
                      <Input
                        id="topic-title"
                        placeholder="Enter topic title"
                        value={newTopicTitle}
                        onChange={(e) => setNewTopicTitle(e.target.value)}
                        data-testid="input-topic-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-description">Description (optional)</Label>
                      <Textarea
                        id="topic-description"
                        placeholder="Describe what you want members to write about"
                        value={newTopicDescription}
                        onChange={(e) => setNewTopicDescription(e.target.value)}
                        data-testid="input-topic-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="topic-deadline">Deadline (optional)</Label>
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
                      Cancel
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
                      {createTopicMutation.isPending ? "Creating..." : "Create Topic"}
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
                <h4 className="font-medium mb-1">No topics yet</h4>
                <p className="text-sm text-muted-foreground">
                  {isLeader 
                    ? "Create the first topic for your community members to write about."
                    : "The community leader hasn't created any topics yet."}
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
                              <span>Due {new Date(topic.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                          <Badge variant={topic.isActive ? "default" : "secondary"} className="text-xs">
                            {topic.isActive ? "Active" : "Closed"}
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
          <h3 className="text-lg font-semibold mb-4">Members ({communityMembers.length})</h3>
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
                        <AvatarImage src={getAvatarImage(member.username)} alt={member.username} />
                        <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.username}</p>
                        {member.role === 'leader' && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <Crown className="w-3 h-3" />
                            <span>{isPrimaryLeader ? "Primary Leader" : "Leader"}</span>
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
                            Promote
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
                            Demote
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
          Back to Community
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
                {selectedTopicView.isActive ? "Active" : "Closed"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {selectedTopicView.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Due {new Date(selectedTopicView.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{topicSubmissions.length} submissions</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Leader Dashboard */}
        {isLeader && (
          <Card className="mb-6 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Leader Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats and Not Yet Submitted Section */}
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
                      <p>No members to track yet. Invite others to join!</p>
                    </div>
                  );
                }
                
                const unreviewedSubmissions = (memberSubmissions as SubmissionWithEssay[]).filter(s => !s.isReviewed);
                const totalUnreviewedWords = unreviewedSubmissions.reduce((sum, s) => sum + (s.essay?.wordCount || 0), 0);
                const reviewTimeMinutes = Math.ceil(totalUnreviewedWords / 200); // ~200 words per minute reading speed
                
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Submission Rate</p>
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
                        <p className="text-sm text-muted-foreground mb-1">Average Word Count</p>
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
                        <p className="text-xs text-muted-foreground">words per essay</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Review Status</p>
                        <p className="text-2xl font-semibold">
                          {memberSubmissions.filter((s: TopicSubmission) => s.isReviewed).length}/{memberSubmissionCount}
                        </p>
                        <p className="text-xs text-muted-foreground">reviewed</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Time to Review</p>
                        <p className="text-2xl font-semibold">
                          {unreviewedSubmissions.length === 0 
                            ? "Done!" 
                            : reviewTimeMinutes < 60 
                              ? `${reviewTimeMinutes} min` 
                              : `${Math.floor(reviewTimeMinutes / 60)}h ${reviewTimeMinutes % 60}m`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {unreviewedSubmissions.length} essays pending
                        </p>
                      </div>
                    </div>

                    {notSubmittedMembers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <Clock className="w-4 h-4" />
                          Not Yet Submitted ({notSubmittedMembers.length})
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
                  <h4 className="font-medium">Submit Your Essay</h4>
                  <p className="text-sm text-muted-foreground">Write an essay for this topic</p>
                </div>
                <Button 
                  onClick={() => setLocation(`/?topicId=${selectedTopicView.id}&communityId=${selectedCommunity.id}`)}
                  data-testid="button-submit-essay"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Write Essay
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
                <span className="font-medium">You have submitted an essay for this topic</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {isLeader && <Check className="w-5 h-5 text-green-600 dark:text-green-400" />}
            {isLeader ? "Submitted" : "Submissions"} ({topicSubmissions.length})
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
                <h4 className="font-medium mb-1">No submissions yet</h4>
                <p className="text-sm text-muted-foreground">
                  Be the first to submit an essay for this topic!
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
                              {new Date(submission.createdAt).toLocaleDateString()}
                            </span>
                            {submission.isReviewed ? (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                Reviewed
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Pending Review
                              </Badge>
                            )}
                          </div>
                          <Link href={`/essay/${submission.essayId}`}>
                            <Button variant="link" className="p-0 h-auto text-primary" data-testid={`link-essay-${submission.essayId}`}>
                              View Essay →
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

  const renderCommunitiesList = () => {
    if (communitiesLoading) {
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
            <h2 className="text-2xl font-bold mb-2">Writing Communities</h2>
            <p className="text-muted-foreground">Join communities to write essays on shared topics</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0" data-testid="button-create-community">
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Community</DialogTitle>
                <DialogDescription>
                  Create a community where you can post essay topics for members to write about.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="community-name">Community Name</Label>
                  <Input
                    id="community-name"
                    placeholder="Enter community name"
                    value={newCommunityName}
                    onChange={(e) => setNewCommunityName(e.target.value)}
                    data-testid="input-community-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="community-description">Description (optional)</Label>
                  <Textarea
                    id="community-description"
                    placeholder="Describe what your community is about"
                    value={newCommunityDescription}
                    onChange={(e) => setNewCommunityDescription(e.target.value)}
                    data-testid="input-community-description"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Community Type</Label>
                    <p className="text-sm text-muted-foreground">
                      {newCommunityIsPublic ? "Anyone can join" : "Requires approval to join"}
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
                  Cancel
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
                  {createCommunityMutation.isPending ? "Creating..." : "Create Community"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter toggle and search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="flex space-x-1 bg-muted rounded-lg p-1 w-fit">
            {[
              { key: "all", label: "All Communities" },
              { key: "member", label: "My Communities" },
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
              placeholder="Search communities..."
              value={communitySearch}
              onChange={(e) => setCommunitySearch(e.target.value)}
              className="pl-10"
              data-testid="input-community-search"
            />
          </div>
        </div>

        {allCommunities.filter(c => {
          const matchesSearch = c.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
            (c.description || "").toLowerCase().includes(communitySearch.toLowerCase()) ||
            (c.code || "").toLowerCase().includes(communitySearch.toLowerCase());
          if (communityFilter === 'member') {
            const userCommunityIds = new Set(userCommunities.map((m: CommunityMember) => m.communityId));
            return matchesSearch && userCommunityIds.has(c.id);
          }
          return matchesSearch;
        }).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No communities yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to create a writing community!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-community">
                <Plus className="w-4 h-4 mr-2" />
                Create Community
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allCommunities.filter(c => {
              const matchesSearch = c.name.toLowerCase().includes(communitySearch.toLowerCase()) ||
                (c.description || "").toLowerCase().includes(communitySearch.toLowerCase()) ||
                (c.code || "").toLowerCase().includes(communitySearch.toLowerCase());
              if (communityFilter === 'member') {
                const userCommunityIds = new Set(userCommunities.map((m: CommunityMember) => m.communityId));
                return matchesSearch && userCommunityIds.has(c.id);
              }
              return matchesSearch;
            }).map((community: Community) => {
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
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Private
                            </Badge>
                          )}
                          {isLeader && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Leader
                            </Badge>
                          )}
                          {isMember && !isLeader && (
                            <Badge variant="outline">Member</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {community.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{community.memberCount} members</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            <span>{community.leaderName}</span>
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
                              Pending
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => joinCommunityMutation.mutate(community.id)}
                              disabled={joinCommunityMutation.isPending}
                              data-testid={`button-join-${community.id}`}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              {community.isPublic ? "Join" : "Request to Join"}
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
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="essays" data-testid="tab-essays">
            <BookOpen className="w-4 h-4 mr-2" />
            Essays
          </TabsTrigger>
          <TabsTrigger value="communities" data-testid="tab-communities">
            <Users className="w-4 h-4 mr-2" />
            Communities
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
