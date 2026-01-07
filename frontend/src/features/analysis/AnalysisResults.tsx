import {
  BarChart3,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { Button, Card } from "@/components";
import { cn } from "@/lib/utils";
import { VALIDATION } from "@/constants/validation";
import type { AnalysisResult, EngagementMoment, PlaybookSuggestion } from "@/types";

type ImpactLevel = EngagementMoment["impactLevel"];

const IMPACT_LABELS: Record<ImpactLevel, { label: string; style: string }> = {
  high: { label: "Alto", style: "bg-green-100 text-green-800" },
  medium: { label: "Médio", style: "bg-amber-100 text-amber-800" },
  low: { label: "Baixo", style: "bg-gray-100 text-gray-800" },
};

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const { summary, engagementMoments, effectiveQuestions, objections, playbookSuggestions } =
    result;

  const winRate = summary.totalMeetings > 0
    ? Math.round((summary.wonMeetings / summary.totalMeetings) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resultados da Análise</h2>
          <p className="mt-1 text-gray-600">
            Análise realizada em {new Date(summary.analysisDate).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button variant="secondary" onClick={onReset}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary-100 rounded-full">
            <BarChart3 className="w-6 h-6 text-primary-600" />
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">{summary.totalMeetings}</p>
          <p className="text-sm text-gray-500">Total de Reuniões</p>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <p className="mt-4 text-3xl font-bold text-green-600">{summary.wonMeetings}</p>
          <p className="text-sm text-gray-500">Ganhas</p>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="mt-4 text-3xl font-bold text-red-600">{summary.lostMeetings}</p>
          <p className="text-sm text-gray-500">Perdidas</p>
        </Card>

        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full">
            <BarChart3 className="w-6 h-6 text-amber-600" />
          </div>
          <p className="mt-4 text-3xl font-bold text-amber-600">{winRate}%</p>
          <p className="text-sm text-gray-500">Taxa de Conversão</p>
        </Card>
      </div>

      {/* Engagement Moments */}
      <Card
        title="Momentos de Engajamento"
        description="Momentos onde o cliente demonstrou maior interesse"
      >
        {engagementMoments.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-500">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Nenhum momento de engajamento identificado nesta análise.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {engagementMoments.map((moment) => (
            <div
              key={`engagement-${moment.quote.slice(0, 30)}`}
              className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200"
            >
              <MessageSquare className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">{moment.quote}</p>
                <p className="mt-1 text-sm text-gray-600">{moment.context}</p>
                <span
                  className={cn(
                    "inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full",
                    IMPACT_LABELS[moment.impactLevel].style
                  )}
                >
                  Impacto {IMPACT_LABELS[moment.impactLevel].label}
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
      </Card>

      {/* Effective Questions */}
      <Card
        title="Perguntas Eficazes"
        description="Perguntas que geraram maior engajamento nas reuniões ganhas"
      >
        {effectiveQuestions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-500">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Nenhuma pergunta eficaz identificada nesta análise.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {effectiveQuestions.map((question) => (
            <div
              key={`question-${question.question.slice(0, 30)}`}
              className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{question.question}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    {question.successRate}
                  </span>
                  <span>Timing: {question.suggestedTiming}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </Card>

      {/* Objections */}
      <Card
        title="Objeções Identificadas"
        description="Objeções comuns e como responder a elas"
      >
        {objections.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-500">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Nenhuma objeção identificada nesta análise.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {objections.map((objection) => {
            const invalidResponses = objection.unsuccessfulResponses.filter(r => r?.trim());
            const hasRecommendedResponse = objection.recommendedResponse?.trim();
            return (
              <div
                key={`objection-${objection.objection.slice(0, 30)}`}
                className="p-4 bg-amber-50 rounded-lg border border-amber-200"
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{objection.objection}</p>

                    {hasRecommendedResponse && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-medium text-green-800 uppercase tracking-wide">
                          Resposta Recomendada
                        </p>
                        <p className="mt-1 text-sm text-gray-700">
                          {objection.recommendedResponse}
                        </p>
                      </div>
                    )}

                    {invalidResponses.length > 0 && (
                      <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs font-medium text-red-800 uppercase tracking-wide">
                          Evitar
                        </p>
                        <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
                          {invalidResponses
                            .slice(0, VALIDATION.MAX_UNSUCCESSFUL_RESPONSES)
                            .map((resp) => (
                            <li key={`resp-${resp.slice(0, 30)}`}>{resp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </Card>

      {/* Playbook Suggestions */}
      <Card
        title="Sugestões para Playbook"
        description="Conteúdo sugerido para o playbook de vendas"
      >
        {playbookSuggestions.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg text-gray-500">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Nenhuma sugestão de playbook gerada nesta análise.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {Object.entries(
            playbookSuggestions.reduce<Record<string, PlaybookSuggestion[]>>((acc, suggestion) => {
              if (!acc[suggestion.section]) acc[suggestion.section] = [];
              acc[suggestion.section].push(suggestion);
              return acc;
            }, {})
          ).map(([section, suggestions]) => (
            <div key={section} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900">{section}</h4>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {suggestions
                  .slice(0, VALIDATION.MAX_PLAYBOOK_SUGGESTIONS_PER_SECTION)
                  .map((suggestion) => (
                    <div key={`suggestion-${section}-${suggestion.content.slice(0, 30)}`} className="px-4 py-3">
                      <p className="text-sm text-gray-900">{suggestion.content}</p>
                      <p className="mt-1 text-xs text-gray-500">{suggestion.basedOn}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </Card>
    </div>
  );
}
