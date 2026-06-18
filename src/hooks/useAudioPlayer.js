import { useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import * as audioEngine from '../services/audioEngine';

/**
 * Hook para componentes que necesitan controlar o leer el reproductor global.
 */
export default function useAudioPlayer() {
  const currentSong = useStore((s) => s.currentSong);
  const isPlaying = useStore((s) => s.isPlaying);
  const volume = useStore((s) => s.volume);
  const isMuted = useStore((s) => s.isMuted);
  const seek = useStore((s) => s.seek);
  const duration = useStore((s) => s.duration);
  const playlist = useStore((s) => s.playlist);

  const loadTrack = useStore((s) => s.loadTrack);
  const play = useStore((s) => s.play);
  const pause = useStore((s) => s.pause);
  const togglePlay = useStore((s) => s.togglePlay);
  const seekTo = useStore((s) => s.seekTo);
  const setVolume = useStore((s) => s.setVolume);
  const toggleMute = useStore((s) => s.toggleMute);
  const playNext = useStore((s) => s.playNext);
  const playPrev = useStore((s) => s.playPrev);
  const setPlaylist = useStore((s) => s.setPlaylist);

  const registerAnalyser = useCallback((cb) => {
    audioEngine.setAnalyserCallback(cb);
    return () => audioEngine.setAnalyserCallback(null);
  }, []);

  useEffect(() => () => {
    // No destruir el engine al desmontar — persiste entre tabs
  }, []);

  return {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    seek,
    duration,
    playlist,
    loadTrack,
    play,
    pause,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    playNext,
    playPrev,
    setPlaylist,
    registerAnalyser,
  };
}
