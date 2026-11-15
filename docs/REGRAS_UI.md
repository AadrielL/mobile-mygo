# Regras de UI/UX Mobile-First & Padrões Visuais (Frente 01)

## 1. Breakpoints Oficiais

| Breakpoint | Faixa de Resolução | Comportamento de Layout |
| :--- | :--- | :--- |
| **Mobile S / M (Prioridade)** | `360px` – `414px` | Coluna única (`1fr`), zero scroll horizontal, barra inferior fixa (`60px`), modais estilo bottom-sheet/95% largura. |
| **Mobile L / Tablet Compacto** | `415px` – `767px` | Listagens renderizadas exclusivamente em **Cards Empilhados** (`.mobile-only-cards`). |
| **Desktop / Tablet Paisagem** | `>= 768px` | Sidebar lateral fixa (`230px`), tabelas técnicas completas (`.desktop-only-table`) e grids multi-colunas. |

---

## 2. Padrões de Cards Mobile (`< 768px`)

- **Substituição de Tabelas:** Toda tabela (`.desktop-only-table`) deve possuir um equivalente em cartões verticais empilhados (`.mobile-only-cards`) exibido abaixo de `768px`.
- **Prevenção de Quebra de Texto:** Nomes de clientes, endereços, e-mails e descrições técnicas devem aplicar `word-break: break-word` e `overflow-wrap: anywhere` para nunca estourar a largura do card em `360px`.
- **Ergonomia de Toque:**
  - Altura mínima de `44px` em todos os botões (`.app-btn`), inputs (`.app-input`) e selects (`.app-select`).
  - Teclado nativo otimizado via `inputMode="decimal"` e `inputMode="numeric"`.
- **Navegação Inferior Fixa:**
  - Barra fixa na base da tela (`< 768px`) com as 4 áreas principais (**Início**, **Novo Orçamento**, **Histórico** e **Perfil/Ferramentas**) e `padding-bottom` no container principal para não encobrir botões finais.

---

## 3. Proteção de VPS & Estados de Carregamento

- **Bloqueio de Duplo Clique (`isSubmitting`):** Botões de submissão ficam desabilitados (`disabled={isSubmitting}`) e alteram o rótulo para feedback ativo (`"Salvando..."`, `"Enviando..."`, `"Calculando..."`).
- **Debounce (400ms):** Filtros de busca textual aguardam `400ms` após a última digitação antes de filtrar ou requisitar dados.
- **Skeletons em CSS Puro:** Utilizar a classe `.skeleton-box` / `.skeleton-line` durante carregamentos de API em vez de telas em branco.
