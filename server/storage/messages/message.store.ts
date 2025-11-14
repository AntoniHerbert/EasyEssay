import { type UserMessage, type InsertUserMessage } from "@shared/schema";

export interface IMessageStore {
  getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]>;
  createUserMessage(message: InsertUserMessage): Promise<UserMessage>;
  markMessageAsRead(id: string): Promise<UserMessage | undefined>;
}