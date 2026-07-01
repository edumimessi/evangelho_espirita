import { trpc } from "@/lib/trpc";
import { BookOpen, Hash, Search as SearchIcon, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CosmicLayout } from "@/components/CosmicLayout";

type Testament = "old" | "new" | undefined;
type SearchMode = "text" | "reference";

// Cada tema espírita é conceitual e NÃO aparece literalmente na Bíblia. Por
// isso cada tema carrega `termos`: palavras/expressões que de fato ocorrem no
// texto bíblico. A busca por tema procura QUALQUER um desses termos (OR),
// enquanto os `subtemas` são atalhos de busca por texto já concretos.
const spiritThemes = [
  {
    label: "Reencarnação",
    icon: "♾️",
    termos: ["nascer de novo", "renascer", "renascimento", "regenera"],
    subtemas: ["nascer de novo", "renascer", "regeneração"],
  },
  {
    label: "Lei de Causa e Efeito",
    icon: "⚖️",
    termos: ["semea", "ceifa", "colher", "segar"],
    subtemas: ["semear", "ceifar", "colher"],
  },
  {
    label: "Caridade",
    icon: "💫",
    termos: ["caridade", "esmola", "misericórdia", "compaixão"],
    subtemas: ["caridade", "esmola", "misericórdia"],
  },
  {
    label: "Evolução Espiritual",
    icon: "🌟",
    termos: ["perfeit", "santifica", "transforma", "renova"],
    subtemas: ["perfeitos", "santificação", "transformai"],
  },
  {
    label: "Mediunidade",
    icon: "🔮",
    termos: ["profe", "revela", "visão", "dons"],
    subtemas: ["profeta", "profecia", "revelação"],
  },
  {
    label: "Vida após a morte",
    icon: "✨",
    termos: ["ressurreição", "ressuscit", "vida eterna", "morada"],
    subtemas: ["ressurreição", "vida eterna", "moradas"],
  },
  {
    label: "Oração",
    icon: "🙏",
    termos: ["oração", "orai", "orando", "orou", "rogai", "súplica"],
    subtemas: ["orai", "oração", "rogai"],
  },
  {
    label: "Perdão",
    icon: "🕊️",
    termos: ["perdoa", "perdão", "remissão", "misericórdia"],
    subtemas: ["perdoar", "perdão", "misericórdia"],
  },
  {
    label: "Humildade",
    icon: "🌿",
    termos: ["humild", "manso", "mansidão", "servo"],
    subtemas: ["humilde", "manso", "servo"],
  },
  {
    label: "Amor",
    icon: "💛",
    termos: ["amai", "amados", "amarás", "amor"],
    subtemas: ["amai", "amados", "amarás"],
  },
  {
    label: "Fé",
    icon: "💠",
    termos: ["crede", "crer", "crê", "fiel", "confia"],
    subtemas: ["crer", "crede", "fiel"],
  },
  {
    label: "Livre-arbítrio",
    icon: "🛤️",
    termos: ["escolh", "vontade", "querei"],
    subtemas: ["escolher", "vontade", "quereis"],
  },
  {
    label: "Trabalho e Missão",
    icon: "🌱",
    termos: ["seara", "messe", "vinha", "talento", "obreiro"],
    subtemas: ["seara", "vinha", "talento"],
  },
  {
    label: "Desapego Material",
    icon: "🌊",
    termos: ["tesouro", "riqueza", "mamon", "avareza"],
    subtemas: ["tesouro", "riqueza", "mamon"],
  },
  {
    label: "Obsessão e Vigilância",
    icon: "🛡️",
    termos: ["vigiai", "vigil", "tentação", "imundo"],
    subtemas: ["vigiai", "tentação", "espírito imundo"],
  },
];

