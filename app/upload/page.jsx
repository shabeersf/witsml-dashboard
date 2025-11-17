// app/upload/page.jsx
'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Database, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError("Please upload a CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const uploadCSV = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/upload-csv", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      setUploading(false);

      if (data.success) {
        setResult(data);
        setError(null);
      } else {
        setError(data.error || 'Upload failed');
        setResult(null);
      }
    } catch (err) {
      setUploading(false);
      setError(`Upload failed: ${err.message}`);
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-12 h-12 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Data Upload Center
            </h1>
          </div>
          <p className="text-slate-300 text-lg">Import MARMUL drilling data from CSV files</p>
        </motion.div>

        {/* Upload Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
            {/* File Input Area */}
            <div className="mb-8">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-cyan-500/50 rounded-xl cursor-pointer hover:border-cyan-400 transition-all bg-slate-900/50 hover:bg-slate-900/70"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-16 h-16 text-cyan-400 mb-4" />
                  <p className="mb-2 text-lg font-semibold text-slate-200">
                    {file ? file.name : 'Click to upload CSV file'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {file
                      ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`
                      : 'Supports files up to 50MB'}
                  </p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {/* Upload Button */}
            <button
              onClick={uploadCSV}
              disabled={!file || uploading}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Upload to Database
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-green-500/10 border border-green-500/30 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-300 mb-2">
                      Upload Successful!
                    </h3>
                    <div className="text-sm text-slate-300 space-y-1">
                      <p>Records inserted: <span className="font-bold text-green-400">{result.inserted}</span></p>
                      <p>Total processed: <span className="font-bold">{result.total}</span></p>
                      {result.skipped > 0 && (
                        <p className="text-yellow-400">Skipped: {result.skipped}</p>
                      )}
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-400">
                          <p className="font-semibold">Sample errors:</p>
                          {result.errors.map((err, i) => (
                            <p key={i}>• {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-red-500/10 border border-red-500/30 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-300 mb-1">Upload Failed</h3>
                    <p className="text-sm text-slate-300">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            {result && (
              <div className="mt-6 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  View Dashboard →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* CSV Format Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12"
        >
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-200 mb-3">Expected CSV Format (MARMUL Time-Based Data)</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-300 mb-2">Required Columns:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <span className="text-cyan-400">DATE</span> - YYYY-MM-DDThh:mm:ss format</li>
                      <li>• <span className="text-cyan-400">MD_ACTC</span> - Activity Code</li>
                      <li>• <span className="text-cyan-400">MD_BPOS</span> - Block Position</li>
                      <li>• <span className="text-cyan-400">MD_DMEA</span> - Depth Measured</li>
                      <li>• <span className="text-cyan-400">MD_ROP</span> - Rate of Penetration</li>
                      <li>• <span className="text-cyan-400">MD_SWOB</span> - Surface Weight on Bit</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300 mb-2">Additional Columns:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• <span className="text-cyan-400">MD_TDRPM</span> - Top Drive RPM</li>
                      <li>• <span className="text-cyan-400">MD_TDTQA</span> - Top Drive Torque</li>
                      <li>• <span className="text-cyan-400">MD_SPPA</span> - Standpipe Pressure</li>
                      <li>• <span className="text-cyan-400">MD_MFIA</span> - Mud Flow In</li>
                      <li>• <span className="text-cyan-400">MD_MSE</span> - Mechanical Specific Energy</li>
                      <li>• Plus 15+ other drilling parameters</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-slate-900/50 rounded text-xs">
                  <p className="text-slate-400">
                    <span className="text-yellow-400 font-semibold">Note:</span> Empty values or <code className="text-cyan-400">-9999</code> will be stored as NULL. 
                    File headers should start from line with "DATE" column.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: 'CSV Format', text: 'MARMUL time-based drilling data' },
            { icon: Database, title: 'Neon DB', text: 'Serverless PostgreSQL storage' },
            { icon: CheckCircle, title: 'Auto-Process', text: 'Automatic data validation' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6 text-center"
            >
              <item.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-200 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}