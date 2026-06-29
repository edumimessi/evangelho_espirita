CREATE TABLE `ai_interpretations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`chapter` int NOT NULL,
	`verseStart` int NOT NULL,
	`verseEnd` int NOT NULL,
	`interpretation` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_interpretations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bible_books` (
	`id` int AUTO_INCREMENT NOT NULL,
	`abbrev` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`testament` enum('old','new') NOT NULL,
	`order` int NOT NULL,
	`author` varchar(200),
	`genre` varchar(100),
	`chapterCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `bible_books_id` PRIMARY KEY(`id`),
	CONSTRAINT `bible_books_abbrev_unique` UNIQUE(`abbrev`)
);
--> statement-breakpoint
CREATE TABLE `bible_verses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookId` int NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`chapter` int NOT NULL,
	`verse` int NOT NULL,
	`text` text NOT NULL,
	`version` varchar(20) NOT NULL DEFAULT 'nvi',
	CONSTRAINT `bible_verses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `correlations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceBookAbbrev` varchar(10) NOT NULL,
	`sourceChapter` int NOT NULL,
	`sourceVerse` int NOT NULL,
	`targetBookAbbrev` varchar(10) NOT NULL,
	`targetChapter` int NOT NULL,
	`targetVerse` int NOT NULL,
	`description` text,
	`type` enum('prophecy','fulfillment','parallel','contrast','quote') NOT NULL DEFAULT 'parallel',
	CONSTRAINT `correlations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`bookName` varchar(100) NOT NULL,
	`chapter` int NOT NULL,
	`verseStart` int NOT NULL,
	`verseEnd` int NOT NULL,
	`theme` varchar(200),
	`meditationPrompt` text,
	CONSTRAINT `daily_readings_id` PRIMARY KEY(`id`),
	CONSTRAINT `daily_readings_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `emmanuel_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`chapter` int NOT NULL,
	`verseStart` int NOT NULL,
	`verseEnd` int NOT NULL,
	`comment` text NOT NULL,
	`source` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emmanuel_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reading_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`bookName` varchar(100) NOT NULL,
	`chapter` int NOT NULL,
	`verseStart` int,
	`verseEnd` int,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `reading_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `ai_verse_idx` ON `ai_interpretations` (`bookAbbrev`,`chapter`,`verseStart`);--> statement-breakpoint
CREATE INDEX `book_chapter_idx` ON `bible_verses` (`bookId`,`chapter`);--> statement-breakpoint
CREATE INDEX `abbrev_idx` ON `bible_verses` (`bookAbbrev`);--> statement-breakpoint
CREATE INDEX `emmanuel_book_chapter_idx` ON `emmanuel_comments` (`bookAbbrev`,`chapter`);--> statement-breakpoint
CREATE INDEX `history_user_idx` ON `reading_history` (`userId`);--> statement-breakpoint
CREATE INDEX `history_read_at_idx` ON `reading_history` (`readAt`);