const bookNameMap: Record<string, string> = {
  gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio",
  js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas",
  ed: "Esdras", ne: "Neemias", et: "Ester", jo2: "Jó", sl: "Salmos", pv: "Provérbios",
  ec: "Eclesiastes", ct: "Cânticos", is: "Isaías", jr: "Jeremias", lm: "Lamentações",
  ez: "Ezequiel", dn: "Daniel", os: "Oséias", jl: "Joel", am: "Amós", ob: "Obadias",
  jn: "Jonas", mq: "Miquéias", na: "Naum", hc: "Habacuque", sf: "Sofonias",
  ag: "Ageu", zc: "Zacarias", ml: "Malaquias",
  mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos", rm: "Romanos",
  "1co": "1 Coríntios", "2co": "2 Coríntios", gl: "Gálatas", ef: "Efésios",
  fp: "Filipenses", cl: "Colossenses", "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses",
  "1tm": "1 Timóteo", "2tm": "2 Timóteo", tt: "Tito", fm: "Filemom", hb: "Hebreus",
  tg: "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João",
  "3jo": "3 João", jd: "Judas", ap: "Apocalipse",
};

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>("text");
  const [query, setQuery] = useState("");
  const [testament, setTestament] = useState<Testament>(undefined);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  // Termos bíblicos do tema selecionado (busca OR). Null = busca por texto livre.
  const [themeTerms, setThemeTerms] = useState<string[] | null>(null);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  // Reference search state
  const [refBook, setRefBook] = useState("");
  const [refChapter, setRefChapter] = useState("");
  const [refVerse, setRefVerse] = useState("");
  const [refEnabled, setRefEnabled] = useState(false);

  const { data: books } = trpc.bible.books.useQuery();

  // Parse URL params for theme
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tema = params.get("tema");
    if (tema) {
      const match = spiritThemes.find((t) => t.label.toLowerCase() === tema.toLowerCase());
      setActiveTheme(match?.label ?? tema);
      // Se casar com um tema conhecido, busca pelos termos bíblicos (OR);
      // caso contrário, trata o parâmetro como busca por texto.
      if (match) {
        setThemeTerms(match.termos);
        setExpandedTheme(match.label);
      } else {
        setQuery(tema);
        setDebouncedQuery(tema);
      }
    }
  }, []);

  // Debounce text search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const usingTheme = mode === "text" && !!themeTerms && themeTerms.length > 0;

  const { data: results, isLoading } = trpc.bible.search.useQuery(
    usingTheme ? { terms: themeTerms!, testament } : { query: debouncedQuery, testament },
    { enabled: mode === "text" && (usingTheme || debouncedQuery.length >= 2) }
  );

  const { data: refResults, isLoading: refLoading } = trpc.bible.reference.useQuery(
    {
      bookAbbrev: refBook,
      chapter: parseInt(refChapter) || 1,
      verse: refVerse ? parseInt(refVerse) : undefined,
    },
    { enabled: refEnabled && !!refBook && !!refChapter }
  );

  const handleTheme = (theme: string) => {
    const match = spiritThemes.find((t) => t.label === theme);
    setMode("text");
    setActiveTheme(theme);
    // Busca pelos termos bíblicos do tema (OR), não pelo rótulo conceitual.
    setThemeTerms(match?.termos ?? [theme]);
    setQuery("");
    setDebouncedQuery("");
    setExpandedTheme(expandedTheme === theme ? null : theme);
  };

  const handleSubtema = (subtema: string) => {
    setMode("text");
    // Subtema é uma busca por texto concreta: sai do modo tema.
    setThemeTerms(null);
    setActiveTheme(null);
    setQuery(subtema);
    setDebouncedQuery(subtema);
  };

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
    setActiveTheme(null);
    setThemeTerms(null);
    setRefEnabled(false);
    setRefBook("");
    setRefChapter("");
    setRefVerse("");
  };

  const handleRefSearch = () => {
    if (refBook && refChapter) {
      setRefEnabled(true);
    }
  };

  const correlationTypeLabel: Record<string, string> = {
    prophecy: "Profecia",
    fulfillment: "Cumprimento",
    parallel: "Paralelo",
    contrast: "Contraste",
    quote: "Citação",
  };

  return (
    <CosmicLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <SearchIcon className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Busca</h2>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            Buscar nas Escrituras
          </h1>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 animate-fade-in-up">
          <button
            onClick={() => setMode("text")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "text"
                ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            <SearchIcon className="w-3.5 h-3.5" />
            Busca por Texto
          </button>
          <button
            onClick={() => setMode("reference")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              mode === "reference"
                ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Busca por Referência
          </button>
        </div>

        {/* Text Search */}
        {mode === "text" && (
          <>
            <div className="relative animate-fade-in-up">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setThemeTerms(null);
                  setActiveTheme(null);
                }}
                placeholder="Buscar por palavras, frases ou temas..."
                className="cosmic-input w-full pl-11 pr-10 py-3.5 rounded-xl text-sm"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Testament Filter */}
            <div className="flex gap-2 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
              {([undefined, "old", "new"] as (Testament | undefined)[]).map((t) => (
                <button
                  key={String(t)}
                  onClick={() => setTestament(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    testament === t
                      ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                      : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t === undefined ? "Toda a Bíblia" : t === "old" ? "Antigo Testamento" : "Novo Testamento"}
                </button>
              ))}
            </div>

            {/* Spiritual Themes */}
            <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <p className="text-xs font-semibold text-white/40 tracking-widest uppercase mb-3 flex items-center gap-2">
                <Star className="w-3 h-3" style={{ color: "oklch(0.82 0.18 75)" }} />
                Temas Espíritas
              </p>
              <div className="flex flex-wrap gap-2">
                {spiritThemes.map((theme) => (
                  <button
                    key={theme.label}
                    onClick={() => handleTheme(theme.label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                      activeTheme === theme.label
                        ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                        : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{theme.icon}</span>
                    {theme.label}
                  </button>
                ))}
              </div>

              {/* Subtemas expandidos */}
              {expandedTheme && (
                <div className="mt-3 pl-2 border-l-2 border-cyan-500/20">
                  <p className="text-xs text-white/30 mb-2">Subtemas de "{expandedTheme}":</p>
                  <div className="flex flex-wrap gap-1.5">
                    {spiritThemes
                      .find((t) => t.label === expandedTheme)
                      ?.subtemas.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => handleSubtema(sub)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all"
                        >
                          {sub}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text Results */}
            <div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              {isLoading && (usingTheme || debouncedQuery.length >= 2) && (
                <div className="flex items-center justify-center py-12">
                  <div className="cosmic-spinner" />
                </div>
              )}

              {!isLoading && (usingTheme || debouncedQuery.length >= 2) && results && (
                <div>
                  <p className="text-xs text-white/40 mb-3">
                    {results.length === 0
                      ? "Nenhum resultado encontrado"
                      : `${results.length} resultado${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`}
                  </p>

                  <div className="space-y-3 stagger-children">
                    {results.map((verse) => (
                      <div key={verse.id} className="cosmic-card p-4 animate-fade-in-up">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-cyan-400/70 mb-1">
                              {bookNameMap[verse.bookAbbrev] ?? verse.bookAbbrev} {verse.chapter}:{verse.verse}
                            </p>
                            <p className="text-white/80 text-sm leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1rem" }}>
                              {highlightQuery(verse.text, debouncedQuery)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!usingTheme && debouncedQuery.length < 2 && !activeTheme && (
                <div className="text-center py-12 text-white/30">
                  <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Digite pelo menos 2 caracteres para buscar</p>
                  <p className="text-xs mt-2">ou selecione um tema espírita acima</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Reference Search */}
        {mode === "reference" && (
          <div className="space-y-4 animate-fade-in-up">
            <p className="text-sm text-white/50">
              Busque um versículo ou capítulo específico pelo livro, capítulo e versículo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Livro</label>
                <select
                  value={refBook}
                  onChange={(e) => { setRefBook(e.target.value); setRefEnabled(false); }}
                  className="cosmic-input w-full py-2.5 px-3 rounded-xl text-sm"
                >
                  <option value="">Selecione...</option>
                  {books?.map((b) => (
                    <option key={b.abbrev} value={b.abbrev}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Capítulo</label>
                <input
                  type="number"
                  min={1}
                  value={refChapter}
                  onChange={(e) => { setRefChapter(e.target.value); setRefEnabled(false); }}
                  placeholder="Ex: 5"
                  className="cosmic-input w-full py-2.5 px-3 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block tracking-wide">Versículo (opcional)</label>
                <input
                  type="number"
                  min={1}
                  value={refVerse}
                  onChange={(e) => { setRefVerse(e.target.value); setRefEnabled(false); }}
                  placeholder="Ex: 3"
                  className="cosmic-input w-full py-2.5 px-3 rounded-xl text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleRefSearch}
              disabled={!refBook || !refChapter}
              className="cosmic-btn px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buscar Referência
            </button>

            {refLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="cosmic-spinner" />
              </div>
            )}

            {refEnabled && !refLoading && refResults && (
              <div className="space-y-3">
                <p className="text-xs text-white/40">
                  {Array.isArray(refResults) ? refResults.length : 1} versículo{Array.isArray(refResults) && refResults.length !== 1 ? "s" : ""} encontrado{Array.isArray(refResults) && refResults.length !== 1 ? "s" : ""}
                </p>
                {(Array.isArray(refResults) ? refResults : [refResults]).map((verse: any) => (
                  <div key={verse.id} className="cosmic-card p-4 animate-fade-in-up">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-cyan-400/70 mb-1">
                          {bookNameMap[verse.bookAbbrev] ?? verse.bookAbbrev} {verse.chapter}:{verse.verse}
                        </p>
                        <p className="text-white/80 text-sm leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1rem" }}>
                          {verse.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {refEnabled && !refLoading && !refResults && (
              <div className="text-center py-8 text-white/30">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhum versículo encontrado para essa referência.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </CosmicLayout>
  );
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-cyan-400/20 text-cyan-300 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
