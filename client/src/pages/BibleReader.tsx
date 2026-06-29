import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Sparkles,
  Link2,
  Star,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Streamdown } from "streamdown";

type Testament = "old" | "new";

interface AIPanel {
  type: "emmanuel" | "interpretation" | "correlations";
  verseStart: number;
  verseEnd: number;
  content: string | any[] | null;
  loading: boolean;
}

export default function BibleReader() {
  const { user } = useAuth();

  const [selectedTestament, setSelectedTestament] = useState<Testament>("new");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Seleção de versículos
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [aiPanel, setAiPanel] = useState<AIPanel | null>(null);

  const { data: books } = trpc.bible.books.useQuery();
  const { data: chapterData, isLoading: chapterLoading } = trpc.bible.chapter.useQuery(
    { bookAbbrev: selectedBook!, chapter: selectedChapter },
    { enabled: !!selectedBook }
  );

  const interpretMutation = trpc.ai.interpret.useMutation();
  const emmanuelMutation = trpc.ai.emmanuelComment.useMutation();
  const correlationsMutation = trpc.ai.correlations.useMutation();
  const addHistoryMutation = trpc.history.add.useMutation();

  const filteredBooks = useMemo(
    () => books?.filter((b) => b.testament === selectedTestament) ?? [],
    [books, selectedTestament]
  );

  const selectedBookData = useMemo(
    () => books?.find((b) => b.abbrev === selectedBook),
    [books, selectedBook]
  );

  // Auto-select first book
  useEffect(() => {
    if (filteredBooks.length > 0 && !selectedBook) {
      setSelectedBook(filteredBooks[0].abbrev);
      setSelectedChapter(1);
    }
  }, [filteredBooks]);

  // Register reading in history
  useEffect(() => {
    if (selectedBook && selectedBookData && user) {
      addHistoryMutation.mutate({
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
      });
    }
  }, [selectedBook, selectedChapter]);

  // Limpar seleção ao mudar capítulo
  useEffect(() => {
    setSelectedVerses([]);
    setAiPanel(null);
  }, [selectedBook, selectedChapter]);

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses((prev) => {
      if (prev.includes(verseNum)) {
        return prev.filter((v) => v !== verseNum);
      }
      return [...prev, verseNum].sort((a, b) => a - b);
    });
  };

  const getSelectedVersesData = () => {
    if (!chapterData?.verses) return [];
    if (selectedVerses.length > 0) {
      return chapterData.verses.filter((v) => selectedVerses.includes(v.verse));
    }
    return chapterData.verses;
  };

  const getVerseRange = () => {
    const verses = getSelectedVersesData();
    if (verses.length === 0) return { start: 1, end: 1 };
    return { start: verses[0].verse, end: verses[verses.length - 1].verse };
  };

  const handleAI = async (type: "emmanuel" | "interpretation" | "correlations") => {
    if (!selectedBook || !selectedBookData) return;
    const verses = getSelectedVersesData();
    if (verses.length === 0) return;
    const { start, end } = getVerseRange();

    setAiPanel({ type, verseStart: start, verseEnd: end, content: null, loading: true });

    try {
      const payload = {
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
        verseStart: start,
        verseEnd: end,
        verses: verses.map((v) => ({ verse: v.verse, text: v.text })),
      };

      if (type === "emmanuel") {
        const result = await emmanuelMutation.mutateAsync(payload);
        setAiPanel((p) => p ? { ...p, content: result.comment, loading: false } : null);
      } else if (type === "interpretation") {
        const result = await interpretMutation.mutateAsync(payload);
        setAiPanel((p) => p ? { ...p, content: result.interpretation, loading: false } : null);
      } else {
        const result = await correlationsMutation.mutateAsync(payload);
        setAiPanel((p) => p ? { ...p, content: result.correlations ?? [], loading: false } : null);
      }
    } catch {
      setAiPanel((p) => p ? { ...p, content: "Erro ao gerar conteúdo. Tente novamente.", loading: false } : null);
    }
  };

  const navigateChapter = (delta: number) => {
    if (!selectedBookData) return;
    const newChapter = selectedChapter + delta;
    if (newChapter >= 1 && newChapter <= selectedBookData.chapterCount) {
      setSelectedChapter(newChapter);
    }
  };

  const correlationTypeLabel: Record<string, string> = {
    prophecy: "Profecia",
    fulfillment: "Cumprimento",
    parallel: "Paralelo",
    contrast: "Contraste",
    quote: "Citação",
  };

  const referenceLabel = () => {
    if (!selectedBookData) return "";
    const { start, end } = getVerseRange();
    const versesPart = selectedVerses.length > 0
      ? `:${start}${end > start ? `–${end}` : ""}`
      : "";
    return `${selectedBookData.name} ${selectedChapter}${versesPart}`;
  };

  const hasVerses = (chapterData?.verses.length ?? 0) > 0;

  return (
    <CosmicLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Bíblia Sagrada</h2>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            {selectedBookData ? `${selectedBookData.name} ${selectedChapter}` : "Selecione um Livro"}
          </h1>
          {selectedVerses.length > 0 && (
            <p className="text-xs text-cyan-400/70 mt-1">
              {selectedVerses.length} versículo{selectedVerses.length > 1 ? "s" : ""} selecionado{selectedVerses.length > 1 ? "s" : ""} — clique nos versículos para selecionar/deselecionar
            </p>
          )}
        </div>

        {/* Testament Selector */}
        <div className="flex gap-2 animate-fade-in-up">
          {(["old", "new"] as Testament[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setSelectedTestament(t);
                setSelectedBook(null);
                setSelectedChapter(1);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedTestament === t
                  ? "bg-cyan-400/15 border border-cyan-400/40 text-cyan-400"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {t === "old" ? "Antigo Testamento" : "Novo Testamento"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Book List */}
          <div className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="cosmic-card overflow-hidden">
              <div className="p-3 border-b border-white/10">
                <p className="text-xs font-semibold text-white/40 tracking-widest uppercase">Livros</p>
              </div>
              <div className="overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
                {filteredBooks.map((book) => (
                  <button
                    key={book.abbrev}
                    onClick={() => {
                      setSelectedBook(book.abbrev);
                      setSelectedChapter(1);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all border-b border-white/5 last:border-0 ${
                      selectedBook === book.abbrev
                        ? "bg-cyan-400/10 text-cyan-400 font-semibold"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs text-white/30 mr-2">{book.order}.</span>
                    {book.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chapter Content */}
          <div className="lg:col-span-3 space-y-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            {/* Chapter Navigation */}
            {selectedBookData && (
              <div className="flex items-center gap-2 flex-wrap">
                {Array.from({ length: Math.min(selectedBookData.chapterCount, 30) }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      selectedChapter === ch
                        ? "bg-cyan-400/20 border border-cyan-400/50 text-cyan-400"
                        : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
                {selectedBookData.chapterCount > 30 && (
                  <span className="text-white/30 text-xs">... {selectedBookData.chapterCount} cap.</span>
                )}
              </div>
            )}

            {/* Instruction hint */}
            {hasVerses && (
              <p className="text-xs text-white/30 italic">
                Clique em um ou mais versículos para selecioná-los antes de gerar interpretação, comentário ou correlações. Sem seleção, o capítulo inteiro é usado.
              </p>
            )}

            {/* Verses */}
            <div className="cosmic-card p-6">
              {chapterLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="cosmic-spinner" />
                </div>
              ) : chapterData?.verses.length ? (
                <div className="space-y-1">
                  {chapterData.verses.map((verse) => {
                    const isSelected = selectedVerses.includes(verse.verse);
                    return (
                      <p
                        key={verse.id}
                        onClick={() => toggleVerseSelection(verse.verse)}
                        className={`verse-text leading-relaxed rounded-lg px-2 py-1 cursor-pointer transition-all select-none ${
                          isSelected
                            ? "bg-cyan-400/12 border border-cyan-400/25"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className={`verse-number ${isSelected ? "text-cyan-400" : ""}`}>
                          {verse.verse}
                        </span>
                        {verse.text}
                      </p>
                    );
                  })}
                </div>
              ) : selectedBook ? (
                <div className="text-center py-12 text-white/30">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Versículos sendo carregados...</p>
                </div>
              ) : (
                <div className="text-center py-12 text-white/30">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione um livro para começar</p>
                </div>
              )}
            </div>

            {/* AI Tools */}
            {hasVerses && (
              <div className="space-y-2">
                {selectedVerses.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cyan-400/70 font-semibold">
                      Analisando: {referenceLabel()}
                    </span>
                    <button
                      onClick={() => setSelectedVerses([])}
                      className="text-white/30 hover:text-white/60 transition-colors"
                      title="Limpar seleção"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleAI("emmanuel")}
                    disabled={aiPanel?.loading}
                    className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  >
                    {aiPanel?.loading && aiPanel.type === "emmanuel" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                    Comentário de Emmanuel
                  </button>
                  <button
                    onClick={() => handleAI("interpretation")}
                    disabled={aiPanel?.loading}
                    className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ borderColor: "oklch(0.55 0.22 285 / 0.4)", color: "oklch(0.65 0.22 285)" }}
                  >
                    {aiPanel?.loading && aiPanel.type === "interpretation" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Interpretação Espírita
                  </button>
                  <button
                    onClick={() => handleAI("correlations")}
                    disabled={aiPanel?.loading}
                    className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ borderColor: "oklch(0.82 0.18 75 / 0.4)", color: "oklch(0.82 0.18 75)" }}
                  >
                    {aiPanel?.loading && aiPanel.type === "correlations" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                    Correlações AT/NT
                  </button>
                </div>
              </div>
            )}

            {/* AI Panel */}
            {aiPanel && (
              <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {aiPanel.type === "emmanuel" && <Star className="w-4 h-4 text-cyan-400" />}
                    {aiPanel.type === "interpretation" && <Sparkles className="w-4 h-4 text-violet-400" />}
                    {aiPanel.type === "correlations" && <Link2 className="w-4 h-4" style={{ color: "oklch(0.82 0.18 75)" }} />}
                    <h3 className={`text-sm font-semibold tracking-wide ${
                      aiPanel.type === "emmanuel" ? "text-cyan-400" :
                      aiPanel.type === "interpretation" ? "text-violet-400" : ""
                    }`} style={aiPanel.type === "correlations" ? { color: "oklch(0.82 0.18 75)" } : {}}>
                      {aiPanel.type === "emmanuel" && "Comentário de Emmanuel"}
                      {aiPanel.type === "interpretation" && "Interpretação Espírita"}
                      {aiPanel.type === "correlations" && "Correlações AT/NT"}
                    </h3>
                    <span className="text-xs text-white/30">{referenceLabel()}</span>
                  </div>
                  <button
                    onClick={() => setAiPanel(null)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {aiPanel.loading ? (
                  <div className="cosmic-card p-5 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-white/50 text-sm">Gerando análise...</span>
                  </div>
                ) : aiPanel.type === "emmanuel" && typeof aiPanel.content === "string" ? (
                  <div className="emmanuel-box">
                    <p className="text-white/85 leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1.05rem" }}>
                      {aiPanel.content}
                    </p>
                  </div>
                ) : aiPanel.type === "interpretation" && typeof aiPanel.content === "string" ? (
                  <div className="interpretation-box prose prose-invert max-w-none">
                    <Streamdown>{aiPanel.content}</Streamdown>
                  </div>
                ) : aiPanel.type === "correlations" && Array.isArray(aiPanel.content) ? (
                  <div className="space-y-3">
                    {aiPanel.content.length === 0 ? (
                      <div className="cosmic-card p-4 text-white/40 text-sm">Nenhuma correlação encontrada para este trecho.</div>
                    ) : (
                      aiPanel.content.map((corr: any, i: number) => (
                        <div key={i} className="cosmic-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                          <div className="flex items-start gap-3">
                            <span className={`correlation-badge correlation-${corr.type} flex-shrink-0 mt-0.5`}>
                              {correlationTypeLabel[corr.type] ?? corr.type}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-white mb-1">{corr.reference}</p>
                              <p className="text-white/60 text-sm italic mb-2" style={{ fontFamily: "'Crimson Pro', serif" }}>
                                "{corr.text}"
                              </p>
                              <p className="text-white/40 text-xs">{corr.description}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* Prev/Next Navigation */}
            {selectedBookData && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => navigateChapter(-1)}
                  disabled={selectedChapter <= 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Capítulo anterior
                </button>
                <span className="text-white/30 text-xs">
                  {selectedChapter} / {selectedBookData.chapterCount}
                </span>
                <button
                  onClick={() => navigateChapter(1)}
                  disabled={selectedChapter >= selectedBookData.chapterCount}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Próximo capítulo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </CosmicLayout>
  );
}
