import React from "react";
import { Layers, Play, BarChart3, Activity, ArrowRight } from "lucide-react";

export default function HeroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            FORGE Viewer
          </span>
        </div>

        <a
          href="/dashboard"
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm border border-white/10 transition-all"
        >
          Open Dashboard
        </a>
      </nav>

      {/* Hero */}
      <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        
        {/* Header */}
        <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-6">
          <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-300 bg-clip-text text-transparent">
            Real-Time Drilling Data
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Visualization Dashboard
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-400 text-center max-w-2xl mx-auto mb-10">
          View historical drilling data, filter by time range, and playback operations step-by-step for analysis and understanding.
        </p>

        {/* CTA */}
        <div className="flex justify-center mb-20">
          <a
            href="/dashboard"
            className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-105 rounded-full text-lg font-semibold transition-all flex items-center gap-2"
          >
            Launch Viewer
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Layers className="w-6 h-6" />,
              title: "Data Filtering",
              desc: "Filter data by date and time with second-level precision."
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "Analytics",
              desc: "Visualize key drilling parameters like Depth, RPM, Torque, WOB, ROP and more."
            },
            {
              icon: <Play className="w-6 h-6" />,
              title: "Playback Controls",
              desc: "Play, pause, skip, and adjust playback speed for simulation mode."
            }
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 mb-4">
                {f.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-gray-500 py-6 text-sm border-t border-white/10">
        © {new Date().getFullYear()} FORGE Viewer — Experimental Use Only
      </footer>
    </div>
  );
}
