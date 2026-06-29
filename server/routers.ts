import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addReadingHistory,
  getAllBooks,
  getBookByAbbrev,
  getCachedInterpretation,
  getChapter,
  getDailyReading,
  getEmmanuelComments,
  getUserHistory,
  getVerseRange,
  saveEmmanuelComment,
  saveInterpretation,
  searchVerses,
} from "./db";

// ─── Bible Router ─────────────────────────────────────────────────────────────

const bibleRouter = router({
  // Listar todos os livros
  books: publicProcedure.query(async () => {
    return getAllBooks();
  }),

  // Buscar livro por abreviação
  book: publicProcedure
    .input(z.object({ abbrev: z.string() }))
    .query(async ({ input }) => {
      return getBookByAbbrev(input.abbrev);
    }),

  // Buscar capítulo completo
  chapter: publicProcedure
    .input(z.object({ bookAbbrev: z.string(), chapter: z.number().int().positive() }))
    .query(async ({ input }) => {
      const [verses, comments] = await Promise.all([
        getChapter(input.bookAbbrev, input.chapter),
        getEmmanuelComments(input.bookAbbrev, input.chapter),
      ]);
      return { verses, emmanuelComments: comments };
    }),

  // Buscar intervalo de versículos
  verseRange: publicProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        chapter: z.number().int().positive(),
        verseStart: z.number().int().positive(),
        verseEnd: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      return getVerseRange(input.bookAbbrev, input.chapter, input.verseStart, input.verseEnd);
    }),

  // Busca por texto
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(2),
        testament: z.enum(["old", "new"]).optional(),
      })
    )
    .query(async ({ input }) => {
      return searchVerses(input.query, input.testament);
    }),

  // Busca por referência específica (livro, capítulo, versículo)
  reference: publicProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        chapter: z.number().int().positive(),
        verse: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input }) => {
      if (input.verse) {
        return getVerseRange(input.bookAbbrev, input.chapter, input.verse, input.verse);
      }
      return getChapter(input.bookAbbrev, input.chapter);
    }),
});

// ─── Daily Reading Router ─────────────────────────────────────────────────────

const dailyRouter = router({
  today: publicProcedure.query(async () => {
    const reading = await getDailyReading();
    if (!reading) return null;

    const verses = await getVerseRange(
      reading.bookAbbrev,
      reading.chapter,
      reading.verseStart,
      reading.verseEnd
    );
    const comments = await getEmmanuelComments(reading.bookAbbrev, reading.chapter);

    return { reading, verses, emmanuelComments: comments };
  }),

  byDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => {
      const reading = await getDailyReading(input.date);
      if (!reading) return null;
      const verses = await getVerseRange(
        reading.bookAbbrev,
        reading.chapter,
        reading.verseStart,
        reading.verseEnd
      );
      return { reading, verses };
    }),
});

// ─── History Router ───────────────────────────────────────────────────────────

const historyRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      return getUserHistory(ctx.user.id, input.limit);
    }),

  add: protectedProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        bookName: z.string(),
        chapter: z.number().int().positive(),
        verseStart: z.number().int().positive().optional(),
        verseEnd: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await addReadingHistory({ userId: ctx.user.id, ...input });
      return { success: true };
    }),
});

// ─── AI Interpretation Router ─────────────────────────────────────────────────

