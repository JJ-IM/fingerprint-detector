/**
 * 핑거프린트 점수 엔진
 *
 * AmIUnique.org 방법론을 참고하여 구현
 * - 각 속성별 가중치 적용
 * - 엔트로피 기반 고유성 계산
 * - 위험도 점수 산출
 */

import { FingerprintData } from "./types";

/**
 * 안전한 속성 접근 헬퍼
 */
function safeGet<T>(
  obj: Record<string, unknown> | undefined | null,
  key: string,
  defaultValue?: T
): T | undefined {
  if (!obj || typeof obj !== "object") return defaultValue;
  return (obj[key] as T | undefined) ?? defaultValue;
}

/**
 * 속성별 가중치 설정
 * 높을수록 핑거프린팅에 더 많이 사용되는 속성
 */
export const ATTRIBUTE_WEIGHTS: Record<string, number> = {
  // === 고위험 (10점) - 매우 고유하고 추적에 자주 사용됨 ===
  canvasFingerprint: 10,
  webglFingerprint: 10,
  audioFingerprint: 10,
  fontsFingerprint: 10,

  // === 중고위험 (8점) - 상당히 고유함 ===
  webglRenderer: 8,
  webglVendor: 8,
  userAgent: 8,
  timezone: 8,

  // === 중위험 (6점) - 어느 정도 고유함 ===
  screenResolution: 6,
  colorDepth: 6,
  languages: 6,
  hardwareConcurrency: 6,
  deviceMemory: 6,
  platform: 6,

  // === 저위험 (4점) - 덜 고유하지만 조합 시 유용 ===
  touchSupport: 4,
  plugins: 4,
  doNotTrack: 4,
  cookiesEnabled: 4,

  // === 최저위험 (2점) - 매우 일반적 ===
  vendor: 2,
  appVersion: 2,
  connection: 2,
};

/**
 * 이상 징후 가중치 (위험 신호)
 */
export const ANOMALY_WEIGHTS: Record<string, number> = {
  // === 심각한 이상 징후 (높은 감점) ===
  automation: 20, // 자동화 도구 감지
  headless: 20, // 헤드리스 브라우저
  inconsistentUA: 15, // UA 불일치

  // === 중간 이상 징후 ===
  spoofedTimezone: 10, // 위조된 시간대
  spoofedLanguage: 10, // 위조된 언어
  noWebGL: 8, // WebGL 비활성화
  noCanvas: 8, // Canvas 비활성화

  // === 경미한 이상 징후 ===
  privateMode: 5, // 프라이빗 모드
  adBlocker: 5, // 광고 차단기
  missingPlugins: 3, // 플러그인 없음
};

interface ScoreResult {
  // 전체 점수 (0-100, 높을수록 추적 가능성 높음)
  trackabilityScore: number;

  // 고유성 점수 (0-100, 높을수록 고유함)
  uniquenessScore: number;

  // 이상 징후 점수 (0-100, 높을수록 의심스러움)
  anomalyScore: number;

  // 엔트로피 (비트 단위)
  entropy: number;

  // 상세 분석
  details: {
    category: string;
    attribute: string;
    value: string;
    weight: number;
    contribution: number; // 점수 기여도
    status: "normal" | "suspicious" | "missing";
  }[];

  // 감지된 이상 징후
  anomalies: {
    type: string;
    severity: "low" | "medium" | "high";
    description: string;
    weight: number;
  }[];

  // 요약
  summary: {
    level: "very_low" | "low" | "medium" | "high" | "very_high";
    description: string;
    recommendations: string[];
  };
}

/**
 * 문자열을 해시 숫자로 변환 (엔트로피 계산용)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 값의 고유성 추정 (0-1 사이)
 * 실제 데이터베이스가 있다면 실제 분포를 사용해야 함
 */
