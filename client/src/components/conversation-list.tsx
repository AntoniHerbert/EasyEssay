import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type UserMessage, type UserProfile } from "@shared/schema";
import { MessageSquare } from "lucide-react";

interface ConversationListProps {
  messages: UserMessage[];
  currentUserId: string;
  users: UserProfile[];
  onSelectConversation: (userId: string) => void;
  selectedUserId?: string;
}

interface Conversation {
  userId: string;
  userName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export function ConversationList({ 
  messages, 
  currentUserId, 
  users, 
  onSelectConversation,
  selectedUserId 
}: ConversationListProps) {
  
  const conversations = useMemo(() => {
    const conversationMap = new Map<string, Conversation>();
    
    messages.forEach((message) => {
      const otherUserId = message.fromUserId === currentUserId 
        ? message.toUserId 
        : message.fromUserId;
      
      const existing = conversationMap.get(otherUserId);
      const messageTime = new Date(message.createdAt);
      
      if (!existing || messageTime > existing.lastMessageTime) {
        const userProfile = users.find(u => u.userId === otherUserId);
        const unreadCount = messages.filter(
          m => m.fromUserId === otherUserId && 
               m.toUserId === currentUserId && 
               !m.isRead
        ).length;
        
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          userName: userProfile?.displayName || "Unknown User",
          avatar: userProfile?.avatar || undefined,
          lastMessage: message.message,
          lastMessageTime: messageTime,
          unreadCount
        });
      }
    });
    
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
  }, [messages, currentUserId, users]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) { 
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation by visiting a user's profile
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <Card
          key={conversation.userId}
          className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
            selectedUserId === conversation.userId ? 'bg-muted border-primary' : ''
          }`}
          onClick={() => onSelectConversation(conversation.userId)}
          data-testid={`conversation-${conversation.userId}`}
        >
          <div className="flex items-start space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.avatar || undefined} alt={conversation.userName} />
              <AvatarFallback className="text-sm">
                {getInitials(conversation.userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium truncate" data-testid={`text-conversation-name-${conversation.userId}`}>
                  {conversation.userName}
                </p>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatTime(conversation.lastMessageTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground line-clamp-1 flex-1">
                  {conversation.lastMessage}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-xs"
                    data-testid={`badge-unread-${conversation.userId}`}
                  >
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
