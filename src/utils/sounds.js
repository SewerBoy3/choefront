/**
 * Utilería de Síntesis de Sonidos usando Web Audio API.
 * Provee efectos de sonido retro de 8 bits sin depender de archivos de audio externos.
 */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Si el navegador suspendió el contexto de audio debido a políticas de interacción de usuario, lo resumimos
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Sonido 1: Pop (burbuja / click tierno)
 */
export function playPop() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    // Rápida subida de frecuencia
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn('Web Audio API no soportado o bloqueado:', e);
  }
}

/**
 * Sonido 2: Success (acorde alegre ascendente para confeti)
 */
export function playSuccess() {
  try {
    const ctx = getAudioContext();
    const notas = [261.63, 329.63, 392.00, 523.25]; // Do, Mi, Sol, Do (Octava superior)
    const duracionNota = 0.08;

    notas.forEach((frec, index) => {
      const startTime = ctx.currentTime + index * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frec, startTime);
      
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duracionNota);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duracionNota);
    });
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Sonido 3: Hover Tick (pequeño tick sutil)
 */
export function playTick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Sonido 4: Error / Denegado (pequeño zumbido descendente)
 */
export function playError() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Sonido 5: Swoosh (efecto al abrir paneles o cambiar de tabs)
 */
export function playSwoosh() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.warn(e);
  }
}

// ==========================================
// 8-BIT GAME BGM & SOUND EFFECTS
// ==========================================

let tetrisBgmInterval = null;
let tetrisBgmNodes = [];

export function startTetrisBGM() {
  try {
    const ctx = getAudioContext();
    if (tetrisBgmInterval) return;

    const E5 = 659.25, B4 = 493.88, C5 = 523.25, D5 = 587.33, A4 = 440.00, G4 = 392.00, F4 = 349.23, E4 = 329.63, C4 = 261.63, D4 = 293.66;
    
    const melody = [
      E5, B4, C5, D5, C5, B4, A4, A4, C5, E5, D5, C5, B4, C5, D5, E5, C5, A4, A4,
      D5, F4, A4, D5, C5, B4, C5, E5, D5, C5, B4, C5, D5, E5, C5, A4, A4
    ];
    const beats = [
      4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 6, 2, 4, 4, 4, 4, 8,
      4, 2, 2, 4, 2, 2, 4, 2, 2, 4, 2, 2, 6, 2, 4, 4, 4, 4, 8
    ];
    const stepMs = 150;
    let noteIndex = 0;
    let nextNoteTime = ctx.currentTime;

    function playNextNote() {
      if (noteIndex >= melody.length) {
        noteIndex = 0;
      }
      const freq = melody[noteIndex];
      const beat = beats[noteIndex];
      const duration = (beat * stepMs) / 1000;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, nextNoteTime);
      
      gain.gain.setValueAtTime(0.015, nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + duration);

      tetrisBgmNodes.push({ osc, gain });
      setTimeout(() => {
        tetrisBgmNodes = tetrisBgmNodes.filter(n => n.osc !== osc);
      }, duration * 1000 + 100);

      noteIndex++;
      nextNoteTime += duration;
    }

    const intervalTime = 100;
    tetrisBgmInterval = setInterval(() => {
      while (nextNoteTime < ctx.currentTime + 0.3) {
        playNextNote();
      }
    }, intervalTime);
  } catch (e) {
    console.warn('Error starting Tetris BGM:', e);
  }
}

export function stopTetrisBGM() {
  if (tetrisBgmInterval) {
    clearInterval(tetrisBgmInterval);
    tetrisBgmInterval = null;
  }
  tetrisBgmNodes.forEach(n => {
    try { n.osc.stop(); } catch(e) {}
  });
  tetrisBgmNodes = [];
}

let dinoBgmInterval = null;
let dinoBgmNodes = [];

export function startDinoBGM() {
  try {
    const ctx = getAudioContext();
    if (dinoBgmInterval) return;

    const C3 = 130.81, D3 = 146.83, E3 = 164.81, G3 = 196.00, A3 = 220.00, C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.00, A4 = 440.00;
    
    const notes = [
      C3, C4, G3, G4, A3, A4, F3, F4,
      C3, C4, G3, G4, A3, A4, G3, G4,
      C3, E4, G3, G4, A3, C4, F3, A4,
      C3, E4, G3, G4, A3, B3, C4, D4
    ];
    const duration = 0.15;

    let noteIndex = 0;
    let nextNoteTime = ctx.currentTime;

    function playNextNote() {
      if (noteIndex >= notes.length) {
        noteIndex = 0;
      }
      const freq = notes[noteIndex];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = noteIndex % 2 === 0 ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(freq, nextNoteTime);
      
      gain.gain.setValueAtTime(0.012, nextNoteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + duration);

      dinoBgmNodes.push({ osc, gain });
      setTimeout(() => {
        dinoBgmNodes = dinoBgmNodes.filter(n => n.osc !== osc);
      }, duration * 1000 + 100);

      noteIndex++;
      nextNoteTime += duration;
    }

    const intervalTime = 100;
    dinoBgmInterval = setInterval(() => {
      while (nextNoteTime < ctx.currentTime + 0.3) {
        playNextNote();
      }
    }, intervalTime);
  } catch (e) {
    console.warn('Error starting Dino BGM:', e);
  }
}

export function stopDinoBGM() {
  if (dinoBgmInterval) {
    clearInterval(dinoBgmInterval);
    dinoBgmInterval = null;
  }
  dinoBgmNodes.forEach(n => {
    try { n.osc.stop(); } catch(e) {}
  });
  dinoBgmNodes = [];
}

// TETRIS GAME EFFECTS

export function playTetrisMove() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

export function playTetrisRotate() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
}

export function playTetrisLineClear() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const dur = 0.08;

    notes.forEach((f, i) => {
      const start = ctx.currentTime + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch (e) {}
}

export function playGameOver() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

// SIGMA RUNNER (DINO) EFFECTS

export function playDinoJump() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

export function playDinoCoin() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const t = ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.setValueAtTime(0.08, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(t + 0.3);
  } catch (e) {}
}

export function playDinoHit() {
  try {
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.25);
  } catch (e) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch(err) {}
  }
}
