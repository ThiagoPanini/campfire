# auditoria visual do frontend campfire

Data: 2026-05-17

Este relatório reinterpreta a auditoria visual do frontend em português e inclui, ao final, um prompt objetivo para um agente de LLM implementar as melhorias recomendadas. Nenhuma mudança de produto foi implementada neste arquivo.

## 1. resumo executivo

campfire já tem uma identidade visual rara para um MVP: escuro quente, mono tipográfico, atmosfera VHS, cópia curta em pt-BR e um começo claro de metáfora de fita, prateleira e sala íntima. A home tem presença. Os campos e links têm uma linguagem própria. O app autenticado, especialmente o perfil em formato de J-card, mostra que o produto pode ficar memorável sem virar paródia retrô.

A maior oportunidade está no momento central do MVP: o repertório. Hoje ele funciona como uma lista CRUD bem estilizada, mas ainda não entrega com força a sensação do norte do produto: "isso é meu". A interface precisa transformar música cadastrada em objeto de coleção pessoal, não apenas em registro de banco de dados.

As prioridades são:

1. Recriar a lista de repertório como prateleira, ficha de fita ou log de faixas.
2. Criar um estado vazio emocional, com "prateleira intocada" e uma ação principal clara.
3. Dar à landing page uma frase de produto sem perder a atmosfera de pôster.
4. Remover hábitos genéricos de modal, como sombra, blur excessivo e animação de escala.
5. Reduzir ruído visual em telas densas, especialmente o vídeo de fundo atrás do repertório.

Verificação realizada: `pnpm build:web` passa. Também houve inspeção visual local em desktop e mobile nas rotas `/`, `/signup`, `/signin`, `/signup/confirm`, `/app`, `/app/repertorio` e `/app/perfil`.

## 2. mapa atual do frontend

Arquitetura:

- React + TypeScript + Vite.
- Rotas em `apps/web/src/App.tsx`.
- Estilos em CSS local por superfície, sem framework de UI.
- Primitivos em `apps/web/src/ui/`.
- Autenticação ainda stubada em `apps/web/src/auth/client.ts`.
- Sessão local em `apps/web/src/auth/session.ts`.
- App autenticado em `apps/web/src/app/`.

Superfícies atuais:

- `/`: `Home`, pôster full-bleed com `background.mp4` e fallback `background.png`.
- `/signup`: modal de criação de conta sobre a home.
- `/signin`: modal de entrada sobre a home.
- `/signup/confirm`: modal de código OTP.
- `/app`: console autenticado com vídeo `lofi-office.mp4`.
- `/app/repertorio`: repertório em memória, com adicionar, editar e remover música.
- `/app/perfil`: cartão de membro em linguagem de J-card/cassete.

Arquivos centrais:

- `apps/web/src/App.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/ui/tokens.css`
- `apps/web/src/home/Home.tsx`
- `apps/web/src/home/Home.css`
- `apps/web/src/signup/SignUp.tsx`
- `apps/web/src/signup/SignUpConfirm.tsx`
- `apps/web/src/signin/SignIn.tsx`
- `apps/web/src/app/AppConsole.tsx`
- `apps/web/src/app/AppConsole.css`
- `apps/web/src/app/Perfil.tsx`
- `apps/web/src/app/Perfil.css`

Mídia disponível:

- `apps/web/public/background.mp4`
- `apps/web/public/background.png`
- `apps/web/public/lofi-office.mp4`

## 3. linguagem visual existente

A linguagem já implementada se apoia em:

- Canvas preto quente, ainda usando `#000000`.
- Tinta marfim envelhecida: `#ece8df`.
- Texto secundário em marfim opaco: `#ece8dfa3`.
- Hairlines discretos: `#ece8df21` e `#ece8df38`.
- Vermelho tracking: `#cc3344`.
- Ciano CRT: `#46d4d0`.
- Tipografia mono: Share Tech Mono para marca, títulos e labels; VT323 para corpo.
- Links ghost com sublinhado ciano animado.
- Inputs transparentes com borda inferior.
- Superfícies planas, embora alguns modais ainda usem sombra.
- Atmosfera VHS concentrada na home e no app console.

O sistema está mais forte quando usa linhas, opacidade, textura e silêncio. Ele enfraquece quando vira "card central com sombra", "dashboard com sidebar" ou "lista CRUD escura".

## 4. o que já funciona

**A home tem memória visual.** O pôster noturno com fogueira, guitarra, scanlines e vinheta já cria uma imagem que fica na cabeça. Ele se afasta de SaaS genérico.

