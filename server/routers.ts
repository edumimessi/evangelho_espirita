import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  addReadingHistory,
  deleteVerseNote,
  getAllBooks,
  getBookByAbbrev,
  getCachedInterpretation,
  getChapter,
  getChapterFavorites,
  getChapterNotes,
  getDailyReading,
  getDevocionalCache,
  getEmmanuelComments,
  getMeetingNote,
  getMeetingNotesList,
  getUserFavorites,
  getUserHistory,
  getVerseRange,
  saveDevocionalCache,
  saveEmmanuelComment,
  saveInterpretation,
  saveMeetingNote,
  saveVerseNote,
  searchVerses,
  toggleVerseFavorite,
} from "./db";
import { fetchEseChapterSource } from "./services/bibliaCaminhoScraper";
import { getEmmanuelChapterIndex, emmanuelSiglas } from "./data/emmanuelIndex";

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

  // Busca por texto (query livre) ou por tema (lista de termos, OR)
  search: publicProcedure
    .input(
      z
        .object({
          query: z.string().optional(),
          terms: z.array(z.string()).optional(),
          testament: z.enum(["old", "new"]).optional(),
        })
        .refine(
          (v) => (v.query?.trim().length ?? 0) >= 2 || (v.terms?.length ?? 0) > 0,
          { message: "Informe ao menos 2 caracteres ou selecione um tema." }
        )
    )
    .query(async ({ input }) => {
      return searchVerses(input.terms ?? input.query ?? "", input.testament);
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

  // Índice de comentários de Emmanuel para um capítulo (versículo -> referências).
  // Apenas a estrutura (título + livro-fonte), sem o texto protegido.
  emmanuelIndex: publicProcedure
    .input(z.object({ bookAbbrev: z.string(), chapter: z.number().int().positive() }))
    .query(({ input }) => {
      const chapterIndex = getEmmanuelChapterIndex(input.bookAbbrev, input.chapter);
      // Enriquece cada referência com o nome amigável da fonte (quando conhecido).
      const result: Record<string, { title: string; code: string | null; source: string | null }[]> = {};
      for (const [verse, refs] of Object.entries(chapterIndex)) {
        result[verse] = refs.map((r) => {
          const prefix = r.code ? r.code.split(".")[0] : null;
          const source = prefix ? emmanuelSiglas[prefix] ?? null : null;
          return { title: r.title, code: r.code, source };
        });
      }
      return result;
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

      const prompt = `Analise o trecho bíblico abaixo. Siga exatamente esta estrutura em parágrafos corridos, sem títulos ou listas:

PASSAGEM: ${reference}

TEXTO:
${versesText}

ESTRUTURA DA ANÁLISE:

Parágrafo 1 — CONTEXTO: Situe o trecho no seu contexto histórico e literário. Quem escreveu, para quem, em que momento. Se houver expressões do grego ou hebraico que mudam o sentido (ex: "sentou-se" como postura formal do rabi ao ensinar; "abriu a boca" como fórmula solene que introduz um discurso importante; "bem-aventurado" como tradução do grego makarios, que significa "feliz" ou "em estado de plênitude"), explique-as diretamente, sem rodeios.

Parágrafo 2 — O QUE O TEXTO DIZ: Explique o que o autor está argumentando. Não parafraseie apenas — explique a lógica interna do texto. Se for uma lista (como as Bem-aventuranças), explique o padrão estrutural e o que cada elemento acrescenta ao conjunto.

Parágrafo 3 — CORRELAÇÕES BÍBLICAS: Cite passagens específicas do Antigo Testamento que este trecho cumpre, retoma ou contrasta. Seja preciso: cite o livro, capítulo e versículo. Explique a conexão real, não apenas a semelhança superficial.

Parágrafo 4 — LEITURA ESPÍRITA: Conecte o trecho com a Doutrina Espírita de forma precisa. Cite questões específicas d'O Evangelho Segundo o Espiritismo ou d'O Livro dos Espíritos quando aplicável. Evite generalidades como "este versículo ensina o amor" — mostre como o princípio espírita específico (reencarnação, lei de causa e efeito, evolução moral, pluralidade dos mundos) ilumina o sentido do texto de forma concreta.

Parágrafo 5 — APLICAÇÃO: Uma aplicação prática objetiva. O que este trecho exige concretamente de quem o lê?

TOM: Analítico, direto, sem linguagem mística ou poética. Como um professor que explica, não como um pregador que exorta. Total: 350-450 palavras.`;

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

      const prompt = `Escreva um comentário sobre o versículo abaixo, no estilo dos livros de Emmanuel psicografados por Chico Xavier (como "Caminho, Verdade e Vida", "Vinha de Luz" e "Fonte Viva").

Passagem: ${reference}

Texto:
${versesText}

O estilo de Emmanuel nesses livros é:
- Começa identificando diretamente o que o versículo ensina, sem introduções longas
- Usa frases curtas e diretas, sem ornamentos poéticos excessivos
- Conecta o ensinamento com situações concretas da vida cotidiana e da vida espiritual
- Menciona, quando relevante, o contexto histórico ou cultural do texto de forma breve e funcional
- Termina com uma aplicação prática clara: o que o leitor deve fazer ou refletir a partir deste versículo
- Tom: edificante, mas sóbrio — como um orientador espiritual que fala com clareza, não como um pregador que exorta
- Extensão: 3 parágrafos curtos (total 150-180 palavras)
- Não use expressões como "este versículo nos convida", "mergulhemos", "naveguemos", "luz celestial" ou linguagem mística rebuscada
- Escreva como Emmanuel escreve: direto, claro, prático`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você escreve comentários bíblicos no estilo de Emmanuel, o espírito mentor de Chico Xavier, como nos livros 'Caminho, Verdade e Vida', 'Vinha de Luz' e 'Fonte Viva'. Nesses livros, Emmanuel isola um versículo e escreve uma reflexão prática e direta sobre ele, sem linguagem mística rebuscada. O estilo é seco, claro, orientado para a vida cotidiana e espiritual do leitor. Sem floreios. Sem exclamações. Sem metáforas excessivas. Como um professor que orienta, não um pregador que exorta.",
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
      // Termos por tema como LISTA de expressões inteiras: cada item é buscado
      // como um LIKE completo (OR entre eles). Manter frases como "nascer de
      // novo" juntas evita que palavras vazias (ex.: "de") virem termo isolado
      // e casem com quase toda a Bíblia.
      const spiritThemes: Record<string, string[]> = {
        reencarnação: ["renascer", "nascer de novo", "regenera"],
        "lei de causa e efeito": ["semea", "ceifa", "colher", "segar"],
        caridade: ["caridade", "esmola", "misericórdia", "compaixão"],
        "evolução espiritual": ["perfeit", "santifica", "transforma", "renova"],
        mediunidade: ["profe", "revela", "visão", "dons"],
        "vida após a morte": ["ressurreição", "ressuscit", "vida eterna", "morada"],
        oração: ["oração", "orai", "orando", "orou", "rogai", "súplica"],
        perdão: ["perdoa", "perdão", "remissão", "misericórdia"],
        humildade: ["humild", "manso", "mansidão", "servo"],
        amor: ["amai", "amados", "amarás", "amor"],
      };

      // Tema conhecido → termos bíblicos; senão, usa o próprio texto como frase.
      const terms = spiritThemes[input.theme.toLowerCase()] ?? [input.theme];
      const results = await searchVerses(terms);
      return results;
    }),

  // Estudo do ESE (Evangelho Segundo o Espiritismo)
  eseStudy: publicProcedure
    .input(z.object({ chapterNum: z.number(), chapterTitle: z.string(), chapterTheme: z.string() }))
    .query(async ({ input }) => {
      // Busca o texto-fonte EXATO do capítulo direto em bibliadocaminho.com
      const source = await fetchEseChapterSource(input.chapterNum);

      const sourceBlock = source?.cleanedText
        ? `\n\nTEXTO-FONTE OFICIAL (extraído diretamente de ${source.sourceUrl}):\n"""\n${source.cleanedText.slice(0, 6000)}\n"""\n\nUse EXCLUSIVAMENTE este texto-fonte como base factual. A "passagem" deve ser uma citação literal extraída dele (não parafraseie, não invente). "Contexto" e "filologia" devem se apoiar apenas no que está de fato no texto-fonte acima — se algo não estiver lá, não afirme.`
        : `\n\n(Aviso: não foi possível recuperar o texto-fonte de bibliadocaminho.com para este capítulo agora. Gere o estudo com o maior rigor possível a partir do seu conhecimento do ESE, mas deixe claro que não houve verificação contra a fonte primária.)`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é um estudioso espírita especializado em exegese bíblica e na obra de Allan Kardec. Seu método combina análise filológica (grego koiné, hebraico, aramaico) com a hermenêutica espírita.

Responda SEMPRE em JSON válido com esta estrutura exata:
{
  "passagem": "O versículo ou trecho bíblico central do capítulo (texto literal, extraído do texto-fonte fornecido quando disponível)",
  "referencia": "Referência bíblica (ex: Mateus 5:3-12)",
  "contexto": "2-3 parágrafos explicando o que Kardec desenvolve neste capítulo do ESE. Seja direto e analítico.",
  "filologia": "2-3 parágrafos de análise filológica: termos originais em grego/hebraico/aramaico, significados que se perdem na tradução, contexto linguístico e cultural da época. Exemplo: 'ptochoi to pneumati' (pobres de espírito) — ptochoi vem de ptossein (encolher-se), indicando não pobreza material mas despojamento interior.",
  "reflexao": "2 parágrafos de reflexão devocional prática no estilo Emmanuel: direta, sem floreios, orientada para a transformação moral cotidiana.",
  "correlacoes": [
    {
      "referencia": "Referência bíblica do AT",
      "texto": "Texto do versículo correlacionado",
      "ligacao": "Breve explicação da conexão com o tema do capítulo"
    }
  ],
  "meditacao": "Roteiro para meditação no lar em 3 partes: FOCO (tema central em 1 frase), PERGUNTA AO CORAÇÃO (pergunta reflexiva pessoal), PROPÓSITO (ação prática para a semana)."
}

Máximo 3 correlações. Seja preciso nas referências bíblicas.${sourceBlock}`,
          },
          {
            role: "user",
            content: `Gere o estudo completo para o Capítulo ${input.chapterNum} do Evangelho Segundo o Espiritismo: "${input.chapterTitle}". Tema: ${input.chapterTheme}.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ese_study",
            strict: true,
            schema: {
              type: "object",
              properties: {
                passagem: { type: "string" },
                referencia: { type: "string" },
                contexto: { type: "string" },
                filologia: { type: "string" },
                reflexao: { type: "string" },
                correlacoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      referencia: { type: "string" },
                      texto: { type: "string" },
                      ligacao: { type: "string" },
                    },
                    required: ["referencia", "texto", "ligacao"],
                    additionalProperties: false,
                  },
                },
                meditacao: { type: "string" },
              },
              required: ["passagem", "referencia", "contexto", "filologia", "reflexao", "correlacoes", "meditacao"],
              additionalProperties: false,
            },
          },
        },
      });

      try {
        const raw = response?.choices?.[0]?.message?.content;
        const content = typeof raw === "string" ? raw : "{}";
        const parsed = JSON.parse(content);
        return {
          ...parsed,
          fonte: source
            ? { url: source.sourceUrl, verificado: true }
            : { url: null, verificado: false },
        };
      } catch {
        return {
          passagem: "",
          referencia: "",
          contexto: "Erro ao gerar estudo. Tente novamente.",
          filologia: "",
          reflexao: "",
          correlacoes: [],
          meditacao: "",
          fonte: { url: source?.sourceUrl ?? null, verificado: !!source },
        };
      }
    }),
});

