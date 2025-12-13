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

export class FingerprintCollector {
  async collect(): Promise<FingerprintData> {
    const [
      navigator,
      screen,
      hardware,
      webgl,
      canvas,
      audio,
      fonts,
      plugins,
      storage,
      network,
      permissions,
      features,
      timing,
      media,
      clientHints,
    ] = await Promise.all([
      this.collectNavigator(),
      this.collectScreen(),
      this.collectHardware(),
      this.collectWebGL(),
      this.collectCanvas(),
      this.collectAudio(),
      this.collectFonts(),
      this.collectPlugins(),
      this.collectStorage(),
      this.collectNetwork(),
      this.collectPermissions(),
      this.collectFeatures(),
      this.collectTiming(),
      this.collectMedia(),
      this.collectClientHints(),
    ]);

    return {
      navigator,
      screen,
      hardware,
      webgl,
      canvas,
      audio,
      fonts,
      plugins,
      storage,
      network,
      permissions,
      features,
      timing,
      media,
      clientHints,
    };
  }

  private async collectNavigator(): Promise<Record<string, unknown>> {
    const nav = window.navigator;

    return {
      userAgent: nav.userAgent,
      userAgentData: await this.getUserAgentData(),
      appName: nav.appName,
      appVersion: nav.appVersion,
      platform: nav.platform,
      vendor: nav.vendor,
      vendorSub: nav.vendorSub,
      product: nav.product,
      productSub: nav.productSub,
      language: nav.language,
      languages: [...(nav.languages || [])],
      onLine: nav.onLine,
      cookieEnabled: nav.cookieEnabled,
      doNotTrack: nav.doNotTrack,
      maxTouchPoints: nav.maxTouchPoints,
      pdfViewerEnabled: nav.pdfViewerEnabled,
      hardwareConcurrency: nav.hardwareConcurrency,
      deviceMemory: (nav as Navigator & { deviceMemory?: number }).deviceMemory,
      webdriver: nav.webdriver,
    };
  }

  private async getUserAgentData(): Promise<Record<string, unknown> | null> {
    if ("userAgentData" in navigator) {
      const uaData = (
        navigator as Navigator & {
          userAgentData?: {
            brands: Array<{ brand: string; version: string }>;
            mobile: boolean;
            platform: string;
            getHighEntropyValues: (
              hints: string[]
            ) => Promise<Record<string, unknown>>;
          };
        }
      ).userAgentData;

      if (uaData) {
        try {
          const highEntropy = await uaData.getHighEntropyValues([
            "architecture",
            "bitness",
            "brands",
            "fullVersionList",
            "mobile",
            "model",
            "platform",
            "platformVersion",
            "uaFullVersion",
            "wow64",
          ]);

          return {
            brands: uaData.brands,
            mobile: uaData.mobile,
            platform: uaData.platform,
            ...highEntropy,
          };
        } catch {
          return {
            brands: uaData.brands,
            mobile: uaData.mobile,
            platform: uaData.platform,
          };
        }
      }
    }
    return null;
  }

  private async collectScreen(): Promise<Record<string, unknown>> {
    const s = window.screen;

    return {
      width: s.width,
      height: s.height,
      availWidth: s.availWidth,
      availHeight: s.availHeight,
      colorDepth: s.colorDepth,
      pixelDepth: s.pixelDepth,
      devicePixelRatio: window.devicePixelRatio,
      orientation: s.orientation?.type || "unknown",
      orientationAngle: s.orientation?.angle || 0,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screenX: window.screenX,
      screenY: window.screenY,
      pageXOffset: window.pageXOffset,
      pageYOffset: window.pageYOffset,
      visualViewportWidth: window.visualViewport?.width,
      visualViewportHeight: window.visualViewport?.height,
      visualViewportScale: window.visualViewport?.scale,
    };
  }

  private async collectHardware(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
    };

    // Battery API
    if ("getBattery" in navigator) {
      try {
        const battery = await (
          navigator as Navigator & {
            getBattery: () => Promise<{
              charging: boolean;
              chargingTime: number;
              dischargingTime: number;
              level: number;
            }>;
          }
        ).getBattery();
        result.batteryCharging = battery.charging;
        result.batteryLevel = Math.round(battery.level * 100) + "%";
        result.batteryChargingTime = battery.chargingTime;
        result.batteryDischargingTime = battery.dischargingTime;
      } catch {
        result.batteryApi = "blocked";
      }
    }

