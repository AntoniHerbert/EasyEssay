import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { type Friendship, type InsertFriendship } from "@shared/schema";
import { IFriendshipStore } from "./friendship.store";

export class FriendshipDbStore implements IFriendshipStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getFriendships(userId: string, status?: string): Promise<Friendship[]> {
    const conditions = [
      or(
        eq(schema.friendships.requesterId, userId),
        eq(schema.friendships.addresseeId, userId)
      )
    ];
    
    if (status) {
      conditions.push(eq(schema.friendships.status, status));
    }
    
    const result = await this.db
      .select()
      .from(schema.friendships)
      .where(and(...conditions));
    return result;
  }

  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const result = await this.db.insert(schema.friendships).values(friendship).returning();
    return result[0];
  }

  async updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined> {
    const result = await this.db
      .update(schema.friendships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.friendships.id, id))
      .returning();
    return result[0];
  }
}