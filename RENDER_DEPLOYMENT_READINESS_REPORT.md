# Render Deployment Readiness Report — Campfire

## 1. Executive Summary

Campfire e um MVP full-stack com frontend React/Vite/TypeScript e backend FastAPI/Python, usando PostgreSQL, SQLAlchemy async, asyncpg e Alembic. A arquitetura real bate com a hipotese principal: `apps/web` e uma SPA estatica e `apps/api` e uma API standalone.

Render e uma boa plataforma para este MVP, com esta arquitetura:

```text
Render Static Site
  -> Render Web Service FastAPI
  -> Render PostgreSQL
```

O app e deployavel, mas eu nao colocaria em producao sem tres ajustes antes:

| Bloqueador | Evidencia | Acao |
|---|---|---|
| URL do Postgres do Render nao casa diretamente com asyncpg | O app espera `postgresql+asyncpg://...` em `apps/api/src/campfire_api/settings.py`; Render fornece URL interna no formato `postgresql://...` segundo a doc de Render Postgres. | Normalizar a URL no codigo ou configurar manualmente `DATABASE_URL` com `postgresql+asyncpg://...`. |
| Seed de usuario demo entra via migration | `apps/api/alembic/versions/0002_seed_ada.py` insere `ada@campfire.test` com credencial conhecida. | Remover da cadeia antes do primeiro deploy real ou adicionar migration que remove/desativa o usuario demo. |
| Exemplos de env estao ignorados pelo Git | `.gitignore` ignora `.env*`; `apps/api/.env.example` e `apps/web/.env.local.example` existem localmente, mas nao estao versionados. | Ajustar `.gitignore` e versionar exemplos sem segredos. |

Estrategia recomendada: primeiro deploy manual pelo Render Dashboard, com backend pago minimo para usar pre-deploy migrations com seguranca; depois migrar para `render.yaml`.

## 2. Repository Diagnosis

| Area | Diagnostico |
|---|---|
| Stack | Frontend React 19 + Vite 8 + TS 5 no `package.json`. Backend Python `>=3.12,<3.13`, FastAPI, SQLAlchemy, asyncpg, Alembic, uvicorn em `apps/api/pyproject.toml`. |
| Frontend | SPA Vite. Build real: `npm run build` passou e gerou `apps/web/dist`. Script em `package.json`. |
| Backend | FastAPI app em `apps/api/src/campfire_api/main.py`, com rotas `/healthz`, `/readyz`, auth e repertoire. |
| Banco | PostgreSQL obrigatorio: docker local so tem Postgres 16 em `docker-compose.yml`; runtime usa `create_async_engine` com `DATABASE_URL`. |
| Migracoes | Alembic head e `0004_remove_identity_preferences`; migration `0004` e destrutiva para preferences e `users.first_login`. |
| API externa | Deezer via `httpx` para `{DEEZER_BASE_URL}/search` em `deezer_song_catalog.py`. |
| Integracao frontend-backend | O cliente usa `VITE_API_URL`, default `localhost:8000`, em `apps/web/src/api/client.ts`. Repertoire tambem chama API real, mas tem um `fetch` direto em `repertoire.api.ts`. |
| Mocks | Repertoire so usa mock se `VITE_API_URL === "mock://repertoire"` em `repertoire.store.ts`. |
| Ausentes | Root `README.md`, `render.yaml`, Dockerfile, `.github/workflows` e `apps/web/package.json` nao foram encontrados. Nenhum e obrigatorio para Render, mas `render.yaml`, CI e docs de deploy sao recomendaveis. |
| Validacao local | Frontend build passou. Backend importou e expos `/healthz`, `/readyz`, `/me`. Unit tests: `78 passed`. `ruff check` falha com 37 issues. Migracoes contra Postgres nao foram validadas porque o Docker daemon local nao estava ativo. |

## 3. Recommended Render Architecture

Estado local atual:

```text
Browser
  -> React/Vite frontend em apps/web
  -> FastAPI backend em apps/api
  -> PostgreSQL 16 via docker-compose
```

