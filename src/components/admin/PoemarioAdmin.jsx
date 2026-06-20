import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, Plus, Save, Trash2, Eye, EyeOff, Feather, Heart } from 'lucide-react';
import { playPop, playSuccess, playError } from '../../utils/sounds';
import useStore from '../../store/useStore';
import RichTextEditor from './RichTextEditor';
import { sanitizeHtml } from '../../utils/sanitizeHtml';

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

  useEffect(() => {
    loadCartas();
  }, [loadCartas]);

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

  const safePreviewContent = useMemo(() => {
    if (!editing?.content) return '<p class="text-slate-500 italic">Escribí contenido para previsualizar aquí...</p>';
    return sanitizeHtml(editing.content);
  }, [editing?.content]);

  return (
    <div className="space-y-8">
      {/* Cabecera Sección Poemario */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1e1a2f]/45 p-4 border border-slate-800 rounded-md">
        <div>
          <h3 className="font-retro text-[10px] text-pastel-lavender-light flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-pastel-lavender" />
            GESTOR DE POEMARIO Y CARTAS
          </h3>
          <p className="font-retro text-[6px] text-slate-400 mt-1.5">
            Escribí y administrá las cartas que Zoe podrá abrir en su panel.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="retro-btn text-[8px] py-2 px-4 flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Plus className="w-4 h-4 text-black" /> NUEVA CARTA
        </button>
      </div>

      {editing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Formulario de Edición (Col 7) */}
          <form
            onSubmit={handleSave}
            className="lg:col-span-7 retro-container p-6 space-y-5 border-2 border-pastel-lavender/30"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-retro text-[8px] text-white">
                {editing.id ? `📝 EDITANDO CARTA #${editing.id}` : '✨ NUEVA CARTA'}
              </h4>
              <span className="font-retro text-[6px] text-pastel-lavender">Paso 1 de 2: Escribir</span>
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">TÍTULO DE LA CARTA *</label>
              <input
                type="text"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="Ej: Para un domingo lluvioso..."
                className="w-full px-3 py-2 border-2 border-slate-700 bg-[#0c0a12] text-white font-sans text-xs focus:border-pastel-lavender focus:outline-none rounded transition-colors"
                required
              />
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2 font-semibold">CONTENIDO EDITABLE *</label>
              <RichTextEditor
                value={editing.content}
                onChange={(html) => setEditing({ ...editing, content: html })}
                placeholder="Escribí aquí tu poema o carta con mucho amor..."
              />
            </div>

            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">IMAGEN POLAROID DE PORTADA (URL opcional)</label>
              <input
                type="url"
                value={editing.polaroid_image || ''}
                onChange={(e) => setEditing({ ...editing, polaroid_image: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3 py-2 border-2 border-slate-700 bg-[#0c0a12] text-white font-sans text-xs focus:border-pastel-lavender focus:outline-none rounded transition-colors"
              />
              <p className="font-retro text-[5px] text-slate-500 mt-1">
                Coloca un enlace directo a una imagen para que se muestre como Polaroid.
              </p>
            </div>

            <div className="flex items-center justify-between bg-black/20 p-3 rounded border border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer font-retro text-[7px] text-slate-300">
                <input
                  type="checkbox"
                  checked={editing.is_published !== false}
                  onChange={(e) => setEditing({ ...editing, is_published: e.target.checked })}
                  className="accent-pastel-lavender w-4 h-4 cursor-pointer"
                />
                MARCAR COMO PUBLICADA (Visible para Zoe de inmediato)
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !editing.title.trim() || !editing.content.trim()}
                className="retro-btn text-[8px] py-2 px-5 flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Save className="w-4 h-4" />
                {saving ? 'GUARDANDO...' : 'GUARDAR CARTA'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="retro-btn text-[8px] py-2 px-5 bg-slate-800 text-white border-slate-900 shadow-slate-950 hover:bg-slate-700"
              >
                CANCELAR
              </button>
            </div>
          </form>

          {/* Vista Previa en Tiempo Real (Col 5) */}
          <div className="lg:col-span-5 space-y-3 sticky top-6">
            <div className="font-retro text-[7px] text-pastel-lavender-light flex items-center gap-1.5 px-1">
              <Eye className="w-3.5 h-3.5 text-pastel-lavender" /> VISTA PREVIA (VISTA DE LECTURA DE ZOE)
            </div>

            <div className="bg-[#1a1525] border-4 border-white shadow-[6px_6px_0_rgba(0,0,0,0.45)] overflow-hidden rounded">
              {/* Encabezado del sobre */}
              <div className="bg-gradient-to-r from-pastel-pink/20 via-pastel-lavender/20 to-pastel-blue/20 px-5 py-4 border-b-4 border-white/20">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 border-2 border-pastel-pink bg-pastel-pink/15 flex items-center justify-center rounded-sm shrink-0">
                    <Feather className="w-3.5 h-3.5 text-pastel-pink" />
                  </div>
                  <h2 className="font-retro text-[9px] text-white leading-relaxed truncate">
                    {editing.title || 'Carta sin título'}
                  </h2>
                </div>
                <div className="flex justify-between items-center text-[5px] font-retro text-slate-500">
                  <span>FECHA DE ESCRITURA: HOY</span>
                  {!editing.is_published && <span className="text-yellow-400 text-[4px]">(BORRADOR - SÓLO ADMIN)</span>}
                </div>
              </div>

              {/* Imagen Polaroid Preview */}
              {editing.polaroid_image && (
                <div className="px-5 pt-4 flex justify-center bg-black/10">
                  <div className="bg-white p-2.5 shadow-[4px_4px_0_rgba(0,0,0,0.3)] rotate-[-1.5deg] max-w-[220px] border border-slate-200">
                    <img
                      src={editing.polaroid_image}
                      alt="Polaroid Preview"
                      className="w-full aspect-[4/3] object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="h-6 flex items-center justify-center font-retro text-[4px] text-slate-400 italic">
                      recuerdo especial ♡
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido Prose Preview */}
              <div
                className="px-6 py-5 prose-letter max-h-[360px] overflow-y-auto scroll-smooth bg-black/5"
                dangerouslySetInnerHTML={{ __html: safePreviewContent }}
              />

              {/* Pie de carta */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-center gap-2">
                <div className="h-[2px] flex-1 bg-white/10" />
                <Heart className="w-3.5 h-3.5 text-pastel-pink fill-pastel-pink animate-pulse" />
                <div className="h-[2px] flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista Completa de Cartas */}
      <div className="retro-container p-6 border-2 border-slate-800">
        <h4 className="font-retro text-[8px] text-white border-b border-slate-850 pb-3 mb-4 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-pastel-lavender" /> CARTAS CREADAS ({cartas.length})
        </h4>

        {loading ? (
          <div className="py-12 text-center">
            <p className="font-retro text-[8px] text-slate-500 animate-pulse">CARGANDO LISTA DE CARTAS...</p>
          </div>
        ) : cartas.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Feather className="w-8 h-8 mx-auto text-slate-700" />
            <p className="font-retro text-[8px]">El poemario está vacío.</p>
            <p className="font-retro text-[5px] text-slate-600">Presiona el botón "NUEVA CARTA" arriba para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cartas.map((carta) => (
              <div
                key={carta.id}
                className="flex flex-col justify-between p-4 border border-slate-800/80 bg-[#161224]/30 hover:bg-[#1a152d]/60 transition-colors rounded relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h5 className="font-retro text-[8.5px] text-pastel-lavender group-hover:text-white transition-colors leading-relaxed">
                      {carta.title}
                    </h5>
                    <div className="shrink-0 flex items-center gap-1">
                      {carta.is_published ? (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-950/45 text-emerald-400 border border-emerald-800/40 text-[5px] font-retro rounded-sm">
                          <Eye className="w-2.5 h-2.5" /> PUBLICADA
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-yellow-950/45 text-yellow-400 border border-yellow-800/40 text-[5px] font-retro rounded-sm">
                          <EyeOff className="w-2.5 h-2.5" /> BORRADOR
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="font-sans text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {stripHtml(carta.content)}...
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 mt-1.5">
                  <span className="font-retro text-[5.5px] text-slate-500 flex items-center gap-1">
                    📅 {new Date(carta.created_at).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(carta)}
                      className="retro-btn text-[6.5px] !py-1 !px-2.5 bg-slate-800 text-white border-slate-900 shadow-slate-950 hover:bg-slate-700"
                    >
                      EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(carta.id)}
                      className="retro-btn text-[6.5px] !py-1 !px-2.5 bg-red-950/30 border-red-800/80 text-red-400 hover:text-red-300 shadow-red-950/50"
                      title="Eliminar de forma permanente"
                    >
                      ELIMINAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
