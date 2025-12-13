import { redirect } from "next/navigation";

/**
 * 루트 페이지
 * 브라우저 접속 시 /fingerprint로 리다이렉트
 * CLI(curl) 접속은 middleware에서 /api/cli로 처리됨
 */
export default function Home() {
  redirect("/fingerprint");
}
