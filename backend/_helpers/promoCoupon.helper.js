/**
 * Normaliza el código de cupón al formato guardado en BD ("00" a "3000").
 * Códigos 0-9 se devuelven con cero a la izquierda ("00"-"09").
 * @param {string} input - Código ingresado por el usuario (ej. "0", "00", "5", "42")
 * @returns {string|null} - Código normalizado o null si no es válido (fuera de rango 0-3000)
 */
function normalizeCouponCode(input) {
    if (input == null || typeof input !== 'string') return null;
    const trimmed = String(input).trim();
    if (trimmed === '') return null;
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 0 || num > 3000) return null;
    return num <= 9 ? '0' + num : String(num);
}

module.exports = { normalizeCouponCode };