**Os campos estão alinhados com o produto.** O campo com borda inferior parece mais uma linha de formulário físico do que uma caixa digital. Isso combina com fita, ficha, manual e registro pessoal.

**O link ghost é uma assinatura boa.** O sublinhado ciano que cresce é simples, consistente e mais campfire do que um hover com escala ou sombra.

**O perfil em J-card é o melhor caminho visual autenticado.** Ele traduz "círculo selado", "coleção pessoal" e "objeto privado" sem fingir reprodução musical.

**A voz em português está perto do tom certo.** A cópia é minúscula, curta e pouco publicitária. Isso deve ser preservado.

## 5. principais lacunas visuais

**O repertório ainda não é uma prateleira.** Ele tem boas cores e hairlines, mas sua estrutura ainda comunica "linha de tabela". Falta sensação de objeto guardado.

**A landing tem atmosfera, mas pouca promessa.** A home mostra um mundo, porém quase não diz o que campfire faz. "alpha · coming soon" é insuficiente para a primeira visita.

**O vídeo do app compete com telas densas.** Em `/app` ele funciona bem. Em `/app/repertorio`, o fundo fotográfico fica atrás de muitos textos pequenos e reduz legibilidade.

**Os modais quebram regras do próprio design system.** `box-shadow`, `backdrop-filter: blur(...)` e animação de escala aproximam a UI de padrões genéricos.

**A navegação mobile ocupa altura demais.** Marca, perfil e nav aparecem empilhados antes do conteúdo. Em telas pequenas, o repertório começa tarde.

**Estados críticos ainda são frágeis.** Remover música não pede confirmação nem oferece desfazer. O modal fecha no backdrop e pode descartar digitação.

**O sistema de tokens ainda tem drift.** `DESIGN.md`, `tokens.css`, `Home.css` e CSS do app repetem ou divergem em cores, type scale, sombras e movimento.

## 6. recomendações tela por tela

### home / landing poster

Mudar:

- Adicionar uma faixa textual curta usando a estrutura já existente em `.poster-cap`, `.poster-headline` e `.poster-copy`.
- Incluir uma promessa de produto em pt-BR, por exemplo: "guarde as músicas que você toca em casa."
- Manter a frase íntima, sem marketing expansivo.
- Preservar o vídeo como protagonista, mas dar contexto ao visitante.

Por que importa:

- A home atual é memorável, mas não entrega o aha de repertório pessoal.
- O usuário precisa entender que campfire não é streaming, aula, rede social ou player.

Como implementar:

- Editar `Home.tsx` para renderizar uma seção textual abaixo ou sobreposta de forma discreta ao pôster.
- Reutilizar estilos existentes de `Home.css` em vez de inventar um bloco novo.

Prontidão:

- Impacto: Alto.
- Esforço: Baixo.
- Risco: Baixo.
- Arquivos: `Home.tsx`, `Home.css`.
- MVP-safe: Sim.
- Requer novo asset: Não.

### signup modal

Mudar:

- Remover sombra projetada.
- Trocar animação de escala por fade curto e linhas de registro.
- Adicionar botão explícito de fechar.
- Evitar fechar com clique no backdrop quando houver campos preenchidos, ou pedir confirmação.
- Dar ao modal aparência de etiqueta/ficha plana, não card elevado.

Por que importa:

- O modal atual funciona, mas parece web app convencional.
- Cadastro é o primeiro toque funcional do usuário; deve preservar a atmosfera sem atrapalhar.

Prontidão:

- Impacto: Médio.
- Esforço: Médio.
- Risco: Baixo.
- Arquivos: `Modal.tsx`, `Modal.css`, `SignUp.tsx`, `SignUp.css`.
- MVP-safe: Sim.
- Requer novo componente: Pequena evolução de `Modal`.

### signin modal

Mudar:

- Aplicar as mesmas mudanças estruturais do signup.
- Revisar a frase "acesse seu painel musical", que soa mais genérica.
- Sugestão de direção: "voltar para sua prateleira" ou "volte para o que você guardou".

Por que importa:

- "Painel" aproxima a experiência de dashboard. "Prateleira" aproxima do produto.

Prontidão:

- Impacto: Médio.
- Esforço: Baixo.
- Risco: Baixo.
- Arquivos: `SignIn.tsx`, `SignIn.css`.
- MVP-safe: Sim.

### confirmação OTP

Mudar:

- Fortalecer levemente as linhas vazias dos code boxes.
- Corrigir copy de cooldown: "reenviar em 60s", não "reenviando em 60s".
- Adicionar região de status acessível para mensagens de reenviar/verificar, sem anunciar cada segundo.
- Garantir que erro não dependa só de vermelho e shake.

