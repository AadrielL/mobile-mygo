# Regras Oficiais do Projeto — Antigravity & Gemini Pro (Frentes 01 e 02)

1. REGRAS DE NEGÓCIO (ORÇAMENTOS E MATERIAIS — FRENTE 02):
   - Todo orçamento pertence a um tenant (cidade) e a um profissional_id específico.
   - Nunca hardcode o telefone da distribuidora diretamente nos componentes visuais; leia da configuração do tenant (padrão inicial: Capital Elétrica - Palmas).
   - Sempre registre o evento de intenção de cotação no banco antes de redirecionar para o WhatsApp (`/api/materiais/cotacao-log`).
   - Respeite limites de segurança da VPS básica sem comprometer o fluxo gratuito principal (teto diário anti-abuso: 15 orçamentos/dia no plano FREE).

2. QUALIDADE DE CÓDIGO, MOBILE-FIRST & ECONOMIA DE VPS (FRENTE 01):
   - Arquitetura Dual: Angular na porta `4200` (PC/Desktop) e React + `@ionic/react` na porta `4201` (Mobile Nativo).
   - Valide valores numéricos (preços e quantidades >= 0) no frontend e no backend.
   - Mantenha compatibilidade total com telas mobile (360px+), botões e inputs com `min-height: 44px`, `inputMode` numérico/decimal, proteção `isSubmitting` contra clique duplo e `debounce` de 400ms em buscas.

3. FLUXO GIT E AUTOMATIZAÇÃO DE PR:
   - Nunca faça push direto na branch main/master.
   - Use branches no padrão: `feat/frente01-<nome-curto>` ou `feat/frente02-<nome-curto>`.
   - Antes do push, execute o build e verifique se não há erros de tipo ou lint.
   - Siga Conventional Commits e gere a descrição do PR usando `.github/pull_request_template.md`.
