import React, { useEffect, useRef, useCallback } from 'react';
import { Shield, Radio } from 'lucide-react';

interface VizagCanvasMapProps {
  heightClass?: string;
}

const W = 1600, H = 900;

// ─── Road network ────────────────────────────────────────────────────────────
interface Road {
  id: string;
  name: string;
  pts: [number, number][];
  lanes: number;
  color?: string;
  elevated?: boolean;
}

const ROADS: Road[] = [
  { id: 'beach', name: 'Beach Road (Coastal NH)', pts: [[100,290],[250,282],[400,275],[550,268],[700,263],[850,260],[1000,258],[1150,256],[1300,254],[1480,252]], lanes:4, color:'#f97316' },
  { id: 'waltair', name: 'Waltair Main Rd', pts: [[420,268],[415,350],[410,430],[405,510],[400,590]], lanes:3 },
  { id: 'siripuram', name: 'Siripuram Rd', pts: [[550,268],[545,360],[540,450],[535,545],[530,625]], lanes:3 },
  { id: 'jagadamba', name: 'Jagadamba Rd', pts: [[700,263],[695,360],[690,450],[685,545],[680,625]], lanes:3 },
  { id: 'mvp', name: 'MVP Colony Main Rd', pts: [[850,260],[845,350],[840,440],[835,530],[830,625]], lanes:2 },
  { id: 'maddilapalem', name: 'Maddilapalem Rd', pts: [[1000,258],[1000,360],[1000,460],[1000,560],[1000,650]], lanes:3 },
  { id: 'seethamma', name: 'Seethammadhara Rd', pts: [[1150,256],[1150,360],[1150,460],[1150,560],[1150,645]], lanes:2 },
  { id: 'lawsons', name: "Lawson's Bay Rd", pts: [[250,282],[240,400],[228,525],[218,625]], lanes:2 },
  { id: 'nh16', name: 'NH-16 (National Highway)', pts: [[80,648],[250,646],[420,644],[600,642],[700,642],[850,642],[1000,642],[1150,642],[1300,642],[1480,642]], lanes:4, color:'#eab308' },
  { id: 'dwaraka', name: 'Dwaraka Nagar Rd', pts: [[400,590],[500,585],[600,580],[700,575]], lanes:2 },
  { id: 'rtc', name: 'RTC Complex Rd', pts: [[680,625],[745,634],[800,640],[850,642]], lanes:2 },
  { id: 'asilmetta', name: 'Asilmetta Flyover', pts: [[535,450],[578,446],[618,443],[658,445],[690,450]], lanes:3, color:'#38bdf8', elevated:true },
  { id: 'collectorate', name: 'Collectorate Rd', pts: [[400,590],[408,642]], lanes:2 },
  { id: 'care', name: 'Care Hospital Rd', pts: [[405,510],[480,505],[555,500]], lanes:2 },
  { id: 'au', name: 'A.U. Campus Rd', pts: [[250,282],[295,350],[308,435],[300,525]], lanes:2 },
  { id: 'ring', name: 'Inner Ring Road', pts: [[420,268],[550,268],[700,263],[850,260],[1000,258],[1150,256]], lanes:2, color:'#86efac' },
  { id: 'kommadi', name: 'Kommadi - Gajuwaka Rd', pts: [[1150,642],[1270,642],[1400,642],[1480,642]], lanes:3 },
  { id: 'bheemunipatnam', name: 'Bheemunipatnam Rd', pts: [[80,290],[100,290],[250,282]], lanes:3 },
];

