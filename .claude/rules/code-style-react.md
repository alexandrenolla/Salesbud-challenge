# Code Style Guide - Playbook Insights Generator (Frontend)

Este guia define as convenções de código para o frontend React do projeto Playbook Insights Generator. Baseado na documentação oficial do React, TypeScript e Tailwind CSS, com foco em **simplicidade**, **legibilidade** e **evitar over-engineering**.

---

## Princípios Fundamentais

1. **Simplicidade primeiro** - Código simples e direto, sem abstrações prematuras
2. **Legibilidade** - Código é lido mais vezes do que escrito
3. **Componentes funcionais** - Sempre usar function components com hooks
4. **TypeScript estrito** - Tipar props e estados, mas sem exagero
5. **Colocation** - Manter arquivos relacionados próximos

---

## Estrutura de Pastas

```
src/
├── app/                    # Configuração da aplicação
│   ├── App.tsx
│   ├── Router.tsx
│   └── Providers.tsx
├── components/             # Componentes reutilizáveis (UI)
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── Card/
│   ├── Input/
│   └── Modal/
├── features/               # Features por domínio
│   ├── transcripts/        # Upload e gestão de transcrições
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── analysis/           # Análise de reuniões
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── playbook/           # Geração de playbook
│       ├── components/
│       ├── hooks/
│       ├── types.ts
│       └── index.ts
├── hooks/                  # Hooks globais reutilizáveis
├── lib/                    # Configurações de libs externas
│   └── api.ts              # Configuração do fetch/axios
├── types/                  # Tipos globais
│   └── index.ts
├── utils/                  # Funções utilitárias puras
└── styles/                 # Estilos globais
    └── globals.css
```

### Regras de Estrutura

```typescript
// ✅ CORRETO: Feature com tudo relacionado junto
src/features/analysis/
├── components/
│   ├── AnalysisForm.tsx
│   ├── InsightsCard.tsx
│   └── index.ts
├── hooks/
│   └── useAnalysis.ts
├── api.ts
├── types.ts
└── index.ts

// ❌ ERRADO: Separar por tipo globalmente (over-engineering para MVP)
src/
├── components/
│   └── AnalysisForm.tsx
├── hooks/
│   └── useAnalysis.ts
├── types/
│   └── analysis.ts
```

---

## Componentes React

### Estrutura de Componente

```typescript
// ✅ CORRETO: Componente simples e direto
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  onClick?: () => void;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  onClick 
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isLoading ? 'Carregando...' : children}
    </button>
  );
}
```

### Convenções de Nomenclatura

```typescript
// Componentes: PascalCase
function TranscriptUploader() {}
function InsightsCard() {}

// Props interfaces: NomeComponenteProps
interface TranscriptUploaderProps {}
interface InsightsCardProps {}

// Hooks: useNomeDescritivo
function useTranscriptUpload() {}
function useAnalysisResults() {}

// Handlers: handleAcao ou onAcao (para props)
const handleSubmit = () => {};
const handleFileChange = () => {};

// Constantes: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_ENDPOINTS = { ... };

// Arquivos de componente: PascalCase.tsx
// TranscriptUploader.tsx, InsightsCard.tsx

// Arquivos de hooks/utils: camelCase.ts
// useTranscriptUpload.ts, formatDate.ts
```

### Regras de Componentes (Documentação Oficial React)

```typescript
// ✅ CORRETO: Componente puro - mesma entrada, mesma saída
function Greeting({ name }: { name: string }) {
  return <h1>Olá, {name}!</h1>;
}

// ❌ ERRADO: Modificar variáveis externas durante render
let count = 0;
function Counter() {
  count++; // Side effect durante render!
  return <div>{count}</div>;
}

// ✅ CORRETO: Side effects em event handlers ou useEffect
function Counter() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    setCount(c => c + 1);
  };
  
  return <button onClick={handleClick}>{count}</button>;
}
```

