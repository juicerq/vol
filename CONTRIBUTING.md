# Contribuir com o Vol

Para reportar um problema, abra uma [issue](https://github.com/juicerq/vol/issues) com navegador e versão, passos para reproduzir, resultado esperado e resultado observado. Se o problema depender de um player, inclua uma URL pública que permita reproduzi-lo, sem dados pessoais.

Para alterar o código, siga a [preparação local](README.md#desenvolver) e abra um pull request explicando o problema e o comportamento resultante. Mudanças na interface devem incluir uma captura ou vídeo.

Antes de enviar:

```sh
bun install --frozen-lockfile
bun run check
bun run lint
bun run xpi
bun run lint:extension
```

Ao alterar áudio ou persistência, confira manualmente duas abas do mesmo site com valores diferentes, uma nova aba em 100%, recarga, navegação, restauração da aba e players inseridos dinamicamente. Verifique se o volume original do player continua funcionando e como o popup comunica páginas restritas ou players sem amplificação.

Mantenha configurações locais e credenciais fora do repositório. `web-ext.config.ts` é ignorado pelo Git para permitir configurar o binário local do navegador.
