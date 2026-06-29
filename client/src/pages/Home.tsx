import { trpc } from "@/lib/trpc";
import { BookOpen, Calendar, ChevronRight, Clock, History, Search, Star, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { CosmicLayout } from "@/components/CosmicLayout";

const spiritThemes = [
  { label: "Reencarnação", icon: "♾️" },
  { label: "Lei de Causa e Efeito", icon: "⚖️" },
  { label: "Caridade", icon: "💫" },
  { label: "Evolução Espiritual", icon: "🌟" },
  { label: "Oração", icon: "🙏" },
  { label: "Amor", icon: "✨" },
  { label: "Perdão", icon: "🕊️" },
  { label: "Humildade", icon: "🌿" },
];

export default function Home() {
  const { data: dailyData, isLoading: dailyLoading } = trpc.daily.today.useQuery();

  return (
    <CosmicLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Hero */}
        <div className="text-center space-y-4 py-8 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full opacity-10" style={{
              background: "radial-gradient(circle, oklch(0.75 0.18 195) 0%, transparent 70%)",
              filter: "blur(40px)"
            }} />
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400/80 text-xs font-medium tracking-widest mb-4">
              <Star className="w-3 h-3" />
              PLATAFORMA DE ESTUDO ESPÍRITA
              <Star className="w-3 h-3" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white glow-cyan leading-tight"
              style={{ fontFamily: "'Cinzel', serif" }}>
              EVANGELHO
              <br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, oklch(0.75 0.18 195), oklch(0.65 0.22 285))" }}>
                ESPÍRITA
              </span>
            </h1>

            <p className="mt-4 text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif", fontStyle: "italic", fontSize: "1.1rem" }}>
              "Buscai e achareis; batei e abrir-se-vos-á."
              <span className="block text-white/30 text-xs mt-1 not-italic" style={{ fontFamily: "'Inter', sans-serif" }}>Mateus 7:7</span>
            </p>
          </div>
        </div>

        {/* Leitura Diária em Destaque */}
        <section className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white/70 tracking-widest uppercase">Leitura do Dia</h2>
          </div>

          {dailyLoading ? (
            <div className="cosmic-card p-6 space-y-3">
              <div className="h-4 bg-white/10 rounded animate-pulse w-1/3" />
              <div className="h-3 bg-white/5 rounded animate-pulse" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-white/5 rounded animate-pulse w-3/5" />
            </div>
          ) : dailyData ? (
            <Link href="/leitura-diaria">
              <div className="cosmic-card p-6 cursor-pointer group relative overflow-hidden">
                <div className="orb-1 opacity-30" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-cyan-400/70 font-medium tracking-widest uppercase mb-1">
                        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                        {dailyData.reading.theme}
                      </h3>
                      <p className="text-sm text-white/50 mt-1">
                        {dailyData.reading.bookName} {dailyData.reading.chapter}:{dailyData.reading.verseStart}–{dailyData.reading.verseEnd}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-cyan-400/50 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all mt-1" />
                  </div>

                  {dailyData.verses.slice(0, 3).map((v) => (
                    <p key={v.id} className="text-white/70 leading-relaxed mb-2" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1.05rem" }}>
                      <span className="verse-number">{v.verse}</span>
                      {v.text}
                    </p>
                  ))}

                  {dailyData.verses.length > 3 && (
                    <p className="text-cyan-400/50 text-sm mt-2 italic">
                      + {dailyData.verses.length - 3} versículos — clique para ler completo
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="cosmic-card p-6 text-center text-white/40">
              <p>Nenhuma leitura programada para hoje.</p>
            </div>
          )}
        </section>

        {/* Acesso Rápido */}
        <section className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white/70 tracking-widest uppercase">Explorar</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            {[
              { href: "/biblia", icon: BookOpen, label: "Bíblia Completa", sub: "AT e NT", color: "cyan" },
              { href: "/leitura-diaria", icon: Calendar, label: "Leitura Diária", sub: "Meditação guiada", color: "violet" },
              { href: "/busca", icon: Search, label: "Busca", sub: "Por tema ou palavra", color: "indigo" },
              { href: "/historico", icon: History, label: "Histórico", sub: "Suas leituras", color: "purple" },
            ].map(({ href, icon: Icon, label, sub, color }) => (
              <Link key={href} href={href}>
                <div className="cosmic-card p-4 cursor-pointer group animate-fade-in-up text-center">
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    color === "cyan" ? "bg-cyan-400/10 border border-cyan-400/20" :
                    color === "violet" ? "bg-violet-400/10 border border-violet-400/20" :
                    color === "indigo" ? "bg-indigo-400/10 border border-indigo-400/20" :
                    "bg-purple-400/10 border border-purple-400/20"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      color === "cyan" ? "text-cyan-400" :
                      color === "violet" ? "text-violet-400" :
                      color === "indigo" ? "text-indigo-400" :
                      "text-purple-400"
                    }`} />
                  </div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Temas Espíritas */}
        <section className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-gold-400" style={{ color: "oklch(0.82 0.18 75)" }} />
            <h2 className="text-sm font-semibold text-white/70 tracking-widest uppercase">Temas Espíritas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {spiritThemes.map((theme) => (
              <Link key={theme.label} href={`/busca?tema=${encodeURIComponent(theme.label)}`}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/30 cursor-pointer transition-all text-sm text-white/60 hover:text-white">
                  <span>{theme.icon}</span>
                  <span>{theme.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Sobre */}
        <section className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <div className="cosmic-card p-6 relative overflow-hidden">
            <div className="orb-2 opacity-20" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
                Sobre esta Plataforma
              </h3>
              <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: "'Crimson Pro', serif", fontSize: "1rem" }}>
                Esta plataforma integra os textos sagrados do Antigo e Novo Testamento com comentários
                inspirados na obra do Espírito Emmanuel (psicografada por Chico Xavier) e interpretações
                no estilo de Haroldo Dutra Dias — conectando a hermenêutica bíblica com os princípios
                da Doutrina Espírita codificada por Allan Kardec.
              </p>
              <p className="text-white/40 text-xs mt-3 italic">
                "A Doutrina Espírita não é uma religião, mas uma ciência que estuda os fenômenos morais e
                suas consequências." — Allan Kardec
              </p>
            </div>
          </div>
        </section>
      </div>
    </CosmicLayout>
  );
}
