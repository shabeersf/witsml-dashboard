// app/dashboard/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  RefreshCw,
  Database,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  X,
  Layers,
  Activity,
  Filter,
  Upload,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dataLimit, setDataLimit] = useState(500);
  const [customLimit, setCustomLimit] = useState("500");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);

  const fetchData = async (
    limit = dataLimit,
    sDate = "",
    sTime = "",
    eDate = "",
    eTime = ""
  ) => {
    try {
      setLoading(true);
      let url = `/api/drilling-data?limit=${limit}`;

      if (sDate && eDate) {
        url += `&startDate=${sDate}&endDate=${eDate}`;
        if (sTime && eTime) {
          url += `&startTime=${normalizeTime(sTime)}&endTime=${normalizeTime(
            eTime
          )}`;
        }
      }
      const res = await fetch(url);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        setStats(result.stats);
        setDateRange(result.dateRange);
        setError(null);
        setCurrentIndex(0);
      } else {
        setError(result.message || "Failed to load data");
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeTime = (t) => {
    if (!t) return "";
    return t.length === 5 ? `${t}:00` : t;
  };

  // Auto-play simulation
  useEffect(() => {
    if (!isPlaying || data.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= data.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, data.length, playbackSpeed]);

  const currentData = data[currentIndex] || {};

  // Show last 60 seconds of data for better visibility
  const displayData = data.slice(
    Math.max(0, currentIndex - 60),
    currentIndex + 1
  );

  // Control handlers
  const handlePlayPause = () => {
    if (currentIndex >= data.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSkipForward = () => {
    setCurrentIndex((prev) => Math.min(prev + 10, data.length - 1));
  };

  const handleSkipBack = () => {
    setCurrentIndex((prev) => Math.max(prev - 10, 0));
  };

  const handleLimitChange = () => {
    const newLimit = parseInt(customLimit);
    if (newLimit >= 100 && newLimit <= 10000) {
      setDataLimit(newLimit);
      fetchData(newLimit, startDate, startTime, endDate, endTime);
    } else {
      alert("Please enter a limit between 100 and 10000");
    }
  };

  const handleDateFilter = () => {
    if (startDate && endDate) {
      fetchData(dataLimit, startDate, startTime, endDate, endTime);
      setShowFilters(false);
    } else {
      alert("Please select both start and end dates");
    }
  };

  const handleClearFilters = () => {
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    fetchData(dataLimit, "", "", "", "");
  };

  // Determine drilling status
  const isDrilling = () => {
    const rop = parseFloat(currentData.rop) || 0;
    const holeDepth = parseFloat(currentData.hole_depth) || 0;
    const bitDepth = parseFloat(currentData.bit_depth) || 0;
    return rop > 0 && Math.abs(holeDepth - bitDepth) <= 5;
  };

  /* ---------------------- LOADING SCREEN ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6"></div>
            <Activity className="w-8 h-8 text-cyan-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xl text-slate-300 font-light">
            Loading drilling data...
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Initializing real-time simulation
          </p>
        </motion.div>
      </div>
    );
  }

  /* ---------------------- NO DATA SCREEN ---------------------- */
  if (data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <Database className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl text-slate-200 mb-3 font-light">
              Data not exist
            </h2>
            <p className="text-slate-400 mb-6 text-sm leading-relaxed">
              {error ||
                "The database is empty or no records match your filters. Please check your filter settings or upload CSV data."}
            </p>
            <div className="flex flex-col gap-3">
              {(startDate || endDate || startTime || endTime) && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
              <Link
                href="/upload"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Upload className="w-4 h-4" />
                Upload CSV File
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-2 sm:p-4 lg:p-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-light bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  FORGE 56-32
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Real-Time Simulation
                </span>
                <span>|</span>
                <span>Utah Formation</span>
                {stats && (
                  <>
                    <span>|</span>
                    <span>
                      {parseInt(stats.total_records).toLocaleString()} Records
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-slate-300 font-medium transition-all text-xs sm:text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              <button
                onClick={() =>
                  fetchData(dataLimit, startDate, startTime, endDate, endTime)
                }
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-300 font-medium transition-all text-xs sm:text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FILTERS PANEL */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-slate-300 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Filter Options
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Data Limit
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customLimit}
                      onChange={(e) => setCustomLimit(e.target.value)}
                      className="flex-1 bg-slate-800/50 text-white text-sm px-3 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      placeholder="500"
                      min="100"
                      max="10000"
                    />
                    <button
                      onClick={handleLimitChange}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl text-cyan-300 text-sm font-medium transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800/50 text-white text-sm px-3 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="1"
                    className="w-full bg-slate-800/50 text-white text-sm px-3 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full bg-slate-800/50 text-white text-sm px-3 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="1"
                    className="w-full bg-slate-800/50 text-white text-sm px-3 py-2 rounded-xl border border-slate-700/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleDateFilter}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                  >
                    Apply Filter
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 text-sm font-medium rounded-xl transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {dateRange && (
                <div className="mt-3 text-xs text-slate-500">
                  <p>
                    Available date range: {dateRange.min_date_html} →{" "}
                    {dateRange.max_date_html}
                  </p>
                  {startDate && endDate && (
                    <p className="mt-1 text-cyan-400">
                      Filtering: {startDate} {startTime || "00:00:00"} →{" "}
                      {endDate} {endTime || "23:59:59"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYBACK CONTROLS */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-4 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleReset}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-300 transition-all"
              title="Reset"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkipBack}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-300 transition-all"
              title="Back 10s"
            >
              <SkipBack className="w-3 h-3" />
            </button>

            <button
              onClick={handlePlayPause}
              className={`p-3 rounded-xl font-semibold transition-all shadow-lg ${
                isPlaying
                  ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-500/20"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20"
              } text-white`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-300 transition-all"
              title="Forward 10s"
            >
              <SkipForward className="w-3 h-3" />
            </button>

            <div className="px-3 py-2 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                className="bg-transparent text-slate-300 text-xs focus:outline-none"
              >
                <option value="2000">0.5x</option>
                <option value="1000">1x</option>
                <option value="500">2x</option>
                <option value="250">4x</option>
              </select>
            </div>

            <div
              className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm ${
                isDrilling()
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/50"
              }`}
            >
              {isDrilling() ? "● Drilling" : "○ Off-Bottom"}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="text-right">
              <div className="text-cyan-400 font-mono text-xs sm:text-sm font-medium">
                {currentData.date_ymd} {currentData.time_hms}
              </div>
              <div className="text-slate-500 text-xs">
                {currentIndex + 1} / {data.length}
              </div>
            </div>
            <div className="flex-1 sm:w-48 bg-slate-800/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                animate={{
                  width: `${((currentIndex + 1) / data.length) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* LEFT SIDEBAR - METRICS */}
        <div className="xl:col-span-2 space-y-3">
          <MetricBox
            title="Hole Depth"
            value={currentData.hole_depth}
            unit="ft"
            color="from-blue-600 to-blue-800"
          />
          <MetricBox
            title="Bit Depth"
            value={currentData.bit_depth}
            unit="ft"
            color="from-blue-600 to-blue-800"
          />
          <MetricBox
            title="ROP"
            value={currentData.rop}
            unit="ft/hr"
            color="from-emerald-600 to-emerald-800"
          />
          <MetricBox
            title="WOB"
            value={currentData.wob}
            unit="klbs"
            color="from-purple-600 to-purple-800"
          />
          <MetricBox
            title="Hookload"
            value={currentData.hookload}
            unit="klbs"
            color="from-indigo-600 to-indigo-800"
          />
          <MetricBox
            title="Rotary Speed"
            value={currentData.rotary_speed}
            unit="rpm"
            color="from-orange-600 to-orange-800"
          />
          <MetricBox
            title="SPP"
            value={currentData.spp}
            unit="psi"
            color="from-cyan-600 to-cyan-800"
          />
          <MetricBox
            title="Torque"
            value={currentData.torque}
            unit="klb-ft"
            color="from-red-600 to-red-800"
          />
          <MetricBox
            title="Flow In"
            value={currentData.flow_in}
            unit="gpm"
            color="from-teal-600 to-teal-800"
          />
          <MetricBox
            title="Flow Out"
            value={currentData.flow_out}
            unit="%"
            color="from-teal-600 to-teal-800"
          />
          <MetricBox
            title="Mud Volume"
            value={currentData.mud_volume}
            unit="bbl"
            color="from-amber-600 to-amber-800"
          />
          <MetricBox
            title="Block Height"
            value={currentData.block_height}
            unit="ft"
            color="from-slate-600 to-slate-800"
          />
          <MetricBox
            title="Pump 1 SPM"
            value={currentData.pump1_spm}
            unit="spm"
            color="from-slate-600 to-slate-800"
          />
          <MetricBox
            title="Pump 1 Rate"
            value={currentData.pump1_rate}
            unit="gpm"
            color="from-slate-600 to-slate-800"
          />
          <MetricBox
            title="Pump 2 SPM"
            value={currentData.pump2_spm}
            unit="spm"
            color="from-slate-600 to-slate-800"
          />
          <MetricBox
            title="Pump 2 Rate"
            value={currentData.pump2_rate}
            unit="gpm"
            color="from-slate-600 to-slate-800"
          />
        </div>

        {/* RIGHT SIDE - CHARTS */}
        <div className="xl:col-span-10 grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
          <ChartPanel title="ROP" unit="ft/hr" color="#10b981">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 1500]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #10b981",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rop"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Torque" unit="klb-ft" color="#ef4444">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 150]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #ef4444",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="torque"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Rotary Speed" unit="rpm" color="#f97316">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 200]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #f97316",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rotary_speed"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Flow In" unit="gpm" color="#14b8a6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 1200]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #14b8a6",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="flow_in"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Flow Out" unit="%" color="#06b6d4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 150]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #06b6d4",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="flow_out"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="SPP" unit="psi" color="#0ea5e9">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 5500]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #0ea5e9",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="spp"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Weight on Bit" unit="klbs" color="#a855f7">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 300]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #a855f7",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="wob"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Hookload" unit="klbs" color="#6366f1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="time_hms"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.substring(0, 5)}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  domain={[0, 350]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #6366f1",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hookload"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      </div>
    </div>
  );
}

// Metric Box Component (No emojis)
function MetricBox({ title, value, unit, color }) {
  const numValue = parseFloat(value);
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${color} rounded-xl p-4 shadow-xl border border-white/10 backdrop-blur-sm`}
    >
      <div className="text-white/70 text-xs font-medium mb-2">{title}</div>
      <div className="text-white text-2xl lg:text-3xl font-bold mb-1">
        {!isNaN(numValue) ? numValue.toFixed(2) : "--"}
      </div>
      <div className="text-white/60 text-xs font-medium">{unit}</div>
    </motion.div>
  );
}

// Chart Panel Component (No emojis)
function ChartPanel({ title, unit, color, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 flex flex-col min-h-[200px] shadow-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded-lg">
          {unit}
        </span>
      </div>
      <div className="flex-1">{children}</div>
    </motion.div>
  );
}