    // Gamepad API
    result.gamepadsSupported = "getGamepads" in navigator;

    // USB API
    result.usbSupported = "usb" in navigator;

    // Bluetooth API
    result.bluetoothSupported = "bluetooth" in navigator;

    // Serial API
    result.serialSupported = "serial" in navigator;

    // HID API
    result.hidSupported = "hid" in navigator;

    return result;
  }

  private async collectWebGL(): Promise<Record<string, unknown>> {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      return { supported: false };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    const result: Record<string, unknown> = {
      supported: true,
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
      maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(
        gl.MAX_FRAGMENT_UNIFORM_VECTORS
      ),
      maxVertexTextureImageUnits: gl.getParameter(
        gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
      ),
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxCombinedTextureImageUnits: gl.getParameter(
        gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
      ),
      aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
      aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE),
      redBits: gl.getParameter(gl.RED_BITS),
      greenBits: gl.getParameter(gl.GREEN_BITS),
      blueBits: gl.getParameter(gl.BLUE_BITS),
      alphaBits: gl.getParameter(gl.ALPHA_BITS),
      depthBits: gl.getParameter(gl.DEPTH_BITS),
      stencilBits: gl.getParameter(gl.STENCIL_BITS),
    };

    if (debugInfo) {
      result.unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      result.unmaskedRenderer = gl.getParameter(
        debugInfo.UNMASKED_RENDERER_WEBGL
      );
    }

    // Extensions
    const extensions = gl.getSupportedExtensions();
    result.extensions = extensions || [];
    result.extensionsCount = extensions?.length || 0;

    // WebGL2
    const gl2 = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    result.webgl2Supported = !!gl2;

    if (gl2) {
      result.webgl2Version = gl2.getParameter(gl2.VERSION);
      result.webgl2MaxSamples = gl2.getParameter(gl2.MAX_SAMPLES);
      result.webgl2Max3DTextureSize = gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE);
      result.webgl2MaxArrayTextureLayers = gl2.getParameter(
        gl2.MAX_ARRAY_TEXTURE_LAYERS
      );
    }

    return result;
  }

  private async collectCanvas(): Promise<Record<string, unknown>> {
    const images: { name: string; description: string; image: string; hash: string }[] = [];

    // === 테스트 1: 텍스트 & 도형 (기본 핑거프린트) ===
    const canvas1 = document.createElement("canvas");
    canvas1.width = 280;
    canvas1.height = 60;
    const ctx1 = canvas1.getContext("2d");

    if (!ctx1) {
      return { supported: false };
    }

    ctx1.fillStyle = "#f60";
    ctx1.fillRect(10, 10, 100, 40);

    ctx1.fillStyle = "#069";
    ctx1.font = "14px Arial";
    ctx1.fillText("Browser Fingerprint!", 2, 20);

    ctx1.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx1.fillText("Canvas Test 🎨", 4, 40);

    ctx1.strokeStyle = "#0a4";
    ctx1.beginPath();
    ctx1.arc(50, 30, 15, 0, Math.PI * 2);
    ctx1.stroke();

    ctx1.beginPath();
    ctx1.moveTo(120, 10);
    ctx1.bezierCurveTo(150, 10, 150, 50, 180, 50);
    ctx1.stroke();

    const gradient1 = ctx1.createLinearGradient(200, 0, 280, 0);
    gradient1.addColorStop(0, "red");
    gradient1.addColorStop(0.5, "green");
    gradient1.addColorStop(1, "blue");
    ctx1.fillStyle = gradient1;
    ctx1.fillRect(200, 10, 80, 40);

    const dataURL1 = canvas1.toDataURL();
    const hash1 = await this.hashString(dataURL1);
    images.push({
      name: "텍스트 & 도형",
      description: "폰트 렌더링, 안티앨리어싱, 베지어 곡선 테스트",
      image: dataURL1,
      hash: hash1,
    });

    // === 테스트 2: 이모지 & 유니코드 ===
    const canvas2 = document.createElement("canvas");
    canvas2.width = 280;
    canvas2.height = 60;
    const ctx2 = canvas2.getContext("2d");

    if (ctx2) {
      ctx2.fillStyle = "#1a1a2e";
      ctx2.fillRect(0, 0, 280, 60);

      ctx2.font = "24px Arial";
      ctx2.fillText("🔒🌍🎮💻🔥", 10, 35);

      ctx2.font = "12px serif";
      ctx2.fillStyle = "#fff";
      ctx2.fillText("한글 日本語 العربية", 150, 25);
      ctx2.fillText("Ćçñ αβγ ∑∏∫", 150, 45);

      const dataURL2 = canvas2.toDataURL();
      const hash2 = await this.hashString(dataURL2);
      images.push({
        name: "이모지 & 유니코드",
        description: "이모지 렌더링, 다국어 폰트 지원 테스트",
        image: dataURL2,
        hash: hash2,
      });
    }

    // === 테스트 3: 그라데이션 & 투명도 ===
    const canvas3 = document.createElement("canvas");
    canvas3.width = 280;
    canvas3.height = 60;
    const ctx3 = canvas3.getContext("2d");

    if (ctx3) {
      // 방사형 그라데이션
      const radialGrad = ctx3.createRadialGradient(70, 30, 5, 70, 30, 40);
      radialGrad.addColorStop(0, "rgba(255, 0, 0, 1)");
      radialGrad.addColorStop(0.5, "rgba(0, 255, 0, 0.7)");
      radialGrad.addColorStop(1, "rgba(0, 0, 255, 0.3)");
      ctx3.fillStyle = radialGrad;
      ctx3.fillRect(20, 5, 100, 50);

      // 선형 그라데이션 + 투명도
      const linearGrad = ctx3.createLinearGradient(140, 0, 260, 60);
      linearGrad.addColorStop(0, "rgba(255, 255, 0, 0.8)");
      linearGrad.addColorStop(0.5, "rgba(255, 0, 255, 0.5)");
      linearGrad.addColorStop(1, "rgba(0, 255, 255, 0.2)");
      ctx3.fillStyle = linearGrad;
      ctx3.fillRect(140, 5, 120, 50);

      // 투명도 겹침 테스트
      ctx3.globalAlpha = 0.5;
      ctx3.fillStyle = "#ff0000";
      ctx3.beginPath();
      ctx3.arc(200, 30, 20, 0, Math.PI * 2);
      ctx3.fill();
      ctx3.globalAlpha = 1.0;

      const dataURL3 = canvas3.toDataURL();
      const hash3 = await this.hashString(dataURL3);
      images.push({
        name: "그라데이션 & 투명도",
        description: "색상 블렌딩, 알파 채널 처리 테스트",
        image: dataURL3,
        hash: hash3,
      });
    }

    // 통합 해시 생성
    const combinedHash = await this.hashString(images.map(i => i.hash).join(""));

    return {
      supported: true,
      hash: combinedHash,
      images: images,
      image: images[0]?.image, // 기존 호환성 유지
      dataURLLength: dataURL1.length,
      width: canvas1.width,
      height: canvas1.height,
      testCount: images.length,
    };
  }

  private async collectAudio(): Promise<Record<string, unknown>> {
    try {
      const AudioContext =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof window.AudioContext })
          .webkitAudioContext;

      if (!AudioContext) {
        return { supported: false };
      }

      const context = new AudioContext();

      const result: Record<string, unknown> = {
        supported: true,
        sampleRate: context.sampleRate,
        channelCount: context.destination.channelCount,
        maxChannelCount: context.destination.maxChannelCount,
        state: context.state,
        baseLatency: context.baseLatency,
        outputLatency: (context as AudioContext & { outputLatency?: number })
          .outputLatency,
      };

      // Audio fingerprint through oscillator
      try {
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gain = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gain.gain.value = 0; // Mute
        oscillator.type = "triangle";
        oscillator.frequency.value = 10000;

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gain);
        gain.connect(context.destination);

        oscillator.start(0);

        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatFrequencyData(dataArray);

        const sum = dataArray.reduce((a, b) => a + Math.abs(b), 0);
        result.audioHash = sum.toFixed(6);

        oscillator.stop();
        scriptProcessor.disconnect();
        analyser.disconnect();
        gain.disconnect();
      } catch {
        result.audioHash = "unavailable";
      }

      await context.close();

      return result;
    } catch {
      return { supported: false };
    }
  }

  private async collectFonts(): Promise<Record<string, unknown>> {
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testFonts = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Arial Rounded MT Bold",
      "Calibri",
      "Cambria",
      "Candara",
      "Century Gothic",
      "Comic Sans MS",
      "Consolas",
      "Courier",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Microsoft Sans Serif",
      "Monaco",
      "Palatino Linotype",
      "Segoe UI",
      "Tahoma",
      "Times",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
      "Wingdings",
      "Webdings",
      // Korean fonts
      "맑은 고딕",
      "Malgun Gothic",
      "나눔고딕",
      "NanumGothic",
      "굴림",
      "Gulim",
      "돋움",
      "Dotum",
      "바탕",
      "Batang",
      "궁서",
      "Gungsuh",
      // Japanese fonts
      "MS Gothic",
      "MS PGothic",
      "MS Mincho",
      "Yu Gothic",
      // Chinese fonts
      "SimHei",
      "SimSun",
      "Microsoft YaHei",
      // Other
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Noto Color Emoji",
    ];

    const testString = "mmmmmmmmmmlli@#$%^&*()";
    const testSize = "72px";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return { supported: false };
    }

    const getTextWidth = (font: string): number => {
      ctx.font = `${testSize} ${font}`;
      return ctx.measureText(testString).width;
    };

    const baseWidths: Record<string, number> = {};
    for (const baseFont of baseFonts) {
      baseWidths[baseFont] = getTextWidth(baseFont);
    }

    const detectedFonts: string[] = [];
    for (const font of testFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        const width = getTextWidth(`"${font}", ${baseFont}`);
        if (width !== baseWidths[baseFont]) {
          detected = true;
          break;
        }
      }
      if (detected) {
        detectedFonts.push(font);
      }
    }

    return {
      detectedFonts: detectedFonts,
      detectedCount: detectedFonts.length,
      testedCount: testFonts.length,
    };
  }

  private async collectPlugins(): Promise<Record<string, unknown>> {
    const plugins = navigator.plugins;
    const pluginList: Array<{
      name: string;
      filename: string;
      description: string;
    }> = [];

    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      pluginList.push({
        name: plugin.name,
        filename: plugin.filename,
        description: plugin.description,
      });
    }

    const mimeTypes = navigator.mimeTypes;
    const mimeTypeList: Array<{
      type: string;
      suffixes: string;
      description: string;
    }> = [];

    for (let i = 0; i < mimeTypes.length; i++) {
      const mimeType = mimeTypes[i];
      mimeTypeList.push({
        type: mimeType.type,
        suffixes: mimeType.suffixes,
        description: mimeType.description,
      });
    }

    return {
      plugins: pluginList,
      pluginsCount: pluginList.length,
      mimeTypes: mimeTypeList,
      mimeTypesCount: mimeTypeList.length,
    };
  }

  private async collectStorage(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {
      cookieEnabled: navigator.cookieEnabled,
    };

    // LocalStorage
    try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      result.localStorageEnabled = true;
    } catch {
      result.localStorageEnabled = false;
    }

    // SessionStorage
    try {
      sessionStorage.setItem("test", "test");
      sessionStorage.removeItem("test");
      result.sessionStorageEnabled = true;
    } catch {
      result.sessionStorageEnabled = false;
    }

    // IndexedDB
    result.indexedDBEnabled = !!window.indexedDB;

    // Web SQL (deprecated)
    result.webSQLEnabled = !!(window as Window & { openDatabase?: unknown })
      .openDatabase;

    // Storage estimate
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        result.storageQuota =
          Math.round((estimate.quota || 0) / (1024 * 1024)) + " MB";
        result.storageUsage =
          Math.round((estimate.usage || 0) / (1024 * 1024)) + " MB";
      } catch {
        result.storageEstimate = "unavailable";
      }
    }

    // Cache API
    result.cacheAPIEnabled = "caches" in window;

    return result;
  }

  private async collectNetwork(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {
      onLine: navigator.onLine,
    };

    // Connection API
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType: string;
          downlink: number;
          rtt: number;
          saveData: boolean;
          type?: string;
        };
      }
    ).connection;

    if (connection) {
      result.effectiveType = connection.effectiveType;
      result.downlink = connection.downlink + " Mbps";
      result.rtt = connection.rtt + " ms";
      result.saveData = connection.saveData;
      if (connection.type) {
        result.connectionType = connection.type;
      }
    }

    // WebRTC
    result.webRTCEnabled = !!(
      window.RTCPeerConnection ||
      (window as Window & { webkitRTCPeerConnection?: unknown })
        .webkitRTCPeerConnection
    );

    // WebSocket
    result.webSocketEnabled = "WebSocket" in window;

    // Beacon API
    result.beaconEnabled = "sendBeacon" in navigator;

    // Fetch API
    result.fetchEnabled = "fetch" in window;

    return result;
  }

  private async collectPermissions(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    const permissionsToCheck = [
      "geolocation",
      "notifications",
      "push",
      "microphone",
      "camera",
      "midi",
      "accelerometer",
      "gyroscope",
      "magnetometer",
      "clipboard-read",
      "clipboard-write",
      "payment-handler",
      "persistent-storage",
      "screen-wake-lock",
      "xr-spatial-tracking",
    ];

    if (navigator.permissions) {
      for (const permission of permissionsToCheck) {
        try {
          const status = await navigator.permissions.query({
            name: permission as PermissionName,
          });
          result[permission] = status.state;
        } catch {
          result[permission] = "not-supported";
        }
      }
    } else {
      result.permissionsAPI = "not-supported";
    }

    return result;
  }

  private async collectFeatures(): Promise<Record<string, unknown>> {
    return {
      // APIs
      serviceWorker: "serviceWorker" in navigator,
      webWorker: typeof Worker !== "undefined",
      sharedWorker: typeof SharedWorker !== "undefined",
      pushManager: "PushManager" in window,
      notifications: "Notification" in window,

      // Graphics
      webgl: !!document.createElement("canvas").getContext("webgl"),
      webgl2: !!document.createElement("canvas").getContext("webgl2"),
      webgpu: "gpu" in navigator,

      // Media
      mediaDevices: "mediaDevices" in navigator,
      mediaRecorder: "MediaRecorder" in window,
      mediaSource: "MediaSource" in window,

      // Security
      credentials: "credentials" in navigator,
      webAuthn: "PublicKeyCredential" in window,

      // Performance
      performanceObserver: "PerformanceObserver" in window,

      // Sensors
      accelerometer: "Accelerometer" in window,
      gyroscope: "Gyroscope" in window,
      magnetometer: "Magnetometer" in window,
      absoluteOrientationSensor: "AbsoluteOrientationSensor" in window,

      // Other
      intersectionObserver: "IntersectionObserver" in window,
      mutationObserver: "MutationObserver" in window,
      resizeObserver: "ResizeObserver" in window,
      bluetooth: "bluetooth" in navigator,
      usb: "usb" in navigator,
      serial: "serial" in navigator,
      hid: "hid" in navigator,
      nfc: "NDEFReader" in window,
      share: "share" in navigator,
      clipboard: "clipboard" in navigator,
      presentation: "presentation" in navigator,
      wakeLock: "wakeLock" in navigator,
      xr: "xr" in navigator,
      speechRecognition:
        "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
      speechSynthesis: "speechSynthesis" in window,
    };
  }

  private async collectTiming(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    // Performance timing
    if (performance.timing) {
      const timing = performance.timing;
      result.navigationStart = timing.navigationStart;
      result.domContentLoaded =
        timing.domContentLoadedEventEnd - timing.navigationStart;
      result.loadComplete = timing.loadEventEnd - timing.navigationStart;
    }

    // Timezone
    result.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    result.timezoneOffset = new Date().getTimezoneOffset();
    result.locale = Intl.DateTimeFormat().resolvedOptions().locale;

    // Date formatting
    result.dateFormat = new Intl.DateTimeFormat().format(new Date());
    result.numberFormat = new Intl.NumberFormat().format(1234567.89);

    // High resolution time precision
    const times: number[] = [];
    for (let i = 0; i < 10; i++) {
      const t1 = performance.now();
      const t2 = performance.now();
      times.push(t2 - t1);
    }
    result.timerPrecision =
      Math.min(...times.filter((t) => t > 0)) || "high-precision";

    return result;
  }

  private async collectMedia(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    // Video codecs
    const video = document.createElement("video");
    const videoCodecs = [
      'video/mp4; codecs="avc1.42E01E"',
      'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
      'video/mp4; codecs="avc1.4D401E"',
      'video/mp4; codecs="avc1.64001E"',
      'video/mp4; codecs="hvc1.1.L93.B0"',
      'video/mp4; codecs="hev1.1.L93.B0"',
      'video/webm; codecs="vp8"',
      'video/webm; codecs="vp8, vorbis"',
      'video/webm; codecs="vp9"',
      'video/webm; codecs="vp09.00.10.08"',
      'video/ogg; codecs="theora"',
      'video/mp4; codecs="av01.0.01M.08"',
    ];

    const supportedVideoCodecs: string[] = [];
    for (const codec of videoCodecs) {
      if (video.canPlayType(codec)) {
        supportedVideoCodecs.push(codec);
      }
    }
    result.videoCodecs = supportedVideoCodecs;

    // Audio codecs
    const audio = document.createElement("audio");
    const audioCodecs = [
      'audio/mp4; codecs="mp4a.40.2"',
      'audio/mp4; codecs="mp4a.40.5"',
      "audio/mpeg",
      'audio/ogg; codecs="vorbis"',
      'audio/ogg; codecs="opus"',
      'audio/webm; codecs="vorbis"',
      'audio/webm; codecs="opus"',
      'audio/wav; codecs="1"',
      "audio/flac",
      "audio/aac",
    ];

    const supportedAudioCodecs: string[] = [];
    for (const codec of audioCodecs) {
      if (audio.canPlayType(codec)) {
        supportedAudioCodecs.push(codec);
      }
    }
    result.audioCodecs = supportedAudioCodecs;

    // DRM
    result.eme = "MediaKeys" in window;
    result.mse = "MediaSource" in window;

    // Media devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        result.audioInputDevices = devices.filter(
          (d) => d.kind === "audioinput"
        ).length;
        result.audioOutputDevices = devices.filter(
          (d) => d.kind === "audiooutput"
        ).length;
        result.videoInputDevices = devices.filter(
          (d) => d.kind === "videoinput"
        ).length;
      } catch {
        result.mediaDevicesAccess = "denied";
      }
    }

    // Picture-in-Picture
    result.pictureInPicture = "pictureInPictureEnabled" in document;

    return result;
  }

  private async collectClientHints(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    // User-Agent Client Hints
    if ("userAgentData" in navigator) {
      const uaData = (
        navigator as Navigator & {
          userAgentData?: {
            brands: Array<{ brand: string; version: string }>;
            mobile: boolean;
            platform: string;
            getHighEntropyValues: (
              hints: string[]
            ) => Promise<Record<string, unknown>>;
          };
        }
      ).userAgentData;

      if (uaData) {
        result.brands = uaData.brands;
        result.mobile = uaData.mobile;
        result.platform = uaData.platform;

        try {
          const hints = await uaData.getHighEntropyValues([
            "architecture",
            "bitness",
            "fullVersionList",
            "model",
            "platformVersion",
            "uaFullVersion",
            "wow64",
            "formFactor",
          ]);
          Object.assign(result, hints);
        } catch {
          result.highEntropyValues = "unavailable";
        }
      }
    } else {
      result.userAgentData = "not-supported";
    }

    // Device memory hint
    result.deviceMemory = (
      navigator as Navigator & { deviceMemory?: number }
    ).deviceMemory;

    // Save-Data hint
    const connection = (
      navigator as Navigator & {
        connection?: { saveData: boolean };
      }
    ).connection;
    result.saveData = connection?.saveData;

    // Prefers-color-scheme
    result.prefersColorScheme = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";

    // Prefers-reduced-motion
    result.prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Prefers-contrast
    result.prefersContrast = window.matchMedia("(prefers-contrast: more)")
      .matches
      ? "more"
      : window.matchMedia("(prefers-contrast: less)").matches
      ? "less"
      : "no-preference";

    // Forced colors
    result.forcedColors = window.matchMedia("(forced-colors: active)").matches;

    return result;
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
}
