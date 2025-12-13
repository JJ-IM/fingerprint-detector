/**
 * FingerprintJS + CreepJS 스타일 통합 수집기
 *
 * - FingerprintJS: 안정적인 visitor ID 생성
 * - CreepJS 스타일: 위변조/거짓 탐지 (Lie Detection)
 * - 가중치 기반 점수 계산 통합
 */

import FingerprintJS, { Agent, GetResult } from "@fingerprintjs/fingerprintjs";
import { FingerprintCollector, FingerprintData } from "./fingerprint";
import { calculateFingerprintScore } from "./fingerprint-score-engine";
import { detectLies, LieDetectionResult } from "./lie-detector";

export interface EnhancedFingerprintResult {
  // 기존 수집 데이터
  raw: FingerprintData;

  // FingerprintJS 결과
  fingerprintjs: {
    visitorId: string;
    confidence: number;
    components: Record<string, unknown>;
  };

  // 통합 핑거프린트 해시
  combinedHash: string;

  // 점수 분석 (AmIUnique 스타일)
  score: ReturnType<typeof calculateFingerprintScore>;

  // 거짓 탐지 (CreepJS 스타일)
  lieDetection: LieDetectionResult;

  // 메타데이터
  meta: {
    collectedAt: string;
    collectionTimeMs: number;
    version: string;
  };
}

/**
 * SHA-256 해시 생성
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 향상된 핑거프린트 수집기
 */
export class EnhancedFingerprintCollector {
  private fpjsAgent: Agent | null = null;
  private legacyCollector: FingerprintCollector;

  constructor() {
    this.legacyCollector = new FingerprintCollector();
  }

  /**
   * FingerprintJS 에이전트 초기화
   */
  private async initFingerprintJS(): Promise<Agent> {
    if (!this.fpjsAgent) {
      this.fpjsAgent = await FingerprintJS.load();
    }
    return this.fpjsAgent;
  }

  /**
   * 향상된 핑거프린트 수집
   */
  async collect(): Promise<EnhancedFingerprintResult> {
    const startTime = performance.now();

    // 병렬로 세 수집기 실행
    const [rawData, fpjsResult, lieResult] = await Promise.all([
      this.legacyCollector.collect(),
      this.collectFingerprintJS(),
      detectLies(), // CreepJS 스타일 거짓 탐지
    ]);

    // 통합 해시 생성
    const combinedHash = await this.generateCombinedHash(rawData, fpjsResult);

    // 점수 계산 (AmIUnique 스타일)
    const score = calculateFingerprintScore(rawData);

    const endTime = performance.now();

    return {
      raw: rawData,
      fingerprintjs: {
        visitorId: fpjsResult.visitorId,
        confidence: fpjsResult.confidence.score,
        components: fpjsResult.components as unknown as Record<string, unknown>,
      },
      combinedHash,
      score,
      lieDetection: lieResult,
      meta: {
        collectedAt: new Date().toISOString(),
        collectionTimeMs: Math.round(endTime - startTime),
        version: "2.0.0",
      },
    };
  }

  /**
   * FingerprintJS로 수집
   */
  private async collectFingerprintJS(): Promise<GetResult> {
    try {
      const agent = await this.initFingerprintJS();
      return await agent.get();
    } catch (error) {
      console.error("FingerprintJS collection failed:", error);
      // 폴백: 빈 결과 반환
      return {
        visitorId: "",
        confidence: { score: 0 },
        components: {},
      } as unknown as GetResult;
    }
  }

  /**
   * 통합 해시 생성
   * - 두 소스의 핵심 값들을 결합하여 더 안정적인 해시 생성
   */
  private async generateCombinedHash(
    raw: FingerprintData,
    fpjs: GetResult
  ): Promise<string> {
    // 핵심 식별자 추출
    const keyComponents = [
      // FingerprintJS의 visitorId
      fpjs.visitorId,

      // 기존 수집기의 Canvas 해시
      raw.canvas?.canvas2dHash || "",
      raw.canvas?.webglHash || "",

      // 오디오 해시
      raw.audio?.audioHash || "",

      // 하드웨어 정보
      raw.hardware?.hardwareConcurrency || "",
      raw.hardware?.deviceMemory || "",

      // 화면 정보
      `${raw.screen?.width}x${raw.screen?.height}`,
      raw.screen?.colorDepth || "",

      // 시간대
      raw.timing?.timezone || "",

      // 언어
      JSON.stringify(raw.navigator?.languages || []),

      // 플랫폼
      raw.navigator?.platform || "",
    ];

    const combinedString = keyComponents
      .map((v) => String(v))
      .filter(Boolean)
      .join("|");

    return sha256(combinedString);
  }

