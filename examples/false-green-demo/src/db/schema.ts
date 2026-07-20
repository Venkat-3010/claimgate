// Agent "finished" the feature — schema has new table, but no migration was generated.
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
});
