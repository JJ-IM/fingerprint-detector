import { NextRequest } from "next/server";
import { MultiSourceIPAnalyzer } from "@/lib/multi-source-analyzer";
import { logIPQuery } from "@/lib/ip-logger";

interface RouteParams {
  params: Promise<{ ip: string }>;
}

// IP를 숫자로 변환 (CIDR 비교용)
function ipToNumber(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

// CIDR 범위 체크
function isInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  return (ipToNumber(ip) & mask) === (ipToNumber(range) & mask);
}

// 예약된 IP 범위 정의
interface ReservedRange {
  cidr: string;
  name: string;
  description: string;
}

const RESERVED_RANGES: ReservedRange[] = [
  // 특수 목적
  { cidr: "0.0.0.0/8", name: "Current Network", description: "현재 네트워크 (소스 전용)" },
  { cidr: "255.255.255.255/32", name: "Broadcast", description: "브로드캐스트 주소" },
  
  // 루프백
  { cidr: "127.0.0.0/8", name: "Loopback", description: "루프백 주소 (localhost)" },
  
  // 사설망 (RFC 1918)
  { cidr: "10.0.0.0/8", name: "Private (Class A)", description: "사설망 주소 (RFC 1918)" },
  { cidr: "172.16.0.0/12", name: "Private (Class B)", description: "사설망 주소 (RFC 1918)" },
  { cidr: "192.168.0.0/16", name: "Private (Class C)", description: "사설망 주소 (RFC 1918)" },
  
  // 링크 로컬
  { cidr: "169.254.0.0/16", name: "Link-Local", description: "링크 로컬 주소 (APIPA)" },
  
  // CGNAT (RFC 6598)
  { cidr: "100.64.0.0/10", name: "CGNAT", description: "통신사 내부 NAT 주소 (RFC 6598)" },
  
  // 문서/테스트용 (RFC 5737)
  { cidr: "192.0.2.0/24", name: "TEST-NET-1", description: "문서 및 예제용 (RFC 5737)" },
  { cidr: "198.51.100.0/24", name: "TEST-NET-2", description: "문서 및 예제용 (RFC 5737)" },
  { cidr: "203.0.113.0/24", name: "TEST-NET-3", description: "문서 및 예제용 (RFC 5737)" },
  
  // IETF 프로토콜
  { cidr: "192.0.0.0/24", name: "IETF Protocol", description: "IETF 프로토콜 할당" },
  
  // 벤치마크 (RFC 2544)
  { cidr: "198.18.0.0/15", name: "Benchmark", description: "네트워크 벤치마크 테스트용 (RFC 2544)" },
  
  // 멀티캐스트 (RFC 5771)
  { cidr: "224.0.0.0/4", name: "Multicast", description: "멀티캐스트 주소" },
  
  // 예약됨 (미래 사용)
  { cidr: "240.0.0.0/4", name: "Reserved", description: "미래 사용을 위해 예약됨" },
];

// IP 형식 및 예약 범위 검증
function validateIP(ip: string): { valid: boolean; error?: string; hint?: string; rangeInfo?: ReservedRange } {
  // IPv4 패턴
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Pattern);
  
  if (match) {
    const parts = [match[1], match[2], match[3], match[4]].map(Number);
    const invalidParts = parts.filter((part) => part > 255);
    
    if (invalidParts.length > 0) {
      return {
        valid: false,
        error: "잘못된 IP 형식입니다",
        hint: `각 옥텟은 0-255 범위여야 합니다 (${invalidParts.join(", ")}은 범위 초과)`,
      };
    }
    
    // 예약된 IP 범위 체크
    for (const range of RESERVED_RANGES) {
      if (isInCIDR(ip, range.cidr)) {
        return {
          valid: false,
          error: `예약된 IP 주소입니다 (${range.name})`,
          hint: range.description,
          rangeInfo: range,
        };
      }
    }
    
    return { valid: true };
  }

  // IPv6 간단 검증
  if (ip.includes(":")) {
    // IPv6 루프백
    if (ip === "::1") {
      return {
        valid: false,
        error: "예약된 IP 주소입니다 (Loopback)",
        hint: "IPv6 루프백 주소",
      };
    }
    
    // IPv6 링크 로컬 (fe80::/10)
    if (ip.toLowerCase().startsWith("fe80:")) {
      return {
        valid: false,
        error: "예약된 IP 주소입니다 (Link-Local)",
        hint: "IPv6 링크 로컬 주소",
      };
    }
    
    // 기본적인 IPv6 패턴 체크
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (ipv6Pattern.test(ip) || ip.startsWith("::ffff:")) {
      return { valid: true };
    }
    return {
      valid: false,
      error: "잘못된 IPv6 형식입니다",
      hint: "올바른 IPv6 주소를 입력해주세요",
    };
  }

  return {
    valid: false,
    error: "잘못된 IP 형식입니다",
    hint: "IPv4 (예: 8.8.8.8) 또는 IPv6 형식으로 입력해주세요",
  };
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

  // 요청자 IP 추출
  const requestorIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // IP 형식 검증
  const ipValidation = validateIP(ip);
  if (!ipValidation.valid) {
    return new Response(
      JSON.stringify(
        {
          ip,
          error: ipValidation.error,
          hint: ipValidation.hint,
        },
        null,
        2
      ),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      }
    );
  }

  // IP 분석 수행
  const analyzer = new MultiSourceIPAnalyzer();
  const result = await analyzer.analyze(ip);

  // IP 조회 로깅 (다른 IP 조회)
  logIPQuery({
    timestamp: new Date().toISOString(),
    requestIp: requestorIp,
    queriedIp: ip,
    country: result.basic?.country,
    city: result.basic?.city,
    riskScore: result.security?.riskScore,
    vpn: result.security?.isVPN,
    proxy: result.security?.isProxy,
    tor: result.security?.isTor,
    source: "curl_other",
    userAgent: request.headers.get("user-agent") || undefined,
    proxyCheckUsed: result.sources?.proxycheck?.success ?? false,
    ipApiUsed: result.sources?.ipApi?.success ?? false,
  });

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
