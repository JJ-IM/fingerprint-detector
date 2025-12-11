import { NextRequest, NextResponse } from "next/server";
import { ProxyCheckAnalyzer } from "@/lib/ip-analyzer";

/**
 * ProxyCheck.io v3 API를 사용한 IP 분석
 *
 * GET /api/ip/analyze
 * GET /api/ip/analyze?ip=8.8.8.8
 *
 * 유료 플랜: 10,000+ 쿼리/일
 * API 버전: v3 (20-November-2025)
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
        console.log("[IP Analyze] Detected IP from ip-api.com:", clientIp);
      } catch (e) {
        console.error("[IP Analyze] Failed to detect IP:", e);
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

    // ProxyCheck 분석 실행
    const analyzer = new ProxyCheckAnalyzer();
    const result = await analyzer.analyze(clientIp);

    // 에러 발생 시
    if (!result.success || result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || "IP 분석에 실패했습니다",
          hint: result.error?.hint,
          code: result.error?.code,
          source: result.source,
          data: null,
        },
        { status: result.error?.code?.startsWith("HTTP_429") ? 429 : 400 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      source: result.source,
      apiVersion: result.apiVersion,
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
