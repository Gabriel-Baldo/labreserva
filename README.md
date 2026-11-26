# LabReserva

Sistema web para reserva de laboratórios de uma instituição de ensino. Projeto da disciplina de Arquitetura de Software (UTFPR).

Substitui planilhas e cadernos por uma agenda semanal com validação automática de conflitos, fluxo de aprovação por perfil e bloqueio de horários para manutenção.

## Stack

| Camada | Tecnologia |
|---|---|
| View | Next.js 15 (App Router), React 19, Tailwind CSS |
| Controller e Model | NestJS 11, Prisma 6, class-validator, JWT em cookie HttpOnly |
| Banco | PostgreSQL 16 |
| Infra | Docker, Docker Compose, GitHub Actions, Railway |

O Next.js repassa `/api/*` para a API (mesma origem, sem CORS). Somente a API acessa o banco.

## Como rodar com Docker

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec api npx prisma db seed
```

- Sistema: http://localhost:3000
- Documentação da API (Swagger): http://localhost:3001/api/docs

O `seed` cria as regras por perfil, as configurações, os usuários de demonstração, três laboratórios e algumas reservas da semana atual.

## Contas de demonstração

Todas usam a senha `aluno123`, definida em `SEED_PASSWORD` no `.env`. Rodar o `seed` de novo redefine a senha dessas contas.

É uma senha só para demonstração local. Troque `SEED_PASSWORD` e `JWT_SECRET` em qualquer ambiente exposto na internet.

| Perfil | E-mail |
|---|---|
| Administrador | admin@labreserva.local |
| Professor | professor@labreserva.local |
| Aluno | aluno@labreserva.local |
| Aluno | aluna@labreserva.local |

## Desenvolvimento local

```bash
docker compose up -d db
cd apps/api && npm ci && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
cd apps/web && npm ci && npm run dev
```

## Testes

```bash
cd apps/api
npm test
npm run test:cov
node test/fluxo.e2e.mjs
```

- `npm test`: testes unitários das regras de reserva e de disponibilidade (limites de duração, antecedência, funcionamento e sobreposição).
- `test/fluxo.e2e.mjs`: fluxo completo contra a API e o banco reais, com 30 verificações (regras por perfil, conflito, 6 pedidos simultâneos no mesmo horário, aprovação, recusa, cancelamento, bloqueios, 403, bloqueio de login). Precisa da API no ar e das variáveis `SEED_PASSWORD` e `API_URL`.
- `npm run telas` (na raiz, após `npm install`): percorre o sistema com o Playwright e salva as capturas em `docs/telas/`.

## Funcionalidades do MVP

| HU | Funcionalidade | Situação |
|---|---|---|
| HU01 | Login, logout e bloqueio após tentativas erradas | Completa |
| HU02 | Cadastrar e desativar usuários | Completa (edição pela API) |
| HU03 | Cadastrar laboratório | Completa |
| HU04 | Desativar laboratório, com aviso de reservas futuras | Completa (edição pela API) |
| HU05 | Bloquear horário para manutenção | Completa (remoção pela API) |
| HU06 | Agenda semanal por laboratório | Completa |
| HU08 | Solicitar reserva | Completa |
| HU09 | Minhas reservas (futuras e passadas) | Completa |
| HU10 | Cancelar reserva | Completa |
| HU12 | Aprovar e recusar reservas | Completa (cancelar aprovada pela API) |
| HU07, HU11, HU13 | Filtros, recorrência e histórico | Fora do MVP |

## Regras de negócio

As regras que variam por perfil ficam no banco, não no código:

- `regra_perfil`: status inicial da reserva, duração máxima, antecedência máxima e mínima de cada perfil.
- `configuracao`: tentativas de login, minutos de bloqueio, antecedência de cancelamento e fuso horário.

Conflito de horário é barrado em duas camadas: trava do laboratório dentro de uma transação e restrição de exclusão do PostgreSQL (`reserva_sem_sobreposicao`, migration `restricoes_de_negocio`).

## Estrutura

```
apps/api     NestJS, Prisma, testes
apps/web     Next.js
docs/telas   capturas das telas
scripts      captura de telas
```

## Deploy no Railway

1. Crie um projeto a partir deste repositório no GitHub.
2. Adicione o serviço PostgreSQL do Railway.
3. Serviço `api`: diretório raiz `apps/api` (usa o `Dockerfile`). Variáveis: `DATABASE_URL` (referência ao PostgreSQL), `JWT_SECRET`, `JWT_EXPIRES_IN`, `COOKIE_NAME`, `PORT=3001`. As migrations rodam na inicialização.
4. Serviço `web`: diretório raiz `apps/web` (usa o `Dockerfile`). Variável de build `API_INTERNAL_URL` apontando para o domínio privado do serviço `api` na porta 3001. Gere um domínio público só para o `web`.
5. Para criar os dados de demonstração uma vez: `railway run --service api npx prisma db seed` (com `SEED_PASSWORD` definida).
