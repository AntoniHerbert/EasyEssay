import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Essay } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Bookmark, Users, Clock, BookOpen, UserPlus, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function CommunityFeed() {
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: essays = [], isLoading } = useQuery({
    queryKey: ["/api/essays?isPublic=true"],
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
    },
    onError: () => {
      toast({
        title: "Request failed",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
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
      {/* Header */}
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

      {/* Essays Feed */}
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
                          </div>{/* 
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span>{accuracyScore}% accuracy</span>
                          </div>*/}
                        </div>{/* 
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
                        </div>*/}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Load More Button */}
          <div className="text-center">
            <Button variant="secondary" size="lg" data-testid="button-load-more">
              Load More Essays
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
