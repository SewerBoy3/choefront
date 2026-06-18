import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { playPop, playSuccess, playError, playSwoosh } from '../utils/sounds';
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
    if (S.state !== 'PLAYING') return;

    if (timestamp - S.lastDrop > S.dropInterval) {
      S.lastDrop = timestamp;
      if (fits(S.grid, S.current, 0, 1)) {
        S.current.y++;
      } else {
        // Bloquear pieza
        S.grid = merge(S.grid, S.current);
        const { grid: newGrid, lines } = clearLines(S.grid);
        S.grid = newGrid;
        if (lines > 0) {
          const pts = SCORES_PER_LINE[lines] * S.level;
          S.score += pts;
          S.lines += lines;
          S.level = 1 + Math.floor(S.lines / 10);
          S.dropInterval = Math.max(80, 600 - (S.level - 1) * 55);
          setUiScore(S.score); setUiLines(S.lines); setUiLevel(S.level);
          playPop();
          if (lines >= 4) playSuccess();
        }
        S.current = S.next;
        S.next    = getNextPieceFromBag(S);
        // Game over
        if (!fits(S.grid, S.current, 0, 0)) {
          S.state = 'GAMEOVER';
          if (S.score > S.bestScore) {
            S.bestScore = S.score;
            localStorage.setItem('tetris_best', String(S.score));
            setUiBest(S.score);
          }
          setGameState('GAMEOVER');
          playError();
          render();

          // Reportar puntuación del Tetris al servidor
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

    render();
    rafRef.current = requestAnimationFrame(loop);
  }, [render, token, setPoints]);

  const startGame = useCallback(() => {
    const S = stateRef.current;
    S.grid = emptyGrid();
    S.bag = []; // Reiniciar bolsa
    S.current = getNextPieceFromBag(S);
    S.next = getNextPieceFromBag(S);
    S.score = 0; S.lines = 0; S.level = S.startLevel;
    S.dropInterval = Math.max(80, 600 - (S.level - 1) * 55); S.lastDrop = 0; S.state = 'PLAYING';
    setUiScore(0); setUiLines(0); setUiLevel(S.level);
    setEarnedPoints(0);
    setGameState('PLAYING');
    playPop();
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

  // Teclado
  useEffect(() => {
    const S = stateRef.current;
    const onKey = (e) => {
      if (gameState !== 'PLAYING') {
        if (e.code === 'Enter' || e.code === 'Space') startGame();
        return;
      }
      switch (e.code) {
        case 'ArrowLeft':  if (fits(S.grid, S.current, -1, 0)) S.current.x--; break;
        case 'ArrowRight': if (fits(S.grid, S.current,  1, 0)) S.current.x++; break;
        case 'ArrowDown':
          if (fits(S.grid, S.current, 0, 1)) S.current.y++;
          else S.lastDrop = 0;
          break;
        case 'ArrowUp': case 'KeyX': {
          const rot = rotateCW(S.current.matrix);
          const tmp = { ...S.current, matrix: rot };
          const kicks = [0, 1, -1, 2, -2];
          for (const k of kicks) {
            if (fits(S.grid, tmp, k, 0)) { S.current.matrix = rot; S.current.x += k; break; }
          }
          break;
        }
        case 'Space': {
          while (fits(S.grid, S.current, 0, 1)) S.current.y++;
          S.lastDrop = 0;
          break;
        }
      }
      render();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, startGame, render]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="min-h-screen bg-[#1a1525] flex flex-col items-center justify-center py-8 px-4 select-none custom-cursor-active">
      <div className="w-full max-w-xl mb-4 flex items-center justify-between">
        <a href="/" onClick={playPop} className="retro-btn inline-flex items-center gap-2 text-[9px]">
          <ArrowLeft className="w-3.5 h-3.5" /> MENÚ
        </a>
        <div className="font-retro text-[7px] text-slate-400 text-right leading-relaxed">
          <p>← → MOVER  ·  ↑ ROTAR  ·  ↓ BAJAR</p>
          <p className="text-pastel-pink">ESPACIO = CAÍDA INSTANTÁNEA</p>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* Tablero */}
        <div className="retro-container p-2">
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK}
            className="block" style={{ imageRendering: 'pixelated' }}
            onClick={() => gameState !== 'PLAYING' && startGame()}
          />
        </div>

        {/* Panel lateral */}
        <div className="flex flex-col gap-4 min-w-[110px]">
          {/* NEXT */}
          <div className="retro-container p-3">
            <p className="font-retro text-[7px] text-slate-400 mb-2">NEXT</p>
            <canvas ref={previewRef} width={80} height={80} className="block" style={{ imageRendering: 'pixelated' }} />
          </div>
          {/* Stats */}
          <div className="retro-container p-3 space-y-3">
            {[['SCORE', uiScore], ['BEST', uiBest], ['LINES', uiLines], ['LEVEL', uiLevel]].map(([label, val]) => (
              <div key={label}>
                <p className="font-retro text-[6px] text-slate-400">{label}</p>
                <p className="font-retro text-[11px] text-white">{val}</p>
              </div>
            ))}
          </div>
          {/* Controles rápidos */}
          <div className="retro-container p-3 space-y-1.5">
            {[['↑','ROTAR'],['← →','MOVER'],['↓','BAJAR'],['SPC','DROP']].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="font-retro text-[6px] text-pastel-pink">{k}</span>
                <span className="font-retro text-[6px] text-slate-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
