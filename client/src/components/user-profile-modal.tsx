import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type UserProfile, type Friendship } from "@shared/schema";
import { 
  UserPlus, 
  MessageSquare, 
  Trophy, 
  BookOpen, 
  Calendar,
  Users,
  Target,
  TrendingUp,
  Award,
  Zap,
  Check
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface UserProfileModalProps {
  userId: string;
  children: React.ReactNode;
}

export function UserProfileModal({ userId, children }: UserProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/profile/${userId}`],
    enabled: userId !== user?.id,
  });

  const { data: friendships = [] } = useQuery({
    queryKey: [`/api/friendships/${user?.id}`],
    enabled: userId !== user?.id,
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return apiRequest("POST", "/api/friendships", {
        requesterId: user?.id,
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

  if (userId === user?.id) {
    return <span>{children}</span>;
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md" data-testid={`user-profile-modal-${userId}`}>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View profile details and connect with this writer
          </DialogDescription>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex items-center space-x-4 p-4">
            <div className="w-16 h-16 bg-muted rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="h-5 bg-muted rounded w-1/2 mb-2 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        ) : userProfile ? (
          <div className="space-y-4">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userProfile.avatar || ""} alt={userProfile.displayName} />
                <AvatarFallback className="text-lg">
                  {getInitials(userProfile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{userProfile.displayName}</h3>
                <p className="text-muted-foreground">@{userProfile.username}</p>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  Joined {formatJoinDate(userProfile.joinedAt)}
                </div>
              </div>
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div>
                <p className="text-sm text-muted-foreground">{userProfile.bio}</p>
              </div>
            )}

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="text-lg font-bold">{userProfile.totalEssays}</div>
                <div className="text-xs text-muted-foreground">Essays</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-bold">{userProfile.totalWords.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-lg font-bold">{userProfile.averageScore}%</div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-lg font-bold">Level {userProfile.level}</div>
                <div className="text-xs text-muted-foreground">{userProfile.experience} XP</div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {existingFriendship ? (
                existingFriendship.status === "accepted" ? (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Friends
                  </Badge>
                ) : existingFriendship.status === "pending" ? (
                  <Badge variant="outline">Request Pending</Badge>
                ) : null
              ) : (
                <Button
                  onClick={() => sendFriendRequestMutation.mutate(userId)}
                  disabled={sendFriendRequestMutation.isPending}
                  className="flex items-center gap-2 flex-1"
                  data-testid={`button-send-friend-request-${userId}`}
                >
                  <UserPlus className="w-4 h-4" />
                  Send Friend Request
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                data-testid={`button-message-${userId}`}
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">User profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}