import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const menuState=sqliteTable('menu_state',{id:text('id').primaryKey(),content:text('content').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),lastMutation:text('last_mutation').notNull()});
export const menuAudit=sqliteTable('menu_audit',{id:text('id').primaryKey(),revision:integer('revision').notNull(),actorId:text('actor_id').notNull(),changes:text('changes').notNull(),createdAt:text('created_at').notNull()});
