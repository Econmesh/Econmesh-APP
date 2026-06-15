# Prompt — Módulo de Oportunidades (Econmesh App)

Copie o conteúdo abaixo e cole no Cursor (modo Agent) para criar ou recriar o módulo completo de Oportunidades neste projeto.

---

## PROMPT

```
Crie um módulo completo de Oportunidades no projeto econmesh-app, funcionando como um marketplace B2B de economia circular.

Antes de implementar, explore o repositório e siga rigorosamente os padrões existentes — especialmente o módulo Companies (`apps/web/src/modules/companies/`) como referência de CRUD, páginas, serviços e formulários.

---

## Contexto do projeto

- Monorepo Turborepo: app Next.js 16 (App Router) em `apps/web`
- UI: shadcn/base-lyra em `packages/ui` (`@econmesh-app/ui`)
- Validação: Zod 4 (sem react-hook-form)
- Estado: useState + useEffect + useCallback (sem TanStack Query por enquanto)
- API externa em `NEXT_PUBLIC_API_URL` + `/api/v1`, cliente em `apps/web/src/services/api/client.ts`
- Formulários: controlled state + `schema.safeParse()` + `useFormErrors` de `modules/auth/components/auth-form.tsx`
- Textos da interface em português (pt-BR)
- Rotas protegidas em `app/(dashboard)/dashboard/`
- Nav item já existe em `modules/dashboard/constants/nav-items.ts` → `/dashboard/oportunidades`

---

## Conceito de negócio

O módulo permite que empresas publiquem oportunidades relacionadas à economia circular. Uma oportunidade pode representar:

- Oferta de um material
- Demanda por um material
- Compartilhamento de ativos ou espaços

O comportamento deve ser semelhante a um marketplace/e-commerce, onde usuários podem pesquisar, filtrar e visualizar oportunidades.

---

## Tipos de oportunidade (campo obrigatório: `opportunity_type`)

| Valor API | Label UI | Descrição |
|-----------|----------|-----------|
| `comercializacao` | Comercialização | Compra ou venda pontual de resíduos, matérias-primas ou subprodutos. Ex.: Empresa vende 10 toneladas de PET. |
| `simbiose_industrial` | Simbiose Industrial | Conexão contínua entre empresas para troca permanente de materiais ou recursos. |
| `compartilhamento` | Compartilhamento | Compartilhamento ou aluguel de ativos físicos (máquinas, equipamentos, galpões, espaços industriais, caminhões, laboratórios). |

Campo adicional obrigatório: `offer_demand`

| Valor API | Label UI |
|-----------|----------|
| `gerador` | Gerador (Oferta) |
| `receptor` | Receptor (Demanda) |

---

## Cadastro da oportunidade — formulário completo

Criar formulário de create/edit com os campos:

| Campo | Tipo UI | Regras / Observações |
|-------|---------|----------------------|
| `company_id` | Select (empresas do usuário via `companiesService.list()`) | Obrigatório no create; desabilitado no edit |
| `title` | Input | Obrigatório, 3–200 chars. Ex.: "Venda de PET Triturado" |
| `description` | Textarea | Obrigatório, min 20 chars. Origem, aplicação, observações |
| `opportunity_type` | Select | Obrigatório. Mostrar descrição do tipo selecionado |
| `offer_demand` | Select | Obrigatório |
| `category` | Select + tooltip | Tooltip: "Classificação macro que define o setor industrial." Opções: Plástico, Metal, Vidro, Biomassa, Papel, Borracha, Madeira, Têxtil, Químico, Eletrônico, Construção, Alimentos, Outros |
| `technical_detail` | Input com autocomplete | Tooltip: "Classificação química ou técnica exata do material." Sugestões: PET, PEAD, PP, PVC, Aço Inox 304, etc. Preparado para futuras integrações |
| `purity_percent` | Input number | Tooltip: "Percentual do material principal em relação aos contaminantes." Aceitar 0–100 ou vazio |
| `physical_state` | Select + tooltip | Tooltip: "Acondicionamento volumétrico do material." Opções: Fardos prensados, Triturado (Flakes), Granulado, A granel, Líquido, Pó, Big Bag, Sacaria, Peças, Equipamento, Espaço |
| `periodicity` | Select | `continua` ou `esporadica` |
| `quantity` | Input number | Obrigatório, > 0 |
| `unit` | Select | kg, tonelada, litro, m³, unidade, saco, fardo, hora, mês |
| `price` | Input monetário (formato pt-BR) | Desabilitado quando `price_negotiable` = true |
| `price_negotiable` | Checkbox | Label: "Preço a combinar" |
| `city` | Input | Obrigatório |
| `state` | Select (UFs brasileiras) | Obrigatório. Preparar estrutura para futura geolocalização (`latitude`, `longitude` nos types) |
| `images` | Upload múltiplo | Até 5 imagens. Preview, remoção, definir imagem principal (badge "Principal") |

Validação Zod em `modules/opportunities/schemas.ts` com `normalizeOpportunityPayload()`.

---

## Listagem (marketplace)

Tela em `/dashboard/oportunidades` estilo e-commerce.

### Card — exibir:
- Imagem principal (ou placeholder)
- Título
- Categoria
- Cidade e estado
- Quantidade + unidade
- Valor (ou "A combinar")
- Tipo da oportunidade (badge)
- Oferta ou demanda (badge)
- Empresa responsável

### Busca em tempo real (debounce 300ms)
Pesquisar por: título, descrição, categoria, detalhe técnico (parâmetro `q` na API).

### Filtros combináveis (sidebar desktop + drawer mobile):
- Tipo (`opportunity_type`)
- Oferta/Demanda (`offer_demand`)
- Categoria
- Estado
- Cidade
- Periodicidade
- Faixa de preço (min/max)
- Faixa de quantidade (min/max)

### Ordenação:
- Mais recentes (`newest`) — padrão
- Mais antigos (`oldest`)
- Menor preço (`price_asc`)
- Maior preço (`price_desc`)
- Maior quantidade (`quantity_desc`)

### UX da listagem:
- Grid responsivo de cards
- Skeleton loading
- Infinite scroll (Intersection Observer) + botão "Carregar mais"
- Empty state quando sem resultados
- Contador "X oportunidades encontradas"
- Botão "Publicar oportunidade" → `/dashboard/oportunidades/nova`

---

## Página de detalhes (`/dashboard/oportunidades/[id]`)

Exibir:
- Galeria de imagens (thumbnail selector)
- Título
- Empresa
- Descrição
- Categoria, detalhe técnico, pureza, estado físico
- Periodicidade, quantidade, unidade, valor
- Cidade, estado
- Data de publicação
- Tipo da oportunidade e oferta/demanda (badges)

### Ações:
- **Visitante:** botão "Entrar em contato" → toast informando integração futura com chat
- **Dono** (`user.id === opportunity.owner_user_id`): botões Editar e Excluir

---

## Rotas a criar

```
app/(dashboard)/dashboard/oportunidades/
├── page.tsx                    # Listagem marketplace
├── nova/page.tsx               # Create
└── [id]/
    ├── page.tsx                # Detail
    └── editar/page.tsx         # Edit
