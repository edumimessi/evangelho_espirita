// Monta links DIRECIONADOS para o site bibliadocaminho.com.
//
// A busca no site NÃO deve ser genérica (índice/home): cada versículo tem uma
// URL exata. O padrão (documentado em pesquisa-biblia-caminho.md) é:
//   https://bibliadocaminho.com/ocaminho/TRP/{Livro}/{Livro}{Cap}.htm#V{Versiculo}
// Ex.: Mateus 5:17 -> .../TRP/Mt/Mt05.htm#V17
//
// O capítulo é preenchido com no mínimo 2 dígitos (Mt05, Sl119).

const TRP_BASE = "https://bibliadocaminho.com/ocaminho/TRP";

// Índice do ESE — usado só como fallback quando não há mapeamento do livro.
export const BIBLIA_CAMINHO_INDEX =
  "https://bibliadocaminho.com/ocaminho/TKP/Ev/EvIndex.htm";

// Abreviação interna (seed) -> abreviação/pasta usada pela Bíblia do Caminho.
const BOOK_ABBREV_MAP: Record<string, string> = {
  // Antigo Testamento
  gn: "Gn", ex: "Ex", lv: "Lv", nm: "Nm", dt: "Dt",
  js: "Js", jz: "Jz", rt: "Rt", "1sm": "1Sm", "2sm": "2Sm",
  "1rs": "1Rs", "2rs": "2Rs", "1cr": "1Cr", "2cr": "2Cr", ed: "Ed",
  ne: "Ne", et: "Et", jo2: "Jó", sl: "Sl", pv: "Pv",
  ec: "Ec", ct: "Ct", is: "Is", jr: "Jr", lm: "Lm",
  ez: "Ez", dn: "Dn", os: "Os", jl: "Jl", am: "Am",
  ob: "Ob", jn: "Jn", mq: "Mq", na: "Na", hc: "Hc",
  sf: "Sf", ag: "Ag", zc: "Zc", ml: "Ml",
  // Novo Testamento — abreviações verificadas com HTTP 200 em 2026-07-01
  mt: "Mt",      // Mateus
  mc: "Mc",      // Marcos
  lc: "Lc",      // Lucas
  jo: "Jo",      // João
  at: "At",      // Atos
  rm: "Rom",     // Romanos (pasta: Rom, não Rm)
  "1co": "1Cor", // 1 Coríntios (pasta: 1Cor)
  "2co": "2Cor", // 2 Coríntios (pasta: 2Cor)
  gl: "Gal",     // Gálatas (pasta: Gal)
  ef: "Ef",      // Efésios
  fp: "Flp",     // Filipenses (pasta: Flp)
  cl: "Col",     // Colossenses (pasta: Col)
  "1ts": "1Tes", // 1 Tessalonicenses (pasta: 1Tes)
  "2ts": "2Tes", // 2 Tessalonicenses (pasta: 2Tes)
  "1tm": "1Tim", // 1 Timóteo (pasta: 1Tim)
  "2tm": "2Tim", // 2 Timóteo (pasta: 2Tim)
  tt: "Tt",      // Tito
  hb: "Heb",     // Hebreus (pasta: Heb)
  tg: "Tg",      // Tiago
  "1pe": "1Pe",  // 1 Pedro
  "2pe": "2Pe",  // 2 Pedro
  "1jo": "1Jo",  // 1 João
  // Sem cobertura TRP verificada: fm, 2jo, 3jo, jd, ap → usam fallback
};

/**
 * URL direta para um versículo específico na Bíblia do Caminho.
 * Retorna a URL do índice (fallback) se o livro não estiver mapeado, para
 * nunca gerar um link quebrado.
 */
export function bibliaCaminhoVerseUrl(
  bookAbbrev: string | undefined,
  chapter: number | undefined,
  verse?: number
): string {
  const abbrev = bookAbbrev ? BOOK_ABBREV_MAP[bookAbbrev.toLowerCase()] : undefined;
  if (!abbrev || !chapter) return BIBLIA_CAMINHO_INDEX;

  const chap = String(chapter).padStart(2, "0");
  const anchor = verse ? `#V${verse}` : "";
  return `${TRP_BASE}/${abbrev}/${abbrev}${chap}.htm${anchor}`;
}
