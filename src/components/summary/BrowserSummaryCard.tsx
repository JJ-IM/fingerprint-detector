"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
    <div className="flex items-center justify-between py-1">
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
  const [showCanvasDialog, setShowCanvasDialog] = useState(false);
  const canvasImage = fingerprint?.canvas?.image as string | undefined;

  if (!fingerprint) return null;

  return (
    <>
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
          <InfoRow
            label="시간대"
            value={fingerprint.timing.timezone as string}
          />
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

          {/* Canvas 핑거프린트 이미지 미리보기 */}
          {canvasImage && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">
                  Canvas 핑거프린트
                </span>
                <button
                  onClick={() => setShowCanvasDialog(true)}
                  className="text-xs text-neon hover:underline cursor-pointer"
                >
                  확대보기
                </button>
              </div>
              <div
                className="relative rounded-md overflow-hidden border border-border/50 bg-black/20 cursor-pointer hover:border-neon/50 transition-colors"
                onClick={() => setShowCanvasDialog(true)}
              >
                <img
                  src={canvasImage}
                  alt="Canvas Fingerprint"
                  className="w-full h-auto"
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 min-[500px]:pt-3 flex flex-wrap gap-1 min-[400px]:gap-1.5 min-[500px]:gap-2">
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

      {/* Canvas 이미지 확대 다이얼로그 */}
      <Dialog open={showCanvasDialog} onOpenChange={setShowCanvasDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
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
              Canvas 핑거프린트 이미지
            </DialogTitle>
            <DialogDescription>
              이 이미지는 브라우저마다 미세하게 다르게 렌더링됩니다. 폰트,
              안티앨리어싱, 그래픽 카드 등에 따라 고유한 해시값이 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          {canvasImage && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border-2 border-neon/30 bg-white">
                <img
                  src={canvasImage}
                  alt="Canvas Fingerprint Full Size"
                  className="w-full h-auto"
                  style={{ imageRendering: "auto" }}
                />
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <span className="text-foreground font-medium">해시:</span>{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded">
                    {fingerprint.canvas.hash as string}
                  </code>
                </p>
                <p>
                  <span className="text-foreground font-medium">크기:</span>{" "}
                  {fingerprint.canvas.width as number} ×{" "}
                  {fingerprint.canvas.height as number}px
                </p>
                <p>
                  <span className="text-foreground font-medium">
                    데이터 길이:
                  </span>{" "}
                  {(
                    fingerprint.canvas.dataURLLength as number
                  )?.toLocaleString() || "N/A"}{" "}
                  bytes
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
