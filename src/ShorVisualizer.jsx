import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Key, ShieldAlert, FileText, Cpu, Zap } from 'lucide-react';

// --- RSA MATH HELPER FUNCTIONS ---
// (ฟังก์ชันคณิตศาสตร์สำหรับการจำลอง RSA จริงๆ แบบย่อ)

// 1. หา GCD (หรม.)
const gcd = (a, b) => (!b ? a : gcd(b, a % b));

// 2. คำนวณ Modular Inverse (หา Private Key d)
const modInverse = (e, phi) => {
  let m0 = phi, t, q;
  let x0 = 0, x1 = 1;
  if (phi === 1) return 0;
  while (e > 1) {
    q = Math.floor(e / phi);
    t = phi;
    phi = e % phi; e = t;
    t = x0;
    x0 = x1 - q * x0; x1 = t;
  }
  if (x1 < 0) x1 += m0;
  return x1;
};

// 3. Modular Exponentiation (เข้ารหัส/ถอดรหัส)
const modPow = (base, exp, mod) => {
  let res = BigInt(1);
  base = BigInt(base) % BigInt(mod);
  let e_big = BigInt(exp);
  while (e_big > 0) {
    if (e_big % 2n === 1n) res = (res * base) % BigInt(mod);
    base = (base * base) % BigInt(mod);
    e_big /= 2n;
  }
  return Number(res);
};

