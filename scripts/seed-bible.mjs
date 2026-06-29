import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_URL = process.env.DATABASE_URL;
const connection = await mysql.createConnection(DB_URL);
const BASE_URL = "https://bible.helloao.org/api/por_blj";

// Mapeamento: abbrev local -> ID da API helloao
const bookApiIds = {
  "gn":"GEN","ex":"EXO","lv":"LEV","nm":"NUM","dt":"DEU","js":"JOS","jz":"JDG",
  "rt":"RUT","1sm":"1SA","2sm":"2SA","1rs":"1KI","2rs":"2KI","1cr":"1CH","2cr":"2CH",
  "ed":"EZR","ne":"NEH","et":"EST","jo2":"JOB","sl":"PSA","pv":"PRO","ec":"ECC",
  "ct":"SNG","is":"ISA","jr":"JER","lm":"LAM","ez":"EZK","dn":"DAN","os":"HOS",
  "jl":"JOL","am":"AMO","ob":"OBA","jn":"JON","mq":"MIC","na":"NAM","hc":"HAB",
  "sf":"ZEP","ag":"HAG","zc":"ZEC","ml":"MAL",
  "mt":"MAT","mc":"MRK","lc":"LUK","jo":"JHN","at":"ACT","rm":"ROM","1co":"1CO",
  "2co":"2CO","gl":"GAL","ef":"EPH","fp":"PHP","cl":"COL","1ts":"1TH","2ts":"2TH",
  "1tm":"1TI","2tm":"2TI","tt":"TIT","fm":"PHM","hb":"HEB","tg":"JAS","1pe":"1PE",
  "2pe":"2PE","1jo":"1JN","2jo":"2JN","3jo":"3JN","jd":"JUD","ap":"REV"
};

