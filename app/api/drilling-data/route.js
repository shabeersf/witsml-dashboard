// app/api/drilling-data/route.js
import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch latest drilling data
    const data = await sql`
      SELECT
        id,
        date,
        md_actc,
        md_bpos,
        md_bsts,
        md_chkp,
        md_dbtm,
        md_dbTV,
        md_dmea,
        md_dver,
        md_hkld,
        md_mfia,
        md_mfoa,
        md_mfop,
        md_mse,
        md_rop,
        md_spm1,
        md_spm2,
        md_sppa,
        md_sspeed,
        md_ssts,
        md_stkc,
        md_swob,
        md_tdrpm,
        md_tdtqa,
        md_tva,
        md_tvca
      FROM drilling_data
      ORDER BY date DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Compute statistics (summary)
    const stats = await sql`
      SELECT
        COUNT(*) AS total_records,
        MIN(date) AS start_date,
        MAX(date) AS end_date,
        AVG(md_rop) AS avg_rop,
        AVG(md_swob) AS avg_wob,
        AVG(md_tdrpm) AS avg_rpm
      FROM drilling_data
    `;

    return NextResponse.json({
      success: true,
      data: data.reverse(), // Oldest → newest
      stats: stats[0],
      pagination: {
        limit,
        offset,
        hasMore: data.length === limit,
      },
    });

  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { error: 'Error fetching drilling data' },
      { status: 500 }
    );
  }
}
