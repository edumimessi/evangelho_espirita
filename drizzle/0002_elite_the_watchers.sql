CREATE TABLE `verse_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`bookName` varchar(100) NOT NULL,
	`chapter` int NOT NULL,
	`verse` int NOT NULL,
	`verseText` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verse_favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verse_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`chapter` int NOT NULL,
	`verse` int NOT NULL,
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verse_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `fav_user_idx` ON `verse_favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `fav_user_verse_idx` ON `verse_favorites` (`userId`,`bookAbbrev`,`chapter`,`verse`);--> statement-breakpoint
CREATE INDEX `note_user_verse_idx` ON `verse_notes` (`userId`,`bookAbbrev`,`chapter`,`verse`);