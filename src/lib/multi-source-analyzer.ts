/**
 * 통합 IP 분석기 (Multi-Source IP Analyzer)
 *
 * ProxyCheck.io + ip-api.com 두 API를 병렬 호출하고
 * 결과를 병합하여 더 정확한 분석 결과를 제공합니다.
 *
 * 특징:
 * - 병렬 호출로 응답 시간 최소화
 * - 한 API 실패 시 다른 API로 폴백
 * - VPN/Proxy 감지는 OR 로직 (하나라도 감지하면 true)
 * - 위험도는 높은 값 채택
 */

import { ProxyCheckAnalyzer } from "./ip-analyzer";
import { IpApiAnalyzer, IpApiAnalysisResult } from "./ip-api-analyzer";
import { debugLog } from "./debug-logger";
import {
  IPBasicInfo,
  IPSecurityInfo,
  IPAnalysisResult,
  calculateRiskLevel,
} from "./ip-types";

// ========================================
// 통합 분석 결과 타입
// ========================================

export interface MultiSourceIPResult {
  success: boolean;
  basic: IPBasicInfo | null;
  security: IPSecurityInfo | null;

  // 데이터 출처 정보
  sources: {
    proxycheck: {
      success: boolean;
      error?: string;
    };
    ipApi: {
      success: boolean;
      error?: string;
    };
  };

  // 병합 메타데이터
  meta: {
    primarySource: "proxycheck.io" | "ip-api.com" | "merged";
    mergedAt: string;
    responseTime: {
      proxycheck: number | null;
      ipApi: number | null;
      total: number;
    };
  };

  // 확장 필드 (ip-api 전용)
  extended?: {
    mobile?: boolean;
    currency?: string;
    district?: string;
    utcOffset?: number;
  };

  error?: {
    code: string;
    message: string;
    hint?: string;
  };
}

// ========================================
// 통합 분석기 클래스
// ========================================

// API 호출 타임아웃 (ms)
const API_TIMEOUT = 3000;

export class MultiSourceIPAnalyzer {
  private proxyCheckAnalyzer: ProxyCheckAnalyzer;
  private ipApiAnalyzer: IpApiAnalyzer;

  constructor() {
    this.proxyCheckAnalyzer = new ProxyCheckAnalyzer();
    this.ipApiAnalyzer = new IpApiAnalyzer();
  }

  /**
   * 두 API를 병렬로 호출하고 결과를 병합
   * @param ip - 분석할 IP 주소
   */
  async analyze(ip: string): Promise<MultiSourceIPResult> {
    const startTime = Date.now();
    debugLog("MultiSource", `Starting parallel analysis for: ${ip}`);

    // 병렬 호출 (하나가 실패해도 다른 것은 계속) + 타임아웃 적용
    const [proxyCheckResult, ipApiResult] = await Promise.allSettled([
      this.timedAnalysis(
        () =>
          this.withTimeout(this.proxyCheckAnalyzer.analyze(ip), API_TIMEOUT),
        "proxycheck"
      ),
      this.timedAnalysis(
        () => this.withTimeout(this.ipApiAnalyzer.analyze(ip), API_TIMEOUT),
        "ip-api"
      ),
    ]);

    const totalTime = Date.now() - startTime;

    // 결과 추출
    const proxyCheck =
      proxyCheckResult.status === "fulfilled" ? proxyCheckResult.value : null;
    const ipApi = ipApiResult.status === "fulfilled" ? ipApiResult.value : null;

    debugLog(
      "MultiSource",
      `ProxyCheck: ${proxyCheck?.result?.success ? "✓" : "✗"}`
    );
    debugLog(
      "MultiSource",
      `ip-api.com: ${ipApi?.result?.success ? "✓" : "✗"}`
    );

    // 둘 다 실패한 경우
    if (!proxyCheck?.result?.success && !ipApi?.result?.success) {
      return {
        success: false,
        basic: null,
        security: null,
        sources: {
          proxycheck: {
            success: false,
            error: proxyCheck?.result?.error?.message || "Failed to fetch",
          },
          ipApi: {
            success: false,
            error: ipApi?.result?.error?.message || "Failed to fetch",
          },
        },
        meta: {
          primarySource: "merged",
          mergedAt: new Date().toISOString(),
          responseTime: {
            proxycheck: proxyCheck?.time ?? null,
            ipApi: ipApi?.time ?? null,
            total: totalTime,
          },
        },
        error: {
          code: "ALL_SOURCES_FAILED",
          message: "모든 IP 분석 소스에서 실패했습니다",
          hint: "네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요",
        },
      };
    }

    // 결과 병합
    const merged = this.mergeResults(
      proxyCheck?.result as IPAnalysisResult | null,
      ipApi?.result as IpApiAnalysisResult | null
    );

    return {
      success: true,
      basic: merged.basic,
      security: merged.security,
      sources: {
        proxycheck: {
          success: proxyCheck?.result?.success ?? false,
          error: proxyCheck?.result?.error?.message,
        },
        ipApi: {
          success: ipApi?.result?.success ?? false,
          error: ipApi?.result?.error?.message,
        },
      },
      meta: {
        primarySource: merged.primarySource,
        mergedAt: new Date().toISOString(),
        responseTime: {
          proxycheck: proxyCheck?.time ?? null,
          ipApi: ipApi?.time ?? null,
          total: totalTime,
        },
      },
      extended: merged.extended,
    };
  }

