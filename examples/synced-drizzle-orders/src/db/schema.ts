import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey(),
  email: text("email").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull(),
});