### Composição vs Props Drilling

```typescript
// ❌ ERRADO: Prop drilling excessivo
function App() {
  const [user, setUser] = useState(null);
  return <Layout user={user} setUser={setUser} />;
}

function Layout({ user, setUser }) {
  return <Sidebar user={user} setUser={setUser} />;
}

function Sidebar({ user, setUser }) {
  return <UserMenu user={user} setUser={setUser} />;
}

// ✅ CORRETO: Composição com children
function App() {
  const [user, setUser] = useState(null);
  return (
    <Layout>
      <Sidebar>
        <UserMenu user={user} onLogout={() => setUser(null)} />
      </Sidebar>
    </Layout>
  );
}

// ✅ CORRETO: Context para estado verdadeiramente global
// Usar apenas quando: tema, autenticação, idioma
const UserContext = createContext<User | null>(null);

function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser deve ser usado dentro de UserProvider');
  }
  return context;
}
```

---

## TypeScript

### Tipagem de Props

```typescript
// ✅ CORRETO: Interface clara e concisa
interface TranscriptCardProps {
  title: string;
  outcome: 'won' | 'lost';
  content: string;
  onRemove: () => void;
}

// ✅ CORRETO: Estender props nativas quando necessário
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

// ✅ CORRETO: Children tipado
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

// ❌ ERRADO: Usar `any`
interface Props {
  data: any; // Nunca fazer isso
}

// ❌ ERRADO: Over-typing com generics desnecessários para MVP
interface Props<T extends Record<string, unknown>> {
  data: T;
  render: (item: T) => React.ReactNode;
}
```

### Tipagem de Estados

```typescript
// ✅ CORRETO: useState com tipo inferido quando possível
const [isLoading, setIsLoading] = useState(false);
const [count, setCount] = useState(0);

// ✅ CORRETO: useState com tipo explícito quando necessário
const [user, setUser] = useState<User | null>(null);
const [transcripts, setTranscripts] = useState<Transcript[]>([]);

// ✅ CORRETO: Tipos de domínio claros
interface Transcript {
  id: string;
  title: string;
  content: string;
  outcome: 'won' | 'lost';
  createdAt: Date;
}

interface AnalysisResult {
  engagementMoments: EngagementMoment[];
  effectiveQuestions: EffectiveQuestion[];
  objections: Objection[];
  playbookSuggestions: PlaybookSection[];
}
```

### Evitar Over-Typing

```typescript
// ❌ ERRADO: Tipos excessivamente complexos para MVP
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

// ✅ CORRETO: Simples e direto
interface FormData {
  title: string;
  content: string;
  outcome?: 'won' | 'lost';
}
```

---

## Hooks

### Regras de Hooks (Documentação Oficial)

```typescript
// ✅ CORRETO: Hooks sempre no topo do componente
function TranscriptUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadTranscript } = useTranscriptApi();

  // ... resto do componente
}

// ❌ ERRADO: Hooks dentro de condicionais
function TranscriptUploader({ enabled }: { enabled: boolean }) {
  if (enabled) {
    const [files, setFiles] = useState([]); // Erro!
  }
}

// ❌ ERRADO: Hooks dentro de loops
function TranscriptList({ transcripts }) {
  transcripts.forEach(t => {
    const [expanded, setExpanded] = useState(false); // Erro!
  });
}
```

### Custom Hooks

```typescript
// ✅ CORRETO: Hook simples e focado
function useTranscriptUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: File[]) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        files.map(file => api.uploadTranscript(file))
      );
      return results;
    } catch (err) {
      setError('Erro ao fazer upload');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
}

// ✅ CORRETO: Hook de API simples
function useAnalysis() {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (transcripts: Transcript[]) => {
    setIsLoading(true);
    try {
      const result = await api.analyzeTranscripts(transcripts);
      setData(result);
    } catch (err) {
      setError('Erro na análise');
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, analyze };
}
```

