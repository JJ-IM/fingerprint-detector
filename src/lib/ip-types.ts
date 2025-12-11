/**
 * ProxyCheck.io v3 API 타입 정의
 *
 * 공식 문서: https://proxycheck.io/api/
 * API 버전: v3 (20-November-2025)
 *
 * 실제 API 응답 기반으로 타입 정의
 */

// ========================================
// ProxyCheck.io v3 API 응답 타입
// ========================================

export interface ProxyCheckV3Response {
  version?: string;
  status: "ok" | "warning" | "denied" | "error";
  message?: string;
  query_time?: number;
  [ip: string]: ProxyCheckIPResult | string | number | undefined;
}

export interface ProxyCheckIPResult {
  // Network 섹션
  network: {
    asn: string | null;
    range: string | null;
    hostname: string | null;
    provider: string | null;
    organisation: string | null;
    type: "Residential" | "Business" | "Wireless" | "Hosting" | null;
  };

  // Location 섹션 (v3 실제 응답 기반)
  location: {
    continent_name: string | null;
    continent_code: string | null;
    country_name: string | null;
    country_code: string | null;
    region_name: string | null;
    region_code: string | null;
    city_name: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    currency?: {
      name: string;
      code: string;
      symbol: string;
    };
  };

  // Device Estimate 섹션 (v3 실제 응답 기반)
  device_estimate: {
    address: number | null;
    subnet: number | null;
  };

  // Detections 섹션 (v3 실제 응답 - risk가 여기 안에 있음)
  detections: {
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
    hosting: boolean;
    anonymous: boolean;
    scraper: boolean;
    compromised: boolean;
    relay?: boolean;
    attack_history?: boolean;
    risk: number; // 0-100, detections 안에 있음
    confidence: number | null;
    first_seen: string | null;
    last_seen: string | null;
  };

  // 마지막 업데이트 시간
  last_updated: string | null;

  // Operator 섹션 (VPN 회사 정보, 있는 경우에만)
  operator?: {
    name: string;
    url: string;
    anonymity: "low" | "medium" | "high";
    popularity: "low" | "medium" | "high";
    protocols: string[];
    policies: {
      ad_filtering: boolean;
      free_access: boolean;
      paid_access: boolean;
      port_forwarding: boolean;
      logging: boolean;
      anonymous_payments: boolean;
      crypto_payments: boolean;
      traceable_ownership: boolean;
    };
  };
}

// ========================================
// 내부 사용 타입
// ========================================

export interface IPBasicInfo {
  ip: string;
  country: string;
  countryCode: string;
  continent: string;
  city: string;
  region: string;
  regionCode: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  networkType: "Residential" | "Business" | "Wireless" | "Hosting" | "Unknown";
  hostname: string | null;
  ipRange: string | null;
}

export interface IPSecurityInfo {
  // 위협 감지 결과
  isAnonymous: boolean; // VPN 또는 Proxy 사용
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isRelay: boolean;
  isHosting: boolean;
  isScraper: boolean;
  isCompromised: boolean;
  hasAttackHistory: boolean;

  // 점수 (0-100)
  riskScore: number;
  confidenceScore: number | null;

  // 위험도 레벨
  riskLevel: "low" | "medium" | "high" | "critical";

  // 감지 시간
  firstSeen: string | null;
  lastSeen: string | null;

  // 디바이스 추정
  estimatedDevices: {
    ip: number | null;
    subnet: number | null;
  };

  // VPN 운영자 정보 (있는 경우)
  operator?: {
    name: string;
    url: string;
    anonymity: string;
    popularity: string;
    protocols: string[];
    noLogs: boolean;
  };
}

export interface IPAnalysisResult {
  success: boolean;
  basic: IPBasicInfo | null;
  security: IPSecurityInfo | null;
  source: "proxycheck.io";
  apiVersion: string;
  error?: {
    code: string;
    message: string;
    hint?: string;
  };
}

// ========================================
// API 에러 타입
// ========================================

export type ProxyCheckStatusCode = "ok" | "warning" | "denied" | "error";

export interface ProxyCheckError {
  status: ProxyCheckStatusCode;
  message: string;
  httpCode?: number;
}

// ========================================
// Risk Level 계산 기준
// ========================================
// 0-25: low (허용)
// 26-50: medium (챌린지 권장)
// 51-75: high (챌린지 필수)
// 76-100: critical (차단)

export function calculateRiskLevel(
  score: number
): "low" | "medium" | "high" | "critical" {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
}

// ========================================
// 기본 위험 점수 기준 (proxycheck.io 문서 기준)
// ========================================
// Hosting: 33%
// VPN: 50%
// Scraper: 75%
// TOR: 75%
// Proxy: 100%
// Compromised: 100%
