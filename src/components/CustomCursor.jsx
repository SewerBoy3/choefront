import React, { useEffect, useRef } from 'react';

/**
 * Cursor personalizado estilo RPG que sigue las coordenadas del mouse.
 * Se renderiza como un corazón pixelado. Implementado con manipulación directa
 * del DOM y lerp (interpolación lineal) en requestAnimationFrame para eliminar
 * el lag de React y lograr un seguimiento instantáneo y súper fluido.
 */
export default function CustomCursor() {
  const heartRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    let mouseX = -100;
    let mouseY = -100;
    let trailX = -100;
    let trailY = -100;

    let isHovering = false;
    let isClicking = false;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onDown = () => {
      isClicking = true;
      updateStyles();
    };

    const onUp = () => {
      isClicking = false;
      updateStyles();
    };

    const onHoverOn = (e) => {
      if (e.target.matches('button, a, input, select, textarea, [data-cursor-hover], .retro-btn')) {
        isHovering = true;
        updateStyles();
      }
    };

    const onHoverOff = (e) => {
      if (e.target.matches('button, a, input, select, textarea, [data-cursor-hover], .retro-btn')) {
        isHovering = false;
        updateStyles();
      }
    };

    const updateStyles = () => {
      const scale = isClicking ? 0.75 : isHovering ? 1.3 : 1;
      const fill = isHovering ? '#ff0055' : '#ff99aa';

      if (heartRef.current) {
        heartRef.current.style.setProperty('--scale', String(scale));
        const rects = heartRef.current.querySelectorAll('rect');
        rects.forEach(r => r.setAttribute('fill', fill));
      }

      if (trailRef.current) {
        const borderBox = trailRef.current.querySelector('div');
        if (borderBox) {
          borderBox.style.boxShadow = isHovering ? '0 0 6px #ff99aa' : 'none';
        }
      }
    };

    let animationFrameId;
    const tick = () => {
      // Mover el corazón de forma instantánea
      if (heartRef.current) {
        const scale = heartRef.current.style.getPropertyValue('--scale') || '1';
        heartRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      // Mover el trail con retraso suave (lerp)
      const dx = mouseX - trailX;
      const dy = mouseY - trailY;
      trailX += dx * 0.18;
      trailY += dy * 0.18;

      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${trailX}px, ${trailY}px, 0) translate(-50%, -50%)`;
        trailRef.current.style.opacity = isClicking ? '0.7' : '0.3';
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onHoverOn);
    window.addEventListener('mouseout', onHoverOff);

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onHoverOn);
      window.removeEventListener('mouseout', onHoverOff);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Cursor principal: corazón pixelado */}
      <div
        ref={heartRef}
        className="fixed pointer-events-none z-[99999]"
        style={{
          left: 0,
          top: 0,
          transform: 'translate3d(-100px, -100px, 0)',
          imageRendering: 'pixelated',
          willChange: 'transform',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 8 8"
          style={{ imageRendering: 'pixelated', display: 'block' }}
        >
          <rect x="1" y="0" width="2" height="1" fill="#ff99aa" />
          <rect x="5" y="0" width="2" height="1" fill="#ff99aa" />
          <rect x="0" y="1" width="3" height="2" fill="#ff99aa" />
          <rect x="5" y="1" width="3" height="2" fill="#ff99aa" />
          <rect x="0" y="3" width="8" height="2" fill="#ff99aa" />
          <rect x="1" y="5" width="6" height="1" fill="#ff99aa" />
          <rect x="2" y="6" width="4" height="1" fill="#ff99aa" />
          <rect x="3" y="7" width="2" height="1" fill="#ff99aa" />
        </svg>
      </div>

      {/* Trail: Círculo/Cuadrado tenue con retraso físico */}
      <div
        ref={trailRef}
        className="fixed top-0 left-0 z-[99998] pointer-events-none"
        style={{
          transform: 'translate3d(-100px, -100px, 0)',
          willChange: 'transform',
        }}
      >
        <div
          className="w-7 h-7 border-2 border-pink-400 rounded-none"
        />
      </div>
    </>
  );
}
