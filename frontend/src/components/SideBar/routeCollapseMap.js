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

    //inventario

    '/balance-report': 8,
    'payment-methods-report': 8,
    'payment-methods-history': 8,
    'payment-methods-general-report': 8,
    'inventory-report-daily': 8,

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


    // Resguardos
    '/resguard-withdrawal': 12,
    '/resguard-report': 12,
    '/resguard-history': 12,
    '/withdrawal-report': 12,

    // Registrar ventas
    '/offline-sales': 13,
    '/register-sale': 13,
    '/register-wholesale': 13,
    '/credit-payment': 13,
    '/historial-cupones': 13,
    '/pending-payments': 13,

    // Operadores
    '/operators': 14,
    '/register-operator': 14,
    '/update-operator': 14,
    '/drivers': 14,
    '/register-driver': 14,
    '/update-driver': 14,

    // Reportes de inventario (detallado)
    '/inventory-adjustment-history': 15,
    '/inventory-report': 15,
    '/inventory-history': 15,
    '/inventory-sell': 15,
    '/departures': 15,
    '/departure': 15,
    

    // Reportes de clientes
    '/wholesale-client-list': 16,
    '/client-list': 16,
    '/register-wholesale-client': 16,
    '/update-wholesale-client': 16,

    // Reporte de ventas
    '/sales': 17,
    '/sales-chart': 17,
    '/pending-payments-special': 17,
    '/sales-combos-chart': 17,
    '/real-time-goals': 17,

    // Cuentas por pagar
    '/accounts-payable': 28,
    '/register-accounts-payable': 28,

    // Reportes financieros
    '/commissions-report': 18,
    '/cashiers-performance': 18,
    '/payment-methods-report': 18,
    '/payment-methods-history': 18,
    '/payment-methods-general-report': 18,
    '/payment-methods-chart': 18,

    // Reportes de televentas (menú oculto)
    // '/telesales': 19,
    // '/telesales-commissions-report': 19,
    // '/telesales-pending-payments': 19,

    // Otros reportes
    '/cron-history': 20,
    '/webhook-history': 20,

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

    // Ventas especiales
    '/register-sale-special': 24,
    '/register-wholesale-special': 24,
    '/offline-sales-special': 24,
    '/credit-special-payment': 24,

    // Inventario especial
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

    // Vales
    '/vale-payments': 26,
    '/register-wholevale': 26,
    '/register-vale': 26,
    '/pending-vales': 26,

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

