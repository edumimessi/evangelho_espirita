import { trpc } from "@/lib/trpc";
import { Loader2, BookOpen, Heart, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { CosmicLayout } from "@/components/CosmicLayout";

export default function Devocional() {
  const { data, isLoading, error } = trpc.devocional.today.useQuery();

  if (isLoading) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-slate-400 text-sm">Preparando seu devocional do dia...</p>
          </div>
        </div>
      </CosmicLayout>
    );
  }

  if (error || !data) {
    return (
      <CosmicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-slate-400">Devocional não disponível hoje. Tente novamente mais tarde.</p>
        </div>
      </CosmicLayout>
    );
  }

  return (
    <CosmicLayout>
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs uppercase tracking-wider">
          <Sparkles className="w-3 h-3" />
          Devocional do Dia
        </div>
        <p className="text-slate-500 text-sm">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Versículo */}
      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-full" />
        <div className="pl-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
            <BookOpen className="w-4 h-4" />
            {data.reference}
          </div>
          <blockquote className="text-xl md:text-2xl font-serif text-slate-100 leading-relaxed italic">
            "{data.verseText}"
          </blockquote>
        </div>
      </div>

      {/* Reflexão */}
      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-slate-400 font-medium">
          Reflexão
        </h2>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-slate-200 leading-relaxed">
          <Streamdown>{data.reflexao}</Streamdown>
        </div>
      </div>

      {/* Oração */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <h2 className="text-sm uppercase tracking-wider text-slate-400 font-medium">
            Oração
          </h2>
        </div>
        <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-xl p-6 text-slate-200 leading-relaxed italic">
          <Streamdown>{data.oracao}</Streamdown>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-slate-600">
          Baseado na Doutrina Espírita e no estilo de Emmanuel
        </p>
      </div>
    </div>
    </CosmicLayout>
  );
}
