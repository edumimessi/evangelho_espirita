CREATE TABLE `devocional_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`reference` varchar(200) NOT NULL,
	`verseText` text NOT NULL,
	`reflexao` text NOT NULL,
	`oracao` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `devocional_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `devocional_cache_date_unique` UNIQUE(`date`)
);
