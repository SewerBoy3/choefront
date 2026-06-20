import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { playPop, playSuccess, playError, startDinoBGM, stopDinoBGM, playDinoJump, playDinoCoin, playDinoHit } from '../utils/sounds';
import useStore from '../store/useStore';

// ─────────────────────────────────────────────────────────────────
// SPRITES  (filas × columnas, 0=transparente, 1..N = colores)
// ─────────────────────────────────────────────────────────────────
const DINO_RUN_A = [
  [0,0,0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,0],
  [0,0,1,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,3,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,0,1,1,0,0,0],
  [0,0,1,1,0,0,0,0,0,0],
  [0,0,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
const DINO_RUN_B = [
  [0,0,0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,0],
  [0,0,1,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,3,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,0,1,1,0,0,0],
  [0,0,0,0,0,1,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
const DINO_JUMP = [
  [0,0,0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,0],
  [0,0,1,2,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,3,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,0,0,1,0,0,0],
  [0,1,0,0,0,0,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
const DINO_DEAD = [
  [0,0,0,1,1,1,1,1,0,0],
  [0,0,1,1,1,1,1,1,1,0],
  [0,0,1,3,1,1,1,1,1,0],
  [0,0,1,1,1,3,1,3,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,1,1,1,1,0,0],
  [1,1,1,1,0,1,1,0,0,0],
  [0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0],
];
// Cactus pequeño
const CACTUS_S = [
  [0,0,1,1,0,0],
  [0,1,1,1,0,0],
  [0,1,1,1,1,0],
  [0,1,1,1,1,0],
  [1,1,1,1,0,0],
  [0,0,1,1,0,0],
  [0,0,1,1,0,0],
  [0,0,1,1,0,0],
];
// Cactus grande
const CACTUS_L = [
  [0,0,0,1,1,0,0,0],
  [0,1,0,1,1,0,1,0],
  [0,1,0,1,1,0,1,0],
  [0,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,1,1,0,0,0],
  [0,0,0,1,1,0,0,0],
];
// Pájaro (dos frames)
const BIRD_A = [
  [0,0,1,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,0,0],
  [1,1,1,2,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,0,0,0,0],
];
const BIRD_B = [
  [0,0,0,0,0,0,0,0,0,0],
  [1,1,0,0,0,0,1,1,0,0],
  [1,1,1,2,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,0,0,0],
  [0,0,0,1,1,1,0,0,0,0],
];
// Moneda / power-up
const COIN = [
  [0,1,1,1,0],
  [1,4,4,4,1],
  [1,4,4,4,1],
  [1,4,4,4,1],
  [0,1,1,1,0],
];

function drawSprite(ctx, matrix, x, y, size, colors) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const ps = size / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = matrix[r][c];
      if (v !== 0 && colors[v]) {
        ctx.fillStyle = colors[v];
        ctx.fillRect(Math.round(x + c * ps), Math.round(y + r * ps), Math.ceil(ps), Math.ceil(ps));
      }
    }
  }
}

const DINO_COLORS = { 1: '#4ade80', 2: '#000', 3: '#dc2626' };
const CACTUS_COLORS = { 1: '#16a34a' };
const BIRD_COLORS   = { 1: '#6366f1', 2: '#fff' };
const COIN_COLORS   = { 1: '#ca8a04', 4: '#fde047' };

// Tipos de obstáculos con variedad
const OBS_TYPES = [
  { kind: 'cactus_s', matrix: CACTUS_S, w: 24, h: 32, ground: true },
  { kind: 'cactus_l', matrix: CACTUS_L, w: 32, h: 40, ground: true },
  { kind: 'cactus_s', matrix: CACTUS_S, w: 24, h: 32, ground: true }, // más frecuente
  { kind: 'bird',     matrix: BIRD_A,   w: 40, h: 20, ground: false, heightOffset: 28 },
  { kind: 'bird',     matrix: BIRD_A,   w: 40, h: 20, ground: false, heightOffset: 10 },
];

// ─────────────────────────────────────────────────────────────────
export default function SecretGame() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  
  const token = useStore((state) => state.token);
  const setPoints = useStore((state) => state.setPoints);
  
  const G = useRef({
    state: 'START', score: 0, bestScore: Number(localStorage.getItem('sigma_best') || 0),
    frame: 0, speed: 3.8, jumpCount: 0,
    hero: { x: 60, y: 0, vy: 0, w: 40, h: 40, onGround: true, spriteFrame: 0 },
    obstacles: [], coins: [],
    groundY: 160, W: 600, H: 220,
    bgX: 0, mountainX: 0, cloudX: 0,
    shakeFrames: 0,
    invincible: 0,
    timeSinceLastSpawn: 0,
    speedMultiplier: 1.0,
  });

  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest,  setDisplayBest]  = useState(G.current.bestScore);
  const [gameState,    setGameState]    = useState('START');
  const [combo,        setCombo]        = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Cargar modificador de velocidad del administrador
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.dino_speed_multiplier) {
          G.current.speedMultiplier = parseFloat(data.dino_speed_multiplier);
        }
      })
      .catch(() => {});
  }, []);

  // ── Salto (doble salto disponible) ──
  const jump = useCallback(() => {
    const g = G.current;
    if (g.state === 'START')     { startGame(); return; }
    if (g.state === 'GAMEOVER')  { startGame(); return; }
    if (g.state !== 'PLAYING')   return;
    if (g.hero.onGround || g.jumpCount < 2) {
      g.hero.vy = g.hero.onGround ? -14.5 : -11.5;
      g.hero.onGround = false;
      g.jumpCount++;
      playDinoJump();
    }
  }, []);

  const startGame = useCallback(() => {
    const g = G.current;
    Object.assign(g, {
      state: 'PLAYING', score: 0, frame: 0, speed: 3.8,
      obstacles: [], coins: [], bgX: 0, mountainX: 0, cloudX: 0,
      shakeFrames: 0, invincible: 0, jumpCount: 0, timeSinceLastSpawn: 0
    });
    g.hero.y  = g.groundY;
    g.hero.vy = 0;
    g.hero.onGround = true;
    g.hero.spriteFrame = 0;
    setDisplayScore(0);
    setGameState('PLAYING');
    setCombo(0);
    setEarnedPoints(0);
    playPop();
    startDinoBGM();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const triggerGameOver = useCallback(() => {
    const g = G.current;
    g.state = 'GAMEOVER';
    g.shakeFrames = 12;
    setGameState('GAMEOVER');
    cancelAnimationFrame(rafRef.current);
    stopDinoBGM();
    playDinoHit();
    
    if (g.score > g.bestScore) {
      g.bestScore = g.score;
      setDisplayBest(g.score);
      localStorage.setItem('sigma_best', String(g.score));
      setTimeout(playSuccess, 250);
    }

    // Registrar puntuación en el servidor
    if (token && g.score > 0) {
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/games/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ game_name: 'dino', score: g.score })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPoints(data.totalPoints);
          setEarnedPoints(data.pointsAwarded);
        }
      })
      .catch(err => console.error('Error al guardar score:', err));
    }
  }, [token, setPoints]);

  // ── Loop del juego ──
  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = G.current;

    g.frame++;
    g.score++;
    setDisplayScore(g.score);

    // Velocidad progresiva y balanceada para que no sea frenético, multiplicada por el modificador
    g.speed = Math.min(7.5, 3.8 + g.score / 1400) * g.speedMultiplier;

    // Shake de pantalla
    let sx = 0, sy = 0;
    if (g.shakeFrames > 0) {
      sx = (Math.random() - 0.5) * 8;
      sy = (Math.random() - 0.5) * 8;
      g.shakeFrames--;
    }
    ctx.save();
    ctx.translate(sx, sy);

    // ── Fondo en capas (parallax) ──
    // Cielo
    ctx.fillStyle = '#ffe4ec';
    ctx.fillRect(-10, 0, g.W + 20, g.H);

    // Montañas (parallax lento)
    g.mountainX = (g.mountainX - g.speed * 0.2 + g.W) % g.W;
    ctx.fillStyle = '#d8bfd8';
    for (let mx = g.mountainX - g.W; mx < g.W * 2; mx += 120) {
      ctx.beginPath();
      ctx.moveTo(mx, g.groundY + g.hero.h);
      ctx.lineTo(mx + 60, g.groundY + g.hero.h - 55);
      ctx.lineTo(mx + 120, g.groundY + g.hero.h);
      ctx.fill();
    }

    // Nubes (parallax medio)
    g.cloudX = (g.cloudX - g.speed * 0.4 + g.W * 2) % (g.W * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let cx = g.cloudX - g.W; cx < g.W * 2; cx += 200) {
      ctx.fillRect(cx, 18, 44, 12);
      ctx.fillRect(cx + 8, 10, 28, 12);
    }

    // ── Suelo ──
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(0, g.groundY + g.hero.h, g.W, 4);
    ctx.fillStyle = '#a855f7';
    g.bgX = (g.bgX - g.speed + g.W) % 40;
    for (let tx = g.bgX - 40; tx < g.W; tx += 40) {
      ctx.fillRect(tx, g.groundY + g.hero.h + 4, 20, 6);
    }

    // ── Héroe ──
    const GRAVITY = 0.72;
    if (!g.hero.onGround) {
      g.hero.vy += GRAVITY;
      g.hero.y  += g.hero.vy;
    }
    if (g.hero.y >= g.groundY) {
      g.hero.y = g.groundY; g.hero.vy = 0;
      g.hero.onGround = true; g.jumpCount = 0;
    }

    // Animar frame de sprite
    if (g.frame % 6 === 0) g.hero.spriteFrame = (g.hero.spriteFrame + 1) % 2;
    const dinoSprite = g.hero.onGround
      ? (g.hero.spriteFrame === 0 ? DINO_RUN_A : DINO_RUN_B)
      : DINO_JUMP;

    // Parpadeo cuando es invencible
    const drawHero = g.invincible === 0 || g.frame % 4 < 2;
    if (drawHero) {
      drawSprite(ctx, dinoSprite, g.hero.x, g.hero.y, g.hero.h, DINO_COLORS);
    }
    if (g.invincible > 0) g.invincible--;

    // ── Generar obstáculos basados en tiempo transcurrido, no en modulo simple ──
    g.timeSinceLastSpawn++;
    const spawnCooldown = Math.max(120, 190 - Math.floor(g.score / 600));
    if (g.timeSinceLastSpawn >= spawnCooldown) {
      g.timeSinceLastSpawn = 0;
      const tpl = OBS_TYPES[Math.floor(Math.random() * OBS_TYPES.length)];
      const y = tpl.ground
        ? g.groundY + g.hero.h - tpl.h
        : g.groundY + g.hero.h - tpl.h - (tpl.heightOffset || 0);
      g.obstacles.push({ ...tpl, x: g.W + 20, y, frame: 0 });
    }

    // ── Generar monedas ──
    if (g.frame % 180 === 90) {
      g.coins.push({ x: g.W + 20, y: g.groundY - 30 + Math.random() * -30, collected: false });
    }

    // ── Actualizar obstáculos ──
    const margin = 7;
    for (let i = g.obstacles.length - 1; i >= 0; i--) {
      const o = g.obstacles[i];
      o.x -= g.speed;
      o.frame++;

      // Elegir sprite (pájaro alterna frames)
      let mat = o.matrix;
      if (o.kind === 'bird') mat = o.frame % 16 < 8 ? BIRD_A : BIRD_B;

      const colors = o.kind === 'bird' ? BIRD_COLORS : CACTUS_COLORS;
      drawSprite(ctx, mat, o.x, o.y, o.h, colors);

      // Colisión (sin invencibilidad)
      if (g.invincible === 0 &&
        g.hero.x + margin < o.x + o.w - margin &&
        g.hero.x + g.hero.w - margin > o.x + margin &&
        g.hero.y + margin < o.y + o.h - margin &&
        g.hero.y + g.hero.h > o.y + margin
      ) {
        drawSprite(ctx, DINO_DEAD, g.hero.x, g.hero.y, g.hero.h, DINO_COLORS);
        ctx.restore();
        triggerGameOver();
        return;
      }

      if (o.x + o.w < 0) g.obstacles.splice(i, 1);
    }

    // ── Monedas ──
    for (let i = g.coins.length - 1; i >= 0; i--) {
      const c = g.coins[i];
      if (c.collected) { g.coins.splice(i, 1); continue; }
      c.x -= g.speed;
      drawSprite(ctx, COIN, c.x, c.y, 20, COIN_COLORS);

      // Recoger moneda
      if (
        g.hero.x + 6 < c.x + 18 && g.hero.x + g.hero.w > c.x + 2 &&
        g.hero.y + 4 < c.y + 18 && g.hero.y + g.hero.h > c.y + 2
      ) {
        c.collected = true;
        g.score += 25;
        g.invincible = 60; // 1s de invencibilidad al recoger moneda
        setCombo(prev => prev + 1);
        playDinoCoin();
      }

      if (c.x + 20 < 0) g.coins.splice(i, 1);
    }

    // ── HUD dentro del canvas ──
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(4, 4, 160, 24);
    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`SC:${g.score}  HI:${g.bestScore}`, 10, 20);
    if (g.invincible > 0) {
      ctx.fillStyle = '#fde047';
      ctx.fillText('★ INVENCIBLE!', g.W / 2 - 55, 20);
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(loop);
  }, [triggerGameOver]);

  // Pantalla de inicio / game over
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = G.current;

    if (gameState === 'START') {
      ctx.fillStyle = '#ffe4ec';
      ctx.fillRect(0, 0, g.W, g.H);
      ctx.fillStyle = '#d8bfd8';
      for (let mx = 0; mx < g.W; mx += 120) {
        ctx.beginPath(); ctx.moveTo(mx, g.groundY + g.hero.h);
        ctx.lineTo(mx + 60, g.groundY + g.hero.h - 55);
        ctx.lineTo(mx + 120, g.groundY + g.hero.h); ctx.fill();
      }
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(0, g.groundY + g.hero.h, g.W, 4);
      drawSprite(ctx, DINO_RUN_A, g.hero.x, g.groundY, g.hero.h, DINO_COLORS);
      ctx.fillStyle = '#000'; ctx.textAlign = 'center';
      ctx.font = '13px "Press Start 2P"';
      ctx.fillText('★ DINO SIGMA ★', g.W / 2, 52);
      ctx.font = '7px "Press Start 2P"';
      ctx.fillText('ESPACIO / TOCA PARA COMENZAR', g.W / 2, 78);
      ctx.font = '6px "Press Start 2P"';
      ctx.fillStyle = '#666';
      ctx.fillText('DOBLE SALTO  ·  RECOGE ★ MONEDAS PARA INVENCIBILIDAD', g.W / 2, 98);
    }

    if (gameState === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, g.W, g.H);
      drawSprite(ctx, DINO_DEAD, g.hero.x, g.groundY, g.hero.h, DINO_COLORS);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.font = '16px "Press Start 2P"';
      ctx.fillText('GAME OVER', g.W / 2, 72);
      ctx.font = '9px "Press Start 2P"';
      ctx.fillText(`SCORE: ${G.current.score}`, g.W / 2, 98);
      
      if (earnedPoints > 0) {
        ctx.fillStyle = '#ff99aa';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText(`+${earnedPoints} MONEDAS DE AMOR ♡`, g.W / 2, 118);
      } else if (G.current.score > 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText('JUEGA MAS PARA GANAR MONEDAS', g.W / 2, 118);
      }
      
      ctx.fillStyle = '#ccc'; ctx.font = '7px "Press Start 2P"';
      ctx.fillText('ESPACIO = REINICIAR', g.W / 2, 148);
    }
  }, [gameState, earnedPoints]);

  // Ajustar groundY al montar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = G.current;
    g.W = canvas.width; g.H = canvas.height;
    g.groundY = g.H - g.hero.h - 20;
    g.hero.y  = g.groundY;
  }, []);

  // Teclado
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); jump(); }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(rafRef.current);
      stopDinoBGM();
    };
  }, [jump]);

  return (
    <div className="min-h-screen bg-[#1a1525] flex flex-col items-center justify-start sm:justify-center py-4 sm:py-8 px-2 sm:px-4 select-none custom-cursor-active">
      <div className="w-full max-w-2xl mb-3 flex items-center justify-between gap-2">
        <a href="/" onClick={playPop} className="retro-btn inline-flex items-center gap-1.5 text-[7px] sm:text-[9px]">
          <ArrowLeft className="w-3 h-3" /> MENÚ
        </a>
        <div className="font-retro text-[5px] sm:text-[7px] text-slate-400 text-right leading-relaxed">
          <p>ESPACIO / ↑ = SALTAR (DOBLE SALTO)</p>
          <p className="text-pastel-pink">MONEDA ★ = INVENCIBILIDAD</p>
        </div>
      </div>

      <div className="retro-container p-2 sm:p-4 w-full max-w-2xl">
        <div className="flex justify-between font-retro text-[7px] sm:text-[9px] text-white mb-2 sm:mb-3 px-1">
          <span className="flex items-center gap-1.5">
            <Gamepad2 className="w-3 h-3 text-pastel-pink animate-pulse" /> SIGMA RUNNER
          </span>
          <div className="flex gap-2 sm:gap-4">
            <span>SC <span className="text-pastel-pink">{displayScore}</span></span>
            <span>HI <span className="text-pastel-blue">{displayBest}</span></span>
            {combo > 0 && <span>X<span className="text-yellow-300 animate-pulse">{combo}</span></span>}
          </div>
        </div>

        <div className="game-canvas-wrap border-4 border-white overflow-hidden">
          <canvas ref={canvasRef} width={600} height={200} className="w-full block"
            style={{ imageRendering: 'pixelated', touchAction: 'none' }}
            onClick={jump}
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
          />
        </div>

        <p className="text-center mt-2 font-retro text-[5px] sm:text-[6px] text-slate-500 leading-relaxed">
          RECOGE MONEDAS PARA INVENCIBILIDAD · ESQUIVA PAJAROS Y CACTUS · DOBLE SALTO
        </p>
      </div>
    </div>
  );
}