Render recomendado:

```text
Render Static Site: campfire-web
  VITE_API_URL=https://campfire-api.onrender.com
    -> Render Web Service: campfire-api
         DATABASE_URL=postgresql+asyncpg://...
         CORS_ORIGINS=https://campfire-web.onrender.com
           -> Render PostgreSQL: campfire-db, mesma regiao do backend
```

Render confirma que Static Sites servem frontends via CDN e aceitam redirects/rewrites no Dashboard. Web Services precisam escutar em `0.0.0.0` e preferencialmente no `$PORT`. Render Postgres deve ser acessado por URL interna na mesma regiao.

Fontes oficiais:

- Render Static Sites: <https://render.com/docs/static-sites>
- Render Redirects/Rewrites: <https://render.com/docs/redirects-rewrites>
- Render Web Services: <https://render.com/docs/web-services>
- Deploy FastAPI on Render: <https://render.com/docs/deploy-fastapi>
- Render Postgres: <https://render.com/docs/databases>

## 4. Required Code and Configuration Changes

| Priority | Change | File/Path | Required? | Reason | Suggested Implementation | Risk if Ignored |
|---|---|---|---|---|---|---|
| Required before deploy | Ajustar `DATABASE_URL` para Render | `apps/api/src/campfire_api/settings.py` | Sim | Render fornece `postgresql://`, app espera `postgresql+asyncpg://`. | Adicionar normalizador para `postgresql://` -> `postgresql+asyncpg://` ou configurar manualmente a URL ja normalizada. | Backend e Alembic podem falhar ao conectar. |
| Required before production | Remover seed demo | `apps/api/alembic/versions/0002_seed_ada.py` | Sim para publico | Migration cria usuario demo com hash conhecido. | Como app ainda nao foi deployado, reescrever migration ou criar `0005_remove_demo_seed`. | Conta conhecida em producao. |
| Required before deploy | Definir Python do Render | Backend env | Sim | Render default atual pode nao respeitar `>=3.12,<3.13` sem configuracao explicita. | `PYTHON_VERSION=3.12.3` ou adicionar `.python-version` em `apps/api`. | Build falha por versao incompatvel. |
| Required before deploy | Comando de producao sem reload | Render backend | Sim | `make run` usa `--reload` e porta 8000. | `uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT`. | Render nao roteia ou processo fica em modo dev. |
| Required before deploy | Versionar env examples | `.gitignore`, env examples | Sim | `.env*` ignora exemplos. | Trocar para ignorar `.env`/`.env.local` e permitir `!.env.example`, `!.env.local.example`. | Deploy depende de conhecimento local nao versionado. |
| Strongly recommended | Centralizar fetch do repertoire | `apps/web/src/features/repertoire/api/repertoire.api.ts` | Forte | `addOrUpdateEntry` bypassa `request()`, refresh/retry e credentials. | Fazer `request<Entry>` retornar tambem header/action ou adicionar helper no cliente. | Sessoes expiram em fluxo de adicionar musica. |
| Strongly recommended | Cookie policy configuravel | `auth.py`, settings | Forte | Cookie hardcoded `SameSite=Lax`, `Secure` so com `ENV=prod`. | Adicionar `REFRESH_COOKIE_SAMESITE`, manter `Secure=true` em prod, usar dominio customizado compartilhado. | Login/refresh pode falhar entre dominios distintos. |
| Strongly recommended | Corrigir CORS app factory | `main.py` | Forte | Se houver loop rodando, origens viram localhost. | Resolver settings de forma sincrona no construtor ou instanciar `EnvSettings` diretamente. | CORS incorreto em testes/contexts async. |
| Strongly recommended | Corrigir lint | `apps/api/src`, `tests` | Forte | `ruff check` falhou com 37 issues. | Rodar `ruff check --fix`, revisar nao-fixaveis. | CI/deploy gates futuros quebram. |
| Optional for MVP | `render.yaml` | raiz | Opcional primeiro deploy | Dashboard e mais simples; Blueprint melhora reprodutibilidade. | Adicionar depois do deploy manual estabilizado. | Drift de configuracao. |
| Future improvement | Pool config | persistence engine | Futuro | SQLAlchemy usa defaults com `pool_pre_ping=True`. | Configurar pool size conforme plano Render. | Excesso de conexoes ao escalar. |