const bibleBooks = [
  { abbrev: "gn", name: "Gênesis", testament: "old", order: 1, author: "Moisés", genre: "Pentateuco", chapterCount: 50 },
  { abbrev: "ex", name: "Êxodo", testament: "old", order: 2, author: "Moisés", genre: "Pentateuco", chapterCount: 40 },
  { abbrev: "lv", name: "Levítico", testament: "old", order: 3, author: "Moisés", genre: "Pentateuco", chapterCount: 27 },
  { abbrev: "nm", name: "Números", testament: "old", order: 4, author: "Moisés", genre: "Pentateuco", chapterCount: 36 },
  { abbrev: "dt", name: "Deuteronômio", testament: "old", order: 5, author: "Moisés", genre: "Pentateuco", chapterCount: 34 },
  { abbrev: "js", name: "Josué", testament: "old", order: 6, author: "Josué", genre: "Histórico", chapterCount: 24 },
  { abbrev: "jz", name: "Juízes", testament: "old", order: 7, author: "Samuel", genre: "Histórico", chapterCount: 21 },
  { abbrev: "rt", name: "Rute", testament: "old", order: 8, author: "Samuel", genre: "Histórico", chapterCount: 4 },
  { abbrev: "1sm", name: "1 Samuel", testament: "old", order: 9, author: "Samuel", genre: "Histórico", chapterCount: 31 },
  { abbrev: "2sm", name: "2 Samuel", testament: "old", order: 10, author: "Samuel", genre: "Histórico", chapterCount: 24 },
  { abbrev: "1rs", name: "1 Reis", testament: "old", order: 11, author: "Jeremias", genre: "Histórico", chapterCount: 22 },
  { abbrev: "2rs", name: "2 Reis", testament: "old", order: 12, author: "Jeremias", genre: "Histórico", chapterCount: 25 },
  { abbrev: "1cr", name: "1 Crônicas", testament: "old", order: 13, author: "Esdras", genre: "Histórico", chapterCount: 29 },
  { abbrev: "2cr", name: "2 Crônicas", testament: "old", order: 14, author: "Esdras", genre: "Histórico", chapterCount: 36 },
  { abbrev: "ed", name: "Esdras", testament: "old", order: 15, author: "Esdras", genre: "Histórico", chapterCount: 10 },
  { abbrev: "ne", name: "Neemias", testament: "old", order: 16, author: "Neemias", genre: "Histórico", chapterCount: 13 },
  { abbrev: "et", name: "Ester", testament: "old", order: 17, author: "Mardoqueu", genre: "Histórico", chapterCount: 10 },
  { abbrev: "jo2", name: "Jó", testament: "old", order: 18, author: "Moisés", genre: "Poético", chapterCount: 42 },
  { abbrev: "sl", name: "Salmos", testament: "old", order: 19, author: "Davi e outros", genre: "Poético", chapterCount: 150 },
  { abbrev: "pv", name: "Provérbios", testament: "old", order: 20, author: "Salomão", genre: "Poético", chapterCount: 31 },
  { abbrev: "ec", name: "Eclesiastes", testament: "old", order: 21, author: "Salomão", genre: "Poético", chapterCount: 12 },
  { abbrev: "ct", name: "Cânticos", testament: "old", order: 22, author: "Salomão", genre: "Poético", chapterCount: 8 },
  { abbrev: "is", name: "Isaías", testament: "old", order: 23, author: "Isaías", genre: "Profético", chapterCount: 66 },
  { abbrev: "jr", name: "Jeremias", testament: "old", order: 24, author: "Jeremias", genre: "Profético", chapterCount: 52 },
  { abbrev: "lm", name: "Lamentações", testament: "old", order: 25, author: "Jeremias", genre: "Profético", chapterCount: 5 },
  { abbrev: "ez", name: "Ezequiel", testament: "old", order: 26, author: "Ezequiel", genre: "Profético", chapterCount: 48 },
  { abbrev: "dn", name: "Daniel", testament: "old", order: 27, author: "Daniel", genre: "Profético", chapterCount: 12 },
  { abbrev: "os", name: "Oséias", testament: "old", order: 28, author: "Oséias", genre: "Profético", chapterCount: 14 },
  { abbrev: "jl", name: "Joel", testament: "old", order: 29, author: "Joel", genre: "Profético", chapterCount: 3 },
  { abbrev: "am", name: "Amós", testament: "old", order: 30, author: "Amós", genre: "Profético", chapterCount: 9 },
  { abbrev: "ob", name: "Obadias", testament: "old", order: 31, author: "Obadias", genre: "Profético", chapterCount: 1 },
  { abbrev: "jn", name: "Jonas", testament: "old", order: 32, author: "Jonas", genre: "Profético", chapterCount: 4 },
  { abbrev: "mq", name: "Miquéias", testament: "old", order: 33, author: "Miquéias", genre: "Profético", chapterCount: 7 },
  { abbrev: "na", name: "Naum", testament: "old", order: 34, author: "Naum", genre: "Profético", chapterCount: 3 },
  { abbrev: "hc", name: "Habacuque", testament: "old", order: 35, author: "Habacuque", genre: "Profético", chapterCount: 3 },
  { abbrev: "sf", name: "Sofonias", testament: "old", order: 36, author: "Sofonias", genre: "Profético", chapterCount: 3 },
  { abbrev: "ag", name: "Ageu", testament: "old", order: 37, author: "Ageu", genre: "Profético", chapterCount: 2 },
  { abbrev: "zc", name: "Zacarias", testament: "old", order: 38, author: "Zacarias", genre: "Profético", chapterCount: 14 },
  { abbrev: "ml", name: "Malaquias", testament: "old", order: 39, author: "Malaquias", genre: "Profético", chapterCount: 4 },
  { abbrev: "mt", name: "Mateus", testament: "new", order: 40, author: "Mateus", genre: "Evangelho", chapterCount: 28 },
  { abbrev: "mc", name: "Marcos", testament: "new", order: 41, author: "Marcos", genre: "Evangelho", chapterCount: 16 },
  { abbrev: "lc", name: "Lucas", testament: "new", order: 42, author: "Lucas", genre: "Evangelho", chapterCount: 24 },
  { abbrev: "jo", name: "João", testament: "new", order: 43, author: "João", genre: "Evangelho", chapterCount: 21 },
  { abbrev: "at", name: "Atos", testament: "new", order: 44, author: "Lucas", genre: "Histórico", chapterCount: 28 },
  { abbrev: "rm", name: "Romanos", testament: "new", order: 45, author: "Paulo", genre: "Epístola", chapterCount: 16 },
  { abbrev: "1co", name: "1 Coríntios", testament: "new", order: 46, author: "Paulo", genre: "Epístola", chapterCount: 16 },
  { abbrev: "2co", name: "2 Coríntios", testament: "new", order: 47, author: "Paulo", genre: "Epístola", chapterCount: 13 },
  { abbrev: "gl", name: "Gálatas", testament: "new", order: 48, author: "Paulo", genre: "Epístola", chapterCount: 6 },
  { abbrev: "ef", name: "Efésios", testament: "new", order: 49, author: "Paulo", genre: "Epístola", chapterCount: 6 },
  { abbrev: "fp", name: "Filipenses", testament: "new", order: 50, author: "Paulo", genre: "Epístola", chapterCount: 4 },
  { abbrev: "cl", name: "Colossenses", testament: "new", order: 51, author: "Paulo", genre: "Epístola", chapterCount: 4 },
  { abbrev: "1ts", name: "1 Tessalonicenses", testament: "new", order: 52, author: "Paulo", genre: "Epístola", chapterCount: 5 },
  { abbrev: "2ts", name: "2 Tessalonicenses", testament: "new", order: 53, author: "Paulo", genre: "Epístola", chapterCount: 3 },
  { abbrev: "1tm", name: "1 Timóteo", testament: "new", order: 54, author: "Paulo", genre: "Epístola", chapterCount: 6 },
  { abbrev: "2tm", name: "2 Timóteo", testament: "new", order: 55, author: "Paulo", genre: "Epístola", chapterCount: 4 },
  { abbrev: "tt", name: "Tito", testament: "new", order: 56, author: "Paulo", genre: "Epístola", chapterCount: 3 },
  { abbrev: "fm", name: "Filemom", testament: "new", order: 57, author: "Paulo", genre: "Epístola", chapterCount: 1 },
  { abbrev: "hb", name: "Hebreus", testament: "new", order: 58, author: "Paulo", genre: "Epístola", chapterCount: 13 },
  { abbrev: "tg", name: "Tiago", testament: "new", order: 59, author: "Tiago", genre: "Epístola", chapterCount: 5 },
  { abbrev: "1pe", name: "1 Pedro", testament: "new", order: 60, author: "Pedro", genre: "Epístola", chapterCount: 5 },
  { abbrev: "2pe", name: "2 Pedro", testament: "new", order: 61, author: "Pedro", genre: "Epístola", chapterCount: 3 },
  { abbrev: "1jo", name: "1 João", testament: "new", order: 62, author: "João", genre: "Epístola", chapterCount: 5 },
  { abbrev: "2jo", name: "2 João", testament: "new", order: 63, author: "João", genre: "Epístola", chapterCount: 1 },
  { abbrev: "3jo", name: "3 João", testament: "new", order: 64, author: "João", genre: "Epístola", chapterCount: 1 },
  { abbrev: "jd", name: "Judas", testament: "new", order: 65, author: "Judas", genre: "Epístola", chapterCount: 1 },
  { abbrev: "ap", name: "Apocalipse", testament: "new", order: 66, author: "João", genre: "Profético", chapterCount: 22 },
];