// ─── Place markers ───────────────────────────────────────────────────────────
const PLACES = [
  { name:'RK Beach', pos:[100,275] as [number,number], type:'landmark' as const },
  { name:'Bheemunipatnam', pos:[80,305] as [number,number], type:'area' as const },
  { name:'A.U. Campus', pos:[275,320] as [number,number], type:'area' as const },
  { name:"Lawson's Bay", pos:[225,462] as [number,number], type:'area' as const },
  { name:'Waltair Club', pos:[404,345] as [number,number], type:'landmark' as const },
  { name:'Siripuram Jn.', pos:[543,258] as [number,number], type:'junction' as const },
  { name:'Care Hospital', pos:[484,498] as [number,number], type:'landmark' as const },
  { name:'Jagadamba', pos:[688,258] as [number,number], type:'junction' as const },
  { name:'Dwaraka Nagar', pos:[512,570] as [number,number], type:'area' as const },
  { name:'Asilmetta', pos:[612,435] as [number,number], type:'junction' as const },
  { name:'MVP Colony', pos:[840,255] as [number,number], type:'area' as const },
  { name:'RTC Complex', pos:[714,626] as [number,number], type:'junction' as const },
  { name:'Maddilapalem', pos:[992,255] as [number,number], type:'area' as const },
  { name:'Seethammadhara', pos:[1143,250] as [number,number], type:'area' as const },
  { name:'Collectorate', pos:[406,618] as [number,number], type:'landmark' as const },
  { name:'NH-16 Corridor', pos:[790,634] as [number,number], type:'landmark' as const },
  { name:'Kommadi Jn.', pos:[1272,630] as [number,number], type:'junction' as const },
  { name:'Gajuwaka', pos:[1405,630] as [number,number], type:'area' as const },
  { name:'Vizag Port', pos:[380,162] as [number,number], type:'landmark' as const },
  { name:'Kailasagiri', pos:[1410,238] as [number,number], type:'landmark' as const },
];

// ─── Demo vehicle paths (all strictly on road pts) ───────────────────────────
// Dheeraj (Main Car)
const DHEERAJ_PATH: [number,number][] = [
  [400,268],[550,268],[700,263],[700,360],[690,450],
  [685,545],[680,625],[745,634],[850,642],[1000,642],
  [1000,560],[1000,460],[1000,360],[1000,258],[850,260],
  [850,350],[840,440],[835,530],[830,625],[745,634],
  [680,625],[685,545],[690,450],[695,360],[700,263],
  [550,268],[545,360],[540,450],[535,545],[530,625],
  [408,642],[405,510],[410,430],[415,350],[420,268],
];

// Pardhu (Red / Emergency Medic) — Beach Road eastward, down Siripuram, back on NH-16
const PARDHU_PATH: [number,number][] = [
  [100,290],[250,282],[400,275],[550,268],
  [545,360],[540,450],[535,545],[530,625],
  [408,642],[250,646],[100,646],
  [100,290],
];

// Lehari (Amber) — Jagadamba down to NH-16, west, up Waltair
const LEHARI_PATH: [number,number][] = [
  [700,263],[695,360],[690,450],[685,545],[680,625],
  [600,642],[420,644],[408,642],
  [405,510],[410,430],[415,350],[420,268],
  [550,268],[700,263],
];

// BJS (Purple) — MVP → Ring Road → Maddilapalem → NH-16 → back
const BJS_PATH: [number,number][] = [
  [850,260],[1000,258],[1150,256],
  [1150,360],[1150,460],[1150,560],[1150,642],
  [1000,642],[850,642],[850,530],[840,440],[845,350],[850,260],
];

// Nithin (Emerald) — Asilmetta flyover back-and-forth
const NITHIN_PATH: [number,number][] = [
  [535,450],[578,446],[618,443],[658,445],[690,450],
  [685,545],[680,625],[745,634],[850,642],
  [850,530],[840,440],[845,350],[850,260],[700,263],
  [695,360],[690,450],[658,445],[618,443],[578,446],[535,450],
];

// Chayy (Cyan / Patrol) — Lawson's Bay, AU Campus, Collectorate Corridor
const CHAYY_PATH: [number,number][] = [
  [250,282],[295,350],[308,435],[300,525],[218,625],
  [408,642],[400,590],[405,510],[480,505],[555,500],
  [540,450],[410,430],[250,282],
];

interface DemoCar {
  label: string;
  color: string;
  path: [number,number][];
  speed: number;         // px/sec
  idx: number;
  progress: number;
  pos: [number,number];
  heading: number;
  icon: string;
}