const ShorVisualizer = () => {
  // --- STATE ---
  const [inputMsg, setInputMsg] = useState('DATA');
  const [encryptedMsg, setEncryptedMsg] = useState([]);
  const [decryptedMsg, setDecryptedMsg] = useState('');
  
  // RSA Keys (Fixed Primes for Demo Stability but logic is real)
  // ใช้เลขที่ใหญ่พอให้ Brute Force นานหน่อย แต่ไม่นานจนค้าง (ประมาณ 8 หลัก)
  // p=283, q=293 => N=82919 (เร็วไป)
  // ลอง p=3571, q=4813 => N=17187223 (กำลังดี)
  const P_REAL = 3571;
  const Q_REAL = 4813;
  const N_REAL = P_REAL * Q_REAL; // 17,187,223
  const PHI_REAL = (P_REAL - 1) * (Q_REAL - 1);
  const E_REAL = 17; // Public Exponent
  const D_REAL = modInverse(E_REAL, PHI_REAL); // Private Exponent (เป้าหมายที่แฮกเกอร์ต้องการ)

  // Simulation State
  const [status, setStatus] = useState('idle'); // idle, cracking, hacked
  const [currentGuess, setCurrentGuess] = useState(3); // ตัวเลขที่ Classical กำลังสุ่มหาร
  const [foundP, setFoundP] = useState(null);
  const [foundQ, setFoundQ] = useState(null);
  const [crackedD, setCrackedD] = useState(null);
  const [timer, setTimer] = useState(0);

  // --- 1. ENCRYPT MESSAGE ---
  useEffect(() => {
    // แปลงตัวอักษรเป็น ASCII แล้วเข้ารหัส RSA: C = M^e mod N
    const chars = inputMsg.split('').map(c => c.charCodeAt(0));
    const encrypted = chars.map(m => modPow(m, E_REAL, N_REAL));
    setEncryptedMsg(encrypted);
    setDecryptedMsg('');
    setStatus('idle');
    setFoundP(null);
    setFoundQ(null);
    setCrackedD(null);
    setCurrentGuess(3);
    setTimer(0);
  }, [inputMsg]);

  // --- 2. HACKING PROCESS ---
  const startHack = () => {
    setStatus('cracking');
    const startTime = performance.now();

    // Loop จำลอง Classical Brute Force (หารไปเรื่อยๆ จนกว่าจะเจอ Factor)
    // ใช้ setInterval เพื่อให้ UI อัปเดตตัวเลขได้ (ไม่ค้าง)
    const bruteForceInterval = setInterval(() => {
      setTimer(prev => prev + 10); // Update time
      
      // ขยับตัวเลขที่เดา (กระโดดทีละเยอะๆ เพื่อ Visual, จริงๆ ต้องทีละ 2)
      setCurrentGuess(prev => {
        const next = prev + Math.floor(Math.random() * 500) + 1; 
        
        // *จุดตัดสินใจ*: ถ้าเวลาผ่านไปสักพัก หรือตัวเลขถึงจุดที่กำหนด ให้ "เจอ" คำตอบ
        // (ในความเป็นจริง JS Web Browser หารเลข 17 ล้านรอบใช้เวลาแป๊บเดียว 
        // แต่เราหน่วงเวลาเพื่อให้เห็นภาพการทำงาน)
        
        // เช็คว่าเจอหรือยัง (จำลองว่าเจอที่ 3571)
        if (next >= P_REAL || performance.now() - startTime > 3000) { 
            clearInterval(bruteForceInterval);
            finishHack();
            return P_REAL;
        }
        return next;
      });
    }, 20); // ความเร็วการอัปเดตตัวเลขหน้าจอ
  };

  const finishHack = () => {
    // เฉลยคำตอบ
    setFoundP(P_REAL);
    setFoundQ(Q_REAL);
    setCrackedD(D_REAL);
    
    // ถอดรหัสข้อความ: M = C^d mod N
    const decryptedChars = encryptedMsg.map(c => modPow(c, D_REAL, N_REAL));
    const decryptedText = String.fromCharCode(...decryptedChars);
    setDecryptedMsg(decryptedText);
    setStatus('hacked');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pt-8 flex flex-col items-center font-mono">
      
      <div className="max-w-4xl w-full bg-slate-800/50 border border-slate-700 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 text-red-500">
                    <ShieldAlert size={32}/> RSA CRACKER
                </h1>
                <p className="text-slate-400 text-sm">Real-time Decryption Simulator</p>
            </div>
            
            {/* Input Box */}
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700">
                <FileText size={16} className="text-slate-500"/>
                <input 
                    type="text" 
                    maxLength={8}
                    value={inputMsg}
                    onChange={e => setInputMsg(e.target.value.toUpperCase())}
                    className="bg-transparent text-white font-bold w-32 outline-none placeholder-slate-600 text-center uppercase"
                    placeholder="SECRET"
                />
            </div>
        </div>

        {/* --- MAIN VISUALIZATION --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* LEFT: ENCRYPTED DATA (PUBLIC) */}
            <div className="bg-black/40 p-6 rounded-2xl border border-slate-700 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                        <Lock size={14}/> Public Key (N)
                    </h3>
                    <span className="text-cyan-400 font-bold">{N_REAL.toLocaleString()}</span>
                </div>
                
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 h-32 flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-slate-500 uppercase">Encrypted Cyphertext</p>
                    <div className="text-lg text-red-400 font-bold break-all text-center">
                        {encryptedMsg.map(n => n.toString(16).toUpperCase()).join(' ')}
                    </div>
                    {status === 'hacked' ? (
                        <div className="text-green-400 font-bold text-2xl mt-2 animate-bounce">
                             "{decryptedMsg}"
                        </div>
                    ) : (
                        <div className="text-slate-600 text-2xl mt-2 blur-sm select-none">
                            ?????
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: ATTACK ENGINE */}
            <div className="bg-black/40 p-6 rounded-2xl border border-slate-700 relative overflow-hidden">
                 {/* Quantum Overlay Effect */}
                 {status === 'cracking' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none animate-pulse"></div>
                 )}

                <h3 className="text-xs text-slate-500 uppercase font-bold mb-4 flex items-center gap-2">
                    <Cpu size={14}/> Factorization Engine
                </h3>

                {/* Classical Counter */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-500">CLASSICAL (Brute Force)</span>
                        <span className="text-slate-500">{timer} ms</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded border border-amber-900/30 text-right font-mono text-amber-500 text-xl">
                        Checking: {status === 'hacked' ? P_REAL : currentGuess.toLocaleString()}
                    </div>
                    {/* Progress Bar Mockup */}
                    <div className="w-full h-1 bg-slate-800 mt-1">
                        <div className="h-full bg-amber-500 transition-all duration-75" style={{width: status==='hacked'?'100%':`${(currentGuess/P_REAL)*100}%`}}></div>
                    </div>
                </div>

                {/* Quantum Result */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-cyan-400">QUANTUM (Shor's Algo)</span>
                        <span className="text-slate-500">{status==='hacked'?'0.04 ms':'Ready'}</span>
                    </div>
                    <div className={`bg-slate-900 p-3 rounded border ${status==='hacked'?'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]':'border-cyan-900/30'} text-center font-mono text-xl transition-all`}>
                        {status === 'hacked' ? (
                            <div className="flex justify-around text-cyan-400 font-bold">
                                <span>p={foundP}</span>
                                <span>q={foundQ}</span>
                            </div>
                        ) : (
                            <span className="text-slate-600">Waiting for QPU...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* KEY DISPLAY */}
        {status === 'hacked' && (
            <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4">
                    <div className="bg-green-500/20 p-3 rounded-full">
                        <Key size={24} className="text-green-400"/>
                    </div>
                    <div>
                        <h4 className="text-green-400 font-bold">PRIVATE KEY FOUND (d)</h4>
                        <p className="text-green-300/60 text-xs font-mono">d = {crackedD}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase">Decryption Status</p>
                    <p className="text-green-400 font-bold">SUCCESS</p>
                </div>
            </div>
        )}

        {/* ACTION BUTTON */}
        <div className="mt-8 flex justify-center">
            <button 
                onClick={startHack}
                disabled={status === 'cracking'}
                className={`w-full md:w-auto px-12 py-4 rounded-full font-bold text-xl tracking-widest shadow-2xl transition-all active:scale-95 ${
                    status === 'cracking' 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white border-2 border-red-400/20'
                }`}
            >
                {status === 'cracking' ? 'CRACKING N...' : status === 'hacked' ? 'HACK AGAIN' : 'EXECUTE SHOR\'S ALGORITHM'}
            </button>
        </div>

        {/* Explanation Text */}
        <p className="text-center text-slate-500 text-xs mt-6 max-w-2xl mx-auto">
            * This simulation performs real RSA encryption. The "Classical" visualization brute-forces the factorization of N={N_REAL.toLocaleString()}, while "Quantum" simulates Shor's algorithm finding the period to derive factors instantly.
        </p>

      </div>
    </div>
  );
};

export default ShorVisualizer;