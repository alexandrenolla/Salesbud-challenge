import { useState, useCallback } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { BatchUploader } from "@/features/batch-uploads";
import { AnalysisResults } from "@/features/analysis";
import { AnalysisResult } from "@/types";

function App() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleComplete = useCallback((analysisResult: AnalysisResult) => {
    setResult(analysisResult);
  }, []);

  const handleReset = () => {
    setResult(null);
  };

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
        {result ? (
          <AnalysisResults result={result} onReset={handleReset} />
        ) : (
          <BatchUploader onComplete={handleComplete} />
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
            <span className="text-xs text-gray-400">v2.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
