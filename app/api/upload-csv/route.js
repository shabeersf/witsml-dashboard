// app/api/upload-csv/route.js
import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";
import Papa from "papaparse";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large files

export async function POST(req) {
  try {
    // Initialize database
    await initDatabase();

    const formData = await req.formData();
    const file = formData.get("file");
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" });
    }

    const text = await file.text();
    let inserted = 0;
    let skipped = 0;
    let errors = [];

    // Split into lines and find the header row
    const lines = text.split('\n');
    let headerLineIndex = -1;
    
    // Find the line that starts with "DATE"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('DATE,') || line.startsWith('DATE\t') || line.startsWith('"DATE"')) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: "Could not find DATE column header. Please ensure your CSV has a header row starting with DATE." 
      });
    }

    // Get everything from the header line onwards
    const csvData = lines.slice(headerLineIndex).join('\n');

    // Parse CSV with Papaparse
    const parseResult = await new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Remove BOM and normalize headers
          return header.replace(/\uFEFF/g, "").trim().toUpperCase();
        },
        complete: (results) => resolve(results),
        error: (error) => reject(error)
      });
    });

    // Filter out format description rows and invalid data
    const dataRows = parseResult.data.filter(row => {
      // Skip rows with format descriptions or empty dates
      if (!row.DATE || 
          row.DATE.includes('YYYY') || 
          row.DATE.includes('hh:mm:ss') ||
          row.DATE.trim() === '') {
        return false;
      }
      // Only include rows with valid date format (YYYY-MM-DD)
      return row.DATE.match(/^\d{4}-\d{2}-\d{2}/);
    });

    console.log(`Processing ${dataRows.length} valid rows from ${parseResult.data.length} total rows`);
    
    // Batch insert
    const batchSize = 100;
    for (let i = 0; i < dataRows.length; i += batchSize) {
      const batch = dataRows.slice(i, i + batchSize);
      
      if (batch.length === 0) continue;

      // Parse number helper
      const parseNumber = (val) => {
        if (!val || val === '' || val === '-9999' || val === -9999) return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      // Prepare batch insert with parameterized queries
      for (const row of batch) {
        console.log("row",row)
        try {
          await sql`
            INSERT INTO drilling_data (
              date, md_actc, md_bpos, md_bsts, md_chkp, md_dbtm, md_dbtv,
              md_dmea, md_dver, md_hkld, md_mfia, md_mfoa, md_mfop,
              md_mse, md_rop, md_spm1, md_spm2, md_sppa, md_sspeed,
              md_ssts, md_stkc, md_swob, md_tdrpm, md_tdtqa, md_tva, md_tvca
            )
            VALUES (
              ${row.DATE},
              ${parseNumber(row.MD_ACTC)},
              ${parseNumber(row.MD_BPOS)},
              ${parseNumber(row.MD_BSTS)},
              ${parseNumber(row.MD_CHKP)},
              ${parseNumber(row.MD_DBTM)},
              ${parseNumber(row.MD_DBTV)},
              ${parseNumber(row.MD_DMEA)},
              ${parseNumber(row.MD_DVER)},
              ${parseNumber(row.MD_HKLD)},
              ${parseNumber(row.MD_MFIA)},
              ${parseNumber(row.MD_MFOA)},
              ${parseNumber(row.MD_MFOP)},
              ${parseNumber(row.MD_MSE)},
              ${parseNumber(row.MD_ROP)},
              ${parseNumber(row.MD_SPM1)},
              ${parseNumber(row.MD_SPM2)},
              ${parseNumber(row.MD_SPPA)},
              ${parseNumber(row.MD_SSPEED)},
              ${parseNumber(row.MD_SSTS)},
              ${parseNumber(row.MD_STKC)},
              ${parseNumber(row.MD_SWOB)},
              ${parseNumber(row.MD_TDRPM)},
              ${parseNumber(row.MD_TDTQA)},
              ${parseNumber(row.MD_TVA)},
              ${parseNumber(row.MD_TVCA)}
            )
          `;
          inserted++;
        } catch (err) {
          console.error('Row insert error:', err.message);
          skipped++;
          if (errors.length < 5) {
            errors.push(`Row ${i + batch.indexOf(row)}: ${err.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      total: dataRows.length,
      message: `Successfully inserted ${inserted} rows${skipped > 0 ? `, skipped ${skipped} rows` : ''}`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Upload failed'
    });
  }
}