### useEffect - Usar com Moderação

```typescript
// ✅ CORRETO: useEffect para sincronização com sistema externo
useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    const result = await fetch('/api/data', { 
      signal: controller.signal 
    });
    setData(await result.json());
  }
  
  fetchData();
  
  return () => controller.abort();
}, []);

// ❌ ERRADO: useEffect para derivar estado
useEffect(() => {
  setFilteredItems(items.filter(item => item.active));
}, [items]);

// ✅ CORRETO: Calcular durante render
const filteredItems = items.filter(item => item.active);

// ❌ ERRADO: useEffect para responder a eventos
useEffect(() => {
  if (submitted) {
    sendAnalytics();
  }
}, [submitted]);

// ✅ CORRETO: Chamar no event handler
const handleSubmit = () => {
  submitForm();
  sendAnalytics();
};
```

---

## Tailwind CSS

### Classes Organizadas

```typescript
// ✅ CORRETO: Ordem lógica das classes
// Layout → Spacing → Sizing → Typography → Colors → Effects
<div className="flex items-center gap-4 p-4 w-full text-sm text-gray-700 bg-white rounded-lg shadow-md">

// ✅ CORRETO: Usar função cn() para classes condicionais
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

<button
  className={cn(
    'px-4 py-2 rounded-lg font-medium',
    variant === 'primary' && 'bg-blue-600 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-800',
    isDisabled && 'opacity-50 cursor-not-allowed'
  )}
>
```

### Componentes Reutilizáveis vs @apply

```typescript
// ✅ CORRETO: Criar componente React para reutilização
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white rounded-lg shadow-md p-6', className)}>
      {children}
    </div>
  );
}

// ✅ ACEITÁVEL: @apply apenas para estilos muito repetidos em elementos HTML puros
// globals.css
@layer components {
  .btn-base {
    @apply px-4 py-2 rounded-lg font-medium transition-colors;
  }
}

// ❌ ERRADO: @apply para tudo (perde benefícios do Tailwind)
.card {
  @apply bg-white rounded-lg shadow-md p-6 flex flex-col gap-4;
}
```

### Variantes com Objetos

```typescript
// ✅ CORRETO: Variantes organizadas em objeto
const buttonVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

interface ButtonProps {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  children: React.ReactNode;
}

function Button({ variant = 'primary', size = 'md', children }: ButtonProps) {
  return (
    <button className={cn(
      'font-medium rounded-lg transition-colors',
      buttonVariants[variant],
      buttonSizes[size]
    )}>
      {children}
    </button>
  );
}
```

### Responsividade

```typescript
// ✅ CORRETO: Mobile-first
<div className="flex flex-col md:flex-row gap-4">
  <aside className="w-full md:w-64">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>

// ✅ CORRETO: Grid responsivo
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

---

## Gestão de Estado

### Hierarquia de Decisão

```
1. Estado local (useState) → Default para maioria dos casos
2. Estado derivado → Calcular durante render
3. Estado elevado → Compartilhar entre irmãos via pai comum
4. Context → Apenas para dados verdadeiramente globais (tema, auth)
5. Estado do servidor → React Query ou SWR para cache de API
```

### Estado Local

```typescript
// ✅ CORRETO: useState para estado de UI local
function TranscriptForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState<'won' | 'lost'>('won');
  
  // ...
}

// ✅ CORRETO: Agrupar estado relacionado
interface FormState {
  title: string;
  content: string;
  outcome: 'won' | 'lost';
}

function TranscriptForm() {
  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    outcome: 'won'
  });
  
  const updateField = <K extends keyof FormState>(
    field: K, 
    value: FormState[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };
}
```

### Context - Usar com Parcimônia

```typescript
// ✅ CORRETO: Context para tema/auth (verdadeiramente global)
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (credentials: Credentials) => {
    const user = await api.login(credentials);
    setUser(user);
  };
  
  const logout = () => setUser(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}