console.log("🌟 Inserindo livros da Bíblia...");
await connection.execute("DELETE FROM bible_books");

const bookIds = {};
for (const book of bibleBooks) {
  const [result] = await connection.execute(
    `INSERT INTO bible_books (abbrev, name, testament, \`order\`, author, genre, chapterCount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [book.abbrev, book.name, book.testament, book.order, book.author, book.genre, book.chapterCount]
  );
  bookIds[book.abbrev] = result.insertId;
}
console.log(`✅ ${bibleBooks.length} livros inseridos`);

// Buscar versículos
console.log("📖 Buscando versículos da API bible.helloao.org...");
let totalVerses = 0;
await connection.execute("DELETE FROM bible_verses");

for (const book of bibleBooks) {
  const apiId = bookApiIds[book.abbrev];
  if (!apiId) {
    console.warn(`⚠️  Sem mapeamento para: ${book.abbrev}`);
    continue;
  }
  const bookId = bookIds[book.abbrev];
  
  for (let chapter = 1; chapter <= book.chapterCount; chapter++) {
    try {
      const url = `${BASE_URL}/${apiId}/${chapter}.json`;
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      
      if (!response.ok) {
        process.stdout.write(`\n⚠️  ${book.name} ${chapter}: HTTP ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const content = data?.chapter?.content || [];
      
      // Filtrar apenas versículos (type === 'verse')
      const verses = content.filter(item => item.type === 'verse');
      
      for (const v of verses) {
        const text = Array.isArray(v.content) 
          ? v.content.filter(c => typeof c === 'string').join(' ')
          : String(v.content);
        
        if (text.trim()) {
          await connection.execute(
            `INSERT INTO bible_verses (bookId, bookAbbrev, chapter, verse, text, version) VALUES (?, ?, ?, ?, ?, ?)`,
            [bookId, book.abbrev, chapter, v.number, text.trim(), "blj"]
          );
          totalVerses++;
        }
      }
      
      process.stdout.write(`\r📖 ${book.name} ${chapter}/${book.chapterCount} | Total: ${totalVerses}    `);
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      process.stdout.write(`\n❌ ${book.name} ${chapter}: ${err.message}`);
    }
  }
  console.log(`\n✅ ${book.name} (${book.chapterCount} cap.)`);
}

console.log(`\n🎉 Total: ${totalVerses} versículos inseridos`);