function estimateUniqueness(attribute: string, value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0.1; // 누락된 값은 낮은 고유성
  }

  const strValue = typeof value === "string" ? value : JSON.stringify(value);

  // 속성별 추정 고유성
  switch (attribute) {
    case "canvasFingerprint":
    case "webglFingerprint":
    case "audioFingerprint":
      // 해시 기반 - 매우 고유할 가능성 높음
      return 0.95;

    case "fontsFingerprint":
      // 폰트 조합은 꽤 고유함
      return 0.85;

    case "userAgent":
      // UA는 버전에 따라 다양함
      return 0.7;

    case "screenResolution":
      // 일반적인 해상도들이 있음
      if (strValue.includes("1920") || strValue.includes("1080")) return 0.3;
      return 0.6;

    case "timezone":
      // 시간대는 지역에 따라 공유됨
      return 0.4;

    case "languages":
      // 언어는 지역에 따라 공유됨
      return 0.3;

    case "hardwareConcurrency":
      // 일반적인 코어 수들
      const cores = parseInt(strValue) || 0;
      if (cores === 4 || cores === 8) return 0.2;
      return 0.5;

    case "deviceMemory":
      // 일반적인 메모리 크기들
      const mem = parseFloat(strValue) || 0;
      if (mem === 8 || mem === 16) return 0.2;
      return 0.5;

    default:
      // 해시 기반 추정
      const hash = hashString(strValue);
      return 0.3 + (hash % 50) / 100;
  }
}

/**
 * 이상 징후 감지
 */
function detectAnomalies(
  fingerprint: FingerprintData
): ScoreResult["anomalies"] {
  const anomalies: ScoreResult["anomalies"] = [];

  // 자동화/헤드리스 감지
  const ua = ((fingerprint.navigator.userAgent as string) || "").toLowerCase();
  if (
    ua.includes("headless") ||
    ua.includes("phantomjs") ||
    ua.includes("puppeteer")
  ) {
    anomalies.push({
      type: "headless",
      severity: "high",
      description: "헤드리스 브라우저가 감지되었습니다",
      weight: ANOMALY_WEIGHTS.headless,
    });
  }

  // webdriver 감지
  if (fingerprint.navigator.webdriver) {
    anomalies.push({
      type: "automation",
      severity: "high",
      description: "자동화 도구(Selenium/Puppeteer 등)가 감지되었습니다",
      weight: ANOMALY_WEIGHTS.automation,
    });
  }

  // WebGL 누락
  const webglRenderer = safeGet<string>(
    fingerprint.canvas.webgl as Record<string, unknown>,
    "renderer"
  );
  const webglVendor = safeGet<string>(
    fingerprint.canvas.webgl as Record<string, unknown>,
    "vendor"
  );
  if (!webglRenderer && !webglVendor) {
    anomalies.push({
      type: "noWebGL",
      severity: "medium",
      description:
        "WebGL이 비활성화되어 있습니다 (프라이버시 보호 또는 가상 환경)",
      weight: ANOMALY_WEIGHTS.noWebGL,
    });
  }

  // Canvas 누락
  if (!fingerprint.canvas.canvas2dHash && !fingerprint.canvas.webglHash) {
    anomalies.push({
      type: "noCanvas",
      severity: "medium",
      description: "Canvas 핑거프린팅이 차단되어 있습니다",
      weight: ANOMALY_WEIGHTS.noCanvas,
    });
  }

  // 플러그인 누락 (데스크톱에서)
  const platform = (
    (fingerprint.navigator.platform as string) || ""
  ).toLowerCase();
  const plugins = (fingerprint.navigator.plugins as string[]) || [];
  if (
    !platform.includes("mobile") &&
    !platform.includes("android") &&
    plugins.length === 0
  ) {
    anomalies.push({
      type: "missingPlugins",
      severity: "low",
      description: "브라우저 플러그인이 없습니다",
      weight: ANOMALY_WEIGHTS.missingPlugins,
    });
  }

  // DNT 또는 프라이버시 모드 감지
  if (
    fingerprint.navigator.doNotTrack === "1" ||
    fingerprint.navigator.doNotTrack === "yes"
  ) {
    anomalies.push({
      type: "privateMode",
      severity: "low",
      description: "Do Not Track이 활성화되어 있습니다",
      weight: ANOMALY_WEIGHTS.privateMode,
    });
  }

  // UA와 플랫폼 불일치 감지
  if (ua) {
    const uaLower = ua.toLowerCase();
    const platformLower = platform.toLowerCase();

    if (
      (uaLower.includes("windows") && platformLower.includes("mac")) ||
      (uaLower.includes("mac") && platformLower.includes("win")) ||
      (uaLower.includes("linux") &&
        !platformLower.includes("linux") &&
        !platformLower.includes("x11"))
    ) {
      anomalies.push({
        type: "inconsistentUA",
        severity: "high",
        description: "User-Agent와 플랫폼 정보가 일치하지 않습니다",
        weight: ANOMALY_WEIGHTS.inconsistentUA,
      });
    }
  }

  return anomalies;
}

