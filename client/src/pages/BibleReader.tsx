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
  Pencil,
  Trash2,
  Check,
  BookMarked,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Streamdown } from "streamdown";
import { bibliaCaminhoVerseUrl } from "@/lib/bibliaCaminho";

type Testament = "old" | "new";

interface AIPanel {
  type: "emmanuel" | "interpretation" | "correlations";
  verseStart: number;
  verseEnd: number;
  content: string | any[] | null;
  loading: boolean;
}

interface NoteModal {
  verse: number;
  text: string;
  existingNote: string;
}

export default function BibleReader() {
  const { user } = useAuth();

  // Ler query params para deep link de favoritos
  const searchParams = new URLSearchParams(window.location.search);
  const initialBook = searchParams.get("book");
  const initialChapter = parseInt(searchParams.get("chapter") ?? "1", 10) || 1;

  const [selectedTestament, setSelectedTestament] = useState<Testament>("new");
  const [selectedBook, setSelectedBook] = useState<string | null>(initialBook);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [aiPanel, setAiPanel] = useState<AIPanel | null>(null);
  const [noteModal, setNoteModal] = useState<NoteModal | null>(null);
  const [noteText, setNoteText] = useState("");

  const { data: books } = trpc.bible.books.useQuery();
  const { data: chapterData, isLoading: chapterLoading } = trpc.bible.chapter.useQuery(
    { bookAbbrev: selectedBook!, chapter: selectedChapter },
    { enabled: !!selectedBook }
  );

  // Notas e favoritos do capítulo atual
  const { data: chapterNotes, refetch: refetchNotes } = trpc.notes.getChapter.useQuery(
    { bookAbbrev: selectedBook!, chapter: selectedChapter },
    { enabled: !!selectedBook && !!user }
  );
  const { data: chapterFavorites, refetch: refetchFavorites } = trpc.favorites.getChapter.useQuery(
    { bookAbbrev: selectedBook!, chapter: selectedChapter },
    { enabled: !!selectedBook && !!user }
  );

  // Índice de comentários de Emmanuel (título + livro-fonte) por versículo.
  const { data: emmanuelIndex } = trpc.bible.emmanuelIndex.useQuery(
    { bookAbbrev: selectedBook!, chapter: selectedChapter },
    { enabled: !!selectedBook, staleTime: Infinity }
  );
  const [expandedEmmanuel, setExpandedEmmanuel] = useState<number | null>(null);

  const interpretMutation = trpc.ai.interpret.useMutation();
  const emmanuelMutation = trpc.ai.emmanuelComment.useMutation();
  const correlationsMutation = trpc.ai.correlations.useMutation();
  const addHistoryMutation = trpc.history.add.useMutation();
  const saveNoteMutation = trpc.notes.save.useMutation();
  const deleteNoteMutation = trpc.notes.delete.useMutation();
  const toggleFavMutation = trpc.favorites.toggle.useMutation();

  const filteredBooks = useMemo(
    () => books?.filter((b) => b.testament === selectedTestament) ?? [],
    [books, selectedTestament]
  );

  const selectedBookData = useMemo(
    () => books?.find((b) => b.abbrev === selectedBook),
    [books, selectedBook]
  );

  // Mapas rápidos de notas e favoritos por versículo
  const notesMap = useMemo(() => {
    const m: Record<number, string> = {};
    chapterNotes?.forEach((n) => { m[n.verse] = n.note; });
    return m;
  }, [chapterNotes]);

  const favSet = useMemo(() => new Set(chapterFavorites ?? []), [chapterFavorites]);

  useEffect(() => {
    if (filteredBooks.length > 0 && !selectedBook) {
      setSelectedBook(filteredBooks[0].abbrev);
      setSelectedChapter(1);
    }
  }, [filteredBooks]);

  useEffect(() => {
    if (selectedBook && selectedBookData && user) {
      addHistoryMutation.mutate({
        bookAbbrev: selectedBook,
        bookName: selectedBookData.name,
        chapter: selectedChapter,
      });
    }
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    setSelectedVerses([]);
    setAiPanel(null);
    setExpandedEmmanuel(null);
  }, [selectedBook, selectedChapter]);

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses((prev) =>
      prev.includes(verseNum)
        ? prev.filter((v) => v !== verseNum)
        : [...prev, verseNum].sort((a, b) => a - b)
    );
  };

  const getSelectedVersesData = () => {
    if (!chapterData?.verses) return [];
    return selectedVerses.length > 0
      ? chapterData.verses.filter((v) => selectedVerses.includes(v.verse))
      : chapterData.verses;
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

  const handleToggleFavorite = async (verse: number, verseText: string) => {
    if (!selectedBook || !selectedBookData || !user) return;
    await toggleFavMutation.mutateAsync({
      bookAbbrev: selectedBook,
      bookName: selectedBookData.name,
      chapter: selectedChapter,
      verse,
      verseText,
    });
    refetchFavorites();
  };

  const openNoteModal = (verse: number, verseText: string) => {
    const existing = notesMap[verse] ?? "";
    setNoteModal({ verse, text: verseText, existingNote: existing });
    setNoteText(existing);
  };

  const handleSaveNote = async () => {
    if (!noteModal || !selectedBook || !noteText.trim()) return;
    await saveNoteMutation.mutateAsync({
      bookAbbrev: selectedBook,
      chapter: selectedChapter,
      verse: noteModal.verse,
      note: noteText.trim(),
    });
    refetchNotes();
    setNoteModal(null);
  };

  const handleDeleteNote = async (verse: number) => {
    if (!selectedBook) return;
    await deleteNoteMutation.mutateAsync({
      bookAbbrev: selectedBook,
      chapter: selectedChapter,
      verse,
    });
    refetchNotes();
    setNoteModal(null);
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
              {selectedVerses.length} versículo{selectedVerses.length > 1 ? "s" : ""} selecionado{selectedVerses.length > 1 ? "s" : ""} — clique para deselecionar
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

            {/* Hint */}
            {hasVerses && (
              <p className="text-xs text-white/25 italic">
                Clique em versículos para selecioná-los antes de gerar análise. Use ★ para favoritar e ✏ para anotar.
              </p>
            )}

            {/* Verses */}
            <div className="cosmic-card p-4 md:p-6">
              {chapterLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="cosmic-spinner" />
                </div>
              ) : chapterData?.verses.length ? (
                <div className="space-y-0.5">
                  {chapterData.verses.map((verse) => {
                    const isSelected = selectedVerses.includes(verse.verse);
                    const isFav = favSet.has(verse.verse);
                    const hasNote = !!notesMap[verse.verse];
                    const emmanuelRefs = emmanuelIndex?.[String(verse.verse)] ?? [];
                    const isEmmanuelOpen = expandedEmmanuel === verse.verse;
                    return (
                      <div
                        key={verse.id}
                        className={`group relative rounded-lg px-2 py-1.5 transition-all ${
                          isSelected
                            ? "bg-cyan-400/10 border border-cyan-400/20"
                            : "hover:bg-white/4"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {/* Verse text — clicável para selecionar */}
                          <p
                            className="verse-text leading-relaxed flex-1 cursor-pointer select-none"
                            onClick={() => toggleVerseSelection(verse.verse)}
                          >
                            <span className={`verse-number ${isSelected ? "text-cyan-400" : ""}`}>
                              {verse.verse}
                            </span>
                            {verse.text}
                          </p>
                          {/* Action buttons */}
                          {user && (
                            <div className="flex items-center gap-1 opacity-30 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                              <button
                                onClick={() => handleToggleFavorite(verse.verse, verse.text)}
                                className={`p-1 rounded transition-colors ${
                                  isFav ? "text-yellow-400" : "text-white/30 hover:text-yellow-400"
                                }`}
                                title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                              >
                                <Star className="w-3.5 h-3.5" fill={isFav ? "currentColor" : "none"} />
                              </button>
                              <button
                                onClick={() => openNoteModal(verse.verse, verse.text)}
                                className={`p-1 rounded transition-colors ${
                                  hasNote ? "text-violet-400" : "text-white/30 hover:text-violet-400"
                                }`}
                                title={hasNote ? "Editar anotação" : "Adicionar anotação"}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Nota inline */}
                        {hasNote && (
                          <div className="mt-1.5 ml-6 px-3 py-2 rounded-lg bg-violet-500/8 border border-violet-500/20">
                            <p className="text-violet-300/80 text-xs leading-relaxed italic">
                              {notesMap[verse.verse]}
                            </p>
                          </div>
                        )}
                        {/* Índice de comentários de Emmanuel para este versículo */}
                        {emmanuelRefs.length > 0 && (
                          <div className="mt-1.5 ml-6">
                            <button
                              onClick={() =>
                                setExpandedEmmanuel(isEmmanuelOpen ? null : verse.verse)
                              }
                              className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/70 hover:text-amber-300 transition-colors"
                              title="Onde Emmanuel comentou este versículo"
                            >
                              <BookMarked className="w-3 h-3" />
                              Emmanuel comentou ({emmanuelRefs.length})
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${isEmmanuelOpen ? "rotate-180" : ""}`}
                              />
                            </button>
                            {isEmmanuelOpen && (
                              <div className="mt-1.5 px-3 py-2 rounded-lg bg-amber-400/[0.06] border border-amber-400/20 space-y-1.5">
                                {emmanuelRefs.map((ref, i) => {
                                  // Usa ref.url (URL direta do comentário no livro de Emmanuel)
                                  // ou fallback para a URL do versículo na Bíblia do Caminho
                                  const linkUrl = (ref as any).url ?? bibliaCaminhoVerseUrl(
                                    selectedBook ?? undefined,
                                    selectedChapter,
                                    verse.verse
                                  );
                                  return (
                                    <div key={i} className="text-xs leading-snug flex items-start gap-1.5">
                                      <div className="flex-1">
                                        <span className="text-white/80">{ref.title}</span>
                                        {ref.code && (
                                          <span className="text-amber-300/60 ml-1.5">
                                            — {ref.source ?? ref.code}
                                            {ref.source ? ` (${ref.code})` : ""}
                                          </span>
                                        )}
                                      </div>
                                      <a
                                        href={linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-amber-300/50 hover:text-amber-300 transition-colors mt-0.5"
                                        title="Ler comentário de Emmanuel na Bíblia do Caminho"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  );
                                })}
                                <p className="text-white/25 text-[10px] pt-1 italic">
                                  Clique em <ExternalLink className="inline w-2.5 h-2.5" /> para ler o comentário na Bíblia do Caminho.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                    {aiPanel?.loading && aiPanel.type === "emmanuel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Comentário de Emmanuel
                  </button>
                  <button
                    onClick={() => handleAI("interpretation")}
                    disabled={aiPanel?.loading}
                    className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ borderColor: "oklch(0.55 0.22 285 / 0.4)", color: "oklch(0.65 0.22 285)" }}
                  >
                    {aiPanel?.loading && aiPanel.type === "interpretation" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Interpretação Espírita
                  </button>
                  <button
                    onClick={() => handleAI("correlations")}
                    disabled={aiPanel?.loading}
                    className="cosmic-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                    style={{ borderColor: "oklch(0.82 0.18 75 / 0.4)", color: "oklch(0.82 0.18 75)" }}
                  >
                    {aiPanel?.loading && aiPanel.type === "correlations" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
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
                  <button onClick={() => setAiPanel(null)} className="text-white/30 hover:text-white/60 transition-colors">
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
                    ) : aiPanel.content.map((corr: any, i: number) => (
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
                <span className="text-white/30 text-xs">{selectedChapter} / {selectedBookData.chapterCount}</span>
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

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="cosmic-card w-full max-w-lg p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-violet-400">Minha Anotação</h3>
              </div>
              <button onClick={() => setNoteModal(null)} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-white/40 text-xs italic mb-3 leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif" }}>
              "{noteModal.text}"
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escreva sua reflexão, meditação ou insight sobre este versículo..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white/80 text-sm resize-none focus:outline-none focus:border-violet-400/40 placeholder:text-white/20"
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <div>
                {noteModal.existingNote && (
                  <button
                    onClick={() => handleDeleteNote(noteModal.verse)}
                    className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir anotação
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNoteModal(null)}
                  className="px-4 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || saveNoteMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {saveNoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CosmicLayout>
  );
}