// ─── Meeting Notes Router (Diário Espiritual) ─────────────────────────────────

const meetingNotesRouter = router({
  save: protectedProcedure
    .input(z.object({
      date: z.string(),
      bookAbbrev: z.string(),
      bookName: z.string(),
      chapter: z.number().int().positive(),
      verse: z.number().int().positive(),
      verseText: z.string().optional(),
      theme: z.string().optional(),
      note: z.string().max(10000),
      sentimento: z.string().optional(),
      insight: z.string().optional(),
      contexto: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return saveMeetingNote({
        userId: ctx.user.id,
        date: input.date,
        bookAbbrev: input.bookAbbrev,
        bookName: input.bookName,
        chapter: input.chapter,
        verse: input.verse,
        verseText: input.verseText ?? null,
        theme: input.theme ?? null,
        note: input.note || input.sentimento || "",
        sentimento: input.sentimento ?? null,
        insight: input.insight ?? null,
        contexto: input.contexto ?? null,
      });
    }),
  get: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      return getMeetingNote(ctx.user.id, input.date);
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    return getMeetingNotesList(ctx.user.id);
  }),
});

// ─── Devocional Diário Router (estilo Café com Deus Pai) ─────────────────────

const devocionalRouter = router({
  today: publicProcedure.query(async () => {
    const reading = await getDailyReading();
    if (!reading) return null;

    const verses = await getVerseRange(
      reading.bookAbbrev,
      reading.chapter,
      reading.verseStart,
      reading.verseEnd
    );
    if (!verses.length) return null;

    const verseText = verses.map(v => v.text).join(" ");
    const reference = `${reading.bookName} ${reading.chapter}:${reading.verseStart}`;

    // Check cache first
    const today = new Date().toISOString().slice(0, 10);
    const cached = await getDevocionalCache(today);
    if (cached) {
      return {
        reference,
        bookAbbrev: reading.bookAbbrev,
        bookName: reading.bookName,
        chapter: reading.chapter,
        verse: reading.verseStart,
        verseText,
        theme: reading.theme,
        reflexao: cached.reflexao,
        oracao: cached.oracao,
      };
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você escreve devocionais diários espíritas no estilo do livro "Café com Deus Pai", mas sob a ótica da Doutrina Espírita e no tom de Emmanuel (Chico Xavier). O formato é:\n\n1. Uma reflexão curta e direta sobre o versículo (3-4 parágrafos, 150-200 palavras). Sem floreios. Linguagem clara, acolhedora mas sóbria. Conecta o versículo com a vida prática e com princípios espíritas (reencarnação, lei de causa e efeito, evolução moral, caridade).\n\n2. Uma oração/pensamento de encerramento (3-5 linhas). Tom íntimo, como quem conversa com Deus/Pai. Sem linguagem eclesiástica formal. Simples e sincero.\n\nResponda em JSON com os campos: "reflexao" e "oracao".`,
        },
        {
          role: "user",
          content: `Versículo do dia: ${reference}\n\n"${verseText}"\n\nEscreva o devocional diário para este versículo.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "devocional",
          strict: true,
          schema: {
            type: "object",
            properties: {
              reflexao: { type: "string", description: "Reflexão espírita sobre o versículo" },
              oracao: { type: "string", description: "Oração/pensamento de encerramento" },
            },
            required: ["reflexao", "oracao"],
            additionalProperties: false,
          },
        },
      },
    });

    let reflexao = "Reflexão não disponível.";
    let oracao = "Oração não disponível.";

    try {
      const raw = response?.choices?.[0]?.message?.content;
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        reflexao = parsed.reflexao || reflexao;
        oracao = parsed.oracao || oracao;
      }
    } catch {}

    // Save to cache
    await saveDevocionalCache({ date: today, reference, verseText, reflexao, oracao });

    return {
      reference,
      bookAbbrev: reading.bookAbbrev,
      bookName: reading.bookName,
      chapter: reading.chapter,
      verse: reading.verseStart,
      verseText,
      theme: reading.theme,
      reflexao,
      oracao,
    };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────


