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
    date TIMESTAMPTZ NOT NULL,
    md_actc DECIMAL,
    md_bpos DECIMAL,
    md_bsts DECIMAL,
    md_chkp DECIMAL,
    md_dbtm DECIMAL,
    md_dbTV DECIMAL,
    md_dmea DECIMAL,
    md_dver DECIMAL,
    md_hkld DECIMAL,
    md_mfia DECIMAL,
    md_mfoa DECIMAL,
    md_mfop DECIMAL,
    md_mse DECIMAL,
    md_rop DECIMAL,
    md_spm1 DECIMAL,
    md_spm2 DECIMAL,
    md_sppa DECIMAL,
    md_sspeed DECIMAL,
    md_ssts DECIMAL,
    md_stkc DECIMAL,
    md_swob DECIMAL,
    md_tdrpm DECIMAL,
    md_tdtqa DECIMAL,
    md_tva DECIMAL,
    md_tvca DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

    return { success: true };
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
