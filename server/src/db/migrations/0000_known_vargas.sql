CREATE TABLE `bets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`round_id` text NOT NULL,
	`token_id` text NOT NULL,
	`side` text NOT NULL,
	`amount` real NOT NULL,
	`result` text,
	`payout` real,
	`placed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`token_id`) REFERENCES `round_tokens`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bets_user_id` ON `bets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bets_round_id` ON `bets` (`round_id`);--> statement-breakpoint
CREATE INDEX `idx_bets_user_round` ON `bets` (`user_id`,`round_id`);--> statement-breakpoint
CREATE TABLE `round_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`mint` text NOT NULL,
	`name` text NOT NULL,
	`ticker` text NOT NULL,
	`platform` text NOT NULL,
	`image_url` text,
	`price_at_open` real NOT NULL,
	`price_at_close` real,
	`price_change_percent` real,
	`liquidity` real,
	`market_cap` real,
	`result` text,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_round_tokens_round_id` ON `round_tokens` (`round_id`);--> statement-breakpoint
CREATE INDEX `idx_round_tokens_mint` ON `round_tokens` (`mint`);--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`round_number` integer NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`opens_at` integer NOT NULL,
	`closes_at` integer NOT NULL,
	`settles_at` integer,
	`total_pool` real DEFAULT 0 NOT NULL,
	`total_bets` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rounds_round_number_unique` ON `rounds` (`round_number`);--> statement-breakpoint
CREATE TABLE `token_cache` (
	`mint` text PRIMARY KEY NOT NULL,
	`platform` text NOT NULL,
	`name` text NOT NULL,
	`ticker` text NOT NULL,
	`image_url` text,
	`price` real NOT NULL,
	`liquidity` real,
	`market_cap` real,
	`volume_24h` real,
	`created_timestamp` integer,
	`fetched_at` integer NOT NULL,
	`activity_score` real
);
--> statement-breakpoint
CREATE INDEX `idx_token_cache_platform_fetched` ON `token_cache` (`platform`,`fetched_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`privy_user_id` text NOT NULL,
	`wallet_address` text,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`points` integer DEFAULT 0 NOT NULL,
	`win_streak` integer DEFAULT 0 NOT NULL,
	`daily_streak` integer DEFAULT 0 NOT NULL,
	`total_bets` integer DEFAULT 0 NOT NULL,
	`total_wins` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_privy_user_id_unique` ON `users` (`privy_user_id`);