import { FingerprintData } from "@/lib/types";
import {
  getBrowserName,
  getOSName,
  formatLanguages,
  truncateText,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BrowserSummaryCardProps {
  fingerprint: FingerprintData | null;
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-sm text-right truncate max-w-[180px] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function BrowserSummaryCard({
  fingerprint,
}: BrowserSummaryCardProps) {
  if (!fingerprint) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center">
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <CardTitle className="text-base">브라우저 요약</CardTitle>
            <p className="text-xs text-muted-foreground">기기 및 환경 정보</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        <InfoRow
          label="브라우저"
          value={getBrowserName(fingerprint.navigator.userAgent as string)}
        />
        <InfoRow
          label="운영체제"
          value={getOSName(
            fingerprint.navigator.platform as string,
            fingerprint.navigator.userAgent as string
          )}
        />
        <InfoRow
          label="해상도"
          value={`${fingerprint.screen.width} × ${fingerprint.screen.height}`}
        />
        <InfoRow
          label="언어"
          value={formatLanguages(fingerprint.navigator.languages as string[])}
        />
        <InfoRow label="시간대" value={fingerprint.timing.timezone as string} />
        <InfoRow
          label="CPU"
          value={`${fingerprint.hardware.hardwareConcurrency} 코어`}
        />
        <InfoRow
          label="메모리"
          value={
            fingerprint.hardware.deviceMemory
              ? `${fingerprint.hardware.deviceMemory} GB`
              : "N/A"
          }
        />
        <InfoRow
          label="GPU"
          value={truncateText(
            (fingerprint.webgl.unmaskedRenderer as string) ||
              (fingerprint.webgl.renderer as string) ||
              "N/A",
            35
          )}
        />

        <div className="pt-2 flex flex-wrap gap-1.5">
          <Badge
            variant={
              Number(fingerprint.hardware.maxTouchPoints) > 0
                ? "default"
                : "secondary"
            }
            className="text-xs"
          >
            {Number(fingerprint.hardware.maxTouchPoints) > 0
              ? "터치"
              : "터치 없음"}
          </Badge>
          <Badge
            variant={fingerprint.webgl.supported ? "default" : "secondary"}
            className="text-xs"
          >
            WebGL {fingerprint.webgl.supported ? "✓" : "✗"}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            {truncateText((fingerprint.canvas.hash as string) || "N/A", 8)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
