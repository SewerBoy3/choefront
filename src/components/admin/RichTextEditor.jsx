import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Link, Image, List, ListOrdered, Undo, Redo,
} from 'lucide-react';
import { playTick } from '../../utils/sounds';

const TOOLBAR_BTN = 'p-1.5 border border-slate-700 hover:border-white hover:bg-white/10 text-slate-300 hover:text-white transition-colors';

export default function RichTextEditor({ value, onChange, placeholder = 'Escribí tu carta aquí...' }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
    requestAnimationFrame(() => { isInternalChange.current = false; });
  }, [onChange]);

  const exec = (cmd, val = null) => {
    playTick();
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    emitChange();
  };

  const insertLink = () => {
    const url = prompt('URL del enlace:');
    if (url) exec('createLink', url);
  };

  const insertImage = () => {
    const url = prompt('URL de la imagen:');
    if (url) exec('insertImage', url);
  };

  return (
    <div className="border-2 border-slate-700 bg-[#0f0d15]">
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-800 bg-black/30">
        <button type="button" onClick={() => exec('bold')} className={TOOLBAR_BTN} title="Negrita">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={TOOLBAR_BTN} title="Cursiva">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={insertLink} className={TOOLBAR_BTN} title="Enlace">
          <Link className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={insertImage} className={TOOLBAR_BTN} title="Imagen">
          <Image className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className={TOOLBAR_BTN} title="Lista">
          <List className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={TOOLBAR_BTN} title="Lista numerada">
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => exec('undo')} className={TOOLBAR_BTN} title="Deshacer">
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => exec('redo')} className={TOOLBAR_BTN} title="Rehacer">
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="min-h-[200px] max-h-[400px] overflow-y-auto px-4 py-3 text-sm text-slate-200 leading-relaxed
          focus:outline-none prose-letter empty:before:content-[attr(data-placeholder)] empty:before:text-slate-600 empty:before:italic"
      />
    </div>
  );
}
