import { type UserCorrection, type InsertUserCorrection } from "@shared/schema";
import { IUserCorrectionStore } from "./userCorrection.store";
import { randomUUID } from "crypto";

export class UserCorrectionMemStore implements IUserCorrectionStore {
  private userCorrections: Map<string, UserCorrection>;

  constructor() {
    this.userCorrections = new Map();
  }

  async getUserCorrections(essayId: string): Promise<UserCorrection[]> {
    return Array.from(this.userCorrections.values())
      .filter(correction => correction.essayId === essayId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createUserCorrection(insertUserCorrection: InsertUserCorrection): Promise<UserCorrection> {
    const id = randomUUID();
    const userCorrection: UserCorrection = {
      ...insertUserCorrection,
      id,
      likes: 0,
      createdAt: new Date(),
    };
    this.userCorrections.set(id, userCorrection);
    return userCorrection;
  }

  async updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined> {
    const userCorrection = this.userCorrections.get(id);
    if (!userCorrection) return undefined;

    const updatedUserCorrection: UserCorrection = {
      ...userCorrection,
      ...updates,
    };
    this.userCorrections.set(id, updatedUserCorrection);
    return updatedUserCorrection;
  }
}