import { SHOW_SPECIAL_SALES_MODULE } from '../../config/config';

const coreShortcuts = {
    'q': '/credit-payment',
    'e': '/register-sale',
    'r': '/offline-sales',
    'u': '/pending-payments',
};

const specialSalesShortcuts = {
    'a': '/register-wholesale-special',
    's': '/register-sale-special',
    'l': '/credit-special-payment',
    'b': '/offline-sales-special',
    'i': '/register-inventory-special',
    'o': '/tickets-list-special',
    'p': '/readjustment-special',
    'h': '/inventory-history-special',
    'ñ': '/payment-special-methods-history'
};

/**
 * Configuración de atajos de teclado para el SideBar
 * Mapea combinaciones Ctrl + tecla a rutas
 */
export const keyboardShortcuts = SHOW_SPECIAL_SALES_MODULE
    ? { ...coreShortcuts, ...specialSalesShortcuts }
    : coreShortcuts;

/**
 * Función helper para obtener el shortcut formateado
 * @param {string} key - Tecla del atajo
 * @returns {string} - Formato del shortcut (ej: "Ctrl+y")
 */
export const getShortcutText = (key) => {
    return `Ctrl+${key}`;
};

