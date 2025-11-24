// app/api/drilling-data/route.js
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper: Convert HTML date format (YYYY-MM-DD) to database format (DD/MM/YYYY)
function convertDateToDb(htmlDate) {
  if (!htmlDate) return null;
  const [year, month, day] = htmlDate.split("-");
  return `${parseInt(day)}/${parseInt(month)}/${year.slice(-2)}`;
}

// Helper: Convert database date (DD/MM/YYYY) to HTML format (YYYY-MM-DD)
function convertDateToHtml(dbDate) {
  if (!dbDate) return null;

  // If PostgreSQL returned Date object
  if (dbDate instanceof Date) {
    const year = dbDate.getFullYear();
    const month = String(dbDate.getMonth() + 1).padStart(2, "0");
    const day = String(dbDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // If still DD/MM/YY string
  const [day, month, year] = dbDate.split("/");
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  return `${normalizedYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

// Helper: Compare dates in DD/MM/YYYY format
function compareDates(date1, date2) {
  // Convert DD/MM/YYYY to comparable format
  const [d1, m1, y1] = date1.split("/").map((n) => parseInt(n));
  const [d2, m2, y2] = date2.split("/").map((n) => parseInt(n));

  const val1 = y1 * 10000 + m1 * 100 + d1;
  const val2 = y2 * 10000 + m2 * 100 + d2;

  return val1 - val2;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "500");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const startTime = searchParams.get("startTime");
    const endDate = searchParams.get("endDate");
    const endTime = searchParams.get("endTime");

    const normalizeTime = (t) => {
  if (!t) return null;
  return t.length === 5 ? `${t}:00` : t; 
};

const startTimeNormalized = normalizeTime(startTime);
const endTimeNormalized = normalizeTime(endTime);

    // Check if data exists
    const countResult = await sql`SELECT COUNT(*) as count FROM drilling_data`;
    const totalCount = parseInt(countResult[0].count);

    if (totalCount === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: null,
        dateRange: null,
        pagination: { limit, offset, hasMore: false, total: 0 },
        message: "Data not exist",
      });
    }

    // Get date range for picker
    const dateRangeResult = await sql`
      SELECT 
        MIN(to_date("YYYY/MM/DD", 'DD/MM/YY')) as min_date,
        MAX(to_date("YYYY/MM/DD", 'DD/MM/YY')) as max_date,
        MIN("HH:MM:SS") as min_time,
        MAX("HH:MM:SS") as max_time
      FROM drilling_data
    `;

    // Convert database date format to HTML format for date pickers
    const dateRange = dateRangeResult[0];
    if (dateRange.min_date && dateRange.max_date) {
      const formattedMin = convertDateToHtml(dateRange.min_date);
      const formattedMax = convertDateToHtml(dateRange.max_date);

      dateRange.display = `${formattedMin} → ${formattedMax}`;
      dateRange.min_date_html = formattedMin;
      dateRange.max_date_html = formattedMax;
    }

    // Base select clause
    const baseSelect = `
      SELECT
        id,
        "YYYY/MM/DD" as date_ymd,
        "HH:MM:SS" as time_hms,
        "Hole Depth (ft)" as hole_depth,
        "Bit Depth (ft)" as bit_depth,
        "ROP (ft/hr)" as rop,
        "WOB (klbs)" as wob,
        "Hookload (klbs)" as hookload,
        "Rotary speed (rpm)" as rotary_speed,
        "SPP (psi)" as spp,
        "Torque (klb-ft))" as torque,
        "Flow out (%)" as flow_out,
        "Flow in (gpm)" as flow_in,
        "Mud Volume (bbl)" as mud_volume,
        "Block Height (ft)" as block_height,
        "Pump 1 SPM (spm)" as pump1_spm,
        "Pump 1 Rate (gpm)" as pump1_rate,
        "Pump 2 SPM (spm)" as pump2_spm,
        "Pump 2 Rate (gpm)" as pump2_rate,
        created_at
      FROM drilling_data
    `;

    // Build WHERE clause
    let data;
    const dbStartDate = convertDateToDb(startDate);
    const dbEndDate = convertDateToDb(endDate);

    if (dbStartDate && dbEndDate && startTime && endTime) {
      // Date + Time filtering
      data = await sql`
        SELECT
          id,
          "YYYY/MM/DD" as date_ymd,
          "HH:MM:SS" as time_hms,
          "Hole Depth (ft)" as hole_depth,
          "Bit Depth (ft)" as bit_depth,
          "ROP (ft/hr)" as rop,
          "WOB (klbs)" as wob,
          "Hookload (klbs)" as hookload,
          "Rotary speed (rpm)" as rotary_speed,
          "SPP (psi)" as spp,
          "Torque (klb-ft))" as torque,
          "Flow out (%)" as flow_out,
          "Flow in (gpm)" as flow_in,
          "Mud Volume (bbl)" as mud_volume,
          "Block Height (ft)" as block_height,
          "Pump 1 SPM (spm)" as pump1_spm,
          "Pump 1 Rate (gpm)" as pump1_rate,
          "Pump 2 SPM (spm)" as pump2_spm,
          "Pump 2 Rate (gpm)" as pump2_rate,
          created_at
        FROM drilling_data
       WHERE 
(
  (
    to_date("YYYY/MM/DD", 'DD/MM/YY') = to_date(${dbStartDate}, 'DD/MM/YY')
    AND "HH:MM:SS" >= ${startTimeNormalized}
  ) OR (
    to_date("YYYY/MM/DD", 'DD/MM/YY') > to_date(${dbStartDate}, 'DD/MM/YY')
  )
)
AND
(
  (
    to_date("YYYY/MM/DD", 'DD/MM/YY') = to_date(${dbEndDate}, 'DD/MM/YY')
    AND "HH:MM:SS" <= ${endTimeNormalized}
  ) OR (
    to_date("YYYY/MM/DD", 'DD/MM/YY') < to_date(${dbEndDate}, 'DD/MM/YY')
  )
)


ORDER BY 
  to_date("YYYY/MM/DD", 'DD/MM/YY') ASC,
  "HH:MM:SS" ASC
LIMIT ${limit}
OFFSET ${offset}
      `;
    } else if (dbStartDate && dbEndDate) {
      // Date-only filtering
      data = await sql`
        SELECT
          id,
          "YYYY/MM/DD" as date_ymd,
          "HH:MM:SS" as time_hms,
          "Hole Depth (ft)" as hole_depth,
          "Bit Depth (ft)" as bit_depth,
          "ROP (ft/hr)" as rop,
          "WOB (klbs)" as wob,
          "Hookload (klbs)" as hookload,
          "Rotary speed (rpm)" as rotary_speed,
          "SPP (psi)" as spp,
          "Torque (klb-ft))" as torque,
          "Flow out (%)" as flow_out,
          "Flow in (gpm)" as flow_in,
          "Mud Volume (bbl)" as mud_volume,
          "Block Height (ft)" as block_height,
          "Pump 1 SPM (spm)" as pump1_spm,
          "Pump 1 Rate (gpm)" as pump1_rate,
          "Pump 2 SPM (spm)" as pump2_spm,
          "Pump 2 Rate (gpm)" as pump2_rate,
          created_at
        FROM drilling_data
        WHERE 
  to_date("YYYY/MM/DD", 'DD/MM/YY') 
    BETWEEN to_date(${dbStartDate}, 'DD/MM/YY') AND to_date(${dbEndDate}, 'DD/MM/YY')


        ORDER BY 
  to_date("YYYY/MM/DD", 'DD/MM/YY') ASC,
  "HH:MM:SS" ASC

        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      // No filter
      data = await sql`
        SELECT
          id,
          "YYYY/MM/DD" as date_ymd,
          "HH:MM:SS" as time_hms,
          "Hole Depth (ft)" as hole_depth,
          "Bit Depth (ft)" as bit_depth,
          "ROP (ft/hr)" as rop,
          "WOB (klbs)" as wob,
          "Hookload (klbs)" as hookload,
          "Rotary speed (rpm)" as rotary_speed,
          "SPP (psi)" as spp,
          "Torque (klb-ft))" as torque,
          "Flow out (%)" as flow_out,
          "Flow in (gpm)" as flow_in,
          "Mud Volume (bbl)" as mud_volume,
          "Block Height (ft)" as block_height,
          "Pump 1 SPM (spm)" as pump1_spm,
          "Pump 1 Rate (gpm)" as pump1_rate,
          "Pump 2 SPM (spm)" as pump2_spm,
          "Pump 2 Rate (gpm)" as pump2_rate,
          created_at
        FROM drilling_data
        ORDER BY id ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    // Compute statistics
    let statsQuery;
    if (dbStartDate && dbEndDate && startTime && endTime) {
      statsQuery = sql`
        SELECT
          COUNT(*) as total_records,
          MIN("YYYY/MM/DD") as start_date,
          MAX("YYYY/MM/DD") as end_date,
          AVG(CAST(NULLIF("ROP (ft/hr)", '') AS DECIMAL)) as avg_rop,
          AVG(CAST(NULLIF("WOB (klbs)", '') AS DECIMAL)) as avg_wob,
          AVG(CAST(NULLIF("Rotary speed (rpm)", '') AS DECIMAL)) as avg_rpm,
          MAX(CAST(NULLIF("Hole Depth (ft)", '') AS DECIMAL)) as max_hole_depth,
          MAX(CAST(NULLIF("Bit Depth (ft)", '') AS DECIMAL)) as max_bit_depth
        FROM drilling_data
       WHERE 
(
  (
    to_date("YYYY/MM/DD", 'DD/MM/YY') = to_date(${dbStartDate}, 'DD/MM/YY')
    AND "HH:MM:SS" >= ${startTimeNormalized}
  ) OR (
    to_date("YYYY/MM/DD", 'DD/MM/YY') > to_date(${dbStartDate}, 'DD/MM/YY')
  )
)
AND
(
  (
    to_date("YYYY/MM/DD", 'DD/MM/YY') = to_date(${dbEndDate}, 'DD/MM/YY')
    AND "HH:MM:SS" <= ${endTimeNormalized}
  ) OR (
    to_date("YYYY/MM/DD", 'DD/MM/YY') < to_date(${dbEndDate}, 'DD/MM/YY')
  )
)

      `;
    } else if (dbStartDate && dbEndDate) {
      statsQuery = sql`
        SELECT
          COUNT(*) as total_records,
          MIN("YYYY/MM/DD") as start_date,
          MAX("YYYY/MM/DD") as end_date,
          AVG(CAST(NULLIF("ROP (ft/hr)", '') AS DECIMAL)) as avg_rop,
          AVG(CAST(NULLIF("WOB (klbs)", '') AS DECIMAL)) as avg_wob,
          AVG(CAST(NULLIF("Rotary speed (rpm)", '') AS DECIMAL)) as avg_rpm,
          MAX(CAST(NULLIF("Hole Depth (ft)", '') AS DECIMAL)) as max_hole_depth,
          MAX(CAST(NULLIF("Bit Depth (ft)", '') AS DECIMAL)) as max_bit_depth
        FROM drilling_data
        WHERE 
  to_date("YYYY/MM/DD", 'DD/MM/YY') 
   BETWEEN to_date(${dbStartDate}, 'DD/MM/YY') AND to_date(${dbEndDate}, 'DD/MM/YY')


      `;
    } else {
      statsQuery = sql`
        SELECT
          COUNT(*) as total_records,
          MIN("YYYY/MM/DD") as start_date,
          MAX("YYYY/MM/DD") as end_date,
          AVG(CAST(NULLIF("ROP (ft/hr)", '') AS DECIMAL)) as avg_rop,
          AVG(CAST(NULLIF("WOB (klbs)", '') AS DECIMAL)) as avg_wob,
          AVG(CAST(NULLIF("Rotary speed (rpm)", '') AS DECIMAL)) as avg_rpm,
          MAX(CAST(NULLIF("Hole Depth (ft)", '') AS DECIMAL)) as max_hole_depth,
          MAX(CAST(NULLIF("Bit Depth (ft)", '') AS DECIMAL)) as max_bit_depth
        FROM drilling_data
      `;
    }

    const stats = await statsQuery;

    return NextResponse.json({
      success: true,
      data: data,
      stats: stats[0],
      dateRange: dateRange,
      pagination: {
        limit,
        offset,
        hasMore: data.length === limit,
        total: totalCount,
      },
    });
  } catch (error) {
    console.error("Data fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching drilling data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


