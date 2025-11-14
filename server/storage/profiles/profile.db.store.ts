import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { type UserProfile, type InsertUserProfile } from "@shared/schema";
import { IProfileStore } from "./profile.store";

export class ProfileDbStore implements IProfileStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const result = await this.db.select().from(schema.userProfiles);
    return result;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const result = await this.db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.userId, userId));
    return result[0];
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(schema.userProfiles).values(profile).returning();
    return result[0];
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const result = await this.db
      .update(schema.userProfiles)
      .set({ ...updates, lastActiveAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId))
      .returning();
    return result[0];
  }
}