const aiRouter = router({
  // Gerar interpretação no estilo Haroldo Dutra Dias
  interpret: publicProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        bookName: z.string(),
        chapter: z.number().int().positive(),
        verseStart: z.number().int().positive(),
        verseEnd: z.number().int().positive(),
        verses: z.array(z.object({ verse: z.number(), text: z.string() })),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar cache
      const cached = await getCachedInterpretation(
        input.bookAbbrev,
        input.chapter,
        input.verseStart,
        input.verseEnd
      );
      if (cached) return { interpretation: cached.interpretation, cached: true };

      const versesText = input.verses
        .map((v) => `${v.verse}. ${v.text}`)
        .join("\n");

      const reference = `${input.bookName} ${input.chapter}:${input.verseStart}${input.verseEnd > input.verseStart ? `-${input.verseEnd}` : ""}`;

      const prompt = `Analise o trecho bíblico abaixo com o rigor exegético e a profundidade espiritual de Haroldo Dutra Dias.

**Passagem:** ${reference}

**Texto:**
${versesText}

Sua análise deve cobrir os seguintes aspectos, em parágrafos corridos e sem subtítulos:

1. CONTEXTO HISTÓRICO E LINGUÍSTICO: Explique o contexto em que o texto foi escrito. Quando pertinente, esclareça expressões do idioma original (hebraico ou grego) que iluminam o sentido — por exemplo, se o texto menciona que Jesus "se sentou" para ensinar, explique que sentar era a postura formal do mestre judeu ao dar uma instrução oficial; se menciona "abrir a boca", explique que era uma expressão solene indicando que algo de grande importância seria dito.

2. EXEGESE DO TEXTO: Explique o que o texto diz de fato, sem alegorias forçadas. Identifique a estrutura do argumento do autor e o que ele pretendia comunicar aos destinatários originais.

3. CORRELAÇÕES BÍBLICAS: Aponte passagens do Antigo Testamento que prefiguram ou dialogam com o trecho, e paralelos no Novo Testamento. Mostre como o texto se encaixa na unidade da mensagem bíblica.

4. LEITURA ESPÍRITA: Conecte o trecho com os princípios da Doutrina Espírita — reencarnação, lei de causa e efeito, evolução espiritual, pluralidade dos mundos — citando quando relevante O Evangelho Segundo o Espiritismo ou O Livro dos Espíritos. Seja preciso, não genérico.

5. APLICAÇÃO PRÁTICA: Termine com uma reflexão objetiva sobre o que o trecho exige de quem o lê hoje.

Estilo: direto, claro, intelectualmente rigoroso. Sem floreios nem linguagem excessivamente poética. Aproximadamente 400-500 palavras em parágrafos corridos.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um hermeneuta espírita especializado na obra de Haroldo Dutra Dias e na Doutrina Espírita codificada por Allan Kardec. Seu estilo é direto, claro e rigoroso: você explica o contexto histórico e linguístico do texto, faz exegese precisa, aponta correlações bíblicas e conecta com a doutrina espírita sem usar linguagem excessivamente poética ou floreada. Você escreve como um professor que respeita a inteligência do leitor.",
          },
          { role: "user", content: prompt },
        ],
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      const interpretation =
        typeof rawContent === "string" ? rawContent : "Interpretação não disponível.";

      // Salvar no cache
      await saveInterpretation({
        bookAbbrev: input.bookAbbrev,
        chapter: input.chapter,
        verseStart: input.verseStart,
        verseEnd: input.verseEnd,
        interpretation,
      });

      return { interpretation, cached: false };
    }),

  // Gerar comentário de Emmanuel para um trecho
  emmanuelComment: publicProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        bookName: z.string(),
        chapter: z.number().int().positive(),
        verseStart: z.number().int().positive(),
        verseEnd: z.number().int().positive(),
        verses: z.array(z.object({ verse: z.number(), text: z.string() })),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se já existe no banco
      const existing = await getEmmanuelComments(input.bookAbbrev, input.chapter);
      const match = existing.find(
        (c) => c.verseStart <= input.verseStart && c.verseEnd >= input.verseEnd
      );
      if (match) return { comment: match.comment, cached: true };

      const versesText = input.verses.map((v) => `${v.verse}. ${v.text}`).join("\n");
      const reference = `${input.bookName} ${input.chapter}:${input.verseStart}${input.verseEnd > input.verseStart ? `-${input.verseEnd}` : ""}`;

      const prompt = `Escreva um comentário espiritual sobre o trecho abaixo, no estilo de Emmanuel (mentor espiritual de Francisco Cândido Xavier).

**Passagem:** ${reference}

**Texto:**
${versesText}

O comentário deve:
- Explicar o que o trecho ensina de forma direta e clara, sem exagero poético
- Conectar a mensagem com a vida espiritual prática do leitor
- Quando o texto tiver elementos históricos ou culturais relevantes (como costumes judaicos, expressões da época), mencioná-los brevemente para iluminar o sentido
- Ter entre 150 e 200 palavras
- Ser escrito em terceira pessoa, como um comentário sobre o trecho (não em primeira pessoa como se fosse Emmanuel falando)
- Usar linguagem simples, direta e acessível — sem metáforas excessivas nem linguagem mística rebuscada
- Terminar com uma aplicação prática objetiva para o leitor`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um comentarista espírita especializado na obra de Emmanuel/Chico Xavier. Seu estilo é claro, direto e edificante — você explica o que o texto bíblico ensina na prática, sem linguagem excessivamente poética ou mística. Você respeita o leitor e vai direto ao ponto.",
          },
          { role: "user", content: prompt },
        ],
      });

      const rawComment = response?.choices?.[0]?.message?.content;
      const comment =
        typeof rawComment === "string" ? rawComment : "Comentário não disponível.";

      // Salvar no banco
      await saveEmmanuelComment({
        bookAbbrev: input.bookAbbrev,
        chapter: input.chapter,
        verseStart: input.verseStart,
        verseEnd: input.verseEnd,
        comment,
        source: "Gerado por IA com base na obra de Emmanuel/Chico Xavier",
      });

      return { comment, cached: false };
    }),

  // Correlações AT/NT
  correlations: publicProcedure
    .input(
      z.object({
        bookAbbrev: z.string(),
        bookName: z.string(),
        chapter: z.number().int().positive(),
        verseStart: z.number().int().positive(),
        verseEnd: z.number().int().positive(),
        verses: z.array(z.object({ verse: z.number(), text: z.string() })),
      })
    )
    .mutation(async ({ input }) => {
      const versesText = input.verses.map((v) => `${v.verse}. ${v.text}`).join("\n");
      const reference = `${input.bookName} ${input.chapter}:${input.verseStart}-${input.verseEnd}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em hermenêutica bíblica com foco em correlações entre o Antigo e o Novo Testamento, especialmente sob a ótica da Doutrina Espírita.",
          },
          {
            role: "user",
            content: `Identifique as principais correlações entre o trecho abaixo e outras passagens bíblicas (especialmente entre AT e NT). Para cada correlação, explique brevemente a conexão.

**Passagem:** ${reference}
**Texto:**
${versesText}

Responda em JSON com o formato:
{
  "correlations": [
    {
      "reference": "Livro Cap:Vers",
      "text": "Texto do versículo correlacionado",
      "type": "prophecy|fulfillment|parallel|contrast|quote",
      "description": "Breve explicação da correlação (1-2 frases)"
    }
  ]
}

Máximo 5 correlações mais relevantes.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "correlations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correlations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      reference: { type: "string" },
                      text: { type: "string" },
                      type: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["reference", "text", "type", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["correlations"],
              additionalProperties: false,
            },
          },
        },
      });

      try {
        const rawCorr = response?.choices?.[0]?.message?.content;
        const content = typeof rawCorr === "string" ? rawCorr : "{}";
        const parsed = JSON.parse(content);
        return parsed;
      } catch {
        return { correlations: [] };
      }
    }),

  // Busca por temas espíritas
  themeSearch: publicProcedure
    .input(z.object({ theme: z.string().min(2) }))
    .query(async ({ input }) => {
      const spiritThemes: Record<string, string> = {
        reencarnação: "reencarnação renascer nascer de novo",
        "lei de causa e efeito": "colher semear plantou colherá",
        caridade: "amor próximo caridade dar",
        "evolução espiritual": "perfeição crescer aprender",
        mediunidade: "espírito comunicação revelação",
        "vida após a morte": "ressurreição vida eterna morte",
        oração: "orar oração pedir buscar",
        perdão: "perdoar perdão misericórdia",
        humildade: "humilde humildade servo",
        amor: "amor amar amados",
      };

      const searchTerm = spiritThemes[input.theme.toLowerCase()] ?? input.theme;
      const words = searchTerm.split(" ");
      const results = await searchVerses(words[0]);
      return results;
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  bible: bibleRouter,
  daily: dailyRouter,
  history: historyRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
