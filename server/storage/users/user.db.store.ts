import { type DrizzleDb } from "../index"; // Vamos criar isso no Passo 5
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { type User, type InsertUser } from "@shared/schema";
import { IUserStore } from "./user.store";

export class UserDbStore implements IUserStore {
  private db;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    return result[0];
  }
}