import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 국기 이모지 변환
export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// 라벨 포맷팅
export function formatLabel(label: string): string {
  return label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

// 값 포맷팅
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "Empty";
    return value.join(", ");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// 의심스러운 값 체크
export function checkSuspicious(label: string, value: unknown): boolean {
  const suspiciousPatterns = [
    /headless/i,
    /phantom/i,
    /selenium/i,
    /webdriver/i,
    /puppeteer/i,
    /playwright/i,
  ];

  const stringValue = String(value).toLowerCase();

  // 자동화 도구 감지
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(stringValue)) return true;
  }

  // webdriver 관련 필드
  if (label.toLowerCase().includes("webdriver") && value === true) return true;

  return false;
}

// 누락된 값 체크
export function checkMissing(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (value === "") return true;
  if (value === "N/A") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

// 브라우저 이름 추출
export function getBrowserName(userAgent: string): string {
  if (!userAgent) return "Unknown";

  if (userAgent.includes("Firefox/")) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return match ? `Firefox ${match[1]}` : "Firefox";
  }
  if (userAgent.includes("Edg/")) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return match ? `Edge ${match[1]}` : "Edge";
  }
  if (userAgent.includes("Chrome/")) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return match ? `Chrome ${match[1]}` : "Chrome";
  }
  if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    const match = userAgent.match(/Version\/(\d+)/);
    return match ? `Safari ${match[1]}` : "Safari";
  }

  return "Unknown";
}

// OS 이름 추출
export function getOSName(platform: string, userAgent: string): string {
  if (!platform && !userAgent) return "Unknown";

  const ua = userAgent?.toLowerCase() || "";
  const plt = platform?.toLowerCase() || "";

  if (ua.includes("windows nt 10") || plt.includes("win")) {
    return ua.includes("windows nt 10") ? "Windows 10/11" : "Windows";
  }
  if (ua.includes("mac os x") || plt.includes("mac")) {
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    return match ? `macOS ${match[1].replace("_", ".")}` : "macOS";
  }
  if (ua.includes("android")) {
    const match = ua.match(/android (\d+)/);
    return match ? `Android ${match[1]}` : "Android";
  }
  if (ua.includes("iphone") || ua.includes("ipad")) {
    return "iOS";
  }
  if (ua.includes("linux")) {
    return "Linux";
  }

  return platform || "Unknown";
}

// 언어 포맷팅
export function formatLanguages(languages: string[]): string {
  if (!languages || languages.length === 0) return "N/A";
  return languages.slice(0, 3).join(", ") + (languages.length > 3 ? "..." : "");
}

// 텍스트 자르기
export function truncateText(text: string, maxLength: number): string {
  if (!text) return "N/A";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// 엔트로피 계산
export function calculateEntropy(data: Record<string, unknown>): number {
  const str = JSON.stringify(data);
  const freq: Record<string, number> = {};

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;

  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return Math.round(entropy * 10);
}

// 고유성 점수 계산
export function calculateUniqueness(data: Record<string, unknown>): string {
  const props = countProperties(data);
  const score = Math.min(99.9, 50 + props * 0.5);
  return `${score.toFixed(1)}%`;
}

// 속성 개수 카운트
export function countProperties(obj: Record<string, unknown>): number {
  let count = 0;

  function countNested(o: unknown): void {
    if (o && typeof o === "object" && !Array.isArray(o)) {
      for (const value of Object.values(o)) {
        count++;
        countNested(value);
      }
    }
  }

  countNested(obj);
  return count;
}

// 데이터 품질 분석
export function analyzeDataQuality(data: Record<string, unknown>): {
  suspicious: number;
  missing: number;
  total: number;
  score: number;
} {
  let suspicious = 0;
  let missing = 0;
  let total = 0;

  function analyze(obj: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(obj)) {
      total++;
      if (checkSuspicious(key, value)) suspicious++;
      if (checkMissing(value)) missing++;

      if (value && typeof value === "object" && !Array.isArray(value)) {
        analyze(value as Record<string, unknown>);
      }
    }
  }

  analyze(data);

  const issues = suspicious + missing;
  const score = total > 0 ? Math.round(((total - issues) / total) * 100) : 0;

  return { suspicious, missing, total, score };
}
