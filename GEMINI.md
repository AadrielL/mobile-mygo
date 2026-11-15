# Diretrizes de Governança — MyGo React + Ionic (Frente 01: Mobile-First & Economia de VPS)

Este repositório segue regras estritas de engenharia Frontend focadas em usabilidade em campo para eletricistas e eficiência de recursos em servidor VPS.

## Regras Obrigatórias

1. **Infraestrutura e Arquitetura Dual (PC vs Mobile):**
   - **PC / Desktop:** Atendido pelo projeto Angular (`C:\meus projetos\front_mygo\orcamento-front`, porta `4200`).
   - **Mobile:** Atendido por este projeto React + **Ionic Framework (`@ionic/react`)** (`C:\meus projetos\front_mygo_react`, porta `4201`).
   - Projeto multi-tenant hospedado em VPS básica na Hostinger.
   - Preservar integralmente os cabeçalhos multi-tenant (`Authorization`, `X-User-Role`, `X-Tenant-ID`) em todas as chamadas para as APIs (8081, 8082 e 8083).

2. **Economia de Dependências e Bundle:**
   - **Exceção Aprovada pelo Usuário:** `@ionic/react` e `ionicons` aprovados como framework oficial para experiência nativa Mobile (iOS/Android).
   - Proibido instalar outras bibliotecas pesadas sem aprovação.
   - Utilizar CSS puro e componentes Ionic nativos leves para animações, skeletons de carregamento e gráficos leves.

3. **Mobile-First Obrigatório (Uso em Obra com Uma Mão):**
   - Projetar e validar primeiro para resoluções de **360px a 414px** (360px e 390px prioritários).
   - Proibido `width` fixo em `px` em containers que causem rolagem horizontal (`overflow-x`).
   - Tabelas de listagem (orçamentos salvos, serviços cadastrados pelo eletricista e lista de materiais) devem virar **cards verticais empilhados abaixo de 768px**, preservando o layout tabular apenas em desktop (`>= 768px`).
   - Botões de ação, selects e inputs devem ter **altura mínima de 44px** (`min-height: 44px`) e espaçamento confortável entre alvos de toque.
   - Campos numéricos devem usar `inputMode="decimal"` (valores monetários, metragem, bitola) ou `inputMode="numeric"` (CEP, telefone, quantidades inteiras, código de 6 dígitos).
   - Modais e janelas de confirmação devem ocupar até **95% da largura útil** no mobile com rolagem interna suave.

4. **Proteção de VPS e Rede Móvel Instável:**
   - Todo formulário e ação de mutação deve bloquear cliques duplos (`isSubmitting`) durante chamadas de API, exibindo feedback textual claro (ex: `"Salvando..."`, `"Calculando..."`).
   - Campos de busca e filtro devem aplicar **debounce de 400ms** para evitar disparos repetidos a cada tecla.

5. **Fluxo Git e Entrega:**
   - Nunca fazer commit/push direto na `main`/`master`.
   - Usar branches `feat/frente01-<tarefa>` ou `fix/frente01-<tarefa>`, seguir **Conventional Commits** e preencher `.github/pull_request_template.md`.
