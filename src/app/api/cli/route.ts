import { NextRequest } from "next/server";
import { MultiSourceIPAnalyzer } from "@/lib/multi-source-analyzer";

// IP 주소 추출
function getClientIP(request: NextRequest): string {
  // Cloudflare
  const cfConnecting = request.headers.get("cf-connecting-ip");
  if (cfConnecting) return cfConnecting;

  // Vercel/프록시 환경
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Vercel
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "127.0.0.1";
}

// 로컬 IP인지 확인
function isLocalIP(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.2") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  );
}

// 실제 공인 IP 가져오기 (로컬 개발 환경용)
async function getPublicIP(): Promise<string | null> {
  try {
    const response = await fetch("http://ip-api.com/json/?fields=query", {
      signal: AbortSignal.timeout(2000),
    });
    const data = await response.json();
    return data.query || null;
  } catch {
    return null;
  }
}

// 응답 포맷 생성
function formatResponse(
  result: Awaited<ReturnType<MultiSourceIPAnalyzer["analyze"]>>,
  ip: string
) {
  if (!result.success || !result.basic) {
    return {
      status: 500,
      body: {
        ip,
        error: result.error?.message || "Analysis failed",
        hint: result.error?.hint || null,
        sources: result.sources,
      },
    };
  }

  const { basic, security, sources, meta, extended } = result;

  // ipinfo.io 스타일의 예쁜 JSON 응답
  const response = {
    // === 기본 정보 ===
    ip: basic.ip,
    hostname: basic.hostname || undefined,
    city: basic.city || undefined,
    region: basic.region || undefined,
    country: basic.country || undefined,
    country_code: basic.countryCode || undefined,
    continent: basic.continent || undefined,
    postal: basic.zipCode || undefined,
    timezone: basic.timezone || undefined,
    loc:
      basic.latitude && basic.longitude
        ? `${basic.latitude},${basic.longitude}`
        : undefined,

    // === 네트워크 정보 ===
    org: basic.organization
      ? `${basic.asn} ${basic.organization}`
      : basic.asn || undefined,
    isp: basic.isp || undefined,
    asn: basic.asn || undefined,
    network_type:
      basic.networkType !== "Unknown" ? basic.networkType : undefined,
    ip_range: basic.ipRange || undefined,

    // === 보안 분석 ===
    security: security
      ? {
          risk_score: security.riskScore,
          risk_level: security.riskLevel,
          vpn: security.isVPN || false,
          proxy: security.isProxy || false,
          tor: security.isTor || false,
          relay: security.isRelay || false,
          hosting: security.isHosting || false,
          anonymous: security.isAnonymous || false,
          bot: security.isScraper || false,
          compromised: security.isCompromised || false,
          confidence: security.confidenceScore || undefined,
        }
      : undefined,

    // === VPN 운영자 정보 (있는 경우) ===
    operator: security?.operator
      ? {
          name: security.operator.name,
          anonymity: security.operator.anonymity,
          no_logs: security.operator.noLogs,
        }
      : undefined,

    // === 확장 정보 (ip-api 전용) ===
    mobile: extended?.mobile || undefined,
    currency: extended?.currency || undefined,

    // === 메타 정보 ===
    _meta: {
      sources: {
        proxycheck: sources.proxycheck.success ? "ok" : "failed",
        ip_api: sources.ipApi.success ? "ok" : "failed",
      },
      primary_source: meta.primarySource,
      response_time_ms: meta.responseTime.total,
      analyzed_at: meta.mergedAt,
    },
  };

  // undefined 제거
  const cleanResponse = JSON.parse(JSON.stringify(response));

  return {
    status: 200,
    body: cleanResponse,
    responseTime: meta.responseTime.total,
  };
}

/**
 * CLI 요청: 클라이언트 IP 분석
 * curl localhost:3000 → 요청자의 IP 정보 반환
 */
export async function GET(request: NextRequest) {
  let clientIP = getClientIP(request);

  // 로컬 IP인 경우 공인 IP 가져오기
  if (isLocalIP(clientIP)) {
    const publicIP = await getPublicIP();
    if (publicIP) {
      clientIP = publicIP;
    }
  }

  // IP 분석 수행
  const analyzer = new MultiSourceIPAnalyzer();
  const result = await analyzer.analyze(clientIP);

  const formatted = formatResponse(result, clientIP);

  return new Response(JSON.stringify(formatted.body, null, 2), {
    status: formatted.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache",
      ...(formatted.responseTime && {
        "X-Response-Time": `${formatted.responseTime}ms`,
      }),
    },
  });
}
