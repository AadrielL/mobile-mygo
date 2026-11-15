# Regras Oficiais do Projeto — Antigravity & Gemini Pro (Frentes 01, 02 e 03)

1. REGRAS DE LOCALIDADE, VÍNCULO E RANKING (FRENTE 03):
   - Todo registro de cliente, profissional e pedido deve respeitar o isolamento por `tenant_id` (cidade/profissional).
   - Nunca crie lógica de "impulsionamento pago" ou destaque por assinatura no ranking de busca.
   - Respeite rigorosamente o vínculo de indicação (`?ref=`) quando o cliente vier pelo link de um eletricista (nunca exibir concorrentes).
   - Proteja a privacidade: exiba bairro/raio de atendimento, nunca o endereço residencial completo do profissional.
   - Sempre que alterar a fórmula de pontuação anti-panelinha ou os campos de localidade do multi-tenant, mantenha atualizado `docs/LOCALIDADE_E_RANKING.md`.

2. REGRAS DE NEGÓCIO (ORÇAMENTOS E MATERIAIS — FRENTE 02):
   - Todo orçamento pertence a um tenant (cidade) e a um `profissional_id` específico.
   - Nunca hardcode o telefone da distribuidora diretamente nos componentes visuais; leia da configuração do tenant (padrão inicial: Capital Elétrica - Palmas).
   - Sempre registre o evento de intenção de cotação no banco antes de redirecionar para o WhatsApp (`/api/materiais/cotacao-log`).
   - Respeite limites de segurança da VPS básica sem comprometer o fluxo gratuito principal (teto diário anti-abuso: 15 orçamentos/dia no plano FREE).

3. QUALIDADE DE CÓDIGO, MOBILE-FIRST & PERFORMANCE NA VPS BÁSICA (FRENTE 01):
   - Arquitetura Dual: Angular na porta `4200` (PC/Desktop) e React + `@ionic/react` na porta `4201` (Mobile Nativo).
   - Valide valores numéricos (preços e quantidades >= 0) no frontend e no backend.
   - Evite consultas pesadas de geolocalização em tempo real; priorize índice por cidade/bairro e cacheie respostas de CEP no cliente (`localStorage`) para não repetir chamadas externas.
   - Mantenha compatibilidade total com telas mobile (360px+), botões e inputs com `min-height: 44px`, `inputMode` numérico/decimal, proteção `isSubmitting` contra clique duplo e `debounce` de 400ms em buscas.

4. FLUXO GIT E AUTOMATIZAÇÃO DE PR:
   - Nunca faça commit ou push direto na branch `main`/`master`.
   - Crie branches no padrão: `feat/frente01-<nome-curto>`, `feat/frente02-<nome-curto>` ou `feat/frente03-<nome-curto>`.
   - Execute o build local antes do push e siga Conventional Commits.
   - Gere a descrição detalhada do PR usando `.github/pull_request_template.md`.
