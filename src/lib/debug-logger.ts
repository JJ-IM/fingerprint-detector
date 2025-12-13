/**
 * 디버그 로거
 * - 디버그 로그를 파일로 저장 (250MB 제한)
 * - 터미널에는 사용자 요청 로그만 출력
 */

import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const DEBUG_LOG_FILE = path.join(LOG_DIR, "debug.log");
const MAX_LOG_SIZE = 250 * 1024 * 1024; // 250MB

// 로그 디렉토리 생성
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// 타임스탬프 생성 (ISO 8601, 타임존 생략)
// TZ 환경변수에 따라 시간대 적용 (기본: Asia/Seoul)
export function getTimestamp(): string {
  const tz = process.env.TZ || "Asia/Seoul";
  const now = new Date();
  
  // 해당 타임존으로 변환
  const formatted = now.toLocaleString("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  
  // "2025-12-13 17:02:30" -> "2025-12-13T17:02:30"
  return `[${formatted.replace(" ", "T")}]`;
}

// 로그 파일 크기 확인 및 로테이션
function checkAndRotateLog() {
  try {
    if (!fs.existsSync(DEBUG_LOG_FILE)) return;

    const stats = fs.statSync(DEBUG_LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
      // 기존 로그 백업 (오래된 것 삭제)
      const backupFile = path.join(LOG_DIR, "debug.log.old");
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
      fs.renameSync(DEBUG_LOG_FILE, backupFile);
    }
  } catch {
    // 에러 무시
  }
}

/**
 * 디버그 로그 (파일에만 저장, 터미널 출력 안함)
 */
export function debugLog(category: string, message: string): void {
  try {
    ensureLogDir();
    checkAndRotateLog();

    const timestamp = getTimestamp();
    const logLine = `${timestamp} [${category}] ${message}\n`;

    fs.appendFileSync(DEBUG_LOG_FILE, logLine, "utf-8");
  } catch {
    // 로깅 실패 시 무시
  }
}

/**
 * 로그 파일 통계
 */
export function getLogStats(): {
  debugLogSize: number;
  debugLogSizeMB: string;
  maxSizeMB: number;
  usagePercent: string;
} {
  try {
    const stats = fs.existsSync(DEBUG_LOG_FILE)
      ? fs.statSync(DEBUG_LOG_FILE)
      : { size: 0 };

    const sizeMB = stats.size / (1024 * 1024);
    const maxMB = MAX_LOG_SIZE / (1024 * 1024);
    const percent = (stats.size / MAX_LOG_SIZE) * 100;

    return {
      debugLogSize: stats.size,
      debugLogSizeMB: sizeMB.toFixed(2) + "MB",
      maxSizeMB: maxMB,
      usagePercent: percent.toFixed(1) + "%",
    };
  } catch {
    return {
      debugLogSize: 0,
      debugLogSizeMB: "0MB",
      maxSizeMB: 250,
      usagePercent: "0%",
    };
  }
}
