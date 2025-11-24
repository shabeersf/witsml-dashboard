// lib/db.js
import { neon } from "@neondatabase/serverless";

// if (!process.env.DATABASE_URL) {
//   throw new Error('DATABASE_URL is not defined');
// }

export const sql = neon(
  "postgresql://neondb_owner:npg_KUD5VwRctOg6@ep-twilight-sky-a4ytxj25-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
);

export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS drilling_data (
        id SERIAL PRIMARY KEY,
        "YYYY/MM/DD" VARCHAR(255),
        "HH:MM:SS" VARCHAR(255),
        "Hole Depth (ft)" VARCHAR(255),
        "Bit Depth (ft)" VARCHAR(255),
        "ROP (ft/hr)" VARCHAR(255),
        "WOB (klbs)" VARCHAR(255),
        "Hookload (klbs)" VARCHAR(255),
        "Rotary speed (rpm)" VARCHAR(255),
        "SPP (psi)" VARCHAR(255),
        "Torque (klb-ft))" VARCHAR(255),
        "Flow out (%)" VARCHAR(255),
        "Flow in (gpm)" VARCHAR(255),
        "Mud Volume (bbl)" VARCHAR(255),
        "Block Height (ft)" VARCHAR(255),
        "Pump 1 SPM (spm)" VARCHAR(255),
        "Pump 1 Rate (gpm)" VARCHAR(255),
        "Pump 2 SPM (spm)" VARCHAR(255),
        "Pump 2 Rate (gpm)" VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    return { success: true };
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}