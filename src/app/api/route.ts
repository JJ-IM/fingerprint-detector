import { NextRequest, NextResponse } from "next/server";
import { ProxyCheckAnalyzer } from "@/lib/ip-analyzer";

// curl 요청을 감지하는 함수
function isCurlRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";

  // curl 요청 감지
  if (userAgent.toLowerCase().includes("curl")) return true;

  // wget 요청 감지
  if (userAgent.toLowerCase().includes("wget")) return true;

  // Accept 헤더가 없거나 */*인 경우 (CLI 도구 특성)
  if (accept === "*/*" || accept === "") return true;

  // httpie 등 다른 CLI 도구
  if (userAgent.toLowerCase().includes("httpie")) return true;

  return false;
}

// IP 주소 추출
function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare 등 프록시 환경
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnecting = request.headers.get("cf-connecting-ip");
  if (cfConnecting) return cfConnecting;

  // Vercel
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "127.0.0.1";
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);

  // curl 요청인 경우 JSON 응답
  if (isCurlRequest(request)) {
    try {
      const analyzer = new ProxyCheckAnalyzer();

      // 로컬 IP인 경우 실제 IP 가져오기
      let targetIP = clientIP;
      if (
        clientIP === "127.0.0.1" ||
        clientIP === "::1" ||
        clientIP.startsWith("192.168.") ||
        clientIP.startsWith("10.")
      ) {
        try {
          const ipApiResponse = await fetch("http://ip-api.com/json/");
          const ipApiData = await ipApiResponse.json();
          if (ipApiData.query) {
            targetIP = ipApiData.query;
          }
        } catch {
          // ip-api 실패시 기본값 사용
        }
      }

      const result = await analyzer.analyze(targetIP);

      // 분석 실패시
      if (!result.success || !result.basic) {
        return NextResponse.json(
          {
            ip: targetIP,
            error: result.error?.message || "Analysis failed",
            hint: result.error?.hint || null,
          },
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
            },
          }
        );
      }

      const { basic, security } = result;

      // ipinfo.io 스타일의 간결한 JSON 응답
      const response = {
        ip: basic.ip,
        city: basic.city || null,
        region: basic.region || null,
        country: basic.country || null,
        country_code: basic.countryCode || null,
        continent: basic.continent || null,
        timezone: basic.timezone || null,
        isp: basic.isp || null,
        org: basic.organization || null,
        asn: basic.asn || null,
        network_type: basic.networkType || null,
        location: {
          latitude: basic.latitude,
          longitude: basic.longitude,
        },
        risk: security
          ? {
              score: security.riskScore ?? 0,
              level: security.riskLevel || "low",
              vpn: security.isVPN ?? false,
              proxy: security.isProxy ?? false,
              tor: security.isTor ?? false,
              hosting: security.isHosting ?? false,
              bot: security.isScraper ?? false,
              anonymous: security.isAnonymous ?? false,
            }
          : null,
        operator: security?.operator
          ? {
              name: security.operator.name,
              anonymity: security.operator.anonymity,
              no_logs: security.operator.noLogs,
            }
          : null,
      };

      // Pretty print JSON (like ipinfo.io)
      const jsonBody = JSON.stringify(response, null, 2);

      return new Response(jsonBody, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    } catch {
      const errorBody = JSON.stringify(
        {
          error: "Failed to analyze IP",
          ip: clientIP,
        },
        null,
        2
      );

      return new Response(errorBody, {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }
  }

  // 브라우저 요청인 경우 메인 페이지로 리다이렉트
  return NextResponse.redirect(new URL("/", request.url));
}
