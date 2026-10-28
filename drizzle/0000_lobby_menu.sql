CREATE TABLE `menu_state` (
 `id` text PRIMARY KEY NOT NULL,
 `content` text NOT NULL,
 `revision` integer NOT NULL,
 `updated_at` text NOT NULL,
 `last_mutation` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_audit` (
 `id` text PRIMARY KEY NOT NULL,
 `revision` integer NOT NULL,
 `actor_id` text NOT NULL,
 `changes` text NOT NULL,
 `created_at` text NOT NULL
);
