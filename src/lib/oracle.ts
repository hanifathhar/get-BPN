/**
 * Helper validasi & parsing 18 Digit NOP SISMIOP
 */
export function parseNop(nopRaw: string) {
  const nopClean = (nopRaw || "").replace(/\D/g, "");
  
  if (nopClean.length !== 18) {
    throw new Error("Format NOP harus 18 digit angka standar SISMIOP PBB.");
  }

  return {
    raw: nopRaw,
    clean: nopClean,
    formatted: `${nopClean.substring(0,2)}.${nopClean.substring(2,4)}.${nopClean.substring(4,7)}.${nopClean.substring(7,10)}.${nopClean.substring(10,13)}-${nopClean.substring(13,17)}.${nopClean.substring(17,18)}`,
    kd_propinsi: nopClean.substring(0, 2),
    kd_dati2: nopClean.substring(2, 4),
    kd_kecamatan: nopClean.substring(4, 7),
    kd_kelurahan: nopClean.substring(7, 10),
    kd_blok: nopClean.substring(10, 13),
    no_urut: nopClean.substring(13, 17),
    kd_jns_op: nopClean.substring(17, 18),
  };
}

/**
 * Driver SISMIOP PBB: Terhubung ke backend Oracle Bridge Service
 */
export async function querySismiop(action: "health" | "detail_nop" | "sppt", nop?: string) {
  const parsed = nop ? parseNop(nop) : null;
  const nopClean = parsed ? parsed.clean : "";

  const bridgeUrl = `http://127.0.0.1:8080/?action=${action}&nop=${encodeURIComponent(nopClean)}`;
  
  const res = await fetch(bridgeUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const json = await res.json();
  return json;
}
