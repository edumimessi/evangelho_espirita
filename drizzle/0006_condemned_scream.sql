ALTER TABLE `gospel_meeting_notes` MODIFY COLUMN `note` text;--> statement-breakpoint
ALTER TABLE `gospel_meeting_notes` ADD `sentimento` text;--> statement-breakpoint
ALTER TABLE `gospel_meeting_notes` ADD `insight` text;--> statement-breakpoint
ALTER TABLE `gospel_meeting_notes` ADD `contexto` varchar(300);