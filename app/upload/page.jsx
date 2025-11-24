// app/upload/page.jsx
"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Database,
  AlertCircle,
  X,
} from "lucide-react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setUploadStatus(null);
        setUploadMessage("");
      } else {
        setUploadStatus("error");
        setUploadMessage("Please upload a CSV file only");
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile);
        setUploadStatus(null);
        setUploadMessage("");
      } else {
        setUploadStatus("error");
        setUploadMessage("Please upload a CSV file only");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("error");
      setUploadMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadStatus("success");
        setUploadMessage(
          `Successfully uploaded ${result.recordsInserted} records!`
        );

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        setUploadStatus("error");
        setUploadMessage(result.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage("Network error. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus(null);
    setUploadMessage("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto mb-8"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Upload Drilling Data
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Import CSV file to populate the database
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
              dragActive
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-700 bg-slate-800/30"
            } ${file ? "opacity-50" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <div className="text-center">
              <motion.div
                animate={{
                  scale: dragActive ? 1.1 : 1,
                  rotate: dragActive ? 5 : 0,
                }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center"
              >
                <Upload
                  className={`w-10 h-10 ${
                    dragActive ? "text-cyan-400" : "text-slate-400"
                  }`}
                />
              </motion.div>

              <h3 className="text-xl text-slate-200 mb-2 font-light">
                Drop your CSV file here
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                or click the button below to browse
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none"
              >
                Browse Files
              </button>

              <p className="text-slate-500 text-xs mt-4">
                Supported format: CSV (Max 100MB)
              </p>
            </div>
          </div>

          {/* Selected File Display */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6"
              >
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-200 font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    {!uploading && (
                      <button
                        onClick={removeFile}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {uploading && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">
                          Uploading...
                        </span>
                        <span className="text-xs text-cyan-400 font-medium">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          <AnimatePresence>
            {uploadStatus && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                {uploadStatus === "success" && (
                  <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-emerald-300 font-medium mb-1">
                        Upload Successful!
                      </h4>
                      <p className="text-emerald-200/70 text-sm">
                        {uploadMessage}
                      </p>
                      <p className="text-emerald-200/50 text-xs mt-2">
                        Redirecting to dashboard...
                      </p>
                    </div>
                  </div>
                )}

                {uploadStatus === "error" && (
                  <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-rose-300 font-medium mb-1">
                        Upload Failed
                      </h4>
                      <p className="text-rose-200/70 text-sm">
                        {uploadMessage}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Button */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleUpload}
              disabled={!file || uploading || uploadStatus === "success"}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-700 disabled:to-slate-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : uploadStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Uploaded
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload to Database
                </>
              )}
            </button>
          </div>

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-slate-300 font-medium mb-2">
                  CSV Format Requirements
                </h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>
                    • Required columns: YYYY/MM/DD, HH:MM:SS, Hole Depth, Bit
                    Depth, ROP, WOB, etc.
                  </li>
                  <li>• Date format: M/D/YYYY (e.g., 8/2/2021)</li>
                  <li>• Time format: H:MM:SS (e.g., 4:30:00)</li>
                  <li>• All numeric values should be decimal numbers</li>
                  <li>• File will be validated before upload</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}