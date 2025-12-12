import { NextRequest } from "next/server";
import { MultiSourceIPAnalyzer } from "@/lib/multi-source-analyzer";

interface RouteParams {
  params: Promise<{ ip: string }>;
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
 * CLI 요청: 특정 IP 분석
 * curl localhost:3000/8.8.8.8 → 해당 IP 정보 반환
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { ip } = await params;

  // IP 분석 수행
  const analyzer = new MultiSourceIPAnalyzer();
  const result = await analyzer.analyze(ip);

  const formatted = formatResponse(result, ip);

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
