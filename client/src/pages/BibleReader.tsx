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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Streamdown } from "streamdown";

type Testament = "old" | "new";

export default function BibleReader() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [selectedTestament, setSelectedTestament] = useState<Testament>("new");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [showEmmanuel, setShowEmmanuel] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showCorrelations, setShowCorrelations] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [emmanuelComment, setEmmanuelComment] = useState<string | null>(null);
  const [correlationsList, setCorrelationsList] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

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

  const handleGenerateInterpretation = async () => {
    if (!chapterData?.verses || !selectedBook || !selectedBookData) return;
    setShowInterpretation(true);
    setLoadingAI(true);
    try {
      const result = await interpretMutation.mutateAsync({
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
        verseStart: 1,
        verseEnd: chapterData.verses.length,
        verses: chapterData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setInterpretation(result.interpretation);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleEmmanuelComment = async () => {
    if (!chapterData?.verses || !selectedBook || !selectedBookData) return;
    setShowEmmanuel(true);
    setLoadingAI(true);
    try {
      const result = await emmanuelMutation.mutateAsync({
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
        verseStart: 1,
        verseEnd: chapterData.verses.length,
        verses: chapterData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setEmmanuelComment(result.comment);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCorrelations = async () => {
    if (!chapterData?.verses || !selectedBook || !selectedBookData) return;
    setShowCorrelations(true);
    setLoadingAI(true);
    try {
      const result = await correlationsMutation.mutateAsync({
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
        verseStart: 1,
        verseEnd: chapterData.verses.length,
        verses: chapterData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setCorrelationsList(result.correlations ?? []);
    } finally {
      setLoadingAI(false);
    }
  };

  const navigateChapter = (delta: number) => {
    const newChapter = selectedChapter + delta;
    if (!selectedBookData) return;
    if (newChapter >= 1 && newChapter <= selectedBookData.chapterCount) {
      setSelectedChapter(newChapter);
      setInterpretation(null);
      setEmmanuelComment(null);
      setCorrelationsList([]);
      setShowInterpretation(false);
      setShowEmmanuel(false);
      setShowCorrelations(false);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Bíblia Sagrada</h2>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            {selectedBookData ? `${selectedBookData.name} ${selectedChapter}` : "Selecione um Livro"}
          </h1>
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
                      setInterpretation(null);
                      setEmmanuelComment(null);
                      setCorrelationsList([]);
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.from({ length: Math.min(selectedBookData.chapterCount, 30) }, (_, i) => i + 1).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => {
                        setSelectedChapter(ch);
                        setInterpretation(null);
                        setEmmanuelComment(null);
                        setCorrelationsList([]);
                      }}
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
              </div>
            )}

            {/* Verses */}
            <div className="cosmic-card p-6">
              {chapterLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="cosmic-spinner" />
                </div>
              ) : chapterData?.verses.length ? (
                <div className="space-y-3">
                  {chapterData.verses.map((verse) => (
                    <p key={verse.id} className="verse-text leading-relaxed">
                      <span className="verse-number">{verse.verse}</span>
                      {verse.text}
                    </p>
                  ))}
                </div>
              ) : selectedBook ? (
                <div className="text-center py-12 text-white/30">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Versículos sendo carregados...</p>
                  <p className="text-xs mt-2">O banco de dados está sendo populado. Tente novamente em instantes.</p>
                </div>
              ) : (
                <div className="text-center py-12 text-white/30">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Selecione um livro para começar</p>
                </div>
              )}
            </div>

            {/* AI Tools */}
            {chapterData?.verses.length ? (
              <div className="flex flex-wrap gap-2 animate-fade-in">
                <button
                  onClick={handleEmmanuelComment}
                  disabled={loadingAI}
                  className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                >
                  {loadingAI && showEmmanuel ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                  Comentário de Emmanuel
                </button>
                <button
                  onClick={handleGenerateInterpretation}
                  disabled={loadingAI}
                  className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ borderColor: "oklch(0.55 0.22 285 / 0.4)", color: "oklch(0.65 0.22 285)" }}
                >
                  {loadingAI && showInterpretation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Interpretação Espírita
                </button>
                <button
                  onClick={handleCorrelations}
                  disabled={loadingAI}
                  className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                  style={{ borderColor: "oklch(0.82 0.18 75 / 0.4)", color: "oklch(0.82 0.18 75)" }}
                >
                  {loadingAI && showCorrelations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Correlações AT/NT
                </button>
              </div>
            ) : null}

            {/* Emmanuel Comment */}
            {showEmmanuel && (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-cyan-400 tracking-wide">Comentário de Emmanuel</h3>
                </div>
                {loadingAI && !emmanuelComment ? (
                  <div className="emmanuel-box flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-white/50 text-sm italic">Emmanuel está meditando...</span>
                  </div>
                ) : emmanuelComment ? (
                  <div className="emmanuel-box">
                    <p className="text-white/80 leading-relaxed mt-2" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1.05rem", fontStyle: "italic" }}>
                      {emmanuelComment}
                    </p>
                    <p className="text-cyan-400/50 text-xs mt-3 text-right">— Emmanuel</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Interpretation */}
            {showInterpretation && (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-violet-400 tracking-wide">Interpretação Espírita</h3>
                  <span className="text-xs text-white/30">no estilo de Haroldo Dutra Dias</span>
                </div>
                {loadingAI && !interpretation ? (
                  <div className="interpretation-box flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    <span className="text-white/50 text-sm italic">Gerando interpretação...</span>
                  </div>
                ) : interpretation ? (
                  <div className="interpretation-box prose prose-invert max-w-none">
                    <Streamdown>{interpretation}</Streamdown>
                  </div>
                ) : null}
              </div>
            )}

            {/* Correlations */}
            {showCorrelations && (
              <div className="animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4" style={{ color: "oklch(0.82 0.18 75)" }} />
                  <h3 className="text-sm font-semibold tracking-wide" style={{ color: "oklch(0.82 0.18 75)" }}>
                    Correlações AT/NT
                  </h3>
                </div>
                {loadingAI && correlationsList.length === 0 ? (
                  <div className="cosmic-card p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "oklch(0.82 0.18 75)" }} />
                    <span className="text-white/50 text-sm italic">Buscando correlações...</span>
                  </div>
                ) : correlationsList.length > 0 ? (
                  <div className="space-y-3">
                    {correlationsList.map((corr, i) => (
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
                    ))}
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
