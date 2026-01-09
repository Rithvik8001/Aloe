import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL as string;
const sql = neon(databaseUrl);

export const db = drizzle(sql);
