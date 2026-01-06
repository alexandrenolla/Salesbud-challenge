import { BookOpen, AlertCircle, Sparkles } from "lucide-react";
import { LoadingSpinner } from "@/components";
import { TranscriptUploader } from "@/features/transcripts";
import { AnalysisResults, useAnalysis } from "@/features/analysis";

function App() {
  const { result, isLoading, error, analyze, reset } = useAnalysis();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-header sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    Playbook Insights Generator
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-700 rounded-full">
                    Beta
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Analise reuniões de vendas e gere insights para o seu playbook
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Ocorreu um erro</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary-500 animate-pulse" />
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              Analisando as transcrições...
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Nossa IA está processando os dados. Isso pode levar alguns segundos.
            </p>
          </div>
        )}

        {/* Results or Uploader */}
        {!isLoading && (
          <>
            {result ? (
              <AnalysisResults result={result} onReset={reset} />
            ) : (
              <TranscriptUploader onAnalyze={analyze} isLoading={isLoading} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Playbook Insights Generator</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by AI
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-400">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
