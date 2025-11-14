import { type UserProfile, type InsertUserProfile } from "@shared/schema";
import { IProfileStore } from "./profile.store";
import { randomUUID } from "crypto";

export class ProfileMemStore implements IProfileStore {
  private userProfiles: Map<string, UserProfile>;

  constructor() {
    this.userProfiles = new Map();
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return Array.from(this.userProfiles.values())
      .sort((a, b) => b.totalEssays - a.totalEssays); 
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values())
      .find(profile => profile.userId === userId);
  }

  async createUserProfile(insertUserProfile: InsertUserProfile): Promise<UserProfile> {
    const id = randomUUID();
    const now = new Date();
    const profile: UserProfile = {
      ...insertUserProfile,
      id,
      joinedAt: now,
      lastActiveAt: now,
      totalEssays: insertUserProfile.totalEssays ?? 0,
      totalWords: insertUserProfile.totalWords ?? 0,
      averageScore: insertUserProfile.averageScore ?? 0,
      streak: insertUserProfile.streak ?? 0,
      level: insertUserProfile.level ?? 1,
      experience: insertUserProfile.experience ?? 0,
      bio: insertUserProfile.bio ?? null,
      avatar: insertUserProfile.avatar ?? null,
    };
    this.userProfiles.set(id, profile);
    return profile;
  }

  async updateUserProfile(userId: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const profile = Array.from(this.userProfiles.values())
      .find(p => p.userId === userId);
    if (!profile) return undefined;

    const updatedProfile: UserProfile = {
      ...profile,
      ...updates,
      lastActiveAt: new Date(),
    };
    this.userProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }
}