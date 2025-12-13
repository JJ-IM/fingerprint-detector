/**
 * Next.js Instrumentation
 * 서버 시작 시 API 상태 체크 및 초기화
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await checkApiStatus();
  }
}

async function checkApiStatus() {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║           🔍 Fingerprint Detector - API Status            ║");
  console.log("╠═══════════════════════════════════════════════════════════╣");

  // ProxyCheck.io 상태 체크
  const proxyCheckStatus = await checkProxyCheck();

  // IP-API 상태 체크
  const ipApiStatus = await checkIpApi();

  console.log("╠═══════════════════════════════════════════════════════════╣");
  console.log(
    `║  ProxyCheck.io : ${proxyCheckStatus.ok ? "✅ 정상" : "❌ 실패"} (${
      proxyCheckStatus.latency
    }ms)`.padEnd(60) + "║"
  );
  console.log(
    `║  IP-API.com    : ${ipApiStatus.ok ? "✅ 정상" : "❌ 실패"} (${
      ipApiStatus.latency
    }ms)`.padEnd(60) + "║"
  );
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("\n");
}

async function checkProxyCheck(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  try {
    const apiKey = process.env.PROXYCHECK_API_KEY || "";
    const url = apiKey
      ? `https://proxycheck.io/v2/8.8.8.8?key=${apiKey}&vpn=1&asn=1`
      : "https://proxycheck.io/v2/8.8.8.8?vpn=1&asn=1";

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json();
    const latency = Date.now() - start;

    return {
      ok: data.status === "ok" || response.ok,
      latency,
    };
  } catch {
    return {
      ok: false,
      latency: Date.now() - start,
    };
  }
}

async function checkIpApi(): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  try {
    const response = await fetch(
      "http://ip-api.com/json/8.8.8.8?fields=status",
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    const data = await response.json();
    const latency = Date.now() - start;

    return {
      ok: data.status === "success",
      latency,
    };
  } catch {
    return {
      ok: false,
      latency: Date.now() - start,
    };
  }
}
