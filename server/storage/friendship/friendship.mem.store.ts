import { type Friendship, type InsertFriendship } from "@shared/schema";
import { IFriendshipStore } from "./friendship.store";
import { randomUUID } from "crypto";

export class FriendshipMemStore implements IFriendshipStore {
  private friendships: Map<string, Friendship>;

  constructor() {
    this.friendships = new Map();
  }

  async getFriendships(userId: string, status?: string): Promise<Friendship[]> {
    return Array.from(this.friendships.values())
      .filter(friendship => {
        const isUserInvolved = friendship.requesterId === userId || friendship.addresseeId === userId;
        if (!isUserInvolved) return false;
        if (status && friendship.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async createFriendship(insertFriendship: InsertFriendship): Promise<Friendship> {
    const id = randomUUID();
    const now = new Date();
    const friendship: Friendship = {
      ...insertFriendship,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertFriendship.status ?? "pending",
    };
    this.friendships.set(id, friendship);
    return friendship;
  }

  async updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined> {
    const friendship = this.friendships.get(id);
    if (!friendship) return undefined;

    const updatedFriendship: Friendship = {
      ...friendship,
      ...updates,
      updatedAt: new Date(),
    };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }
}