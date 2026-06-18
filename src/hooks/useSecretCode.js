import { useEffect, useState } from 'react';

/**
 * Custom Hook para escuchar una secuencia de teclas secreta.
 */
export default function useSecretCode(secretCode, callback) {
  const [buffer, setBuffer] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar si el usuario está escribiendo en un campo de texto real
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key.length !== 1) return;
      const char = e.key.toLowerCase();
      setBuffer((prev) => {
        const next = (prev + char).slice(-secretCode.length);
        if (next === secretCode) {
          callback();
          return '';
        }
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [secretCode, callback]);

  return buffer;
}
