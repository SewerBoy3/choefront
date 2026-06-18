const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FALLBACK_TRACK = {
  id: 'fallback',
  type: 'audio',
  name: 'Bella Melodía Acústica',
  artist: '',
  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  source: 'fallback',
  lyrics: '',
  sections: [],
};

export async function fetchLibrarySongs() {
  try {
    const res = await fetch(`${API}/songs`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function buildPlaylist(librarySongs = []) {
  if (librarySongs.length > 0) return librarySongs;
  return [FALLBACK_TRACK];
}

export function getDefaultTrack(playlist) {
  return playlist[0] || FALLBACK_TRACK;
}

export function shouldAutoplay(publicSettings) {
  return publicSettings?.music_autoplay === 'true';
}

export function getActiveSection(sections, seekSec) {
  if (!sections?.length) return null;
  const match = sections.find(
    (s) => seekSec >= (s.startSec ?? 0) && seekSec < (s.endSec ?? Infinity)
  );
  return match || sections[sections.length - 1];
}

export { FALLBACK_TRACK };
