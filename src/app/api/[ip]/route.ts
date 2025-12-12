import { NextRequest, NextResponse } from "next/server";
import { MultiSourceIPAnalyzer } from "@/lib/multi-source-analyzer";

/**
 * 특정 IP 분석 API
 *
 * GET /api/8.8.8.8
 * GET /api/64.110.88.88
 *
 * curl http://localhost:3000/api/8.8.8.8
 */

interface RouteParams {
  params: Promise<{ ip: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { ip } = await params;

  // IP 유효성 검사 (IPv4, IPv6)
  const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){0,6}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return formatResponse(
      {
        error: "Invalid IP address format",
        query: ip,
        hint: "Please provide a valid IPv4 or IPv6 address",
      },
      400
    );
  }

  try {
    const analyzer = new MultiSourceIPAnalyzer();
    const result = await analyzer.analyze(ip);

    if (!result.success || !result.basic) {
      return formatResponse(
        {
          error: result.error?.message || "Analysis failed",
          query: ip,
          hint: result.error?.hint,
          sources: result.sources,
        },
        500
      );
    }

    return formatResponse(buildResponse(result, ip));
  } catch (error) {
    return formatResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        query: ip,
      },
      500
    );
  }
}

// 통합 응답 빌더 (route.ts와 공유)
function buildResponse(
  result: Awaited<ReturnType<MultiSourceIPAnalyzer["analyze"]>>,
  ip: string
) {
  const { basic, security, sources, meta, extended } = result;

  return {
    // 기본 정보
    ip: basic?.ip || ip,
    city: basic?.city || null,
    region: basic?.region || null,
    country: basic?.country || null,
    country_code: basic?.countryCode || null,
    continent: basic?.continent || null,
    postal: basic?.zipCode || null,
    timezone: basic?.timezone || null,

    // 좌표 (지도용)
    loc:
      basic?.latitude && basic?.longitude
        ? `${basic.latitude},${basic.longitude}`
        : null,
    latitude: basic?.latitude || null,
    longitude: basic?.longitude || null,

    // 네트워크 정보
    isp: basic?.isp || null,
    org: basic?.organization || null,
    asn: basic?.asn || null,
    network_type: basic?.networkType || null,
    hostname: basic?.hostname || null,
    ip_range: basic?.ipRange || null,

    // 위협 분석
    risk: security
      ? {
          score: security.riskScore ?? 0,
          level: security.riskLevel || "low",
          vpn: security.isVPN ?? false,
          proxy: security.isProxy ?? false,
          tor: security.isTor ?? false,
          hosting: security.isHosting ?? false,
          anonymous: security.isAnonymous ?? false,
          bot: security.isScraper ?? false,
          compromised: security.isCompromised ?? false,
          confidence: security.confidenceScore,
        }
      : null,

    // VPN 운영자 정보
    operator: security?.operator
      ? {
          name: security.operator.name,
          anonymity: security.operator.anonymity,
          no_logs: security.operator.noLogs,
        }
      : null,

    // 확장 정보 (ip-api 전용)
    mobile: extended?.mobile ?? false,
    currency: extended?.currency || null,

    // 메타 정보
    _meta: {
      sources: {
        proxycheck: sources.proxycheck.success ? "ok" : "failed",
        ipapi: sources.ipApi.success ? "ok" : "failed",
      },
      primary: meta.primarySource,
      response_time: `${meta.responseTime.total}ms`,
      analyzed_at: meta.mergedAt,
    },
  };
}

// JSON 포맷팅 응답
function formatResponse(data: Record<string, unknown>, status = 200) {
  const jsonBody = JSON.stringify(data, null, 2);

  return new Response(jsonBody + "\n", {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export { buildResponse, formatResponse };
