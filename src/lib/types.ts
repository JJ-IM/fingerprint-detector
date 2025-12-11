export interface FingerprintData {
  [key: string]: Record<string, unknown>;
  navigator: Record<string, unknown>;
  screen: Record<string, unknown>;
  hardware: Record<string, unknown>;
  webgl: Record<string, unknown>;
  canvas: Record<string, unknown>;
  audio: Record<string, unknown>;
  fonts: Record<string, unknown>;
  plugins: Record<string, unknown>;
  storage: Record<string, unknown>;
  network: Record<string, unknown>;
  permissions: Record<string, unknown>;
  features: Record<string, unknown>;
  timing: Record<string, unknown>;
  media: Record<string, unknown>;
  clientHints: Record<string, unknown>;
}

export interface IPData {
  // 기본 정보
  ip: string;
  country: string;
  countryCode: string;
  continent?: string;
  city: string;
  region: string;
  regionName: string;
  regionCode?: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  timezone: string;

  // ISP/Network 정보
  isp: string;
  organization: string;
  asn: number | string;
  networkType?: "Residential" | "Business" | "Wireless" | "Hosting" | "Unknown";
  hostname?: string | null;
  ipRange?: string | null;

  // === ProxyCheck.io v3 위협 감지 ===
  anonymous?: boolean; // VPN 또는 Proxy 사용 여부
  vpn?: boolean;
  proxy?: boolean;
  tor?: boolean;
  relay?: boolean; // iCloud Private Relay 등
  hosting?: boolean; // 호스팅/데이터센터
  scraper?: boolean; // 웹 스크래퍼
  compromised?: boolean; // 해킹된 IP
  attackHistory?: boolean; // 공격 이력

  // === 위험도 점수 ===
  riskScore?: number; // 0-100
  confidenceScore?: number | null; // 0-100
  riskLevel?: "low" | "medium" | "high" | "critical" | "unknown";

  // === 감지 시간 ===
  firstSeen?: string | null; // ISO 8601
  lastSeen?: string | null; // ISO 8601

  // === 디바이스 추정 ===
  estimatedDevices?: {
    ip: number | null;
    subnet: number | null;
  };

  // === VPN 운영자 정보 ===
  operator?: {
    name: string;
    url: string;
    anonymity: string;
    popularity: string;
    protocols: string[];
    noLogs: boolean;
  } | null;

  // === 레거시 호환성 (IPQualityScore 등) ===
  activeVpn?: boolean;
  activeTor?: boolean;
  isCrawler?: boolean;
  botStatus?: boolean;
  bot?: boolean;
  securityScanner?: boolean;
  recentAbuse?: boolean;
  frequentAbuser?: boolean;
  highRiskAttacks?: boolean;
  abuseVelocity?: string;
  fraudScore?: number;
  connectionType?: string;
  provider?: string;
  mobile?: boolean;
  sharedConnection?: boolean;
  dynamicConnection?: boolean;
  trustedNetwork?: boolean;
  operatingSystem?: string;
  browser?: string;
  deviceModel?: string;
  deviceBrand?: string;
  requestId?: string;

  // 메타 정보
  source?: string;
  apiVersion?: string;
}
