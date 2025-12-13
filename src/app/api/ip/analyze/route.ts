import { NextRequest, NextResponse } from "next/server";
import { MultiSourceIPAnalyzer } from "@/lib/multi-source-analyzer";
import { logIPQuery } from "@/lib/ip-logger";
import { debugLog } from "@/lib/debug-logger";

/**
 * 통합 IP 분석 API (Multi-Source)
 *
 * ProxyCheck.io + ip-api.com 두 API를 병렬 호출하여
 * 더 정확하고 안정적인 IP 분석 결과를 제공합니다.
 *
 * GET /api/ip/analyze
 * GET /api/ip/analyze?ip=8.8.8.8
 *
 * 특징:
 * - 병렬 호출로 응답 시간 최소화
 * - 한 API 실패 시 다른 API로 폴백
 * - VPN/Proxy 감지는 OR 로직 (하나라도 감지하면 true)
 */
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터에서 IP 가져오기
    const url = new URL(request.url);
    const queryIp = url.searchParams.get("ip");

    // 헤더에서 클라이언트 IP 추출 (Vercel, Cloudflare 등)
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnecting = request.headers.get("cf-connecting-ip");

    // 우선순위: 쿼리 파라미터 > CF > X-Forwarded-For > X-Real-IP
    let clientIp =
      queryIp ||
      cfConnecting ||
      forwarded?.split(",")[0].trim() ||
      realIp ||
      "";

    // 로컬 개발 환경에서는 외부 서비스로 IP 감지
    if (
      !clientIp ||
      clientIp === "::1" ||
      clientIp === "127.0.0.1" ||
      clientIp.startsWith("192.168.") ||
      clientIp.startsWith("10.")
    ) {
      try {
        // ip-api.com으로 현재 IP 감지 (무료, 빠름)
        const ipDetectResponse = await fetch(
          "http://ip-api.com/json/?fields=query",
          {
            cache: "no-store",
          }
        );
        const ipDetectData = await ipDetectResponse.json();
        clientIp = ipDetectData.query || "";
        debugLog("IP Analyze", `Detected IP from ip-api.com: ${clientIp}`);
      } catch (e) {
        debugLog("IP Analyze", `Failed to detect IP: ${e}`);
      }
    }

    // IP가 없으면 에러
    if (!clientIp) {
      return NextResponse.json(
        {
          success: false,
          error: "IP 주소를 감지할 수 없습니다",
          hint: "?ip=x.x.x.x 파라미터로 직접 지정해주세요",
          code: "NO_IP",
          data: null,
        },
        { status: 400 }
      );
    }

    // 통합 분석기로 병렬 분석 실행
    const analyzer = new MultiSourceIPAnalyzer();
    const result = await analyzer.analyze(clientIp);

    // 요청자 IP 추출 (로깅용)
    const requestorIp =
      cfConnecting || forwarded?.split(",")[0].trim() || realIp || "unknown";

    // 에러 발생 시
    if (!result.success || result.error) {
      // 실패해도 로깅
      logIPQuery({
        timestamp: new Date().toISOString(),
        requestIp: requestorIp,
        queriedIp: clientIp,
        source: "finger",
        userAgent: request.headers.get("user-agent") || undefined,
        proxyCheckUsed: result.sources?.proxycheck?.success ?? false,
        ipApiUsed: result.sources?.ipApi?.success ?? false,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "IP 분석에 실패했습니다",
          hint: result.error?.hint,
          code: result.error?.code,
          sources: result.sources,
          data: null,
        },
        { status: 400 }
      );
    }

    // IP 조회 로깅
    logIPQuery({
      timestamp: new Date().toISOString(),
      requestIp: requestorIp,
      queriedIp: clientIp,
      country: result.basic?.country,
      city: result.basic?.city,
      riskScore: result.security?.riskScore,
      vpn: result.security?.isVPN,
      proxy: result.security?.isProxy,
      tor: result.security?.isTor,
      source: "finger",
      userAgent: request.headers.get("user-agent") || undefined,
      proxyCheckUsed: result.sources?.proxycheck?.success ?? false,
      ipApiUsed: result.sources?.ipApi?.success ?? false,
    });

    // 성공 응답
    return NextResponse.json({
      success: true,

      // 데이터 소스 정보
      sources: result.sources,
      meta: result.meta,

      data: {
        // === 기본 정보 ===
        ip: result.basic?.ip || clientIp,
        country: result.basic?.country || "Unknown",
        countryCode: result.basic?.countryCode || "",
        continent: result.basic?.continent || "",
        city: result.basic?.city || "Unknown",
        region: result.basic?.region || "",
        regionName: result.basic?.region || "",
        regionCode: result.basic?.regionCode || "",
        zipCode: result.basic?.zipCode || "",
        latitude: result.basic?.latitude || 0,
        longitude: result.basic?.longitude || 0,
        timezone: result.basic?.timezone || "",

        // === 네트워크 정보 ===
        isp: result.basic?.isp || "Unknown",
        organization: result.basic?.organization || "",
        asn: result.basic?.asn || "",
        networkType: result.basic?.networkType || "Unknown",
        hostname: result.basic?.hostname,
        ipRange: result.basic?.ipRange,

        // === 위협 감지 (VPN/프록시) ===
        anonymous: result.security?.isAnonymous || false,
        vpn: result.security?.isVPN || false,
        proxy: result.security?.isProxy || false,
        tor: result.security?.isTor || false,
        relay: result.security?.isRelay || false,
        hosting: result.security?.isHosting || false,
        scraper: result.security?.isScraper || false,
        compromised: result.security?.isCompromised || false,
        attackHistory: result.security?.hasAttackHistory || false,

        // === 위험도 분석 ===
        riskScore: result.security?.riskScore || 0,
        confidenceScore: result.security?.confidenceScore,
        riskLevel: result.security?.riskLevel || "unknown",

        // === 시간 정보 ===
        firstSeen: result.security?.firstSeen,
        lastSeen: result.security?.lastSeen,

        // === 디바이스 추정 ===
        estimatedDevices: result.security?.estimatedDevices || {
          ip: null,
          subnet: null,
        },

        // === VPN 운영자 정보 (있는 경우) ===
        operator: result.security?.operator || null,

        // === ip-api 확장 필드 ===
        mobile: result.extended?.mobile || false,
        currency: result.extended?.currency || null,
        district: result.extended?.district || null,
        utcOffset: result.extended?.utcOffset || null,
      },
    });
  } catch (error) {
    console.error("[IP Analyze] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        code: "SERVER_ERROR",
        data: null,
      },
      { status: 500 }
    );
  }
}
