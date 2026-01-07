# Playbook Insights Generator

**Transforme reuniões de vendas em playbooks acionáveis com IA**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4-D97706?style=flat)](https://anthropic.com/)
[![AssemblyAI](https://img.shields.io/badge/AssemblyAI-Speech--to--Text-0EA5E9?style=flat)](https://www.assemblyai.com/)

---

## O Problema

Gestores de vendas enfrentam um desafio crítico: **não conseguem transformar dados de reuniões em conhecimento estruturado para playbooks**.

---

## A Solução

Sistema que analisa múltiplas transcrições de reuniões (ganhas vs perdidas) e gera automaticamente **4 entregáveis acionáveis**:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    MOMENTOS     │     │    PERGUNTAS    │     │    OBJEÇÕES     │     │    PLAYBOOK     │
│  DE ENGAJAMENTO │     │    EFICAZES     │     │   + RESPOSTAS   │     │   SUGESTÕES     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Trechos onde o  │     │ Ranking das     │     │ Objeções com    │     │ Scripts prontos │
│ cliente mostrou │     │ perguntas que   │     │ respostas que   │     │ por seção:      │
│ maior interesse │     │ mais geraram    │     │ funcionaram vs  │     │ Abertura,       │
│                 │     │ engajamento     │     │ não funcionaram │     │ Discovery,      │
│ • Quote         │     │                 │     │                 │     │ Fechamento,     │
│ • Contexto      │     │ • Taxa sucesso  │     │ • Recomendada   │     │ Alertas         │
│ • Impacto       │     │ • Timing        │     │ • Evitar        │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Arquitetura

### Pipeline de Análise (3 Estágios)

```
                                    ┌──────────────────────────────────────────────────┐
                                    │              CLAUDE AI (Sonnet 4)                │
                                    └──────────────────────────────────────────────────┘
                                                          │
        ┌─────────────────────────────────────────────────┼─────────────────────────────────────────────────┐
        │                                                 │                                                 │
        ▼                                                 ▼                                                 ▼
┌───────────────────┐                           ┌───────────────────┐                           ┌───────────────────┐
│  STAGE 1          │                           │  STAGE 2          │                           │  STAGE 3          │
│  Extração         │                           │  Comparação       │                           │  Geração          │
├───────────────────┤                           ├───────────────────┤                           ├───────────────────┤
│                   │                           │                   │                           │                   │
│  Para CADA        │                           │  WON vs LOST      │                           │  Playbook         │
│  transcrição:     │         ────────►         │                   │         ────────►         │  estruturado      │
│                   │                           │  • Padrões        │                           │                   │
│  • Perguntas      │                           │  • Perguntas      │                           │  • Scripts        │
│  • Engajamento    │                           │  • Objeções       │                           │  • Táticas        │
│  • Objeções       │                           │  • Triggers       │                           │  • Alertas        │
│  • Pain points    │                           │                   │                           │                   │
│                   │                           │                   │                           │                   │
└───────────────────┘                           └───────────────────┘                           └───────────────────┘
```

### Processamento Paralelo em massa

```
POST /batch-uploads
        │
        ▼
   createJob()
        │
        ├──────────────────────────────────────┐
        │                                      │
        ▼                                      ▼
┌───────────────────┐                 ┌───────────────────┐
│   THREAD 1        │                 │   THREAD 2        │
│   (Blocking)      │                 │  (Fire-and-forget)│
├───────────────────┤                 ├───────────────────┤
│                   │                 │                   │
│   Transcrição     │                 │   Persistência    │
│   (AssemblyAI)    │                 │   de Arquivos     │
│        ↓          │                 │        ↓          │
│   Detecção        │                 │   Volume Docker   │
│   Won/Lost        │                 │   /app/storage    │
│        ↓          │                 │                   │
│   Análise 3-stage │                 │                   │
│        ↓          │                 │                   │
│   Playbook        │                 │                   │
│                   │                 │                   │
└───────────────────┘                 └───────────────────┘
        │
        ▼
   SSE Events ──────► Frontend (tempo real)
```

---

## Tech Stack

| Camada | Tecnologia | Requisito da Vaga |
|--------|------------|-------------------|
| **Backend** | NestJS 11 + Node.js | ✅ Node.js |
| **Database** | PostgreSQL + TypeORM | ✅ PostgreSQL |
| **Frontend** | React 18 + Vite | ✅ React + Hooks |
| **Styling** | Tailwind CSS | ✅ Tailwind CSS |
| **Language** | TypeScript 5.7 | ✅ TypeScript |
| **State** | Context API | ✅ Redux/Context |
| **Testing** | Vitest + RTL | ✅ Jest/RTL |
| **Infra** | Docker Compose | ✅ Docker |
| **API Design** | REST + Swagger | ✅ API Design |
| **LLM** | Anthropic Claude | ✅ Integração IA |
| **Speech-to-Text** | AssemblyAI | ✅ Sistemas IA |

---

## Quick Start

### Pré-requisitos

- Docker & Docker Compose
- API Key [Anthropic](https://console.anthropic.com/) (Claude)
- API Key [AssemblyAI](https://www.assemblyai.com/) (para áudio)

### 3 Comandos

```bash
# 1. Clone e configure
git clone https://github.com/seu-usuario/salesbud-challenge.git
cd salesbud-challenge
cp .env.example .env
# Edite .env com suas API keys

# 2. Suba os containers
docker compose up

# 3. Acesse
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
# Swagger:  http://localhost:3001/docs
```

---

## Funcionalidades

### Upload em Lote
- **2 a 20 arquivos** por análise
- Suporta `.txt` (5MB) e áudio `.mp3/.wav/.m4a` (25MB)
- Processamento paralelo em batches de 3

### Transcrição de Áudio
- **Speaker Diarization** — identifica múltiplos speakers
- Suporte a português brasileiro
- Via AssemblyAI

### Detecção Automática de Outcome
- Classifica cada transcrição como **WON** ou **LOST**
- Baseado em análise de contexto via LLM
- Retorna confiança + justificativa

### Progress em Tempo Real
- **Server-Sent Events (SSE)**
- 6 estágios: Upload → Transcrição → Detecção → Análise → Geração → Done
- Reconexão automática com exponential backoff (Retry pattern)

### Persistência de Arquivos
- Volume Docker dedicado para arquivos de audio (Simula manipulação no S3 da AWS)
- Download posterior via API

---

## API Reference

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/v1/batch-uploads` | Upload de arquivos (form-data) |
| `GET` | `/api/v1/batch-uploads/:id` | Status do job |
| `GET` | `/api/v1/batch-uploads/:id/events` | SSE progress stream |
| `POST` | `/api/v1/analyses` | Criar análise manual |
| `GET` | `/api/v1/analyses` | Listar análises |
| `GET` | `/api/v1/analyses/:id` | Detalhe da análise |
| `DELETE` | `/api/v1/analyses/:id` | Deletar análise |
| `GET` | `/api/v1/files/download/:id` | Download arquivo |

**Documentação completa:** http://localhost:3001/docs

---

## Estrutura do Projeto

```
.
├── backend/
│   └── src/
│       ├── analyses/          # Pipeline 3-stage
│       ├── batch-uploads/     # Orquestração + SSE
│       ├── files/             # Persistência
│       ├── llm/               # Claude wrapper
│       ├── outcome-detector/  # Detecção won/lost
│       └── prompts/           # Templates LLM
│
├── frontend/
│   └── src/
│       ├── components/        # UI reutilizável
│       ├── features/          # Domain features
│       │   ├── analysis/      # Resultados
│       │   └── batch-uploads/ # Upload + progress
│       └── contexts/          # Toast notifications
│
└── docker-compose.yml
```

---

## Próximos Passos

Se tivesse mais tempo, implementaria:

1. **Dashboard Histórico** — visualizar tendências entre análises
2. **Export PDF** — playbook formatado para impressão
3. **Webhooks** — notificação quando análise completa
4. **Multi-tenant** — isolamento por empresa/time
5. **Fine-tuning** — modelo customizado com dados do cliente
6. **Integração CRM** — import automático de gravações
7. **Grafana** — métricas de reuniões em tempo real (gráficos de linha e pizza por período)

---

## Variáveis de Ambiente

```env
# IA (obrigatório)
ANTHROPIC_API_KEY=sk-ant-...
ASSEMBLYAI_API_KEY=...
LLM_MODEL=claude-sonnet-4-20250514

# Database
TYPEORM_USERNAME=playbook
TYPEORM_PASSWORD=playbook123
TYPEORM_DATABASE=playbook_insights

# Backend
PORT=3001
NODE_ENV=development

# Frontend
VITE_API_URL=http://localhost:3001
```

---

## Autor

**Alexandre Henrique Fernandes Nolla**

Desenvolvido como parte do desafio técnico SalesBud.

---

<p align="center">
  <sub>Built with Claude AI + AssemblyAI</sub>
</p>
