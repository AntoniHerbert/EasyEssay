import { type UserMessage, type InsertUserMessage } from "@shared/schema";
import { IMessageStore } from "./message.store";
import { randomUUID } from "crypto";

export class MessageMemStore implements IMessageStore {
  private userMessages: Map<string, UserMessage>;

  constructor() {
    this.userMessages = new Map();
  }

  async getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]> {
    return Array.from(this.userMessages.values())
      .filter(message => {
        const isInvolved = message.toUserId === userId || message.fromUserId === userId;
        if (!isInvolved) return false;
        if (unreadOnly && (message.toUserId !== userId || message.isRead)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUserMessage(insertUserMessage: InsertUserMessage): Promise<UserMessage> {
    const id = randomUUID();
    const message: UserMessage = {
      ...insertUserMessage,
      id,
      createdAt: new Date(),
      isRead: insertUserMessage.isRead ?? false,
      type: insertUserMessage.type ?? "text",
      relatedEssayId: insertUserMessage.relatedEssayId ?? null,
    };
    this.userMessages.set(id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<UserMessage | undefined> {
    const message = this.userMessages.get(id);
    if (!message) return undefined;

    const updatedMessage: UserMessage = {
      ...message,
      isRead: true,
    };
    this.userMessages.set(id, updatedMessage);
    return updatedMessage;
  }
}