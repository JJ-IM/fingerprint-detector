/**
 * ip-api.com API 분석기
 *
 * 공식 문서: https://ip-api.com/docs/api:json
 *
 * 무료 플랜: 분당 45회 (HTTP만)
 * Pro 플랜: HTTPS 지원, 무제한
 *
 * 사용법:
 * const analyzer = new IpApiAnalyzer();
 * const result = await analyzer.analyze('8.8.8.8');
 */

import { IPBasicInfo, IPSecurityInfo, calculateRiskLevel } from "./ip-types";
import { debugLog } from "./debug-logger";

// ========================================
// ip-api.com API 응답 타입
// ========================================

export interface IpApiResponse {
  status: "success" | "fail";
  message?: string; // 실패 시 에러 메시지
  query: string; // 조회한 IP
  continent: string;
  continentCode: string;
  country: string;
  countryCode: string;
  region: string; // 지역 코드 (예: QC)
  regionName: string; // 지역 이름 (예: Quebec)
  city: string;
  district: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  offset: number; // UTC offset (초)
  currency: string;
  isp: string;
  org: string;
  as: string; // AS 번호 + 이름
  asname: string;
  reverse: string; // 역방향 DNS
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
}

export interface IpApiAnalysisResult {
  success: boolean;
  basic: IPBasicInfo | null;
  security: Partial<IPSecurityInfo> | null;
  source: "ip-api.com";
  raw?: IpApiResponse;
  error?: {
    code: string;
    message: string;
    hint?: string;
  };
}

export class IpApiAnalyzer {
  // 무료 버전은 HTTP만 지원 (Pro는 HTTPS)
  private readonly baseUrl = "http://ip-api.com/json";

  // 모든 필드를 가져오기 위한 fields 값
  // 공식 문서: https://ip-api.com/docs/api:json#fields
  // 66846719 = 모든 필드 비트마스크
  private readonly fields = 66846719;

  constructor() {
    // ip-api.com 무료 버전은 API 키 불필요
  }

  /**
   * IP 주소 분석
   * @param ip - 분석할 IP 주소
   */
  async analyze(ip: string): Promise<IpApiAnalysisResult> {
    try {
      const url = `${this.baseUrl}/${ip}?fields=${this.fields}`;
      debugLog("ip-api.com", `Analyzing: ${ip}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      // HTTP 에러 처리
      if (!response.ok) {
        return this.handleHttpError(response.status);
      }

      const data: IpApiResponse = await response.json();

      // API 상태 확인
      if (data.status === "fail") {
        return {
          success: false,
          basic: null,
          security: null,
          source: "ip-api.com",
          error: {
            code: "API_ERROR",
            message: data.message || "IP 조회에 실패했습니다",
            hint: this.getErrorHint(data.message),
          },
        };
      }

      // 결과 파싱
      const basic = this.parseBasicInfo(data);
      const security = this.parseSecurityInfo(data);

      return {
        success: true,
        basic,
        security,
        source: "ip-api.com",
        raw: data,
      };
    } catch (error) {
      console.error("[ip-api.com] Error:", error);
      return {
        success: false,
        basic: null,
        security: null,
        source: "ip-api.com",
        error: {
          code: "FETCH_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          hint: "네트워크 연결을 확인해주세요",
        },
      };
    }
  }

  /**
   * 기본 정보 파싱
   */
  private parseBasicInfo(data: IpApiResponse): IPBasicInfo {
    // AS 번호 추출 (예: "AS5769 Videotron Ltee" -> "AS5769")
    const asnMatch = data.as?.match(/^(AS\d+)/);
    const asn = asnMatch ? asnMatch[1] : data.as || "";

    return {
      ip: data.query,
      country: data.country || "Unknown",
      countryCode: data.countryCode || "",
      continent: data.continent || "",
      city: data.city || "Unknown",
      region: data.regionName || "",
      regionCode: data.region || "",
      zipCode: data.zip || "",
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || "",
      isp: data.isp || "Unknown",
      organization: data.org || "",
      asn: asn,
      // ip-api는 networkType을 직접 제공하지 않음
      // hosting 플래그로 추론
      networkType: data.hosting ? "Hosting" : "Unknown",
      hostname: data.reverse || null,
      ipRange: null, // ip-api는 제공하지 않음
    };
  }

  /**
   * 보안 정보 파싱
   * ip-api는 제한된 보안 정보만 제공
   */
  private parseSecurityInfo(data: IpApiResponse): Partial<IPSecurityInfo> {
    // ip-api는 proxy와 hosting만 감지
    // VPN은 감지하지 않음 (proxy에 포함될 수 있음)
    const isProxy = data.proxy || false;
    const isHosting = data.hosting || false;
    const isMobile = data.mobile || false;

    // ip-api는 risk score를 제공하지 않으므로
    // 감지 결과 기반으로 간단한 점수 계산
    let estimatedRisk = 0;
    if (isProxy) estimatedRisk += 66; // Proxy 감지 시
    if (isHosting) estimatedRisk += 33; // Hosting 감지 시

    return {
      isAnonymous: isProxy,
      isVPN: false, // ip-api는 VPN 감지 불가
      isProxy: isProxy,
      isTor: false, // ip-api는 TOR 감지 불가
      isRelay: false,
      isHosting: isHosting,
      isScraper: false,
      isCompromised: false,
      hasAttackHistory: false,

      // ip-api 추정 점수 (참고용)
      riskScore: Math.min(estimatedRisk, 100),
      confidenceScore: null,
      riskLevel: calculateRiskLevel(estimatedRisk),

      firstSeen: null,
      lastSeen: null,

      estimatedDevices: {
        ip: null,
        subnet: null,
      },

      // 추가 정보: mobile 플래그
      // @ts-expect-error - 확장 필드
      isMobile: isMobile,
    };
  }

  /**
   * HTTP 에러 처리
   */
  private handleHttpError(status: number): IpApiAnalysisResult {
    const errors: Record<number, { message: string; hint: string }> = {
      429: {
        message: "요청 한도 초과 (분당 45회)",
        hint: "잠시 후 다시 시도해주세요",
      },
      500: {
        message: "ip-api.com 서버 오류",
        hint: "잠시 후 다시 시도해주세요",
      },
    };

    const errorInfo = errors[status] || {
      message: `HTTP 오류: ${status}`,
      hint: "잠시 후 다시 시도해주세요",
    };

    return {
      success: false,
      basic: null,
      security: null,
      source: "ip-api.com",
      error: {
        code: `HTTP_${status}`,
        message: errorInfo.message,
        hint: errorInfo.hint,
      },
    };
  }

  /**
   * API 에러 메시지에 따른 힌트 생성
   */
  private getErrorHint(message?: string): string {
    if (!message) return "잠시 후 다시 시도해주세요";

    if (message.includes("private range")) {
      return "사설 IP 주소는 조회할 수 없습니다";
    }
    if (message.includes("reserved range")) {
      return "예약된 IP 대역은 조회할 수 없습니다";
    }
    if (message.includes("invalid query")) {
      return "올바른 IP 주소 형식인지 확인해주세요";
    }

    return "잠시 후 다시 시도해주세요";
  }
}

// 기본 인스턴스 내보내기
export const ipApiAnalyzer = new IpApiAnalyzer();
