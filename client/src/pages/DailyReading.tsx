import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Sparkles,
  Link2,
  Star,
  BookOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Streamdown } from "streamdown";

function formatDateBR(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dateToStr(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function DailyReading() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEmmanuel, setShowEmmanuel] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [showCorrelations, setShowCorrelations] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [emmanuelComment, setEmmanuelComment] = useState<string | null>(null);
  const [correlationsList, setCorrelationsList] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const dateStr = dateToStr(currentDate);
  const { data: dailyData, isLoading } = trpc.daily.byDate.useQuery({ date: dateStr });
  const addHistoryMutation = trpc.history.add.useMutation();
  const interpretMutation = trpc.ai.interpret.useMutation();
  const emmanuelMutation = trpc.ai.emmanuelComment.useMutation();
  const correlationsMutation = trpc.ai.correlations.useMutation();

  // Register history
  useEffect(() => {
    if (dailyData && user) {
      addHistoryMutation.mutate({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
      });
    }
  }, [dailyData?.reading.bookAbbrev, dailyData?.reading.chapter]);

  const resetAI = () => {
    setInterpretation(null);
    setEmmanuelComment(null);
    setCorrelationsList([]);
    setShowEmmanuel(false);
    setShowInterpretation(false);
    setShowCorrelations(false);
  };

  const navigateDay = (delta: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + delta);
    setCurrentDate(d);
    resetAI();
  };

  const handleEmmanuel = async () => {
    if (!dailyData?.verses) return;
    setShowEmmanuel(true);
    setLoadingAI(true);
    try {
      const result = await emmanuelMutation.mutateAsync({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
        verses: dailyData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setEmmanuelComment(result.comment);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleInterpretation = async () => {
    if (!dailyData?.verses) return;
    setShowInterpretation(true);
    setLoadingAI(true);
    try {
      const result = await interpretMutation.mutateAsync({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
        verses: dailyData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setInterpretation(result.interpretation);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCorrelations = async () => {
    if (!dailyData?.verses) return;
    setShowCorrelations(true);
    setLoadingAI(true);
    try {
      const result = await correlationsMutation.mutateAsync({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
        verses: dailyData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setCorrelationsList(result.correlations ?? []);
    } finally {
      setLoadingAI(false);
    }
  };

  const correlationTypeLabel: Record<string, string> = {
    prophecy: "Profecia",
    fulfillment: "Cumprimento",
    parallel: "Paralelo",
    contrast: "Contraste",
    quote: "Citação",
  };

  const isToday = dateStr === dateToStr(new Date());

  return (
    <CosmicLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Leitura Diária</h2>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <button
            onClick={() => navigateDay(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <div className="text-center">
            <p className="text-white font-semibold capitalize" style={{ fontFamily: "'Cinzel', serif" }}>
              {formatDateBR(currentDate)}
            </p>
            {isToday && (
              <span className="text-xs text-cyan-400/70 tracking-widest">HOJE</span>
            )}
          </div>
          <button
            onClick={() => navigateDay(1)}
            disabled={isToday}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Próximo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="cosmic-card p-12 flex items-center justify-center">
            <div className="cosmic-spinner" />
          </div>
        )}

        {/* No reading */}
        {!isLoading && !dailyData && (
          <div className="cosmic-card p-12 text-center text-white/40">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma leitura programada para esta data.</p>
          </div>
        )}

        {/* Reading Content */}
        {!isLoading && dailyData && (
          <>
            {/* Reading info */}
            <div className="cosmic-card p-6 relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{
                background: "radial-gradient(circle, oklch(0.75 0.18 195) 0%, transparent 70%)",
                filter: "blur(20px)",
                transform: "translate(30%, -30%)"
              }} />
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                      {dailyData.reading.theme}
                    </h1>
                    <p className="text-cyan-400/70 text-sm mt-1">
                      {dailyData.reading.bookName} {dailyData.reading.chapter}:{dailyData.reading.verseStart}–{dailyData.reading.verseEnd}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verses */}
            <div className="cosmic-card p-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="space-y-4">
                {dailyData.verses.map((verse) => (
                  <p key={verse.id} className="verse-text leading-relaxed">
                    <span className="verse-number">{verse.verse}</span>
                    {verse.text}
                  </p>
                ))}
              </div>
            </div>

            {/* AI Actions */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <button
                onClick={handleEmmanuel}
                disabled={loadingAI}
                className="cosmic-btn flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
              >
                {loadingAI && showEmmanuel && !emmanuelComment
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageCircle className="w-4 h-4" />}
                Comentário de Emmanuel
              </button>
              <button
                onClick={handleInterpretation}
                disabled={loadingAI}
                className="cosmic-btn flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                style={{ borderColor: "oklch(0.55 0.22 285 / 0.4)", color: "oklch(0.65 0.22 285)" }}
              >
                {loadingAI && showInterpretation && !interpretation
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Sparkles className="w-4 h-4" />}
                Interpretação Espírita
              </button>
              <button
                onClick={handleCorrelations}
                disabled={loadingAI}
                className="cosmic-btn flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                style={{ borderColor: "oklch(0.82 0.18 75 / 0.4)", color: "oklch(0.82 0.18 75)" }}
              >
                {loadingAI && showCorrelations && correlationsList.length === 0
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Link2 className="w-4 h-4" />}
                Correlações AT/NT
              </button>
            </div>

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
                    <span className="text-white/50 text-sm italic">Emmanuel está meditando sobre este trecho...</span>
                  </div>
                ) : emmanuelComment ? (
                  <div className="emmanuel-box">
                    <p className="text-white/80 leading-relaxed mt-4" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1.1rem", fontStyle: "italic" }}>
                      {emmanuelComment}
                    </p>
                    <p className="text-cyan-400/50 text-xs mt-4 text-right">— Emmanuel</p>
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
                    <span className="text-white/50 text-sm italic">Gerando interpretação profunda...</span>
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
                    <span className="text-white/50 text-sm italic">Buscando correlações bíblicas...</span>
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
          </>
        )}
      </div>
    </CosmicLayout>
  );
}
