import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Home,
  BookOpen,
  Star,
  Sparkles,
  MessageCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Streamdown } from "streamdown";
import { useState, useEffect } from "react";

type Step = "reading" | "emmanuel" | "interpretation" | "meditation";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "reading", label: "Leitura", icon: <BookOpen className="w-4 h-4" /> },
  { id: "emmanuel", label: "Emmanuel", icon: <Star className="w-4 h-4" /> },
  { id: "interpretation", label: "Interpretação", icon: <Sparkles className="w-4 h-4" /> },
  { id: "meditation", label: "Meditação", icon: <MessageCircle className="w-4 h-4" /> },
];

const MEDITATION_PROMPTS = [
  "Como este ensinamento se aplica à minha vida hoje?",
  "Que atitude prática posso tomar com base nesta passagem?",
  "O que Jesus está pedindo de mim neste trecho?",
  "Como posso ser um instrumento desta mensagem para os que estão ao meu redor?",
  "Que pensamento, sentimento ou hábito preciso transformar à luz deste ensinamento?",
];

export default function HomeGospel() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("reading");
  const [emmanuelContent, setEmmanuelContent] = useState<string | null>(null);
  const [interpretationContent, setInterpretationContent] = useState<string | null>(null);
  const [emmanuelLoading, setEmmanuelLoading] = useState(false);
  const [interpretationLoading, setInterpretationLoading] = useState(false);
  const [meditationIdx, setMeditationIdx] = useState(0);
  const [diaryNote, setDiaryNote] = useState("");
  const [diaryInsight, setDiaryInsight] = useState("");
  const [diarySaved, setDiarySaved] = useState(false);
  const [diarySaving, setDiarySaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const { data: dailyData, isLoading } = trpc.daily.today.useQuery();

  const emmanuelMutation = trpc.ai.emmanuelComment.useMutation();
  const interpretMutation = trpc.ai.interpret.useMutation();
  const addHistoryMutation = trpc.history.add.useMutation();
  const saveMeetingNote = trpc.meetingNotes.save.useMutation();
  const { data: existingNote } = trpc.meetingNotes.get.useQuery(
    { date: today },
    { enabled: !!user }
  );

  useEffect(() => {
    if (existingNote?.note) {
      setDiaryNote(existingNote.note);
      setDiarySaved(true);
    }
  }, [existingNote]);

  useEffect(() => {
    if (dailyData && user) {
      addHistoryMutation.mutate({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
      });
    }
  }, [dailyData?.reading?.bookAbbrev]);

  useEffect(() => {
    setMeditationIdx(Math.floor(Math.random() * MEDITATION_PROMPTS.length));
  }, [today]);

  const loadEmmanuel = async () => {
    if (!dailyData || emmanuelContent) return;
    setEmmanuelLoading(true);
    try {
      const result = await emmanuelMutation.mutateAsync({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
        verses: dailyData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setEmmanuelContent(result.comment);
    } catch {
      setEmmanuelContent("Não foi possível gerar o comentário. Tente novamente.");
    } finally {
      setEmmanuelLoading(false);
    }
  };

  const loadInterpretation = async () => {
    if (!dailyData || interpretationContent) return;
    setInterpretationLoading(true);
    try {
      const result = await interpretMutation.mutateAsync({
        bookAbbrev: dailyData.reading.bookAbbrev,
        bookName: dailyData.reading.bookName,
        chapter: dailyData.reading.chapter,
        verseStart: dailyData.reading.verseStart,
        verseEnd: dailyData.reading.verseEnd,
        verses: dailyData.verses.map((v) => ({ verse: v.verse, text: v.text })),
      });
      setInterpretationContent(result.interpretation);
    } catch {
      setInterpretationContent("Não foi possível gerar a interpretação. Tente novamente.");
    } finally {
      setInterpretationLoading(false);
    }
  };

  const handleStepChange = (newStep: Step) => {
    setStep(newStep);
    if (newStep === "emmanuel" && !emmanuelContent) loadEmmanuel();
    if (newStep === "interpretation" && !interpretationContent) loadInterpretation();
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) {
      handleStepChange(STEPS[stepIndex + 1].id);
    }
  };
  const goPrev = () => {
    if (stepIndex > 0) {
      handleStepChange(STEPS[stepIndex - 1].id);
    }
  };

  const dateLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const referenceLabel = dailyData
    ? `${dailyData.reading.bookName} ${dailyData.reading.chapter}:${dailyData.reading.verseStart}–${dailyData.reading.verseEnd}`
    : "";

  return (
    <CosmicLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Home className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Evangelho no Lar</h2>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
            Reunião de Hoje
          </h1>
          <p className="text-white/30 text-sm capitalize">{dateLabel}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="cosmic-spinner" />
          </div>
        ) : !dailyData ? (
          <div className="cosmic-card p-8 text-center">
            <p className="text-white/40">Nenhuma leitura disponível para hoje.</p>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-between animate-fade-in-up">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => handleStepChange(s.id)}
                  className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${
                    step === s.id ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      step === s.id
                        ? "bg-cyan-400/15 border-cyan-400/50 text-cyan-400"
                        : i < stepIndex
                        ? "bg-cyan-400/8 border-cyan-400/20 text-cyan-400/60"
                        : "bg-white/5 border-white/15 text-white/40"
                    }`}
                  >
                    {s.icon}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${step === s.id ? "text-cyan-400" : "text-white/30"}`}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Reference Banner */}
            <div className="text-center py-2 animate-fade-in-up">
              <span className="text-sm font-semibold text-cyan-400/70 tracking-wide">{referenceLabel}</span>
              {dailyData.reading.theme && (
                <p className="text-white/30 text-xs mt-0.5">{dailyData.reading.theme}</p>
              )}
            </div>

            {/* Step Content */}
            <div className="animate-fade-in-up" key={step}>
              {step === "reading" && (
                <div className="space-y-3">
                  <div className="cosmic-card p-5 md:p-7">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-semibold text-cyan-400 tracking-wide">Leitura do Dia</h3>
                    </div>
                    <div className="space-y-2">
                      {dailyData.verses.map((verse) => (
                        <p key={verse.id} className="verse-text leading-relaxed">
                          <span className="verse-number">{verse.verse}</span>
                          {verse.text}
                        </p>
                      ))}
                    </div>
                  </div>
                  {dailyData.reading.meditationPrompt && (
                    <div className="cosmic-card p-4 bg-white/2">
                      <p className="text-white/35 text-xs italic text-center">
                        {dailyData.reading.meditationPrompt}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === "emmanuel" && (
                <div className="cosmic-card p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-semibold text-cyan-400 tracking-wide">Comentário de Emmanuel</h3>
                  </div>
                  {emmanuelLoading ? (
                    <div className="flex items-center gap-3 py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-white/40 text-sm">Gerando comentário...</span>
                    </div>
                  ) : emmanuelContent ? (
                    <div className="emmanuel-box">
                      <p
                        className="text-white/85 leading-relaxed"
                        style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1.08rem" }}
                      >
                        {emmanuelContent}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {step === "interpretation" && (
                <div className="cosmic-card p-5 md:p-7">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-violet-400 tracking-wide">Interpretação Espírita</h3>
                  </div>
                  {interpretationLoading ? (
                    <div className="flex items-center gap-3 py-6">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span className="text-white/40 text-sm">Gerando interpretação...</span>
                    </div>
                  ) : interpretationContent ? (
                    <div className="interpretation-box prose prose-invert max-w-none">
                      <Streamdown>{interpretationContent}</Streamdown>
                    </div>
                  ) : null}
                </div>
              )}

              {step === "meditation" && (
                <div className="space-y-4">
                  <div className="cosmic-card p-6 text-center">
                    <MessageCircle className="w-10 h-10 mx-auto mb-4 text-cyan-400/40" />
                    <h3 className="text-sm font-semibold text-white/60 tracking-wide mb-4">Reflexão Final</h3>
                    <div className="bg-white/3 border border-white/8 rounded-xl p-5 mb-4">
                      <p
                        className="text-white/75 text-lg leading-relaxed italic"
                        style={{ fontFamily: "'Crimson Pro', serif" }}
                      >
                        "{MEDITATION_PROMPTS[meditationIdx]}"
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      {MEDITATION_PROMPTS.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMeditationIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === meditationIdx ? "bg-cyan-400 w-3" : "bg-white/20"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Diário Espiritual - Campos Estruturados */}
                  {user && dailyData && (
                    <div className="cosmic-card p-5 space-y-4">
                      <h4 className="text-sm font-cinzel text-cyan-300 tracking-wide flex items-center gap-2">
                        <Save className="w-4 h-4 text-cyan-400/60" />
                        Registrar no diário
                      </h4>

                      <div className="space-y-2">
                        <label className="text-xs font-cinzel text-indigo-200">O que tocou você?</label>
                        <textarea
                          value={diaryNote}
                          onChange={(e) => {
                            setDiaryNote(e.target.value);
                            setDiarySaved(false);
                          }}
                          placeholder="Um sentimento, uma percepção..."
                          className="cosmic-input w-full rounded-lg p-3 text-sm resize-none min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-cinzel text-indigo-200">Propósito ou insight</label>
                        <input
                          value={diaryInsight}
                          onChange={(e) => {
                            setDiaryInsight(e.target.value);
                            setDiarySaved(false);
                          }}
                          placeholder="Uma atitude, uma intenção..."
                          className="cosmic-input w-full rounded-lg p-3 text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/20">
                          {diarySaved ? (
                            <span className="flex items-center gap-1 text-green-400/60">
                              <Check className="w-3 h-3" /> Salvo
                            </span>
                          ) : (diaryNote.length > 0 || diaryInsight.length > 0) ? (
                            "Não salvo"
                          ) : null}
                        </p>
                        <button
                          disabled={(!diaryNote.trim() && !diaryInsight.trim()) || diarySaving || diarySaved}
                          onClick={async () => {
                            if (!dailyData) return;
                            setDiarySaving(true);
                            try {
                              await saveMeetingNote.mutateAsync({
                                date: today,
                                bookAbbrev: dailyData.reading.bookAbbrev,
                                bookName: dailyData.reading.bookName,
                                chapter: dailyData.reading.chapter,
                                verse: dailyData.reading.verseStart,
                                verseText: dailyData.verses[0]?.text,
                                theme: dailyData.reading.theme ?? undefined,
                                note: diaryNote || diaryInsight || "",
                                sentimento: diaryNote || undefined,
                                insight: diaryInsight || undefined,
                                contexto: "Evangelho no Lar — " + referenceLabel,
                              });
                              setDiarySaved(true);
                            } catch {} finally {
                              setDiarySaving(false);
                            }
                          }}
                          className="cosmic-btn px-4 py-1.5 rounded-lg text-xs"
                        >
                          {diarySaving ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="cosmic-card p-5 text-center">
                    <p className="text-white/30 text-sm mb-3">Versículos lidos hoje</p>
                    <p className="text-cyan-400 font-semibold" style={{ fontFamily: "'Cinzel', serif" }}>
                      {referenceLabel}
                    </p>
                    <p className="text-white/20 text-xs mt-2">
                      {dailyData.verses.length} versículo{dailyData.verses.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 animate-fade-in-up">
              <button
                onClick={goPrev}
                disabled={stepIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              <span className="text-white/20 text-xs">
                {stepIndex + 1} / {STEPS.length}
              </span>
              {stepIndex < STEPS.length - 1 ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm cosmic-btn"
                >
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setStep("reading")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all"
                >
                  Recomeçar
                  <BookOpen className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </CosmicLayout>
  );
}
