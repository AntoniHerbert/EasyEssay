import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { type UserMessage, type UserProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft } from "lucide-react";

interface ConversationThreadProps {
  currentUserId: string;
  otherUserId: string;
  otherUserProfile: UserProfile | undefined;
  messages: UserMessage[];
  onBack?: () => void;
}

export function ConversationThread({ 
  currentUserId, 
  otherUserId, 
  otherUserProfile,
  messages,
  onBack 
}: ConversationThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const threadMessages = messages
    .filter(m => 
      (m.fromUserId === currentUserId && m.toUserId === otherUserId) ||
      (m.fromUserId === otherUserId && m.toUserId === currentUserId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest("PATCH", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${currentUserId}`] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest("POST", "/api/messages", {
        fromUserId: currentUserId,
        toUserId: otherUserId,
        message: messageText,
        type: "text",
        isRead: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${currentUserId}`] });
      setNewMessage("");
      toast({
        title: "Message sent",
        description: "Your message has been delivered.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to send",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages.length]);

  const markedAsReadRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    const unreadMessages = threadMessages.filter(
      m => m.fromUserId === otherUserId && 
           m.toUserId === currentUserId && 
           !m.isRead &&
           !markedAsReadRef.current.has(m.id)
    );
    
    unreadMessages.forEach(m => {
      markedAsReadRef.current.add(m.id);
      markAsReadMutation.mutate(m.id);
    });
  }, [otherUserId, threadMessages, markAsReadMutation]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b">
        {onBack && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack}
            data-testid="button-back-to-conversations"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherUserProfile?.avatar || undefined} alt={otherUserProfile?.displayName} />
          <AvatarFallback className="text-sm">
            {getInitials(otherUserProfile?.displayName || "User")}
          </AvatarFallback>
        </Avatar>
        <Link href={`/profile/${otherUserId}`} className="hover:opacity-80 transition-opacity">
          <div>
            <p className="font-semibold" data-testid="text-thread-user-name">
              {otherUserProfile?.displayName || "User"}
            </p>
            <p className="text-xs text-muted-foreground">
              @{otherUserProfile?.username || "user"}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {threadMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          threadMessages.map((message) => {
            const isCurrentUser = message.fromUserId === currentUserId;
            const messageTime = new Date(message.createdAt);
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.id}`}
              >
                <div className={`flex items-end space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={otherUserProfile?.avatar || undefined} alt={otherUserProfile?.displayName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(otherUserProfile?.displayName || "User")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <Card className={`p-3 ${isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
                    </Card>
                    <p className={`text-xs text-muted-foreground mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                      {formatMessageTime(messageTime)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-end space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUserProfile?.displayName || "user"}...`}
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            data-testid="textarea-new-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-[60px] w-[60px]"
            data-testid="button-send-message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
