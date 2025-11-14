import { type DrizzleDb } from "../index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { type UserCorrection, type InsertUserCorrection } from "@shared/schema";
import { IUserCorrectionStore } from "./userCorrection.store";

export class UserCorrectionDbStore implements IUserCorrectionStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getUserCorrections(essayId: string): Promise<UserCorrection[]> {
    const result = await this.db
      .select()
      .from(schema.userCorrections)
      .where(eq(schema.userCorrections.essayId, essayId));
    return result;
  }

  async createUserCorrection(correction: InsertUserCorrection): Promise<UserCorrection> {
    const result = await this.db.insert(schema.userCorrections).values(correction).returning();
    return result[0];
  }

  async updateUserCorrection(id: string, updates: Partial<InsertUserCorrection>): Promise<UserCorrection | undefined> {
    const result = await this.db
      .update(schema.userCorrections)
      .set(updates)
      .where(eq(schema.userCorrections.id, id))
      .returning();
    return result[0];
  }
}