Por que importa:

- O OTP é um momento de ansiedade. A interface precisa ser clara, calma e acessível.

Prontidão:

- Impacto: Médio.
- Esforço: Baixo.
- Risco: Baixo.
- Arquivos: `SignUpConfirm.tsx`, `CodeBoxes.css`.
- MVP-safe: Sim.

### app console home

Mudar:

- Manter a cena do quarto como superfície atmosférica principal.
- Tornar a CTA "abrir o repertório" um pouco mais clara como ação inicial.
- Avaliar uma segunda ação discreta: "adicionar música", apenas se não poluir a composição.
- Preservar "lado a · faixa 01", pois é um bom vocabulário do produto.

Por que importa:

- Esta tela pode ser o corredor emocional entre criar conta e começar o repertório.

Prontidão:

- Impacto: Alto.
- Esforço: Médio.
- Risco: Médio.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- MVP-safe: Sim.

### repertoire list

Mudar:

- Transformar linhas em entradas de prateleira, fita ou log de faixas.
- Adicionar índice visual discreto: `01`, `02`, `03`, ou "faixa 01".
- Fazer o título parecer etiqueta de fita, com artist/instrument como carimbos.
- Tratar observação como anotação pessoal, não como "nota:" de sistema.
- Aproximar ações de editar/remover do objeto visual, com área de toque maior.
- Em desktop, permitir que "remover" apareça só em hover/focus. Em mobile, manter visível.

Por que importa:

- O repertório é a tela que precisa entregar o aha do MVP.
- Hoje a lista é legível, mas não emocionalmente proprietária.

Prontidão:

- Impacto: Alto.
- Esforço: Médio.
- Risco: Médio.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- MVP-safe: Sim.
- Requer novo componente: Recomendado, `RepertoireRow`.

### add/edit song modal

Mudar:

- Fazer o formulário parecer uma etiqueta de fita ou ficha de catalogação.
- Trocar o campo `observação` para textarea, mantendo o estilo de linha.
- Remover a copy temporária "salvo só nesta tela por enquanto" quando persistência real chegar.
- Após salvar, dar feedback breve na nova linha inserida.

Por que importa:

- Adicionar uma música é o ato central do MVP. O gesto deve parecer "guardar", não apenas "submeter formulário".

Prontidão:

