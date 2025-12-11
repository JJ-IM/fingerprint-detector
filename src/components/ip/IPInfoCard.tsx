import { IPData } from "@/lib/types";
import { getFlagEmoji } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

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
  if (detected === true) {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-300"></span>
        {label}
      </Badge>
    );
  }

  if (detected === false) {
    return (
      <Badge
        variant="secondary"
        className="text-xs gap-1 bg-safe/10 text-safe border-safe/20"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs gap-1 opacity-50">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
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
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
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
      <CardHeader className="pb-3">
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

      <CardContent className="space-y-4">
        {/* IP Address */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">IP 주소</span>
            <code className="text-sm font-mono text-primary">{ipData.ip}</code>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">위치</span>
            <span className="text-sm">
              {ipData.countryCode && (
                <span className="mr-1.5">
                  {getFlagEmoji(ipData.countryCode)}
                </span>
              )}
              {[ipData.city, ipData.regionName || ipData.region, ipData.country]
                .filter((v) => v && v !== "Unknown")
                .join(", ") || "알 수 없음"}
            </span>
          </div>
          {ipData.timezone && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">타임존</span>
              <span className="text-xs text-foreground/70">
                {ipData.timezone}
              </span>
            </div>
          )}
        </div>

        <Separator />

        {/* Network */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ISP</span>
            <span className="text-sm text-right truncate max-w-[200px]">
              {ipData.isp || ipData.organization}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ASN</span>
            <code className="text-xs font-mono text-muted-foreground">
              {ipData.asn}
            </code>
          </div>
          {ipData.networkType && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">타입</span>
              <Badge variant="outline" className="text-xs">
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
                <span className="text-xs text-muted-foreground block">
                  위험 점수
                </span>
                <span
                  className={`text-2xl font-bold ${getRiskColor(
                    ipData.riskScore ?? 0
                  )}`}
                >
                  {ipData.riskScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              {ipData.confidenceScore !== null &&
                ipData.confidenceScore !== undefined && (
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block">
                      신뢰도
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      {ipData.confidenceScore}%
                    </span>
                  </div>
                )}
            </div>

            {/* Threat Badges */}
            <div className="flex flex-wrap gap-1.5">
              <ThreatBadge label="VPN" detected={ipData.vpn} />
              <ThreatBadge label="Proxy" detected={ipData.proxy} />
              <ThreatBadge label="Tor" detected={ipData.tor} />
              <ThreatBadge label="Hosting" detected={ipData.hosting} />
              <ThreatBadge label="Bot" detected={ipData.scraper} />
            </div>

            {/* VPN Operator Info */}
            {ipData.operator && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="font-medium text-foreground">
                    VPN: {ipData.operator.name}
                  </span>
                </div>
                <div className="flex gap-2">
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
      </CardContent>
    </Card>
  );
}
