# Fluxo Git e Checklist de Build — Frente 01

## 1. Padrão de Branches

Nunca realize commits ou pushes diretamente nas branches `main` ou `master`.

- **Novas funcionalidades / melhorias mobile:**
  ```bash
  git checkout -b feat/frente01-<nome-curto-da-tarefa>
  ```
- **Correções de bugs / quebras de layout:**
  ```bash
  git checkout -b fix/frente01-<nome-curto-da-tarefa>
  ```

---

## 2. Conventional Commits

Todos os commits devem seguir o padrão semântico:

- `feat(mobile): adapta listagem de orcamentos para cards responsivos`
- `fix(ui): remove largura fixa em px na tela de login em 360px`
- `perf(vps): adiciona debounce de 400ms e bloqueio isSubmitting`
- `docs(governanca): inicializa GEMINI.md e templates da frente 01`

---

## 3. Checklist Obrigatório de Build Antes do Push

Antes de executar `git push -u origin HEAD`, valide todos os itens abaixo:

- [ ] Executar `npm run build` e garantir **zero erros** de TypeScript ou empacotamento Vite.
- [ ] Inspecionar as telas alteradas nas larguras **360px** e **390px** (sem barra de rolagem horizontal).
- [ ] Confirmar que tabelas viram cards empilhados abaixo de `768px`.
- [ ] Confirmar que botões e inputs têm no mínimo `44px` de altura.
- [ ] Confirmar que formulários possuem trava `isSubmitting` contra cliques duplos.
- [ ] Preencher a descrição do Pull Request utilizando `.github/pull_request_template.md`.
