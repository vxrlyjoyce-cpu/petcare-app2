import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const notebooks = pgTable('care_notebooks', {
  owner: text('owner').primaryKey(),
  revision: integer('revision').notNull().default(1),
  pets: jsonb('pets').notNull(),
  logs: jsonb('logs').notNull(),
  reminders: jsonb('reminders').notNull(),
  selectedPetId: text('selected_pet_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
