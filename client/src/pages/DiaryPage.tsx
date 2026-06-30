import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Loader2, Flame } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function DiaryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: notes, isLoading } = trpc.meetingNotes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </CosmicLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Flame className="w-12 h-12 text-amber-400/60 mx-auto" />
            <p className="text-indigo-200/60 font-serif">Faça login para acessar seu diário espiritual.</p>
            <a href={getLoginUrl()} className="cosmic-btn px-6 py-2 rounded-lg inline-block text-sm">
              Entrar
            </a>
          </div>
        </div>
      </CosmicLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <CosmicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="font-cinzel text-xs tracking-[3px] uppercase text-cyan-300">Diário Espiritual</p>
          <h1 className="text-2xl md:text-3xl font-cinzel text-white glow-cyan">Minhas Meditações</h1>
        </div>

        {/* Lista de notas */}
        {!notes || notes.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Flame className="w-12 h-12 text-amber-400/40 mx-auto" />
            <p className="text-indigo-200/50 font-serif">
              Nenhuma meditação registrada ainda. Ao estudar, registre o que tocou seu coração.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((entry) => (
              <article key={entry.id} className="cosmic-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-cinzel text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                      {entry.contexto || entry.theme || `${entry.bookName} ${entry.chapter}:${entry.verse}`}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-300/40">{formatDate(entry.date)}</span>
                </div>

                {entry.verseText && (
                  <p className="text-sm text-indigo-200/60 font-serif italic border-l-2 border-cyan-500/30 pl-3">
                    "{entry.verseText}"
                  </p>
                )}

                {entry.sentimento && (
                  <p className="text-indigo-100/90 font-serif leading-relaxed">{entry.sentimento}</p>
                )}

                {entry.insight && (
                  <p className="text-indigo-200/70 font-serif text-sm">
                    <span className="text-amber-400 font-cinzel text-xs mr-2">Propósito:</span>
                    {entry.insight}
                  </p>
                )}

                {/* Fallback para notas antigas sem campos estruturados */}
                {!entry.sentimento && !entry.insight && entry.note && (
                  <p className="text-indigo-100/90 font-serif leading-relaxed">{entry.note}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </CosmicLayout>
  );
}