// ❌ ERRADO: Context para tudo (over-engineering)
// Não criar TranscriptContext, AnalysisContext, etc.
// Usar props ou estado local quando possível
```

---

## Comunicação com API

### Estrutura Simples

```typescript
// lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Transcripts
  getTranscripts: () => 
    request<Transcript[]>('/transcripts'),
  
  createTranscript: (data: CreateTranscriptDto) => 
    request<Transcript>('/transcripts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Analysis
  analyzeTranscripts: (transcriptIds: string[]) => 
    request<AnalysisResult>('/analysis', {
      method: 'POST',
      body: JSON.stringify({ transcriptIds }),
    }),
};
```

### Hook de API

```typescript
// features/analysis/hooks/useAnalysis.ts
export function useAnalysis() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (transcriptIds: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.analyzeTranscripts(transcriptIds);
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, isLoading, error, analyze, reset };
}
```

---

## Formulários

### Formulários Simples (Controlados)

```typescript
// ✅ CORRETO: Formulário simples com estado local
function TranscriptForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [outcome, setOutcome] = useState<'won' | 'lost'>('won');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content, outcome });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Conteúdo da Transcrição
        </label>
        <textarea
          id="content"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={6}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Resultado
        </label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="won"
              checked={outcome === 'won'}
              onChange={() => setOutcome('won')}
              className="text-blue-600"
            />
            Ganha
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="lost"
              checked={outcome === 'lost'}
              onChange={() => setOutcome('lost')}
              className="text-blue-600"
            />
            Perdida
          </label>
        </div>
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Adicionar Transcrição
      </button>
    </form>
  );
}
```

---

## Listas e Keys

```typescript
// ✅ CORRETO: Key única e estável
function TranscriptList({ transcripts }: { transcripts: Transcript[] }) {
  return (
    <ul className="space-y-4">
      {transcripts.map(transcript => (
        <li key={transcript.id}>
          <TranscriptCard transcript={transcript} />
        </li>
      ))}
    </ul>
  );
}

// ❌ ERRADO: Usar index como key (causa bugs em reordenação)
{transcripts.map((transcript, index) => (
  <li key={index}> {/* Não fazer isso */}
    <TranscriptCard transcript={transcript} />
  </li>
))}

// ✅ CORRETO: Renderização condicional
function AnalysisResults({ results }: { results: AnalysisResult | null }) {
  if (!results) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhuma análise realizada ainda
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EngagementSection moments={results.engagementMoments} />
      <QuestionsSection questions={results.effectiveQuestions} />
      <ObjectionsSection objections={results.objections} />
      <PlaybookSection suggestions={results.playbookSuggestions} />
    </div>
  );
}
```

---

## Error Handling

### Error Boundaries

```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600">
            Algo deu errado
          </h2>
          <p className="mt-2 text-gray-600">
            Por favor, recarregue a página
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Estados de Loading/Error

```typescript
// ✅ CORRETO: Tratar todos os estados
function AnalysisView() {
  const { result, isLoading, error, analyze } = useAnalysis();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
        <span className="ml-3 text-gray-600">Analisando transcrições...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Erro na análise</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!result) {
    return <EmptyState onStart={() => {/* ... */}} />;
  }

  return <AnalysisResults results={result} />;
}
```

---

## Performance (Otimizar Quando Necessário)

### Evitar Otimização Prematura

