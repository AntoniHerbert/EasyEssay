import { type Inspiration, type InsertInspiration } from "@shared/schema";

export interface IInspirationStore {
  getInspirations(category?: string, type?: string): Promise<Inspiration[]>;
  getInspiration(id: string): Promise<Inspiration | undefined>;
  createInspiration(inspiration: InsertInspiration): Promise<Inspiration>;
  updateInspiration(id: string, updates: Partial<InsertInspiration>): Promise<Inspiration | undefined>;
}