```

Páginas thin (client components): carregam dados via service, delegam UI aos componentes do módulo, usam `toast` + `useRouter`.

Para rotas dinâmicas com typed routes do Next.js, usar `import type { Route } from "next"` e cast quando necessário: `as Route`.

---

## Estrutura de arquivos esperada

```
apps/web/src/
├── types/api.ts                          # Adicionar tipos Opportunity*
├── services/opportunities/
│   ├── opportunities.service.ts          # API real + toggle mock
│   └── opportunities.mock.ts             # Mock localStorage para dev
├── modules/opportunities/
│   ├── constants.ts
│   ├── schemas.ts
│   ├── utils.ts                          # filtros, ordenação, paginação client-side (mock)
│   ├── hooks/
│   │   ├── use-debounced-value.ts
│   │   └── use-opportunities.ts
│   └── components/
│       ├── opportunity-card.tsx
│       ├── opportunity-card-skeleton.tsx
│       ├── opportunity-list.tsx
│       ├── opportunity-filters.tsx
│       ├── opportunity-form.tsx
│       ├── opportunity-detail-view.tsx
│       ├── opportunity-image-upload.tsx
│       ├── technical-detail-input.tsx
│       ├── form-field-tooltip.tsx
│       └── delete-opportunity-dialog.tsx
└── app/(dashboard)/dashboard/oportunidades/  # páginas

packages/ui/src/components/
├── textarea.tsx    # criar se não existir
├── select.tsx      # native select estilizado
└── badge.tsx       # badges para tipo/oferta
```

---

## Contratos de API (`types/api.ts`)

```typescript
export type OpportunityType = "comercializacao" | "simbiose_industrial" | "compartilhamento";
export type OfferDemand = "gerador" | "receptor";
export type OpportunityPeriodicity = "continua" | "esporadica";
export type OpportunitySort = "newest" | "oldest" | "price_asc" | "price_desc" | "quantity_desc";