## 5. Environment Variable Inventory

| Variable | Service | Required? | Production Recommendation | Render Configuration Location | Notes |
|---|---|---|---|---|---|
| `DATABASE_URL` | API | Sim | URL interna Render Postgres convertida para `postgresql+asyncpg://...` | API env | Codigo le em `settings.py`. |
| `PYTHON_VERSION` | API | Sim | `3.12.3` | API env | Necessario por `requires-python >=3.12,<3.13`. |
| `UV_VERSION` | API | Opcional | Fixar versao, ex. `0.11.7` | API env | Render suporta versionar uv. |
| `ACCESS_TOKEN_TTL_SECONDS` | API | Sim | `900` | API env/env group | Default local ja e 900. |
| `REFRESH_TOKEN_TTL_SECONDS` | API | Sim | `1209600` ou menor se MVP publico | API env/env group | Cookie max-age. |
| `CORS_ORIGINS` | API | Sim | URL exata do Static Site e dominio customizado | API env | Nao usar `*`; codigo rejeita com credentials. |
| `GOOGLE_STUB_ENABLED` | API | Sim | `false` em producao publica; `true` so demo fechado | API env | Endpoint existe em `/auth/google-stub`. |
| `RATE_LIMIT_PER_WINDOW` | API | Sim | Comecar `10` | API env | Limiter e em memoria, por instancia. |
| `RATE_LIMIT_WINDOW_SECONDS` | API | Sim | `300` | API env | Idem. |
| `LOG_LEVEL` | API | Opcional | `INFO` | API env | Usado no lifespan. |
| `ENV` | API | Sim | `prod` | API env | Liga cookie `Secure`. |
| `REFRESH_COOKIE_NAME` | API | Opcional | `campfire_refresh` | API env | Pode diferenciar staging/prod. |
| `REFRESH_COOKIE_DOMAIN` | API | Condicional | vazio para `*.onrender.com`; `.seudominio.com` com dominio customizado | API env | So use se API e web compartilharem parent domain. |
| `DEEZER_BASE_URL` | API | Sim | `https://api.deezer.com` | API env | Sem API key no codigo atual. |
| `SEARCH_CACHE_TTL_SECONDS` | API | Opcional | `60` | API env | Cache em memoria. |
| `SEARCH_CACHE_MAX_ENTRIES` | API | Opcional | `1024` | API env | Por instancia. |
| `SEARCH_RATE_LIMIT_PER_WINDOW` | API | Sim | `30` | API env | Busca Deezer. |
| `SEARCH_RATE_LIMIT_WINDOW_SECONDS` | API | Sim | `60` | API env | Busca Deezer. |
| `PORT` | API | Automatico | usar `$PORT` no start command | Render default | Render recomenda bind no `$PORT`. |
| `VITE_API_URL` | Web | Sim | URL publica HTTPS da API | Static Site env | Usado em build time pelo Vite. |
| `VITE_AUTH_FALLBACK` | Web | Nao | Nao configurar | Static Site env | Fallback sessionStorage parece incompleto e tem risco XSS. |
| `NODE_VERSION` | Web | Recomendado | Fixar versao compativel com Vite 8, ex. Node 24 usado localmente | Static Site env | Evita drift do runtime Node. |
| `JWT_SECRET` | API | Nao atualmente | Remover do example ou implementar JWT de fato | Nenhum | Aparece no `.env.example` local, mas nao e usado. Tokens sao opacos. |

## 6. Frontend Deployment Plan

