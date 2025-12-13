/**
 * Lie Detector - CreepJS 스타일 위변조 탐지 엔진
 *
 * 브라우저 핑거프린트 스푸핑/위변조를 감지합니다.
 * - Prototype 변조 감지
 * - 속성 간 불일치 탐지
 * - 프라이버시 도구 감지
 *
 * @see https://github.com/AbrahamJuliet/creepjs
 */

export interface LieDetectionResult {
  // 전체 거짓 점수 (0-100, 높을수록 위변조 가능성 높음)
  lieScore: number;

  // 신뢰도 등급
  trustLevel: "trusted" | "suspicious" | "untrusted" | "deceptive";

  // 감지된 거짓들
  lies: DetectedLie[];

  // 불일치 항목들
  inconsistencies: Inconsistency[];

  // Prototype 변조
  prototypeManipulations: PrototypeManipulation[];

  // 프라이버시 도구 감지
  privacyTools: PrivacyToolDetection[];

  // 요약
  summary: {
    totalLies: number;
    criticalLies: number;
    warnings: number;
    description: string;
  };
}

export interface DetectedLie {
  category: string;
  attribute: string;
  expected: string;
  actual: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface Inconsistency {
  attributes: string[];
  description: string;
  severity: "low" | "medium" | "high";
}

export interface PrototypeManipulation {
  object: string;
  property: string;
  issue: string;
  severity: "medium" | "high" | "critical";
}

export interface PrivacyToolDetection {
  tool: string;
  confidence: number;
  indicators: string[];
}

/**
 * Lie Detector 클래스
 */
export class LieDetector {
  private lies: DetectedLie[] = [];
  private inconsistencies: Inconsistency[] = [];
  private prototypeManipulations: PrototypeManipulation[] = [];
  private privacyTools: PrivacyToolDetection[] = [];

  /**
   * 전체 거짓 탐지 실행
   */
  async detect(): Promise<LieDetectionResult> {
    // 초기화
    this.lies = [];
    this.inconsistencies = [];
    this.prototypeManipulations = [];
    this.privacyTools = [];

    // 각 탐지 실행
    await Promise.all([
      this.detectPrototypeManipulation(),
      this.detectNavigatorLies(),
      this.detectScreenLies(),
      this.detectCanvasLies(),
      this.detectWebGLLies(),
      this.detectTimingLies(),
      this.detectInconsistencies(),
      this.detectPrivacyTools(),
    ]);

    // 점수 계산
    const lieScore = this.calculateLieScore();
    const trustLevel = this.determineTrustLevel(lieScore);

    return {
      lieScore,
      trustLevel,
      lies: this.lies,
      inconsistencies: this.inconsistencies,
      prototypeManipulations: this.prototypeManipulations,
      privacyTools: this.privacyTools,
      summary: this.generateSummary(lieScore),
    };
  }

  /**
   * Prototype 변조 감지
   */
  private async detectPrototypeManipulation(): Promise<void> {
    // Navigator prototype 검사
    this.checkPrototype(Navigator.prototype, "Navigator", [
      "userAgent",
      "platform",
      "languages",
      "hardwareConcurrency",
      "deviceMemory",
      "webdriver",
      "plugins",
      "mimeTypes",
    ]);

    // Screen prototype 검사
    this.checkPrototype(Screen.prototype, "Screen", [
      "width",
      "height",
      "colorDepth",
      "pixelDepth",
      "availWidth",
      "availHeight",
    ]);

    // HTMLCanvasElement prototype 검사
    this.checkPrototype(HTMLCanvasElement.prototype, "HTMLCanvasElement", [
      "getContext",
      "toDataURL",
      "toBlob",
    ]);

    // WebGLRenderingContext prototype 검사
    if (typeof WebGLRenderingContext !== "undefined") {
      this.checkPrototype(
        WebGLRenderingContext.prototype,
        "WebGLRenderingContext",
        ["getParameter", "getExtension", "getSupportedExtensions"]
      );
    }

    // Date prototype 검사
    this.checkPrototype(Date.prototype, "Date", [
      "getTimezoneOffset",
      "toLocaleString",
    ]);

    // Intl 검사
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      this.checkPrototype(
        Intl.DateTimeFormat.prototype,
        "Intl.DateTimeFormat",
        ["resolvedOptions"]
      );
    }
  }

