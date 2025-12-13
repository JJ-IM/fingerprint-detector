"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface ScoreResult {
  trackabilityScore: number;
  uniquenessScore: number;
  anomalyScore: number;
  entropy: number;
  details: {
    category: string;
    attribute: string;
    value: string;
    weight: number;
    contribution: number;
    status: "normal" | "suspicious" | "missing";
  }[];
  anomalies: {
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    weight: number;
  }[];
  summary: {
    level: "very_low" | "low" | "medium" | "high" | "very_high";
    description: string;
    recommendations: string[];
  };
}

interface FingerprintScoreCardProps {
  score: ScoreResult;
  visitorId?: string;
  confidence?: number;
}

export default function FingerprintScoreCard({
  score,
  visitorId,
  confidence,
}: FingerprintScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getLevelColor = (level: ScoreResult["summary"]["level"]) => {
    switch (level) {
      case "very_low":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "very_high":
        return "text-red-500 bg-red-500/10 border-red-500/30";
    }
  };

  const getLevelLabel = (level: ScoreResult["summary"]["level"]) => {
    switch (level) {
      case "very_low":
        return "매우 낮음";
      case "low":
        return "낮음";
      case "medium":
        return "보통";
      case "high":
        return "높음";
      case "very_high":
        return "매우 높음";
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-red-400";
    if (value >= 60) return "text-orange-400";
    if (value >= 40) return "text-yellow-400";
    if (value >= 20) return "text-green-400";
    return "text-green-500";
  };

  const getScoreBarColor = (value: number) => {
    if (value >= 80) return "bg-red-500";
    if (value >= 60) return "bg-orange-500";
    if (value >= 40) return "bg-yellow-500";
    if (value >= 20) return "bg-green-400";
    return "bg-green-500";
  };

  return (
    <Card className="border-primary/20 bg-linear-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            추적 가능성 분석
          </CardTitle>
          <Badge className={getLevelColor(score.summary.level)}>
            {getLevelLabel(score.summary.level)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visitor ID (FingerprintJS) */}
        {visitorId && (
          <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Visitor ID</span>
              {confidence !== undefined && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs">
                      신뢰도 {Math.round(confidence * 100)}%
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">FingerprintJS 신뢰도 점수</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <code className="text-sm font-mono text-primary break-all">
              {visitorId}
            </code>
          </div>
        )}

        {/* Score Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Trackability Score */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 cursor-help">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    추적 가능성
                  </span>
                  <span
                    className={`text-lg font-bold ${getScoreColor(
                      score.trackabilityScore
                    )}`}
                  >
                    {score.trackabilityScore}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBarColor(
                      score.trackabilityScore
                    )} transition-all`}
                    style={{ width: `${score.trackabilityScore}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">높을수록 추적당할 가능성이 높습니다</p>
            </TooltipContent>
          </Tooltip>

          {/* Uniqueness Score */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 cursor-help">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    고유성 (식별률)
                  </span>
                  <span
                    className={`text-lg font-bold ${getScoreColor(
                      score.uniquenessScore
                    )}`}
                  >
                    {score.uniquenessScore}
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreBarColor(
                      score.uniquenessScore
                    )} transition-all`}
                    style={{ width: `${score.uniquenessScore}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs font-medium mb-1">고유성 (Uniqueness)</p>
              <p className="text-xs text-muted-foreground">
                당신의 브라우저가 다른 사용자들과 얼마나 구별되는지 나타냅니다.
                높을수록 특정 개인으로 식별하기 쉽습니다.
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Entropy */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 cursor-help">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    엔트로피
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {score.entropy}
                    <span className="text-xs text-muted-foreground ml-1">
                      bits
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, score.entropy * 3)}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">정보 엔트로피 (높을수록 식별력이 높음)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
          <p className="text-sm text-muted-foreground">
            {score.summary.description}
          </p>
        </div>

        {/* Anomalies */}
        {score.anomalies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              이상 징후 ({score.anomalies.length})
            </h4>
            <div className="space-y-1.5">
              {score.anomalies.slice(0, 3).map((anomaly, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-xs flex items-start gap-2 ${
                    anomaly.severity === "high"
                      ? "bg-red-500/10 text-red-400"
                      : anomaly.severity === "medium"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  <span className="shrink-0">
                    {anomaly.severity === "high"
                      ? "🔴"
                      : anomaly.severity === "medium"
                      ? "🟡"
                      : "🔵"}
                  </span>
                  <span>{anomaly.description}</span>
                </div>
              ))}
              {score.anomalies.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{score.anomalies.length - 3}개 더...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {score.summary.recommendations.length > 0 && (
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors text-sm">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  권장 사항
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showDetails ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-2 space-y-1.5 pl-6">
                {score.summary.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
