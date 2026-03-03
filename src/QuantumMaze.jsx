import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Play, Settings, Target } from 'lucide-react';

const QuantumMaze = () => {
  const canvasRef = useRef(null);
  
  // Settings
  const [gridSize, setGridSize] = useState(20); // ขนาดช่อง (ยิ่งน้อยยิ่งละเอียด)
  const [speed, setSpeed] = useState(5); // Speed multiplier
  
  // Game State
  const [status, setStatus] = useState('idle');
  const [maze, setMaze] = useState([]);
  const [classicalPath, setClassicalPath] = useState([]);
  const [quantumWave, setQuantumWave] = useState([]);
  const [qTime, setQTime] = useState(0);

  // Refs for loop
  const requestRef = useRef();
  const solverRef = useRef({ cStack:[], cVisited:new Set(), qQueue:[], qVisited:new Set(), qHistory:[] });

  // 1. Generate Maze (Recursive Backtracker)
  const generateMaze = () => {
      setStatus('idle');
      setClassicalPath([]);
      setQuantumWave([]);
      setQTime(0);
      if(requestRef.current) cancelAnimationFrame(requestRef.current);

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cols = Math.floor(w / gridSize) | 1; 
      const rows = Math.floor(h / gridSize) | 1;
      const grid = Array(rows).fill().map(() => Array(cols).fill(0)); // 0=Wall, 1=Path

      const stack = [{x:1, y:1}];
      grid[1][1] = 1;

      while(stack.length) {
          const cur = stack[stack.length-1];
          const dirs = [{x:0,y:-2}, {x:0,y:2}, {x:-2,y:0}, {x:2,y:0}].sort(()=>Math.random()-0.5);
          let found = false;
          for(let d of dirs) {
              const nx = cur.x + d.x, ny = cur.y + d.y;
              if(nx>0 && nx<cols-1 && ny>0 && ny<rows-1 && grid[ny][nx]===0) {
                  grid[cur.y+d.y/2][cur.x+d.x/2] = 1;
                  grid[ny][nx] = 1;
                  stack.push({x:nx, y:ny});
                  found = true;
                  break;
              }
          }
          if(!found) stack.pop();
      }
      setMaze(grid);
      
      // Init Solver Refs
      solverRef.current = {
          cStack: [{x:1, y:1}], cVisited: new Set(['1,1']),
          qQueue: [{x:1, y:1, parent:null}], qVisited: new Set(['1,1']), qHistory: []
      };
  };

  useEffect(() => { generateMaze(); }, [gridSize]);

  // 2. Simulation Loop
  const runSim = () => {
      if(status === 'running') return;
      setStatus('running');
      const startTime = performance.now();
      const endPos = {x: maze[0].length-2, y: maze.length-2};

      const loop = () => {
          let qFinished = false;

          // Repeat logic based on speed
          for(let s=0; s<speed; s++) {
             // Quantum BFS
             if(solverRef.current.qQueue.length > 0) {
                 const nextQ = [];
                 while(solverRef.current.qQueue.length > 0) { // Process entire wave layer
                     const cur = solverRef.current.qQueue.shift();
                     if(cur.x === endPos.x && cur.y === endPos.y) {
                         qFinished = true;
                         // Traceback solution
                         let temp = cur;
                         const sol = [];
                         while(temp) { sol.push(temp); temp = temp.parent; }
                         setQuantumWave(prev => [...prev, ...sol]); // Highlight solution
                         break;
                     }
                     [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}].forEach(d => {
                         const nx = cur.x+d.x, ny = cur.y+d.y;
                         if(maze[ny] && maze[ny][nx]===1 && !solverRef.current.qVisited.has(`${nx},${ny}`)) {
                             solverRef.current.qVisited.add(`${nx},${ny}`);
                             const node = {x:nx, y:ny, parent:cur};
                             nextQ.push(node);
                             solverRef.current.qHistory.push(node); // For drawing flood
                         }
                     });
                 }
                 solverRef.current.qQueue = nextQ;
             }

             // Classical DFS
             if(solverRef.current.cStack.length > 0 && !qFinished) {
                 const cur = solverRef.current.cStack[solverRef.current.cStack.length-1];
                 const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}].sort(()=>Math.random()-0.5);
                 let moved = false;
                 for(let d of dirs) {
                     const nx = cur.x+d.x, ny = cur.y+d.y;
                     if(maze[ny] && maze[ny][nx]===1 && !solverRef.current.cVisited.has(`${nx},${ny}`)) {
                         solverRef.current.cVisited.add(`${nx},${ny}`);
                         solverRef.current.cStack.push({x:nx, y:ny});
                         moved = true;
                         break;
                     }
                 }
                 if(!moved) solverRef.current.cStack.pop();
             }
          }

          // Update State for Drawing
          setQuantumWave([...solverRef.current.qHistory]);
          setClassicalPath([...solverRef.current.cStack]);

          if(qFinished) {
              const endTime = performance.now();
              setQTime((endTime - startTime).toFixed(2));
              setStatus('done');
          } else {
              requestRef.current = requestAnimationFrame(loop);
          }
      };
      loop();
  };

  // 3. Draw
  useEffect(() => {
      const canvas = canvasRef.current;
      if(!canvas || !maze.length) return;
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const cs = gridSize; // Cell Size

      // BG
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0,0,canvas.width,canvas.height);

      // Paths (Optimization: Draw walls as negative space or paths as boxes)
      ctx.fillStyle = '#1e293b';
      maze.forEach((row,y) => row.forEach((c,x) => { if(c===1) ctx.fillRect(x*cs, y*cs, cs, cs); }));

      // Quantum Wave
      ctx.fillStyle = 'rgba(6,182,212, 0.4)';
      quantumWave.forEach(p => ctx.fillRect(p.x*cs, p.y*cs, cs, cs));

      // Classical Path
      ctx.fillStyle = '#f59e0b';
      classicalPath.forEach(p => ctx.fillRect(p.x*cs, p.y*cs, cs, cs));

      // Solution Glow (if done)
      if(status === 'done') {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor='#22d3ee'; ctx.shadowBlur=10;
          ctx.strokeRect((maze[0].length-2)*cs, (maze.length-2)*cs, cs, cs);
      }

  }, [maze, quantumWave, classicalPath, gridSize]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans">
        <canvas ref={canvasRef} className="absolute inset-0 z-0"/>
        
        {/* Settings */}
        <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-xl w-[280px]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                <Target className="text-cyan-400"/> GROVER'S MAZE
            </h2>
            <div className="space-y-4 mb-6">
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>MAZE SIZE (RESOLUTION)</span>
                    </div>
                    <input type="range" min="10" max="60" step="5" value={gridSize} onChange={e=>setGridSize(Number(e.target.value))} className="w-full accent-cyan-500" style={{direction: 'rtl'}}/>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>SEARCH SPEED</span>
                    </div>
                    <input type="range" min="1" max="20" value={speed} onChange={e=>setSpeed(Number(e.target.value))} className="w-full accent-amber-500"/>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={generateMaze} className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600"><RefreshCw size={18} className="text-white"/></button>
                <button onClick={runSim} disabled={status==='running'} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg py-2">
                    {status==='running'?'SEARCHING...':'START'}
                </button>
            </div>
            {/* Time Result */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center mt-1">
                     <span className="text-xs text-cyan-400">Quantum Time</span>
                     <span className="text-xl font-bold text-white">{qTime} ms</span>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default QuantumMaze;