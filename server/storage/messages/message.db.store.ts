import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { type UserMessage, type InsertUserMessage } from "@shared/schema";
import { IMessageStore } from "./message.store";

export class MessageDbStore implements IMessageStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getUserMessages(userId: string, unreadOnly?: boolean): Promise<UserMessage[]> {
    const conditions = [
      or(
        eq(schema.userMessages.fromUserId, userId),
        eq(schema.userMessages.toUserId, userId)
      )
    ];
    
    if (unreadOnly) {
      conditions.push(eq(schema.userMessages.toUserId, userId));
      conditions.push(eq(schema.userMessages.isRead, false));
    }
    
    const result = await this.db
      .select()
      .from(schema.userMessages)
      .where(and(...conditions))
      .orderBy(desc(schema.userMessages.createdAt));
    return result;
  }

  async createUserMessage(message: InsertUserMessage): Promise<UserMessage> {
    const result = await this.db.insert(schema.userMessages).values(message).returning();
    return result[0];
  }

  async markMessageAsRead(id: string): Promise<UserMessage | undefined> {
    const result = await this.db
      .update(schema.userMessages)
      .set({ isRead: true })
      .where(eq(schema.userMessages.id, id))
      .returning();
    return result[0];
  }
}