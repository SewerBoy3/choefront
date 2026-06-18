import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Botón magnético estilo RPG usando useMotionValue + useSpring.
 * Cero re-renders de React en onMouseMove — la animación corre
 * íntegramente en el sistema de Framer Motion (fuera del ciclo React).
 */
export default function MagneticButton({ children, className, onClick, onMouseEnter }) {
  const ref = useRef(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  // Spring suave: stiffness alta + damping bajo = sensación magnética
  const x = useSpring(rawX, { stiffness: 220, damping: 14, mass: 0.1 });
  const y = useSpring(rawY, { stiffness: 220, damping: 14, mass: 0.1 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const dx = e.clientX - (left + width / 2);
    const dy = e.clientY - (top + height / 2);
    const maxOffset = 7;
    const strength = 0.22;
    rawX.set(Math.max(-maxOffset, Math.min(maxOffset, dx * strength)));
    rawY.set(Math.max(-maxOffset, Math.min(maxOffset, dy * strength)));
  };

  const handleMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={className}
    >
      {children}
    </motion.button>
  );
}