  /**
   * Prototype 속성 검사
   */
  private checkPrototype(
    proto: object,
    objectName: string,
    properties: string[]
  ): void {
    for (const prop of properties) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(proto, prop);

        if (!descriptor) continue;

        // getter가 native code가 아닌지 확인
        if (descriptor.get) {
          const getterStr = descriptor.get.toString();
          if (!getterStr.includes("[native code]")) {
            this.prototypeManipulations.push({
              object: objectName,
              property: prop,
              issue: "Getter가 native code가 아닙니다 (스푸핑 가능성)",
              severity: "high",
            });
          }
        }

        // value가 함수인 경우 native code 확인
        if (typeof descriptor.value === "function") {
          const funcStr = descriptor.value.toString();
          if (!funcStr.includes("[native code]")) {
            this.prototypeManipulations.push({
              object: objectName,
              property: prop,
              issue: "함수가 native code가 아닙니다 (후킹 가능성)",
              severity: "high",
            });
          }
        }

        // configurable이 true면 변조 가능성
        // (일부 브라우저에서는 정상적으로 true일 수 있음)
      } catch {
        // 접근 불가 - 정상일 수 있음
      }
    }
  }

  /**
   * Navigator 거짓 탐지
   */
  private async detectNavigatorLies(): Promise<void> {
    const nav = navigator;

    // webdriver 숨김 시도 감지
    if (this.isWebdriverHidden()) {
      this.lies.push({
        category: "Navigator",
        attribute: "webdriver",
        expected: "true (자동화 도구 사용 시)",
        actual: "undefined 또는 false",
        severity: "critical",
        description:
          "webdriver 속성이 숨겨져 있습니다. 자동화 도구 위장 시도일 수 있습니다.",
      });
    }

    // platform vs userAgent 불일치
    const ua = nav.userAgent.toLowerCase();
    const platform = nav.platform.toLowerCase();

    if (ua.includes("win") && !platform.includes("win")) {
      this.lies.push({
        category: "Navigator",
        attribute: "platform",
        expected: "Windows (UA 기반)",
        actual: platform,
        severity: "high",
        description: "User-Agent는 Windows인데 platform이 일치하지 않습니다.",
      });
    }

    if (ua.includes("mac") && !platform.includes("mac")) {
      this.lies.push({
        category: "Navigator",
        attribute: "platform",
        expected: "Mac (UA 기반)",
        actual: platform,
        severity: "high",
        description: "User-Agent는 Mac인데 platform이 일치하지 않습니다.",
      });
    }

    if (
      ua.includes("linux") &&
      !platform.includes("linux") &&
      !platform.includes("x11")
    ) {
      this.lies.push({
        category: "Navigator",
        attribute: "platform",
        expected: "Linux (UA 기반)",
        actual: platform,
        severity: "high",
        description: "User-Agent는 Linux인데 platform이 일치하지 않습니다.",
      });
    }

    // hardwareConcurrency 이상치
    const cores = nav.hardwareConcurrency;
    if (cores && (cores < 1 || cores > 128 || !Number.isInteger(cores))) {
      this.lies.push({
        category: "Navigator",
        attribute: "hardwareConcurrency",
        expected: "1-128 사이의 정수",
        actual: String(cores),
        severity: "medium",
        description: "비정상적인 CPU 코어 수입니다.",
      });
    }

    // deviceMemory 이상치
    const memory = (nav as Navigator & { deviceMemory?: number }).deviceMemory;
    if (memory !== undefined) {
      const validMemoryValues = [0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128];
      if (!validMemoryValues.includes(memory)) {
        this.lies.push({
          category: "Navigator",
          attribute: "deviceMemory",
          expected: "표준 값 (0.25, 0.5, 1, 2, 4, 8, 16, 32, 64, 128)",
          actual: String(memory),
          severity: "medium",
          description: "비표준 deviceMemory 값입니다.",
        });
      }
    }

    // plugins 배열 검사
    if (nav.plugins) {
      const pluginsArray = Array.from(nav.plugins);
      const hasInvalidPlugin = pluginsArray.some(
        (p) => !p.name || !p.filename || typeof p.length !== "number"
      );
      if (hasInvalidPlugin) {
        this.lies.push({
          category: "Navigator",
          attribute: "plugins",
          expected: "유효한 Plugin 객체",
          actual: "불완전한 Plugin 객체",
          severity: "medium",
          description: "플러그인 객체가 표준 구조를 따르지 않습니다.",
        });
      }
    }

    // languages 검사
    if (!nav.languages || nav.languages.length === 0) {
      this.lies.push({
        category: "Navigator",
        attribute: "languages",
        expected: "최소 1개의 언어",
        actual: "빈 배열",
        severity: "low",
        description: "브라우저 언어가 설정되지 않았습니다.",
      });
    }
  }

  /**
   * webdriver 숨김 감지
   */
  private isWebdriverHidden(): boolean {
    try {
      // 1. navigator.webdriver가 undefined인데 자동화 힌트가 있는 경우
      const webdriver = navigator.webdriver;

      // 2. Object.getOwnPropertyDescriptor로 확인
      const descriptor = Object.getOwnPropertyDescriptor(
        navigator,
        "webdriver"
      );

      // webdriver가 명시적으로 false로 설정된 경우 (스푸핑 시도)
      if (
        descriptor &&
        descriptor.value === false &&
        descriptor.writable === true
      ) {
        return true;
      }

      // 3. document에 webdriver 관련 속성 확인
      const docProps = Object.getOwnPropertyNames(document);
      const webdriverProps = docProps.filter(
        (p) =>
          p.toLowerCase().includes("webdriver") ||
          p.toLowerCase().includes("selenium") ||
          p.toLowerCase().includes("driver")
      );

      // webdriver 속성이 없지만 다른 자동화 힌트가 있는 경우
      if (!webdriver && webdriverProps.length > 0) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Screen 거짓 탐지
   */
  private async detectScreenLies(): Promise<void> {
    const scr = window.screen;

    // availWidth/availHeight가 width/height보다 큰 경우
    if (scr.availWidth > scr.width || scr.availHeight > scr.height) {
      this.lies.push({
        category: "Screen",
        attribute: "availWidth/availHeight",
        expected: "width/height 이하",
        actual: `${scr.availWidth}x${scr.availHeight} (전체: ${scr.width}x${scr.height})`,
        severity: "high",
        description: "사용 가능한 화면이 전체 화면보다 큽니다 (불가능).",
      });
    }

    // colorDepth와 pixelDepth 불일치
    if (scr.colorDepth !== scr.pixelDepth) {
      // 일부 브라우저에서는 다를 수 있지만, 대부분 같아야 함
      this.lies.push({
        category: "Screen",
        attribute: "colorDepth/pixelDepth",
        expected: "동일한 값",
        actual: `colorDepth: ${scr.colorDepth}, pixelDepth: ${scr.pixelDepth}`,
        severity: "low",
        description: "colorDepth와 pixelDepth가 다릅니다.",
      });
    }

    // 비현실적인 해상도
    if (scr.width < 100 || scr.height < 100) {
      this.lies.push({
        category: "Screen",
        attribute: "resolution",
        expected: "최소 100x100",
        actual: `${scr.width}x${scr.height}`,
        severity: "high",
        description: "비현실적으로 작은 화면 해상도입니다.",
      });
    }

    if (scr.width > 10000 || scr.height > 10000) {
      this.lies.push({
        category: "Screen",
        attribute: "resolution",
        expected: "최대 10000x10000",
        actual: `${scr.width}x${scr.height}`,
        severity: "high",
        description: "비현실적으로 큰 화면 해상도입니다.",
      });
    }

    // devicePixelRatio 검사
    const dpr = window.devicePixelRatio;
    if (dpr <= 0 || dpr > 10) {
      this.lies.push({
        category: "Screen",
        attribute: "devicePixelRatio",
        expected: "0 < ratio <= 10",
        actual: String(dpr),
        severity: "medium",
        description: "비정상적인 devicePixelRatio 값입니다.",
      });
    }
  }

  /**
   * Canvas 거짓 탐지
   */
  private async detectCanvasLies(): Promise<void> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        this.lies.push({
          category: "Canvas",
          attribute: "2d context",
          expected: "CanvasRenderingContext2D",
          actual: "null",
          severity: "medium",
          description: "Canvas 2D 컨텍스트를 가져올 수 없습니다.",
        });
        return;
      }

      // toDataURL이 빈 문자열 반환하는지 확인
      canvas.width = 100;
      canvas.height = 100;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 50, 50);

      const dataUrl = canvas.toDataURL();
      if (!dataUrl || dataUrl === "data:,") {
        this.lies.push({
          category: "Canvas",
          attribute: "toDataURL",
          expected: "유효한 data URL",
          actual: "빈 데이터",
          severity: "high",
          description:
            "Canvas toDataURL이 차단되어 있습니다 (핑거프린트 방지 도구).",
        });
      }

      // 모든 Canvas가 같은 결과를 반환하는지 (Canvas Defender 등)
      const canvas2 = document.createElement("canvas");
      const ctx2 = canvas2.getContext("2d");
      if (ctx2) {
        canvas2.width = 100;
        canvas2.height = 100;
        ctx2.fillStyle = "#ff0000";
        ctx2.fillRect(0, 0, 50, 50);
        // 다른 텍스트 추가
        ctx2.font = "14px Arial";
        ctx2.fillText("Test", 10, 60);

        const dataUrl2 = canvas2.toDataURL();

        // 다른 내용인데 같은 결과면 Canvas noise 추가됨
        if (dataUrl === dataUrl2) {
          this.lies.push({
            category: "Canvas",
            attribute: "fingerprint",
            expected: "서로 다른 Canvas 결과",
            actual: "동일한 결과",
            severity: "high",
            description:
              "다른 Canvas 내용이 같은 결과를 반환합니다 (Canvas 노이즈 도구 감지).",
          });
        }
      }
    } catch (e) {
      this.lies.push({
        category: "Canvas",
        attribute: "execution",
        expected: "정상 실행",
        actual: `오류: ${e}`,
        severity: "medium",
        description: "Canvas 실행 중 오류가 발생했습니다.",
      });
    }
  }

  /**
   * WebGL 거짓 탐지
   */
  private async detectWebGLLies(): Promise<void> {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!gl) {
        // WebGL 지원 안 함 - 거짓이 아닐 수 있음
        return;
      }

      const webgl = gl as WebGLRenderingContext;

      // RENDERER와 VENDOR 확인
      const debugInfo = webgl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const renderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = webgl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

        // 일반적인 스푸핑 값 감지
        const spoofedValues = [
          "Brian Paul", // Mesa 기본값
          "Mesa", // 가상 환경
          "llvmpipe", // 소프트웨어 렌더러
          "SwiftShader", // 소프트웨어 렌더러
          "VirtualBox", // 가상 환경
          "VMware", // 가상 환경
        ];

        for (const spoofed of spoofedValues) {
          if (renderer?.includes(spoofed) || vendor?.includes(spoofed)) {
            this.lies.push({
              category: "WebGL",
              attribute: "renderer/vendor",
              expected: "실제 GPU 정보",
              actual: `${vendor} - ${renderer}`,
              severity: "medium",
              description: `가상 환경 또는 소프트웨어 렌더러가 감지되었습니다: ${spoofed}`,
            });
            break;
          }
        }

        // 빈 값 감지
        if (!renderer || !vendor) {
          this.lies.push({
            category: "WebGL",
            attribute: "renderer/vendor",
            expected: "유효한 GPU 정보",
            actual: `vendor: ${vendor}, renderer: ${renderer}`,
            severity: "medium",
            description: "WebGL renderer/vendor 정보가 비어있습니다.",
          });
        }
      }

      // WebGL 파라미터 이상치 검사
      const maxTextureSize = webgl.getParameter(webgl.MAX_TEXTURE_SIZE);
      if (maxTextureSize < 1024 || maxTextureSize > 65536) {
        this.lies.push({
          category: "WebGL",
          attribute: "MAX_TEXTURE_SIZE",
          expected: "1024-65536",
          actual: String(maxTextureSize),
          severity: "low",
          description: "비정상적인 MAX_TEXTURE_SIZE 값입니다.",
        });
      }
    } catch {
      // WebGL 오류 - 무시
    }
  }

  /**
   * Timing 거짓 탐지
   */
  private async detectTimingLies(): Promise<void> {
    // timezone과 Intl 불일치
    const timezoneOffset = new Date().getTimezoneOffset();

    // timezone offset 검증
    if (Math.abs(timezoneOffset) > 840) {
      // ±14시간
      this.lies.push({
        category: "Timing",
        attribute: "timezoneOffset",
        expected: "-840 ~ 840",
        actual: String(timezoneOffset),
        severity: "high",
        description: "비정상적인 시간대 오프셋입니다.",
      });
    }

    // performance.now() 정밀도 확인 (핑거프린트 방지 도구는 정밀도를 낮춤)
    const samples: number[] = [];
    for (let i = 0; i < 10; i++) {
      samples.push(performance.now());
    }

    const uniqueSamples = new Set(samples);
    if (uniqueSamples.size === 1) {
      this.lies.push({
        category: "Timing",
        attribute: "performance.now",
        expected: "고정밀 타이밍",
        actual: "저정밀 또는 고정 값",
        severity: "medium",
        description:
          "performance.now()의 정밀도가 낮습니다 (프라이버시 보호 도구 가능성).",
      });
    }
  }

  /**
   * 속성 간 불일치 탐지
   */
  private async detectInconsistencies(): Promise<void> {
    const ua = navigator.userAgent.toLowerCase();

    // 모바일 UA인데 데스크톱 특성
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      if (navigator.maxTouchPoints === 0) {
        this.inconsistencies.push({
          attributes: ["userAgent", "maxTouchPoints"],
          description: "모바일 User-Agent인데 터치 지원이 없습니다.",
          severity: "high",
        });
      }

      if (screen.width > 1920 || screen.height > 1920) {
        this.inconsistencies.push({
          attributes: ["userAgent", "screen.resolution"],
          description: "모바일 User-Agent인데 데스크톱 수준의 해상도입니다.",
          severity: "medium",
        });
      }
    }

    // Chrome UA인데 Chrome 전용 API 없음
    if (ua.includes("chrome") && !ua.includes("edg")) {
      if (
        typeof (window as Window & { chrome?: unknown }).chrome === "undefined"
      ) {
        this.inconsistencies.push({
          attributes: ["userAgent", "window.chrome"],
          description: "Chrome User-Agent인데 window.chrome 객체가 없습니다.",
          severity: "medium",
        });
      }
    }

    // Firefox UA인데 Firefox 전용 특성 없음
    if (ua.includes("firefox")) {
      if (!("InstallTrigger" in window)) {
        // 최신 Firefox에서는 제거됨, 경고 수준으로만
        this.inconsistencies.push({
          attributes: ["userAgent", "InstallTrigger"],
          description:
            "Firefox User-Agent인데 일부 Firefox 특성이 없습니다 (최신 버전일 수 있음).",
          severity: "low",
        });
      }
    }

    // Safari UA인데 Safari 전용 특성
    if (
      ua.includes("safari") &&
      !ua.includes("chrome") &&
      !ua.includes("chromium")
    ) {
      if (!("webkitStorageInfo" in navigator)) {
        // 참고용
      }
    }
  }

  /**
   * 프라이버시 도구 감지
   */
  private async detectPrivacyTools(): Promise<void> {
    // Tor Browser 감지
    const torIndicators: string[] = [];
    if (screen.width === 1000 && screen.height === 1000) {
      torIndicators.push("Tor 기본 해상도 (1000x1000)");
    }
    if (navigator.plugins.length === 0) {
      torIndicators.push("플러그인 없음");
    }
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === "UTC") {
      torIndicators.push("시간대가 UTC");
    }
    if (torIndicators.length >= 2) {
      this.privacyTools.push({
        tool: "Tor Browser",
        confidence: Math.min(95, 40 + torIndicators.length * 20),
        indicators: torIndicators,
      });
    }

    // Canvas Blocker / Canvas Defender 감지
    const canvasBlockerIndicators: string[] = [];
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 10;
        canvas.height = 10;
        ctx.fillText("a", 0, 10);
        // Canvas 노이즈 감지는 detectCanvasLies에서 수행
      }
    } catch {
      canvasBlockerIndicators.push("Canvas 접근 차단됨");
    }

    // Privacy Badger / uBlock 등 감지 (간접적)
    // 광고 관련 요소 확인은 복잡하므로 생략

    // Brave Browser 감지
    if (
      (navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } })
        .brave
    ) {
      this.privacyTools.push({
        tool: "Brave Browser",
        confidence: 99,
        indicators: ["navigator.brave 객체 존재"],
      });
    }

    // 일반적인 핑거프린트 방지 확장 힌트
    const fpBlockerIndicators: string[] = [];
    if (this.prototypeManipulations.length > 0) {
      fpBlockerIndicators.push(
        `${this.prototypeManipulations.length}개의 prototype 변조 감지`
      );
    }
    if (this.lies.filter((l) => l.category === "Canvas").length > 0) {
      fpBlockerIndicators.push("Canvas 핑거프린트 변조");
    }
    if (fpBlockerIndicators.length > 0) {
      this.privacyTools.push({
        tool: "Fingerprint Blocker (일반)",
        confidence: Math.min(80, 30 + fpBlockerIndicators.length * 25),
        indicators: fpBlockerIndicators,
      });
    }
  }

  /**
   * 거짓 점수 계산
   */
  private calculateLieScore(): number {
    let score = 0;

    // 거짓별 점수
    for (const lie of this.lies) {
      switch (lie.severity) {
        case "critical":
          score += 25;
          break;
        case "high":
          score += 15;
          break;
        case "medium":
          score += 8;
          break;
        case "low":
          score += 3;
          break;
      }
    }

    // Prototype 변조
    for (const manip of this.prototypeManipulations) {
      switch (manip.severity) {
        case "critical":
          score += 20;
          break;
        case "high":
          score += 12;
          break;
        case "medium":
          score += 6;
          break;
      }
    }

    // 불일치
    for (const inc of this.inconsistencies) {
      switch (inc.severity) {
        case "high":
          score += 10;
          break;
        case "medium":
          score += 5;
          break;
        case "low":
          score += 2;
          break;
      }
    }

    // 프라이버시 도구
    for (const tool of this.privacyTools) {
      score += Math.round(tool.confidence / 10);
    }

    return Math.min(100, score);
  }

  /**
   * 신뢰 수준 결정
   */
  private determineTrustLevel(score: number): LieDetectionResult["trustLevel"] {
    if (score >= 70) return "deceptive";
    if (score >= 40) return "untrusted";
    if (score >= 15) return "suspicious";
    return "trusted";
  }

  /**
   * 요약 생성
   */
  private generateSummary(score: number): LieDetectionResult["summary"] {
    const criticalLies = this.lies.filter(
      (l) => l.severity === "critical"
    ).length;

    let description: string;
    if (score >= 70) {
      description =
        "심각한 위변조가 감지되었습니다. 이 브라우저는 핑거프린트를 적극적으로 숨기고 있습니다.";
    } else if (score >= 40) {
      description =
        "상당한 위변조 징후가 있습니다. 프라이버시 도구나 브라우저 확장이 사용 중일 수 있습니다.";
    } else if (score >= 15) {
      description =
        "약간의 의심스러운 징후가 있습니다. 가상 환경이거나 일부 설정이 수정되었을 수 있습니다.";
    } else {
      description =
        "위변조 징후가 거의 없습니다. 브라우저 핑거프린트가 신뢰할 수 있어 보입니다.";
    }

    return {
      totalLies: this.lies.length,
      criticalLies,
      warnings:
        this.inconsistencies.length + this.prototypeManipulations.length,
      description,
    };
  }
}

/**
 * 거짓 탐지 실행 (편의 함수)
 */
export async function detectLies(): Promise<LieDetectionResult> {
  const detector = new LieDetector();
  return detector.detect();
}
