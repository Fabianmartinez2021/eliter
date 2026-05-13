import moment from 'moment';

export const isValidDate = (current) => {
  // Deshabilitar fechas futuras
  const today = moment().startOf('day'); // Obtener la fecha actual sin hora
  return current.isBefore(today) || current.isSame(today, 'day');
};
