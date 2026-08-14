import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
initializeApp();
const db = getFirestore();
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const hashPin = (p: string, s: string) => scryptSync(p, s, 32).toString("hex");
export const createWorkspace = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  const { babyName, stage, date, displayName } = req.data;
  if (!babyName || !date || !displayName || !["pregnant", "born"].includes(stage)) {
    throw new HttpsError("invalid-argument", "가족 정보를 확인해주세요.");
  }
  const workspaceRef = db.collection("workspaces").doc();
  const batch = db.batch();
  batch.set(workspaceRef, {
    ownerUid: req.auth.uid,
    babyName,
    stage,
    dueDate: stage === "pregnant" ? date : null,
    birthDate: stage === "born" ? date : null,
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.set(workspaceRef.collection("members").doc(req.auth.uid), {
    role: "owner",
    displayName,
    color: "#EFCFD4",
    joinedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return { workspaceId: workspaceRef.id };
});
export const createInvite = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  const { workspaceId } = req.data;
  const member = await db
    .doc(`workspaces/${workspaceId}/members/${req.auth.uid}`)
    .get();
  if (member.data()?.role !== "owner")
    throw new HttpsError("permission-denied", "소유자만 초대할 수 있습니다.");
  const token = randomBytes(32).toString("base64url"),
    pin = String(Math.floor(100000 + Math.random() * 900000)),
    salt = randomBytes(16).toString("hex");
  const expiresAt = Timestamp.fromMillis(Date.now() + 86400000);
  await db
    .doc(`invites/${hashToken(token)}`)
    .set({
      workspaceId,
      pinSalt: salt,
      pinHash: hashPin(pin, salt),
      expiresAt,
      revokedAt: null,
      failedAttempts: 0,
      lockedUntil: null,
      createdBy: req.auth.uid,
    });
  return { token, pin, expiresAt: expiresAt.toDate().toISOString() };
});
export const joinWorkspace = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  const { token, pin, displayName } = req.data,
    ref = db.doc(`invites/${hashToken(token)}`),
    snap = await ref.get(),
    d = snap.data();
  if (!d || d.revokedAt || d.expiresAt.toMillis() < Date.now())
    throw new HttpsError("not-found", "초대 링크가 만료되었습니다.");
  if (d.lockedUntil?.toMillis() > Date.now())
    throw new HttpsError("resource-exhausted", "잠시 후 다시 시도해주세요.");
  const actual = Buffer.from(hashPin(pin, d.pinSalt), "hex"),
    expected = Buffer.from(d.pinHash, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    const failed = (d.failedAttempts || 0) + 1;
    await ref.update({
      failedAttempts: failed,
      lockedUntil:
        failed >= 5 ? Timestamp.fromMillis(Date.now() + 300000) : null,
    });
    throw new HttpsError("invalid-argument", "PIN이 올바르지 않습니다.");
  }
  await db
    .doc(`workspaces/${d.workspaceId}/members/${req.auth.uid}`)
    .set({
      role: "collaborator",
      displayName,
      color: "#D2E2D4",
      joinedAt: FieldValue.serverTimestamp(),
    });
  return { workspaceId: d.workspaceId };
});
const suggestion = z.object({
  title: z.string(),
  summary: z.string(),
  emotionalLine: z.string(),
  stickerIds: z.array(z.string()).min(3).max(6),
});
export const suggestRecord = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `부모가 입력한 사실만 사용하고 의료 판단, 새로운 사건·날짜·감정을 만들지 마세요. 따뜻하지만 과장되지 않은 한국어로 작성하세요. 원문: ${req.data.body}\n감정: ${req.data.emotion}\n허용 스티커: ${req.data.stickerIds.join(",")}`;
  const out = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          emotionalLine: { type: "string" },
          stickerIds: { type: "array", items: { type: "string" } },
        },
        required: ["title", "summary", "emotionalLine", "stickerIds"],
      },
    },
  });
  return suggestion.parse(JSON.parse(out.text || "{}"));
});
export const compactYjsUpdates = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  return { queued: true, recordId: req.data.recordId };
});
