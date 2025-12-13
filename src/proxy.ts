import { NextRequest, NextResponse } from "next/server";

// curl/CLI 요청 감지
function isCurlRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";

  // curl 요청 감지
  if (userAgent.toLowerCase().includes("curl")) return true;
  // wget 요청 감지
  if (userAgent.toLowerCase().includes("wget")) return true;
  // httpie 등 다른 CLI 도구
  if (userAgent.toLowerCase().includes("httpie")) return true;
  // Accept 헤더가 */* 이고 브라우저가 아닌 경우
  if (accept === "*/*" && !userAgent.includes("Mozilla")) return true;

  return false;
}

// IP 주소 형식 검증
function isValidIP(ip: string): boolean {
  // IPv4 패턴
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  // IPv6 간단 검증
  if (ip.includes(":")) {
    return true;
  }

  return false;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";

  // API 경로는 그대로 통과
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 정적 파일, _next 등은 통과 (단, IP 주소 형식은 제외)
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // 파일 확장자가 있는 경우 통과 (IP 주소는 제외)
  const hasFileExtension = /\.[a-zA-Z]{2,4}$/.test(pathname);
  if (hasFileExtension) {
    return NextResponse.next();
  }

  // /fingerprint 경로는 그대로 통과 (핑거프린트 페이지)
  if (pathname === "/fingerprint") {
    return NextResponse.next();
  }

  // curl 요청인 경우
  if (isCurlRequest(request)) {
    // 루트 요청: /api/cli로 리라이트
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/api/cli", request.url));
    }

    // /IP주소 요청: /api/cli/IP주소로 리라이트
    const ipCandidate = pathname.slice(1); // 앞의 / 제거
    if (isValidIP(ipCandidate)) {
      return NextResponse.rewrite(
        new URL(`/api/cli/${ipCandidate}`, request.url)
      );
    }
  }

  // 브라우저 루트 요청: /fingerprint로 리다이렉트
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/fingerprint", request.url));
  }

  // 그 외 IP 형식 경로로 브라우저 접근 시 fingerprint로 리다이렉트
  const ipCandidate = pathname.slice(1);
  if (isValidIP(ipCandidate)) {
    return NextResponse.redirect(new URL("/fingerprint", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
