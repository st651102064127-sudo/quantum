import React, { useRef, useEffect, useState } from 'react';
import { RefreshCw, Play, MapPin, Settings2 } from 'lucide-react';

const QuantumLogistics = () => {
  const canvasRef = useRef(null);
  
  // Config State
  const [nodeCount, setNodeCount] = useState(15);
  const [speed, setSpeed] = useState(50); // ความเร็วในการลากเส้น
  
  // Game State
  const [nodes, setNodes] = useState([]);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, calculating, drawing, done
  const [resultPath, setResultPath] = useState([]);
  const [drawProgress, setDrawProgress] = useState(0);

  // 1. สร้างจุด (Generate)
  const generateNodes = () => {
    setStatus('idle');
    setStartNode(null);
    setEndNode(null);
    setResultPath([]);
    setDrawProgress(0);
    
    const newNodes = [];
    const margin = 80;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: margin + Math.random() * (w - margin * 2),
        y: margin + Math.random() * (h - 250)
      });
    }
    setNodes(newNodes);
  };

  // 2. เลือกจุด (Click Interaction)
  const handleCanvasClick = (e) => {
    if (status !== 'idle') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // หาจุดที่ถูกคลิก
    const clickedNode = nodes.find(n => Math.hypot(n.x - x, n.y - y) < 20);

    if (clickedNode) {
        if (!startNode) setStartNode(clickedNode);
        else if (!endNode && clickedNode.id !== startNode.id) setEndNode(clickedNode);
        else {
            // Reset ถ้าคลิกซ้ำ
            setStartNode(clickedNode);
            setEndNode(null);
        }
    }
  };

  // 3. คำนวณหาเส้นทาง (Simulate QAOA)
  const solve = () => {
    if (!startNode || !endNode) return;
    setStatus('calculating');

    setTimeout(() => {
        // Greedy Pathfinding (Simulated Optimization)
        let unvisited = nodes.filter(n => n.id !== startNode.id && n.id !== endNode.id);
        let current = startNode;
        let path = [startNode];

        while (unvisited.length > 0) {
            unvisited.sort((a, b) => {
                const distA = Math.hypot(a.x - current.x, a.y - current.y);
                const distB = Math.hypot(b.x - current.x, b.y - current.y);
                return distA - distB;
            });
            current = unvisited.shift();
            path.push(current);
        }
        path.push(endNode); // จบที่จุด End
        
        setResultPath(path);
        setStatus('drawing');
    }, 1500); // เวลาคิดของ Quantum
  };

  // 4. Loop การวาด (Animation Loop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrame;

    const render = () => {
      // Clear & Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      const gridSize = 40;
      ctx.beginPath();
      for(let x=0; x<=canvas.width; x+=gridSize) { ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); }
      for(let y=0; y<=canvas.height; y+=gridSize) { ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); }
      ctx.stroke();

      // Superposition Lines (ตอนกำลังคิด)
      if (status === 'calculating') {
         ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
         ctx.lineWidth = 0.5;
         ctx.beginPath();
         nodes.forEach(a => nodes.forEach(b => {
             if (Math.random() > 0.95) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
         }));
         ctx.stroke();
      }

      // Drawing Animation Logic (ค่อยๆ ลากเส้น)
      if (status === 'drawing' && resultPath.length > 0) {
          // เพิ่ม Progress เรื่อยๆ ตาม Speed
          if (drawProgress < resultPath.length - 1) {
              setDrawProgress(prev => Math.min(prev + (speed / 1000), resultPath.length - 1));
          } else {
              setStatus('done');
          }

          // วาดเส้นตาม Progress
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15;
          
          ctx.beginPath();
          ctx.moveTo(resultPath[0].x, resultPath[0].y);
          
          // วาดเส้นเต็ม
          const currentIndex = Math.floor(drawProgress);
          for(let i=0; i < currentIndex; i++) {
              ctx.lineTo(resultPath[i+1].x, resultPath[i+1].y);
          }

          // วาดเส้นที่กำลังวิ่งอยู่ (Partial Line)
          const nextNode = resultPath[currentIndex + 1];
          const currNode = resultPath[currentIndex];
          if (nextNode) {
              const partial = drawProgress - currentIndex;
              const curX = currNode.x + (nextNode.x - currNode.x) * partial;
              const curY = currNode.y + (nextNode.y - currNode.y) * partial;
              ctx.lineTo(curX, curY);
              
              // หัวลูกศรนำทาง
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(curX, curY, 4, 0, Math.PI*2); ctx.fill();
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
      }
      
      // Draw Static Result (เมื่อเสร็จแล้ว)
      if (status === 'done' && resultPath.length) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.moveTo(resultPath[0].x, resultPath[0].y);
          resultPath.forEach(n => ctx.lineTo(n.x, n.y));
          ctx.stroke();
          ctx.shadowBlur = 0;
      }

      // Draw Nodes
      nodes.forEach(n => {
          const isStart = startNode?.id === n.id;
          const isEnd = endNode?.id === n.id;
          
          ctx.fillStyle = isStart ? '#22c55e' : (isEnd ? '#ef4444' : '#fff');
          ctx.beginPath(); ctx.arc(n.x, n.y, isStart||isEnd ? 8 : 4, 0, Math.PI * 2); ctx.fill();
          
          // Labels
          if(isStart) { ctx.fillStyle='#22c55e'; ctx.fillText("START", n.x-15, n.y-15); }
          if(isEnd) { ctx.fillStyle='#ef4444'; ctx.fillText("END", n.x-10, n.y-15); }
      });

      animationFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrame);
  }, [nodes, status, drawProgress, startNode, endNode, resultPath, speed]);

  useEffect(() => { generateNodes(); }, [nodeCount]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans">
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="absolute inset-0 z-0 cursor-crosshair" />
      
      {/* Settings Panel */}
      <div className="absolute top-0 left-0 w-full flex flex-col items-center pt-6 pointer-events-none z-10">
         <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-6 py-4 rounded-2xl shadow-2xl pointer-events-auto flex flex-col gap-4 min-w-[300px]">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2 text-cyan-400">
                    <MapPin size={20} />
                    <h2 className="font-bold text-white">QAOA LOGISTICS</h2>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-green-400"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Click Start</div>
                    <div className="flex items-center gap-1 text-[10px] text-red-400"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Click End</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">NODE COUNT: {nodeCount}</label>
                    <input type="range" min="5" max="50" value={nodeCount} onChange={e => setNodeCount(Number(e.target.value))} className="w-full accent-cyan-500"/>
                </div>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">DRAW SPEED</label>
                    <input type="range" min="10" max="200" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-amber-500"/>
                </div>
            </div>
            
            <div className="flex gap-2 justify-center mt-2">
                <button onClick={generateNodes} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition text-white"><RefreshCw size={18}/></button>
                <button 
                    onClick={solve} 
                    disabled={!startNode || !endNode || status === 'calculating' || status === 'drawing'}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition text-sm ${
                        !startNode || !endNode ? 'bg-slate-800 text-slate-600 cursor-not-allowed' :
                        status !== 'idle' ? 'bg-slate-700 text-slate-400' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                    }`}
                >
                    <Play size={16} fill="currentColor"/> {status === 'idle' ? 'CALCULATE ROUTE' : 'OPTIMIZING...'}
                </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default QuantumLogistics;