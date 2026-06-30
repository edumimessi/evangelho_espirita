CREATE TABLE `gospel_meeting_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`bookAbbrev` varchar(10) NOT NULL,
	`bookName` varchar(100) NOT NULL,
	`chapter` int NOT NULL,
	`verse` int NOT NULL,
	`verseText` text,
	`theme` varchar(200),
	`note` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gospel_meeting_notes_id` PRIMARY KEY(`id`),
	CONSTRAINT `meeting_user_date_unique` UNIQUE(`userId`,`date`)
);
--> statement-breakpoint
CREATE INDEX `meeting_user_idx` ON `gospel_meeting_notes` (`userId`);