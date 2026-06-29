import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Star, BookOpen, Trash2, ExternalLink } from "lucide-react";
import { CosmicLayout } from "@/components/CosmicLayout";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const { data: favorites, isLoading, refetch } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });
  const toggleFavMutation = trpc.favorites.toggle.useMutation();

  const handleRemove = async (fav: {
    bookAbbrev: string;
    bookName: string;
    chapter: number;
    verse: number;
    verseText: string;
  }) => {
    await toggleFavMutation.mutateAsync({
      bookAbbrev: fav.bookAbbrev,
      bookName: fav.bookName,
      chapter: fav.chapter,
      verse: fav.verse,
      verseText: fav.verseText,
    });
    refetch();
  };

  const handleNavigate = (bookAbbrev: string, chapter: number) => {
    navigate(`/biblia?book=${bookAbbrev}&chapter=${chapter}`);
  };

  if (!isAuthenticated) {
    return (
      <CosmicLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <Star className="w-16 h-16 text-yellow-400/30 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
            Seus Favoritos
          </h2>
          <p className="text-white/40 mb-6">Faça login para salvar versículos favoritos.</p>
          <a
            href={getLoginUrl()}
            className="cosmic-btn px-6 py-3 rounded-xl text-sm font-semibold"
          >
            Entrar
          </a>
        </div>
      </CosmicLayout>
    );
  }

  return (
    <CosmicLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
            <h2 className="text-xs font-semibold text-white/50 tracking-widest uppercase">Coleção Pessoal</h2>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
            Versículos Favoritos
          </h1>
          {favorites && (
            <p className="text-white/30 text-sm mt-1">
              {favorites.length} versículo{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="cosmic-spinner" />
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <div className="cosmic-card p-10 text-center animate-fade-in-up">
            <Star className="w-14 h-14 mx-auto mb-4 text-yellow-400/20" />
            <h3 className="text-lg font-semibold text-white/60 mb-2">Nenhum favorito ainda</h3>
            <p className="text-white/30 text-sm mb-6">
              No leitor bíblico, passe o mouse sobre um versículo e clique na estrela ★ para salvá-lo aqui.
            </p>
            <button
              onClick={() => navigate("/biblia")}
              className="cosmic-btn px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Ir para o Leitor Bíblico
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in-up">
            {favorites.map((fav, i) => (
              <div
                key={fav.id}
                className="cosmic-card p-4 group animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" fill="currentColor" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-yellow-400/80 tracking-wide">
                        {fav.bookName} {fav.chapter}:{fav.verse}
                      </span>
                    </div>
                    <p
                      className="text-white/80 leading-relaxed text-sm"
                      style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1rem" }}
                    >
                      {fav.verseText}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleNavigate(fav.bookAbbrev, fav.chapter)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                      title="Abrir no leitor"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemove(fav)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CosmicLayout>
  );
}
