import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Plus, Save, Trash2, ChevronUp, ChevronDown, X,
  Image as ImageIcon, ExternalLink, Eye, EyeOff,
} from 'lucide-react';
import { playPop, playSuccess, playError, playTick } from '../../utils/sounds';
import useStore from '../../store/useStore';

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/admin`;

const EMPTY_SONG = () => ({
  dbId: null,
  title: '',
  artist: '',
  description: '',
  audio_url: '',   // Link externo (Spotify, YouTube, etc.)
  cover_url: '',
  is_published: true,
  sort_order: 0,
});

export default function MusicAdmin({ onUpdateData }) {
  const token = useStore((s) => s.token);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const headers = useCallback(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : { 'x-admin-password': 'Causa2022' }),
    }),
    [token]
  );

  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/songs`, { headers: headers() });
      if (res.ok) setSongs(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { loadSongs(); }, [loadSongs]);

  const openNew = () => {
    playPop();
    setEditing(EMPTY_SONG());
    setCoverFile(null);
    setCoverPreview(null);
  };

  const openEdit = (song) => {
    playPop();
    setEditing({
      dbId: song.dbId,
      title: song.name,
      artist: song.artist || '',
      description: song.description || '',
      audio_url: song.url || '',
      cover_url: song.coverUrl || '',
      is_published: song.isPublished !== false,
      sort_order: song.sortOrder || 0,
    });
    setCoverPreview(song.coverUrl || null);
    setCoverFile(null);
  };

  const updateField = (key, val) => setEditing((e) => ({ ...e, [key]: val }));

  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing?.title?.trim()) {
      playError();
      alert('El título es obligatorio.');
      return;
    }

    setSaving(true);
    playPop();

    const fd = new FormData();
    fd.append('title', editing.title);
    fd.append('artist', editing.artist || '');
    fd.append('description', editing.description || '');
    fd.append('source_type', 'audio_link');
    fd.append('audio_url', editing.audio_url || '');
    fd.append('cover_url', editing.cover_url || '');
    fd.append('lyrics', '');
    fd.append('sections', '[]');
    fd.append('is_published', String(editing.is_published));
    fd.append('sort_order', String(editing.sort_order || 0));
    if (coverFile) fd.append('cover', coverFile);

    try {
      const url = editing.dbId ? `${API}/songs/${editing.dbId}` : `${API}/songs`;
      const res = await fetch(url, {
        method: editing.dbId ? 'PUT' : 'POST',
        headers: headers(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar');

      playSuccess();
      setEditing(null);
      await loadSongs();
      onUpdateData?.();
    } catch (err) {
      playError();
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dbId) => {
    if (!confirm('¿Eliminar esta canción?')) return;
    playPop();
    try {
      const res = await fetch(`${API}/songs/${dbId}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      playSuccess();
      await loadSongs();
      onUpdateData?.();
    } catch (err) {
      playError();
      alert(err.message);
    }
  };

  const moveSong = async (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= songs.length) return;
    playTick();
    const reordered = [...songs];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setSongs(reordered);
    await fetch(`${API}/songs/reorder`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((s) => s.dbId) }),
    });
    onUpdateData?.();
  };

  // ── Formulario de edición ──────────────────────────────────────
  if (editing) {
    return (
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSave}
        className="retro-container p-6 space-y-5 max-w-2xl mx-auto"
      >
        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
          <h3 className="font-retro text-[10px] text-pastel-pink flex items-center gap-2">
            <Music className="w-4 h-4" />
            {editing.dbId ? 'EDITAR CANCIÓN' : 'NUEVA CANCIÓN'}
          </h3>
          <button type="button" onClick={() => { playPop(); setEditing(null); }} className="retro-btn !p-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Título + Artista */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-retro text-[7px] text-slate-400 block mb-1">TÍTULO *</label>
            <input
              value={editing.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white text-xs focus:border-pastel-pink focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="font-retro text-[7px] text-slate-400 block mb-1">ARTISTA</label>
            <input
              value={editing.artist}
              onChange={(e) => updateField('artist', e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white text-xs focus:border-pastel-pink focus:outline-none"
            />
          </div>
        </div>

        {/* Leyenda */}
        <div>
          <label className="font-retro text-[7px] text-slate-400 block mb-1">
            LEYENDA <span className="text-slate-600">(frase corta que acompaña la canción)</span>
          </label>
          <textarea
            value={editing.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            placeholder='Ej: "Esta sonaba cuando nos conocimos..."'
            className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white text-xs focus:border-pastel-pink focus:outline-none resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Link externo */}
        <div>
          <label className="font-retro text-[7px] text-slate-400 block mb-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> LINK PARA ESCUCHAR (Spotify, YouTube, etc.)
          </label>
          <input
            value={editing.audio_url}
            onChange={(e) => updateField('audio_url', e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white text-xs focus:border-pastel-pink focus:outline-none"
          />
          {editing.audio_url && (
            <p className="font-retro text-[6px] text-pastel-blue mt-1">
              ✓ Link detectado — aparecerá un botón para abrir en la app
            </p>
          )}
        </div>

        {/* Portada */}
        <div className="border-2 border-slate-700 p-4 space-y-3">
          <h4 className="font-retro text-[8px] text-pastel-blue flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" /> PORTADA
          </h4>
          <div className="flex gap-4 items-start">
            {coverPreview && (
              <img
                src={coverPreview}
                alt="Portada"
                className="w-24 h-24 object-cover border-4 border-white"
              />
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="font-retro text-[7px] text-slate-400 w-full"
              />
              <input
                value={editing.cover_url}
                onChange={(e) => { updateField('cover_url', e.target.value); setCoverPreview(e.target.value); }}
                placeholder="O pega URL de imagen"
                className="w-full px-2 py-1.5 border border-slate-600 bg-transparent text-white text-[10px] focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Publicar */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={editing.is_published}
            onChange={(e) => updateField('is_published', e.target.checked)}
            className="accent-pastel-pink"
          />
          <span className="font-retro text-[7px] text-slate-300 flex items-center gap-1">
            {editing.is_published ? <Eye className="w-3 h-3 text-green-400" /> : <EyeOff className="w-3 h-3" />}
            Visible en la Sala de Música
          </span>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="retro-btn w-full !bg-pastel-pink !text-black text-[9px] py-3 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'GUARDANDO...' : 'GUARDAR CANCIÓN'}
        </button>
      </motion.form>
    );
  }

  // ── Lista de canciones ─────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-retro text-[10px] text-pastel-pink flex items-center gap-2">
          <Music className="w-5 h-5" /> BIBLIOTECA MUSICAL
        </h3>
        <button
          onClick={openNew}
          onMouseEnter={playTick}
          className="retro-btn text-[8px] flex items-center gap-1 !bg-pastel-pink !text-black"
        >
          <Plus className="w-3.5 h-3.5" /> NUEVA CANCIÓN
        </button>
      </div>

      <p className="font-retro text-[6px] text-slate-500 leading-relaxed">
        Agrega título, artista, portada, una leyenda y el link de Spotify o YouTube. Sin más complicaciones.
      </p>

      {loading ? (
        <p className="font-retro text-[8px] text-slate-400 animate-pulse text-center py-12">CARGANDO...</p>
      ) : songs.length === 0 ? (
        <div className="retro-container p-12 text-center">
          <Music className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="font-retro text-[8px] text-slate-400">No hay canciones. ¡Agrega la primera!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song, idx) => (
            <motion.div key={song.dbId} layout className="retro-container p-4 flex items-center gap-4">
              {song.coverUrl ? (
                <img src={song.coverUrl} alt="" className="w-14 h-14 object-cover border-2 border-white shrink-0" />
              ) : (
                <div className="w-14 h-14 border-2 border-slate-600 bg-[#2d2038] flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-slate-500" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-retro text-[9px] text-white truncate">{song.name}</p>
                <p className="font-retro text-[6px] text-slate-500 truncate">{song.artist || 'Sin artista'}</p>
                {song.description && (
                  <p className="font-sans text-[10px] text-slate-600 italic truncate mt-0.5">"{song.description}"</p>
                )}
                <p className="font-retro text-[5px] mt-1">
                  {song.isPublished === false ? (
                    <span className="text-slate-600">OCULTA</span>
                  ) : (
                    <span className="text-green-500">PUBLICADA</span>
                  )}
                  {song.url && <span className="text-pastel-blue ml-2">• Tiene link ↗</span>}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => moveSong(idx, -1)} disabled={idx === 0} className="retro-btn !p-1.5 disabled:opacity-30">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => moveSong(idx, 1)} disabled={idx === songs.length - 1} className="retro-btn !p-1.5 disabled:opacity-30">
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button type="button" onClick={() => openEdit(song)} className="retro-btn !p-1.5 text-[7px]">EDITAR</button>
                <button type="button" onClick={() => handleDelete(song.dbId)} className="retro-btn !p-1.5 !border-red-500/50 text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
