#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const parseDotEnv = (content) => {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
};

const loadEnvFromFile = () => {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const parsed = parseDotEnv(readFileSync(envPath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const toDate = (dateString) => {
  if (!datePattern.test(dateString)) {
    throw new Error(`Invalid date '${dateString}'. Use YYYY-MM-DD.`);
  }

  return new Date(`${dateString}T00:00:00Z`);
};

const listDatesInRange = (startDate, endDate) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (start > end) {
    throw new Error("start date must be <= end date");
  }

  const dates = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
};

const main = async () => {
  loadEnvFromFile();

  const [startDate = "2026-02-10", endDate = "2026-02-17", ...reasonParts] = process.argv.slice(2);
  const reason = reasonParts.join(" ").trim() || "One-time break";

  const required = ["FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required env var: ${key}`);
    }
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          })
        });

  const db = getFirestore(app);
  const dates = listDatesInRange(startDate, endDate);
  const now = new Date().toISOString();
  const batch = db.batch();

  for (const date of dates) {
    const ref = db.collection("holidays").doc(date);
    batch.set(
      ref,
      {
        date,
        reason,
        updatedAt: now,
        createdAt: now
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`Saved ${dates.length} holidays (${dates[0]} to ${dates[dates.length - 1]}) with reason: ${reason}`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to set holiday range: ${message}`);
  process.exit(1);
});
