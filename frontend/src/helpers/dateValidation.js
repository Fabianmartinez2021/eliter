import moment from 'moment';

/**
 * Valida un rango de fechas
 * @param {string|moment} startDate - Fecha inicial
 * @param {string|moment} endDate - Fecha final
 * @param {number} maxDays - Número máximo de días permitidos en el rango (default: 60)
 * @returns {Object} - { isValid: boolean, message: string }
 */
export const validateDateRange = (startDate, endDate, maxDays = 60) => {
  // Validar fecha inicial
  if (startDate && startDate !== "" && !moment(startDate).isValid()) {
    return { isValid: false, message: 'Ingrese una fecha válida' };
  }
  
  // Validar fecha final
  if (endDate && endDate !== "" && !moment(endDate).isValid()) {
    return { isValid: false, message: 'Ingrese una fecha válida' };
  }
  
  // Verificar que la fecha final sea superior o igual a la inicial
  if (startDate && endDate && startDate !== "" && endDate !== "") {
    const isAfter = moment(startDate).isAfter(endDate);
    if (isAfter) {
      return { isValid: false, message: 'La fecha inicial no puede ser superior a la final' };
    }
    
    // Verificar rango máximo de días
    const dateDiff = moment(endDate).diff(moment(startDate), 'days');
    if (dateDiff > maxDays) {
      return { isValid: false, message: `El rango de fechas no puede superar los ${maxDays} días` };
    }
  }
  
  return { isValid: true };
};