- Impacto: Alto.
- Esforço: Médio.
- Risco: Baixo.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`, `Field.tsx`, `Field.css`.
- MVP-safe: Sim.
- Requer evolução de componente: `Field` com textarea.

### empty states

Mudar:

- Substituir estado vazio genérico por "prateleira ainda intocada".
- Mostrar 3 a 5 linhas fantasma de fita/shelf slot.
- Usar CTA principal: "guardar primeira música" ou "adicionar primeira música".
- Evitar instrução longa.

Por que importa:

- O primeiro repertório vazio é um convite íntimo, não uma ausência.

Prontidão:

- Impacto: Alto.
- Esforço: Baixo.
- Risco: Baixo.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- MVP-safe: Sim.

### navegação e sidebar

Mudar:

- Reduzir energia de dashboard.
- Reorganizar sidebar como índice de fita: início, repertório, perfil, jams em breve.
- Em mobile, recolher detalhes do perfil e manter nav compacta.
- Evitar que a sidebar pareça o componente principal da tela.

Por que importa:

- A navegação deve sustentar o espaço privado, não parecer administração SaaS.

Prontidão:

- Impacto: Médio.
- Esforço: Médio.
- Risco: Médio.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- MVP-safe: Sim.

### mobile layouts

Mudar:

- Compactar cabeçalho autenticado.
- Reduzir a altura ocupada por perfil/email em mobile.
- Reposicionar "adicionar música" abaixo do título ou como botão full-width após a hairline.
- Garantir área mínima de toque de 44px em ações de linha.
- Reduzir interferência do fundo na lista.

Por que importa:

- O usuário provavelmente vai adicionar músicas pelo celular, no sofá, no ensaio ou depois de tocar.

Prontidão:

- Impacto: Alto.
- Esforço: Médio.
- Risco: Baixo.
- Arquivos: `AppConsole.css`, `Button.css`.
- MVP-safe: Sim.

## 7. recomendações por componente

### buttons

Manter:

- Primário marfim com hover ciano.
- Tipografia mono e minúscula.
- Sem lift/scale.

Melhorar:

- Aumentar hit area de botões ghost usados em linhas.
- Adicionar estado visual de loading mais analógico, por exemplo uma linha ciano curta dentro do botão.
- Evitar botão primário muito isolado sobre vídeo denso sem base visual.

### ghost links

Manter:

- Sublinhado ciano crescente.

Melhorar:

- Reutilizar em todas as ações secundárias.
- Em contexto destrutivo, usar vermelho só no hover/focus e sempre com texto claro.

### fields

Manter:

- Input transparente com borda inferior.
- Label acima.
- Foco em ciano.

Melhorar:

- Criar suporte para textarea.
- Garantir que placeholder não fique claro demais em fundos com vídeo.
- Manter mensagens de erro em texto, não apenas cor.

### modals

Mudar:

- Remover `box-shadow`.
- Evitar `backdrop-filter` como efeito decorativo.
- Trocar escala por fade e desenho de linhas.
- Implementar focus trap.
- Restaurar foco ao fechar.
- Adicionar botão explícito de fechar.
- Proteger forms com dados preenchidos contra fechamento acidental.

### strength meter

Manter:

- Energia de VU meter.
- Segmentos discretos.

Melhorar:

- Adicionar texto auxiliar simples com critério: "mais longa fica mais segura".
- Não depender só de cor para comunicar força.

### code boxes

Manter:

- Paste-anywhere.
- Shake controlado no erro.

Melhorar:

- Aumentar contraste das linhas vazias.
- Melhorar anúncio para leitores de tela.
- Evitar anúncio do countdown a cada segundo.

### repertoire rows

Mudar:

- Criar componente próprio.
- Adicionar índice/faixa.
- Fazer metadata parecer carimbo ou etiqueta.
- Tratar observação como anotação.
- Aumentar área de toque para ações.
- Considerar feedback de recém-adicionada.

### navigation

Mudar:

- Transformar sidebar em índice de fita.
- Evitar padrão excessivo de dashboard.
- Manter sem hamburger no MVP, mas compactar mobile.

### background surfaces

Mudar:

- Home: manter overlays VHS.
- App home: manter vídeo ambiente.
- Repertório e modais: usar fundo mais quieto, com vídeo muito escurecido ou congelado.

### typography tokens

Mudar:

- Reconciliar `DESIGN.md` e `tokens.css`.
- Adicionar token de display no CSS.
- Evitar tracking negativo em UI densa.
- Preservar mono-only.

### focus states

Mudar:

- Garantir foco visível em todos os botões ghost compactos.
- Testar ordem de tab nos modais.
- Implementar focus trap.

### loading states

Mudar:

- Manter label swap.
- Adicionar `aria-live` para operações relevantes.
- Usar microanimação de linha, não spinner genérico.

### error states

Mudar:

- Erros devem ser textuais, próximos ao campo e anunciáveis.
- Estados destrutivos devem ter confirmação ou desfazer antes de persistência real.

## 8. conceitos visuais de alto impacto

### 1. prateleira de fitas

Transformar a lista de repertório em uma prateleira horizontal: cada música é uma fita sem capa, com título, artista e instrumento carimbados. Sem cards, apenas linhas e slots.

### 2. log de faixas

Cada item vira uma entrada de fita: `faixa 01`, título, artista, instrumento, observação. A lista fica mais musical sem sugerir playback.

### 3. signal lock ao salvar

Ao adicionar música, a nova entrada recebe uma varredura ciano rápida, como sinal sintonizando, e se assenta em marfim.

### 4. prateleira intocada

Estado vazio com linhas fantasma e uma só ação. Deve parecer uma estante esperando a primeira fita.

### 5. modo lista quieta

Em `/app/repertorio`, reduzir ou congelar o vídeo de fundo e aplicar scrim local mais forte.

### 6. modal etiqueta de fita

O formulário de adicionar/editar vira um papel de etiqueta: linhas de preenchimento, cabeçalho curto, cantos marcados.

### 7. continuidade do J-card

Usar a linguagem do perfil como referência para o repertório: strips, números, divisórias pontilhadas, metadados.

### 8. carimbos de instrumento

Instrumento aparece como carimbo tipográfico discreto. Não usar badge colorido, pill chamativa ou ícone específico de guitarra.

## 9. sistema de movimento e microinterações

### salvar música

- Trigger: submit válido no modal de adicionar.
- Comportamento: nova linha entra no topo com uma hairline ciano varrendo da esquerda para a direita.
- Duração: 420ms.
- Easing: `var(--ease-out-quart)`.
- Reduced motion: inserir linha sem animação e anunciar "música guardada".
- Por que combina: parece sinal travando, não comemoração gamificada.

### editar música

- Trigger: salvar edição.
- Comportamento: metadata da linha faz um flicker de opacidade em 2 passos e volta ao normal.
- Duração: 180ms.
- Easing: `steps(2, end)`.
- Reduced motion: atualização instantânea.
- Por que combina: lembra correção de etiqueta ou tracking leve.

### remover música

- Trigger: ação remover.
- Comportamento: idealmente abrir confirmação discreta ou oferecer desfazer. Se animar, linha perde opacidade e hairline fica vermelha antes de sair.
- Duração: 240ms.
- Easing: `var(--ease-out-quart)`.
- Reduced motion: remoção instantânea com mensagem de status.
- Por que combina: destruição deve ser silenciosa e deliberada.

### troca de navegação

- Trigger: mudança de rota.
- Comportamento: indicador ativo desliza pela linha da nav.
- Duração: 220ms.
- Easing: `var(--ease-out-quart)`.
- Reduced motion: troca instantânea.
- Por que combina: sugere cabeça de fita mudando de trilha.

### abertura de modal

- Trigger: abrir signup, signin, OTP ou song modal.
- Comportamento: fade curto e linhas de registro surgindo nos cantos. Sem escala.
- Duração: 180ms.
- Easing: `var(--ease-out-quart)`.
- Reduced motion: renderização instantânea.
- Por que combina: parece uma ficha colocada sobre a mesa.

### foco de campo

- Trigger: focus em input/textarea.
- Comportamento: borda inferior muda para ciano e engrossa.
- Duração: 160ms.
- Easing: `var(--ease-out-quart)`.
- Reduced motion: troca instantânea.
- Por que combina: já é a interação mais alinhada do sistema.

### erro de OTP

- Trigger: código inválido.
- Comportamento: jitter horizontal em steps, acompanhado de texto de erro.
- Duração: 200ms.
- Easing: `steps(3, end)`.
- Reduced motion: sem jitter, só texto e borda vermelha.
- Por que combina: é mecânico, não bouncy.

### atmosfera da home

- Trigger: carregamento da página.
- Comportamento: sem coreografia de entrada; apenas vídeo, grain e tracking.
- Duração: ambiente contínuo.
- Reduced motion: imagem estática.
- Por que combina: a UI não deve obrigar o usuário a assistir uma animação.

## 10. acessibilidade e usabilidade

Riscos:

- Texto `ink-muted` em caption pode ficar fraco sobre vídeo.
- Modal não faz focus trap.
- Modal pode fechar por backdrop e perder dados.
- Ações ghost compactas podem ficar abaixo de 44px em mobile.
- Countdown de OTP pode ser ruidoso para leitores de tela se anunciado a cada segundo.
- Remover música não tem confirmação nem desfazer.
- Fundo de vídeo reduz legibilidade em listas densas.
- `jams em breve` como `span` não é navegável nem acionável, mas parece item de nav.

Recomendações:

- Testar contraste real em home, app, repertório e modais.
- Implementar focus trap e restauração de foco.
- Usar `aria-live="polite"` apenas para eventos, não para countdown contínuo.
- Aumentar hit areas.
- Adicionar confirmação/desfazer para remover.
- Desativar ou congelar vídeo em telas densas.
- Garantir que todo estado comunicado por cor tenha texto ou forma.

## 11. responsividade

Desktop:

- Sidebar funciona, mas ainda deve ficar menos dashboard.
- Repertório precisa de largura, ritmo e hierarquia mais fortes.
- Fundo pode ser mais atmosférico na home do app e mais quieto em listas.

Tablet:

- Sticky sidebar no topo é boa, mas profile + nav podem ficar altos.
- Nav horizontal precisa de affordance de scroll se houver overflow.

Mobile:

- Compactar cabeçalho autenticado.
- Esconder email no topo ou mostrar apenas no perfil.
- Reposicionar CTA de adicionar música abaixo do título.
- Garantir ações de linha com 44px.
- Reduzir fundo de vídeo atrás de texto.
- Evitar que o modal full-screen pareça um buraco preto sem botão de fechar.

## 12. roadmap priorizado de implementação

### quick wins, até 1 dia

- Remover sombras dos modais.
- Corrigir copy "reenviar em 60s".
- Adicionar close button aos modais.
- Aumentar área de toque de ações ghost.
- Adicionar headline/subcopy curta na home.
- Fortalecer linhas vazias do OTP.

### polimento MVP, 2 a 4 dias

- Recriar linhas de repertório como log/prateleira.
- Criar estado vazio de prateleira intocada.
- Congelar ou escurecer fundo em `/app/repertorio`.
- Adicionar feedback acessível ao salvar/remover.
- Criar textarea para observação.
- Implementar focus trap em modal.

### upgrade visual assinatura, 1 a 2 semanas

- Extrair `RepertoireRow`.
- Extrair `ShelfEmptyState`.
- Reformular `SongModal` como etiqueta de fita.
- Fazer app navigation como índice de fita.
- Levar linguagem do J-card para o repertório.
- Fazer QA visual em 360, 390, 768, 1280 e 1440px.

### ideias posteriores

- Densidade de repertório compacta/ampla.
- Ritual pós-cadastro com cartão de membro.
- Modo "sala quieta" para reduzir mídia em todas as telas densas.
- Pequenas preferências visuais do usuário, sem gamificação.

## 13. conceitos experimentais

### 1. cassette spine shelf

- Conceito: músicas como lombadas de fita em uma prateleira.
- Por que combina: reforça coleção pessoal.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- Risco: virar decoração demais.
- Protótipo rápido: uma variação CSS de `.repertoire-song`.

### 2. blank shelf first run

- Conceito: estado vazio com slots fantasmas.
- Por que combina: prateleira esperando a primeira música.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- Risco: parecer skeleton loading.
- Protótipo rápido: 3 linhas decorativas `aria-hidden`.

### 3. signal lock save

- Conceito: varredura ciano na música recém-guardada.
- Por que combina: feedback analógico.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- Risco: chamar atenção demais.
- Protótipo rápido: classe temporária em novo item.

### 4. tape insert modal

- Conceito: modal como etiqueta de fita.
- Por que combina: o usuário está preenchendo uma ficha de música.
- Arquivos: `Modal.css`, `AppConsole.css`, `Field.tsx`.
- Risco: reduzir familiaridade do formulário.
- Protótipo rápido: header strip, cantos e linhas.

### 5. J-card repertoire header

- Conceito: header do repertório com strip e numeração inspirados no perfil.
- Por que combina: cria continuidade de sistema.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`, `Perfil.css`.
- Risco: sobrecarregar topo.
- Protótipo rápido: aplicar apenas no header.

