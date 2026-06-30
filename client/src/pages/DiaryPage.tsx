import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, BookHeart, Calendar, ChevronRight } from "lucide-react";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { CosmicLayout } from "@/components/CosmicLayout";

export default function DiaryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: notes, isLoading } = trpc.meetingNotes.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BookHeart className="w-12 h-12 text-slate-500" />
        <p className="text-slate-400 text-center">
          Faça login para acessar seu diário espiritual.
        </p>
        <Button
          variant="outline"
          className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          Entrar
        </Button>
      </div>
      </CosmicLayout>
    );
  }

  if (isLoading) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      </CosmicLayout>
    );
  }

  return (
    <CosmicLayout>
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <BookHeart className="w-7 h-7 text-cyan-400" />
          Diário Espiritual
        </h1>
        <p className="text-slate-400 text-sm">
          Suas reflexões e anotações das reuniões do Evangelho no Lar
        </p>
      </div>

      {/* Lista de notas */}
      {!notes || notes.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-500">
            Nenhuma anotação ainda. Faça seu Evangelho no Lar e registre suas reflexões.
          </p>
          <Button
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
            onClick={() => (window.location.href = "/evangelho-no-lar")}
          >
            Ir para Evangelho no Lar
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
                      {new Date(note.date + "T12:00:00").toLocaleDateString("pt-BR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {note.theme && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                        {note.theme}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 font-medium">
                    {note.bookName} {note.chapter}:{note.verse}
                  </p>
                  {note.verseText && (
                    <p className="text-xs text-slate-500 italic line-clamp-1">
                      "{note.verseText}"
                    </p>
                  )}
                  <p className="text-sm text-slate-300 line-clamp-3 mt-2">
                    {note.note}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </CosmicLayout>
  );
}