| Item | Valor |
|---|---|
| Service type | Render Static Site |
| Root directory | Repositorio raiz, porque nao ha `apps/web/package.json` |
| Build command | `npm ci && npm run build` |
| Publish directory | `apps/web/dist` |
| Env vars | `VITE_API_URL=https://<api>.onrender.com`; opcional `NODE_VERSION` |
| Rewrite rule | `/*` -> `/index.html`, action `Rewrite` |
| Custom domain | Recomendado antes de producao real para melhorar politica de cookies |

A SPA precisa rewrite porque ha rota `/repertoire`; Render documenta rewrite `/*` para `/index.html` para apps com client-side routing.

Validacao: abrir `/`, `/repertoire`, refresh em `/repertoire`, login, adicionar musica, remover musica.

## 7. Backend Deployment Plan

| Item | Valor |
|---|---|
| Service type | Render Web Service, Python 3 |
| Root directory | `apps/api` |
| Build command | `uv sync --frozen --no-dev` |
| Pre-deploy command | `uv run alembic upgrade head` em servico pago |
| Start command | `uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT` |
| Healthcheck path | `/readyz` se quiser verificar DB; `/healthz` se quiser so liveness |
| Env vars | tabela da secao 5 |
| Docker | Nao necessario |

Render recomenda FastAPI com `uvicorn main:app --host 0.0.0.0 --port $PORT`. Para deploys, Render separa build, pre-deploy e start; pre-deploy e recomendado para migrations, mas so esta disponivel para servicos pagos.

Nao recomendo colocar migration no start command como padrao.

| Estrategia | Uso |
|---|---|
| Pre-deploy command | Melhor para MVP serio/pago; falha antes de trocar trafego. |
| Manual one-off | Aceitavel no primeiro deploy se voce controlar a janela. |
| Start command com `alembic && uvicorn` | So fallback para demo/free; pode rodar em restart e mistura lifecycle de schema com boot. |

## 8. PostgreSQL and Migration Plan

Render Postgres deve ficar na mesma regiao do backend. A doc recomenda URL interna para servicos na mesma regiao por latencia e rede privada; Static Sites nao participam da private network, mas nao precisam falar com o banco.

Plano:

1. Criar `campfire-db` no Render Postgres.
2. Copiar Internal Database URL.
3. Converter para `postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DB` ou implementar normalizacao no codigo.
4. Configurar `DATABASE_URL` no backend.
5. Rodar `uv run alembic upgrade head`.
6. Validar `/readyz`.
7. Remover/desativar seed Ada antes de producao publica.

Backups: para producao, usar plano pago. Render informa PITR em bases pagas, com janela conforme plano, e free Postgres expira em 30 dias. Antes de migration destrutiva, exportar backup ou criar staging.

Seed policy: `scripts/seed.py` so roda `alembic upgrade head`, entao hoje "seed" e uma migration, nao um seed opcional. Isso deve mudar antes de producao.

## 9. Render Dashboard vs render.yaml

| Opcao | Pros | Contras | Recomendacao |
|---|---|---|---|
| Dashboard manual | Mais rapido, bom para primeiro MVP, facil corrigir envs sensiveis | Drift de configuracao | Recomendo primeiro. |
| `render.yaml` | Infra versionada, bom para monorepo e preview envs | Mais sensivel ao problema `DATABASE_URL`; segredos ficam como placeholders | Adotar depois do primeiro deploy estavel. |

Draft futuro, apos normalizar `DATABASE_URL` no codigo:

```yaml
services:
  - type: web
    name: campfire-api
    runtime: python
    rootDir: apps/api
    buildCommand: uv sync --frozen --no-dev
    preDeployCommand: uv run alembic upgrade head
    startCommand: uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /readyz
    envVars:
      - key: PYTHON_VERSION
        value: 3.12.3
      - key: ENV
        value: prod
      - key: DATABASE_URL
        fromDatabase:
          name: campfire-db
          property: connectionString
      - key: CORS_ORIGINS
        sync: false
      - key: GOOGLE_STUB_ENABLED
        value: false

  - type: static
    name: campfire-web
    buildCommand: npm ci && npm run build
    staticPublishPath: apps/web/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        sync: false

databases:
  - name: campfire-db
    databaseName: campfire
    user: campfire
```

