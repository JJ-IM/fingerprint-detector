"use client";

import { useState, useEffect, useMemo } from "react";
import { FingerprintData, IPData } from "@/lib/types";
import { getCategoryTitle, getCategoryIcon } from "@/lib/categoryConfig";
import { CATEGORY_DESCRIPTIONS } from "@/lib/constants";
import {
  FIELD_DESCRIPTIONS,
  STATS_DESCRIPTIONS,
} from "@/lib/field-descriptions";
import {
  calculateEntropy,
  calculateUniqueness,
  countProperties,
  analyzeDataQuality,
  formatLabel,
  formatValue,
  checkSuspicious,
  checkMissing,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import IPInfoCard from "@/components/ip/IPInfoCard";
import BrowserSummaryCard from "@/components/summary/BrowserSummaryCard";
import FingerprintScoreCard from "@/components/score/FingerprintScoreCard";
import LieDetectionCard from "@/components/score/LieDetectionCard";
import {
  EnhancedFingerprintCollector,
  EnhancedFingerprintResult,
} from "@/lib/fingerprint-enhanced";

interface DataItemDetail {
  key: string;
  value: unknown;
  category: string;
  isSuspicious: boolean;
  isMissing: boolean;
}

interface CanvasImageItem {
  name: string;
  description: string;
  image: string;
  hash: string;
}

export default function Home() {
  const [fingerprint, setFingerprint] = useState<FingerprintData | null>(null);
  const [enhancedResult, setEnhancedResult] =
    useState<EnhancedFingerprintResult | null>(null);
  const [ipData, setIpData] = useState<IPData | null>(null);
  const [ipLoading, setIpLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<DataItemDetail | null>(null);
  const [selectedCanvasImage, setSelectedCanvasImage] =
    useState<CanvasImageItem | null>(null);

  useEffect(() => {
    const collectFingerprint = async () => {
      // 향상된 수집기 사용 (FingerprintJS + Lie Detection 통합)
      const enhancedCollector = new EnhancedFingerprintCollector();
      const result = await enhancedCollector.collect();

      // 기존 fingerprint 데이터 설정
      setFingerprint(result.raw);
      // 향상된 결과 설정 (점수, 거짓 탐지 포함)
      setEnhancedResult(result);

      if (result.raw) {
        setActiveCategory(Object.keys(result.raw)[0]);
      }

      // 통합 해시 사용
      setHash(result.combinedHash);
      setLoading(false);
    };

    const fetchIPData = async () => {
      try {
        const response = await fetch("/api/ip/analyze");
        const result = await response.json();
        if (result.success) setIpData(result.data);
      } catch (error) {
        console.error("Failed to fetch IP data:", error);
      }
      setIpLoading(false);
    };

    collectFingerprint();
    fetchIPData();
  }, []);

  const overallQuality = useMemo(() => {
    if (!fingerprint) return { suspicious: 0, missing: 0, total: 0, score: 0 };

    let totalSuspicious = 0;
    let totalMissing = 0;
    let totalItems = 0;

    Object.values(fingerprint).forEach((categoryData) => {
      const quality = analyzeDataQuality(
        categoryData as Record<string, unknown>
      );
      totalSuspicious += quality.suspicious;
      totalMissing += quality.missing;
      totalItems += quality.total;
    });

    const issues = totalSuspicious + totalMissing;
    const score =
      totalItems > 0
        ? Math.round(((totalItems - issues) / totalItems) * 100)
        : 0;

    return {
      suspicious: totalSuspicious,
      missing: totalMissing,
      total: totalItems,
      score,
    };
  }, [fingerprint]);

  const filteredData = useMemo(() => {
    if (!fingerprint || !searchQuery.trim()) return null;

    const query = searchQuery.toLowerCase();
    const results: DataItemDetail[] = [];

    Object.entries(fingerprint).forEach(([category, data]) => {
      Object.entries(data).forEach(([key, value]) => {
        const keyMatch = key.toLowerCase().includes(query);
        const valueMatch = String(value).toLowerCase().includes(query);
        if (keyMatch || valueMatch) {
          results.push({
            category,
            key,
            value,
            isSuspicious: checkSuspicious(key, value),
            isMissing: checkMissing(value),
          });
        }
      });
    });

    return results;
  }, [fingerprint, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin"></div>
            {/* Inner spinning ring */}
            <div
              className="absolute inset-4 rounded-full border-2 border-transparent border-t-neon animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "0.8s",
              }}
            ></div>
            {/* Center glow */}
            <div className="absolute inset-8 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-gradient mb-3">분석 중...</h2>
          <p className="text-muted-foreground">
            브라우저 지문을 수집하고 있습니다
          </p>
        </div>
      </div>
    );
  }

  const categories = fingerprint ? Object.keys(fingerprint) : [];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/85 border-b border-border/40">
          <div className="h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="w-full max-w-7xl mx-auto px-4 min-[500px]:px-6 lg:px-8 py-3 lg:py-4">
            <div className="flex items-center justify-between gap-3 min-[500px]:gap-4">
              <div className="flex items-center gap-3 min-[500px]:gap-4 shrink-0">
                <div className="relative">
                  <div className="w-10 h-10 min-[500px]:w-12 min-[500px]:h-12 rounded-xl bg-linear-to-br from-primary/20 to-neon/20 border border-primary/30 flex items-center justify-center glow-sm">
                    <svg
                      className="w-5 h-5 min-[500px]:w-6 min-[500px]:h-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                      />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 rounded-full bg-safe border-2 border-background flex items-center justify-center">
                    <svg
                      className="w-2 h-2 min-[500px]:w-2.5 min-[500px]:h-2.5 text-background"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base min-[400px]:text-lg min-[500px]:text-xl font-bold text-gradient">
                      Fingerprint Detector
                    </h1>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="opacity-50 hover:opacity-100 transition-opacity">
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm">
                        <p className="text-xs">
                          브라우저 핑거프린팅은 사용자의 브라우저 및 기기 정보를
                          수집하여 고유한 식별자를 생성하는 기술입니다. 이
                          도구는 수집 가능한 데이터를 분석하고 보안 취약점을
                          탐지합니다.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-[11px] min-[400px]:text-xs min-[500px]:text-sm text-muted-foreground">
                    브라우저 지문 분석 도구
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="w-32 min-[400px]:w-40 min-[500px]:w-48 md:w-64 lg:w-80 shrink">
                <div className="relative group">
                  <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-neon/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center">
                    <svg
                      className="absolute left-2.5 min-[500px]:left-3 w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 min-[500px]:pl-10 pr-3 py-1.5 min-[500px]:py-2 text-xs min-[500px]:text-sm bg-secondary/50 border border-border rounded-lg min-[500px]:rounded-xl focus:outline-none focus:border-primary/50 focus:bg-secondary transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 p-0.5 rounded-md hover:bg-muted"
                      >
                        <svg
                          className="w-3.5 h-3.5 min-[500px]:w-4 min-[500px]:h-4 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hash Banner */}
        <div className="bg-linear-to-r from-primary/5 via-card/50 to-neon/5 border-b border-border/40">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
            <div className="flex items-center justify-between gap-3 md:gap-4">
              {/* 왼쪽: SHA-256 배지 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 cursor-help shrink-0">
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-primary">
                      SHA-256
                    </span>
                    <svg
                      className="w-3 h-3 text-muted-foreground opacity-50 hidden lg:block"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">
                    SHA-256은 수집된 모든 핑거프린트 데이터를 암호화하여 생성한
                    고유 해시값입니다. 같은 브라우저/기기 설정에서는 동일한
                    해시가 생성됩니다.
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* 중앙: 해시 값 (너비에 따라 자연스럽게 신축) */}
              <code className="flex-1 text-sm font-mono text-foreground/80 bg-muted/50 px-3 py-1.5 rounded-lg text-center overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
                {hash}
              </code>

              {/* 오른쪽: 복사 버튼 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(hash)}
                    className="gap-2 shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="hidden sm:inline">복사</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>전체 해시 복사</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Search Results Overlay */}
        {searchQuery.trim() && filteredData && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card className="border-primary/20 glow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold">검색 결과</h3>
                      <p className="text-xs text-muted-foreground">
                        &quot;{searchQuery}&quot; 검색 결과
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {filteredData.length}개 발견
                  </Badge>
                </div>

                {filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>검색 결과가 없습니다</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {filteredData.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setActiveCategory(item.category);
                            setSearchQuery("");
                          }}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors active:opacity-80 ${
                            item.isSuspicious
                              ? "bg-danger/10 border border-danger/20 hover:bg-danger/15"
                              : item.isMissing
                              ? "bg-warning/10 border border-warning/20 hover:bg-warning/15"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                            >
                              {getCategoryTitle(item.category)}
                            </Badge>
                            <span className="text-sm font-medium">
                              {formatLabel(item.key)}
                            </span>
                            {item.isSuspicious && (
                              <Badge
                                variant="destructive"
                                className="text-[9px]"
                              >
                                경고
                              </Badge>
                            )}
                            {item.isMissing && !item.isSuspicious && (
                              <Badge
                                variant="outline"
                                className="text-[9px] border-warning/30 text-warning"
                              >
                                누락
                              </Badge>
                            )}
                          </div>
                          <code className="text-xs text-primary font-mono truncate max-w-[200px]">
                            {formatValue(item.value)}
                          </code>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        {!searchQuery.trim() && (
          <>
            {/* Summary Section */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <IPInfoCard ipData={ipData} loading={ipLoading} />
                <BrowserSummaryCard fingerprint={fingerprint} />
              </div>
            </div>

            {/* Score & Lie Detection Section */}
            {enhancedResult && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 lg:pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <FingerprintScoreCard
                    score={enhancedResult.score}
                    visitorId={enhancedResult.fingerprintjs.visitorId}
                    confidence={enhancedResult.fingerprintjs.confidence}
                  />
                  <LieDetectionCard
                    lieDetection={enhancedResult.lieDetection}
                  />
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="w-full max-w-7xl mx-auto px-4 min-[500px]:px-6 lg:px-8 pb-4 lg:pb-6">
              <div className="grid grid-cols-3 min-[500px]:grid-cols-3 lg:grid-cols-6 gap-1.5 min-[400px]:gap-2 min-[500px]:gap-3">
                {/* Quality Score - Special Card */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={`relative overflow-hidden cursor-help ${
                        overallQuality.score >= 90
                          ? "border-safe/30"
                          : overallQuality.score >= 70
                          ? "border-warning/30"
                          : "border-danger/30"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 opacity-10 ${
                          overallQuality.score >= 90
                            ? "bg-linear-to-br from-safe to-transparent"
                            : overallQuality.score >= 70
                            ? "bg-linear-to-br from-warning to-transparent"
                            : "bg-linear-to-br from-danger to-transparent"
                        }`}
                      ></div>
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center relative">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-xl min-[400px]:text-2xl min-[500px]:text-3xl font-bold text-gradient">
                            {overallQuality.score}%
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          완벽도
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.score}</p>
                  </TooltipContent>
                </Tooltip>

                {/* Issue Cards */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={`cursor-help ${
                        overallQuality.suspicious > 0
                          ? "border-danger/30 bg-danger/5"
                          : ""
                      }`}
                    >
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className={`text-lg min-[400px]:text-xl min-[500px]:text-2xl font-bold ${
                              overallQuality.suspicious > 0
                                ? "text-danger"
                                : "text-safe"
                            }`}
                          >
                            {overallQuality.suspicious}
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          경고
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.suspicious}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={`cursor-help ${
                        overallQuality.missing > 0
                          ? "border-warning/30 bg-warning/5"
                          : ""
                      }`}
                    >
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div
                            className={`text-lg min-[400px]:text-xl min-[500px]:text-2xl font-bold ${
                              overallQuality.missing > 0
                                ? "text-warning"
                                : "text-safe"
                            }`}
                          >
                            {overallQuality.missing}
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          누락
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.missing}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-lg min-[400px]:text-xl min-[500px]:text-2xl font-bold text-primary">
                            {fingerprint ? countProperties(fingerprint) : 0}
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          수집 항목
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.total}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-lg min-[400px]:text-xl min-[500px]:text-2xl font-bold text-primary">
                            {fingerprint ? calculateEntropy(fingerprint) : 0}
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          엔트로피
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.entropy}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-1.5 min-[400px]:p-2 min-[500px]:p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="text-lg min-[400px]:text-xl min-[500px]:text-2xl font-bold text-primary">
                            {fingerprint
                              ? calculateUniqueness(fingerprint)
                              : "0%"}
                          </div>
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                          고유성
                        </p>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{STATS_DESCRIPTIONS.uniqueness}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Fingerprint Data Tabs */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 lg:pb-8 w-full flex-1">
              {fingerprint && (
                <Card className="overflow-hidden">
                  <Tabs
                    value={activeCategory}
                    onValueChange={setActiveCategory}
                  >
                    {/* Category Description Header */}
                    <div className="p-3 sm:p-4 bg-linear-to-r from-primary/5 to-transparent border-b border-border">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          {getCategoryIcon(activeCategory)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="font-bold text-base sm:text-lg">
                              {getCategoryTitle(activeCategory)}
                            </h2>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="opacity-50 hover:opacity-100 transition-opacity">
                                  <svg
                                    className="w-4 h-4 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-sm">
                                <p className="text-xs">
                                  {CATEGORY_DESCRIPTIONS[activeCategory] ||
                                    "이 카테고리에 대한 설명이 없습니다."}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {CATEGORY_DESCRIPTIONS[activeCategory] ||
                              "이 카테고리에 대한 설명이 없습니다."}
                          </p>
                        </div>
                        {(() => {
                          const quality = analyzeDataQuality(
                            fingerprint[activeCategory] as Record<
                              string,
                              unknown
                            >
                          );
                          return (
                            <div className="hidden sm:flex items-center gap-2 shrink-0">
                              {quality.suspicious > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {quality.suspicious} 경고
                                </Badge>
                              )}
                              {quality.missing > 0 && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-warning/30 text-warning"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {quality.missing} 누락
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                {
                                  Object.keys(fingerprint[activeCategory])
                                    .length
                                }
                                개 항목
                              </Badge>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-border bg-muted/30 overflow-hidden">
                      <ScrollArea className="w-full">
                        <TabsList className="h-auto p-1.5 sm:p-2 bg-transparent w-max min-w-full justify-start gap-1">
                          {categories.map((category) => {
                            const quality = analyzeDataQuality(
                              fingerprint[category] as Record<string, unknown>
                            );
                            const hasIssues =
                              quality.suspicious > 0 || quality.missing > 0;

                            return (
                              <TabsTrigger
                                key={category}
                                value={category}
                                className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap rounded-lg transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm ${
                                  hasIssues ? "pr-5 sm:pr-6" : ""
                                }`}
                              >
                                <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center opacity-70">
                                  {getCategoryIcon(category)}
                                </span>
                                <span className="hidden xs:inline">
                                  {getCategoryTitle(category)}
                                </span>
                                <span className="xs:hidden">
                                  {getCategoryTitle(category).slice(0, 4)}
                                </span>
                                {hasIssues && (
                                  <span
                                    className={`absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                                      quality.suspicious > 0
                                        ? "bg-danger"
                                        : "bg-warning"
                                    }`}
                                  ></span>
                                )}
                              </TabsTrigger>
                            );
                          })}
                        </TabsList>
                        <ScrollBar orientation="horizontal" className="h-2" />
                      </ScrollArea>
                    </div>

                    {/* Tab Content */}
                    {categories.map((category) => (
                      <TabsContent
                        key={category}
                        value={category}
                        className="p-0 m-0"
                      >
                        <CardContent className="p-3 sm:p-4">
                          {category === "canvas" &&
                            Array.isArray(fingerprint.canvas?.images) &&
                            (fingerprint.canvas.images as CanvasImageItem[])
                              .length > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                  <svg
                                    className="w-5 h-5 text-neon"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <h4 className="text-sm font-semibold">
                                    Canvas 테스트 이미지
                                  </h4>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {
                                      (
                                        fingerprint.canvas
                                          .images as CanvasImageItem[]
                                      ).length
                                    }
                                    개 테스트
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4">
                                  각 이미지는 브라우저마다 미세하게 다르게
                                  렌더링됩니다. 폰트, 안티앨리어싱, GPU 등에
                                  따라 고유한 해시값이 생성됩니다.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {(
                                    fingerprint.canvas
                                      .images as CanvasImageItem[]
                                  ).map((img, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() =>
                                        setSelectedCanvasImage(img)
                                      }
                                      className="group relative rounded-lg border border-border/50 bg-black/20 overflow-hidden cursor-pointer hover:border-neon/50 transition-all hover:shadow-lg"
                                    >
                                      <div className="absolute top-2 left-2 z-10">
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] backdrop-blur-sm bg-background/80"
                                        >
                                          테스트 {idx + 1}
                                        </Badge>
                                      </div>
                                      <div className="p-2 pt-8">
                                        <img
                                          src={img.image}
                                          alt={img.name}
                                          className="w-full h-auto rounded border border-border/30"
                                          style={{ imageRendering: "auto" }}
                                        />
                                      </div>
                                      <div className="p-2 pt-0 space-y-1">
                                        <p className="text-xs font-medium truncate">
                                          {img.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                                          {img.description}
                                        </p>
                                        <code className="text-[9px] text-neon/70 font-mono block truncate">
                                          {img.hash.slice(0, 16)}...
                                        </code>
                                      </div>
                                      <div className="absolute inset-0 bg-neon/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="absolute bottom-2 right-2 text-neon">
                                          <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t border-border/30">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="text-foreground font-medium">
                                      통합 해시:
                                    </span>{" "}
                                    <code className="bg-muted px-1.5 py-0.5 rounded text-neon">
                                      {fingerprint.canvas.hash as string}
                                    </code>
                                  </p>
                                </div>
                              </div>
                            )}

                          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(fingerprint[category])
                              .filter(
                                ([key]) => key !== "images" && key !== "image"
                              ) // 이미지 필드는 위에서 별도 표시
                              .map(([key, value]) => {
                                const isSuspicious = checkSuspicious(
                                  key,
                                  value
                                );
                                const isMissing = checkMissing(value);
                                const displayValue = formatValue(value);
                                const description = FIELD_DESCRIPTIONS[key];

                                return (
                                  <div
                                    key={key}
                                    onClick={() =>
                                      setSelectedItem({
                                        key,
                                        value,
                                        category,
                                        isSuspicious,
                                        isMissing,
                                      })
                                    }
                                    className={`group relative rounded-xl p-4 cursor-pointer transition-colors active:opacity-80 md:hover:shadow-lg ${
                                      isSuspicious
                                        ? "bg-linear-to-br from-danger/10 to-danger/5 border border-danger/30 hover:border-danger/50"
                                        : isMissing
                                        ? "bg-linear-to-br from-warning/10 to-warning/5 border border-warning/30 hover:border-warning/50"
                                        : "bg-linear-to-br from-secondary/80 to-secondary/40 border border-border hover:border-primary/30"
                                    }`}
                                  >
                                    {/* Status indicator */}
                                    {(isSuspicious || isMissing) && (
                                      <div
                                        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                                          isSuspicious
                                            ? "bg-danger animate-pulse"
                                            : "bg-warning"
                                        }`}
                                      ></div>
                                    )}

                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                          {formatLabel(key)}
                                        </span>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button className="opacity-50 hover:opacity-100 transition-opacity">
                                              <svg
                                                className="w-3.5 h-3.5 text-muted-foreground"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent
                                            side="top"
                                            className="max-w-xs"
                                          >
                                            <p className="text-xs">
                                              {description ||
                                                `브라우저의 ${formatLabel(
                                                  key
                                                )} 정보입니다. 클릭하여 자세한 내용을 확인하세요.`}
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>
                                      {isSuspicious && (
                                        <Badge
                                          variant="destructive"
                                          className="text-[9px] h-4 px-1.5"
                                        >
                                          경고
                                        </Badge>
                                      )}
                                      {isMissing && !isSuspicious && (
                                        <Badge
                                          variant="outline"
                                          className="text-[9px] h-4 px-1.5 border-warning/50 text-warning"
                                        >
                                          누락
                                        </Badge>
                                      )}
                                    </div>

                                    <p
                                      className={`text-sm font-mono break-all ${
                                        displayValue.length > 60
                                          ? "text-xs"
                                          : ""
                                      } ${
                                        isSuspicious
                                          ? "text-danger"
                                          : isMissing
                                          ? "text-warning"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {displayValue.length > 100
                                        ? displayValue.slice(0, 100) + "..."
                                        : displayValue}
                                    </p>

                                    {/* Click hint */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <svg
                                        className="w-4 h-4 text-muted-foreground"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </CardContent>
                      </TabsContent>
                    ))}
                  </Tabs>
                </Card>
              )}
            </main>
          </>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
        >
          <DialogContent className="max-w-lg">
            {selectedItem && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        selectedItem.isSuspicious
                          ? "bg-danger/20 text-danger"
                          : selectedItem.isMissing
                          ? "bg-warning/20 text-warning"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {selectedItem.isSuspicious ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : selectedItem.isMissing ? (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <DialogTitle className="text-lg">
                        {formatLabel(selectedItem.key)}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        {getCategoryTitle(selectedItem.category)} •{" "}
                        {selectedItem.isSuspicious
                          ? "경고 발생"
                          : selectedItem.isMissing
                          ? "값 누락"
                          : "정상"}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Value */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      값
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm break-all max-h-40 overflow-y-auto">
                      {formatValue(selectedItem.value)}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      설명
                    </h4>
                    <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                      {FIELD_DESCRIPTIONS[selectedItem.key] ||
                        `브라우저에서 수집한 ${formatLabel(
                          selectedItem.key
                        )} 정보입니다. 이 값은 사용자의 브라우저 환경을 식별하는 데 사용될 수 있습니다.`}
                    </p>
                  </div>

                  {/* Warning Message */}
                  {selectedItem.isSuspicious && (
                    <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-danger shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-danger">
                            경고
                          </p>
                          <p className="text-xs text-danger/80 mt-1">
                            이 값은 자동화 도구나 봇의 특성을 나타낼 수
                            있습니다. 웹사이트에서 접근이 차단될 수 있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedItem.isMissing && !selectedItem.isSuspicious && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-5 h-5 text-warning shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-warning">
                            값 누락
                          </p>
                          <p className="text-xs text-warning/80 mt-1">
                            이 값이 누락되어 있습니다. 브라우저 설정이나
                            개인정보 보호 기능으로 인해 수집되지 않았을 수
                            있습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Canvas 이미지 확대 보기 Dialog */}
        <Dialog
          open={!!selectedCanvasImage}
          onOpenChange={() => setSelectedCanvasImage(null)}
        >
          <DialogContent className="max-w-lg">
            {selectedCanvasImage && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neon/20 text-neon">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <DialogTitle className="text-lg">
                        {selectedCanvasImage.name}
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Canvas 핑거프린트 테스트 이미지
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Image */}
                  <div className="rounded-lg overflow-hidden border-2 border-neon/30 bg-white">
                    <img
                      src={selectedCanvasImage.image}
                      alt={selectedCanvasImage.name}
                      className="w-full h-auto"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      테스트 목적
                    </h4>
                    <p className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
                      {selectedCanvasImage.description}
                    </p>
                  </div>

                  {/* Hash */}
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      해시값
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm break-all text-neon">
                      {selectedCanvasImage.hash}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-primary shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-primary">
                          왜 다른 해시가 생성되나요?
                        </p>
                        <p className="text-xs text-primary/80 mt-1">
                          동일한 이미지라도 브라우저, OS, GPU, 폰트,
                          안티앨리어싱 설정에 따라 픽셀 단위로 미세한 차이가
                          발생합니다. 이 차이가 고유한 해시값을 만듭니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-background/50 backdrop-blur-sm mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                </div>
                <span className="font-medium text-foreground/80">
                  Fingerprint Detector
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center justify-center gap-3">
                  <a
                    href="mailto:admin@colio.net"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="hidden min-[400px]:inline">
                      admin@colio.net
                    </span>
                  </a>
                  <a
                    href="https://github.com/JJ-IM/fingerprint-detector"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="hidden min-[400px]:inline">GitHub</span>
                  </a>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border"></div>
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse"></div>
                  <span className="text-safe">클라이언트 사이드</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
