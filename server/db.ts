import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  aiInterpretations,
  bibleBooks,
  bibleVerses,
  correlations,
  dailyReadings,
  devocionalCache,
  emmanuelComments,
  gospelMeetingNotes,
  InsertUser,
  readingHistory,
  users,
  verseNotes,
  verseFavorites,
  bibliaCaminhoSource,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Bible Books ─────────────────────────────────────────────────────────────

export async function getAllBooks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bibleBooks).orderBy(bibleBooks.order);
}

export async function getBookByAbbrev(abbrev: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(bibleBooks).where(eq(bibleBooks.abbrev, abbrev)).limit(1);
  return result[0] ?? null;
}

// ─── Bible Verses ─────────────────────────────────────────────────────────────

export async function getChapter(bookAbbrev: string, chapter: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bibleVerses)
    .where(and(eq(bibleVerses.bookAbbrev, bookAbbrev), eq(bibleVerses.chapter, chapter)))
    .orderBy(bibleVerses.verse);
}

export async function getVerseRange(
  bookAbbrev: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bibleVerses)
    .where(
      and(
        eq(bibleVerses.bookAbbrev, bookAbbrev),
        eq(bibleVerses.chapter, chapter),
        gte(bibleVerses.verse, verseStart),
        lte(bibleVerses.verse, verseEnd)
      )
    )
    .orderBy(bibleVerses.verse);
}

// ─── Verse Notes ─────────────────────────────────────────────────────────────

