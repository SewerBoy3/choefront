import { create } from 'zustand';
import * as audioEngine from '../services/audioEngine';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const useStore = create((set, get) => ({
  // --- AUTH STATE ---
  user: JSON.parse(localStorage.getItem('regalo_user')) || null,
  token: localStorage.getItem('regalo_token') || null,

  // --- APP STATE ---
  points: parseInt(localStorage.getItem('regalo_points')) || 0,
  coupons: [],
  likes: { cancion: [], foto: [], carta: [] },

  // --- AUDIO STATE ---
  currentSong: null,
  playlist: [],
  isPlaying: false,
  isMuted: false,
  volume: parseFloat(localStorage.getItem('regalo_volume')) || 0.8,
  seek: 0,
  duration: 0,
  musicSettings: { default_song_url: '', music_autoplay: 'false' },

  // --- AUTH ACTIONS ---
  login: (userData, token) => {
    localStorage.setItem('regalo_user', JSON.stringify(userData));
    localStorage.setItem('regalo_token', token);
    localStorage.setItem('regalo_points', String(userData.points || 0));
    set({ user: userData, token, points: userData.points || 0 });
    get().fetchLikes();
  },

  logout: () => {
    localStorage.removeItem('regalo_user');
    localStorage.removeItem('regalo_token');
    localStorage.removeItem('regalo_points');
    audioEngine.destroyAudio();
    set({
      user: null,
      token: null,
      points: 0,
      coupons: [],
      currentSong: null,
      playlist: [],
      isPlaying: false,
      seek: 0,
      duration: 0,
    });
  },

  // --- POINT ACTIONS ---
  setPoints: (points) => {
    const safePoints = Math.max(0, parseInt(points) || 0);
    localStorage.setItem('regalo_points', String(safePoints));
    const currentUser = get().user;
    set({
      points: safePoints,
      user: currentUser ? { ...currentUser, points: safePoints } : null,
    });
  },

  addPoints: (amount) => {
    get().setPoints(get().points + amount);
  },

  refreshUserData: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Si el usuario cerró sesión mientras el fetch estaba en vuelo, no restaurar
      if (get().token !== token) return;

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          get().logout();
        }
        return;
      }

      const data = await res.json();

      if (get().token !== token) return;

      if (data.success && data.user) {
        const freshPoints = data.user.points || 0;
        localStorage.setItem('regalo_points', String(freshPoints));
        set({
          points: freshPoints,
          user: { ...get().user, ...data.user },
        });
      }
    } catch (err) {
      console.error('Error al refrescar datos del usuario:', err);
    }
  },

  // --- LIKES ACTIONS ---
  fetchLikes: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/likes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ likes: data });
      }
    } catch (err) {
      console.error('Error al obtener likes:', err);
    }
  },

  toggleLikeApi: async (targetId, targetType) => {
    const token = get().token;
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/likes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ target_id: targetId, target_type: targetType })
      });
      if (res.ok) {
        const data = await res.json();
        const currentLikes = { ...get().likes };
        if (data.liked) {
          if (!currentLikes[targetType].includes(targetId)) {
            currentLikes[targetType] = [...currentLikes[targetType], targetId];
          }
        } else {
          currentLikes[targetType] = currentLikes[targetType].filter(id => id !== targetId);
        }
        set({ likes: currentLikes });
        return data; // { liked, totalLikes }
      }
    } catch (err) {
      console.error('Error al hacer toggle de like:', err);
    }
  },

  // --- COUPON ACTIONS ---
  setCoupons: (coupons) => set({ coupons }),
  updateCoupon: (couponId, updates) =>
    set((state) => ({
      coupons: state.coupons.map((c) =>
        c.id === couponId ? { ...c, ...updates } : c
      ),
    })),

  // --- AUDIO ACTIONS ---
  setMusicSettings: (settings) => set({ musicSettings: settings }),

  setPlaylist: (playlist) => {
    set({ playlist });
    audioEngine.preloadTracks(playlist.slice(0, 3));
  },

  loadTrack: (track, options = {}) => {
    audioEngine.loadTrack(track, options);
  },

  play: () => audioEngine.play(),
  pause: () => audioEngine.pause(),
  togglePlay: () => audioEngine.togglePlay(),
  seekTo: (seconds) => audioEngine.seekTo(seconds),
  playNext: () => audioEngine.playNextInPlaylist(),
  playPrev: () => audioEngine.playPrevInPlaylist(),

  setVolume: (volume) => {
    const v = Math.max(0, Math.min(1, volume));
    localStorage.setItem('regalo_volume', String(v));
    audioEngine.setVolumeLevel(v);
  },

  toggleMute: () => audioEngine.toggleMute(),

  setCurrentSong: (song) => set({ currentSong: song }),
  setPlayState: (isPlaying) => set({ isPlaying }),
}));

audioEngine.bindAudioStore(useStore);

export default useStore;