function makeDemoCars(): DemoCar[] {
  return [
    { label:'Lehari', color:'#f59e0b', path:LEHARI_PATH, speed:56, idx:2, progress:0.6, pos:[...LEHARI_PATH[2]], heading:0, icon:'🚗' },
    { label:'Pardhu', color:'#ef4444', path:PARDHU_PATH, speed:70, idx:0, progress:0.3, pos:[...PARDHU_PATH[0]], heading:0, icon:'🚑' },
    { label:'BJS', color:'#8b5cf6', path:BJS_PATH, speed:72, idx:1, progress:0.1, pos:[...BJS_PATH[1]], heading:0, icon:'👑' },
    { label:'Nithin', color:'#10b981', path:NITHIN_PATH, speed:62, idx:4, progress:0.5, pos:[...NITHIN_PATH[4]], heading:0, icon:'🚙' },
    { label:'Chayy', color:'#06b6d4', path:CHAYY_PATH, speed:65, idx:1, progress:0.4, pos:[...CHAYY_PATH[1]], heading:0, icon:'🚓' },
  ];
}

function stepCar(car: DemoCar, dt: number) {
  const a = car.idx;
  const b = (a + 1) % car.path.length;
  const [ax,ay] = car.path[a];
  const [bx,by] = car.path[b];
  const segLen = Math.hypot(bx-ax, by-ay) || 1;
  car.progress += (car.speed * dt) / segLen;
  if (car.progress >= 1) {
    car.progress -= 1;
    car.idx = b;
  }
  const t = car.progress;
  car.pos = [ax+(bx-ax)*t, ay+(by-ay)*t];
  car.heading = Math.atan2(by-ay, bx-ax) * (180/Math.PI);
}