export async function saveVerseNote(
  userId: number,
  bookAbbrev: string,
  chapter: number,
  verse: number,
  note: string
) {
  const db = await getDb();
  if (!db) return null;
  await db
    .insert(verseNotes)
    .values({ userId, bookAbbrev, chapter, verse, note })
    .onDuplicateKeyUpdate({ set: { note, updatedAt: new Date() } });
  const result = await db
    .select()
    .from(verseNotes)
    .where(
      and(
        eq(verseNotes.userId, userId),
        eq(verseNotes.bookAbbrev, bookAbbrev),
        eq(verseNotes.chapter, chapter),
        eq(verseNotes.verse, verse)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getVerseNote(
  userId: number,
  bookAbbrev: string,
  chapter: number,
  verse: number
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(verseNotes)
    .where(
      and(
        eq(verseNotes.userId, userId),
        eq(verseNotes.bookAbbrev, bookAbbrev),
        eq(verseNotes.chapter, chapter),
        eq(verseNotes.verse, verse)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function getChapterNotes(userId: number, bookAbbrev: string, chapter: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(verseNotes)
    .where(
      and(
        eq(verseNotes.userId, userId),
        eq(verseNotes.bookAbbrev, bookAbbrev),
        eq(verseNotes.chapter, chapter)
      )
    )
    .orderBy(verseNotes.verse);
}

export async function deleteVerseNote(
  userId: number,
  bookAbbrev: string,
  chapter: number,
  verse: number
) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(verseNotes)
    .where(
      and(
        eq(verseNotes.userId, userId),
        eq(verseNotes.bookAbbrev, bookAbbrev),
        eq(verseNotes.chapter, chapter),
        eq(verseNotes.verse, verse)
      )
    );
}

// ─── Verse Favorites ─────────────────────────────────────────────────────────

export async function toggleVerseFavorite(
  userId: number,
  bookAbbrev: string,
  bookName: string,
  chapter: number,
  verse: number,
  verseText: string
) {
  const db = await getDb();
  if (!db) return { isFavorite: false };
  const existing = await db
    .select()
    .from(verseFavorites)
    .where(
      and(
        eq(verseFavorites.userId, userId),
        eq(verseFavorites.bookAbbrev, bookAbbrev),
        eq(verseFavorites.chapter, chapter),
        eq(verseFavorites.verse, verse)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(verseFavorites)
      .where(
        and(
          eq(verseFavorites.userId, userId),
          eq(verseFavorites.bookAbbrev, bookAbbrev),
          eq(verseFavorites.chapter, chapter),
          eq(verseFavorites.verse, verse)
        )
      );
    return { isFavorite: false };
  } else {
    await db
      .insert(verseFavorites)
      .values({ userId, bookAbbrev, bookName, chapter, verse, verseText });
    return { isFavorite: true };
  }
}

export async function getChapterFavorites(userId: number, bookAbbrev: string, chapter: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ verse: verseFavorites.verse })
    .from(verseFavorites)
    .where(
      and(
        eq(verseFavorites.userId, userId),
        eq(verseFavorites.bookAbbrev, bookAbbrev),
        eq(verseFavorites.chapter, chapter)
      )
    );
  return rows.map((r) => r.verse);
}

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(verseFavorites)
    .where(eq(verseFavorites.userId, userId))
    .orderBy(verseFavorites.createdAt);
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchVerses(query: string, testament?: "old" | "new") {
  const db = await getDb();
  if (!db) return [];

  if (testament) {
    const books = await db
      .select({ abbrev: bibleBooks.abbrev })
      .from(bibleBooks)
      .where(eq(bibleBooks.testament, testament));
    const abbrevs = books.map((b) => b.abbrev);
    if (abbrevs.length === 0) return [];

    return db
      .select({
        id: bibleVerses.id,
        bookAbbrev: bibleVerses.bookAbbrev,
        chapter: bibleVerses.chapter,
        verse: bibleVerses.verse,
        text: bibleVerses.text,
      })
      .from(bibleVerses)
      .where(
        and(
          like(bibleVerses.text, `%${query}%`),
          sql`${bibleVerses.bookAbbrev} IN (${sql.join(abbrevs.map((a) => sql`${a}`), sql`, `)})`
        )
      )
      .limit(50);
  }

  return db
    .select({
      id: bibleVerses.id,
      bookAbbrev: bibleVerses.bookAbbrev,
      chapter: bibleVerses.chapter,
      verse: bibleVerses.verse,
      text: bibleVerses.text,
    })
    .from(bibleVerses)
    .where(like(bibleVerses.text, `%${query}%`))
    .limit(50);
}

// ─── Emmanuel Comments ────────────────────────────────────────────────────────

export async function getEmmanuelComments(bookAbbrev: string, chapter: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(emmanuelComments)
    .where(
      and(
        eq(emmanuelComments.bookAbbrev, bookAbbrev),
        eq(emmanuelComments.chapter, chapter)
      )
    );
}

export async function saveEmmanuelComment(data: {
  bookAbbrev: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  comment: string;
  source?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(emmanuelComments).values(data);
}

// ─── Correlations ─────────────────────────────────────────────────────────────

export async function getCorrelations(bookAbbrev: string, chapter: number, verse: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(correlations)
    .where(
      or(
        and(
          eq(correlations.sourceBookAbbrev, bookAbbrev),
          eq(correlations.sourceChapter, chapter),
          eq(correlations.sourceVerse, verse)
        ),
        and(
          eq(correlations.targetBookAbbrev, bookAbbrev),
          eq(correlations.targetChapter, chapter),
          eq(correlations.targetVerse, verse)
        )
      )
    );
}

// ─── Reading History ──────────────────────────────────────────────────────────

export async function addReadingHistory(data: {
  userId: number;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verseStart?: number;
  verseEnd?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(readingHistory).values({ ...data, readAt: new Date() });
}

export async function getUserHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(readingHistory)
    .where(eq(readingHistory.userId, userId))
    .orderBy(desc(readingHistory.readAt))
    .limit(limit);
}

// ─── Daily Reading ────────────────────────────────────────────────────────────

export async function getDailyReading(dateStr?: string) {
  const db = await getDb();
  if (!db) return null;
  const date = dateStr ?? new Date().toISOString().split("T")[0];
  const result = await db
    .select()
    .from(dailyReadings)
    .where(eq(dailyReadings.date, date))
    .limit(1);
  return result[0] ?? null;
}

// ─── AI Interpretations Cache ─────────────────────────────────────────────────

export async function getCachedInterpretation(
  bookAbbrev: string,
  chapter: number,
  verseStart: number,
  verseEnd: number
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(aiInterpretations)
    .where(
      and(
        eq(aiInterpretations.bookAbbrev, bookAbbrev),
        eq(aiInterpretations.chapter, chapter),
        eq(aiInterpretations.verseStart, verseStart),
        eq(aiInterpretations.verseEnd, verseEnd)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function saveInterpretation(data: {
  bookAbbrev: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  interpretation: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(aiInterpretations)
    .values(data)
    .onDuplicateKeyUpdate({ set: { interpretation: data.interpretation, updatedAt: new Date() } });
}


// ─── Gospel Meeting Notes (Diário Espiritual) ────────────────────────────────

export async function saveMeetingNote(data: {
  userId: number;
  date: string;
  bookAbbrev: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string | null;
  theme: string | null;
  note: string;
  sentimento?: string | null;
  insight?: string | null;
  contexto?: string | null;
}) {
  const db = await getDb();
  if (!db) return null;
  await db
    .insert(gospelMeetingNotes)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        note: data.note,
        sentimento: data.sentimento ?? null,
        insight: data.insight ?? null,
        contexto: data.contexto ?? null,
        updatedAt: new Date(),
      },
    });
  return { success: true };
}

export async function getMeetingNote(userId: number, date: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(gospelMeetingNotes)
    .where(and(eq(gospelMeetingNotes.userId, userId), eq(gospelMeetingNotes.date, date)))
    .limit(1);
  return result[0] ?? null;
}

export async function getMeetingNotesList(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(gospelMeetingNotes)
    .where(eq(gospelMeetingNotes.userId, userId))
    .orderBy(desc(gospelMeetingNotes.date))
    .limit(limit);
}

// ─── Devocional Cache ────────────────────────────────────────────────────────

export async function getDevocionalCache(date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(devocionalCache)
    .where(eq(devocionalCache.date, date))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveDevocionalCache(data: {
  date: string;
  reference: string;
  verseText: string;
  reflexao: string;
  oracao: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(devocionalCache)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        reflexao: data.reflexao,
        oracao: data.oracao,
      },
    });
}

// ─── Cache de texto-fonte (bibliadocaminho.com) ───────────────────────────────

export async function getBibliaCaminhoSource(sourceKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bibliaCaminhoSource)
    .where(eq(bibliaCaminhoSource.sourceKey, sourceKey))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function saveBibliaCaminhoSource(data: {
  sourceKey: string;
  sourceUrl: string;
  pageTitle: string;
  cleanedText: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(bibliaCaminhoSource)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        sourceUrl: data.sourceUrl,
        pageTitle: data.pageTitle,
        cleanedText: data.cleanedText,
        fetchedAt: new Date(),
      },
    });
}
