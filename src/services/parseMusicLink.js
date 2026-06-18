const SPOTIFY_LABELS = {
  track: 'Canción',
  album: 'Álbum',
  playlist: 'Playlist',
  episode: 'Episodio',
};

function guessNameFromUrl(url) {
  try {
    const path = new URL(url).pathname.split('/').pop() || '';
    const decoded = decodeURIComponent(path).replace(/\.[^/.]+$/, '');
    return decoded.replace(/[-_]/g, ' ') || 'Canción personalizada';
  } catch {
    return 'Canción personalizada';
  }
}

/**
 * Convierte un enlace (Spotify, YouTube, MP3 directo) en objeto de pista.
 */
export function parseMusicLink(input, customName = '') {
  if (!input?.trim()) return null;

  const raw = input.trim();
  const name = customName?.trim();

  const spotify = raw.match(
    /open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i
  );
  if (spotify) {
    const kind = spotify[1].toLowerCase();
    const id = spotify[2];
    return {
      type: 'spotify',
      id: `spotify-${kind}-${id}`,
      embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
      url: raw,
      name: name || `Spotify · ${SPOTIFY_LABELS[kind] || kind}`,
      source: 'spotify',
      embedHeight: kind === 'track' || kind === 'episode' ? 152 : 352,
    };
  }

  const yt = raw.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (yt) {
    return {
      type: 'youtube',
      id: `youtube-${yt[1]}`,
      embedUrl: `https://www.youtube.com/embed/${yt[1]}`,
      url: raw,
      name: name || 'YouTube',
      source: 'youtube',
      embedHeight: 200,
    };
  }

  if (/^https?:\/\//i.test(raw)) {
    return {
      type: 'audio',
      id: `audio-${raw.replace(/\W/g, '').slice(-16)}`,
      url: raw,
      name: name || guessNameFromUrl(raw),
      source: 'custom',
    };
  }

  return null;
}

export function parsePlaylistLines(text) {
  if (!text?.trim()) return [];

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const pipe = line.indexOf('|');
      if (pipe > -1) {
        return parseMusicLink(line.slice(0, pipe).trim(), line.slice(pipe + 1).trim());
      }
      return parseMusicLink(line);
    })
    .filter(Boolean);
}

export function isEmbedTrack(track) {
  return track?.type === 'spotify' || track?.type === 'youtube';
}

export function trackIcon(track) {
  if (!track) return '🎶';
  if (track.type === 'spotify') return '🟢';
  if (track.type === 'youtube') return '▶️';
  if (track.source === 'drive') return '🎵';
  if (track.source === 'custom') return '🔗';
  return '🎶';
}

const CUSTOM_TRACKS_KEY = 'regalo_custom_tracks';

export function loadCustomTracks() {
  try {
    const raw = localStorage.getItem(CUSTOM_TRACKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTracks(tracks) {
  localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(tracks));
}

export function addCustomTrack(track) {
  const existing = loadCustomTracks();
  const filtered = existing.filter((t) => t.url !== track.url);
  const updated = [...filtered, track];
  saveCustomTracks(updated);
  return updated;
}

export function removeCustomTrack(trackId) {
  const updated = loadCustomTracks().filter((t) => t.id !== trackId);
  saveCustomTracks(updated);
  return updated;
}
