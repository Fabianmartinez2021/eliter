/**
 * Configuración de atajos de teclado para el SideBar
 * Mapea combinaciones Ctrl + tecla a rutas
 */
export const keyboardShortcuts = {
    'a': '/register-wholesale-special',
    's': '/register-sale-special',
    'q': '/credit-payment',
    'l': '/credit-special-payment',
    'e': '/register-sale',
    'r': '/offline-sales',
    'b': '/offline-sales-special',
    'u': '/pending-payments',
    'i': '/register-inventory-special',
    'o': '/tickets-list-special',
    'p': '/readjustment-special',
    'h': '/inventory-history-special',
    'ñ': '/payment-special-methods-history'
};

/**
 * Función helper para obtener el shortcut formateado
 * @param {string} key - Tecla del atajo
 * @returns {string} - Formato del shortcut (ej: "Ctrl+y")
 */
export const getShortcutText = (key) => {
    return `Ctrl+${key}`;
};

