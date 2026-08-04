# Tibia Statistics

Portal de estatísticas para o jogo Tibia. Monorepo com backend em Go e frontend em Next.js.

Funcionalidades:
- **Autenticação** com JWT (access + refresh token via cookie httpOnly) e roles (`user`/`admin`).
- **Estatísticas de mundos**: coleta periódica (poller) do número de jogadores online por mundo via TibiaData API, com gráficos de médias, série temporal e heatmap por hora do dia.
- **Highscores**: proxy autenticado para os rankings da TibiaData API.
- **Sessões de caça (hunting sessions)**: upload do JSON exportado pelo "Session Analyzer" do próprio jogo Tibia, com parsing automático de balance, XP, loot, criaturas mortas e itens looteados; permite comparar sessões e visualizar histórico.
- **Sprites de criaturas/itens**: resolve ícones de criaturas e itens (usados nas telas de hunting) consultando a TibiaWiki, com cache de 30 dias no banco.

> Nota: a maioria das telas do portal exige login (ver [Criar o usuário admin padrão](#5-criar-o-usuário-admin-padrão)).

## Stack

**Frontend** (`frontend/`)
- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- TanStack Query (data fetching/cache)
- Recharts (via componentes `chart` do shadcn/ui)

**Backend** (`backend/`)
- Go + chi (router)
- PostgreSQL + sqlc (queries type-safe) + pgx
- golang-migrate (migrations)
- JWT (access + refresh token) com bcrypt

**Fonte de dados**: [TibiaData API](https://tibiadata.com/docs/) (API pública não-oficial da comunidade).

## Pré-requisitos

- Node.js 22+ e pnpm (`corepack enable` já resolve a versão fixada em `package.json`)
- Go 1.26+
- PostgreSQL rodando localmente
- CLIs Go instaladas no `$GOPATH/bin` (adicione ao seu PATH):
  ```bash
  go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1
  go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@v4.19.1
  ```

## Setup

### 1. Instalar dependências do frontend

```bash
pnpm install
```

### 2. Banco de dados (backend)

Crie um banco e um usuário no Postgres local:

```bash
psql -U postgres -c "CREATE USER tibiastatistics WITH PASSWORD 'tibiastatistics' CREATEDB;"
psql -U postgres -c "CREATE DATABASE tibiastatistics OWNER tibiastatistics;"
```

Copie o arquivo de exemplo de variáveis de ambiente e ajuste se necessário:

```bash
cp backend/.env.example backend/.env
```

Carregue as variáveis (ex. `export $(cat backend/.env | xargs)` ou use um gerenciador como `direnv`) e rode as migrations:

```bash
migrate -path backend/db/migrations -database "$DATABASE_URL" up
```

### 3. Rodar o backend

```bash
pnpm dev:backend
```

Sobe em `http://localhost:8080`.

### 4. Rodar o frontend

Em outro terminal:

```bash
pnpm dev:frontend
```

Sobe em `http://localhost:3000`. Defina `NEXT_PUBLIC_API_URL` se o backend não estiver em `http://localhost:8080` (padrão já usado se a variável não for definida).

### 5. Criar o usuário admin padrão

O arquivo `backend/.env` já define `ADMIN_EMAIL` e `ADMIN_PASSWORD` (troque a senha antes de ir para produção). Rode:

```bash
cd backend
export $(grep -v '^#' .env | xargs)
go run ./cmd/seed-admin
```

O comando é idempotente: cria o usuário se não existir, ou atualiza a senha/role se já existir. Depois acesse `http://localhost:3000/login` com essas credenciais.

Usuários adicionais (role `user`) podem ser criados via API:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"voce@exemplo.com","password":"suasenha123"}'
```

## Scripts úteis (raiz)

| Script | Descrição |
|---|---|
| `pnpm dev:frontend` | Sobe o Next.js em modo dev |
| `pnpm build:frontend` | Build de produção do frontend |
| `pnpm lint:frontend` | Lint do frontend |
| `pnpm dev:backend` | Sobe o backend Go |
| `pnpm build:backend` | Compila o backend |
| `pnpm migrate:up` / `pnpm migrate:down` | Aplica/reverte migrations (requer `DATABASE_URL` no ambiente) |
| `pnpm sqlc:generate` | Regenera código Go a partir das queries SQL |
| `go run ./cmd/seed-admin` (dentro de `backend/`) | Cria/atualiza o usuário admin padrão a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD` |

## Estrutura

```
tibiastatistics/
├── frontend/    # Next.js App Router
│   ├── app/
│   │   ├── (auth)/login/       # tela de login
│   │   └── (portal)/           # rotas protegidas, layout com sidebar
│   ├── components/
│   ├── lib/                    # api-client, query-client, auth context
│   └── hooks/
└── backend/     # Go
    ├── cmd/
    │   ├── api/                  # entrypoint do servidor HTTP
    │   └── seed-admin/           # cria/atualiza o usuário admin padrão
    ├── internal/
    │   ├── auth/                # JWT, bcrypt, middleware
    │   ├── config/
    │   ├── database/            # pool pgx + código gerado pelo sqlc
    │   ├── handlers/
    │   ├── poller/               # coleta periódica de jogadores online + limpeza de retenção
    │   ├── router/
    │   ├── sprites/               # cliente da TibiaWiki (resolução de sprites)
    │   └── tibia/                # cliente da TibiaData API
    └── db/
        ├── migrations/
        └── queries/
```

### Convenção de tabelas

Toda tabela do banco segue o padrão de auditoria: `created_at`, `updated_at` (mantido automaticamente por trigger `set_updated_at`) e `deleted_at` (soft delete — queries de leitura filtram `deleted_at IS NULL`). A tabela `users` também tem uma coluna `role` (`user` | `admin`).

### Coleta de jogadores online (poller)

Uma goroutine em `internal/poller`, iniciada em `cmd/api/main.go`, roda a cada `POLLER_INTERVAL_MINUTES` (padrão 15 min): busca `GET /v4/worlds` na TibiaData API, filtra os mundos com `location` em `South America`/`North America` e `pvp_type` em `Optional PvP`/`Open PvP` (~51 mundos), e grava um snapshot (`world_player_snapshots`) por mundo. Na mesma execução, remove snapshots com mais de `SNAPSHOT_RETENTION_DAYS` (padrão 60 dias). Ambas as variáveis são opcionais no `.env`. É a única forma de popular dados de população — não há endpoint de backfill manual.

### Sessões de caça (hunting sessions)

O Tibia permite exportar o resumo de uma sessão de caça (o "Session Analyzer" do próprio cliente do jogo) como um arquivo JSON. O portal permite fazer upload desse arquivo em **Hunting** → **Import**; o backend (`POST /api/hunting/sessions`) faz o parse dos campos (formatados como `"1,234"`, `"01:08h"`, `"2026-08-03, 17:39:17"` etc., no formato bruto do jogo) e armazena balance, dano, cura, XP, loot, criaturas mortas e itens looteados. As telas de **Hunts** e **Compare** listam e comparam sessões salvas do usuário autenticado.

### Sprites de criaturas e itens

Para exibir os ícones de criaturas mortas e itens looteados nas telas de hunting, o backend resolve o nome (em minúsculas, como aparece no export do jogo) para uma URL de imagem consultando a TibiaWiki (`tibia.fandom.com`), convertendo o nome para o formato de título de arquivo usado lá (ex.: `"a gold coin"` → `Gold Coin.gif`). O resultado é cacheado por 30 dias na tabela `game_asset_sprites`, inclusive quando não encontrado (evita reconsultar a wiki repetidamente).

## Endpoints do backend

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cria usuário, retorna access token + cookie de refresh |
| POST | `/api/auth/login` | Autentica, retorna access token + cookie de refresh |
| POST | `/api/auth/refresh` | Renova access token a partir do cookie de refresh |
| POST | `/api/auth/logout` | Limpa o cookie de refresh |
| GET | `/api/tibia/highscores` | Proxy para a TibiaData API (requer Bearer token). Query params: `world`, `category`, `vocation`, `page` |
| GET | `/api/worlds/averages` | Média/mín/máx de jogadores online por mundo (requer Bearer token). Query params: `period` (`7`\|`14`\|`30`, padrão `7`), `location` e `pvp_type` (opcionais, filtro exato) |
| GET | `/api/worlds/timeseries` | Série temporal de jogadores online (requer Bearer token). Query params: `period`, `world` (opcional) |
| GET | `/api/worlds/hourly` | Média de jogadores online por hora do dia (UTC), usada no heatmap e no gráfico de linha por mundo (requer Bearer token). Query params: `period`, `world`, `location`, `pvp_type` (todos opcionais) |
| POST | `/api/hunting/sessions` | Importa uma sessão de caça (requer Bearer token). Multipart form: `file` (JSON exportado pelo jogo), `name`, `loadout` (opcional) |
| GET | `/api/hunting/sessions` | Lista as sessões de caça do usuário autenticado (requer Bearer token) |
| DELETE | `/api/hunting/sessions/{id}` | Remove (soft delete) uma sessão de caça do usuário autenticado (requer Bearer token) |
| GET | `/api/sprites` | Resolve URLs de imagem para criaturas/itens (requer Bearer token). Query params: `kind` (`creature`\|`item`), `names` (lista separada por vírgula) |

## Próximos passos sugeridos

- Tela de cadastro público (hoje só via API)
- Páginas de Personagens e Guilds no menu lateral (atualmente só o link existe)
- Cache/rate-limit no proxy da TibiaData API
- Testes automatizados (Go: `testing` + `httptest`; frontend: Vitest/Playwright)

## Para a IA / Claude Code

Veja [CLAUDE.md](CLAUDE.md) para arquitetura em mais detalhes, convenções do banco de dados e fluxo de autenticação do frontend.
