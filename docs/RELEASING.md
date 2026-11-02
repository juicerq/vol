# Publicar uma versão

1. Atualize `version` em `package.json` e documente mudanças e limitações relevantes.
2. Execute as checagens do README e verifique o pacote no navegador. Diferencie os navegadores e fluxos realmente validados dos ainda pendentes.
3. Envie a mudança para `main` e crie uma tag correspondente à versão, como `v0.1.2`.
4. Envie a tag ao GitHub. O workflow valida a correspondência entre tag e versão, executa as checagens e cria uma release em rascunho com o `.xpi` e o arquivo de fontes.
5. Revise as notas geradas, descreva a instalação e informe que o pacote não tem assinatura da Mozilla. Publique o rascunho quando estiver pronto.

O workflow usa somente o token do GitHub Actions. Não assina o pacote nem publica na loja da Mozilla. Não reutilize tags de versões já publicadas.

## Imagens da vitrine

As ilustrações do README ficam em `docs/images/`. Foram compostas a partir das cores, da fonte e do layout do projeto; a animação ilustra a independência entre abas e não é uma gravação de execução.

`docs/images/cover.png` também pode ser usada como imagem de compartilhamento nas configurações do repositório, em **Social preview**.
