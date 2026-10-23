import { noStoreJson } from "@/lib/api/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = async () =>
  noStoreJson({
    ok: true,
    service: "magia",
    time: new Date().toISOString(),
  });
