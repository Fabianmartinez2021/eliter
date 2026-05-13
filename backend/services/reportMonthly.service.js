const mongoose = require('mongoose');
const db = require('../_helpers/db');
const moment = require('moment');

const Invoice = db.Invoice;
const SalesFiscal = db.SalesFiscal;
const InventoryRecordFiscal = db.InventoryRecordFiscal;

let reportMonthlyService = {
    getFiscalReport: async (params) => {
        try {
            const { filters, sortBy } = params;

           

            if (!filters) {
                throw new Error("Debe proporcionar filtros para la consulta.");
            }

            // Validación del filtro de mes (obligatorio)
            if (!filters.month) {
                throw new Error("Debe proporcionar un mes para la consulta.");
            }

            // Construir filtro de fechas basado en el mes
            const monthStart = moment(filters.month, 'YYYY-MM').utc().startOf('month');
            const monthEnd = moment(filters.month, 'YYYY-MM').utc().endOf('month');

            const dateFilter = {
                createdDate: {
                    $gte: new Date(monthStart.toISOString()),
                    $lte: new Date(monthEnd.toISOString()),
                },
            };

            // Filtro por agencia (si está definido)
            const agencyFilter = filters.agency
                ? { agency: mongoose.Types.ObjectId(filters.agency) }
                : {};

            let sortField = 'date'; // Campo de ordenación predeterminado
            let sortDirection = 1; // 1 para ascendente, -1 para descendente

            if (sortBy) {
                sortField = sortBy.id || 'date';
                sortDirection = sortBy.desc ? -1 : 1;
            }

            // Consultas paralelas con filtros específicos
            const [invoices, salesFiscal, inventoryRecordFiscal] = await Promise.all([
                // Consulta para facturas
                Invoice.find({ ...dateFilter, ...agencyFilter })
                    .sort({ [sortField]: sortDirection })
                    .populate({
                        path: 'products', // Relacionar los productos de la factura
                        select: 'name price kg code lastPrice wholesalePrice',
                    })
                    .populate({
                        path: 'agency',
                        select: 'name company address',
                        match: filters.company ? { company: filters.company } : {}, // Filtrar por compañía
                    })
                    .then((results) =>
                        results
                            .filter((doc) => doc.agency) // Eliminar documentos sin agencia
                            .filter((doc) =>
                                filters.code
                                    ? doc.products.some((product) => product?.code === filters.code) // Filtrar productos dentro de la factura
                                    : true
                            )
                    ),

                // Consulta para ventas fiscales
                SalesFiscal.find({ ...dateFilter, ...agencyFilter })
                    .sort({ [sortField]: sortDirection })
                    .populate('products')
                    .populate({
                        path: 'agency',
                        select: 'name company',
                        match: filters.company ? { company: filters.company } : {}, // Filtrar por compañía
                    })
                    .then((results) =>
                        results
                            .filter((doc) => doc.agency) // Eliminar documentos sin agencia
                            .filter((doc) =>
                                filters.code
                                    ? doc.products.some((product) => product?.code === filters.code) // Filtrar productos dentro de la venta fiscal
                                    : true
                            )
                    ),

                // Consulta para inventarios fiscales
                InventoryRecordFiscal.find({ ...dateFilter, ...agencyFilter })
                    .sort({ [sortField]: sortDirection })
                    .populate({
                        path: 'product',
                        select: 'name price kg code', // Relacionar el producto en el inventario fiscal
                    })
                    .populate({
                        path: 'agency',
                        select: 'name company',
                        match: filters.company ? { company: filters.company } : {}, // Filtrar por compañía
                    })
                    .then((results) =>
                        results
                            .filter((doc) => doc.agency) // Eliminar documentos sin agencia
                            .filter((doc) =>
                                filters.code ? doc.product?.code === filters.code : true
                            )
                    ),
            ]);

            const result = {
                invoices: invoices.map((invoice) => invoice.toJSON()),
                salesFiscal: salesFiscal.map((item) => item.toJSON()),
                inventoryRecordFiscal: inventoryRecordFiscal.map((item) => item.toJSON()),
            };

            return result;

        } catch (error) {
            // Manejo de errores
            console.error('Error en getFiscalReport:', error.message);
            throw new Error(`No se pudo generar el reporte mensual: ${error.message}`);
        }
    },
};

module.exports = reportMonthlyService;
