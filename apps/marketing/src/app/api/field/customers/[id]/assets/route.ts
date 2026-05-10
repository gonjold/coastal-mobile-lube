import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireRole } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import type { AssetType } from "@/types";

export const dynamic = "force-dynamic";

type AssetSummary = {
  id: string;
  customerId: string;
  type: AssetType;
  displayName: string;
  nickname?: string;
  year?: number | string | null;
  make?: string | null;
  model?: string | null;
};

function pickAssetType(t: unknown): AssetType {
  if (
    t === "vehicle" ||
    t === "boat" ||
    t === "trailer" ||
    t === "fleet_vehicle"
  ) {
    return t;
  }
  return "vehicle";
}

function buildDisplayName(a: {
  nickname?: string | null;
  year?: number | string | null;
  make?: string | null;
  model?: string | null;
}): string {
  if (a.nickname && a.nickname.trim()) return a.nickname.trim();
  const parts = [a.year, a.make, a.model].filter(Boolean) as Array<
    string | number
  >;
  return parts.join(" ").trim() || "Asset";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id: customerId } = await params;
  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const snap = await db
    .collection("assets")
    .where("customerId", "==", customerId)
    .get();

  const results: AssetSummary[] = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      if (data.deletedAt) return null;
      const summary: AssetSummary = {
        id: d.id,
        customerId,
        type: (typeof data.type === "string"
          ? pickAssetType(data.type)
          : "vehicle") as AssetType,
        displayName: buildDisplayName({
          nickname: typeof data.nickname === "string" ? data.nickname : null,
          year:
            typeof data.year === "number" || typeof data.year === "string"
              ? data.year
              : null,
          make: typeof data.make === "string" ? data.make : null,
          model: typeof data.model === "string" ? data.model : null,
        }),
        nickname: typeof data.nickname === "string" ? data.nickname : undefined,
        year:
          typeof data.year === "number" || typeof data.year === "string"
            ? data.year
            : null,
        make: typeof data.make === "string" ? data.make : null,
        model: typeof data.model === "string" ? data.model : null,
      };
      return summary;
    })
    .filter((x): x is AssetSummary => x !== null);

  return NextResponse.json({ results });
}

type AssetCreateBody = {
  type?: string;
  year?: string | number;
  make?: string;
  model?: string;
  nickname?: string;
};

function rid(): string {
  // Lightweight id; matches the legacy `${type}_<random>` shape from
  // src/lib/assets/mutations.ts but doesn't require nanoid here.
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 12; i++)
    out += a[Math.floor(Math.random() * a.length)];
  return out;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["owner", "tech"]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    const status = msg === "UNAUTHENTICATED" ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id: customerId } = await params;
  const body = (await req.json().catch(() => ({}))) as AssetCreateBody;
  const type = pickAssetType(body.type);
  const year = body.year != null && body.year !== "" ? body.year : null;
  const make = (body.make ?? "").trim();
  const model = (body.model ?? "").trim();
  const nickname = (body.nickname ?? "").trim();

  if (!make && !nickname) {
    return NextResponse.json(
      { error: "Make or nickname is required" },
      { status: 400 },
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json(
      { error: "Firestore not configured" },
      { status: 500 },
    );
  }

  const now = new Date().toISOString();
  const id = `${type}_${rid()}`;
  const doc: Record<string, unknown> = {
    id,
    customerId,
    type,
    createdAt: now,
    updatedAt: now,
  };
  if (year !== null) doc.year = typeof year === "string" ? year : Number(year);
  if (make) doc.make = make;
  if (model) doc.model = model;
  if (nickname) doc.nickname = nickname;

  const batch = db.batch();
  const aref = db.collection("assets").doc(id);
  batch.set(aref, doc);
  batch.update(db.collection("customers").doc(customerId), {
    assets: FieldValue.arrayUnion(id),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  const summary: AssetSummary = {
    id,
    customerId,
    type,
    displayName: buildDisplayName({
      nickname: nickname || null,
      year,
      make: make || null,
      model: model || null,
    }),
    nickname: nickname || undefined,
    year,
    make: make || null,
    model: model || null,
  };

  return NextResponse.json({ id, asset: summary }, { status: 201 });
}
