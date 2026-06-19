import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { playPop, playSuccess, playError } from '../../utils/sounds';
import useStore from '../../store/useStore';
import RichTextEditor from './RichTextEditor';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/gallery/cartas`;

const EMPTY_CARTA = () => ({
  id: null,
  title: '',
  content: '',
  polaroid_image: '',
  is_published: true,
});

const normalizeCartas = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.cartas)) return payload.cartas;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export default function PoemarioAdmin() {
  const token = useStore((s) => s.token);
  const [cartas, setCartas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const headers = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : { 'x-admin-password': 'Causa2022' }),
    }),
    [token]
  );

  const loadCartas = useCallback(async () => {
    setLoading(true);
    try {
      const tryFetch = async (url) => {
        const res = await fetch(url, { headers: headers() });
        if (!res.ok) return null;
        const payload = await res.json().catch(() => null);
        return payload;
      };

      const payload = await tryFetch(API) ?? await tryFetch(`${API}/all`);
      setCartas(normalizeCartas(payload));
    } catch (e) {
      console.error('Error al cargar cartas:', e);
      setCartas([]);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { loadCartas(); }, [loadCartas]);

  const openNew = () => {
    playPop();
    setEditing(EMPTY_CARTA());
  };

  const openEdit = (carta) => {
    playPop();
    setEditing({ ...carta });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing?.title?.trim() || !editing?.content?.trim()) return;
    setSaving(true);
    playPop();

    try {
      const payload = {
        title: editing.title.trim(),
        content: editing.content,
        polaroid_image: editing.polaroid_image?.trim() || null,
        is_published: editing.is_published !== false,
      };
      const isNew = !editing.id;
      const res = await fetch(isNew ? API : `${API}/${editing.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        playSuccess();
        setEditing(null);
        await loadCartas();
      } else {
        playError();
        alert('Error al guardar la carta.');
      }
    } catch {
      playError();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta carta del poemario?')) return;
    playPop();
    try {
      const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: headers() });
      if (res.ok) {
        playSuccess();
        await loadCartas();
        if (editing?.id === id) setEditing(null);
      } else {
        playError();
      }
    } catch {
      playError();
    }
  };

  const stripHtml = (html = '') => {
    const clean = String(html || '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.substring(0, 80);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-retro text-[9px] text-pastel-lavender-light flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          POEMARIO — CARTAS
        </h3>
        <button type="button" onClick={openNew} className="retro-btn text-[8px] py-1.5 px-3 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> NUEVA CARTA
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="retro-container p-5 space-y-4 border-2 border-pastel-lavender/30">
          <h4 className="font-retro text-[8px] text-white">
            {editing.id ? `EDITAR CARTA #${editing.id}` : 'NUEVA CARTA'}
          </h4>

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-2">TÍTULO *</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Título de la carta..."
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-2">CONTENIDO *</label>
            <RichTextEditor
              value={editing.content}
              onChange={(html) => setEditing({ ...editing, content: html })}
            />
          </div>

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-2">IMAGEN POLAROID (URL opcional)</label>
            <input
              type="url"
              value={editing.polaroid_image || ''}
              onChange={(e) => setEditing({ ...editing, polaroid_image: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-retro text-[7px] text-slate-300">
            <input
              type="checkbox"
              checked={editing.is_published !== false}
              onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
              className="accent-pastel-lavender"
            />
            PUBLICADA
          </label>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="retro-btn text-[8px] py-2 px-4 flex items-center gap-1">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'GUARDANDO...' : 'GUARDAR CARTA'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="retro-btn text-[8px] py-2 px-4 bg-slate-800">
              CANCELAR
            </button>
          </div>
        </form>
      )}

      <div className="retro-container p-5">
        {loading ? (
          <p className="font-retro text-[8px] text-slate-500 animate-pulse">CARGANDO CARTAS...</p>
        ) : cartas.length === 0 ? (
          <p className="font-retro text-[8px] text-slate-500">No hay cartas. ¡Escribí la primera!</p>
        ) : (
          <div className="space-y-3">
            {cartas.map((carta) => (
              <div key={carta.id} className="flex items-center gap-3 p-3 border border-slate-800 hover:bg-white/5 transition-colors">
                <div className="flex-grow min-w-0">
                  <p className="font-retro text-[8px] text-pastel-lavender">{carta.title}</p>
                  <p className="font-sans text-[10px] text-slate-500 truncate">{stripHtml(carta.content)}...</p>
                  <p className="font-retro text-[5px] text-slate-600 mt-1">
                    {new Date(carta.created_at).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {carta.is_published ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <button type="button" onClick={() => openEdit(carta)} className="retro-btn text-[7px] !p-1.5">EDITAR</button>
                  <button type="button" onClick={() => handleDelete(carta.id)} className="retro-btn text-[7px] !p-1.5 bg-red-950/30 border-red-800 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