  /**
   * 시간 측정이 포함된 분석 실행
   */
  private async timedAnalysis<T>(
    fn: () => Promise<T>,
    name: string
  ): Promise<{ result: T; time: number }> {
    const start = Date.now();
    try {
      const result = await fn();
      const time = Date.now() - start;
      debugLog("MultiSource", `${name} completed in ${time}ms`);
      return { result, time };
    } catch (error) {
      const time = Date.now() - start;
      debugLog("MultiSource", `${name} failed after ${time}ms: ${error}`);
      throw error;
    }
  }

  /**
   * Promise에 타임아웃 적용
   */
  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  }

  /**
   * 두 결과를 병합
   *
   * 병합 전략:
   * - 위치 정보: ProxyCheck 우선 (유료 서비스로 더 정확)
   * - 보안 감지: OR 로직 (하나라도 감지하면 true)
   * - 위험도: 높은 값 채택
   * - ProxyCheck 전용 필드: ProxyCheck에서만 가져옴
   * - ip-api 전용 필드 (mobile 등): extended로 제공
   */
  private mergeResults(
    proxyCheck: IPAnalysisResult | null,
    ipApi: IpApiAnalysisResult | null
  ): {
    basic: IPBasicInfo | null;
    security: IPSecurityInfo | null;
    primarySource: "proxycheck.io" | "ip-api.com" | "merged";
    extended?: MultiSourceIPResult["extended"];
  } {
    // ProxyCheck만 성공
    if (proxyCheck?.success && !ipApi?.success) {
      return {
        basic: proxyCheck.basic,
        security: proxyCheck.security,
        primarySource: "proxycheck.io",
      };
    }

    // ip-api만 성공
    if (!proxyCheck?.success && ipApi?.success) {
      return {
        basic: ipApi.basic,
        security: this.convertPartialSecurity(ipApi.security),
        primarySource: "ip-api.com",
        extended: this.extractExtended(ipApi),
      };
    }

    // 둘 다 성공 - 병합!
    if (proxyCheck?.success && ipApi?.success) {
      return {
        basic: this.mergeBasicInfo(proxyCheck.basic!, ipApi.basic!),
        security: this.mergeSecurityInfo(proxyCheck.security!, ipApi.security!),
        primarySource: "merged",
        extended: this.extractExtended(ipApi),
      };
    }

    // 둘 다 실패 (이미 위에서 처리됨)
    return {
      basic: null,
      security: null,
      primarySource: "merged",
    };
  }

  /**
   * 기본 정보 병합
   * ProxyCheck 우선, 빈 값은 ip-api로 채움
   */
  private mergeBasicInfo(
    proxyCheck: IPBasicInfo,
    ipApi: IPBasicInfo
  ): IPBasicInfo {
    return {
      ip: proxyCheck.ip || ipApi.ip,
      country: proxyCheck.country || ipApi.country,
      countryCode: proxyCheck.countryCode || ipApi.countryCode,
      continent: proxyCheck.continent || ipApi.continent,
      city: proxyCheck.city || ipApi.city,
      region: proxyCheck.region || ipApi.region,
      regionCode: proxyCheck.regionCode || ipApi.regionCode,
      zipCode: proxyCheck.zipCode || ipApi.zipCode,
      latitude: proxyCheck.latitude || ipApi.latitude,
      longitude: proxyCheck.longitude || ipApi.longitude,
      timezone: proxyCheck.timezone || ipApi.timezone,
      isp: proxyCheck.isp || ipApi.isp,
      organization: proxyCheck.organization || ipApi.organization,
      asn: proxyCheck.asn || ipApi.asn,
      networkType:
        proxyCheck.networkType !== "Unknown"
          ? proxyCheck.networkType
          : ipApi.networkType,
      hostname: proxyCheck.hostname || ipApi.hostname,
      ipRange: proxyCheck.ipRange || ipApi.ipRange,
    };
  }

  /**
   * 보안 정보 병합
   *
   * 핵심 전략:
   * - VPN/Proxy/Tor 등 위협 감지: OR 로직 (하나라도 true면 true)
   * - Risk Score: 높은 값 채택
   * - ProxyCheck 전용 필드: ProxyCheck 값 사용
   */
  private mergeSecurityInfo(
    proxyCheck: IPSecurityInfo,
    ipApi: Partial<IPSecurityInfo>
  ): IPSecurityInfo {
    // OR 로직으로 위협 감지 병합
    const isAnonymous = proxyCheck.isAnonymous || ipApi.isAnonymous || false;
    const isVPN = proxyCheck.isVPN || ipApi.isVPN || false;
    const isProxy = proxyCheck.isProxy || ipApi.isProxy || false;
    const isTor = proxyCheck.isTor || ipApi.isTor || false;
    const isHosting = proxyCheck.isHosting || ipApi.isHosting || false;

    // 더 높은 위험 점수 채택
    const riskScore = Math.max(proxyCheck.riskScore || 0, ipApi.riskScore || 0);

    // 위협이 감지되었지만 ProxyCheck 점수가 낮은 경우 보정
    let adjustedRiskScore = riskScore;
    if (isVPN && riskScore < 50)
      adjustedRiskScore = Math.max(adjustedRiskScore, 50);
    if (isProxy && riskScore < 66)
      adjustedRiskScore = Math.max(adjustedRiskScore, 66);
    if (isTor && riskScore < 75)
      adjustedRiskScore = Math.max(adjustedRiskScore, 75);

    return {
      // 위협 감지 (OR 로직)
      isAnonymous: isAnonymous || isVPN || isProxy || isTor,
      isVPN,
      isProxy,
      isTor,
      isRelay: proxyCheck.isRelay || false,
      isHosting,
      isScraper: proxyCheck.isScraper || false,
      isCompromised: proxyCheck.isCompromised || false,
      hasAttackHistory: proxyCheck.hasAttackHistory || false,

      // 점수 (높은 값 또는 보정된 값)
      riskScore: adjustedRiskScore,
      confidenceScore: proxyCheck.confidenceScore,
      riskLevel: calculateRiskLevel(adjustedRiskScore),

      // ProxyCheck 전용 필드
      firstSeen: proxyCheck.firstSeen,
      lastSeen: proxyCheck.lastSeen,
      estimatedDevices: proxyCheck.estimatedDevices,
      operator: proxyCheck.operator,
    };
  }

  /**
   * Partial<IPSecurityInfo>를 완전한 IPSecurityInfo로 변환
   */
  private convertPartialSecurity(
    partial: Partial<IPSecurityInfo> | null
  ): IPSecurityInfo | null {
    if (!partial) return null;

    return {
      isAnonymous: partial.isAnonymous ?? false,
      isVPN: partial.isVPN ?? false,
      isProxy: partial.isProxy ?? false,
      isTor: partial.isTor ?? false,
      isRelay: partial.isRelay ?? false,
      isHosting: partial.isHosting ?? false,
      isScraper: partial.isScraper ?? false,
      isCompromised: partial.isCompromised ?? false,
      hasAttackHistory: partial.hasAttackHistory ?? false,
      riskScore: partial.riskScore ?? 0,
      confidenceScore: partial.confidenceScore ?? null,
      riskLevel: partial.riskLevel ?? "low",
      firstSeen: partial.firstSeen ?? null,
      lastSeen: partial.lastSeen ?? null,
      estimatedDevices: partial.estimatedDevices ?? { ip: null, subnet: null },
      operator: partial.operator,
    };
  }

  /**
   * ip-api 전용 확장 필드 추출
   */
  private extractExtended(
    ipApi: IpApiAnalysisResult | null
  ): MultiSourceIPResult["extended"] | undefined {
    if (!ipApi?.raw) return undefined;

    const raw = ipApi.raw;
    return {
      mobile: raw.mobile,
      currency: raw.currency,
      district: raw.district || undefined,
      utcOffset: raw.offset,
    };
  }
}

// 기본 인스턴스 내보내기
export const multiSourceAnalyzer = new MultiSourceIPAnalyzer();
