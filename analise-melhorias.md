# Análise Comparativa - Melhorias do JSX do Usuário

## Estrutura do JSX do Usuário
O app do usuário é baseado nos **28 capítulos do Evangelho Segundo o Espiritismo** (Kardec), não na Bíblia completa. Ele tem:

### 1. Organização por Capítulos do ESE (Evangelho Segundo o Espiritismo)
- 28 capítulos com título e tema de cada um
- Sidebar com lista dos 28 capítulos com indicador de "aceso" (chama) para capítulos já estudados
- Links para fontes externas (bibliadocaminho.com)

### 2. Estudo por Capítulo com IA (Geração sob demanda)
- **Passagem central** (máxima evangélica)
- **Contexto** (o que Kardec desenvolve)
- **Leitura filológica** (termo-chave em grego/hebraico, sentido original, contexto histórico)
- **Reflexão devocional** (aplicação moral à vida no lar)
- **Correlações com AT** (2-3 referências com texto e ligação)
- **Meditação no lar** (roteiro: foco, pergunta ao coração, propósito do dia)

### 3. Devocional Diário
- Versículo + reflexão (3 parágrafos) + oração breve
- Botão de favoritar o devocional
- Botão "Gerar outro"
- Botão "Registrar no diário"
- Cache por dia

### 4. Temas Espíritas (12 temas)
- Cards visuais com ícone, nome e descrição
- Ao clicar: gera estudo com introdução + 3 passagens (AT e NT) + aplicação prática
- Botão de favoritar cada passagem

### 5. Diário Espiritual (Modal de Registro)
- Campos: "O que tocou você?" (sentimento) + "Propósito ou insight"
- Contexto automático (capítulo ou devocional)
- Lista cronológica com exclusão
- Badge de contagem na tab

### 6. Favoritos
- Versículos guardados de devocional e temas
- Tipo indicado (chip: "Devocional", "Tema: X")
- Remoção direta

### 7. Visual/UX
- Fontes: Cinzel (títulos) + Crimson Pro (corpo)
- Cores: bg escuro (#070B22), cyan (#7DE3FF), violet (#9A6BFF), gold (#E7C98A)
- Cards com glassmorphism e glow
- Topbar com tabs em pill
- Footer com disclaimer sobre direitos autorais
- Canvas de estrelas animadas
- Responsivo com select dropdown em mobile

## O que FALTA no app atual e pode ser incorporado:

1. **Seção dos 28 capítulos do ESE** - O app atual tem a Bíblia completa mas NÃO tem os capítulos do Evangelho Segundo o Espiritismo organizados como estudo
2. **Leitura filológica** - Análise de termos em grego/hebraico com transliteração
3. **Meditação no lar com roteiro** - Foco + pergunta ao coração + propósito do dia
4. **Modal de registro no diário** com campos estruturados (sentimento + insight/propósito)
5. **Indicador de capítulos estudados** (chama acesa)
6. **Link para fontes externas** (bibliadocaminho.com)
7. **Botão "Gerar outro"** no devocional
8. **Favoritar devocional e passagens de temas**
9. **Disclaimer de direitos autorais** no footer
10. **Tipografia Cinzel + Crimson Pro** (mais elegante que a atual)
