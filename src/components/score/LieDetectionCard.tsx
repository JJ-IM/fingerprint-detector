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

interface LieDetectionResult {
  lieScore: number;
  trustLevel: "trusted" | "suspicious" | "untrusted" | "deceptive";
  lies: {
    category: string;
    attribute: string;
    expected: string;
    actual: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
  }[];
  inconsistencies: {
    attributes: string[];
    description: string;
    severity: "low" | "medium" | "high";
  }[];
  prototypeManipulations: {
    object: string;
    property: string;
    issue: string;
    severity: "medium" | "high" | "critical";
  }[];
  privacyTools: {
    tool: string;
    confidence: number;
    indicators: string[];
  }[];
  summary: {
    totalLies: number;
    criticalLies: number;
    warnings: number;
    description: string;
  };
}

interface LieDetectionCardProps {
  lieDetection: LieDetectionResult;
}

export default function LieDetectionCard({
  lieDetection,
}: LieDetectionCardProps) {
  const [showLies, setShowLies] = useState(false);
  const [showProto, setShowProto] = useState(false);

  const getTrustColor = (level: LieDetectionResult["trustLevel"]) => {
    switch (level) {
      case "trusted":
        return "text-green-400 bg-green-500/10 border-green-500/30";
      case "suspicious":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
      case "untrusted":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30";
      case "deceptive":
        return "text-red-500 bg-red-500/10 border-red-500/30";
    }
  };

  const getTrustLabel = (level: LieDetectionResult["trustLevel"]) => {
    switch (level) {
      case "trusted":
        return "신뢰";
      case "suspicious":
        return "의심";
      case "untrusted":
        return "비신뢰";
      case "deceptive":
        return "위변조";
    }
  };

  const getTrustIcon = (level: LieDetectionResult["trustLevel"]) => {
    switch (level) {
      case "trusted":
        return "✓";
      case "suspicious":
        return "?";
      case "untrusted":
        return "!";
      case "deceptive":
        return "✕";
    }
  };

  const getSeverityColor = (
    severity: "low" | "medium" | "high" | "critical"
  ) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-red-400";
    if (score >= 40) return "text-orange-400";
    if (score >= 15) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <Card className="border-orange-500/20 bg-linear-to-br from-card to-orange-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <svg
              className="w-5 h-5 text-orange-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            위변조 탐지
          </CardTitle>
          <Badge className={getTrustColor(lieDetection.trustLevel)}>
            <span className="mr-1">
              {getTrustIcon(lieDetection.trustLevel)}
            </span>
            {getTrustLabel(lieDetection.trustLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trust Score Meter */}
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">거짓 점수</span>
            <span
              className={`text-2xl font-bold ${getScoreColor(
                lieDetection.lieScore
              )}`}
            >
              {lieDetection.lieScore}
              <span className="text-xs text-muted-foreground ml-1">/100</span>
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                lieDetection.lieScore >= 70
                  ? "bg-red-500"
                  : lieDetection.lieScore >= 40
                  ? "bg-orange-500"
                  : lieDetection.lieScore >= 15
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${lieDetection.lieScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            0 = 완전 신뢰 | 100 = 심각한 위변조
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-6 gap-1.5 min-[400px]:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="col-span-2 p-2 rounded-lg bg-secondary/20 text-center cursor-help">
                <div className="text-base min-[400px]:text-lg font-bold text-red-400">
                  {lieDetection.summary.criticalLies}
                </div>
                <div className="text-[10px] min-[400px]:text-xs text-muted-foreground">
                  치명적 거짓
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">심각한 위변조 감지 수</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="col-span-2 p-2 rounded-lg bg-secondary/20 text-center cursor-help">
                <div className="text-base min-[400px]:text-lg font-bold text-orange-400">
                  {lieDetection.summary.totalLies}
                </div>
                <div className="text-[10px] min-[400px]:text-xs text-muted-foreground">
                  전체 거짓
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">감지된 모든 거짓/위변조 수</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="col-span-2 p-2 rounded-lg bg-secondary/20 text-center cursor-help">
                <div className="text-base min-[400px]:text-lg font-bold text-yellow-400">
                  {lieDetection.summary.warnings}
                </div>
                <div className="text-[10px] min-[400px]:text-xs text-muted-foreground">
                  경고
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">불일치 및 prototype 변조 수</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Summary Description */}
        <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
          <p className="text-sm text-muted-foreground">
            {lieDetection.summary.description}
          </p>
        </div>

        {/* Privacy Tools Detected */}
        {lieDetection.privacyTools.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
              감지된 프라이버시 도구
            </h4>
            <div className="space-y-2">
              {lieDetection.privacyTools.map((tool, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-purple-300">
                      {tool.tool}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {tool.confidence}% 확률
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tool.indicators.map((ind, j) => (
                      <span
                        key={j}
                        className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detected Lies */}
        {lieDetection.lies.length > 0 && (
          <Collapsible open={showLies} onOpenChange={setShowLies}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors text-sm">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-red-400"
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
                  감지된 거짓 ({lieDetection.lies.length})
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showLies ? "rotate-180" : ""
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
              <div className="mt-2 space-y-2">
                {lieDetection.lies.map((lie, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border ${getSeverityColor(
                      lie.severity
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs">
                        {lie.category}.{lie.attribute}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {lie.severity}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-80">{lie.description}</p>
                    <div className="mt-1 text-xs opacity-60">
                      <span>예상: {lie.expected}</span>
                      <span className="mx-2">→</span>
                      <span>실제: {lie.actual}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Prototype Manipulations */}
        {lieDetection.prototypeManipulations.length > 0 && (
          <Collapsible open={showProto} onOpenChange={setShowProto}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors text-sm">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                    />
                  </svg>
                  Prototype 변조 ({lieDetection.prototypeManipulations.length})
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showProto ? "rotate-180" : ""
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
              <div className="mt-2 space-y-1.5">
                {lieDetection.prototypeManipulations.map((manip, i) => (
                  <div
                    key={i}
                    className="p-2 rounded text-xs bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <code className="text-yellow-300">
                      {manip.object}.{manip.property}
                    </code>
                    <p className="mt-0.5 text-yellow-400/80">{manip.issue}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Inconsistencies */}
        {lieDetection.inconsistencies.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              속성 불일치
            </h4>
            {lieDetection.inconsistencies.slice(0, 3).map((inc, i) => (
              <div
                key={i}
                className="p-2 rounded text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400"
              >
                {inc.description}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