// ─── Component ────────────────────────────────────────────────────────────────
export const VizagCanvasMap: React.FC<VizagCanvasMapProps> = ({ heightClass='h-[520px]' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(1.0);
  const panRef = useRef({ x:790, y:450 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x:0, y:0 });

  // YOUR car state (Dheeraj)
  const yourIdx = useRef(0);
  const yourProg = useRef(0);
  const yourPos = useRef<[number,number]>([...DHEERAJ_PATH[0]]);
  const yourHeading = useRef(0);

  // Demo cars
  const demoCarsRef = useRef<DemoCar[]>(makeDemoCars());



  // ─── Draw ─────────────────────────────────────────────────────────────────
  const drawFrame = useCallback((dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha:false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const CW = canvas.clientWidth, CH = canvas.clientHeight;
    if (canvas.width !== CW*dpr || canvas.height !== CH*dpr) {
      canvas.width = CW*dpr; canvas.height = CH*dpr;
    }

    // ── Step Dheeraj car ───────────────────────────────────────────────────
    {
      const a = yourIdx.current;
      const b = (a+1) % DHEERAJ_PATH.length;
      const [ax,ay] = DHEERAJ_PATH[a];
      const [bx,by] = DHEERAJ_PATH[b];
      const segLen = Math.hypot(bx-ax,by-ay)||1;
      yourProg.current += (80*dt)/segLen;
      if (yourProg.current >= 1) { yourProg.current -= 1; yourIdx.current = b; }
      const t = yourProg.current;
      yourPos.current = [ax+(bx-ax)*t, ay+(by-ay)*t];
      yourHeading.current = Math.atan2(by-ay, bx-ax)*(180/Math.PI);
    }

    // ── Step demo cars ────────────────────────────────────────────────────
    demoCarsRef.current.forEach(c => stepCar(c, dt));

    // ── Proximity check ───────────────────────────────────────────────────
    const [yx,yy] = yourPos.current;
    let minDist = Infinity;
    demoCarsRef.current.forEach(c => {
      const d = Math.hypot(c.pos[0]-yx, c.pos[1]-yy);
      if (d < minDist) minDist = d;
    });

    // px → metres (roughly 0.5m per px on this canvas scale)
    const minDistM = minDist * 0.5;

    const lvl: 'safe'|'caution'|'critical' =
      minDistM < 40 ? 'critical' : minDistM < 100 ? 'caution' : 'safe';

    // ── Transform ─────────────────────────────────────────────────────────
    ctx.save();
    ctx.scale(dpr, dpr);
    const zoom = zoomRef.current;
    const cam = panRef.current;
    ctx.translate(CW/2, CH/2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cam.x, -cam.y);

    // 1. Land
    ctx.fillStyle = '#e8efdf';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    for (let x=0; x<=W; x+=60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<=H; y+=60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // 2. Sea
    const seaG = ctx.createLinearGradient(0,0,0,235);
    seaG.addColorStop(0,'#1a56db'); seaG.addColorStop(1,'#60a5fa');
    ctx.fillStyle = seaG;
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.lineTo(W,0); ctx.lineTo(W,210);
    ctx.bezierCurveTo(1200,205,900,215,600,222);
    ctx.bezierCurveTo(400,228,200,240,0,255);
    ctx.closePath(); ctx.fill();
    ctx.font='bold 16px sans-serif'; ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.textAlign='center'; ctx.fillText('Bay of Bengal',800,105);

    // 3. Roads
    ROADS.forEach(road => {
      const lw = road.lanes===4?20:road.lanes===3?14:9;

      if (road.elevated) {
        ctx.save();
        ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=14;
        ctx.shadowOffsetX=5; ctx.shadowOffsetY=10;
        ctx.strokeStyle='#1e3a5f'; ctx.lineWidth=lw+10;
        ctx.lineCap='round'; ctx.lineJoin='round';
        ctx.beginPath(); road.pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)); ctx.stroke();
        ctx.restore();
      }

      ctx.strokeStyle = road.lanes===4?'#78350f':road.elevated?'#0369a1':'#64748b';
      ctx.lineWidth=lw+5; ctx.lineCap='round'; ctx.lineJoin='round';
      ctx.beginPath(); road.pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)); ctx.stroke();

      ctx.strokeStyle = road.color ?? '#9ca3af';
      ctx.lineWidth=lw;
      ctx.beginPath(); road.pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)); ctx.stroke();

      if (road.lanes>1) {
        ctx.strokeStyle = road.lanes===4?'rgba(253,224,71,0.8)':'rgba(255,255,255,0.5)';
        ctx.lineWidth=1.5; ctx.setLineDash([12,14]);
        ctx.beginPath(); road.pts.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y)); ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // 4. Road labels
    ROADS.forEach(road => {
      const mid = Math.floor(road.pts.length/2);
      const [mx,my] = road.pts[mid];
      const prev = road.pts[Math.max(0,mid-1)];
      const angle = Math.atan2(my-prev[1], mx-prev[0]);
      ctx.save(); ctx.translate(mx,my); ctx.rotate(angle);
      ctx.font=road.lanes===4?'bold 10px sans-serif':'9px sans-serif';
      const tw=ctx.measureText(road.name).width;
      ctx.fillStyle='rgba(255,255,255,0.85)';
      ctx.fillRect(-tw/2-4,-8,tw+8,14);
      ctx.fillStyle=road.color==='#eab308'?'#713f12':road.elevated?'#0c4a6e':'#1e293b';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(road.name,0,0); ctx.restore();
    });

    // 5. Place markers
    PLACES.forEach(({name, pos: [px,py], type}) => {
      const isJn=type==='junction', isLm=type==='landmark';
      const dc=isJn?'#6366f1':isLm?'#f59e0b':'#22c55e';
      ctx.fillStyle=dc; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(px,py,isJn?7:5,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.font=isJn?'bold 9px sans-serif':'9px sans-serif';
      const tw=ctx.measureText(name).width;
      const lx=px+10, ly=py-7;
      ctx.fillStyle=isJn?'#eef2ff':isLm?'#fef9c3':'#f0fdf4';
      ctx.strokeStyle=isJn?'#a5b4fc':isLm?'#fde68a':'#bbf7d0'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.roundRect(lx,ly,tw+7,14,3); ctx.fill(); ctx.stroke();
      ctx.fillStyle=isJn?'#3730a3':isLm?'#78350f':'#14532d';
      ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(name,lx+3,ly+2);
    });

    // 6. Demo cars
    const now = Date.now()/400;
    demoCarsRef.current.forEach(car => {
      const [cx2,cy2] = car.pos;
      const isCrit = Math.hypot(cx2-yx,cy2-yy)*0.5 < 40;
      const isCau  = Math.hypot(cx2-yx,cy2-yy)*0.5 < 100;

      // Pulsing danger ring
      if (isCrit || isCau) {
        ctx.save();
        const pr = 20+Math.sin(now)*5;
        ctx.strokeStyle = isCrit?'#ef4444':'#f59e0b';
        ctx.lineWidth=2; ctx.globalAlpha=0.55+Math.sin(now)*0.3;
        ctx.setLineDash([5,5]);
        ctx.beginPath(); ctx.arc(cx2,cy2,pr,0,Math.PI*2); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }

      // Heading arrow
      ctx.save();
      ctx.translate(cx2,cy2);
      ctx.rotate(car.heading*Math.PI/180);
      ctx.fillStyle=car.color;
      ctx.beginPath(); ctx.moveTo(0,-17); ctx.lineTo(-5,5); ctx.lineTo(5,5); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Body
      ctx.fillStyle=car.color; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(cx2,cy2,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.font='11px sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(car.icon, cx2, cy2);

      // Name & Distance Badge
      const dist = (Math.hypot(cx2-yx,cy2-yy)*0.5).toFixed(0);
      const tagBg = isCrit?'#dc2626':isCau?'#d97706':'#0f172a';
      ctx.fillStyle=tagBg;
      ctx.font='bold 9px monospace';
      ctx.textAlign='center';
      ctx.fillText(`${car.label} (${dist}m)`, cx2, cy2 - 20);

      // Laser line to Dheeraj (YOUR vehicle)
      if (isCrit||isCau) {
        ctx.save();
        ctx.strokeStyle=isCrit?'#ef4444':'#f59e0b';
        ctx.lineWidth=isCrit?2:1.5; ctx.setLineDash([8,8]); ctx.globalAlpha=0.5;
        ctx.beginPath(); ctx.moveTo(cx2,cy2); ctx.lineTo(yx,yy); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
    });

    // 7. Dheeraj (Main User vehicle)
    const hRad = yourHeading.current*(Math.PI/180);
    const glowG = ctx.createRadialGradient(yx,yy,0,yx,yy,36);
    glowG.addColorStop(0,'rgba(99,102,241,0.45)'); glowG.addColorStop(1,'rgba(99,102,241,0)');
    ctx.fillStyle=glowG; ctx.beginPath(); ctx.arc(yx,yy,36,0,Math.PI*2); ctx.fill();

    ctx.save(); ctx.translate(yx,yy); ctx.rotate(hRad);
    ctx.fillStyle='#4f46e5';
    ctx.beginPath(); ctx.moveTo(0,-22); ctx.lineTo(-6,4); ctx.lineTo(6,4); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.fillStyle='#4f46e5'; ctx.strokeStyle='#fff'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(yx,yy,14,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.font='12px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🚗',yx,yy);

    ctx.fillStyle='#1e1b4b';
    ctx.font='bold 10px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Dheeraj (You)', yx, yy - 22);

    // 8. Alert radius ring around YOU
    if (lvl !== 'safe') {
      const ringR = lvl==='critical'?55:90;
      const ringAlpha = lvl==='critical'?0.35:0.2;
      ctx.save();
      ctx.strokeStyle = lvl==='critical'?'#ef4444':'#f59e0b';
      ctx.lineWidth=1.5; ctx.globalAlpha=ringAlpha;
      ctx.setLineDash([10,10]);
      ctx.beginPath(); ctx.arc(yx,yy,ringR,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    // 9. Compass
    const cpx=cam.x-CW/(2*zoom)+50, cpy=cam.y-CH/(2*zoom)+50;
    ctx.fillStyle='rgba(15,23,42,0.78)';
    ctx.beginPath(); ctx.arc(cpx,cpy,23,0,Math.PI*2); ctx.fill();
    ['N','E','S','W'].forEach((d,i)=>{
      const a=(i*Math.PI)/2-Math.PI/2, r=15;
      ctx.fillStyle=d==='N'?'#f87171':'#94a3b8';
      ctx.font=`bold ${d==='N'?10:9}px sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(d,cpx+Math.cos(a)*r,cpy+Math.sin(a)*r);
    });

    ctx.restore();
  }, []);

  // ── RAF loop ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let raf: number, last=performance.now();
    const loop=(now: number)=>{
      const dt=Math.min(0.05,(now-last)/1000); last=now;
      drawFrame(dt); raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(raf);
  }, [drawFrame]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    const ro=new ResizeObserver(()=>drawFrame(0)); ro.observe(c);
    return()=>ro.disconnect();
  },[drawFrame]);

  // ── Pan/Zoom ──────────────────────────────────────────────────────────────
  const onWheel = useCallback((e:React.WheelEvent)=>{
    e.preventDefault();
    zoomRef.current=Math.max(0.5,Math.min(5,zoomRef.current*(e.deltaY<0?1.12:0.9)));
  },[]);
  const onMouseDown=useCallback((e:React.MouseEvent)=>{isDragging.current=true;lastMouse.current={x:e.clientX,y:e.clientY};},[]);
  const onMouseMove=useCallback((e:React.MouseEvent)=>{
    if(!isDragging.current)return;
    const dx=(e.clientX-lastMouse.current.x)/zoomRef.current;
    const dy=(e.clientY-lastMouse.current.y)/zoomRef.current;
    panRef.current={x:panRef.current.x-dx,y:panRef.current.y-dy};
    lastMouse.current={x:e.clientX,y:e.clientY};
  },[]);
  const onMouseUp=useCallback(()=>{isDragging.current=false;},[]);
  const onTouchStart=useCallback((e:React.TouchEvent)=>{if(e.touches.length===1){isDragging.current=true;lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}},[]);
  const onTouchMove=useCallback((e:React.TouchEvent)=>{
    if(!isDragging.current||e.touches.length!==1)return;
    const dx=(e.touches[0].clientX-lastMouse.current.x)/zoomRef.current;
    const dy=(e.touches[0].clientY-lastMouse.current.y)/zoomRef.current;
    panRef.current={x:panRef.current.x-dx,y:panRef.current.y-dy};
    lastMouse.current={x:e.touches[0].clientX,y:e.touches[0].clientY};
  },[]);

  return (
    <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden border border-slate-200 shadow-lg select-none`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
      />

      {/* Title */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-200 shadow">
        <Shield className="w-4 h-4 text-indigo-600" />
        <div>
          <div className="text-xs font-black text-slate-900 leading-tight">Visakhapatnam Road Network</div>
          <div className="text-[10px] text-slate-500 font-medium">Live Cooperation Safety Map</div>
        </div>
      </div>

      {/* Alert badge */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border backdrop-blur-md shadow bg-emerald-50 text-emerald-800 border-emerald-300">
        <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        <span>Road Network Active</span>
      </div>

      {/* Zoom */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1">
        {[{l:'+',f:()=>{zoomRef.current=Math.min(5,zoomRef.current*1.2);}},
          {l:'⌂',f:()=>{zoomRef.current=1;panRef.current={x:790,y:450};}},
          {l:'−',f:()=>{zoomRef.current=Math.max(0.5,zoomRef.current*0.83);}}
        ].map(({l,f})=>(
          <button key={l} onClick={f}
            className="w-8 h-8 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow text-slate-700 font-black text-sm hover:bg-indigo-50 hover:border-indigo-300 transition flex items-center justify-center">
            {l}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow px-3 py-2 text-[10px] space-y-1">
        <div className="font-black text-slate-700 mb-1 text-[11px]">Map Legend</div>
        {[
          {c:'#f97316',l:'Beach Road (Coastal)'},
          {c:'#eab308',l:'NH-16 (National Hwy)'},
          {c:'#38bdf8',l:'Asilmetta Flyover'},
          {c:'#86efac',l:'Inner Ring Road'},
          {c:'#9ca3af',l:'City Roads'},
          {c:'#4f46e5',l:'🚗 Dheeraj (You)'},
          {c:'#f59e0b',l:'🚗 Lehari'},
          {c:'#ef4444',l:'🚑 Pardhu'},
          {c:'#8b5cf6',l:'👑 BJS'},
          {c:'#10b981',l:'🚙 Nithin'},
          {c:'#06b6d4',l:'🚓 Chayy'},
        ].map(({c,l})=>(
          <div key={l} className="flex items-center gap-1.5 text-slate-600">
            <div className="w-3 h-2 rounded-sm flex-shrink-0" style={{backgroundColor:c}}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
