'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { World, RADII } from './physics.mjs';

const SCHOOLS = ['西安交通大学','武汉大学','哈尔滨工业大学','中国人民大学','北京理工大学','浙江大学','上海交通大学','复旦大学','北京大学','清华大学','中国科学院大学'];
const COLORS = ['#b83d3e','#57709e','#204d7b','#2c68a0','#4c7669','#355bb0','#aa3639','#3d84c6','#bc4b5b','#a26d78','#7c9cdb'];
const WORLD_WIDTH = 420;
const WORLD_HEIGHT = 651;

export default function Game() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<any>(null);
  const next = useRef(0);
  const pointer = useRef({ x: 210, y: 72, visible: false });
  const records = useRef({ best: 0, max: 0 });
  const [stats, setStats] = useState({ score: 0, best: 0, max: 0 });

  function drop(x: number, y: number) {
    if (world.current?.spawn(x, y, next.current)) next.current = Math.floor(Math.random() * 5);
  }

  function restart() {
    world.current = new World(WORLD_WIDTH, WORLD_HEIGHT);
    next.current = Math.floor(Math.random() * 5);
    pointer.current = { x: WORLD_WIDTH / 2, y: 72, visible: false };
    setStats(current => ({ ...current, score: 0 }));
  }

  useEffect(() => {
    const c = canvas.current!;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    c.width = WORLD_WIDTH * pixelRatio;
    c.height = WORLD_HEIGHT * pixelRatio;
    const ctx = c.getContext('2d')!;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const logos = SCHOOLS.map((_, i) => {
      const image = new Image();
      image.src = `/logos/${i + 1}.svg`;
      return image;
    });
    world.current = new World(WORLD_WIDTH, WORLD_HEIGHT);

    const readRecords = () => {
      try {
        const data = JSON.parse(localStorage.getItem('merge11-records') || '{}');
        return {
          best: Number.isSafeInteger(data.best) && data.best >= 0 ? data.best : 0,
          max: Number.isInteger(data.max) && data.max >= 0 && data.max <= 11 ? data.max : 0,
        };
      } catch { return { best: 0, max: 0 }; }
    };
    const syncRecords = () => {
      const saved = readRecords();
      const w = world.current;
      const best = Math.max(saved.best, records.current.best, w.score);
      const max = Math.max(saved.max, records.current.max, w.max + 1);
      records.current = { best, max };
      if (saved.best !== best || saved.max !== max) {
        try { localStorage.setItem('merge11-records', JSON.stringify(records.current)); } catch {}
      }
      setStats({ score: w.score, best, max });
    };
    records.current = readRecords();
    setStats({ score: 0, ...records.current });

    const drawBall = (b: any, scale = 1, alpha = 1) => {
      const image = logos[b.level];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(b.x, b.y);
      ctx.scale(scale, scale);
      ctx.translate(-b.x, -b.y);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.clip();
      if (image.complete && image.naturalWidth) {
        const diameter = b.r * 2;
        const ratio = Math.max(diameter / image.naturalWidth, diameter / image.naturalHeight);
        const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio;
        ctx.drawImage(image, b.x - width / 2, b.y - height / 2, width, height);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(31, 53, 64, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };

    let frame = 0, previous = 0, accumulator = 0, lastUI = 0;
    const draw = (time: number) => {
      if (!previous) previous = time;
      accumulator += Math.min((time - previous) / 1000, 0.05);
      previous = time;
      const w = world.current;
      while (accumulator >= 1 / 120) { w.step(); accumulator -= 1 / 120; }
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.save();
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = 'rgba(76, 92, 69, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(32, 95); ctx.lineTo(WORLD_WIDTH - 32, 95);
      ctx.moveTo(32, 95); ctx.lineTo(32, WORLD_HEIGHT - 98);
      ctx.stroke();
      ctx.restore();
      for (const b of w.balls) {
        const t = Math.min(1, (b.mergeAge ?? 1) / 0.14);
        const ease = 1 - Math.pow(1 - t, 3);
        drawBall(b, 0.72 + 0.28 * ease);
        if (t < 1) {
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r * (1 + 0.2 * t), 0, Math.PI * 2);
          ctx.strokeStyle = COLORS[b.level]; ctx.globalAlpha = (1 - t) * 0.38;
          ctx.lineWidth = 2 * (1 - t); ctx.stroke(); ctx.globalAlpha = 1;
        }
      }
      if (pointer.current.visible) {
        const r = RADII[next.current];
        drawBall({ x: Math.max(r, Math.min(WORLD_WIDTH - r, pointer.current.x)), y: Math.max(r, Math.min(WORLD_HEIGHT - r, pointer.current.y)), r, level: next.current }, 1, 0.5);
      }
      if (time - lastUI > 120) { syncRecords(); lastUI = time; }
      frame = requestAnimationFrame(draw);
    };
    const onStorage = (e: StorageEvent) => { if (e.key === 'merge11-records') syncRecords(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('pagehide', syncRecords);
    frame = requestAnimationFrame(draw);
    return () => {
      syncRecords(); cancelAnimationFrame(frame);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pagehide', syncRecords);
    };
  }, []);

  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(context.registerTool({
        name: 'drop_ball',
        description: '在游戏区域指定空位生成下一颗大学校徽球，坐标范围 x 0–420、y 0–651。',
        inputSchema: { type: 'object', properties: { x: { type: 'number', minimum: 0, maximum: 420 }, y: { type: 'number', minimum: 0, maximum: 651 } }, required: ['x','y'], additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute: (input: any) => {
          if (!input || !Number.isFinite(input.x) || !Number.isFinite(input.y)) throw new Error('无效坐标');
          const before = world.current.balls.length; drop(input.x, input.y);
          return { created: world.current.balls.length > before };
        },
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);

  return <main className="app">
    <header className="topbar" aria-label="游戏信息">
      <div className="brand">
        <h1>合成国科大</h1>
        <p>点击空位·校徽相遇合成</p>
      </div>
      <div className="metric metric-score"><span>得分</span><strong>{stats.score.toLocaleString()}</strong></div>
      <div className="metric"><span>最高</span><strong>{stats.best.toLocaleString()}</strong></div>
      <div className="metric max-metric" title={stats.max ? `历史最大：${SCHOOLS[stats.max - 1]}` : '尚无历史最大校徽'}>
        <span>最大</span>
        {stats.max ? <img src={`/logos/${stats.max}.svg`} alt={SCHOOLS[stats.max - 1]} /> : <strong>—</strong>}
      </div>
      <button className="restart-button" type="button" onClick={restart} aria-label="重新开始游戏">重开</button>
    </header>
    <div className="basket"><canvas ref={canvas} width={WORLD_WIDTH} height={WORLD_HEIGHT} tabIndex={0}
      aria-label="大学校徽球合成游戏区域。点击空位生成球；方向键移动落点，空格或回车生成。"
      onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); pointer.current = { x: (e.clientX-r.left)*WORLD_WIDTH/r.width, y: (e.clientY-r.top)*WORLD_HEIGHT/r.height, visible: true }; }}
      onPointerLeave={() => { pointer.current.visible = false; }}
      onPointerDown={e => { const r = e.currentTarget.getBoundingClientRect(); drop((e.clientX-r.left)*WORLD_WIDTH/r.width, (e.clientY-r.top)*WORLD_HEIGHT/r.height); }}
      onKeyDown={e => { const p = pointer.current; if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)) return; e.preventDefault(); p.visible = true; if(e.key==='ArrowLeft')p.x=Math.max(0,p.x-20); if(e.key==='ArrowRight')p.x=Math.min(WORLD_WIDTH,p.x+20); if(e.key==='ArrowUp')p.y=Math.max(0,p.y-20); if(e.key==='ArrowDown')p.y=Math.min(WORLD_HEIGHT,p.y+20); if(e.key===' '||e.key==='Enter')drop(p.x,p.y); }}
    /></div>
  </main>;
}
