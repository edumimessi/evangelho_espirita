DROP INDEX `fav_user_verse_idx` ON `verse_favorites`;--> statement-breakpoint
DROP INDEX `note_user_verse_idx` ON `verse_notes`;--> statement-breakpoint
ALTER TABLE `verse_favorites` ADD CONSTRAINT `fav_user_verse_unique` UNIQUE(`userId`,`bookAbbrev`,`chapter`,`verse`);--> statement-breakpoint
ALTER TABLE `verse_notes` ADD CONSTRAINT `note_user_verse_unique` UNIQUE(`userId`,`bookAbbrev`,`chapter`,`verse`);