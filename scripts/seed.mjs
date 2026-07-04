#!/usr/bin/env node
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envFile.split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const DAY_MAP = {
  "1": "Monday", "2": "Tuesday", "3": "Wednesday",
  "4": "Thursday", "5": "Friday", "6": "Saturday",
};

// Load timetable.json
const raw = readFileSync(new URL("../timetable.json", import.meta.url), "utf8");
const data = JSON.parse(raw);
console.log(`📂 ${data.length} records loaded from timetable.json`);

const rows = data.map((item) => ({
  code: item.jik_cd,
  name: (item.kamoku_name_eng || item.kamoku_name || "Unknown").trim(),
  credits: item.tani_su ?? 0,
  campus: ["Toyosu", "Omiya"].includes(item.kosya_kbn_name_eng) ? item.kosya_kbn_name_eng : null,
  day_of_week: DAY_MAP[String(item.yobi_cd)] ?? null,
  period: item.jigen_cd && String(item.jigen_cd) !== "9" ? Number(item.jigen_cd) : null,
  koma_su: item.koma_su ?? 1,
  description: item.description ?? null,
  learning_goals: item.learning_goals ?? [],
  prerequisites: item.prerequisites ?? [],
  assessment: item.assessment ?? null,
}));

// Delete all existing courses
console.log("🗑  Clearing existing courses...");
const { error: deleteError } = await supabase
  .from("courses")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");

if (deleteError) {
  console.error("❌ Delete failed:", deleteError.message);
  process.exit(1);
}

// Insert in batches of 100
const BATCH = 100;
let inserted = 0;

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);

  let { error } = await supabase.from("courses").insert(batch);

  // If koma_su column doesn't exist yet, retry without it
  if (error?.message?.includes("koma_su")) {
    console.log("\n⚠️  koma_su column missing — add it in Supabase SQL Editor:");
    console.log("   ALTER TABLE courses ADD COLUMN IF NOT EXISTS koma_su int DEFAULT 1;");
    const batchNoKoma = batch.map(({ koma_su, ...rest }) => rest);
    ({ error } = await supabase.from("courses").insert(batchNoKoma));
  }

  if (error) {
    console.error(`\n❌ Insert failed at batch ${i}:`, error.message);
    process.exit(1);
  }

  inserted += batch.length;
  process.stdout.write(`\r✅ ${inserted}/${rows.length} inserted`);
}

console.log(`\n🎉 Done! ${inserted} courses seeded successfully.`);
