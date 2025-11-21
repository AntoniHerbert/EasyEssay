import { type Friendship, type InsertFriendship } from "@shared/schema";

export interface IFriendshipStore {
  getFriendships(userId: string, status?: string): Promise<Friendship[]>;
  createFriendship(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendship(id: string, updates: Partial<InsertFriendship>): Promise<Friendship | undefined>;
}