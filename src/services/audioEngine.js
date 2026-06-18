import { Howl } from 'howler';

let howl = null;
let getState = null;
let setState = null;
let seekTimer = null;
let analyserNode = null;
let audioContext = null;
let onAnalyserReady = null;

const FADE_MS = 700;

export function bindAudioStore(store) {
  getState = store.getState;
  setState = store.setState;
}

export function getHowl() {
  return howl;
}

export function getAnalyser() {
  return analyserNode;
}

export function setAnalyserCallback(cb) {
  onAnalyserReady = cb;
  if (analyserNode && cb) cb(analyserNode);
}

function clearSeekTimer() {
  if (seekTimer) {
    clearInterval(seekTimer);
    seekTimer = null;
  }
}

function startSeekTimer() {
  clearSeekTimer();
  seekTimer = setInterval(() => {
    if (!howl?.playing()) return;
    setState?.({ seek: howl.seek() || 0 });
  }, 800);
}

function connectAnalyser() {
  try {
    if (!howl?._sounds?.[0]?._node) return;

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') audioContext.resume();

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 64;

    const source = audioContext.createMediaElementSource(howl._sounds[0]._node);
    source.connect(analyserNode);
    analyserNode.connect(audioContext.destination);

    if (onAnalyserReady) onAnalyserReady(analyserNode);
  } catch (e) {
    console.warn('Audio analyser no disponible:', e.message);
    analyserNode = null;
  }
}

function unloadCurrent(fadeOut = true) {
  if (!howl) return;
  const current = howl;
  howl = null;
  analyserNode = null;
  clearSeekTimer();

  if (fadeOut && current.playing()) {
    const vol = current.volume();
    current.fade(vol, 0, FADE_MS);
    setTimeout(() => current.unload(), FADE_MS + 80);
  } else {
    current.unload();
  }
}

function isEmbedTrack(track) {
  return track?.type === 'spotify' || track?.type === 'youtube';
}

export function loadTrack(track, { autoplay = false, preload = true } = {}) {
  if (!track?.url && !track?.embedUrl) return;

  // Spotify / YouTube: reproductor embebido (no Howler)
  if (isEmbedTrack(track)) {
    unloadCurrent(true);
    setState?.({
      currentSong: track,
      isPlaying: true,
      seek: 0,
      duration: 0,
    });
    return;
  }

  if (!track.url) return;

  const state = getState?.() || {};
  const targetVolume = state.isMuted ? 0 : (state.volume ?? 0.8);

  unloadCurrent(true);

  howl = new Howl({
    src: [track.url],
    html5: true,
    preload: preload ? true : 'metadata',
    volume: 0,
    onload: () => {
      setState?.({ duration: howl.duration() || 0 });
    },
    onplay: () => {
      setState?.({ isPlaying: true });
      setState?.({ duration: howl.duration() || 0 });
      connectAnalyser();
      startSeekTimer();
      howl.fade(0, targetVolume, FADE_MS);
    },
    onpause: () => {
      setState?.({ isPlaying: false });
      clearSeekTimer();
    },
    onstop: () => {
      setState?.({ isPlaying: false, seek: 0 });
      clearSeekTimer();
    },
    onend: () => {
      setState?.({ isPlaying: false, seek: 0 });
      clearSeekTimer();
      playNextInPlaylist();
    },
    onloaderror: (_id, err) => {
      console.error('Error al cargar pista:', err);
    },
  });

  setState?.({ currentSong: track, seek: 0 });

  if (autoplay) {
    howl.play();
  }
}

export function play() {
  const song = getState?.()?.currentSong;
  if (isEmbedTrack(song)) {
    setState?.({ isPlaying: true });
    return;
  }
  if (!howl) return;
  const state = getState?.() || {};
  const vol = state.isMuted ? 0 : (state.volume ?? 0.8);

  if (!howl.playing()) {
    howl.volume(vol);
    howl.play();
  }
}

export function pause() {
  const song = getState?.()?.currentSong;
  if (isEmbedTrack(song)) {
    setState?.({ isPlaying: false });
    return;
  }
  howl?.pause();
}

export function togglePlay() {
  const song = getState?.()?.currentSong;
  if (isEmbedTrack(song)) {
    setState?.({ isPlaying: !getState?.().isPlaying });
    return;
  }
  if (!howl) return;
  if (howl.playing()) pause();
  else play();
}

export function seekTo(seconds) {
  if (!howl) return;
  howl.seek(seconds);
  setState?.({ seek: seconds });
}

export function setVolumeLevel(volume) {
  const v = Math.max(0, Math.min(1, volume));
  setState?.({ volume: v, isMuted: v === 0 });
  if (howl) howl.volume(v);
}

export function toggleMute() {
  const state = getState?.() || {};
  const nextMuted = !state.isMuted;
  setState?.({ isMuted: nextMuted });
  if (howl) howl.volume(nextMuted ? 0 : (state.volume ?? 0.8));
}

export function playNextInPlaylist() {
  const { playlist, currentSong } = getState?.() || {};
  if (!playlist?.length || !currentSong) return;

  const idx = playlist.findIndex((t) => t.url === currentSong.url);
  const next = playlist[(idx + 1) % playlist.length];
  if (next) loadTrack(next, { autoplay: true });
}

export function playPrevInPlaylist() {
  const { playlist, currentSong } = getState?.() || {};
  if (!playlist?.length || !currentSong) return;

  const idx = playlist.findIndex((t) => t.url === currentSong.url);
  const prev = playlist[(idx - 1 + playlist.length) % playlist.length];
  if (prev) loadTrack(prev, { autoplay: true });
}

export function preloadTracks(tracks) {
  tracks.forEach((track) => {
    if (!track?.url || isEmbedTrack(track)) return;
    if (track.type && track.type !== 'audio') return;
    const h = new Howl({ src: [track.url], html5: true, preload: true, volume: 0 });
    h.once('load', () => h.unload());
  });
}

export function destroyAudio() {
  unloadCurrent(false);
  clearSeekTimer();
  onAnalyserReady = null;
}
