// app/api/upload-csv/route.js
import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for large files

// Helper: Convert date from M/D/YYYY to DD/MM/YY format for database
function convertDateToDb(dateStr) {
  if (!dateStr) return null;
  
  try {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    // Convert to DD/MM/YY format
    const yearShort = year.toString().slice(-2);
    return `${day}/${month}/${yearShort}`;
  } catch (error) {
    return null;
  }
}

// Helper: Parse CSV line
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { success: false, error: "Only CSV files are allowed" },
        { status: 400 }
      );
    }

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: "CSV file is empty or invalid" },
        { status: 400 }
      );
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const expectedColumns = [
      "YYYY/MM/DD",
      "HH:MM:SS",
      "Hole Depth (ft)",
      "Bit Depth (ft)",
      "ROP (ft/hr)",
      "WOB (klbs)",
      "Hookload (klbs)",
      "Rotary speed (rpm)",
      "SPP (psi)",
      "Torque (klb-ft))",
      "Flow out (%)",
      "Flow in (gpm)",
      "Mud Volume (bbl)",
      "Block Height (ft)",
      "Pump 1 SPM (spm)",
      "Pump 1 Rate (gpm)",
      "Pump 2 SPM (spm)",
      "Pump 2 Rate (gpm)",
    ];

    // Validate header
    const headerLower = header.map((h) => h.toLowerCase().trim());
    const expectedLower = expectedColumns.map((e) => e.toLowerCase());
    
    for (let i = 0; i < expectedLower.length; i++) {
      if (!headerLower.includes(expectedLower[i])) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required column: ${expectedColumns[i]}`,
          },
          { status: 400 }
        );
      }
    }

    // Clear existing data
    console.log("Clearing existing data...");
    await sql`DELETE FROM drilling_data`;

    // Parse and insert data in batches
    const batchSize = 1000;
    let recordsInserted = 0;
    let batch = [];

    console.log(`Processing ${lines.length - 1} rows...`);

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      if (values.length !== expectedColumns.length) {
        console.warn(`Skipping row ${i}: Invalid number of columns`);
        continue;
      }

      // Convert date format
      const dbDate = convertDateToDb(values[0]);
      if (!dbDate) {
        console.warn(`Skipping row ${i}: Invalid date format`);
        continue;
      }

      batch.push({
        date: dbDate,
        time: values[1] || "",
        hole_depth: values[2] || "",
        bit_depth: values[3] || "",
        rop: values[4] || "",
        wob: values[5] || "",
        hookload: values[6] || "",
        rotary_speed: values[7] || "",
        spp: values[8] || "",
        torque: values[9] || "",
        flow_out: values[10] || "",
        flow_in: values[11] || "",
        mud_volume: values[12] || "",
        block_height: values[13] || "",
        pump1_spm: values[14] || "",
        pump1_rate: values[15] || "",
        pump2_spm: values[16] || "",
        pump2_rate: values[17] || "",
      });

      // Insert batch when it reaches the size limit
      if (batch.length >= batchSize) {
        await insertBatch(batch);
        recordsInserted += batch.length;
        batch = [];
        console.log(`Inserted ${recordsInserted} records...`);
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      await insertBatch(batch);
      recordsInserted += batch.length;
    }

    console.log(`Total records inserted: ${recordsInserted}`);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      recordsInserted,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process CSV file",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to insert a batch of records
async function insertBatch(batch) {
  const values = batch.map((record) => ({
    date_ymd: record.date,
    time_hms: record.time,
    hole_depth: record.hole_depth,
    bit_depth: record.bit_depth,
    rop: record.rop,
    wob: record.wob,
    hookload: record.hookload,
    rotary_speed: record.rotary_speed,
    spp: record.spp,
    torque: record.torque,
    flow_out: record.flow_out,
    flow_in: record.flow_in,
    mud_volume: record.mud_volume,
    block_height: record.block_height,
    pump1_spm: record.pump1_spm,
    pump1_rate: record.pump1_rate,
    pump2_spm: record.pump2_spm,
    pump2_rate: record.pump2_rate,
  }));

  // Build VALUES clause
  const valuesClause = values
    .map(
      (_, idx) => `(
      $${idx * 18 + 1}, $${idx * 18 + 2}, $${idx * 18 + 3}, $${idx * 18 + 4},
      $${idx * 18 + 5}, $${idx * 18 + 6}, $${idx * 18 + 7}, $${idx * 18 + 8},
      $${idx * 18 + 9}, $${idx * 18 + 10}, $${idx * 18 + 11}, $${idx * 18 + 12},
      $${idx * 18 + 13}, $${idx * 18 + 14}, $${idx * 18 + 15}, $${idx * 18 + 16},
      $${idx * 18 + 17}, $${idx * 18 + 18}
    )`
    )
    .join(", ");

  const flatValues = values.flatMap((v) => [
    v.date_ymd,
    v.time_hms,
    v.hole_depth,
    v.bit_depth,
    v.rop,
    v.wob,
    v.hookload,
    v.rotary_speed,
    v.spp,
    v.torque,
    v.flow_out,
    v.flow_in,
    v.mud_volume,
    v.block_height,
    v.pump1_spm,
    v.pump1_rate,
    v.pump2_spm,
    v.pump2_rate,
  ]);

  await sql.query(
    `INSERT INTO drilling_data (
      "YYYY/MM/DD", "HH:MM:SS", "Hole Depth (ft)", "Bit Depth (ft)",
      "ROP (ft/hr)", "WOB (klbs)", "Hookload (klbs)", "Rotary speed (rpm)",
      "SPP (psi)", "Torque (klb-ft))", "Flow out (%)", "Flow in (gpm)",
      "Mud Volume (bbl)", "Block Height (ft)", "Pump 1 SPM (spm)", "Pump 1 Rate (gpm)",
      "Pump 2 SPM (spm)", "Pump 2 Rate (gpm)"
    ) VALUES ${valuesClause}`,
    flatValues
  );
}