### 6. instrument rubber stamps

- Conceito: instrumento como carimbo tipográfico.
- Por que combina: metadado manual, não badge SaaS.
- Arquivos: `RepertoireRow`, `AppConsole.css`.
- Risco: legibilidade menor.
- Protótipo rápido: texto com borda hairline e letter-spacing controlado.

### 7. quiet room split

- Conceito: vídeo forte só no console home; repertório usa still/scrim.
- Por que combina: atmosfera sem prejudicar leitura.
- Arquivos: `AppConsole.tsx`, `AppConsole.css`.
- Risco: lista parecer menos memorável.
- Protótipo rápido: classe por rota em `mainClassName`.

### 8. tape head navigation

- Conceito: indicador ativo da nav como cabeça de fita.
- Por que combina: movimento mecânico discreto.
- Arquivos: `AppConsole.css`.
- Risco: motion decorativo.
- Protótipo rápido: pseudo-elemento animado com reduced-motion.

### 9. member card onboarding

- Conceito: após confirmação, mostrar cartão de membro e CTA para repertório.
- Por que combina: reforça círculo privado.
- Arquivos: fluxo pós-signup, `Perfil`.
- Risco: adicionar passo antes do aha.
- Protótipo rápido: rota temporária ou estado local.

### 10. shelf ledger dense mode

