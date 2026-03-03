import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import ShorVisualizer from './ShorVisualizer';
import QuantumLogistics from './QuantumLogistics';
import QuantumMaze from './QuantumMaze';
import { ShieldAlert, Map, Target, Zap } from 'lucide-react';

export default function App() {
  const location = useLocation();

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}>
        <Icon size={20} />
        <span className="hidden md:inline text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* Route Content */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shor" element={<ShorVisualizer />} />
        <Route path="/qaoa" element={<QuantumLogistics />} />
        <Route path="/grover" element={<QuantumMaze />} />
      </Routes>

      {/* Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] md:w-auto">
        <nav className="bg-slate-950/80 backdrop-blur-xl border border-slate-700 p-2 rounded-full flex justify-between md:justify-center gap-1 md:gap-2 shadow-2xl">
          <NavItem to="/shor" icon={ShieldAlert} label="Shor (Security)" />
          <NavItem to="/qaoa" icon={Map} label="QAOA (Logistics)" />
          <NavItem to="/grover" icon={Target} label="Grover (Search)" />
        </nav>
      </div>
    </div>
  );
}

const Home = () => (
  <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
    <div className="p-6 bg-cyan-500/10 rounded-full mb-6 border border-cyan-500/20 animate-pulse">
      <Zap size={64} className="text-cyan-400" />
    </div>
    <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
      QUANTUM ALGORITHMS
    </h1>
    <p className="text-slate-400 max-w-lg mx-auto">
      ระบบสาธิตเปรียบเทียบประสิทธิภาพระหว่าง Classical Computer และ Quantum Computer
    </p>
    <div className="mt-8 text-sm text-slate-500 animate-bounce">
      ↓ เลือกเมนูด้านล่างเพื่อเริ่มต้น ↓
    </div>
  </div>
);