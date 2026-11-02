# Vol

Extensão para Zen e Firefox: volume independente por aba, de 0% a 200%, começando em 100%.

A interface segue o Sinal: amarelo, preto, tipografia Space Grotesk e slider com puxador circular vazado. O logo Pulso aparece no popup e no ícone da extensão.

## Rodar

```sh
bun install
bun run dev
```

Assim como o Lily, o projeto usa Bun, WXT, Svelte 5 e Manifest V3 para Firefox. Configure o binário local do Zen em `web-ext.config.ts`, que não vai para o git.

## Instalar no Zen

Baixe o `.xpi` do [release mais recente](https://github.com/juicerq/vol/releases/latest) ou gere o pacote localmente:

```sh
bun run xpi
```

Instale `.output/vol.xpi` em `about:addons` → engrenagem → “Instalar extensão de um arquivo”. Para um pacote local sem assinatura, o Zen precisa estar configurado para aceitá-lo em `about:config`, com `xpinstall.signatures.required` em `false`.

Para instalação temporária, use `about:debugging#/runtime/this-firefox` → “Carregar extensão temporária” e selecione `.output/firefox-mv3/manifest.json`.

## Volume por aba

O popup envia o percentual ao background, que valida o intervalo e o salva com [`browser.sessions.setTabValue`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/sessions/setTabValue). O valor pertence à aba, não ao domínio: duas abas do mesmo site podem ter volumes diferentes. Reabrir o popup, navegar, recarregar e restaurar a aba mantém o valor. Uma aba nova começa em 100%.

Os content scripts de cada frame recuperam esse valor. O motor de áudio no contexto da página aplica um `GainNode` a elementos HTML de áudio e vídeo compatíveis, incluindo players inseridos depois do carregamento. O volume do player continua funcionando: se ele estiver em 50% e o Vol em 200%, o resultado é equivalente a 100%.

Páginas internas do navegador e páginas protegidas contra extensões não permitem o controle. Players com DRM, mídia externa sem CORS ou áudio já conectado a outro grafo podem impedir a amplificação. Nesses casos o Vol preserva o player, aplica a redução pelo volume nativo quando possível e informa a limitação no popup. Áudio produzido diretamente por Web Audio, sem um elemento HTML de mídia, não é controlado nesta versão.

O acesso aos sites permite controlar os players em todas as abas e frames. `tabs` identifica a aba atual, `sessions` guarda seu volume e `webNavigation` localiza os frames de players incorporados. A extensão não envia dados para serviços externos e a fonte é empacotada localmente.

## Checagens

```sh
bun run check
bun run lint
bun run build
bunx web-ext lint --source-dir .output/firefox-mv3 --warnings-as-errors
```

Os pacotes são publicados nos [releases do GitHub](https://github.com/juicerq/vol/releases). A atualização é manual: baixe e instale o `.xpi` da nova versão. O pacote não tem assinatura da Mozilla.
