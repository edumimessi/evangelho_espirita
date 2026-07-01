import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { searchVerses } from "./db";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getAllBooks: vi.fn().mockResolvedValue([
    { id: 1, abbrev: "mt", name: "Mateus", testament: "new", order: 40, author: "Mateus", genre: "Evangelho", chapterCount: 28 },
    { id: 2, abbrev: "gn", name: "Gênesis", testament: "old", order: 1, author: "Moisés", genre: "Pentateuco", chapterCount: 50 },
  ]),
  getBookByAbbrev: vi.fn().mockResolvedValue({
    id: 1, abbrev: "mt", name: "Mateus", testament: "new", order: 40, chapterCount: 28,
  }),
  getChapter: vi.fn().mockResolvedValue([
    { id: 1, bookAbbrev: "mt", chapter: 5, verse: 1, text: "Bem-aventurados os pobres de espírito, porque deles é o reino dos céus.", version: "blj" },
    { id: 2, bookAbbrev: "mt", chapter: 5, verse: 2, text: "Bem-aventurados os que choram, porque eles serão consolados.", version: "blj" },
  ]),
  getEmmanuelComments: vi.fn().mockResolvedValue([]),
  getVerseRange: vi.fn().mockResolvedValue([
    { id: 1, bookAbbrev: "mt", chapter: 5, verse: 1, text: "Bem-aventurados os pobres de espírito.", version: "blj" },
  ]),
  searchVerses: vi.fn().mockResolvedValue([
    { id: 1, bookAbbrev: "mt", chapter: 5, verse: 3, text: "Bem-aventurados os pobres de espírito.", bookName: "Mateus" },
  ]),
  getDailyReading: vi.fn().mockResolvedValue({
    id: 1, date: "2026-06-29", bookAbbrev: "mt", bookName: "Mateus",
    chapter: 5, verseStart: 1, verseEnd: 12, theme: "As Bem-aventuranças",
  }),
  addReadingHistory: vi.fn().mockResolvedValue(undefined),
  getUserHistory: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, bookAbbrev: "mt", bookName: "Mateus", chapter: 5, readAt: new Date() },
  ]),
  getCachedInterpretation: vi.fn().mockResolvedValue(null),
  saveInterpretation: vi.fn().mockResolvedValue(undefined),
  saveEmmanuelComment: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Interpretação de teste gerada pela IA." } }],
  }),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1, openId: "test-user", email: "test@test.com", name: "Test User",
      loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("bible router", () => {
  it("should return all books", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const books = await caller.bible.books();
    expect(books).toHaveLength(2);
    expect(books[0].name).toBe("Mateus");
  });

  it("should return a book by abbrev", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const book = await caller.bible.book({ abbrev: "mt" });
    expect(book?.name).toBe("Mateus");
  });

  it("should return chapter with verses and comments", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const data = await caller.bible.chapter({ bookAbbrev: "mt", chapter: 5 });
    expect(data.verses).toHaveLength(2);
    expect(data.verses[0].text).toContain("Bem-aventurados");
    expect(data.emmanuelComments).toHaveLength(0);
  });

  it("should search verses by keyword", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const results = await caller.bible.search({ query: "bem-aventurados" });
    expect(results).toHaveLength(1);
  });

  it("should search verses by a list of theme terms (OR)", async () => {
    vi.mocked(searchVerses).mockClear();
    const caller = appRouter.createCaller(createPublicCtx());
    const results = await caller.bible.search({ terms: ["amai", "amados", "amor"] });
    expect(results).toHaveLength(1);
    expect(searchVerses).toHaveBeenCalledWith(["amai", "amados", "amor"], undefined);
  });

  it("should reject a search with neither query nor terms", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.bible.search({})).rejects.toThrow();
  });

  it("should return Emmanuel's commentary index for a chapter", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const index = await caller.bible.emmanuelIndex({ bookAbbrev: "mt", chapter: 5 });
    // Mateus 5.3 (bem-aventurados os pobres de espírito) tem várias referências.
    expect(Array.isArray(index["3"])).toBe(true);
    expect(index["3"].length).toBeGreaterThan(0);
    expect(index["3"][0]).toHaveProperty("title");
    // Mateus 5.14 cita "Sois a luz (Fv.105)" -> fonte amigável "Fonte Viva".
    const fonteViva = index["14"]?.find((r) => r.code === "Fv.105");
    expect(fonteViva?.source).toBe("Fonte Viva");
  });

  it("returns empty index for a chapter without Emmanuel references", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const index = await caller.bible.emmanuelIndex({ bookAbbrev: "gn", chapter: 1 });
    expect(index).toEqual({});
  });

  it("themeSearch should search all mapped words, not just the first", async () => {
    vi.mocked(searchVerses).mockClear();
    const caller = appRouter.createCaller(createPublicCtx());
    await caller.ai.themeSearch({ theme: "reencarnação" });
    const arg = vi.mocked(searchVerses).mock.calls[0]?.[0];
    expect(Array.isArray(arg)).toBe(true);
    expect((arg as string[]).length).toBeGreaterThan(1);
  });
});

describe("daily router", () => {
  it("should return today's reading with verses", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const data = await caller.daily.today();
    expect(data).not.toBeNull();
    expect(data?.reading.theme).toBe("As Bem-aventuranças");
    expect(data?.verses).toHaveLength(1);
  });
});

describe("history router", () => {
  it("should require authentication to list history", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.history.list({ limit: 10 })).rejects.toThrow();
  });

  it("should return history for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const history = await caller.history.list({ limit: 10 });
    expect(history).toHaveLength(1);
    expect(history[0].bookName).toBe("Mateus");
  });

  it("should add reading to history for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.history.add({
      bookAbbrev: "mt", bookName: "Mateus", chapter: 5,
    });
    expect(result.success).toBe(true);
  });
});

describe("ai router", () => {
  it("should generate interpretation for a passage", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.ai.interpret({
      bookAbbrev: "mt", bookName: "Mateus", chapter: 5,
      verseStart: 1, verseEnd: 12,
      verses: [{ verse: 1, text: "Bem-aventurados os pobres de espírito." }],
    });
    expect(result.interpretation).toBeTruthy();
    expect(result.cached).toBe(false);
  });
});

describe("auth router", () => {
  it("should return null user when not authenticated", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("should return user when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const user = await caller.auth.me();
    expect(user?.name).toBe("Test User");
  });
});
