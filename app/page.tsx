'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore
import { World, RADII } from './physics.mjs';

const SCHOOLS = ['西安交通大学','武汉大学','哈尔滨工业大学','中国人民大学','北京理工大学','浙江大学','上海交通大学','复旦大学','北京大学','清华大学','中国科学院大学'];
const COLORS = ['#b83d3e','#57709e','#204d7b','#2c68a0','#4c7669','#355bb0','#aa3639','#3d84c6','#bc4b5b','#a26d78','#7c9cdb'];
const WORLD_WIDTH = 420;
const WORLD_HEIGHT = 651;
const DROP_LINE_Y = 110;
const EASTER_LEVEL = 8;

function spawnY(level: number) {
  const radius = RADII[level];
  return Math.max(radius, DROP_LINE_Y - radius - 6);
}

export default function Game() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<any>(null);
  const next = useRef(0);
  const pointerX = useRef(WORLD_WIDTH / 2);
  const pressedPointer = useRef<number | null>(null);
  const easterActive = useRef(false);
  const maxClickStreak = useRef(0);
  const records = useRef({ best: 0, max: 0 });
  const [stats, setStats] = useState({ score: 0, best: 0, max: 0 });

  function drop(x: number) {
    const level = next.current;
    if (world.current?.spawn(x, spawnY(level), level)) {
      next.current = easterActive.current ? EASTER_LEVEL : Math.floor(Math.random() * 5);
    }
  }

  function restart() {
    world.current = new World(WORLD_WIDTH, WORLD_HEIGHT);
    next.current = easterActive.current ? EASTER_LEVEL : Math.floor(Math.random() * 5);
    pointerX.current = WORLD_WIDTH / 2;
    setStats(current => ({ ...current, score: 0 }));
  }

  function handleMaxClick() {
    if (easterActive.current) {
      easterActive.current = false;
      next.current = Math.floor(Math.random() * 5);
      maxClickStreak.current = 0;
      return;
    }
    maxClickStreak.current += 1;
    if (maxClickStreak.current === 10) {
      easterActive.current = true;
      next.current = EASTER_LEVEL;
      maxClickStreak.current = 0;
    }
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
    const celebratedBalls = new WeakSet<object>();
    const celebrations: Array<{
      x: number;
      y: number;
      startedAt: number;
      explosion: boolean;
      particles: Array<{ angle: number; speed: number; spin: number; size: number; color: string }>;
    }> = [];
    const celebrationColors = ['#f04444','#ffb21c','#6857d9','#29b66f','#2c8ee6','#f46bb1'];
    const logoSprites: (HTMLCanvasElement | null)[] = SCHOOLS.map(() => null);
    SCHOOLS.forEach((_, i) => {
      const image = new Image();
      image.src = `/logos/${i + 1}.svg`;
      image.onload = () => {
        const radius = RADII[i];
        const diameter = radius * 2;
        const sprite = document.createElement('canvas');
        sprite.width = Math.ceil(diameter * pixelRatio);
        sprite.height = Math.ceil(diameter * pixelRatio);
        const spriteCtx = sprite.getContext('2d')!;
        spriteCtx.scale(pixelRatio, pixelRatio);
        spriteCtx.imageSmoothingEnabled = true;
        spriteCtx.imageSmoothingQuality = 'high';
        spriteCtx.beginPath();
        spriteCtx.arc(radius, radius, radius, 0, Math.PI * 2);
        spriteCtx.fillStyle = '#fff';
        spriteCtx.fill();
        spriteCtx.clip();
        const ratio = Math.max(diameter / image.naturalWidth, diameter / image.naturalHeight);
        const width = image.naturalWidth * ratio;
        const height = image.naturalHeight * ratio;
        spriteCtx.drawImage(image, radius - width / 2, radius - height / 2, width, height);
        spriteCtx.beginPath();
        spriteCtx.arc(radius, radius, radius - .75, 0, Math.PI * 2);
        spriteCtx.strokeStyle = 'rgba(31, 53, 64, 0.18)';
        spriteCtx.lineWidth = 1.5;
        spriteCtx.stroke();
        logoSprites[i] = sprite;
      };
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
      setStats(current => current.score === w.score && current.best === best && current.max === max
        ? current
        : { score: w.score, best, max });
    };
    records.current = readRecords();
    setStats({ score: 0, ...records.current });

    const drawBall = (b: any, scale = 1, alpha = 1) => {
      const sprite = logoSprites[b.level];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(b.x, b.y);
      ctx.scale(scale, scale);
      ctx.translate(-b.x, -b.y);
      if (sprite) ctx.drawImage(sprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.restore();
    };

    const launchCelebration = (ball: any, time: number, explosion = false, count = 72) => {
      celebratedBalls.add(ball);
      celebrations.push({
        x: ball.x,
        y: ball.y,
        startedAt: time,
        explosion,
        particles: Array.from({ length: count }, (_, i) => ({
          angle: (Math.PI * 2 * i) / count + (Math.random() - .5) * .18,
          speed: 85 + Math.random() * 155,
          spin: (Math.random() - .5) * 12,
          size: 3 + Math.random() * 5,
          color: celebrationColors[i % celebrationColors.length],
        })),
      });
    };

    const drawCelebrations = (time: number) => {
      for (let i = celebrations.length - 1; i >= 0; i--) {
        const burst = celebrations[i];
        const elapsed = (time - burst.startedAt) / 1000;
        if (elapsed >= 1.35) { celebrations.splice(i, 1); continue; }
        const alpha = Math.min(1, (1.35 - elapsed) / .35);
        ctx.save();
        ctx.globalAlpha = alpha;
        if (elapsed < .65) {
          const ring = 24 + elapsed * 150;
          ctx.beginPath();
          ctx.arc(burst.x, burst.y, ring, 0, Math.PI * 2);
          ctx.strokeStyle = '#fff4a3';
          ctx.lineWidth = 5 * (1 - elapsed / .65);
          ctx.stroke();
        }
        for (const particle of burst.particles) {
          const distance = particle.speed * elapsed;
          const x = burst.x + Math.cos(particle.angle) * distance;
          const y = burst.y + Math.sin(particle.angle) * distance + 105 * elapsed * elapsed;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(particle.spin * elapsed);
          ctx.fillStyle = particle.color;
          ctx.fillRect(-particle.size / 2, -particle.size, particle.size, particle.size * 2);
          ctx.restore();
        }
        const pop = Math.min(1, elapsed / .18);
        ctx.translate(burst.x, burst.y - 92 - Math.sin(Math.min(1, elapsed) * Math.PI) * 25);
        ctx.scale(.6 + .4 * pop, .6 + .4 * pop);
        ctx.font = '42px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (!burst.explosion) ctx.fillText('🎉', 0, 0);
        ctx.restore();
      }
    };

    let frame = 0, previous = 0, accumulator = 0, lastUI = 0;
    let dangerSeconds = 0;
    let trackedWorld = world.current;
    const ballAges = new WeakMap<object, number>();
    const draw = (time: number) => {
      if (!previous) previous = time;
      accumulator += Math.min((time - previous) / 1000, 0.05);
      previous = time;
      const w = world.current;
      if (trackedWorld !== w) { dangerSeconds = 0; trackedWorld = w; celebrations.length = 0; }
      while (accumulator >= 1 / 120) {
        w.step(); accumulator -= 1 / 120;
        let overLine = false;
        for (const ball of w.balls) {
          const age = (ballAges.get(ball) ?? 0) + 1 / 120;
          ballAges.set(ball, age);
          const touchesLine = ball.y - ball.r <= DROP_LINE_Y && ball.y + ball.r >= DROP_LINE_Y;
          if (touchesLine || (age >= 1.5 && ball.y - ball.r <= DROP_LINE_Y)) overLine = true;
        }
        dangerSeconds = overLine ? dangerSeconds + 1 / 120 : 0;
        if (dangerSeconds >= 3) {
          const particleCount = Math.max(4, Math.min(24, Math.floor(600 / w.balls.length)));
          for (const ball of w.balls) launchCelebration(ball, time, true, particleCount);
          w.balls = [];
          dangerSeconds = 0;
          break;
        }
      }
      for (const ball of w.balls) {
        if (ball.level === 10 && !celebratedBalls.has(ball)) launchCelebration(ball, time);
      }
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.save();
      ctx.setLineDash([8, 7]);
      ctx.strokeStyle = 'rgba(76, 92, 69, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, DROP_LINE_Y); ctx.lineTo(WORLD_WIDTH, DROP_LINE_Y);
      const previewRadius = RADII[next.current];
      const previewX = Math.max(previewRadius, Math.min(WORLD_WIDTH - previewRadius, pointerX.current));
      ctx.moveTo(previewX, DROP_LINE_Y); ctx.lineTo(previewX, WORLD_HEIGHT);
      ctx.stroke();
      ctx.restore();
      if (dangerSeconds >= 1) {
        ctx.save();
        ctx.fillStyle = '#ff202b';
        ctx.globalAlpha = .25 + .4 * (Math.sin(time / 80) + 1) / 2;
        ctx.fillRect(0, DROP_LINE_Y - 10, WORLD_WIDTH, 20);
        ctx.setLineDash([8, 7]);
        ctx.strokeStyle = '#ef3038';
        ctx.globalAlpha = .7 + .3 * (Math.sin(time / 80) + 1) / 2;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(0, DROP_LINE_Y); ctx.lineTo(WORLD_WIDTH, DROP_LINE_Y); ctx.stroke();
        ctx.restore();
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
      drawCelebrations(time);
      const r = RADII[next.current];
      drawBall({ x: Math.max(r, Math.min(WORLD_WIDTH - r, pointerX.current)), y: spawnY(next.current), r, level: next.current }, 1, 0.5);
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
        description: '在游戏区域指定横向位置放下下一颗大学校徽球，x 范围为 0–420。',
        inputSchema: { type: 'object', properties: { x: { type: 'number', minimum: 0, maximum: 420 } }, required: ['x'], additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute: (input: any) => {
          if (!input || !Number.isFinite(input.x)) throw new Error('无效坐标');
          const before = world.current.balls.length; drop(input.x);
          return { created: world.current.balls.length > before };
        },
      }, { signal: lifecycle.signal })).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);

  return <main className="app" onPointerDownCapture={event => {
    if (!(event.target as Element).closest('.max-metric')) maxClickStreak.current = 0;
  }}>
    <header className="topbar" aria-label="游戏信息">
      <div className="brand">
        <h1>合成国科大</h1>
        <p>点击空位·校徽相遇合成</p>
      </div>
      <div className="metric metric-score" title={`得分：${stats.score.toLocaleString()}`}><span>得分</span><strong>{stats.score.toLocaleString()}</strong></div>
      <div className="metric" title={`历史最高：${stats.best.toLocaleString()}`}><span>最高</span><strong>{stats.best.toLocaleString()}</strong></div>
      <button className="metric max-metric" type="button" onClick={handleMaxClick} title={stats.max ? `历史最大：${SCHOOLS[stats.max - 1]}` : '尚无历史最大校徽'}>
        <span>最大</span>
        {stats.max ? <img src={`/logos/${stats.max}.svg`} alt={SCHOOLS[stats.max - 1]} /> : <strong>—</strong>}
      </button>
      <button className="restart-button" type="button" onClick={restart} aria-label="重新开始游戏">重开</button>
    </header>
    <div className="basket"><canvas ref={canvas} width={WORLD_WIDTH} height={WORLD_HEIGHT} tabIndex={0}
      aria-label="大学校徽球合成游戏区域。移动指针选择落点，点击放下球；左右方向键移动落点，空格或回车放下。"
      onPointerMove={e => { const bounds = e.currentTarget.getBoundingClientRect(); pointerX.current = (e.clientX-bounds.left)*WORLD_WIDTH/bounds.width; }}
      onPointerDown={e => {
        if (!e.isPrimary || e.button !== 0) return;
        pressedPointer.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const bounds = e.currentTarget.getBoundingClientRect();
        pointerX.current = (e.clientX-bounds.left)*WORLD_WIDTH/bounds.width;
      }}
      onPointerUp={e => {
        if (pressedPointer.current !== e.pointerId) return;
        pressedPointer.current = null;
        const bounds = e.currentTarget.getBoundingClientRect();
        pointerX.current = (e.clientX-bounds.left)*WORLD_WIDTH/bounds.width;
        if (e.clientX >= bounds.left && e.clientX <= bounds.right && e.clientY >= bounds.top && e.clientY <= bounds.bottom) drop(pointerX.current);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => { pressedPointer.current = null; }}
      onLostPointerCapture={() => { pressedPointer.current = null; }}
      onKeyDown={e => { if (!['ArrowLeft','ArrowRight',' ','Enter'].includes(e.key)) return; e.preventDefault(); if(e.key==='ArrowLeft')pointerX.current=Math.max(0,pointerX.current-20); if(e.key==='ArrowRight')pointerX.current=Math.min(WORLD_WIDTH,pointerX.current+20); if(e.key===' '||e.key==='Enter')drop(pointerX.current); }}
    /></div>
  </main>;
}
