# 📊 Guia de Monitoramento e Funis de Conversão • Ruídos Atmosféricos

Como Gerente de Produto, este guia prático foi preparado especialmente para você analisar o comportamento das pessoas que visitam seu portfólio/site a partir de redes sociais (**Pinterest**, **Tumblr**, **Instagram** e **Bluesky**). 

Toda a infraestrutura do **Mixpanel SDK** já está integrada com sucesso ao código-fonte, mapeando de forma precisa a navegação assíncrona, interações e cliques sem comprometer a performance de carregamento (utilizando inicialização assíncrona baseada em eventos).

---

## 🧭 1. Dicionário de Eventos Mapeados no Código

Os seguintes eventos são disparados automaticamente pelo site e enviados ao seu projeto no Mixpanel:

| Nome do Evento | Propriedades Enviadas | Gatilho / Comportamento |
| :--- | :--- | :--- |
| `Page Viewed` | `Page Name`, `Page Path`, `Has Slug`, `View Slug` | Disparado sempre que o usuário navega entre as seções (Landing, Matéria, Sinais, Ecos, Sobre, etc). |
| `Artwork Opened` | `Artwork Title`, `Artwork Slug`, `Engagement Type` | Disparado ao abrir os detalhes de uma obra de arte específica (`PageMateria`). |
| `Artwork Zoomed` | `Artwork Title`, `Artwork Slug`, `Action` | Disparado ao interagir com o Lightbox (zoom/foco) de uma obra. |
| `Signal Opened` | `Signal Title`, `Signal Slug` | Disparado quando um sinal/texto literário/poético (`PageSinais`) é aberto para leitura completa. |
| `Link Shared` | `Share Type` (artwork/signal/email), `Content Identifier` | Disparado quando o usuário clica para copiar o link de compartilhamento ou copia seu e-mail de contato. |
| `Outbound Link Clicked` | `Destination Channel`, `Destination URL` | Disparado quando o usuário clica em links externos na aba de Redes/Ecos. |
| `Terminal Command Run` | `Command Typed`, `Response Type` | Disparado a cada interação no terminal interativo de contato (`PageConnect`). |

### 🌍 Super Propriedades Globais (Enviadas em todos os eventos):
- `Acquisition Channel`: Identifica automaticamente a origem do tráfego (**Pinterest**, **Tumblr**, **Instagram**, **Bluesky**, **Direct** ou **Outro**) baseado na análise de cabeçalho `document.referrer`.
- `Referrer URL`: A URL completa de origem.
- `Screen Width` & `Screen Height`: Resolução da tela para avaliar usabilidade mobile vs. desktop.
- `Device Orientation`: Orientação do dispositivo (Retrato/Paisagem).

---

## 📈 2. Como Configurar os Funis no Mixpanel

No painel do Mixpanel, crie um relatório do tipo **Funnel** utilizando as seguintes sequências lógicas:

### 🚀 Funil A: Conversão de Tráfego Orgânico e Engajamento de Arte
*Este funil mede o engajamento direto de quem chega ao seu site e se interessa pelo seu trabalho visual (Matérias).*

1. **Passo 1:** `Page Viewed` (Filtro: `Page Name` = `landing`)
   - *Representa:* O visitante pousou na página inicial.
2. **Passo 2:** `Page Viewed` (Filtro: `Page Name` = `materia`)
   - *Representa:* O visitante acessou a galeria de obras/matérias.
3. **Passo 3:** `Artwork Opened`
   - *Representa:* O visitante escolheu e abriu uma obra de arte específica para detalhamento.
4. **Passo 4:** `Artwork Zoomed` (Opcional - Micro-conversão de interesse)
   - *Representa:* O visitante deu zoom na imagem para observá-la no Lightbox.
5. **Passo 5:** `Link Shared` (Filtro: `Share Type` = `artwork`)
   - *Representa:* O usuário gostou tanto que gerou/copiou o link para compartilhar.

---

### 📝 Funil B: Engajamento Literário e Textual (Sinais)
*Mede o comportamento do usuário interessado nos seus escritos e reflexões técnicas/artísticas.*

1. **Passo 1:** `Page Viewed` (Filtro: `Page Name` = `landing`)
   - *Representa:* O visitante pousou na página de entrada.
2. **Passo 2:** `Page Viewed` (Filtro: `Page Name` = `sinais`)
   - *Representa:* O visitante navegou até a seção de Sinais.
3. **Passo 3:** `Signal Opened`
   - *Representa:* O visitante abriu um sinal específico para leitura profunda.
4. **Passo 4:** `Link Shared` (Filtro: `Share Type` = `signal`)
   - *Representa:* Copiou o link do texto para compartilhar com outros.

---

### 📡 Funil C: Da Descoberta ao Contato Efetivo (Retenção Extrema)
*Este funil avalia a taxa de conversão final — quantas pessoas vieram de redes sociais e tentaram contato com você de fato.*

1. **Passo 1:** `Page Viewed` (Qualquer página ou filtre por `Acquisition Channel` ≠ `Direct`)
   - *Representa:* Chegada de qualquer rede social.
2. **Passo 2:** `Page Viewed` (Filtro: `Page Name` = `connect` ou `ecos`)
   - *Representa:* Demonstrou interesse em canais adicionais de contato ou terminal interativo.
3. **Passo 3:** `Terminal Command Run` (Filtro: `Command Typed` = `email` ou `redes`) OU `Outbound Link Clicked`
   - *Representa:* Executou o comando para ver seu e-mail no terminal interativo ou clicou em um link externo de rede social (Tumblr, Bluesky, Pinterest).
4. **Passo 4:** `Link Shared` (Filtro: `Share Type` = `email`)
   - *Representa:* Copiou o seu endereço de e-mail de contato direto.

---

## 🕵️ 3. Análise de Cohorts e Insights para PMs

Como **Gerente de Produto**, você pode extrair as seguintes respostas de alto nível usando o Mixpanel:

### A. Qual canal de aquisição traz usuários mais qualificados?
- **Análise:** No relatório de Funil, agrupe o funil (**Breakdown**) pela super propriedade `Acquisition Channel`.
- **Insight:** Descubra se as pessoas que vêm do *Tumblr* lêem mais seus escritos (`Signal Opened`) comparadas às que vêm do *Pinterest*, que podem preferir focar nas artes visuais (`Artwork Opened`).

### B. Usabilidade Mobile vs. Desktop
- **Análise:** Agrupe as interações de `Artwork Opened` por `Screen Width` ou crie um Cohort de dispositivos mobile.
- **Insight:** Veja se usuários em dispositivos menores estão abandonando a leitura ou se engajam de igual forma após as recentes otimizações de scroll e remoção de arrasto travado no mobile.

### C. Comportamento no Terminal (`PageConnect`)
- **Análise:** No relatório de segmentação de eventos, filtre por `Terminal Command Run` e faça um breakdown por `Command Typed`.
- **Insight:** Veja quais comandos as pessoas mais tentam digitar. Se houver alta frequência de comandos com `Response Type` = `error`, você saberá quais novos aliases/comandos adicionar para tornar a experiência ainda mais fluida!

---

💡 *Dica:* Lembre-se de configurar a variável de ambiente `VITE_MIXPANEL_TOKEN` em seu ambiente de produção para que os eventos comecem a ser populados em tempo real no seu painel do Mixpanel! No ambiente de desenvolvimento local, o site exibe logs formatados no console do navegador imitando o comportamento para sua validação em sandbox.