Render documenta `rootDir`, `staticPublishPath`, `healthCheckPath` e Blueprints em:

- Monorepo Support: <https://render.com/docs/monorepo-support>
- Blueprint YAML Reference: <https://render.com/docs/blueprint-spec>

## 10. Complete Step-by-Step Deployment Guide

### Phase 1 — Repository Preparation

1. Corrigir `.gitignore` para versionar `.env.example`.
2. Remover `JWT_SECRET` do example ou marcar como nao usado.
3. Adicionar `PYTHON_VERSION=3.12.3` a configuracao Render.
4. Corrigir/decidir seed Ada.
5. Normalizar `DATABASE_URL` ou documentar conversao manual para asyncpg.
6. Trocar o `fetch` direto de repertoire para o cliente central.
7. Definir cookie/CORS para o dominio escolhido.
8. Rodar local:
   - `npm run build`
   - `cd apps/api && uv run pytest -m unit tests/unit`
   - `cd apps/api && uv run ruff check src tests scripts`
   - com Postgres ativo: `uv run alembic upgrade head` e testes integration.

### Phase 2 — Create Render PostgreSQL

1. Render Dashboard > New > Postgres.
2. Nome: `campfire-db`.
3. Regiao: a mesma do backend, idealmente Virginia/Ohio/Oregon para publico US.
4. Plano: pago para producao; free so para teste por expirar em 30 dias.
5. Guardar Internal Database URL.
6. Converter para `postgresql+asyncpg://...`.

### Phase 3 — Deploy FastAPI Backend

1. New > Web Service.
2. Repo/branch do Campfire.
3. Root Directory: `apps/api`.
4. Runtime: Python 3.
5. Build Command: `uv sync --frozen --no-dev`.
6. Start Command: `uv run uvicorn campfire_api.main:app --host 0.0.0.0 --port $PORT`.
7. Pre-deploy: `uv run alembic upgrade head` se plano pago.
8. Env vars conforme secao 5.
9. Health Check Path: `/readyz`.
10. Deploy.
11. Validar:
    - `https://<api>.onrender.com/healthz`
    - `https://<api>.onrender.com/readyz`
    - logs sem erro de DB.

### Phase 4 — Deploy Frontend

1. New > Static Site.
2. Root Directory: vazio/raiz.
3. Build Command: `npm ci && npm run build`.
4. Publish Directory: `apps/web/dist`.
5. Env var: `VITE_API_URL=https://<api>.onrender.com`.
6. Rewrite rule: source `/*`, destination `/index.html`, action `Rewrite`.
7. Deploy.
8. Validar rota `/repertoire` com refresh.

### Phase 5 — Connect Frontend and Backend

1. Atualizar API `CORS_ORIGINS=https://<web>.onrender.com`.
2. Se usar dominio customizado: incluir tambem `https://app.seudominio.com`.
3. Validar login, refresh e logout em HTTPS.
4. Testar busca Deezer.
5. Testar CRUD de repertoire.
6. Revisar cookies no browser: `HttpOnly`, `Secure`, path `/auth/refresh`.

### Phase 6 — Production Hardening

1. Usar plano pago para API e DB.
2. Ativar backups/PITR do banco.
3. Configurar dominio customizado e TLS; Render fornece TLS gerenciado e redirect HTTP->HTTPS.
4. Criar staging separado.
5. Adicionar CI minimo: frontend build, backend unit, ruff, migrations em Postgres.
6. Documentar rollback; Render tem rollback por deploy anterior.
7. Configurar logs/alerts.
8. Desabilitar Google stub em producao publica.

### Phase 7 — Post-deploy Validation Checklist

