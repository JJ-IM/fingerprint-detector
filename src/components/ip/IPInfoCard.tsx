import { IPData } from "@/lib/types";
import { getFlagEmoji } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import dynamic from "next/dynamic";

// 지도 컴포넌트를 동적 임포트 (SSR 비활성화)
const IPMap = dynamic(() => import("@/components/ip/IPMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[280px] bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-center">
        <svg
          className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-pulse"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-slate-500 text-sm">지도 로딩중...</span>
      </div>
    </div>
  ),
});

interface IPInfoCardProps {
  ipData: IPData | null;
  loading: boolean;
}

function ThreatBadge({
  label,
  detected,
}: {
  label: string;
  detected: boolean | undefined | null;
}) {
  const baseClass =
    "text-[10px] min-[500px]:text-[11px] md:text-xs gap-1 justify-center px-2 min-[500px]:px-2.5 py-0.5 min-[500px]:py-1 min-w-[52px] min-[500px]:min-w-[60px]";
  const dotClass =
    "w-1 h-1 min-[500px]:w-1.5 min-[500px]:h-1.5 rounded-full shrink-0";

  if (detected === true) {
    return (
      <Badge variant="destructive" className={baseClass}>
        <span className={`${dotClass} bg-red-300`}></span>
        {label}
      </Badge>
    );
  }

  if (detected === false) {
    return (
      <Badge
        variant="secondary"
        className={`${baseClass} bg-safe/10 text-safe border-safe/20`}
      >
        <span className={`${dotClass} bg-green-400`}></span>
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${baseClass} opacity-50`}>
      <span className={`${dotClass} bg-muted-foreground`}></span>
      {label}
    </Badge>
  );
}

export default function IPInfoCard({ ipData, loading }: IPInfoCardProps) {
  const hasSecurityData = ipData?.riskScore !== undefined;

  const getRiskColor = (score: number) => {
    if (score >= 76) return "text-danger";
    if (score >= 51) return "text-warning";
    if (score >= 26) return "text-yellow-400";
    return "text-safe";
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-stretch">
            {/* 상단/왼쪽: 지도 스케레톤 */}
            <div className="w-full md:w-1/3 md:min-w-[180px] self-stretch">
              <div className="h-[200px] md:h-full md:min-h-[300px] bg-slate-800/50 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-center">
                  <svg
                    className="w-8 h-8 mx-auto mb-2 text-slate-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-slate-500 text-xs">지도 로딩중...</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 정보 스켈레톤 */}
            <div className="flex-1 space-y-4">
              {/* IP 주소 */}
              <Skeleton className="h-12 w-full rounded-lg" />

              {/* 위치 정보 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* 네트워크 정보 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              <Skeleton className="h-px w-full" />

              {/* 위험도 */}
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </div>

              {/* 위협 배지 */}
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!ipData) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[200px]">
          <p className="text-muted-foreground text-sm">
            IP 정보를 가져올 수 없습니다
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">IP 정보</CardTitle>
            <p className="text-xs text-muted-foreground">
              네트워크 및 위협 분석
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          {/* 모바일: 지도를 상단에 / md 이상: 왼쪽에 */}
          <div className="flex flex-col md:flex-row gap-3 min-[500px]:gap-4">
            {/* 지도 영역 */}
            {ipData.latitude && ipData.longitude && (
              <div className="w-full md:w-2/5 lg:w-1/3 shrink-0">
                <div className="h-[160px] min-[400px]:h-[180px] min-[500px]:h-[200px] md:h-full md:min-h-[280px] rounded-lg overflow-hidden">
                  <IPMap
                    latitude={ipData.latitude}
                    longitude={ipData.longitude}
                    city={ipData.city}
                    country={ipData.country}
                    ip={ipData.ip}
                    riskLevel={ipData.riskLevel}
                    isVPN={ipData.vpn}
                    isProxy={ipData.proxy}
                    isTor={ipData.tor}
                  />
                </div>
              </div>
            )}

            {/* 정보 영역 */}
            <div className="flex-1 min-w-0 space-y-2.5 min-[500px]:space-y-3">
              {/* IP Address */}
              <div className="bg-secondary/50 rounded-lg p-2 min-[500px]:p-2.5 md:p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] min-[500px]:text-xs text-muted-foreground shrink-0">
                    IP 주소
                  </span>
                  <code className="text-[11px] min-[500px]:text-xs md:text-sm font-mono text-primary truncate">
                    {ipData.ip}
                  </code>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1 min-[500px]:space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] min-[500px]:text-xs text-muted-foreground shrink-0">
                    위치
                  </span>
                  <span className="text-[11px] min-[500px]:text-xs md:text-sm text-right truncate">
                    {ipData.countryCode && (
                      <span className="mr-1">
                        {getFlagEmoji(ipData.countryCode)}
                      </span>
                    )}
                    {[
                      ipData.city,
                      ipData.regionName || ipData.region,
                      ipData.country,
                    ]
                      .filter((v) => v && v !== "Unknown")
                      .join(", ") || "알 수 없음"}
                  </span>
                </div>
                {ipData.timezone && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground shrink-0">
                      타임존
                    </span>
                    <span className="text-xs text-foreground/70">
                      {ipData.timezone}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Network */}
              <div className="space-y-1 min-[500px]:space-y-1.5 md:space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] min-[500px]:text-xs text-muted-foreground shrink-0">
                    ISP
                  </span>
                  <span className="text-[11px] min-[500px]:text-xs md:text-sm text-right truncate max-w-[60%]">
                    {ipData.isp || ipData.organization}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] min-[500px]:text-xs text-muted-foreground shrink-0">
                    ASN
                  </span>
                  <code className="text-[11px] min-[500px]:text-xs font-mono text-muted-foreground">
                    {ipData.asn}
                  </code>
                </div>
                {ipData.networkType && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] min-[500px]:text-xs text-muted-foreground shrink-0">
                      타입
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] min-[500px]:text-xs"
                    >
                      {ipData.networkType}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Security Analysis */}
              {hasSecurityData && (
                <>
                  <Separator />

                  {/* Risk Score */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] min-[500px]:text-xs text-muted-foreground block">
                        위험 점수
                      </span>
                      <span
                        className={`text-lg min-[500px]:text-xl md:text-2xl font-bold ${getRiskColor(
                          ipData.riskScore ?? 0
                        )}`}
                      >
                        {ipData.riskScore}
                      </span>
                      <span className="text-[11px] min-[500px]:text-xs text-muted-foreground">
                        /100
                      </span>
                    </div>
                    {ipData.confidenceScore !== null &&
                      ipData.confidenceScore !== undefined && (
                        <div className="text-right">
                          <span className="text-[11px] min-[500px]:text-xs text-muted-foreground block">
                            신뢰도
                          </span>
                          <span className="text-sm min-[500px]:text-base md:text-lg font-semibold text-primary">
                            {ipData.confidenceScore}%
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Threat Badges - 항상 5개 균등 배치 */}
                  <div className="flex flex-wrap justify-center gap-1.5 min-[500px]:gap-2 py-1.5 min-[500px]:py-2">
                    <ThreatBadge label="VPN" detected={ipData.vpn} />
                    <ThreatBadge label="Proxy" detected={ipData.proxy} />
                    <ThreatBadge label="Tor" detected={ipData.tor} />
                    <ThreatBadge label="Hosting" detected={ipData.hosting} />
                    <ThreatBadge label="Bot" detected={ipData.scraper} />
                  </div>

                  {/* VPN Operator Info */}
                  {ipData.operator && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 min-[500px]:p-2.5 md:p-3 space-y-1.5 min-[500px]:space-y-2">
                      <div className="flex items-center gap-2 text-[11px] min-[500px]:text-xs">
                        <svg
                          className="w-3.5 h-3.5 text-primary shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="font-medium text-foreground truncate">
                          VPN: {ipData.operator.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {ipData.operator.anonymity}
                        </Badge>
                        {ipData.operator.noLogs && (
                          <Badge
                            variant="outline"
                            className="text-xs text-warning border-warning/30"
                          >
                            No-Logs
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