  /**
   * 빠른 수집 (기본 정보만)
   */
  async collectQuick(): Promise<{
    visitorId: string;
    hash: string;
    confidence: number;
  }> {
    const agent = await this.initFingerprintJS();
    const result = await agent.get();

    return {
      visitorId: result.visitorId,
      hash: result.visitorId, // FingerprintJS의 visitorId가 이미 해시
      confidence: result.confidence.score,
    };
  }

  /**
   * 봇/자동화 도구 감지
   */
  detectBot(fingerprint: FingerprintData): {
    isBot: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let botScore = 0;

    // webdriver 감지
    if (fingerprint.navigator?.webdriver) {
      reasons.push("WebDriver가 활성화되어 있습니다");
      botScore += 40;
    }

    // 자동화 도구 UA 감지
    const ua = String(fingerprint.navigator?.userAgent || "").toLowerCase();
    const botPatterns = [
      "headless",
      "phantomjs",
      "puppeteer",
      "selenium",
      "webdriver",
      "chrome-headless",
      "automation",
    ];

    for (const pattern of botPatterns) {
      if (ua.includes(pattern)) {
        reasons.push(`User-Agent에 "${pattern}" 패턴이 감지됨`);
        botScore += 30;
      }
    }

    // 플러그인 없음 (데스크톱에서 의심)
    const platform = String(
      fingerprint.navigator?.platform || ""
    ).toLowerCase();
    const plugins = fingerprint.navigator?.plugins;
    const pluginCount = Array.isArray(plugins) ? plugins.length : 0;

    if (
      !platform.includes("mobile") &&
      !platform.includes("android") &&
      pluginCount === 0
    ) {
      reasons.push("데스크톱 브라우저에 플러그인이 없습니다");
      botScore += 15;
    }

    // WebGL 없음
    if (!fingerprint.canvas?.webglHash && !fingerprint.webgl?.renderer) {
      reasons.push("WebGL이 비활성화되어 있습니다");
      botScore += 10;
    }

    // Canvas 없음
    if (!fingerprint.canvas?.canvas2dHash) {
      reasons.push("Canvas 핑거프린팅이 차단되어 있습니다");
      botScore += 10;
    }

    // 언어 없음
    const languages = fingerprint.navigator?.languages;
    if (!Array.isArray(languages) || languages.length === 0) {
      reasons.push("브라우저 언어가 설정되지 않았습니다");
      botScore += 10;
    }

    return {
      isBot: botScore >= 40,
      confidence: Math.min(100, botScore),
      reasons,
    };
  }

  /**
   * 브라우저 스푸핑 감지
   */
  detectSpoofing(fingerprint: FingerprintData): {
    isSpoofed: boolean;
    suspiciousAreas: string[];
  } {
    const suspiciousAreas: string[] = [];

    const ua = String(fingerprint.navigator?.userAgent || "");
    const platform = String(fingerprint.navigator?.platform || "");

    // UA와 플랫폼 불일치
    if (
      ua.toLowerCase().includes("windows") &&
      platform.toLowerCase().includes("mac")
    ) {
      suspiciousAreas.push("User-Agent는 Windows지만 platform은 Mac입니다");
    }
    if (
      ua.toLowerCase().includes("mac") &&
      platform.toLowerCase().includes("win")
    ) {
      suspiciousAreas.push("User-Agent는 Mac지만 platform은 Windows입니다");
    }

    // 해상도 이상치
    const width = fingerprint.screen?.width as number;
    const height = fingerprint.screen?.height as number;
    if (width && height) {
      // 매우 작은 해상도
      if (width < 320 || height < 240) {
        suspiciousAreas.push(
          `비정상적으로 작은 화면 해상도: ${width}x${height}`
        );
      }
      // 매우 큰 해상도
      if (width > 7680 || height > 4320) {
        suspiciousAreas.push(`비정상적으로 큰 화면 해상도: ${width}x${height}`);
      }
    }

    // 코어 수 이상치
    const cores = fingerprint.hardware?.hardwareConcurrency as number;
    if (cores) {
      if (cores > 128) {
        suspiciousAreas.push(`비정상적으로 많은 CPU 코어: ${cores}`);
      }
      if (cores === 1 && !platform.toLowerCase().includes("mobile")) {
        suspiciousAreas.push("데스크톱에서 CPU 코어가 1개로 보고됨");
      }
    }

    // 메모리 이상치
    const memory = fingerprint.hardware?.deviceMemory as number;
    if (memory && memory > 512) {
      suspiciousAreas.push(`비정상적으로 큰 메모리: ${memory}GB`);
    }

    return {
      isSpoofed: suspiciousAreas.length >= 2,
      suspiciousAreas,
    };
  }
}

// 싱글톤 인스턴스
let collectorInstance: EnhancedFingerprintCollector | null = null;

export function getEnhancedCollector(): EnhancedFingerprintCollector {
  if (!collectorInstance) {
    collectorInstance = new EnhancedFingerprintCollector();
  }
  return collectorInstance;
}
