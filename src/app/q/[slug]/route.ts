import { NextRequest, NextResponse } from "next/server";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FALLBACK_URL = "https://coastalmobilelube.com";

interface NetlifyGeo {
  country?: { code?: string; name?: string };
  subdivision?: { code?: string; name?: string };
  city?: string;
}

function parseNetlifyGeo(header: string | null): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  if (!header) return { country: null, region: null, city: null };
  try {
    const decoded = Buffer.from(header, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded) as NetlifyGeo;
    return {
      country: parsed.country?.code || parsed.country?.name || null,
      region: parsed.subdivision?.code || parsed.subdivision?.name || null,
      city: parsed.city || null,
    };
  } catch {
    return { country: null, region: null, city: null };
  }
}

function maskIp(ipHeader: string | null): string | null {
  if (!ipHeader) return null;
  const first = ipHeader.split(",")[0].trim();
  if (!first) return null;
  if (first.includes(":")) {
    const parts = first.split(":");
    return parts.slice(0, 4).join(":") + ":xxxx";
  }
  const parts = first.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  const q = query(
    collection(db, "qrCodes"),
    where("slug", "==", slug),
    limit(1),
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return NextResponse.redirect(FALLBACK_URL, { status: 302 });
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data() as { destination?: string; active?: boolean };

  if (data.active === false || !data.destination) {
    return NextResponse.redirect(FALLBACK_URL, { status: 302 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const referrer = request.headers.get("referer");
  const geo = parseNetlifyGeo(request.headers.get("x-nf-geo"));
  const ipHash = maskIp(request.headers.get("x-forwarded-for"));

  void addDoc(collection(db, "qrScans"), {
    slug,
    qrCodeId: docSnap.id,
    scannedAt: serverTimestamp(),
    userAgent,
    referrer: referrer || null,
    country: geo.country,
    region: geo.region,
    city: geo.city,
    ipHash,
  }).catch(() => {});

  void updateDoc(doc(db, "qrCodes", docSnap.id), {
    scanCount: increment(1),
    lastScannedAt: serverTimestamp(),
  }).catch(() => {});

  return NextResponse.redirect(data.destination, { status: 302 });
}