- Conceito: lista mais densa como registro datilografado.
- Por que combina: usuários com muitas músicas precisarão de densidade.
- Arquivos: `RepertoireRow`, CSS.
- Risco: ficar seco demais.
- Protótipo rápido: classe compacta sem toggle público.

## 14. top 5 recomendações

1. Redesenhar o repertório como prateleira/log de fita, mantendo lista sem cards.
2. Criar estado vazio de prateleira intocada com uma CTA clara.
3. Dar uma frase de produto à landing, preservando o pôster.
4. Refatorar modal para ser plano, acessível e coerente com o sistema.
5. Reduzir o vídeo de fundo em telas densas para melhorar leitura.

## 15. arquivos e componentes mais prováveis de mudança

- `apps/web/src/home/Home.tsx`
- `apps/web/src/home/Home.css`
- `apps/web/src/app/AppConsole.tsx`
- `apps/web/src/app/AppConsole.css`
- `apps/web/src/app/Perfil.tsx`
- `apps/web/src/app/Perfil.css`
- `apps/web/src/ui/Modal.tsx`
- `apps/web/src/ui/Modal.css`
- `apps/web/src/ui/Field.tsx`
- `apps/web/src/ui/Field.css`
- `apps/web/src/ui/Button.css`
- `apps/web/src/ui/CodeBoxes.css`
- `apps/web/src/ui/tokens.css`

