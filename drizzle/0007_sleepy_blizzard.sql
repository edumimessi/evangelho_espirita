CREATE TABLE `biblia_caminho_source` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(40) NOT NULL,
	`sourceUrl` varchar(500) NOT NULL,
	`pageTitle` varchar(300),
	`cleanedText` text NOT NULL,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biblia_caminho_source_id` PRIMARY KEY(`id`),
	CONSTRAINT `biblia_caminho_source_sourceKey_unique` UNIQUE(`sourceKey`)
);
