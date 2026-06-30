import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  index,
  uniqueIndex,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Livros da Bíblia
export const bibleBooks = mysqlTable("bible_books", {
  id: int("id").autoincrement().primaryKey(),
  abbrev: varchar("abbrev", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  testament: mysqlEnum("testament", ["old", "new"]).notNull(),
  order: int("order").notNull(),
  author: varchar("author", { length: 200 }),
  genre: varchar("genre", { length: 100 }),
  chapterCount: int("chapterCount").notNull().default(0),
});

export type BibleBook = typeof bibleBooks.$inferSelect;

// Versículos bíblicos
export const bibleVerses = mysqlTable(
  "bible_verses",
  {
    id: int("id").autoincrement().primaryKey(),
    bookId: int("bookId").notNull(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    chapter: int("chapter").notNull(),
    verse: int("verse").notNull(),
    text: text("text").notNull(),
    version: varchar("version", { length: 20 }).notNull().default("nvi"),
  },
  (table) => ({
    bookChapterIdx: index("book_chapter_idx").on(table.bookId, table.chapter),
    abbrevIdx: index("abbrev_idx").on(table.bookAbbrev),
  })
);

export type BibleVerse = typeof bibleVerses.$inferSelect;

// Comentários de Emmanuel (gerados por IA com base na obra)
export const emmanuelComments = mysqlTable(
  "emmanuel_comments",
  {
    id: int("id").autoincrement().primaryKey(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    chapter: int("chapter").notNull(),
    verseStart: int("verseStart").notNull(),
    verseEnd: int("verseEnd").notNull(),
    comment: text("comment").notNull(),
    source: varchar("source", { length: 200 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    bookChapterIdx: index("emmanuel_book_chapter_idx").on(
      table.bookAbbrev,
      table.chapter
    ),
  })
);

export type EmmanuelComment = typeof emmanuelComments.$inferSelect;

// Correlações AT/NT
export const correlations = mysqlTable("correlations", {
  id: int("id").autoincrement().primaryKey(),
  sourceBookAbbrev: varchar("sourceBookAbbrev", { length: 10 }).notNull(),
  sourceChapter: int("sourceChapter").notNull(),
  sourceVerse: int("sourceVerse").notNull(),
  targetBookAbbrev: varchar("targetBookAbbrev", { length: 10 }).notNull(),
  targetChapter: int("targetChapter").notNull(),
  targetVerse: int("targetVerse").notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["prophecy", "fulfillment", "parallel", "contrast", "quote"]).notNull().default("parallel"),
});

export type Correlation = typeof correlations.$inferSelect;

// Histórico de leituras
export const readingHistory = mysqlTable(
  "reading_history",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    bookName: varchar("bookName", { length: 100 }).notNull(),
    chapter: int("chapter").notNull(),
    verseStart: int("verseStart"),
    verseEnd: int("verseEnd"),
    readAt: timestamp("readAt").defaultNow().notNull(),
    notes: text("notes"),
  },
  (table) => ({
    userIdx: index("history_user_idx").on(table.userId),
    readAtIdx: index("history_read_at_idx").on(table.readAt),
  })
);

export type ReadingHistory = typeof readingHistory.$inferSelect;

// Leitura diária
export const dailyReadings = mysqlTable("daily_readings", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
  bookName: varchar("bookName", { length: 100 }).notNull(),
  chapter: int("chapter").notNull(),
  verseStart: int("verseStart").notNull(),
  verseEnd: int("verseEnd").notNull(),
  theme: varchar("theme", { length: 200 }),
  meditationPrompt: text("meditationPrompt"),
});

export type DailyReading = typeof dailyReadings.$inferSelect;

// Cache de interpretações IA
export const aiInterpretations = mysqlTable(
  "ai_interpretations",
  {
    id: int("id").autoincrement().primaryKey(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    chapter: int("chapter").notNull(),
    verseStart: int("verseStart").notNull(),
    verseEnd: int("verseEnd").notNull(),
    interpretation: text("interpretation").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    verseIdx: index("ai_verse_idx").on(
      table.bookAbbrev,
      table.chapter,
      table.verseStart
    ),
  })
);

export type AiInterpretation = typeof aiInterpretations.$inferSelect;

// Anotações pessoais por versículo
export const verseNotes = mysqlTable(
  "verse_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    chapter: int("chapter").notNull(),
    verse: int("verse").notNull(),
    note: text("note").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userVerseUnique: uniqueIndex("note_user_verse_unique").on(
      table.userId,
      table.bookAbbrev,
      table.chapter,
      table.verse
    ),
  })
);

export type VerseNote = typeof verseNotes.$inferSelect;

// Versículos favoritos
export const verseFavorites = mysqlTable(
  "verse_favorites",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    bookName: varchar("bookName", { length: 100 }).notNull(),
    chapter: int("chapter").notNull(),
    verse: int("verse").notNull(),
    verseText: text("verseText").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userFavIdx: index("fav_user_idx").on(table.userId),
    userVerseUnique: uniqueIndex("fav_user_verse_unique").on(
      table.userId,
      table.bookAbbrev,
      table.chapter,
      table.verse
    ),
  })
);

export type VerseFavorite = typeof verseFavorites.$inferSelect;

// Anotações das reuniões do Evangelho no Lar
export const gospelMeetingNotes = mysqlTable(
  "gospel_meeting_notes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    bookAbbrev: varchar("bookAbbrev", { length: 10 }).notNull(),
    bookName: varchar("bookName", { length: 100 }).notNull(),
    chapter: int("chapter").notNull(),
    verse: int("verse").notNull(),
    verseText: text("verseText"),
    theme: varchar("theme", { length: 200 }),
    note: text("note").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userDateUnique: uniqueIndex("meeting_user_date_unique").on(
      table.userId,
      table.date
    ),
    userIdx: index("meeting_user_idx").on(table.userId),
  })
);

export type GospelMeetingNote = typeof gospelMeetingNotes.$inferSelect;
export type InsertGospelMeetingNote = typeof gospelMeetingNotes.$inferInsert;

// Cache do devocional diário (evita regenerar no mesmo dia)
export const devocionalCache = mysqlTable(
  "devocional_cache",
  {
    id: int("id").autoincrement().primaryKey(),
    date: varchar("date", { length: 10 }).notNull().unique(), // YYYY-MM-DD
    reference: varchar("reference", { length: 200 }).notNull(),
    verseText: text("verseText").notNull(),
    reflexao: text("reflexao").notNull(),
    oracao: text("oracao").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  }
);

export type DevocionalCache = typeof devocionalCache.$inferSelect;
