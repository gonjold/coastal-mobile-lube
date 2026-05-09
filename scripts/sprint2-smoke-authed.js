#!/usr/bin/env node
/**
 * WO-FM-2-EDIT runtime smoke. Mints a session cookie for a test "owner"
 * role user, then runs the lock-test matrix against the new field routes:
 *   - non-finalized booking: PATCH/POST/DELETE all succeed
 *   - finalized booking:    customer/asset/services updates 4xx; photos still 200
 *
 * Usage: BASE=http://localhost:3777 node scripts/sprint2-smoke-authed.js
 */
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const SA_PATH = "/Users/jgsystems/.coastal-firebase-admin.json";
const sa = require(SA_PATH);
const ENV_LOCAL = fs.readFileSync(
  path.resolve(__dirname, "../.env.local"),
  "utf8",
);
function envValue(key) {
  const m = ENV_LOCAL.match(new RegExp("^" + key + "=(.+)$", "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "") : null;
}
const API_KEY = envValue("NEXT_PUBLIC_FIREBASE_API_KEY");
const BASE = process.env.BASE || "http://localhost:3777";

const CAND = process.env.CAND || "33bHeF1UIJn2MA9bJIq6";
const FIN = process.env.FIN || "1rTgrlFOWZ4qase19G5G";

if (!API_KEY) {
  console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa) });

const TEST_UID = "wo-fm-2-smoke-uid";
const TEST_EMAIL = "wo-fm-2-smoke@example.com";

function box(title) {
  console.log("\n=== " + title + " ===");
}

async function ensureUser() {
  try {
    await admin.auth().getUser(TEST_UID);
  } catch {
    await admin.auth().createUser({
      uid: TEST_UID,
      email: TEST_EMAIL,
      emailVerified: true,
      displayName: "WO-FM-2 smoke",
    });
  }
  await admin.auth().setCustomUserClaims(TEST_UID, { role: "owner" });
}

async function mintIdToken() {
  await ensureUser();
  const customToken = await admin
    .auth()
    .createCustomToken(TEST_UID, { role: "owner" });
  const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`;
  const res = await fetch(exchangeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  });
  const json = await res.json();
  if (!res.ok || !json.idToken) {
    throw new Error("Token exchange failed: " + JSON.stringify(json));
  }
  return json.idToken;
}

async function loginForCookie(idToken) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (!res.ok || !setCookie) {
    throw new Error(
      "Login failed: " + res.status + " " + (await res.text()),
    );
  }
  const m = setCookie.match(/__session=([^;]+)/);
  if (!m) throw new Error("No __session cookie returned");
  return m[1];
}

async function call(cookie, method, urlPath, body) {
  const res = await fetch(BASE + urlPath, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: `__session=${cookie}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  console.log(`${method} ${urlPath} → HTTP ${res.status}`);
  console.log("  ", JSON.stringify(parsed));
  return { status: res.status, body: parsed };
}