Componentes recomendados:

- `RepertoireRow`
- `ShelfEmptyState`
- `SongFormModal` ou evolução do `SongModal`
- Suporte `textarea` em `Field`

## 16. prompt para agente de implementação LLM

Use este prompt em um agente de LLM para implementar as melhorias. Ele foi estruturado com a skill `enhance-prompt`, usando o design system do projeto e boas práticas de prompt claro: plataforma, estilo, componentes, escopo, mudanças específicas, restrições e verificação.

```markdown
Você é um agente sênior de frontend, UX/UI e design system trabalhando no repositório `campfire`.

Objetivo: implementar um polimento visual de alto impacto no frontend do campfire para fazer o MVP expressar melhor a promessa "este repertório é meu", preservando a identidade "The 2am VHS Mixtape" e sem adicionar funcionalidades fora do escopo.

DESIGN SYSTEM (OBRIGATÓRIO):
- Plataforma: Web responsiva, desktop e mobile.
- Tema: dark warm canvas, íntimo, nostálgico, lo-fi/VHS, pessoal, quieto.
- Background principal: Dead Channel Black (#000000) atualmente, com recomendação de manter compatibilidade e preparar migração futura para near-black quente.
- Surface elevada: Channel Elev (#050505), usada com muita discrição.
- Texto primário: Aged Manual Ivory (#ece8df).
- Texto secundário: Aged Manual Ivory Muted (#ece8dfa3).
- Hairlines: Hairline (#ece8df21) e Hairline Strong (#ece8df38).
- Acento de ação/foco: CRT Chroma (#46d4d0), usado raramente.
- Acento destrutivo/erro: Tracking Error Red (#cc3344), usado raramente.
- Tipografia: Share Tech Mono para marca, títulos, labels e botões; VT323 para corpo. Não usar sans, serif ou fonte nova.
- Copy de UI: português brasileiro, minúscula, íntima e curta.
- Forma: hairlines sobre cards, sem sombras, sem glassmorphism, sem cards grandes arredondados.
- Movimento: analógico/mecânico, curto, sem bounce, sem scale/lift. Respeitar `prefers-reduced-motion`.
- CRT/scanlines/grain: permitido em hero/atmosfera, nunca sobre formulários ou listas densas.

ESCOPO DE IMPLEMENTAÇÃO:
Implementar somente melhorias visuais e de usabilidade no frontend existente. Não criar backend, CI, Docker, i18n framework, features sociais, playback, streaming, aulas, gamificação, perfis públicos, badges, streaks, feed ou recomendações musicais.

Arquivos principais:
- `apps/web/src/home/Home.tsx`
- `apps/web/src/home/Home.css`
- `apps/web/src/app/AppConsole.tsx`
- `apps/web/src/app/AppConsole.css`
- `apps/web/src/app/Perfil.tsx`
- `apps/web/src/app/Perfil.css`
- `apps/web/src/ui/Modal.tsx`
- `apps/web/src/ui/Modal.css`
- `apps/web/src/ui/Field.tsx`
- `apps/web/src/ui/Field.css`
- `apps/web/src/ui/Button.css`
- `apps/web/src/ui/CodeBoxes.css`
- `apps/web/src/ui/tokens.css`

MUDANÇAS PRIORITÁRIAS:

1. Landing/home poster:
   - Adicionar uma faixa textual discreta ao pôster usando a linguagem já existente de `.poster-cap`, `.poster-headline` e `.poster-copy`.
   - Incluir uma frase curta de produto, por exemplo: "guarde as músicas que você toca em casa."
   - Incluir subcopy breve sobre repertório pessoal, sem tom de marketing.
   - Preservar vídeo, overlays VHS e CTAs atuais.

2. Repertório como prateleira/log de fita:
   - Extrair ou organizar um componente `RepertoireRow`.
   - Transformar cada música em uma entrada visual de prateleira, fita ou log de faixa.
   - Adicionar índice discreto, como `01`, `02`, `03` ou `faixa 01`.
   - Título deve parecer etiqueta de fita, artist/instrument como carimbos tipográficos.
   - Observação deve parecer anotação pessoal. Evitar prefixo seco "nota:" se houver alternativa melhor.
   - Manter `<ul>` e `<li>` semânticos.
   - Não usar cards, sombras, cover art, play button, waveform, chord diagram ou ícone específico de instrumento.

3. Estado vazio do repertório:
   - Criar `ShelfEmptyState` ou bloco equivalente.
   - Mostrar 3 a 5 slots/linhas fantasma `aria-hidden`.
   - Copy curta e íntima, exemplo: "sua prateleira ainda está quieta".
   - CTA principal: "guardar primeira música" ou "adicionar primeira música".

4. Add/edit song modal:
   - Reformular visualmente como etiqueta de fita ou ficha de catalogação.
   - Remover qualquer aparência de card elevado.
   - Manter campos simples: música, artista, instrumento, observação.
   - Evoluir `Field` para suportar textarea para `observação`, mantendo o estilo de borda inferior.
   - Após salvar uma música nova, aplicar feedback breve na nova linha: hairline ciano varrendo uma vez.
   - Reduced-motion: sem varredura, apenas atualização instantânea com status acessível.

5. Modal base:
   - Remover `box-shadow`.
   - Evitar `backdrop-filter` decorativo ou reduzir drasticamente.
   - Trocar animação de scale/translate por fade curto e/ou desenho de linhas.
   - Adicionar botão explícito de fechar com label acessível.
   - Implementar focus trap e restauração de foco ao fechar.
   - Evitar fechamento acidental por backdrop quando houver dados preenchidos, ou ao menos não aplicar isso em modais de formulário.

6. App background:
   - Manter `lofi-office.mp4` forte no `/app` home.
   - Em `/app/repertorio` e modais, reduzir o vídeo com scrim forte, still/freeze ou classe de "quiet list mode".
   - Priorizar legibilidade do texto.

7. Navegação e mobile:
   - Reduzir sensação de dashboard na sidebar.
   - Reforçar metáfora de índice de fita sem prejudicar semântica.
   - Em mobile, compactar marca/perfil/nav para reduzir altura antes do conteúdo.
   - Ações de linha em mobile devem ter área de toque mínima de 44px.

8. OTP e microcopy:
   - Corrigir cooldown para "reenviar em 60s".
   - Fortalecer contraste das linhas vazias dos code boxes.
   - Adicionar status acessível para eventos de envio/verificação, sem anunciar countdown a cada segundo.

MOTION:
- Salvar música: hairline ciano varre a nova row em 420ms com `var(--ease-out-quart)`.
- Editar música: flicker discreto de metadata em 180ms steps, opcional.
- Remover música: preferir confirmação ou desfazer; se animar, fade e hairline vermelha em 240ms.
- Modal: fade de 180ms, sem scale.
- Nav ativa: indicador mecânico curto, 220ms, reduced-motion instantâneo.
- Todos os movimentos precisam de `@media (prefers-reduced-motion: reduce)`.

ACESSIBILIDADE:
- Preservar landmarks e semântica.
- Garantir foco visível em todo controle.
- Implementar focus trap em modal.
- Restaurar foco após fechamento.
- Não comunicar estado só por cor.
- Garantir contraste de texto muted em fundos com vídeo.
- Adicionar `aria-live="polite"` apenas para eventos relevantes.
- Remover música precisa de confirmação, desfazer ou outra proteção antes de persistência real.

RESTRIÇÕES:
- Não alterar backend.
- Não adicionar dependências sem necessidade clara.
- Não introduzir framework de UI.
- Não adicionar streaming, playback, aulas, rede social, feed, gamificação, badges, streaks, ranking, métricas de performance musical ou perfis públicos.
- Não usar sombras, glassmorphism, gradientes roxos, cards grandes arredondados, confetti, waveforms decorativas, play buttons falsos ou diagramas musicais falsos.
- Não substituir a linguagem mono.
- Não capitalizar UI copy, exceto conteúdo digitado pelo usuário.

CRITÉRIOS DE ACEITE:
- `pnpm build:web` passa.
- Home comunica claramente o produto sem perder atmosfera.
- Repertório parece uma coleção pessoal, não uma tabela CRUD.
- Estado vazio convida o primeiro cadastro de música.
- Add/edit modal parece uma ficha/etiqueta coerente com campfire.
- Mobile em 390px não tem header alto demais e não corta ações importantes.
- Focus keyboard funciona nos modais e nas ações de row.
- Reduced motion desativa animações decorativas.
- A UI continua em pt-BR, minúscula e íntima.

Depois de implementar:
1. Rode `pnpm build:web`.
2. Faça inspeção visual manual das rotas `/`, `/signup`, `/signin`, `/signup/confirm`, `/app`, `/app/repertorio`, `/app/perfil`.
3. Verifique desktop 1280x720 e mobile 390x844.
4. Liste os arquivos alterados e qualquer tradeoff assumido.
```