- [ ] Frontend carrega.
- [ ] Refresh em `/repertoire` funciona.
- [ ] `/healthz` retorna 200.
- [ ] `/readyz` retorna 200.
- [ ] Migrations aplicadas.
- [ ] Login funciona.
- [ ] Refresh cookie funciona em HTTPS.
- [ ] CORS sem erro no console.
- [ ] Deezer search funciona.
- [ ] Repertoire CRUD funciona.
- [ ] Logs visiveis.
- [ ] Secrets nao aparecem em logs.
- [ ] Seed demo ausente ou intencionalmente controlada.
- [ ] Rollback conhecido.

## 11. Production Hardening Checklist

| Item | Status |
|---|---|
| Frontend build | Ready |
| Backend app import/start | Ready |
| PostgreSQL dependency identified | Ready |
| Health endpoints | Ready |
| Deezer integration | Ready |
| Render native deployment, no Docker | Ready |
| Env inventory | Partial |
| Env examples versioned | Missing |
| DB URL compatibility with Render | Partial |
| Migration strategy | Partial |
| Production seed policy | Missing |
| CI/CD | Missing |
| Backups | Missing until paid DB |
| Cookie/domain production policy | Partial |
| Background workers/cron/queues | Not applicable |
| Persistent disk | Not applicable |

## 12. Risks and Mitigations

| Risk | Probability | Impact | Mitigation | Priority |
|---|---|---|---|---|
| `DATABASE_URL` incompativel | Alta | Alto | Normalizar scheme ou configurar URL asyncpg | P0 |
| Usuario demo em producao | Alta se migrar como esta | Alto | Remover/desativar seed Ada | P0 |
| Cookie refresh falhar cross-domain | Media | Alto | Dominio customizado compartilhado ou SameSite configuravel | P1 |
| Migrations no start command | Media | Medio | Usar pre-deploy pago | P1 |
| Free tier causar cold starts/DB expirada | Alta em free | Alto | Paid Starter para API/DB | P1 |
| CORS preso em localhost em contexto async | Baixa em uvicorn, media em testes | Medio | Simplificar app factory | P2 |
| Lint falhando | Alta | Medio | Corrigir ruff antes de CI | P2 |
| Limiter/cache em memoria | Media ao escalar | Baixo para MVP | Aceitar para MVP, revisitar multi-instancia | P3 |

## 13. Final Recommendation

Render e um bom fit para este repositorio porque o app ja se separa naturalmente em Static Site, Web Service e Postgres. O caminho mais rapido e seguro e: corrigir `DATABASE_URL`, remover a seed Ada, versionar env examples, criar Postgres no Render, subir a API com pre-deploy migration e depois publicar o frontend como Static Site com rewrite SPA.

Nao vale overengineering agora: nao precisa Docker, Redis, worker, cron, Terraform, private service para API, nem disco persistente. Revisit apos validacao do MVP: `render.yaml`, staging, CI completo, preview environments, dominio customizado, politica de cookie mais robusta e pooling/conexoes conforme trafego.

## Fontes Render consultadas

- Static Sites: <https://render.com/docs/static-sites>
- Web Services: <https://render.com/docs/web-services>
- Deploy FastAPI: <https://render.com/docs/deploy-fastapi>
- PostgreSQL / Databases: <https://render.com/docs/databases>
- Redirects and Rewrites: <https://render.com/docs/redirects-rewrites>
- Monorepo Support: <https://render.com/docs/monorepo-support>
- Blueprint Spec: <https://render.com/docs/blueprint-spec>
- Environment Variables and Secrets: <https://render.com/docs/configure-environment-variables>
- Private Network: <https://render.com/docs/private-network>
- Deploys and Pre-Deploy Commands: <https://render.com/docs/deploys>
- PostgreSQL Backups: <https://render.com/docs/postgresql-backups>
- Free Plan: <https://render.com/free>
- Custom Domains: <https://render.com/docs/custom-domains>
- TLS: <https://render.com/docs/tls>
- Rollbacks: <https://render.com/docs/rollbacks>
- Python Version: <https://render.com/docs/python-version>
