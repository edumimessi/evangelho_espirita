import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, BookOpen, Heart, Sparkles, Star, RefreshCw, PenLine, ExternalLink } from "lucide-react";
import { Streamdown } from "streamdown";
import { CosmicLayout } from "@/components/CosmicLayout";
import { bibliaCaminhoVerseUrl } from "@/lib/bibliaCaminho";
import { toast } from "sonner";

export default function Devocional() {
  const { user, isAuthenticated } = useAuth();
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [sentimento, setSentimento] = useState("");
  const [insight, setInsight] = useState("");

  const [currentData, setCurrentData] = useState<typeof todayData | null>(null);
  const { data: todayData, isLoading, error } = trpc.devocional.today.useQuery(undefined, {
    staleTime: Infinity,
  });
  const data = currentData ?? todayData;

  const generateMutation = trpc.devocional.generate.useMutation({
    onSuccess: (result) => {
      setCurrentData(result);
    },
    onError: () => toast.error("Erro ao gerar novo devocional. Tente novamente."),
  });

  const saveMeetingNote = trpc.meetingNotes.save.useMutation({
    onSuccess: () => {
      toast.success("Registrado no diário!");
      setShowDiaryModal(false);
      setSentimento("");
      setInsight("");
    },
    onError: () => toast.error("Erro ao salvar no diário."),
  });

  const toggleFav = trpc.favorites.toggle.useMutation({
    onSuccess: (result) => {
      toast.success(result.isFavorite ? "Favoritado!" : "Removido dos favoritos");
    },
  });

  const handleFavorite = () => {
    if (!isAuthenticated || !data) return toast.error("Faça login para favoritar");
    toggleFav.mutate({
      bookAbbrev: "NT",
      bookName: data.bookName || "Novo Testamento",
      chapter: data.chapter || 1,
      verse: data.verse || 1,
      verseText: data.verseText,
    });
  };

  const handleSaveDiary = () => {
    if (!isAuthenticated || !data) return;
    const today = new Date().toISOString().split("T")[0];
    saveMeetingNote.mutate({
      date: today,
      bookAbbrev: "NT",
      bookName: data.bookName || "Novo Testamento",
      chapter: data.chapter || 1,
      verse: data.verse || 1,
      verseText: data.verseText,
      theme: "Devocional — " + (data.reference || ""),
      note: sentimento || insight || "",
    });
  };

  const handleGerarOutro = () => {
    generateMutation.mutate();
  };

  if (isLoading) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-indigo-300/60 font-serif text-sm">Preparando o devocional...</p>
          </div>
        </div>
      </CosmicLayout>
    );
  }

  if (error || !data) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-indigo-300/60 font-serif">Devocional não disponível. Tente novamente.</p>
            <button onClick={() => generateMutation.mutate()} className="cosmic-btn px-4 py-2 rounded-lg text-sm">
              Tentar novamente
            </button>
          </div>
        </div>
      </CosmicLayout>
    );
  }

  return (
    <CosmicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="font-cinzel text-xs tracking-[3px] uppercase text-cyan-300">Devocional do Dia</p>
          <p className="text-indigo-300/50 text-sm font-serif">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Card principal */}
        <div className="cosmic-card p-6 md:p-8 space-y-6">
          {/* Referência + Favoritar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-cinzel text-xs tracking-wide uppercase">
              <BookOpen className="w-4 h-4" />
              {data.reference}
            </div>
            <button
              onClick={handleFavorite}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Favoritar"
            >
              <Star className="w-5 h-5 text-amber-400" />
            </button>
          </div>

          {/* Versículo */}
          <blockquote className="border-l-3 border-cyan-400 pl-5 py-2 text-xl md:text-2xl font-serif text-indigo-100 leading-relaxed italic">
            "{data.verseText}"
          </blockquote>

          {/* Reflexão */}
          <div className="space-y-3">
            <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 pb-2 border-b border-white/10">
              Reflexão
            </h3>
            <div className="text-indigo-100/90 font-serif leading-relaxed">
              <Streamdown>{data.reflexao}</Streamdown>
            </div>
          </div>

          {/* Oração */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300">Oração</h3>
            </div>
            <div className="p-5 rounded-xl bg-white/[0.03] border border-violet-500/20 text-indigo-100/90 font-serif leading-relaxed italic">
              <Streamdown>{data.oracao}</Streamdown>
            </div>
          </div>

          {/* Referências de Emmanuel */}
          {data.emmanuelRefs && (data.emmanuelRefs as Array<{title: string; source: string; code: string}>).length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-amber-400">Emmanuel comentou este versículo</h3>
              </div>
              <div className="space-y-2">
                {(data.emmanuelRefs as Array<{title: string; source: string; code: string}>).map((ref, i) => (
                  <a
                    key={i}
                    href={bibliaCaminhoVerseUrl(data.bookAbbrev, data.chapter, data.verse)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 hover:bg-amber-400/10 transition-colors group"
                  >
                    <div>
                      <p className="text-amber-200 text-sm font-serif">{ref.title}</p>
                      <p className="text-amber-400/60 text-xs font-cinzel">{ref.code}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-amber-400/60 group-hover:text-amber-300 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
            <button
              onClick={handleGerarOutro}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-100 font-cinzel transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
              {generateMutation.isPending ? 'Gerando...' : 'Gerar outro'}
            </button>
            <button
              onClick={() => setShowDiaryModal(true)}
              className="inline-flex items-center gap-2 text-sm text-violet-300 hover:text-violet-100 font-cinzel transition-colors"
            >
              <PenLine className="w-4 h-4" /> Registrar no diário
            </button>
            <a
              href={bibliaCaminhoVerseUrl(data.bookAbbrev, data.chapter, data.verse)}
              target="_blank"
              rel="noopener noreferrer"
              title={`Ler ${data.reference} na Bíblia do Caminho`}
              className="inline-flex items-center gap-2 text-sm text-amber-400/70 hover:text-amber-300 font-cinzel transition-colors ml-auto"
            >
              <ExternalLink className="w-3 h-3" /> Ler {data.reference} na Bíblia do Caminho
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-indigo-400/40 font-serif italic">
          Reflexões geradas de forma original, inspiradas no estilo de Emmanuel — não reproduzem os livros protegidos.
        </p>
      </div>

      {/* Modal Diário */}
      {showDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowDiaryModal(false)}>
          <div className="w-full max-w-md cosmic-card p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-cinzel text-lg text-white">Registrar no diário</h3>
            <p className="text-xs text-indigo-300/60 font-serif">Devocional — {data.reference}</p>

            <div className="space-y-2">
              <label className="text-sm text-indigo-200 font-cinzel">O que tocou você?</label>
              <textarea
                value={sentimento}
                onChange={(e) => setSentimento(e.target.value)}
                placeholder="Um sentimento, uma percepção..."
                className="cosmic-input w-full rounded-lg p-3 min-h-[80px] resize-none text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-indigo-200 font-cinzel">Propósito ou insight</label>
              <input
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                placeholder="Uma atitude, uma intenção..."
                className="cosmic-input w-full rounded-lg p-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowDiaryModal(false)} className="text-sm text-indigo-300/60 hover:text-indigo-200 font-cinzel transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveDiary} className="cosmic-btn px-4 py-2 rounded-lg text-sm">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </CosmicLayout>
  );
}
