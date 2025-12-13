import fs from "fs";
import path from "path";
import { getTimestamp } from "./debug-logger";

/**
 * 요청 유형
 * - finger: 브라우저에서 핑거프린트 페이지 방문 (본인 IP)
 * - curl_self: curl로 자기 IP 조회
 * - curl_other: curl로 다른 IP 조회
 */
type RequestSource = "finger" | "curl_self" | "curl_other";

interface IPLogEntry {
  timestamp: string;
  requestIp: string; // 요청한 클라이언트 IP
  queriedIp: string; // 조회된 IP
  country?: string;
  city?: string;
  riskScore?: number;
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  source: RequestSource;
  userAgent?: string;
  // API 사용 상태
  proxyCheckUsed?: boolean; // P: ProxyCheck API 사용 여부
  ipApiUsed?: boolean; // I: IP-API 사용 여부
}

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "ip-queries.log");

// 로그 디렉토리 생성
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * IP 조회 기록 로깅
 * 형식:
 * [Finger] VISIT : XXX.XXX.XXX.XXX - P : 1 / I : 1
 * [CURL] SELF : XXX.XXX.XXX.XXX - P : 1 / I : 1
 * [CURL] OTHER : XXX.XXX.XXX.XXX -> YYY.YYY.YYY.YYY - P : 1 / I : 1
 */
export function logIPQuery(entry: IPLogEntry): void {
  try {
    ensureLogDir();

    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    });

    fs.appendFileSync(LOG_FILE, logLine + "\n", "utf-8");

    // API 사용 상태 (P: ProxyCheck, I: IP-API)
    const pStatus = entry.proxyCheckUsed ? 1 : 0;
    const iStatus = entry.ipApiUsed ? 1 : 0;
    const apiStatus = `P : ${pStatus} / I : ${iStatus}`;
    const ts = getTimestamp();

    // 간결한 1줄 로그 출력 (타임스탬프 포함)
    switch (entry.source) {
      case "finger":
        console.log(`${ts} [Finger] VISIT : ${entry.queriedIp} - ${apiStatus}`);
        break;
      case "curl_self":
        console.log(`${ts} [CURL] SELF : ${entry.queriedIp} - ${apiStatus}`);
        break;
      case "curl_other":
        console.log(
          `${ts} [CURL] OTHER : ${entry.requestIp} -> ${entry.queriedIp} - ${apiStatus}`
        );
        break;
    }
  } catch (error) {
    console.error("[Log Error]", error);
  }
}

/**
 * 최근 IP 조회 기록 조회
 * @param limit 최대 개수 (기본 100)
 */
export function getRecentIPQueries(limit: number = 100): IPLogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    // 최근 기록부터 반환
    return lines
      .slice(-limit)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line) as IPLogEntry;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is IPLogEntry => entry !== null);
  } catch (error) {
    console.error("[IP Log] Failed to read log:", error);
    return [];
  }
}

/**
 * 오늘 조회된 IP 통계
 */
export function getTodayStats(): {
  total: number;
  uniqueIPs: number;
  vpnDetected: number;
  proxyDetected: number;
  torDetected: number;
} {
  const today = new Date().toISOString().split("T")[0];
  const queries = getRecentIPQueries(10000);

  const todayQueries = queries.filter((q) => q.timestamp.startsWith(today));
  const uniqueIPs = new Set(todayQueries.map((q) => q.queriedIp));

  return {
    total: todayQueries.length,
    uniqueIPs: uniqueIPs.size,
    vpnDetected: todayQueries.filter((q) => q.vpn).length,
    proxyDetected: todayQueries.filter((q) => q.proxy).length,
    torDetected: todayQueries.filter((q) => q.tor).length,
  };
}