// Leituras diárias
console.log("📅 Criando leituras diárias...");
const dailyPlan = [
  { abbrev: "mt", name: "Mateus", chapter: 5, start: 1, end: 12, theme: "As Bem-aventuranças" },
  { abbrev: "mt", name: "Mateus", chapter: 5, start: 13, end: 26, theme: "Sal da Terra e Luz do Mundo" },
  { abbrev: "mt", name: "Mateus", chapter: 6, start: 1, end: 15, theme: "O Pai Nosso" },
  { abbrev: "mt", name: "Mateus", chapter: 6, start: 19, end: 34, theme: "Não vos preocupeis" },
  { abbrev: "mt", name: "Mateus", chapter: 7, start: 1, end: 12, theme: "Não julgueis" },
  { abbrev: "jo", name: "João", chapter: 1, start: 1, end: 18, theme: "O Verbo se fez carne" },
  { abbrev: "jo", name: "João", chapter: 3, start: 1, end: 21, theme: "Nascer de novo" },
  { abbrev: "jo", name: "João", chapter: 14, start: 1, end: 14, theme: "Mansões do Pai" },
  { abbrev: "lc", name: "Lucas", chapter: 15, start: 11, end: 32, theme: "O Filho Pródigo" },
  { abbrev: "lc", name: "Lucas", chapter: 10, start: 25, end: 37, theme: "O Bom Samaritano" },
  { abbrev: "sl", name: "Salmos", chapter: 23, start: 1, end: 6, theme: "O Senhor é meu Pastor" },
  { abbrev: "sl", name: "Salmos", chapter: 91, start: 1, end: 16, theme: "Proteção Divina" },
  { abbrev: "is", name: "Isaías", chapter: 53, start: 1, end: 12, theme: "O Servo Sofredor" },
  { abbrev: "rm", name: "Romanos", chapter: 8, start: 1, end: 17, theme: "Vida no Espírito" },
  { abbrev: "1co", name: "1 Coríntios", chapter: 13, start: 1, end: 13, theme: "O Hino ao Amor" },
  { abbrev: "ef", name: "Efésios", chapter: 6, start: 10, end: 20, theme: "A Armadura de Deus" },
  { abbrev: "gn", name: "Gênesis", chapter: 1, start: 1, end: 31, theme: "A Criação" },
  { abbrev: "gn", name: "Gênesis", chapter: 2, start: 1, end: 25, theme: "O Jardim do Éden" },
  { abbrev: "jo", name: "João", chapter: 8, start: 1, end: 11, theme: "A Mulher Adúltera" },
  { abbrev: "mt", name: "Mateus", chapter: 25, start: 31, end: 46, theme: "O Juízo Final" },
  { abbrev: "lc", name: "Lucas", chapter: 24, start: 1, end: 35, theme: "A Ressurreição" },
  { abbrev: "jo", name: "João", chapter: 20, start: 1, end: 31, theme: "Tomé e a Fé" },
  { abbrev: "at", name: "Atos", chapter: 2, start: 1, end: 21, theme: "Pentecostes" },
  { abbrev: "ap", name: "Apocalipse", chapter: 21, start: 1, end: 27, theme: "A Nova Jerusalém" },
  { abbrev: "pv", name: "Provérbios", chapter: 3, start: 1, end: 18, theme: "Confia no Senhor" },
  { abbrev: "ec", name: "Eclesiastes", chapter: 3, start: 1, end: 15, theme: "Tudo tem seu tempo" },
  { abbrev: "is", name: "Isaías", chapter: 40, start: 1, end: 31, theme: "Consolação de Israel" },
  { abbrev: "jr", name: "Jeremias", chapter: 29, start: 10, end: 14, theme: "Planos de prosperidade" },
  { abbrev: "mt", name: "Mateus", chapter: 13, start: 1, end: 23, theme: "Parábola do Semeador" },
  { abbrev: "lc", name: "Lucas", chapter: 6, start: 20, end: 49, theme: "Sermão da Planície" },
];

const today = new Date();
await connection.execute("DELETE FROM daily_readings");
for (let i = 0; i < 365; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  const dateStr = date.toISOString().split("T")[0];
  const reading = dailyPlan[i % dailyPlan.length];
  await connection.execute(
    `INSERT IGNORE INTO daily_readings (date, bookAbbrev, bookName, chapter, verseStart, verseEnd, theme) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [dateStr, reading.abbrev, reading.name, reading.chapter, reading.start, reading.end, reading.theme]
  );
}
console.log("✅ 365 leituras diárias criadas");

await connection.end();
console.log("🎉 Seed concluído!");