// --- Notes Router ---

const notesRouter = router({
  save: protectedProcedure
    .input(z.object({
      bookAbbrev: z.string(),
      chapter: z.number().int().positive(),
      verse: z.number().int().positive(),
      note: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      return saveVerseNote(ctx.user.id, input.bookAbbrev, input.chapter, input.verse, input.note);
    }),

  getChapter: protectedProcedure
    .input(z.object({
      bookAbbrev: z.string(),
      chapter: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      return getChapterNotes(ctx.user.id, input.bookAbbrev, input.chapter);
    }),

  delete: protectedProcedure
    .input(z.object({
      bookAbbrev: z.string(),
      chapter: z.number().int().positive(),
      verse: z.number().int().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      await deleteVerseNote(ctx.user.id, input.bookAbbrev, input.chapter, input.verse);
      return { success: true };
    }),
});

// --- Favorites Router ---

const favoritesRouter = router({
  toggle: protectedProcedure
    .input(z.object({
      bookAbbrev: z.string(),
      bookName: z.string(),
      chapter: z.number().int().positive(),
      verse: z.number().int().positive(),
      verseText: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return toggleVerseFavorite(ctx.user.id, input.bookAbbrev, input.bookName, input.chapter, input.verse, input.verseText);
    }),

  getChapter: protectedProcedure
    .input(z.object({
      bookAbbrev: z.string(),
      chapter: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      return getChapterFavorites(ctx.user.id, input.bookAbbrev, input.chapter);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserFavorites(ctx.user.id);
  }),
});

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
  notes: notesRouter,
  favorites: favoritesRouter,
  meetingNotes: meetingNotesRouter,
  devocional: devocionalRouter,
});

export type AppRouter = typeof appRouter;
