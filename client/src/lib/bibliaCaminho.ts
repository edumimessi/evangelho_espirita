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
  // Novo Testamento
  mt: "Mt", mc: "Mc", lc: "Lc", jo: "Jo", at: "At",
  rm: "Rm", "1co": "1Co", "2co": "2Co", gl: "Gl", ef: "Ef",
  fp: "Fp", cl: "Cl", "1ts": "1Ts", "2ts": "2Ts", "1tm": "1Tm",
  "2tm": "2Tm", tt: "Tt", fm: "Fm", hb: "Hb", tg: "Tg",
  "1pe": "1Pe", "2pe": "2Pe", "1jo": "1Jo", "2jo": "2Jo", "3jo": "3Jo",
  jd: "Jd", ap: "Ap",
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
