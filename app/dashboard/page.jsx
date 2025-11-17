// app/dashboard/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import {
  Activity,
  Gauge,
  Layers,
  Zap,
  TrendingUp,
  Database,
  RefreshCw,
  Droplet,
  Thermometer
} from 'lucide-react';

import { format } from 'date-fns';

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/drilling-data?limit=500');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        setStats(result.stats);
        setError(null);
      } else {
        setError('Failed to load data');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-play simulation
  useEffect(() => {
    if (data.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % data.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [data.length]);

  const currentData = data[currentIndex] || {};
  const displayData = data.slice(Math.max(0, currentIndex - 200), currentIndex + 1);

  /* ---------------------- LOADING SCREEN ---------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-300">Loading drilling data...</p>
        </div>
      </div>
    );
  }

  /* ---------------------- ERROR SCREEN ---------------------- */
  if (error || data.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Database className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-xl text-slate-300 mb-4">{error || 'No data available.'}</p>
          <a href="/upload" className="text-cyan-400 hover:text-cyan-300 font-semibold">
            Upload CSV →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-hidden">
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="mb-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            DEMO - Drilling Surface Parameters
          </h1>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 font-semibold transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* MAIN LAYOUT - Left Metrics + Right Charts */}
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
        
        {/* LEFT SIDEBAR - METRICS */}
        <div className="col-span-12 lg:col-span-3 space-y-3 overflow-y-auto">
          
          {/* Depth Metrics */}
          <MetricBox 
            title="Bit Depth" 
            value={currentData.md_dmea} 
            unit="m" 
            color="bg-gradient-to-br from-blue-600 to-blue-800"
          />
          
          <MetricBox 
            title="Hole Depth" 
            value={currentData.md_dver} 
            unit="m" 
            color="bg-gradient-to-br from-blue-600 to-blue-800"
          />

          {/* Hook Load & Block Position */}
          <MetricBox 
            title="Hook Load" 
            value={currentData.md_hkld} 
            unit="kN" 
            color="bg-gradient-to-br from-indigo-600 to-indigo-800"
          />
          
          <MetricBox 
            title="Block Position" 
            value={currentData.md_bpos} 
            unit="m" 
            color="bg-gradient-to-br from-indigo-600 to-indigo-800"
          />

          {/* Weight & ROP */}
          <MetricBox 
            title="Weight On Bit" 
            value={currentData.md_swob} 
            unit="kdaN" 
            color="bg-gradient-to-br from-purple-600 to-purple-800"
          />
          
          <MetricBox 
            title="ROP" 
            value={currentData.md_rop} 
            unit="m/hr" 
            color="bg-gradient-to-br from-green-600 to-green-800"
          />

          {/* Rotary & Torque */}
          <MetricBox 
            title="Rotary Speed" 
            value={currentData.md_tdrpm} 
            unit="rpm" 
            color="bg-gradient-to-br from-orange-600 to-orange-800"
          />
          
          <MetricBox 
            title="Torque" 
            value={currentData.md_tdtqa} 
            unit="N·m" 
            color="bg-gradient-to-br from-red-600 to-red-800"
          />

          {/* Mud Flow */}
          <MetricBox 
            title="Mud Flow In" 
            value={currentData.md_mfia} 
            unit="L/min" 
            color="bg-gradient-to-br from-teal-600 to-teal-800"
          />
          
          <MetricBox 
            title="Pump Pressure" 
            value={currentData.md_sppa} 
            unit="bar" 
            color="bg-gradient-to-br from-cyan-600 to-cyan-800"
          />

          {/* Strokes */}
          <MetricBox 
            title="Stroke 1" 
            value={currentData.md_spm1} 
            unit="spm" 
            color="bg-gradient-to-br from-slate-600 to-slate-800"
          />
          
          <MetricBox 
            title="Stroke 2" 
            value={currentData.md_spm2} 
            unit="spm" 
            color="bg-gradient-to-br from-slate-600 to-slate-800"
          />

          {/* Mud Flow Out */}
          <MetricBox 
            title="Mud Flow Out" 
            value={currentData.md_mfoa} 
            unit="L/min" 
            color="bg-gradient-to-br from-teal-600 to-teal-800"
          />

        </div>

        {/* RIGHT SIDE - CONTINUOUS CHARTS */}
        <div className="col-span-12 lg:col-span-9 bg-slate-800/30 backdrop-blur border border-cyan-500/20 rounded-xl p-4 overflow-hidden">
          
          <div className="h-full flex flex-col gap-4">
            
            {/* Top Row - 3 Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-1/3">
              
              {/* Hole Depth */}
              <ChartPanel title="Hole Depth" unit="m" color="#3b82f6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #3b82f6',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_dmea" 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              {/* Torque */}
              <ChartPanel title="Torque" unit="N·m" color="#ef4444">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #ef4444',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_tdtqa" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              {/* Mud Flow In */}
              <ChartPanel title="Mud Flow In" unit="L/min" color="#14b8a6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #14b8a6',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_mfia" 
                      stroke="#14b8a6" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            {/* Middle Row - 2 Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-1/3">
              
              {/* Rotary Speed */}
              <ChartPanel title="Rotary Speed" unit="rpm" color="#f97316">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #f97316',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_tdrpm" 
                      stroke="#f97316" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              {/* ROP */}
              <ChartPanel title="Rate of Penetration" unit="m/hr" color="#10b981">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #10b981',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_rop" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>
            </div>

            {/* Bottom Row - 2 Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-1/3">
              
              {/* Weight on Bit */}
              <ChartPanel title="Weight on Bit" unit="kdaN" color="#a855f7">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #a855f7',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_swob" 
                      stroke="#a855f7" 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartPanel>

              {/* Standpipe Pressure */}
              <ChartPanel title="Standpipe Pressure" unit="bar" color="#06b6d4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => format(new Date(v), 'HH:mm')} 
                    />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #06b6d4',
                        borderRadius: 8,
                        fontSize: 12
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="md_sppa" 
                      stroke="#06b6d4" 
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
      </div>

      {/* Time Indicator */}
      {currentData.date && (
        <div className="mt-4 text-center">
          <span className="text-cyan-400 font-mono text-sm">
            Current Time: {format(new Date(currentData.date), 'yyyy-MM-dd HH:mm:ss')}
          </span>
          <span className="text-slate-500 ml-4">
            ({currentIndex + 1} / {data.length})
          </span>
        </div>
      )}
    </div>
  );
}

// Metric Box Component
function MetricBox({ title, value, unit, color }) {
  return (
    <div className={`${color} rounded-lg p-4 shadow-lg border border-white/10`}>
      <div className="text-white/70 text-xs font-semibold mb-1">{title}</div>
      <div className="text-white text-2xl font-bold">
        {value !== null && value !== undefined ? Number(value).toFixed(2) : '--'}
      </div>
      <div className="text-white/60 text-xs mt-1">{unit}</div>
    </div>
  );
}

// Chart Panel Component
function ChartPanel({ title, unit, color, children }) {
  return (
    <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}