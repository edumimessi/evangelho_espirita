# Evangelho Espírita - TODO

## Banco de Dados e Backend
- [x] Schema: tabelas bible_books, bible_verses, emmanuel_comments, reading_history, daily_reading
- [x] Popular banco com livros do AT e NT (66 livros)
- [x] Popular banco com versículos (31.082 versículos — Bíblia completa)
- [x] Popular banco com comentários de Emmanuel por trecho (via IA contextual)
- [x] Router: busca por livro/capítulo/versículo
- [x] Router: busca por palavras-chave
- [x] Router: busca por temas espíritas
- [x] Router: leitura diária (trecho do dia — 365 leituras)
- [x] Router: histórico de leituras por usuário
- [x] Router: geração IA de interpretação estilo Haroldo Dutra Dias
- [x] Router: correlações AT/NT para cada passagem

## Interface Visual Cósmica
- [x] Fundo gradiente azul meia-noite e violeta
- [x] Animação de estrelas espalhadas (canvas CSS)
- [x] Brilhos de nebulosas e lens flares sutis
- [x] Orbes planetários minimalistas
- [x] Tipografia bold sans-serif com brilho ciano (Cinzel + Crimson Pro)
- [x] Layout responsivo (mobile + desktop)
- [x] Tema escuro imersivo

## Páginas
- [x] Home: apresentação, leitura diária em destaque, acesso rápido
- [x] Leitor Bíblico: navegação por livro/capítulo/versículo com comentários
- [x] Leitura Diária: trecho do dia com meditação e interpretação IA
- [x] Busca: busca por texto, palavras-chave e temas espíritas
- [x] Histórico: lista de leituras do usuário com data e trecho

## Funcionalidades Integradas
- [x] Comentários de Emmanuel vinculados contextualmente aos versículos
- [x] Interpretação IA estilo Haroldo Dutra Dias (geração completa)
- [x] Correlações AT/NT destacadas visualmente
- [x] Registro automático de leitura no histórico ao acessar trecho
- [x] Navegação entre livros/capítulos com breadcrumb
- [x] Sistema de autenticação (login Manus OAuth)

## Testes
- [x] Testes vitest para routers principais (12 testes passando)
- [x] Verificação responsividade mobile

## Novas Funcionalidades (rodada 2)

- [x] Schema: tabela verse_notes (anotações pessoais por versículo)
- [x] Schema: tabela verse_favorites (favoritos por versículo)
- [x] Router tRPC: notes.save, notes.get, notes.delete
- [x] Router tRPC: favorites.toggle, favorites.list
- [x] BibleReader: botão de anotação por versículo com modal de edição
- [x] BibleReader: botão de favorito (estrela) por versículo
- [x] Página Favoritos: lista de versículos favoritados com acesso rápido
- [x] Página Evangelho no Lar: layout especial para reunião em grupo
- [x] Sidebar: adicionar links para Favoritos e Evangelho no Lar

## Rodada 4 - Diário Espiritual e Temas Aprofundados

- [x] Schema: tabela gospel_meeting_notes (anotações do Evangelho no Lar por data)
- [x] Router tRPC: meetingNotes.save, meetingNotes.get, meetingNotes.list
- [x] Evangelho no Lar: campo de anotação na etapa Meditação com salvamento automático
- [x] Página Diário Espiritual: histórico de reuniões com anotações por data
- [x] Sidebar: adicionar link para Diário Espiritual
- [x] Busca: expandir temas espíritas com subtemas detalhados (15 temas, 60 subtemas)
- [x] Busca: exibir versículos mais relevantes por subtema com interpretação

## Rodada 5 - Devocional Diário (estilo Café com Deus Pai espírita)

- [x] Router tRPC: devocional.getToday (gera versículo + reflexão + oração via IA)
- [x] Página Devocional Diário: layout imersivo com versículo, reflexão e oração
- [x] Devocional: geração IA de reflexão espírita direta e prática (estilo Emmanuel)
- [x] Devocional: oração/pensamento de encerramento espírita
- [x] Sidebar: adicionar link para Devocional Diário
- [x] Cache: salvar devocional gerado no banco para não regenerar no mesmo dia

## Rodada 6 - Scraper Bíblia do Caminho (ancoragem factual da IA)

- [x] Schema: tabela biblia_caminho_source para cache do texto-fonte
- [x] db.ts: helpers getBibliaCaminhoSource e saveBibliaCaminhoSource
- [x] Serviço: server/services/bibliaCaminhoScraper.ts com cheerio
- [x] Router ESE: usar texto-fonte como base factual da IA
- [x] Frontend ESE: indicador de verificação (✓ verificado / ⚠ não verificado)
- [x] Dependência: cheerio no package.json

## Rodada 7 - Links diretos para versículos na Bíblia do Caminho

- [x] Criar client/src/lib/bibliaCaminho.ts com mapeamento completo AT+NT
- [x] Atualizar Devocional.tsx para usar bibliaCaminhoVerseUrl()
- [x] Atualizar routers.ts para retornar bookAbbrev no devocional

## Rodada 8 - PR #2: Índice de Emmanuel, busca por temas e PWA

- [x] Criar server/data/emmanuelIndex.ts com 635 versículos do NT indexados
- [x] Router bible.emmanuelIndex para retornar índice do capítulo com nomes amigáveis das fontes
- [x] BibleReader.tsx: botão expansível "Emmanuel comentou (N)" por versículo
- [x] Correção da busca por temas espíritas (palavras bíblicas reais em vez de rótulos literais)
- [x] searchVerses aceita lista de termos (OR de LIKE)
- [x] PWA: manifest.webmanifest, ícones SVG/PNG/apple-touch, sw.js, offline.html
- [x] Metatags PWA no index.html e registro do service worker em main.tsx
- [x] 17 testes passando (era 12)
