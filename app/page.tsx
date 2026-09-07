'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { World, RADII } from './physics.mjs';

const SCHOOLS = ['中国科学院大学','清华大学','北京大学','复旦大学','上海交通大学','浙江大学','北京理工大学','中国人民大学','哈尔滨工业大学','武汉大学','西安交通大学'];
const COLORS = ['#7c9cdb','#a26d78','#bc4b5b','#3d84c6','#aa3639','#355bb0','#4c7669','#2c68a0','#204d7b','#57709e','#b83d3e'];

export default function Game() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<any>(null);
  const next = useRef(0);
  const pointer = useRef({ x: 400, y: 130, visible: false });
  const records = useRef({ best: 0, max: 0 });
  const [stats, setStats] = useState({ score: 0, best: 0, max: 0 });

  function drop(x: number, y: number) {
    if (world.current?.spawn(x, y, next.current)) next.current = Math.floor(Math.random() * 5);
  }

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    const logos = SCHOOLS.map((_, i) => {
      const image = new Image();
      const extension = i === 0 ? '.png' : i === 10 ? '.jpg' : '.svg';
      image.src = `/logos/${i + 1}${extension}`;
      return image;
    });
    world.current = new World(800, 650);

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
      ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 4, 0, Math.PI * 2);
      ctx.clip();
      if (image.complete && image.naturalWidth) {
        const side = b.r * 1.42;
        const ratio = Math.min(side / image.naturalWidth, side / image.naturalHeight);
        const width = image.naturalWidth * ratio, height = image.naturalHeight * ratio;
        ctx.drawImage(image, b.x - width / 2, b.y - height / 2, width, height);
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r - 1, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS[b.level];
      ctx.lineWidth = Math.max(2, b.r * 0.07);
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
      ctx.clearRect(0, 0, 800, 650);
      ctx.fillStyle = '#dce8ed';
      for (let x = 20; x < 800; x += 30) for (let y = 20; y < 650; y += 30) {
        ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
      }
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
        drawBall({ x: Math.max(r, Math.min(800 - r, pointer.current.x)), y: Math.max(r, Math.min(650 - r, pointer.current.y)), r, level: next.current }, 1, 0.5);
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
        description: '在游戏区域指定空位生成下一颗大学校徽球，坐标范围 x 0–800、y 0–650。',
        inputSchema: { type: 'object', properties: { x: { type: 'number', minimum: 0, maximum: 800 }, y: { type: 'number', minimum: 0, maximum: 650 } }, required: ['x','y'], additionalProperties: false },
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

  return <main>
    <header className="scoreboard" aria-label="游戏分数">
      <div><span>总分数</span><strong>{stats.score.toLocaleString()}</strong></div>
      <div><span>历史最高</span><strong>{stats.best.toLocaleString()}</strong></div>
      <div><span>历史最大</span><strong>{stats.max ? SCHOOLS[stats.max - 1] : '—'}</strong></div>
    </header>
    <div className="basket"><canvas ref={canvas} width={800} height={650} tabIndex={0}
      aria-label="大学校徽球合成游戏区域。点击空位生成球；方向键移动落点，空格或回车生成。"
      onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); pointer.current = { x: (e.clientX-r.left)*800/r.width, y: (e.clientY-r.top)*650/r.height, visible: true }; }}
      onPointerLeave={() => { pointer.current.visible = false; }}
      onPointerDown={e => { const r = e.currentTarget.getBoundingClientRect(); drop((e.clientX-r.left)*800/r.width, (e.clientY-r.top)*650/r.height); }}
      onKeyDown={e => { const p = pointer.current; if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)) return; e.preventDefault(); p.visible = true; if(e.key==='ArrowLeft')p.x=Math.max(0,p.x-20); if(e.key==='ArrowRight')p.x=Math.min(800,p.x+20); if(e.key==='ArrowUp')p.y=Math.max(0,p.y-20); if(e.key==='ArrowDown')p.y=Math.min(650,p.y+20); if(e.key===' '||e.key==='Enter')drop(p.x,p.y); }}
    /></div>
  </main>;
}
