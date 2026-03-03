ALTER TABLE `bets` ADD `tx_signature` text;--> statement-breakpoint
ALTER TABLE `bets` ADD `claim_tx_signature` text;--> statement-breakpoint
ALTER TABLE `bets` ADD `onchain_status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `round_tokens` ADD `onchain_round_id` integer;