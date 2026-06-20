import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  Bold, Italic, Link, Image, List, ListOrdered, Undo, Redo, Eraser, Trash2
} from 'lucide-react';
import { playTick, playPop } from '../../utils/sounds';

const TOOLBAR_BTN = 'p-2 border border-slate-700 hover:border-pastel-lavender hover:bg-pastel-lavender/10 text-slate-300 hover:text-white transition-all flex items-center justify-center rounded-sm';

export default function RichTextEditor({ value, onChange, placeholder = 'Escribí tu carta aquí...' }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const updateCounts = useCallback((htmlContent) => {
    const text = htmlContent ? htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const chars = htmlContent ? htmlContent.replace(/<[^>]*>/g, '').length : 0;
    const words = text ? text.split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(chars);
  }, []);

  useEffect(() => {
    if (!editorRef.current || isInternalChange.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
      updateCounts(value || '');
    }
  }, [value, updateCounts]);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    isInternalChange.current = true;
    onChange(html);
    updateCounts(html);
    requestAnimationFrame(() => { isInternalChange.current = false; });
  }, [onChange, updateCounts]);

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

  const handlePaste = (e) => {
    // Evitamos el pegado por defecto que arrastra estilos HTML complejos de tablas, flex, columnas, etc.
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    
    // Insertamos como texto plano respetando saltos de línea normales
    document.execCommand('insertText', false, text);
    emitChange();
  };

  const clearFormatting = () => {
    if (!editorRef.current) return;
    playPop();
    if (confirm('¿Deseas limpiar todos los formatos del texto y dejar solo texto plano?')) {
      const plainText = editorRef.current.innerText || '';
      // Reemplazamos saltos de línea por párrafos limpios
      const cleanHtml = plainText
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '')
        .join('');
      editorRef.current.innerHTML = cleanHtml;
      emitChange();
    }
  };

  return (
    <div className="border-2 border-slate-700 bg-[#161224] focus-within:border-pastel-lavender transition-colors rounded-md overflow-hidden shadow-inner">
      {/* Barra de Herramientas del Editor */}
      <div className="flex flex-wrap gap-1.5 p-2 border-b border-slate-800 bg-black/40">
        <button type="button" onClick={() => exec('bold')} className={TOOLBAR_BTN} title="Negrita">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('italic')} className={TOOLBAR_BTN} title="Cursiva">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={insertLink} className={TOOLBAR_BTN} title="Insertar Enlace">
          <Link className="w-4 h-4" />
        </button>
        <button type="button" onClick={insertImage} className={TOOLBAR_BTN} title="Insertar Imagen">
          <Image className="w-4 h-4" />
        </button>
        <div className="w-[1px] bg-slate-800 mx-1 self-stretch" />
        <button type="button" onClick={() => exec('insertUnorderedList')} className={TOOLBAR_BTN} title="Lista con viñetas">
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('insertOrderedList')} className={TOOLBAR_BTN} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-[1px] bg-slate-800 mx-1 self-stretch" />
        <button type="button" onClick={() => exec('undo')} className={TOOLBAR_BTN} title="Deshacer">
          <Undo className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => exec('redo')} className={TOOLBAR_BTN} title="Rehacer">
          <Redo className="w-4 h-4" />
        </button>
        <div className="flex-grow" />
        <button
          type="button"
          onClick={clearFormatting}
          className="p-2 border border-dashed border-red-800 hover:border-red-500 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 transition-all flex items-center justify-center rounded-sm text-[7px] font-retro gap-1"
          title="Limpiar todos los formatos de diseño rotos"
        >
          <Eraser className="w-3.5 h-3.5" /> LIMPIAR FORMATO
        </button>
      </div>

      {/* Área Editable */}
      {/* Forzamos estilos explícitos para que el contenido fluya verticalmente y no en columnas */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="min-h-[220px] max-h-[450px] overflow-y-auto px-5 py-4 text-sm text-slate-100 leading-relaxed
          focus:outline-none prose-letter empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500 empty:before:italic
          [&_p]:block [&_p]:mb-3 [&_p]:w-full [&_p]:whitespace-normal [&_p]:text-slate-100
          [&_h1]:block [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-3
          [&_h2]:block [&_h2]:text-base [&_h2]:font-bold [&_h2]:my-2
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_li]:mb-1 [&_li]:text-slate-100"
      />

      {/* Contador de Palabras y Caracteres */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-slate-800/80 bg-black/20 text-[6.5px] font-retro text-slate-400">
        <span>CHOE-OS RICH EDITOR v2.0</span>
        <div className="flex gap-4">
          <span>PALABRAS: <strong className="text-pastel-lavender">{wordCount}</strong></span>
          <span>CARACTERES: <strong className="text-pastel-lavender">{charCount}</strong></span>
        </div>
      </div>
    </div>
  );
}
