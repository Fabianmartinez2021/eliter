/* eslint-disable */
import React from 'react';
import { useDraggable } from '../../helpers/useDraggable';
import { Spinner } from 'reactstrap';
import '../../assets/css/metaBubble.css';

const defaultPosition = (isMobile) => {
  if (typeof window === 'undefined') return { top: 160, left: 200 };
  const cardWidth = isMobile ? 150 : 200;
  return {
    top: isMobile ? 70 : 160,
    left: window.innerWidth - (cardWidth + (isMobile ? 16 : 40)),
  };
};

/**
 * Burbuja flotante de "Meta alcanzada" arrastrable (móvil y escritorio).
 * @param {string} title - Título (ej. "Meta alcanzada")
 * @param {number} percentage - Porcentaje a mostrar
 * @param {boolean} reached - Si la meta está alcanzada (verde) o no (naranja)
 * @param {boolean} loading - Si está cargando
 * @param {boolean} darkMode - Modo oscuro
 * @param {boolean} isMobile - Ajusta tamaño y posición inicial
 */
export const MetaBubble = ({
  title = 'Meta alcanzada',
  percentage,
  reached = false,
  loading = false,
  darkMode = false,
  isMobile = false,
}) => {

  const cardWidth = isMobile ? 150 : 200;
  const cardHeight = isMobile ? 90 : 100;

  const { position, handlers } = useDraggable(
    defaultPosition(isMobile),
    true,
    { cardWidth, cardHeight, margin: 8 }
  );

  return (
    <div
      className={`meta-bubble ${loading ? 'meta-bubble--loading' : ''} ${darkMode ? 'dark-mode' : ''}`}
      style={{
        top: position.top,
        left: position.left,
        width: cardWidth,
        minHeight: cardHeight,
      }}
      {...handlers}
    >
      {loading ? (
        <>
          <Spinner size="lg" color="primary" className="meta-bubble__spinner" />
          <span className="meta-bubble__text">Calculando...</span>
        </>
      ) : (
        <>
          <p className="meta-bubble__label">{title}</p>
          <p className={`meta-bubble__value ${reached ? 'reached' : 'pending'}`}>
            {percentage != null ? `${Number(percentage).toFixed(2)}%` : '—'}
          </p>
        </>
      )}
    </div>
  );
};

export default MetaBubble;
