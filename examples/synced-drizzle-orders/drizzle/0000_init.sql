CREATE TABLE `customers` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY NOT NULL,
	`customer_id` integer NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`)
);