(async () => {
  try {
    console.log("BASE =", BASE);
    console.log("CAND =", CAND, "(non-finalized)");
    console.log("FIN  =", FIN, "(finalized)");

    const idToken = await mintIdToken();
    const cookie = await loginForCookie(idToken);
    console.log("Got __session cookie len=" + cookie.length);

    box("D1: PATCH customer (non-finalized)");
    const beforeBookingSnap = await admin
      .firestore()
      .collection("bookings")
      .doc(CAND)
      .get();
    const beforeBooking = beforeBookingSnap.data() || {};
    const origName = beforeBooking.name ?? beforeBooking.customerName ?? "";
    const origPhone =
      beforeBooking.phone ?? beforeBooking.customerPhone ?? "";
    const origEmail =
      beforeBooking.email ?? beforeBooking.customerEmail ?? "";
    const origAddr = beforeBooking.address ?? "";
    console.log("baseline:", { origName, origPhone, origEmail, origAddr });

    await call(cookie, "PATCH", `/api/field/jobs/${CAND}/customer`, {
      name: origName + " ★",
      phone: (origPhone || "5559876543").replace(/\D/g, "").slice(0, 10),
      email: origEmail || "smoke@example.com",
      address: origAddr || "100 Smoke Test Way",
    });

    const afterBooking = (
      await admin.firestore().collection("bookings").doc(CAND).get()
    ).data();
    console.log("after booking name:", afterBooking.name, "phone:", afterBooking.phone);

    // Restore baseline so we don't leave the booking dirty
    await admin
      .firestore()
      .collection("bookings")
      .doc(CAND)
      .update({
        name: origName,
        customerName: origName,
        phone: origPhone,
        customerPhone: origPhone,
        email: origEmail,
        customerEmail: origEmail,
        address: origAddr,
      });
    console.log("restored");

    box("D2: GET asset (non-finalized)");
    await call(cookie, "GET", `/api/field/jobs/${CAND}/asset`);

    box("D3: POST + DELETE service (non-finalized)");
    const addRes = await call(
      cookie,
      "POST",
      `/api/field/jobs/${CAND}/services`,
      {
        description: "WO-FM-2 smoke test item",
        qty: 1,
        unitPrice: 0.01,
        taxable: false,
      },
    );
    const newId = addRes.body && addRes.body.lineItem && addRes.body.lineItem.id;
    if (newId) {
      await call(
        cookie,
        "DELETE",
        `/api/field/jobs/${CAND}/services/${encodeURIComponent(newId)}`,
      );
    } else {
      console.log("WARN: no lineItem returned, skipping DELETE");
    }

    box("D5: POST photo (FAKE Cloudinary URL — server-side accept check)");
    const fakeUrl =
      "https://res.cloudinary.com/dgcdcqjrz/image/upload/v1/wo-fm-2-smoke.jpg";
    const photoRes = await call(
      cookie,
      "POST",
      `/api/field/jobs/${CAND}/photos`,
      {
        secure_url: fakeUrl,
        public_id: "wo-fm-2-smoke",
      },
    );
    if (photoRes.status === 200) {
      // Read-back: confirm photos[] contains the new entry, then strip it
      const fresh = (
        await admin.firestore().collection("bookings").doc(CAND).get()
      ).data();
      const photos = (fresh.photos || []).filter(
        (p) => p.publicId === "wo-fm-2-smoke",
      );
      console.log("read-back photos[publicId=wo-fm-2-smoke] count:", photos.length);
      const cleaned = (fresh.photos || []).filter(
        (p) => p.publicId !== "wo-fm-2-smoke",
      );
      await admin
        .firestore()
        .collection("bookings")
        .doc(CAND)
        .update({ photos: cleaned });
      console.log("smoke photo entry removed");
    }

    box("LOCK TEST: finalized booking — customer/asset/services blocked, photos OK");
    if (FIN === "none") {
      console.log("No finalized booking available — skipping lock test");
    } else {
      // Also synthesize a finalized state: confirm test booking really has invoiceId
      const finBefore = (
        await admin.firestore().collection("bookings").doc(FIN).get()
      ).data();
      console.log("FIN.invoiceId =", finBefore?.invoiceId ?? "(none)");

      await call(cookie, "PATCH", `/api/field/jobs/${FIN}/customer`, {
        name: "Locked attempt",
        phone: "5550000000",
      });
      await call(cookie, "PATCH", `/api/field/jobs/${FIN}/asset`, {
        mode: "edit",
        patch: { make: "ShouldFail" },
      });
      await call(cookie, "POST", `/api/field/jobs/${FIN}/services`, {
        description: "Locked attempt",
        qty: 1,
        unitPrice: 1,
        taxable: false,
      });
      const photoRes2 = await call(
        cookie,
        "POST",
        `/api/field/jobs/${FIN}/photos`,
        {
          secure_url:
            "https://res.cloudinary.com/dgcdcqjrz/image/upload/v1/wo-fm-2-locked-photo.jpg",
          public_id: "wo-fm-2-locked-photo",
        },
      );
      if (photoRes2.status === 200) {
        const fresh = (
          await admin.firestore().collection("bookings").doc(FIN).get()
        ).data();
        const cleaned = (fresh.photos || []).filter(
          (p) => p.publicId !== "wo-fm-2-locked-photo",
        );
        await admin
          .firestore()
          .collection("bookings")
          .doc(FIN)
          .update({ photos: cleaned });
        console.log("locked-photo smoke entry removed");
      }
    }

    box("DONE");
    process.exit(0);
  } catch (err) {
    console.error("FATAL:", err);
    process.exit(1);
  }
})();
