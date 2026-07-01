import axios from "axios";
import * as cheerio from "cheerio";
import { getBibliaCaminhoSource, saveBibliaCaminhoSource } from "../db";

/**
 * Serviço de scraping ANCORADO (grounded) para o site bibliadocaminho.com.
 *
 * Diferença crucial em relação a "abrir páginas genéricas":
 * NÃO fazemos busca (search) no site nem seguimos links de navegação.
 * Cada capítulo do ESE tem uma URL exata e conhecida (mapa abaixo), então
 * buscamos diretamente essa URL, uma única vez, e extraímos só o texto
 * do capítulo — descartando menu, rodapé, links de idioma etc.
 *
 * O texto limpo resultante é salvo em cache (tabela biblia_caminho_source)
 * e reaproveitado nas próximas gerações, então o site só é acessado 1x
 * por capítulo (e novamente só se você limpar o cache).
 */

const BASE_URL = "https://bibliadocaminho.com/ocaminho/TKP/Ev";

// Mapa oficial capítulo -> slug de URL (extraído de pesquisa-biblia-caminho.md)
export const ESE_CHAPTER_URL_MAP: Record<number, string> = {
  1: "Ev01.htm",
  2: "Ev02.htm",
  3: "Ev03.htm",
  4: "Ev04.htm",
  5: "Ev05a.htm",
  6: "Ev06.htm",
  7: "Ev07.htm",
  8: "Ev08.htm",
  9: "Ev09.htm",
  10: "Ev10.htm",
  11: "Ev11.htm",
  12: "Ev12.htm",
  13: "Ev13.htm",
  14: "Ev14.htm",
  15: "Ev15.htm",
  16: "Ev16.htm",
  17: "Ev17.htm",
  18: "Ev18.htm",
  19: "Ev19.htm",
  20: "Ev20.htm",
  21: "Ev21.htm",
  22: "Ev22.htm",
  23: "Ev23.htm",
  24: "Ev24.htm",
  25: "Ev25.htm",
  26: "Ev26.htm",
  27: "Ev27.htm",
  28: "Ev28P1.htm",
};

// Linhas de navegação/rodapé conhecidas que devem ser descartadas do texto.
// Comparação feita em minúsculas e sem acento após normalização simples.
const BOILERPLATE_PATTERNS: RegExp[] = [
  /^índice\s*\|?\s*princípio\s*\|?\s*continuar/i,
  /^idioma\s+franc[eê]s/i,
  /^tema\s+principal$/i,
  /^abrir$/i,
  /^topo$/i,
  /^jesus\s+kardec\s+chicoxavier\s+temas/i,
  /^(d|w|▲)$/i,
];

function isBoilerplate(line: string): boolean {
  const clean = line.trim();
  if (!clean) return true;
  return BOILERPLATE_PATTERNS.some((re) => re.test(clean));
}

export interface ScrapedChapter {
  sourceUrl: string;
  pageTitle: string;
  cleanedText: string;
}

/**
 * Faz o fetch da URL exata do capítulo e devolve texto limpo, sem cache.
 * Use fetchEseChapterSource() para a versão com cache (recomendada).
 */
async function scrapeEseChapter(chapterNum: number): Promise<ScrapedChapter> {
  const slug = ESE_CHAPTER_URL_MAP[chapterNum];
  if (!slug) {
    throw new Error(`Capítulo ${chapterNum} não mapeado em ESE_CHAPTER_URL_MAP`);
  }
  const sourceUrl = `${BASE_URL}/${slug}`;

  const { data: html } = await axios.get<string>(sourceUrl, {
    timeout: 15000,
    headers: {
      // Alguns sites antigos bloqueiam requisições sem User-Agent de navegador
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const $ = cheerio.load(html);

  // Remove elementos que nunca fazem parte do conteúdo do capítulo
  $("script, style, nav, header, footer").remove();

  const pageTitle = $("title").first().text().trim() || `Capítulo ${chapterNum}`;

  // "Desembrulha" todos os links: mantém o texto, descarta o href.
  // Isso preserva numeração de itens/versículos (ex: "17.") sem trazer
  // links de navegação como destino de clique.
  $("a").each((_: number, el: any) => {
    const $el = $(el);
    $el.replaceWith($el.text());
  });

  // Extrai blocos de texto candidatos (cabeçalhos, parágrafos, citações, listas)
  const blocks: string[] = [];
  $("h1, h2, h3, h4, h5, h6, p, blockquote, li")
    .each((_: number, el: any) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text) blocks.push(text);
    });

  // Fallback: se a página não usa essas tags (estrutura muito simples),
  // usa o texto puro do body inteiro.
  const rawBlocks = blocks.length > 0 ? blocks : [$("body").text().replace(/\s+/g, " ").trim()];

  const cleanedText = rawBlocks
    .filter((line) => !isBoilerplate(line))
    // remove duplicatas consecutivas (comum quando heading e blockquote se sobrepõem)
    .filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1])
    .join("\n\n")
    .trim();

  return { sourceUrl, pageTitle, cleanedText };
}

/**
 * Versão com cache: busca no banco primeiro; só acessa o site se não
 * houver registro salvo. Retorna null se o scraping falhar (site fora do
 * ar, mudança de layout, rede indisponível) para que o chamador decida
 * um fallback — nunca lança para não derrubar a geração do estudo.
 */
export async function fetchEseChapterSource(chapterNum: number): Promise<ScrapedChapter | null> {
  const sourceKey = `ese-${String(chapterNum).padStart(2, "0")}`;

  const cached = await getBibliaCaminhoSource(sourceKey);
  if (cached) {
    return {
      sourceUrl: cached.sourceUrl,
      pageTitle: cached.pageTitle ?? "",
      cleanedText: cached.cleanedText,
    };
  }

  try {
    const scraped = await scrapeEseChapter(chapterNum);
    if (!scraped.cleanedText || scraped.cleanedText.length < 100) {
      // Extração vazia/curta demais provavelmente indica que os seletores
      // precisam de ajuste para o layout real do site — não salva no cache.
      console.warn(
        `[bibliaCaminhoScraper] Texto extraído do capítulo ${chapterNum} parece incompleto (${scraped.cleanedText.length} chars).`
      );
      return scraped.cleanedText ? scraped : null;
    }
    await saveBibliaCaminhoSource({
      sourceKey,
      sourceUrl: scraped.sourceUrl,
      pageTitle: scraped.pageTitle,
      cleanedText: scraped.cleanedText,
    });
    return scraped;
  } catch (error) {
    console.error(`[bibliaCaminhoScraper] Falha ao buscar capítulo ${chapterNum}:`, error);
    return null;
  }
}
