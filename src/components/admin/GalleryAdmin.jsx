import React, { useState, useEffect, useCallback } from "react";
import {
  Image,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Upload,
} from "lucide-react";
import { playPop, playSuccess, playError, playTick } from "../../utils/sounds";
import useStore from "../../store/useStore";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/gallery`;

const EMPTY_FOTO = () => ({
  id: null,
  image_url: "",
  caption: "",
  sort_order: 0,
  is_published: true,
});

export default function GalleryAdmin() {
  const token = useStore((s) => s.token);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const headers = useCallback(
    () => ({
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : { "x-admin-password": "Causa2022" }),
    }),
    [token],
  );

  const loadFotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/all`, { headers: headers() });
      if (res.ok) setFotos(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    loadFotos();
  }, [loadFotos]);

  const openNew = () => {
    playPop();
    setEditing({ ...EMPTY_FOTO(), sort_order: fotos.length });
    setImageFile(null);
    setImagePreview(null);
  };

  const openEdit = (foto) => {
    playPop();
    setEditing({ ...foto });
    setImagePreview(foto.image_url || null);
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!imageFile && !editing?.image_url?.trim()) return;
    setSaving(true);
    playPop();

    try {
      const isNew = !editing.id;
      const fd = new FormData();
      fd.append("image_url", editing.image_url || "");
      fd.append("caption", editing.caption || "");
      fd.append("sort_order", parseInt(editing.sort_order) || 0);
      fd.append("is_published", String(editing.is_published !== false));
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch(isNew ? API : `${API}/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: headers(),
        body: fd,
      });

      if (res.ok) {
        playSuccess();
        setEditing(null);
        setImageFile(null);
        setImagePreview(null);
        loadFotos();
      } else {
        playError();
        alert("Error al guardar la foto.");
      }
    } catch {
      playError();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar esta foto de la galería?")) return;
    playPop();
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (res.ok) {
        playSuccess();
        loadFotos();
        if (editing?.id === id) setEditing(null);
      } else playError();
    } catch {
      playError();
    }
  };

  const moveOrder = async (foto, direction) => {
    playTick();
    const idx = fotos.findIndex((f) => f.id === foto.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= fotos.length) return;

    const other = fotos[swapIdx];
    await Promise.all([
      fetch(`${API}/${foto.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ sort_order: other.sort_order }),
      }),
      fetch(`${API}/${other.id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ sort_order: foto.sort_order }),
      }),
    ]);
    loadFotos();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-retro text-[9px] text-pastel-pink-light flex items-center gap-1.5">
          <Image className="w-4 h-4" />
          GALERÍA DE FOTOS
        </h3>
        <button
          type="button"
          onClick={openNew}
          className="retro-btn text-[8px] py-1.5 px-3 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> NUEVA FOTO
        </button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="retro-container p-5 space-y-4 border-2 border-pastel-pink/30"
        >
          <h4 className="font-retro text-[8px] text-white">
            {editing.id ? `EDITAR FOTO #${editing.id}` : "NUEVA FOTO"}
          </h4>

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-2">
              SUBIR IMAGEN O PEGAR URL
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="font-retro text-[7px] text-slate-400 w-full"
              />
              <div className="flex items-center gap-2">
                <span className="font-retro text-[6px] text-slate-500">
                  — o —
                </span>
              </div>
              <input
                type="url"
                value={editing.image_url}
                onChange={(e) => {
                  setEditing({ ...editing, image_url: e.target.value });
                  setImagePreview(e.target.value);
                }}
                placeholder="https://..."
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
              />
            </div>
          </div>

          {imagePreview && (
            <div className="w-32 h-32 border-2 border-white overflow-hidden bg-black">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div>
            <label className="block font-retro text-[7px] text-slate-400 mb-2">
              FRASE / CAPTION
            </label>
            <textarea
              value={editing.caption}
              onChange={(e) =>
                setEditing({ ...editing, caption: e.target.value })
              }
              rows={2}
              placeholder="Una frase que acompañe el recuerdo..."
              className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-retro text-[7px] text-slate-400 mb-2">
                ORDEN
              </label>
              <input
                type="number"
                value={editing.sort_order}
                onChange={(e) =>
                  setEditing({ ...editing, sort_order: e.target.value })
                }
                className="w-full px-3 py-2 border-2 border-slate-700 bg-transparent text-white font-sans text-xs focus:border-white focus:outline-none"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer font-retro text-[7px] text-slate-300">
                <input
                  type="checkbox"
                  checked={editing.is_published !== false}
                  onChange={(e) =>
                    setEditing({ ...editing, is_published: e.target.checked })
                  }
                  className="accent-pastel-pink"
                />
                PUBLICADA
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="retro-btn text-[8px] py-2 px-4 flex items-center gap-1"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "GUARDANDO..." : "GUARDAR"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="retro-btn text-[8px] py-2 px-4 bg-slate-800"
            >
              CANCELAR
            </button>
          </div>
        </form>
      )}

      <div className="retro-container p-5">
        {loading ? (
          <p className="font-retro text-[8px] text-slate-500 animate-pulse">
            CARGANDO GALERÍA...
          </p>
        ) : fotos.length === 0 ? (
          <p className="font-retro text-[8px] text-slate-500">
            No hay fotos. ¡Agregá la primera!
          </p>
        ) : (
          <div className="space-y-3">
            {fotos.map((foto, idx) => (
              <div
                key={foto.id}
                className="flex items-center gap-3 p-3 border border-slate-800 hover:bg-white/5 transition-colors"
              >
                <div className="w-14 h-14 border-2 border-white shrink-0 overflow-hidden bg-black">
                  <img
                    src={foto.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="font-retro text-[7px] text-white truncate">
                    {foto.caption || "(sin frase)"}
                  </p>
                  <p className="font-retro text-[5px] text-slate-500">
                    Orden: {foto.sort_order}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {foto.is_published ? (
                    <Eye
                      className="w-3.5 h-3.5 text-emerald-400"
                      title="Publicada"
                    />
                  ) : (
                    <EyeOff
                      className="w-3.5 h-3.5 text-slate-500"
                      title="Oculta"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => moveOrder(foto, -1)}
                    disabled={idx === 0}
                    className="retro-btn text-[7px] !p-1"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveOrder(foto, 1)}
                    disabled={idx === fotos.length - 1}
                    className="retro-btn text-[7px] !p-1"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(foto)}
                    className="retro-btn text-[7px] !p-1.5"
                  >
                    EDITAR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(foto.id)}
                    className="retro-btn text-[7px] !p-1.5 bg-red-950/30 border-red-800 text-red-400"
                  >
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