export interface OpportunityImage {
  storage_key: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Opportunity {
  id: string;
  company_id: string;
  company_name: string;
  owner_user_id: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  offer_demand: OfferDemand;
  category: string;
  technical_detail: string;
  purity_percent: number | null;
  physical_state: string;
  periodicity: OpportunityPeriodicity;
  quantity: number;
  unit: string;
  price: number | null;
  price_negotiable: boolean;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  images: OpportunityImage[];
  created_at: string;
  updated_at: string;
}

export interface OpportunityListParams {
  page?: number;
  page_size?: number;
  q?: string;
  opportunity_type?: OpportunityType;
  offer_demand?: OfferDemand;
  category?: string;
  state?: string;
  city?: string;
  periodicity?: OpportunityPeriodicity;
  price_min?: number;
  price_max?: number;
  quantity_min?: number;
  quantity_max?: number;
  sort?: OpportunitySort;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
```

---

## Endpoints da API (`opportunities.service.ts`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/opportunities?{query}` | Listagem paginada com filtros |
| GET | `/opportunities/:id` | Detalhe |
| POST | `/opportunities` | Criar |
| PATCH | `/opportunities/:id` | Atualizar |
| DELETE | `/opportunities/:id` | Excluir |
| POST | `/opportunities/images/presign` | Presign para upload de imagem |
| PUT | `{upload_url}` | Upload direto ao storage |

Padrão de upload igual ao de logo de empresa (`companiesService.uploadLogo`).

---

## Mock para desenvolvimento

Como a API pode não existir ainda, implementar `opportunities.mock.ts`:

- Persistência em `localStorage` (chave: `econmesh_opportunities_mock`)
- Seed com 6 oportunidades de exemplo (PET, aço inox, galpão, biomassa, máquina têxtil, vidro)
- Filtros, ordenação e paginação client-side reutilizando `modules/opportunities/utils.ts`
- Toggle via env: `NEXT_PUBLIC_OPPORTUNITIES_MOCK !== "false"` (mock ativo por padrão)

```typescript
export const opportunitiesService = USE_MOCK ? opportunitiesMockService : apiService;
```

Para produção/API real: `NEXT_PUBLIC_OPPORTUNITIES_MOCK=false`

---

## Padrões de código obrigatórios

1. **Formulários:** `FormField` / `FormInput` / `useFormErrors` + Zod + `ApiError` + `getValidationFieldErrors`
2. **Serviços:** objeto com métodos (`list`, `get`, `create`, `update`, `delete`, `uploadImage`)
3. **Componentes:** `"use client"` quando necessário; props fortemente tipadas
4. **Estilo:** `rounded-xl border border-border/80 bg-card/80`, grid responsivo, badges coloridos
5. **Feedback:** Sonner toasts, `EmptyState`, `Skeleton`
6. **Imagens:** `next/image` com `unoptimized` para URLs externas/mock
7. **Acessibilidade:** labels, aria-invalid, roles em dialogs
8. **Preparado para futuro:** chat (botão contato), favoritos, notificações, recomendações IA, geolocalização — sem implementar agora, apenas estrutura extensível

---

## Componentes reutilizáveis a criar

### `FormFieldWithTooltip`
Label + ícone HelpCircle + tooltip hover/focus com texto explicativo.

### `TechnicalDetailInput`
Input com dropdown de sugestões filtradas (`TECHNICAL_DETAIL_SUGGESTIONS`).

### `OpportunityImageUpload`
- Máx. 5 imagens
- Preview em grid
- Botão estrela para imagem principal
- Botão lixeira para remover
- Upload via `opportunitiesService.uploadImage`

### `OpportunityFilters`
Sidebar fixa (lg+) e drawer fullscreen (mobile) com todos os filtros + ordenação.

### `DeleteOpportunityDialog`
Modal de confirmação (mesmo padrão de `delete-company-dialog.tsx`).

---

## Checklist de entrega

- [ ] Tipos em `types/api.ts`
- [ ] Service API + mock com toggle
- [ ] `constants.ts`, `schemas.ts`, `utils.ts`
- [ ] Hooks `useDebouncedValue` e `useOpportunities`
- [ ] Todos os componentes listados
- [ ] 4 rotas funcionais
- [ ] Listagem com busca, filtros, ordenação e infinite scroll
- [ ] Formulário create/edit com validação completa
- [ ] Detalhe com galeria e ações por ownership
- [ ] Componentes UI (`textarea`, `select`, `badge`) em `packages/ui` se ausentes
- [ ] TypeScript sem erros (`npx tsc --noEmit` em `apps/web`)
- [ ] Textos em português
- [ ] Código limpo, modular e fortemente tipado

Não criar commits nem documentação extra além do código. Implementar tudo de uma vez, funcional e consistente com o restante do aplicativo.
```

---

## Como usar

1. Abra o Cursor no repositório `econmesh-app`
2. Ative o modo **Agent**
3. Copie todo o conteúdo dentro do bloco de código acima (entre as linhas do PROMPT)
4. Cole no chat e execute

## Variante para API backend

Se o objetivo for criar o backend (`econmesh-api`) em vez do frontend, adicione ao final do prompt:

```
Implemente no backend (econmesh-api) os endpoints REST descritos acima, com validação espelhando os schemas Zod do frontend. O frontend já consome esses contratos — alinhe nomes de campos e enums exatamente como definido em types/api.ts.
```

## Variante para recriar em outro branch/projeto

Adicione:

```
O módulo Companies em apps/web/src/modules/companies/ é a referência principal. Replique a mesma arquitetura, convenções de nomenclatura, padrões de página e tratamento de erros.
```