```typescript
// ❌ ERRADO: useMemo/useCallback em tudo
function TranscriptCard({ transcript }: { transcript: Transcript }) {
  // Desnecessário para componente simples
  const formattedDate = useMemo(
    () => formatDate(transcript.createdAt),
    [transcript.createdAt]
  );
  
  const handleClick = useCallback(() => {
    console.log(transcript.id);
  }, [transcript.id]);
}

// ✅ CORRETO: Calcular direto (React é rápido)
function TranscriptCard({ transcript }: { transcript: Transcript }) {
  const formattedDate = formatDate(transcript.createdAt);
  
  const handleClick = () => {
    console.log(transcript.id);
  };
}

// ✅ CORRETO: useMemo apenas para cálculos realmente pesados
function TranscriptAnalysis({ transcripts }: { transcripts: Transcript[] }) {
  // Filtrar e processar muitos itens pode ser pesado
  const wonTranscripts = useMemo(
    () => transcripts.filter(t => t.outcome === 'won'),
    [transcripts]
  );
  
  const statistics = useMemo(
    () => calculateComplexStatistics(transcripts),
    [transcripts]
  );
}
```

### Lazy Loading (Quando Necessário)

```typescript
// ✅ CORRETO: Lazy loading para rotas/features grandes
import { lazy, Suspense } from 'react';

const AnalysisPage = lazy(() => import('./pages/AnalysisPage'));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Acessibilidade Básica

```typescript
// ✅ CORRETO: Labels em formulários
<label htmlFor="transcript-title">Título</label>
<input id="transcript-title" type="text" />

// ✅ CORRETO: Botões com texto descritivo
<button aria-label="Remover transcrição">
  <TrashIcon />
</button>

// ✅ CORRETO: Imagens com alt
<img src={icon} alt="Ícone de sucesso" />

// ✅ CORRETO: Roles semânticos
<nav aria-label="Menu principal">
  <ul role="list">
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ✅ CORRETO: Estados de loading anunciados
<button disabled={isLoading} aria-busy={isLoading}>
  {isLoading ? 'Processando...' : 'Enviar'}
</button>
```

---

## Checklist de Code Review

### Antes de Commitar

- [ ] Componente usa function component com hooks?
- [ ] Props estão tipadas com interface?
- [ ] useState no topo do componente?
- [ ] Nenhum hook dentro de condicional/loop?
- [ ] Side effects estão em event handlers ou useEffect?
- [ ] Keys únicas em listas (não usar index)?
- [ ] Estados de loading/error tratados?
- [ ] Classes Tailwind organizadas?
- [ ] Nenhum `any` no TypeScript?
- [ ] Labels em inputs de formulário?

### Sinais de Over-Engineering (Evitar no MVP)

- Muitos níveis de abstração
- Context para tudo
- useMemo/useCallback sem necessidade real
- Generics TypeScript complexos
- Padrões de design (Factory, Strategy) desnecessários
- Separação excessiva de arquivos

---

## Exemplos de Referência

### Componente de Feature Completo

```typescript
// features/transcripts/components/TranscriptUploader.tsx
import { useState } from 'react';
import { Button } from '@/components/Button';
import { FileInput } from '@/components/FileInput';
import { useTranscriptUpload } from '../hooks/useTranscriptUpload';
import type { Transcript } from '../types';

interface TranscriptUploaderProps {
  onUploadComplete: (transcripts: Transcript[]) => void;
}

export function TranscriptUploader({ onUploadComplete }: TranscriptUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const { upload, isUploading, error } = useTranscriptUpload();

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    try {
      const transcripts = await upload(files);
      onUploadComplete(transcripts);
      setFiles([]);
    } catch {
      // Error já está no hook
    }
  };

  return (
    <div className="space-y-4">
      <FileInput
        accept=".txt"
        multiple
        onChange={handleFilesChange}
        disabled={isUploading}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li 
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-sm text-gray-700">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-red-600 hover:text-red-700"
                aria-label={`Remover ${file.name}`}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        isLoading={isUploading}
        disabled={files.length === 0}
      >
        {isUploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
      </Button>
    </div>
  );
}
```

---

## Recursos

- [React Docs - Thinking in React](https://react.dev/learn/thinking-in-react)
- [React Docs - Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React Docs - Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [React Docs - Using TypeScript](https://react.dev/learn/typescript)
- [Tailwind CSS - Core Concepts](https://tailwindcss.com/docs/utility-first)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
