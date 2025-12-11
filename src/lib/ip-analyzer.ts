/**
 * ProxyCheck.io v3 API 분석기
 *
 * 공식 문서: https://proxycheck.io/api/
 * API 버전: v3 (20-November-2025)
 *
 * 무료 플랜: 1,000 쿼리/일
 *
 * 사용법:
 * const analyzer = new ProxyCheckAnalyzer();
 * const result = await analyzer.analyze('8.8.8.8');
 */

import {
  ProxyCheckV3Response,
  ProxyCheckIPResult,
  IPBasicInfo,
  IPSecurityInfo,
  IPAnalysisResult,
  calculateRiskLevel,
} from "./ip-types";

export class ProxyCheckAnalyzer {
  private readonly apiKey: string;
  private readonly baseUrl = "https://proxycheck.io/v3";
  private readonly apiVersion = "20-November-2025";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PROXYCHECK_API_KEY || "";

    if (!this.apiKey) {
      console.warn(
        "[ProxyCheck] API key not configured. Using limited free tier."
      );
    }
  }

  /**
   * IP 주소 분석
   * @param ip - 분석할 IP 주소 (없으면 요청자 IP 자동 감지)
   */
  async analyze(ip?: string): Promise<IPAnalysisResult> {
    try {
      const url = this.buildUrl(ip);
      console.log(`[ProxyCheck] Analyzing: ${ip || "auto-detect"}`);

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

      const data: ProxyCheckV3Response = await response.json();

      // API 상태 확인
      if (data.status === "error" || data.status === "denied") {
        return this.handleApiError(
          data.status,
          data.message || "Unknown error"
        );
      }

      // 응답에서 IP 결과 추출
      const ipResult = this.extractIPResult(data);

      if (!ipResult) {
        return {
          success: false,
          basic: null,
          security: null,
          source: "proxycheck.io",
          apiVersion: this.apiVersion,
          error: {
            code: "NO_DATA",
            message: "IP 데이터를 찾을 수 없습니다",
            hint: "올바른 IP 주소인지 확인해주세요",
          },
        };
      }

      // 결과 파싱
      const basic = this.parseBasicInfo(ipResult.ip, ipResult.data);
      const security = this.parseSecurityInfo(ipResult.data);

      return {
        success: true,
        basic,
        security,
        source: "proxycheck.io",
        apiVersion: this.apiVersion,
      };
    } catch (error) {
      console.error("[ProxyCheck] Error:", error);
      return {
        success: false,
        basic: null,
        security: null,
        source: "proxycheck.io",
        apiVersion: this.apiVersion,
        error: {
          code: "FETCH_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          hint: "네트워크 연결을 확인해주세요",
        },
      };
    }
  }

  /**
   * API URL 생성
   */
  private buildUrl(ip?: string): string {
    const ipPart = ip ? `/${ip}` : "";
    const params = new URLSearchParams({
      key: this.apiKey,
      ver: this.apiVersion,
      p: "0", // 기계 친화적 포맷 (pretty formatting 비활성화)
    });

    return `${this.baseUrl}${ipPart}?${params.toString()}`;
  }

  /**
   * 응답에서 IP 결과 추출
   */
  private extractIPResult(
    data: ProxyCheckV3Response
  ): { ip: string; data: ProxyCheckIPResult } | null {
    // 응답에서 IP 주소 찾기
    for (const key of Object.keys(data)) {
      if (key === "status" || key === "message" || key === "ip") continue;

      const value = data[key];
      if (value && typeof value === "object" && "network" in value) {
        return {
          ip: key,
          data: value as ProxyCheckIPResult,
        };
      }
    }

    // short=1 모드에서는 'ip' 키가 있을 수 있음
    if (data.ip && typeof data === "object") {
      const shortResult = data as unknown as ProxyCheckIPResult & {
        ip: string;
        status: string;
      };
      if (shortResult.network) {
        return {
          ip: shortResult.ip,
          data: shortResult,
        };
      }
    }

    return null;
  }

  /**
   * 기본 정보 파싱 (v3 실제 응답 구조에 맞춤)
   */
  private parseBasicInfo(ip: string, data: ProxyCheckIPResult): IPBasicInfo {
    const { network, location } = data;

    return {
      ip,
      country: location.country_name || "Unknown",
      countryCode: location.country_code || "",
      continent: location.continent_name || "",
      city: location.city_name || "Unknown",
      region: location.region_name || "",
      regionCode: location.region_code || "",
      zipCode: location.postal_code || "",
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
      timezone: location.timezone || "",
      isp: network.provider || "Unknown",
      organization: network.organisation || "",
      asn: network.asn || "",
      networkType: network.type || "Unknown",
      hostname: network.hostname,
      ipRange: network.range,
    };
  }

  /**
   * 보안 정보 파싱 (v3 실제 응답 구조에 맞춤 - risk가 detections 안에 있음)
   */
  private parseSecurityInfo(data: ProxyCheckIPResult): IPSecurityInfo {
    const { detections, device_estimate, operator } = data;

    // risk는 detections 안에 있음
    const riskScore = detections.risk ?? 0;

    // VPN 운영자 정보 처리
    let operatorInfo: IPSecurityInfo["operator"] | undefined;
    if (operator) {
      operatorInfo = {
        name: operator.name,
        url: operator.url,
        anonymity: operator.anonymity,
        popularity: operator.popularity,
        protocols: operator.protocols,
        noLogs: !operator.policies.logging,
      };
    }

    return {
      // 위협 감지
      isAnonymous: detections.anonymous ?? false,
      isVPN: detections.vpn ?? false,
      isProxy: detections.proxy ?? false,
      isTor: detections.tor ?? false,
      isRelay: detections.relay ?? false,
      isHosting: detections.hosting ?? false,
      isScraper: detections.scraper ?? false,
      isCompromised: detections.compromised ?? false,
      hasAttackHistory: detections.attack_history ?? false,

      // 점수 (risk는 detections 안에 있음)
      riskScore: riskScore,
      confidenceScore: detections.confidence,
      riskLevel: calculateRiskLevel(riskScore),

      // 시간 정보
      firstSeen: detections.first_seen,
      lastSeen: detections.last_seen,

      // 디바이스 추정 (v3 필드명)
      estimatedDevices: {
        ip: device_estimate.address,
        subnet: device_estimate.subnet,
      },

      // VPN 운영자
      operator: operatorInfo,
    };
  }

  /**
   * HTTP 에러 처리
   */
  private handleHttpError(status: number): IPAnalysisResult {
    const errors: Record<number, { message: string; hint: string }> = {
      400: {
        message: "잘못된 요청입니다",
        hint: "IP 주소 형식을 확인해주세요",
      },
      401: {
        message: "API 키가 유효하지 않습니다",
        hint: ".env.local의 PROXYCHECK_API_KEY를 확인해주세요",
      },
      403: {
        message: "접근이 거부되었습니다",
        hint: "API 키 권한을 확인해주세요",
      },
      429: {
        message: "일일 쿼리 한도(1,000회)를 초과했습니다",
        hint: "내일 다시 시도하거나 유료 플랜을 고려해주세요",
      },
      500: {
        message: "ProxyCheck 서버 오류",
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
      source: "proxycheck.io",
      apiVersion: this.apiVersion,
      error: {
        code: `HTTP_${status}`,
        message: errorInfo.message,
        hint: errorInfo.hint,
      },
    };
  }

  /**
   * API 에러 처리
   */
  private handleApiError(status: string, message: string): IPAnalysisResult {
    // 메시지 기반 힌트 생성
    let hint = "잠시 후 다시 시도해주세요";

    if (message.includes("queries exhausted")) {
      hint =
        "일일 무료 쿼리 한도(1,000회)를 초과했습니다. 내일 다시 시도하세요.";
    } else if (message.includes("API Key")) {
      hint = ".env.local의 PROXYCHECK_API_KEY가 올바른지 확인해주세요.";
    } else if (message.includes("requests per second")) {
      hint = "요청 속도가 너무 빠릅니다. 잠시 후 다시 시도하세요.";
    } else if (message.includes("No valid IP")) {
      hint = "올바른 IP 주소 형식인지 확인해주세요.";
    }

    return {
      success: false,
      basic: null,
      security: null,
      source: "proxycheck.io",
      apiVersion: this.apiVersion,
      error: {
        code: status.toUpperCase(),
        message,
        hint,
      },
    };
  }
}

// 기본 인스턴스 내보내기
export const proxyCheckAnalyzer = new ProxyCheckAnalyzer();
