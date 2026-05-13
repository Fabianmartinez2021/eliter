/**
 * Mapeo de rutas a collapseIds para auto-expandir secciones del menú
 * cuando se navega a una ruta específica
 */
export const routeCollapseMap = {
    // Usuarios
    '/users': 1,
    '/register-user': 1,
    '/update-user': 1,
    '/sellers': 1,
    '/register-seller': 1,
    '/update-seller': 1,

    // Sucursales
    '/agency': 2,
    '/register-agency': 2,
    '/update-agency': 2,
    '/agency-close-history': 2,

    // Productos
    '/product': 3,
    '/register-product': 3,
    '/product-history': 3,
    '/combos': 3,
    '/create-combo': 3,
    '/update-combo': 3,
    '/record-combo': 3,

    // Inventarios
    '/register-inventory': 4,
    '/readjustment': 4,
    '/inventory-entry-history': 4,
    '/inventory': 4,
    '/order-history': 4,
    '/order-helper': 4,
    '/inventory-reweigh': 4,
    '/sales-notes': 4,
    '/sales-updated': 4,

    // Monedas
    '/coin': 6,
    '/register-coin': 6,
    '/update-coin': 6,
    '/history-coin': 6,

    // Terminal
    '/terminal': 7,
    '/register-terminal': 7,
    '/update-terminal': 7,
    '/terminal-reports': 7,

    // Ofertas
    '/offer': 10,
    '/create-offer': 10,
    '/offer-history': 10,
    '/inventory-offer': 10,

    // Cajas
    '/box-opening': 11,
    '/box-withdrawal': 11,
    '/box-close': 11,
    '/box-correction': 11,
    '/box-close-report': 11,
    '/box-report': 11,
    '/box-history': 11,
    '/box-add': 11,
    '/resguard-add': 11,


    // Resguardos (misma sección que Caja de tienda)
    '/resguard-withdrawal': 11,
    '/resguard-report': 11,
    '/resguard-history': 11,
    '/withdrawal-report': 11,

    // Ventas y cobros (estándar, especiales y vales)
    '/offline-sales': 13,
    '/register-sale': 13,
    '/register-wholesale': 13,
    '/credit-payment': 13,
    '/pending-payments': 13,

    // Ventas especiales y vales (misma sección que ventas estándar)
    '/register-sale-special': 13,
    '/register-wholesale-special': 13,
    '/offline-sales-special': 13,
    '/credit-special-payment': 13,
    '/vale-payments': 13,
    '/register-wholevale': 13,
    '/register-vale': 13,
    '/pending-vales': 13,

    // Operadores
    '/operators': 14,
    '/register-operator': 14,
    '/update-operator': 14,
    '/drivers': 14,
    '/register-driver': 14,
    '/update-driver': 14,

    // Reportes (sección única del menú)
    '/inventory-adjustment-history': 30,
    '/inventory-report': 30,
    '/inventory-report-resume': 30,
    '/inventory-history': 30,
    '/inventory-sell': 30,
    '/departures': 30,
    '/departure': 30,
    '/balance-report': 30,
    '/wholesale-client-list': 30,
    '/client-list': 30,
    '/register-wholesale-client': 30,
    '/update-wholesale-client': 30,
    '/sales': 30,
    '/sales-user': 30,
    '/sales-chart': 30,
    '/pending-payments-special': 30,
    '/sales-combos-chart': 30,
    '/real-time-goals': 30,
    '/accounts-payable': 30,
    '/register-accounts-payable': 30,
    '/commissions-report': 30,
    '/cashiers-performance': 30,
    '/payment-methods-report': 30,
    '/payment-methods-history': 30,
    '/payment-methods-general-report': 30,
    '/payment-methods-chart': 30,
    '/cron-history': 30,
    '/webhook-history': 30,

    // Reportes de televentas (menú oculto)
    // '/telesales': 19,
    // '/telesales-commissions-report': 19,
    // '/telesales-pending-payments': 19,

    // Activos
    '/assets': 21,
    '/register-assets': 21,
    '/update-assets': 21,
    '/assets-record': 21,
    '/assets-dump': 21,

    // Tienda
    '/market': 22,

    // Suministros
    '/miscellaneous': 23,
    '/register-miscellaneous': 23,
    '/update-miscellaneous': 23,
    '/miscellaneous-history': 23,
    '/register-miscellaneous-inventory': 23,
    '/readjustment-miscellaneous': 23,
    '/departure-miscellaneous': 23,
    '/inventory-miscellaneous-history': 23,
    '/inventory-miscellaneous-report': 23,
    '/order-history-miscellaneous': 23,
    '/miscellaneous-pending': 23,
    '/updated-miscellaneous-inventory/': 23,
    '/departure-miscellaneous-list': 23,
    '/supply-notes': 23,
    '/supply-updated': 23,
    '/inventory-weekly-kpi': 23,

    // Inventario especial
    '/update-inventory-special': 25,
    '/register-inventory-special': 25,
    '/readjustment-special': 25,
    '/inventory-history-special': 25,
    '/monthly-report': 25,
    '/payment-special-methods-report': 25,
    '/payment-special-methods-history': 25,
    '/sales-special': 25,
    '/purchase-and-sales-history': 25,
    '/inventory-special-sell': 25,
    '/tickets-list-special': 25,
    '/kpis-monitoreo-especial': 25,

    '/support-list': 27,
    '/support-create': 27,
    '/support-detail': 27,
};

/**
 * Obtiene el collapseId para una ruta dada
 * @param {string} pathname - Ruta actual
 * @returns {number|null} - ID del collapse o null si no hay match
 */
export const getCollapseIdForRoute = (pathname) => {
    return routeCollapseMap[pathname] || null;
};

