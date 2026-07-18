import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CosmicLayout } from "@/components/CosmicLayout";
import { Loader2, BookOpen, Flame, ArrowLeft, ExternalLink, PenLine, Star } from "lucide-react";
import { Streamdown } from "streamdown";

const ESE_CHAPTERS = [
  { num: 1, title: "Não vim destruir a Lei", theme: "As três revelações: Moisés, Cristo, o Espiritismo", url: "Ev01.htm" },
  { num: 2, title: "Meu reino não é deste mundo", theme: "A vida futura; a realeza de Jesus; o ponto de vista", url: "Ev02.htm" },
  { num: 3, title: "Há muitas moradas na casa de meu Pai", theme: "Diferentes estados da alma na erraticidade; mundos transitórios", url: "Ev03.htm" },
  { num: 4, title: "Ninguém poderá ver o reino de Deus se não nascer de novo", theme: "Reencarnação; ressurreição da carne; o paraíso perdido", url: "Ev04.htm" },
  { num: 5, title: "Bem-aventurados os aflitos", theme: "Justiça das aflições; causas atuais e anteriores; suicídio", url: "Ev05a.htm" },
  { num: 6, title: "O Cristo consolador", theme: "O jugo leve; consolação; a suprema felicidade", url: "Ev06.htm" },
  { num: 7, title: "Bem-aventurados os pobres de Espírito", theme: "O orgulho e a humildade; missão do homem inteligente", url: "Ev07.htm" },
  { num: 8, title: "Bem-aventurados os que têm puro o coração", theme: "Simplicidade e pureza de coração; pecado pelo pensamento", url: "Ev08.htm" },
  { num: 9, title: "Bem-aventurados os que são brandos e pacíficos", theme: "Injúrias e violências; mansidão e paciência", url: "Ev09.htm" },
  { num: 10, title: "Bem-aventurados os que são misericordiosos", theme: "Perdoar aos inimigos; indulgência; benevolência", url: "Ev10.htm" },
  { num: 11, title: "Amar o próximo como a si mesmo", theme: "O maior mandamento; fazer aos outros o que queremos que nos façam", url: "Ev11.htm" },
  { num: 12, title: "Amai os vossos inimigos", theme: "Retribuir o mal com o bem; inimigos desencarnados", url: "Ev12.htm" },
  { num: 13, title: "Que vossa mão esquerda não saiba o que dê a direita", theme: "Fazer o bem sem ostentação; a caridade material e moral", url: "Ev13.htm" },
  { num: 14, title: "Honrai a vosso pai e a vossa mãe", theme: "Piedade filial; quem é minha mãe?; parentesco corporal e espiritual", url: "Ev14.htm" },
  { num: 15, title: "Fora da caridade não há salvação", theme: "O que é preciso para se salvar; parábola do bom samaritano", url: "Ev15.htm" },
  { num: 16, title: "Não se pode servir a Deus e a Mamon", theme: "Desapego dos bens terrenos; riqueza e miséria", url: "Ev16.htm" },
  { num: 17, title: "Sede perfeitos", theme: "Caracteres da perfeição; o homem de bem; os bons espíritas", url: "Ev17.htm" },
  { num: 18, title: "Muitos os chamados, poucos os escolhidos", theme: "Parábola do festim das bodas; a porta estreita", url: "Ev18.htm" },
  { num: 19, title: "A fé transporta montanhas", theme: "Poder da fé; fé divina; fé humana; parábola da figueira", url: "Ev19.htm" },
  { num: 20, title: "Os trabalhadores da última hora", theme: "Primeiros e últimos; missão dos espíritas", url: "Ev20.htm" },
  { num: 21, title: "Haverá falsos cristos e falsos profetas", theme: "A árvore se conhece pelo fruto; critério dos espíritos", url: "Ev21.htm" },
  { num: 22, title: "Não separeis o que Deus juntou", theme: "Indissolubilidade do casamento; divórcio", url: "Ev22.htm" },
  { num: 23, title: "Estranha moral", theme: "Odiar pai e mãe; abandonar pai e mãe; deixar os mortos", url: "Ev23.htm" },
  { num: 24, title: "Não ponhais a candeia debaixo do alqueire", theme: "Luz sob o alqueire; por que Jesus fala por parábolas", url: "Ev24.htm" },
  { num: 25, title: "Buscai e achareis", theme: "Ajuda-te e o céu te ajudará; olhai as aves do céu", url: "Ev25.htm" },
  { num: 26, title: "Dai gratuitamente o que gratuitamente recebestes", theme: "Dom de curar; preces pagas; médiuns e dinheiro", url: "Ev26.htm" },
  { num: 27, title: "Pedi e obtereis", theme: "Qualidades da prece; eficácia da prece; ação da prece", url: "Ev27.htm" },
  { num: 28, title: "Coletânea de preces espíritas", theme: "Preces gerais; por si mesmo; pelos outros; pelos mortos", url: "Ev28P1.htm" },
];

