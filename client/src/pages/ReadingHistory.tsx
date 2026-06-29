import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { BookOpen, Calendar, Clock, History, LogIn } from "lucide-react";
import { Link } from "wouter";
import { CosmicLayout } from "@/components/CosmicLayout";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReadingHistory() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: history, isLoading } = trpc.history.list.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  return (
    <CosmicLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Histórico</h2>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            Suas Leituras
          </h1>
        </div>

        {/* Not authenticated */}
        {!loading && !isAuthenticated && (
          <div className="cosmic-card p-8 text-center animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Faça login para ver seu histórico
            </h3>
            <p className="text-white/50 text-sm mb-6">
              O histórico de leituras é salvo individualmente por usuário.
            </p>
            <a href={getLoginUrl()}>
              <button className="cosmic-btn px-6 py-3 rounded-xl text-sm font-semibold">
                Entrar na plataforma
              </button>
            </a>
          </div>
        )}

        {/* Loading */}
        {(loading || isLoading) && isAuthenticated && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="cosmic-card p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History list */}
        {isAuthenticated && !isLoading && history && (
          <>
            {history.length === 0 ? (
              <div className="cosmic-card p-12 text-center text-white/40 animate-fade-in-up">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma leitura registrada ainda</p>
                <p className="text-xs mt-2">Comece a ler a Bíblia para ver seu histórico aqui</p>
                <Link href="/biblia">
                  <button className="cosmic-btn mt-6 px-5 py-2.5 rounded-xl text-sm">
                    Ir para a Bíblia
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                <p className="text-xs text-white/40">
                  {history.length} leitura{history.length !== 1 ? "s" : ""} registrada{history.length !== 1 ? "s" : ""}
                </p>
                {history.map((item) => (
                  <Link
                    key={item.id}
                    href={`/biblia?book=${item.bookAbbrev}&chapter=${item.chapter}`}
                  >
                    <div className="cosmic-card p-4 cursor-pointer group animate-fade-in-up">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-400/20 transition-colors">
                          <BookOpen className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">
                            {item.bookName} {item.chapter}
                            {item.verseStart && item.verseEnd
                              ? `:${item.verseStart}–${item.verseEnd}`
                              : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="w-3 h-3 text-white/30" />
                            <p className="text-xs text-white/40">{formatDate(item.readAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CosmicLayout>
  );
}
