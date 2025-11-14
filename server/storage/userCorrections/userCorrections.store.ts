import { type UserCorrection, type InsertUserCorrection } from "@shared/schema";

export interface IUserCorrectionStore {
  getUserCorrections(essayId: string): Promise<UserCorrection[]>;
  createUserCorrection(correction: InsertUserCorrection): Promise<UserCorrection>;
  updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined>;
}