/**
 * 핑거프린트 점수 계산
 */
export function calculateFingerprintScore(
  fingerprint: FingerprintData
): ScoreResult {
  const details: ScoreResult["details"] = [];
  let totalWeight = 0;
  let weightedUniqueness = 0;

  // 각 속성별 분석
  const attributeMappings: {
    category: string;
    attribute: string;
    getValue: () => unknown;
  }[] = [
    // Canvas
    {
      category: "Canvas",
      attribute: "canvasFingerprint",
      getValue: () => fingerprint.canvas.canvas2dHash,
    },
    {
      category: "Canvas",
      attribute: "webglFingerprint",
      getValue: () => fingerprint.canvas.webglHash,
    },
    {
      category: "Canvas",
      attribute: "webglRenderer",
      getValue: () =>
        safeGet<string>(
          fingerprint.canvas.webgl as Record<string, unknown>,
          "renderer"
        ),
    },
    {
      category: "Canvas",
      attribute: "webglVendor",
      getValue: () =>
        safeGet<string>(
          fingerprint.canvas.webgl as Record<string, unknown>,
          "vendor"
        ),
    },

    // Audio
    {
      category: "Audio",
      attribute: "audioFingerprint",
      getValue: () => fingerprint.audio?.audioHash,
    },

    // Navigator
    {
      category: "Navigator",
      attribute: "userAgent",
      getValue: () => fingerprint.navigator.userAgent,
    },
    {
      category: "Navigator",
      attribute: "platform",
      getValue: () => fingerprint.navigator.platform,
    },
    {
      category: "Navigator",
      attribute: "languages",
      getValue: () => fingerprint.navigator.languages,
    },
    {
      category: "Navigator",
      attribute: "vendor",
      getValue: () => fingerprint.navigator.vendor,
    },
    {
      category: "Navigator",
      attribute: "cookiesEnabled",
      getValue: () => fingerprint.navigator.cookieEnabled,
    },
    {
      category: "Navigator",
      attribute: "doNotTrack",
      getValue: () => fingerprint.navigator.doNotTrack,
    },

    // Screen
    {
      category: "Screen",
      attribute: "screenResolution",
      getValue: () =>
        `${fingerprint.screen.width}x${fingerprint.screen.height}`,
    },
    {
      category: "Screen",
      attribute: "colorDepth",
      getValue: () => fingerprint.screen.colorDepth,
    },

    // Hardware
    {
      category: "Hardware",
      attribute: "hardwareConcurrency",
      getValue: () => fingerprint.hardware.hardwareConcurrency,
    },
    {
      category: "Hardware",
      attribute: "deviceMemory",
      getValue: () => fingerprint.hardware.deviceMemory,
    },
    {
      category: "Hardware",
      attribute: "touchSupport",
      getValue: () =>
        safeGet<number>(
          fingerprint.hardware.touchSupport as Record<string, unknown>,
          "maxTouchPoints"
        ),
    },

    // Timing
    {
      category: "Timing",
      attribute: "timezone",
      getValue: () => fingerprint.timing.timezone,
    },

    // Fonts
    {
      category: "Fonts",
      attribute: "fontsFingerprint",
      getValue: () => {
        const fonts = fingerprint.fonts?.detectedFonts;
        return Array.isArray(fonts) ? fonts.length : undefined;
      },
    },
  ];

  for (const mapping of attributeMappings) {
    const value = mapping.getValue();
    const weight = ATTRIBUTE_WEIGHTS[mapping.attribute] || 2;
    const uniqueness = estimateUniqueness(mapping.attribute, value);

    const strValue =
      value === null || value === undefined
        ? "N/A"
        : typeof value === "string"
        ? value.length > 50
          ? value.slice(0, 47) + "..."
          : value
        : String(value);

    let status: "normal" | "suspicious" | "missing" = "normal";
    if (value === null || value === undefined || value === "") {
      status = "missing";
    } else if (uniqueness > 0.9) {
      status = "suspicious"; // 매우 고유한 값은 추적에 사용될 가능성 높음
    }

    const contribution = weight * uniqueness;
    totalWeight += weight;
    weightedUniqueness += contribution;

    details.push({
      category: mapping.category,
      attribute: mapping.attribute,
      value: strValue,
      weight,
      contribution,
      status,
    });
  }

  // 이상 징후 감지
  const anomalies = detectAnomalies(fingerprint);
  const anomalyScore = anomalies.reduce((sum, a) => sum + a.weight, 0);

  // 점수 계산
  const uniquenessScore = Math.round((weightedUniqueness / totalWeight) * 100);
  const trackabilityScore = Math.min(
    100,
    Math.round(uniquenessScore * 0.7 + anomalyScore * 0.3)
  );

  // 엔트로피 계산 (대략적)
  const entropy =
    Math.round(Math.log2(Math.pow(2, uniquenessScore / 10)) * 10) / 10;

  // 요약 생성
  let level: ScoreResult["summary"]["level"];
  let description: string;
  const recommendations: string[] = [];

  if (trackabilityScore >= 80) {
    level = "very_high";
    description =
      "매우 높은 추적 가능성: 귀하의 브라우저는 매우 쉽게 식별될 수 있습니다.";
    recommendations.push("Tor 브라우저 사용을 고려해보세요");
    recommendations.push("브라우저 핑거프린팅 방지 확장 프로그램을 설치하세요");
  } else if (trackabilityScore >= 60) {
    level = "high";
    description = "높은 추적 가능성: 귀하의 브라우저 설정이 상당히 고유합니다.";
    recommendations.push("일반적인 브라우저 설정을 사용해보세요");
    recommendations.push("불필요한 플러그인을 제거하세요");
  } else if (trackabilityScore >= 40) {
    level = "medium";
    description = "중간 추적 가능성: 일부 고유한 특성이 있습니다.";
    recommendations.push("프라이버시 중심 브라우저를 고려해보세요");
  } else if (trackabilityScore >= 20) {
    level = "low";
    description = "낮은 추적 가능성: 비교적 일반적인 브라우저 설정입니다.";
  } else {
    level = "very_low";
    description =
      "매우 낮은 추적 가능성: 귀하의 브라우저는 다른 사용자와 구분하기 어렵습니다.";
  }

  if (anomalies.some((a) => a.severity === "high")) {
    recommendations.push(
      "심각한 이상 징후가 감지되었습니다 - 자세한 내용을 확인하세요"
    );
  }

  return {
    trackabilityScore,
    uniquenessScore,
    anomalyScore: Math.min(100, anomalyScore),
    entropy,
    details,
    anomalies,
    summary: {
      level,
      description,
      recommendations,
    },
  };
}

/**
 * 두 핑거프린트 간 유사도 계산 (0-100)
 */
export function calculateSimilarity(
  fp1: FingerprintData,
  fp2: FingerprintData
): number {
  let matches = 0;
  let total = 0;

  // 주요 속성 비교
  const compareAttrs = [
    () => fp1.canvas.canvas2dHash === fp2.canvas.canvas2dHash,
    () => fp1.canvas.webglHash === fp2.canvas.webglHash,
    () => fp1.navigator.userAgent === fp2.navigator.userAgent,
    () => fp1.navigator.platform === fp2.navigator.platform,
    () =>
      fp1.screen.width === fp2.screen.width &&
      fp1.screen.height === fp2.screen.height,
    () => fp1.timing.timezone === fp2.timing.timezone,
    () => fp1.hardware.hardwareConcurrency === fp2.hardware.hardwareConcurrency,
    () => fp1.audio?.audioHash === fp2.audio?.audioHash,
  ];

  for (const compare of compareAttrs) {
    total++;
    try {
      if (compare()) matches++;
    } catch {
      // 비교 실패 시 무시
    }
  }

  return Math.round((matches / total) * 100);
}
