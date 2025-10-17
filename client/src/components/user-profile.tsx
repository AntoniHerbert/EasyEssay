import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type UserProfile, type UserMessage, type Friendship } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Edit, 
  Mail, 
  Users, 
  TrendingUp, 
  Award, 
  Calendar,
  MessageSquare,
  UserPlus,
  Check,
  X,
  Crown,
  Target,
  Zap,
  Search,
  Settings
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConversationList } from "@/components/conversation-list";
import { ConversationThread } from "@/components/conversation-thread";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export function UserProfile() {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    username: "",
  });
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<string | undefined>();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const openConversationWith = localStorage.getItem('openConversationWith');
    if (openConversationWith) {
      setSelectedConversationUserId(openConversationWith);
      localStorage.removeItem('openConversationWith');
    }
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/profile/${user?.id}`],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/messages/${user?.id}`],
  });

  const { data: friendships = [], isLoading: friendshipsLoading } = useQuery({
    queryKey: [`/api/friendships/${user?.id}`],
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    if (profile && typeof profile === 'object' && 'displayName' in profile) {
      const userProfile = profile as UserProfile;
      setProfileForm({
        displayName: userProfile.displayName || "",
        bio: userProfile.bio || "",
        username: userProfile.username || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: typeof profileForm) => {
      if (profile) {
        return apiRequest("PUT", `/api/profile/${user?.id}`, profileData);
      } else {
        return apiRequest("POST", "/api/profile", {
          ...profileData,
          userId: user?.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${user?.id}`] });
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const acceptFriendshipMutation = useMutation({
    mutationFn: async (friendshipId: string) => {
      return apiRequest("PUT", `/api/friendships/${friendshipId}`, { status: "accepted" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friendships/${user?.id}`] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    },
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

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${user?.id}`] });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLevelInfo = (experience: number) => {
    const level = Math.floor(experience / 1000) + 1;
    const currentLevelXP = experience % 1000;
    const xpToNext = 1000 - currentLevelXP;
    return { level, currentLevelXP, xpToNext, progress: (currentLevelXP / 1000) * 100 };
  };

  const getCurrentProfile = (): UserProfile => {
    if (profile && typeof profile === 'object' && 'userId' in profile) {
      return profile as UserProfile;
    }
    return {
      id: "temp-id",
      userId: user?.id || "",
      username: "new_user",
      displayName: "New User",
      bio: "",
      avatar: "",
      totalEssays: 0,
      totalWords: 0,
      averageScore: 0,
      streak: 0,
      level: 1,
      experience: 0,
      joinedAt: new Date(),
      lastActiveAt: new Date(),
    };
  };

  const currentProfile = getCurrentProfile();
  const levelInfo = getLevelInfo(currentProfile.experience);

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-20 h-20 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={currentProfile.avatar || undefined} alt={currentProfile.displayName} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(currentProfile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm(prev => ({...prev, displayName: e.target.value}))}
                      placeholder="Display Name"
                      className="font-semibold text-lg"
                      data-testid="input-display-name"
                    />
                    <Input
                      value={profileForm.username}
                      onChange={(e) => setProfileForm(prev => ({...prev, username: e.target.value}))}
                      placeholder="Username"
                      className="text-sm"
                      data-testid="input-username"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold">{currentProfile.displayName}</h2>
                    <p className="text-muted-foreground">@{currentProfile.username}</p>
                  </div>
                )}
                {/*}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Level {levelInfo.level}
                  </Badge>
                  <Badge variant="outline">
                    <Zap className="w-3 h-3 mr-1" />
                    {currentProfile.streak} day streak
                  </Badge>
                </div>*/}
              </div>
            </div>
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
              disabled={updateProfileMutation.isPending}
              data-testid={isEditing ? "button-save-profile" : "button-edit-profile"}
            >
              {isEditing ? <Check className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
              {isEditing ? (updateProfileMutation.isPending ? "Saving..." : "Save") : "Edit"}
            </Button>
          </div>

          {/* Bio Section */}
          <div className="mb-6">
            {isEditing ? (
              <Textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm(prev => ({...prev, bio: e.target.value}))}
                placeholder="Tell us about yourself..."
                className="min-h-[80px]"
                data-testid="textarea-bio"
              />
            ) : (
              <p className="text-muted-foreground">
                {currentProfile.bio || "No bio yet. Click edit to add one!"}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {/*
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level Progress</span>
              <span className="text-sm text-muted-foreground">
                {levelInfo.currentLevelXP} / 1000 XP
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {levelInfo.xpToNext} XP to next level
            </p>
          </div> */}

          {/* Stats Grid */}
          {/* 
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{currentProfile.totalEssays}</div>
              <div className="text-sm text-muted-foreground">Essays</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{currentProfile.totalWords.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Words</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Award className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{currentProfile.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Avg Score</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">
                {Math.floor((Date.now() - new Date(currentProfile.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-muted-foreground">Days</div>
            </div>
          </div>*/}
        </CardContent>
      </Card>

      {/* Tabs for Messages and Friends */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Messages ({(messages as UserMessage[]).filter(m => !m.isRead).length})
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends ({(friendships as Friendship[]).filter(f => f.status === "accepted").length})
          </TabsTrigger>
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardContent className="p-0">
              {messagesLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3 p-3 animate-pulse">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-[350px_1fr] h-[600px]">
                  {/* Conversation List */}
                  <div className={`border-r overflow-y-auto p-4 ${selectedConversationUserId ? 'hidden md:block' : ''}`}>
                    <h3 className="text-lg font-semibold mb-4">Conversations</h3>
                    <ConversationList
                      messages={messages as UserMessage[]}
                      currentUserId={user?.id || ""}
                      users={allUsers as UserProfile[]}
                      onSelectConversation={setSelectedConversationUserId}
                      selectedUserId={selectedConversationUserId}
                    />
                  </div>
                  
                  {/* Conversation Thread */}
                  <div className={`${!selectedConversationUserId ? 'hidden md:flex' : 'flex'} flex-col`}>
                    {selectedConversationUserId ? (
                      <ConversationThread
                        currentUserId={user?.id || ""}
                        otherUserId={selectedConversationUserId}
                        otherUserProfile={(allUsers as UserProfile[]).find(u => u.userId === selectedConversationUserId)}
                        messages={messages as UserMessage[]}
                        onBack={() => setSelectedConversationUserId(undefined)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to start chatting</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Friends Tab */}
        <TabsContent value="friends">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h3 className="text-lg font-semibold">Friends & Requests</h3>
            </CardHeader>
            <CardContent>
              {friendshipsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (friendships as Friendship[]).length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No friends yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect with other writers in the community
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(friendships as Friendship[]).map((friendship) => {
                    const otherUserId = friendship.requesterId === user?.id 
                      ? friendship.addresseeId 
                      : friendship.requesterId;
                    const friendProfile = (allUsers as UserProfile[]).find(u => u.userId === otherUserId);
                    
                    return (
                      <div
                        key={friendship.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`friendship-${friendship.id}`}
                      >
                        <Link href={`/profile/${otherUserId}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-1" data-testid={`link-profile-${otherUserId}`}>
                          <Avatar>
                            <AvatarImage src={friendProfile?.avatar || undefined} alt={friendProfile?.displayName} />
                            <AvatarFallback>
                              {getInitials(friendProfile?.displayName || "User")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friendProfile?.displayName || "Unknown User"}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {friendship.status}
                            </p>
                          </div>
                        </Link>
                        <div className="flex space-x-2">
                          {friendship.status === "pending" && friendship.addresseeId === user?.id && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => acceptFriendshipMutation.mutate(friendship.id)}
                                disabled={acceptFriendshipMutation.isPending}
                                data-testid={`button-accept-${friendship.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                data-testid={`button-decline-${friendship.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {friendship.status === "accepted" && (
                            <Badge variant="secondary">Friends</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discover Tab */}
        <TabsContent value="discover">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Discover Writers</h3>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    data-testid="input-user-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center space-x-4 p-4 animate-pulse">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-8 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(allUsers as UserProfile[])
                    .filter(profileUser => 
                      profileUser.userId !== user?.id &&
                      (profileUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       profileUser.username.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((profileUser: UserProfile) => {
                      const existingFriendship = (friendships as Friendship[]).find(f => 
                        (f.requesterId === profileUser.userId && f.addresseeId === user?.id) ||
                        (f.addresseeId === profileUser.userId && f.requesterId === user?.id)
                      );
                      
                      return (
                        <div key={profileUser.userId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50" data-testid={`user-card-${profileUser.userId}`}>
                          <Link href={`/profile/${profileUser.userId}`} className="flex items-center space-x-4 hover:opacity-80 transition-opacity flex-1" data-testid={`link-profile-${profileUser.userId}`}>
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={profileUser.avatar || ""} alt={profileUser.displayName} />
                              <AvatarFallback>
                                {profileUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{profileUser.displayName}</h4>
                              <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {profileUser.totalEssays} essays
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Level {profileUser.level}
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex items-center space-x-2">
                            {existingFriendship ? (
                              existingFriendship.status === "accepted" ? (
                                <Badge variant="secondary">Friends</Badge>
                              ) : existingFriendship.status === "pending" ? (
                                <Badge variant="outline">Pending</Badge>
                              ) : null
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => sendFriendRequestMutation.mutate(profileUser.userId)}
                                disabled={sendFriendRequestMutation.isPending}
                                className="flex items-center gap-1"
                                data-testid={`button-add-friend-${profileUser.userId}`}
                              >
                                <UserPlus className="w-4 h-4" />
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {(allUsers as UserProfile[]).filter(profileUser => 
                    profileUser.userId !== user?.id &&
                    (profileUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     profileUser.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).length === 0 && (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">
                        {searchQuery ? "No users found matching your search" : "No users to discover yet"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Theme Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Appearance</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-muted rounded-md">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Theme</p>
                        <p className="text-xs text-muted-foreground">
                          Choose your preferred color theme
                        </p>
                      </div>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>

                {/* User Preferences */}

                {/* 
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Preferences</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-md">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Email Notifications</p>
                          <p className="text-xs text-muted-foreground">
                            Receive updates about your essays and messages
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>*/}

                {/* Account Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Account</h4>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={async () => {
                      await logout();
                      window.location.href = '/login';
                    }}
                    data-testid="button-logout"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}