const BIBLIA_CAMINHO_BASE = "https://bibliadocaminho.com/ocaminho/TKP/Ev/";
const NEPE_ESE_BASE = "https://search.nepebrasil.org/book-part/?book=23&chapter=";

const NEPE_RESEARCH_LINKS = [
  {
    title: "Pesquisa na Bíblia",
    description: "Pesquise palavras e expressões em diferentes traduções bíblicas.",
    url: "https://search.nepebrasil.org/pesquisa-biblica?advanced_search_tab=1",
  },
  {
    title: "Obras Literárias",
    description: "Consulte livros espíritas por palavra, autor ou médium.",
    url: "https://search.nepebrasil.org/pesquisa-espirita?advanced_search_tab=2",
  },
  {
    title: "Temas",
    description: "Explore referências bíblicas e espíritas organizadas por assunto.",
    url: "https://search.nepebrasil.org/tema/",
  },
  {
    title: "Dicionários",
    description: "Consulte vocábulos bíblicos, espíritas, etimológicos e Strong.",
    url: "https://search.nepebrasil.org/pesquisa-dicionario",
  },
];

export default function EseStudy() {
  const { user } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [studiedChapters, setStudiedChapters] = useState<Set<number>>(new Set());

  const chapter = selectedChapter !== null ? ESE_CHAPTERS[selectedChapter] : null;

  const studyQuery = trpc.ai.eseStudy.useQuery(
    { chapterNum: chapter?.num ?? 0, chapterTitle: chapter?.title ?? "", chapterTheme: chapter?.theme ?? "" },
    { enabled: !!chapter, staleTime: Infinity, gcTime: 1000 * 60 * 60 }
  );

  const handleSelectChapter = (idx: number) => {
    setSelectedChapter(idx);
    setStudiedChapters(prev => { const next = new Set(Array.from(prev)); next.add(idx); return next; });
  };

  if (!selectedChapter && selectedChapter !== 0) {
    return (
      <CosmicLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <p className="font-cinzel text-xs tracking-[3px] uppercase text-cyan-300 mb-3">Estudo Aprofundado</p>
            <h1 className="font-cinzel text-3xl md:text-4xl font-bold text-white mb-3" style={{ textShadow: "0 0 26px rgba(154,107,255,.3)" }}>
              O Evangelho Segundo o Espiritismo
            </h1>
            <p className="text-lg text-indigo-200/80 font-serif italic">
              Allan Kardec — Paris, abril de 1864
            </p>
            <p className="text-indigo-300/60 mt-2 text-sm">
              Contendo a explicação das máximas morais do Cristo em concordância com o Espiritismo e suas aplicações às diversas circunstâncias da vida.
            </p>
          </div>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <h2 className="font-cinzel text-xs tracking-[1.5px] uppercase text-amber-300">Pesquisa complementar no NEPE Search</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {NEPE_RESEARCH_LINKS.map((link) => (
                <a
                  key={link.title}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-amber-400/40 hover:bg-white/[0.07] transition-all duration-200 no-underline"
                >
                  <ExternalLink className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                  <div>
                    <span className="font-cinzel text-sm font-semibold text-white group-hover:text-amber-100 block">{link.title}</span>
                    <span className="text-xs text-indigo-300/60 font-serif leading-relaxed">{link.description}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <div className="grid gap-3">
            {ESE_CHAPTERS.map((ch, idx) => (
              <button
                key={ch.num}
                onClick={() => handleSelectChapter(idx)}
                className="group w-full text-left flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:border-cyan-400/40 hover:bg-white/[0.07] transition-all duration-200"
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full grid place-items-center font-cinzel text-sm font-bold ${studiedChapters.has(idx) ? "bg-cyan-400 text-slate-900" : "bg-cyan-400/10 text-cyan-300"}`}>
                  {studiedChapters.has(idx) ? <Flame className="w-4 h-4" /> : ch.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-[15px] font-semibold text-white group-hover:text-cyan-100 transition-colors truncate">
                    {ch.title}
                  </p>
                  <p className="text-sm text-indigo-300/60 truncate mt-0.5">{ch.theme}</p>
                </div>
                {studiedChapters.has(idx) && (
                  <Flame className="w-4 h-4 text-amber-400 flex-shrink-0" style={{ filter: "drop-shadow(0 0 6px rgba(231,201,138,.6))" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </CosmicLayout>
    );
  }

  return (
    <CosmicLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => setSelectedChapter(null)}
          className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-100 font-cinzel text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar aos capítulos
        </button>

        {/* Chapter header */}
        <div className="mb-8">
          <p className="font-cinzel text-xs tracking-[2px] uppercase text-violet-400 mb-2">Capítulo {chapter!.num}</p>
          <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-2" style={{ textShadow: "0 0 22px rgba(125,227,255,.3)" }}>
            {chapter!.title}
          </h1>
          <p className="text-indigo-200/70 italic font-serif">{chapter!.theme}</p>
        </div>

        {/* External study sources */}
        <div className="grid gap-3 sm:grid-cols-2 mb-8">
          <a
            href={`${BIBLIA_CAMINHO_BASE}${chapter!.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-amber-400/50 hover:bg-white/[0.07] transition-all duration-200 no-underline"
          >
            <ExternalLink className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-cinzel text-sm font-semibold text-white block">Ler na Bíblia do Caminho</span>
              <span className="text-xs text-indigo-300/60 font-serif">Texto integral com referências cruzadas</span>
            </div>
          </a>

          <a
            href={`${NEPE_ESE_BASE}${chapter!.num}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-cyan-400/50 hover:bg-white/[0.07] transition-all duration-200 no-underline"
          >
            <ExternalLink className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
              <span className="font-cinzel text-sm font-semibold text-white block">Estudar no NEPE Search</span>
              <span className="text-xs text-indigo-300/60 font-serif">Capítulo completo, temas e referências relacionadas</span>
            </div>
          </a>
        </div>

        {/* Study content */}
        {studyQuery.isLoading && (
          <div className="flex items-center gap-3 text-indigo-300/60 py-12">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="font-serif">Gerando estudo filológico e devocional...</span>
          </div>
        )}

        {studyQuery.error && (
          <div className="p-4 rounded-xl border border-amber-400/40 bg-amber-400/5 text-amber-200 font-serif">
            Erro ao gerar estudo. Tente novamente.
          </div>
        )}

        {studyQuery.data && (
          <div className="space-y-6">
            {/* Passagem central */}
            <section>
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3 pb-2 border-b border-white/10">
                Passagem Central
              </h3>
              <blockquote className="border-l-3 border-amber-400 pl-5 py-2 bg-white/[0.03] rounded-r-xl italic text-lg text-indigo-100 font-serif leading-relaxed">
                {studyQuery.data.passagem}
              </blockquote>
              {studyQuery.data.referencia && (
                <p className="mt-2 font-cinzel text-xs text-amber-400 tracking-wide">{studyQuery.data.referencia}</p>
              )}
              {studyQuery.data.fonte && (
                studyQuery.data.fonte.verificado ? (
                  <a
                    href={studyQuery.data.fonte.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-300/90 hover:text-emerald-200 font-serif"
                  >
                    ✓ Verificado no texto-fonte (bibliadocaminho.com)
                  </a>
                ) : (
                  <p className="mt-2 text-[11px] text-amber-300/70 font-serif">
                    ⚠ Fonte não verificada — gerado sem confirmação em bibliadocaminho.com
                  </p>
                )
              )}
            </section>

            {/* Contexto */}
            <section>
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3 pb-2 border-b border-white/10">
                Contexto — O que Kardec desenvolve
              </h3>
              <div className="text-indigo-100/90 font-serif leading-relaxed">
                <Streamdown>{studyQuery.data.contexto}</Streamdown>
              </div>
            </section>

            {/* Leitura filológica */}
            <section>
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3 pb-2 border-b border-white/10">
                Leitura Filológica
              </h3>
              <div className="text-indigo-100/90 font-serif leading-relaxed">
                <Streamdown>{studyQuery.data.filologia}</Streamdown>
              </div>
            </section>

            {/* Reflexão devocional */}
            <section>
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3 pb-2 border-b border-white/10">
                Reflexão Devocional
              </h3>
              <div className="text-indigo-100/90 font-serif leading-relaxed">
                <Streamdown>{studyQuery.data.reflexao}</Streamdown>
              </div>
            </section>

            {/* Correlações AT */}
            {studyQuery.data.correlacoes && studyQuery.data.correlacoes.length > 0 && (
              <section>
                <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3 pb-2 border-b border-white/10">
                  Correlações com o Antigo Testamento
                </h3>
                <div className="space-y-3">
                  {studyQuery.data.correlacoes.map((corr: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                      <p className="font-cinzel text-xs font-bold text-amber-400 tracking-wide uppercase mb-2">{corr.referencia}</p>
                      <p className="italic text-indigo-100 font-serif text-lg mb-2">"{corr.texto}"</p>
                      <p className="text-indigo-300/70 text-sm font-serif">{corr.ligacao}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Meditação no lar */}
            <section className="p-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.03]">
              <h3 className="font-cinzel text-xs tracking-[1.4px] uppercase text-cyan-300 mb-3">
                Meditação no Lar
              </h3>
              <div className="text-indigo-100/90 font-serif leading-relaxed">
                <Streamdown>{studyQuery.data.meditacao}</Streamdown>
              </div>
            </section>
          </div>
        )}
      </div>
    </CosmicLayout>
  );
}
