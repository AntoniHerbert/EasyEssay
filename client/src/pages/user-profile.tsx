import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type UserProfile, type Friendship, type Essay } from "@shared/schema";
import { 
  UserPlus, 
  MessageSquare, 
  BookOpen, 
  Calendar,
  TrendingUp,
  Award,
  Zap,
  Check,
  ArrowLeft,
  FileText,
  Lock,
  Globe
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function UserProfilePage() {
  const { user } = useAuth();
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/profile/${userId}`],
    enabled: !!userId && userId !== user?.id,
  });

  const { data: friendships = [] } = useQuery({
    queryKey: [`/api/friendships/${user?.id}`],
    enabled: !!userId && userId !== user?.id,
  });

  const { data: essays = [], isLoading: essaysLoading } = useQuery<Essay[]>({
    queryKey: [`/api/essays`, userId],
    queryFn: async () => {
      const response = await fetch(`/api/essays?authorId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch essays');
      return response.json();
    },
    enabled: !!userId && userId !== user?.id,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest("POST", "/api/friendships", {
        addresseeId: targetUserId,
        status: "pending"
      });
    },
    onSuccess: () => {
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/friendships/${user?.id}`] });
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMessageClick = () => {
    localStorage.setItem('openConversationWith', userId);
    localStorage.setItem('navigateToMessages', 'true');
    setLocation('/');
  };

  if (!match || !userId) {
    return <div>User not found</div>;
  }

  const userProfile = profile as UserProfile;
  
  const existingFriendship = (friendships as Friendship[]).find(f => 
    (f.requesterId === userId && f.addresseeId === user?.id) ||
    (f.addresseeId === userId && f.requesterId === user?.id)
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-muted rounded-full"></div>
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">User profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => window.history.back()} 
        className="mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>

      <Card>
        <CardContent className="p-6 md:p-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={userProfile.avatar || ""} alt={userProfile.displayName} />
              <AvatarFallback className="text-2xl">
                {getInitials(userProfile.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-1">{userProfile.displayName}</h1>
              <p className="text-muted-foreground text-lg mb-2">@{userProfile.username}</p>
              <div className="flex items-center justify-center md:justify-start text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {formatJoinDate(userProfile.joinedAt)}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              {existingFriendship ? (
                existingFriendship.status === "accepted" ? (
                  <Badge variant="secondary" className="flex items-center gap-1 justify-center">
                    <Check className="w-4 h-4" />
                    Friends
                  </Badge>
                ) : existingFriendship.status === "pending" ? (
                  <Badge variant="outline" className="justify-center">Request Pending</Badge>
                ) : null
              ) : (
                <Button
                  onClick={() => sendFriendRequestMutation.mutate(userId)}
                  disabled={sendFriendRequestMutation.isPending}
                  className="flex items-center gap-2"
                  data-testid={`button-send-friend-request-${userId}`}
                >
                  <UserPlus className="w-4 h-4" />
                  Send Friend Request
                </Button>
              )}
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleMessageClick}
                data-testid={`button-message-${userId}`}
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            </div>
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">{userProfile.bio}</p>
              </div>
              <Separator className="mb-6" />
            </>
          )}

          {/* Stats */}
          {/*
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold">{userProfile.totalEssays}</div>
              <div className="text-sm text-muted-foreground">Essays</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{userProfile.totalWords.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">{userProfile.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">Level {userProfile.level}</div>
              <div className="text-sm text-muted-foreground">{userProfile.experience} XP</div>
            </div>
          </div>*/}
        </CardContent>
      </Card>

      {/* User's Essays */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Essays by {userProfile.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {essaysLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : essays.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-essays">
              No essays yet
            </p>
          ) : (
            <div className="space-y-4">
              {essays.map((essay) => (
                <Link 
                  key={essay.id} 
                  href={`/essay/${essay.id}`}
                  data-testid={`link-essay-${essay.id}`}
                >
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate" data-testid={`text-title-${essay.id}`}>
                            {essay.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-excerpt-${essay.id}`}>
                            {essay.content.slice(0, 150)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{essay.content.split(' ').filter(w => w).length} words</span>
                            <span>•</span>
                            <span>{new Date(essay.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {essay.isPublic ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
