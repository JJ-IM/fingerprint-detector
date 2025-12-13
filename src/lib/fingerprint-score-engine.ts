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
 * 실제 통계 기반 일반적인 값들
 * 출처: AmIUnique, BrowserLeaks, StatCounter 등의 공개 통계
 */
const COMMON_VALUE_STATS: Record<string, { values: string[]; popularity: number[] }> = {
  // 화면 해상도 (2024년 기준 상위 점유율)
  screenResolution: {
    values: ["1920x1080", "1366x768", "1536x864", "2560x1440", "1440x900", "1280x720"],
    popularity: [0.23, 0.15, 0.09, 0.08, 0.05, 0.04], // ~64% 커버
  },
  // CPU 코어 수
  hardwareConcurrency: {
    values: ["8", "4", "12", "6", "16", "2", "10"],
    popularity: [0.30, 0.25, 0.15, 0.10, 0.08, 0.05, 0.03],
  },
  // 메모리 (GB)
  deviceMemory: {
    values: ["8", "16", "4", "32", "2"],
    popularity: [0.35, 0.25, 0.20, 0.10, 0.05],
  },
  // 색상 깊이
  colorDepth: {
    values: ["24", "30", "48"],
    popularity: [0.85, 0.10, 0.03],
  },
  // 주요 시간대
  timezone: {
    values: [
      "America/New_York", "Europe/London", "Asia/Tokyo", "America/Los_Angeles",
      "Europe/Paris", "Asia/Seoul", "Asia/Shanghai", "Europe/Berlin",
      "America/Chicago", "Asia/Singapore"
    ],
    popularity: [0.10, 0.08, 0.06, 0.06, 0.05, 0.04, 0.04, 0.03, 0.03, 0.02],
  },
  // 주요 언어
  languages: {
    values: ["en-US", "en", "zh-CN", "es", "pt-BR", "ja", "ko", "de", "fr", "ru"],
    popularity: [0.25, 0.15, 0.12, 0.08, 0.05, 0.04, 0.03, 0.03, 0.03, 0.02],
  },
  // 플랫폼
  platform: {
    values: ["Win32", "MacIntel", "Linux x86_64", "Linux armv81"],
    popularity: [0.65, 0.20, 0.08, 0.05],
  },
};

/**
 * 값의 고유성 추정 (0-1 사이)
 * 실제 통계 데이터 기반 계산
 */
function estimateUniqueness(attribute: string, value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0.05; // 누락된 값은 매우 낮은 고유성 (흔함)
  }

  const strValue = typeof value === "string" ? value : JSON.stringify(value);

  // 핑거프린트 해시 값들 - 매우 고유함
  if (attribute === "canvasFingerprint" || attribute === "webglFingerprint" || attribute === "audioFingerprint") {
    // 해시값은 거의 고유함, 하지만 100%는 아님 (동일 환경 사용자 존재)
    return 0.92 + (hashString(strValue) % 8) / 100; // 0.92-0.99
  }

  // 폰트 핑거프린트 - 설치된 폰트 수에 따라 다름
  if (attribute === "fontsFingerprint") {
    const fontCount = parseInt(strValue) || 0;
    if (fontCount < 20) return 0.30; // 적은 폰트 = 흔함
    if (fontCount < 50) return 0.60;
    if (fontCount < 100) return 0.80;
    return 0.90; // 많은 폰트 = 고유함
  }

  // User-Agent - 버전에 따라 다양함
  if (attribute === "userAgent") {
    // 최신 버전일수록 흔함, 이상한 UA일수록 고유함
    if (strValue.includes("Chrome/") && strValue.includes("Windows")) return 0.15;
    if (strValue.includes("Chrome/") && strValue.includes("Mac")) return 0.20;
    if (strValue.includes("Safari/") && !strValue.includes("Chrome")) return 0.35;
    if (strValue.includes("Firefox/")) return 0.40;
    return 0.60; // 기타 UA는 상대적으로 고유
  }

  // 통계 기반 속성들
  const stats = COMMON_VALUE_STATS[attribute];
  if (stats) {
    const index = stats.values.findIndex((v) => strValue.includes(v) || v === strValue);
    if (index !== -1) {
      // 해당 값의 점유율을 고유성으로 변환 (점유율 높을수록 고유성 낮음)
      const popularity = stats.popularity[index];
      return 1 - popularity; // 예: 23% 점유율 → 0.77 고유성
    }
    // 통계에 없는 값 = 상대적으로 희귀함
    return 0.75 + (hashString(strValue) % 20) / 100;
  }

  // 기타 속성 - 값의 복잡도에 따라 추정
  const complexity = strValue.length / 50; // 긴 값일수록 고유할 가능성
  return Math.min(0.70, 0.30 + complexity * 0.3 + (hashString(strValue) % 20) / 100);
}

