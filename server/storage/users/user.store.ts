import { type User, type InsertUser } from "@shared/schema";

export interface IUserStore {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}