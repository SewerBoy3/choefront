import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { playPop, playSuccess, playError, playSwoosh, startTetrisBGM, stopTetrisBGM, playTetrisMove, playTetrisRotate, playTetrisLineClear, playGameOver } from '../utils/sounds';
import useStore from '../store/useStore';

// ── Piezas del Tetris ────────────────────────────────────────────
const PIECES = [
  // I
  { matrix: [[1,1,1,1]], color: '#7dd3fc' },
  // O
  { matrix: [[1,1],[1,1]], color: '#fde047' },
  // T
  { matrix: [[0,1,0],[1,1,1]], color: '#d8b4fe' },
  // S
  { matrix: [[0,1,1],[1,1,0]], color: '#86efac' },
  // Z
  { matrix: [[1,1,0],[0,1,1]], color: '#fca5a5' },
  // J
  { matrix: [[1,0,0],[1,1,1]], color: '#93c5fd' },
  // L
  { matrix: [[0,0,1],[1,1,1]], color: '#fdba74' },
];

const COLS = 10;
const ROWS = 20;
const BLOCK = 24;

function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// 7-Bag Randomizer con prevención de repetición consecutiva para máxima variabilidad
function getNextPieceFromBag(state) {
  if (!state.bag || state.bag.length === 0) {
    const indices = [0, 1, 2, 3, 4, 5, 6];
    // Fisher-Yates Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Si la nueva bolsa tiene el primer elemento a sacar (el último porque es pop)
    // igual a la última pieza que salió, lo intercambiamos con otro índice de la bolsa
    if (state.lastPieceIndex !== undefined && indices[indices.length - 1] === state.lastPieceIndex) {
      const swapIdx = Math.floor(Math.random() * 6); // Entre 0 y 5
      [indices[indices.length - 1], indices[swapIdx]] = [indices[swapIdx], indices[indices.length - 1]];
    }
    state.bag = indices;
  }

  let index = state.bag.pop();

  // Si por alguna razón da igual a la última pieza y quedan más en la bolsa, hacemos swap con la primera
  if (state.lastPieceIndex !== undefined && index === state.lastPieceIndex && state.bag.length > 0) {
    const temp = index;
    index = state.bag[0];
    state.bag[0] = temp;
  }

  state.lastPieceIndex = index;
  const p = PIECES[index];
  return {
    matrix: p.matrix.map(r => [...r]),
    color: p.color,
    x: Math.floor(COLS / 2) - Math.floor(p.matrix[0].length / 2),
    y: 0,
  };
}

function rotateCW(matrix) {
  const R = matrix.length, C = matrix[0].length;
  return Array.from({ length: C }, (_, c) =>
    Array.from({ length: R }, (_, r) => matrix[R - 1 - r][c])
  );
}

function fits(grid, piece, dx = 0, dy = 0) {
  if (!piece) return false;
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && grid[ny][nx]) return false;
    }
  }
  return true;
}

function merge(grid, piece) {
  const g = grid.map(r => [...r]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const ny = piece.y + r, nx = piece.x + c;
      if (ny >= 0) g[ny][nx] = piece.color;
    }
  }
  return g;
}

function clearLines(grid) {
  const kept = grid.filter(row => row.some(cell => !cell));
  const cleared = ROWS - kept.length;
  const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { grid: [...newRows, ...kept], lines: cleared };
}

function drawBlock(ctx, x, y, color, size = BLOCK) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 2, y + 2, size - 4, 4);
  ctx.fillRect(x + 2, y + 2, 4, size - 4);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + size - 5, y + 5, 4, size - 6);
  ctx.fillRect(x + 5, y + size - 5, size - 6, 4);
}

const SCORES_PER_LINE = [0, 100, 300, 500, 800];

// Spawn particles on block lock/landing
function spawnLandingParticles(S, piece) {
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (!piece.matrix[r][c]) continue;
      const px = (piece.x + c) * BLOCK + BLOCK / 2;
      const py = (piece.y + r + 1) * BLOCK;
      for (let k = 0; k < 2; k++) {
        S.particles.push({
          x: px + (Math.random() - 0.5) * BLOCK,
          y: py - 2,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -Math.random() * 1.8 - 0.8,
          color: piece.color,
          alpha: 1,
          size: Math.random() * 3 + 2,
          life: 0,
          maxLife: 20
        });
      }
    }
  }
}

