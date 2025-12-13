import { FingerprintData } from "@/lib/types";
import {
  getBrowserName,
  getOSName,
  formatLanguages,
  truncateText,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BrowserSummaryCardProps {
  fingerprint: FingerprintData | null;
}

function InfoRow({
  label,
  value,
  tooltip,
  mono = false,
}: {
  label: string;
  value: string;
  tooltip: string;
  mono?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-between py-1 cursor-help hover:bg-muted/30 rounded px-1 -mx-1 transition-colors">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span
            className={`text-sm text-right truncate max-w-[180px] ${
              mono ? "font-mono text-xs" : ""
            }`}
          >
            {value}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function BrowserSummaryCard({
  fingerprint,
}: BrowserSummaryCardProps) {
  if (!fingerprint) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
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
          tooltip="현재 사용 중인 웹 브라우저와 버전입니다. User-Agent 문자열에서 추출됩니다."
        />
        <InfoRow
          label="운영체제"
          value={getOSName(
            fingerprint.navigator.platform as string,
            fingerprint.navigator.userAgent as string
          )}
          tooltip="기기의 운영체제와 버전입니다. 핑거프린팅에서 기기를 구분하는 주요 요소입니다."
        />
        <InfoRow
          label="해상도"
          value={`${fingerprint.screen.width} × ${fingerprint.screen.height}`}
          tooltip="화면의 가로 × 세로 픽셀 수입니다. 모니터/디스플레이 크기를 나타냅니다."
        />
        <InfoRow
          label="언어"
          value={formatLanguages(fingerprint.navigator.languages as string[])}
          tooltip="브라우저에 설정된 선호 언어 목록입니다. 지역 기반 추적에 사용될 수 있습니다."
        />
        <InfoRow
          label="시간대"
          value={fingerprint.timing.timezone as string}
          tooltip="기기에 설정된 시간대입니다. 대략적인 지리적 위치를 추정하는 데 사용됩니다."
        />
        <InfoRow
          label="CPU"
          value={`${fingerprint.hardware.hardwareConcurrency} 코어`}
          tooltip="프로세서의 논리적 코어 수입니다. 하드웨어 사양을 식별하는 데 사용됩니다."
        />
        <InfoRow
          label="메모리"
          value={
            fingerprint.hardware.deviceMemory
              ? `${fingerprint.hardware.deviceMemory} GB`
              : "N/A"
          }
          tooltip="기기의 RAM 용량입니다. 브라우저가 제공하는 대략적인 값입니다."
        />
        <InfoRow
          label="GPU"
          value={truncateText(
            (fingerprint.webgl.unmaskedRenderer as string) ||
              (fingerprint.webgl.renderer as string) ||
              "N/A",
            35
          )}
          tooltip="그래픽 카드 모델명입니다. WebGL을 통해 추출되며 매우 고유한 식별자입니다."
        />
        <InfoRow
          label="화면 비율"
          value={`${fingerprint.screen.devicePixelRatio || 1}x ${
            Number(fingerprint.screen.devicePixelRatio) > 1
              ? "(HiDPI)"
              : "(표준)"
          }`}
          tooltip="논리적 픽셀 대비 물리적 픽셀 비율입니다. 레티나/고해상도 디스플레이는 2x 이상입니다."
        />

        <div className="pt-2 min-[500px]:pt-3 flex flex-wrap gap-1 min-[400px]:gap-1.5 min-[500px]:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={
                  Number(fingerprint.hardware.maxTouchPoints) > 0
                    ? "default"
                    : "secondary"
                }
                className="text-xs cursor-help"
              >
                {Number(fingerprint.hardware.maxTouchPoints) > 0
                  ? "터치"
                  : "터치 없음"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                터치스크린 지원 여부 (최대{" "}
                {Number(fingerprint.hardware.maxTouchPoints) || 0}개 터치
                포인트)
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant={fingerprint.webgl.supported ? "default" : "secondary"}
                className="text-xs cursor-help"
              >
                WebGL {fingerprint.webgl.supported ? "✓" : "✗"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                WebGL 그래픽 API 지원 여부 (3D 렌더링용)
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="text-xs font-mono cursor-help"
              >
                {truncateText((fingerprint.canvas.hash as string) || "N/A", 8)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Canvas 핑거프린트 해시 (고유 식별자)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
