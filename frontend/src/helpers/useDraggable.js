/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook para hacer elementos arrastrables (móvil + escritorio).
 * @param {Object} initialPosition - Posición inicial { top, left }
 * @param {boolean} enabled - Si el drag está habilitado (true = siempre arrastrable)
 * @param {Object} constraints - Restricciones { cardWidth, cardHeight, margin }
 * @returns {Object} { position, handlers, dragRef }
 */
export const useDraggable = (initialPosition, enabled = true, constraints = {}) => {
  const [position, setPosition] = useState(initialPosition);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    startTop: 0,
    startLeft: 0,
    dragging: false,
  });

  const {
    cardWidth = 150,
    cardHeight = 90,
    margin = 8
  } = constraints;

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition.top, initialPosition.left]);

  const clampPosition = useCallback((newTop, newLeft) => {
    if (typeof window === 'undefined') return { top: newTop, left: newLeft };
    const maxTop = window.innerHeight - cardHeight - margin;
    const maxLeft = window.innerWidth - cardWidth - margin;
    return {
      top: Math.max(margin, Math.min(maxTop, newTop)),
      left: Math.max(margin, Math.min(maxLeft, newLeft)),
    };
  }, [cardWidth, cardHeight, margin]);

  const handleStart = useCallback((clientX, clientY) => {
    if (!enabled) return;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      startTop: position.top,
      startLeft: position.left,
      dragging: true,
    };
  }, [enabled, position.top, position.left]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!enabled || !dragRef.current.dragging) return;
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;
    const { top, left } = clampPosition(
      dragRef.current.startTop + deltaY,
      dragRef.current.startLeft + deltaX
    );
    setPosition({ top, left });
  }, [enabled, clampPosition]);

  const handleEnd = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  // Touch
  const handleTouchStart = (e) => {
    if (!enabled) return;
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (!enabled || !dragRef.current.dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse (desktop)
  const handleMouseDown = (e) => {
    if (!enabled) return;
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    if (!enabled) return;
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [enabled, handleMove, handleEnd]);

  return {
    position,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onMouseDown: handleMouseDown,
    },
    dragRef,
  };
};