/**
 * Shannon Entropy 계산 (비트 단위)
 * 속성별 엔트로피를 합산하여 전체 엔트로피 추정
 */
function calculateEntropy(details: ScoreResult["details"]): number {
  let totalEntropy = 0;

  for (const detail of details) {
    if (detail.status === "missing") continue;
    
    // 각 속성의 엔트로피 = -log2(1 - uniqueness)
    // uniqueness가 높을수록 (희귀할수록) 엔트로피 높음
    const uniqueness = detail.contribution / detail.weight;
    if (uniqueness > 0 && uniqueness < 1) {
      // 정보 엔트로피: 해당 값이 나올 확률의 역수의 log
      const probability = 1 - uniqueness;
      const entropy = -Math.log2(Math.max(0.001, probability));
      totalEntropy += entropy * (detail.weight / 10); // 가중치 반영
    }
  }

  return Math.round(totalEntropy * 10) / 10;
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

  // WebGL 누락 (fingerprint.webgl에서 직접 참조)
  const webglSupported = fingerprint.webgl?.supported;
  const webglRenderer = safeGet<string>(
    fingerprint.webgl as Record<string, unknown>,
    "renderer"
  );
  const webglVendor = safeGet<string>(
    fingerprint.webgl as Record<string, unknown>,
    "vendor"
  );
  if (webglSupported === false || (!webglRenderer && !webglVendor)) {
    anomalies.push({
      type: "noWebGL",
      severity: "medium",
      description:
        "WebGL이 비활성화되어 있습니다 (프라이버시 보호 또는 가상 환경)",
      weight: ANOMALY_WEIGHTS.noWebGL,
    });
  }

  // Canvas 누락 (fingerprint.canvas에서 hash 확인)
  const canvasSupported = fingerprint.canvas?.supported;
  const canvasHash = fingerprint.canvas?.hash;
  if (canvasSupported === false || !canvasHash) {
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
  // fingerprint.plugins.list 또는 fingerprint.plugins.count 확인
  const pluginsList = (fingerprint.plugins?.list as string[]) || [];
  const pluginsCount = (fingerprint.plugins?.count as number) || pluginsList.length;
  const isMobile = platform.includes("mobile") || 
                   platform.includes("android") || 
                   platform.includes("iphone") ||
                   platform.includes("ipad");
  if (!isMobile && pluginsCount === 0) {
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
    // Canvas (fingerprint.canvas에서 hash 사용)
    {
      category: "Canvas",
      attribute: "canvasFingerprint",
      getValue: () => fingerprint.canvas?.hash,
    },
    // WebGL (fingerprint.webgl에서 직접 참조)
    {
      category: "WebGL",
      attribute: "webglFingerprint",
      getValue: () => {
        const renderer = fingerprint.webgl?.renderer;
        const vendor = fingerprint.webgl?.vendor;
        return renderer && vendor ? `${vendor} ${renderer}` : undefined;
      },
    },
    {
      category: "WebGL",
      attribute: "webglRenderer",
      getValue: () => fingerprint.webgl?.renderer,
    },
    {
      category: "WebGL",
      attribute: "webglVendor",
      getValue: () => fingerprint.webgl?.vendor,
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

  // Shannon 엔트로피 계산 (비트 단위)
  // 각 속성의 고유성을 기반으로 정보 엔트로피 합산
  const entropy = calculateEntropy(details);

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

  // 주요 속성 비교 (올바른 데이터 구조 참조)
  const compareAttrs = [
    () => fp1.canvas?.hash === fp2.canvas?.hash,
    () => fp1.webgl?.renderer === fp2.webgl?.renderer,
    () => fp1.webgl?.vendor === fp2.webgl?.vendor,
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