// Spawn sparkles on line clear
function spawnLineClearParticles(S, row) {
  const W = COLS * BLOCK;
  for (let i = 0; i < 30; i++) {
    const px = Math.random() * W;
    const py = row * BLOCK + BLOCK / 2;
    S.particles.push({
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 4.5,
      vy: (Math.random() - 0.5) * 4.5 - 1.5,
      color: ['#fff', '#fde047', '#ff99aa', '#d8b4fe'][Math.floor(Math.random() * 4)],
      alpha: 1,
      size: Math.random() * 4 + 3.2,
      life: 0,
      maxLife: 35
    });
  }
}

export default function TetrisGame() {
  const canvasRef     = useRef(null);
  const previewRef    = useRef(null);
  const rafRef        = useRef(null);
  
  const token = useStore((state) => state.token);
  const setPoints = useStore((state) => state.setPoints);

  const stateRef      = useRef({
    grid: emptyGrid(),
    current: null,
    next: null,
    bag: [],
    score: 0,
    lines: 0,
    level: 1,
    startLevel: 1,
    dropInterval: 600,
    lastDrop: 0,
    state: 'START',
    bestScore: Number(localStorage.getItem('tetris_best') || 0),
    particles: [],
    flashingRows: [],
    animationTimer: 0,
    gridAfterClear: null
  });

  const [uiScore,  setUiScore]  = useState(0);
  const [uiLines,  setUiLines]  = useState(0);
  const [uiLevel,  setUiLevel]  = useState(1);
  const [uiBest,   setUiBest]   = useState(stateRef.current.bestScore);
  const [gameState, setGameState] = useState('START');
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Cargar nivel inicial configurado por administrador
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public-settings`)
      .then(res => res.json())
      .then(data => {
        if (data.tetris_start_level) {
          const startLvl = parseInt(data.tetris_start_level);
          stateRef.current.startLevel = startLvl;
          stateRef.current.level = startLvl;
          stateRef.current.dropInterval = Math.max(80, 600 - (startLvl - 1) * 55);
          setUiLevel(startLvl);
        }
      })
      .catch(() => {});
  }, []);

  // Dibujar el tablero
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const S = stateRef.current;
    const W = COLS * BLOCK, H = ROWS * BLOCK;

    // Fondo
    ctx.fillStyle = '#1a1525';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(W, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, H); ctx.stroke(); }

    // Celdas del grid
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (S.grid[r][c]) drawBlock(ctx, c * BLOCK, r * BLOCK, S.grid[r][c]);
      }
    }

    // Ghost piece (proyección de caída)
    if (S.current && S.state === 'PLAYING') {
      let ghostDy = 0;
      while (fits(S.grid, S.current, 0, ghostDy + 1)) ghostDy++;
      ctx.globalAlpha = 0.2;
      for (let r = 0; r < S.current.matrix.length; r++) {
        for (let c = 0; c < S.current.matrix[r].length; c++) {
          if (!S.current.matrix[r][c]) continue;
          drawBlock(ctx, (S.current.x + c) * BLOCK, (S.current.y + r + ghostDy) * BLOCK, S.current.color);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Pieza actual
    if (S.current) {
      for (let r = 0; r < S.current.matrix.length; r++) {
        for (let c = 0; c < S.current.matrix[r].length; c++) {
          if (!S.current.matrix[r][c]) continue;
          const px = (S.current.x + c) * BLOCK;
          const py = (S.current.y + r) * BLOCK;
          if (py >= 0) drawBlock(ctx, px, py, S.current.color);
        }
      }
    }

    // Dibujar destello de líneas completadas
    if (S.state === 'LINE_CLEAR_ANIMATING' && S.flashingRows && S.flashingRows.length > 0) {
      if (Math.floor(S.animationTimer / 2) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        S.flashingRows.forEach(r => {
          ctx.fillRect(0, r * BLOCK, W, BLOCK);
        });
      }
    }

    // Dibujar y actualizar partículas
    if (S.particles && S.particles.length > 0) {
      for (let i = S.particles.length - 1; i >= 0; i--) {
        const p = S.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravedad
        p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
        p.life++;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);

        if (p.life >= p.maxLife) {
          S.particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Preview pieza siguiente
    const preview = previewRef.current;
    if (preview && S.next) {
      const pc = preview.getContext('2d');
      pc.fillStyle = '#1a1525';
      pc.fillRect(0, 0, preview.width, preview.height);
      const mat = S.next.matrix;
      const offX = Math.floor((4 - mat[0].length) / 2);
      const offY = Math.floor((4 - mat.length) / 2);
      for (let r = 0; r < mat.length; r++) {
        for (let c = 0; c < mat[r].length; c++) {
          if (!mat[r][c]) continue;
          drawBlock(pc, (offX + c) * 20, (offY + r) * 20, S.next.color, 20);
        }
      }
    }
  }, []);

  // Loop principal
  const loop = useCallback((timestamp) => {
    const S = stateRef.current;
    if (S.state !== 'PLAYING' && S.state !== 'LINE_CLEAR_ANIMATING') return;

    // Actualizar partículas durante la animación
    if (S.state === 'LINE_CLEAR_ANIMATING') {
      S.animationTimer--;
      if (S.animationTimer <= 0) {
        S.grid = S.gridAfterClear;
        S.current = S.next;
        S.next = getNextPieceFromBag(S);
        
        if (!fits(S.grid, S.current, 0, 0)) {
          S.state = 'GAMEOVER';
          if (S.score > S.bestScore) {
            S.bestScore = S.score;
            localStorage.setItem('tetris_best', String(S.score));
            setUiBest(S.score);
          }
          setGameState('GAMEOVER');
          stopTetrisBGM();
          playGameOver();
          render();

          if (token && S.score > 0) {
            fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/games/score`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ game_name: 'tetris', score: S.score })
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
          return;
        }
        S.state = 'PLAYING';
        S.lastDrop = timestamp;
      }
      render();
      rafRef.current = requestAnimationFrame(loop);
      return;
    }

    if (timestamp - S.lastDrop > S.dropInterval) {
      S.lastDrop = timestamp;
      if (fits(S.grid, S.current, 0, 1)) {
        S.current.y++;
      } else {
        S.grid = merge(S.grid, S.current);
        
        // Detectar líneas a limpiar
        const clearingLines = [];
        for (let r = 0; r < ROWS; r++) {
          if (S.grid[r].every(cell => cell !== null)) {
            clearingLines.push(r);
          }
        }

        if (clearingLines.length > 0) {
          playTetrisLineClear();
          clearingLines.forEach(r => spawnLineClearParticles(S, r));
          
          const { grid: newGrid } = clearLines(S.grid);
          S.gridAfterClear = newGrid;
          S.flashingRows = clearingLines;
          S.state = 'LINE_CLEAR_ANIMATING';
          S.animationTimer = 15; // 15 frames de destello

          const pts = SCORES_PER_LINE[clearingLines.length] * S.level;
          S.score += pts;
          S.lines += clearingLines.length;
          S.level = 1 + Math.floor(S.lines / 10);
          S.dropInterval = Math.max(80, 600 - (S.level - 1) * 55);
          setUiScore(S.score); setUiLines(S.lines); setUiLevel(S.level);
        } else {
          spawnLandingParticles(S, S.current);
          S.current = S.next;
          S.next = getNextPieceFromBag(S);
          
          if (!fits(S.grid, S.current, 0, 0)) {
            S.state = 'GAMEOVER';
            if (S.score > S.bestScore) {
              S.bestScore = S.score;
              localStorage.setItem('tetris_best', String(S.score));
              setUiBest(S.score);
            }
            setGameState('GAMEOVER');
            stopTetrisBGM();
            playGameOver();
            render();

            if (token && S.score > 0) {
              fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/games/score`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ game_name: 'tetris', score: S.score })
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
            return;
          }
        }
      }
    }

    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [render, token, setPoints]);

  const startGame = useCallback(() => {
    const S = stateRef.current;
    S.grid = emptyGrid();
    S.bag = [];
    S.particles = [];
    S.current = getNextPieceFromBag(S);
    S.next = getNextPieceFromBag(S);
    S.score = 0; S.lines = 0; S.level = S.startLevel;
    S.dropInterval = Math.max(80, 600 - (S.level - 1) * 55); S.lastDrop = 0; S.state = 'PLAYING';
    setUiScore(0); setUiLines(0); setUiLevel(S.level);
    setEarnedPoints(0);
    setGameState('PLAYING');
    playPop();
    startTetrisBGM();
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Pantalla de inicio / game over
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = COLS * BLOCK, H = ROWS * BLOCK;
    ctx.fillStyle = '#1a1525'; ctx.fillRect(0, 0, W, H);

    if (gameState === 'START' || gameState === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = gameState === 'START' ? '#d8b4fe' : '#fca5a5';
      ctx.font = 'bold 13px "Press Start 2P"';
      ctx.fillText(gameState === 'START' ? 'TRETIS RETRO' : 'GAME OVER', W / 2, H / 2 - 40);
      if (gameState === 'GAMEOVER') {
        ctx.fillStyle = '#fff'; ctx.font = '9px "Press Start 2P"';
        ctx.fillText(`SCORE: ${stateRef.current.score}`, W / 2, H / 2 - 10);
        
        if (earnedPoints > 0) {
          ctx.fillStyle = '#ff99aa';
          ctx.font = '7px "Press Start 2P"';
          ctx.fillText(`+${earnedPoints} MONEDAS ♡`, W / 2, H / 2 + 10);
        } else if (stateRef.current.score > 0) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '6px "Press Start 2P"';
          ctx.fillText('JUEGA MAS PARA GANAR MONEDAS', W / 2, H / 2 + 10);
        }
      }
      ctx.fillStyle = '#aaa'; ctx.font = '8px "Press Start 2P"';
      ctx.fillText('PRESIONA ENTER / CLICK', W / 2, H / 2 + 35);
    }
  }, [gameState, earnedPoints]);

  const handleControl = useCallback((code) => {
    const S = stateRef.current;
    if (gameState !== 'PLAYING') {
      if (code === 'Enter' || code === 'Space') startGame();
      return;
    }
    switch (code) {
      case 'ArrowLeft':
        if (fits(S.grid, S.current, -1, 0)) {
          S.current.x--;
          playTetrisMove();
        }
        break;
      case 'ArrowRight':
        if (fits(S.grid, S.current,  1, 0)) {
          S.current.x++;
          playTetrisMove();
        }
        break;
      case 'ArrowDown':
        if (fits(S.grid, S.current, 0, 1)) {
          S.current.y++;
          playTetrisMove();
        } else {
          S.lastDrop = 0;
        }
        break;
      case 'ArrowUp': case 'KeyX': {
        const rot = rotateCW(S.current.matrix);
        const tmp = { ...S.current, matrix: rot };
        const kicks = [0, 1, -1, 2, -2];
        let rotated = false;
        for (const k of kicks) {
          if (fits(S.grid, tmp, k, 0)) {
            S.current.matrix = rot;
            S.current.x += k;
            rotated = true;
            break;
          }
        }
        if (rotated) {
          playTetrisRotate();
        }
        break;
      }
      case 'Space': {
        let dropped = false;
        while (fits(S.grid, S.current, 0, 1)) {
          S.current.y++;
          dropped = true;
        }
        if (dropped) {
          playTetrisMove();
        }
        S.lastDrop = 0;
        break;
      }
    }
    render();
  }, [gameState, startGame, render]);

  // Teclado

  useEffect(() => {
    const onKey = (e) => {
      // Prevent default scrolling for arrow keys and spacebar
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      handleControl(e.code);
    };
    window.addEventListener('keydown', onKey, { passive: false });
    return () => window.removeEventListener('keydown', onKey);
  }, [handleControl]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopTetrisBGM();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1525] flex flex-col items-center justify-start sm:justify-center py-4 sm:py-8 px-2 sm:px-4 select-none custom-cursor-active">
      <div className="w-full max-w-xl mb-3 flex items-center justify-between gap-2">
        <a href="/" onClick={playPop} className="retro-btn inline-flex items-center gap-1.5 text-[7px] sm:text-[9px]">
          <ArrowLeft className="w-3 h-3" /> MENÚ
        </a>
        <div className="font-retro text-[5px] sm:text-[7px] text-slate-400 text-right leading-relaxed">
          <p>← → MOVER · ↑ ROTAR · ↓ BAJAR</p>
          <p className="text-pastel-pink">ESPACIO = CAÍDA INSTANTÁNEA</p>
        </div>
      </div>

      {/* Board + Sidebar: side by side on sm+, stacked below on mobile */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start w-full max-w-xl">
        {/* Tablero */}
        <div className="retro-container p-1.5 sm:p-2 flex-shrink-0">
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK}
            className="block"
            style={{ imageRendering: 'pixelated', width: `min(${COLS * BLOCK}px, calc(100vw - 24px))`, height: 'auto' }}
            onClick={() => gameState !== 'PLAYING' && startGame()}
          />
        </div>

        {/* Panel lateral */}
        <div className="flex flex-row sm:flex-col gap-2 sm:gap-4 w-full sm:min-w-[110px] sm:w-auto">
          {/* NEXT + Stats en fila en mobile */}
          <div className="flex gap-2 sm:flex-col sm:gap-4 flex-1">
            {/* NEXT */}
            <div className="retro-container p-2 sm:p-3 flex-shrink-0">
              <p className="font-retro text-[6px] sm:text-[7px] text-slate-400 mb-1 sm:mb-2">NEXT</p>
              <canvas ref={previewRef} width={80} height={80} className="block w-14 h-14 sm:w-20 sm:h-20" style={{ imageRendering: 'pixelated' }} />
            </div>
            {/* Stats */}
            <div className="retro-container p-2 sm:p-3 flex flex-wrap sm:block gap-x-4 gap-y-1 sm:space-y-3 flex-1">
              {[['SC', uiScore], ['HI', uiBest], ['LN', uiLines], ['LV', uiLevel]].map(([label, val]) => (
                <div key={label}>
                  <p className="font-retro text-[5px] sm:text-[6px] text-slate-400">{label}</p>
                  <p className="font-retro text-[9px] sm:text-[11px] text-white">{val}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Controles rápidos — hidden on very small, shown on sm */}
          <div className="retro-container p-2 sm:p-3 space-y-1 sm:space-y-1.5 hidden xs:block">
            {[['↑','ROTAR'],['← →','MOVER'],['↓','BAJAR'],['SPC','DROP']].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center gap-2">
                <span className="font-retro text-[5px] sm:text-[6px] text-pastel-pink">{k}</span>
                <span className="font-retro text-[5px] sm:text-[6px] text-slate-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controles móviles en pantalla (solo visibles en mobile) */}
      <div className="flex sm:hidden flex-row justify-between w-full max-w-xl mt-4 px-2 gap-4">
        {/* Cruceta Izquierda */}
        <div className="flex gap-1 items-end">
          <button 
            className="retro-btn w-12 h-12 flex items-center justify-center select-none touch-none active:scale-95 bg-[#2a223a] border-[#3a324a] text-white"
            onPointerDown={(e) => { e.preventDefault(); handleControl('ArrowLeft'); }}
          >
            <span className="text-xl leading-none">←</span>
          </button>
          <button 
            className="retro-btn w-12 h-12 flex items-center justify-center select-none touch-none active:scale-95 bg-[#2a223a] border-[#3a324a] text-white"
            onPointerDown={(e) => { e.preventDefault(); handleControl('ArrowDown'); }}
          >
            <span className="text-xl leading-none">↓</span>
          </button>
          <button 
            className="retro-btn w-12 h-12 flex items-center justify-center select-none touch-none active:scale-95 bg-[#2a223a] border-[#3a324a] text-white"
            onPointerDown={(e) => { e.preventDefault(); handleControl('ArrowRight'); }}
          >
            <span className="text-xl leading-none">→</span>
          </button>
        </div>

        {/* Botones de Acción Derecha */}
        <div className="flex gap-2 items-end">
          <button 
            className="retro-btn w-14 h-14 flex items-center justify-center select-none touch-none active:scale-95 bg-[#2a223a] border-[#3a324a] text-pastel-pink"
            onPointerDown={(e) => { e.preventDefault(); handleControl('Space'); }}
          >
            <span className="font-retro text-[8px]">DROP</span>
          </button>
          <button 
            className="retro-btn w-14 h-14 flex items-center justify-center select-none touch-none active:scale-95 bg-pastel-pink border-pink-400 text-black mb-4"
            onPointerDown={(e) => { e.preventDefault(); handleControl('ArrowUp'); }}
          >
            <span className="font-retro text-[8px]">ROT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
