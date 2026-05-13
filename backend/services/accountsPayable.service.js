const db = require('../_helpers/db');
const AccountsPayable = db.AccountsPayable;
const inventoryService = require('./inventory.service');
const role = require('../enums/roles.enum');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment');

const SORT_FIELDS = {
    createdDate: 'createdDate',
    invoiceRef: 'invoiceRef',
    total: 'total',
    pending: 'pending',
    daysCounter: 'daysCounter',
    status: 'status',
    'agency.name': 'agency.name'
};

function parsePaymentMix(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    const keys = ['cashUsd', 'cashVes', 'cashEur', 'cashCop', 'transferUsd', 'transferVes'];
    const out = {};
    for (const k of keys) {
        const v = raw[k];
        const n = v == null || v === '' ? 0 : Number(parseFloat(String(v).replace(/,/g, '')));
        out[k] = Number.isNaN(n) ? 0 : Math.round(n * 1000000) / 1000000;
    }
    return out;
}

function paymentMixSum(mix) {
    if (!mix) return 0;
    return (mix.cashUsd || 0) + (mix.cashVes || 0) + (mix.cashEur || 0) + (mix.cashCop || 0)
        + (mix.transferUsd || 0) + (mix.transferVes || 0);
}

function parseNum(v) {
    if (v == null || v === '') return 0;
    const n = Number(parseFloat(String(v).replace(/,/g, '')));
    return Number.isNaN(n) ? 0 : n;
}

function parsePaymentRates(raw) {
    if (!raw || typeof raw !== 'object') {
        return { vesPerUsd: 0, usdPerEur: 0, copPerUsd: 0 };
    }
    return {
        vesPerUsd: parseNum(raw.vesPerUsd),
        usdPerEur: parseNum(raw.usdPerEur),
        copPerUsd: parseNum(raw.copPerUsd)
    };
}

/**
 * Equiv. USD (misma base que total/pending del documento).
 * VES: Bs por 1 USD → USD = Bs / vesPerUsd
 * EUR: USD por 1 EUR → USD = EUR * usdPerEur
 * COP: COP por 1 USD → USD = COP / copPerUsd
 */
function computePaymentUsdFromMix(mix, rates) {
    if (!mix) {
        throw 'Desglose de pago mixto inválido';
    }
    const r = rates || { vesPerUsd: 0, usdPerEur: 0, copPerUsd: 0 };
    let usd = (mix.cashUsd || 0) + (mix.transferUsd || 0);
    const ves = (mix.cashVes || 0) + (mix.transferVes || 0);
    const eur = (mix.cashEur || 0);
    const cop = (mix.cashCop || 0)
        + 0; // no transferCop in schema

    if (ves > 0) {
        if (!r.vesPerUsd || r.vesPerUsd <= 0) {
            throw 'Indique la tasa Bs por USD (Bs por cada 1 USD) para convertir bolívares';
        }
        usd += ves / r.vesPerUsd;
    }
    if (eur > 0) {
        if (!r.usdPerEur || r.usdPerEur <= 0) {
            throw 'Indique la tasa USD por EUR (equivalente en USD de 1 EUR)';
        }
        usd += eur * r.usdPerEur;
    }
    if (cop > 0) {
        if (!r.copPerUsd || r.copPerUsd <= 0) {
            throw 'Indique la tasa COP por USD (COP por cada 1 USD)';
        }
        usd += cop / r.copPerUsd;
    }
    if (usd <= 0) {
        throw 'El monto equiv. en USD debe ser mayor a 0 (revise montos y tasas)';
    }
    return Math.round(usd * 10000) / 10000;
}

function sumPaymentsAmounts(payments) {
    if (!payments || !payments.length) return 0;
    return payments.reduce((s, p) => s + (parseNum(p.amountUsd) || 0), 0);
}

function computeTotalFromProducts(products, explicitAmount) {
    if (explicitAmount != null && !Number.isNaN(Number(explicitAmount))) {
        return Number(explicitAmount);
    }
    let sum = 0;
    for (const p of products) {
        const kg = parseFloat(p.kg) || 0;
        const price = parseFloat(p.price != null ? p.price : 0) || 0;
        sum += kg * price;
    }
    return Math.round(sum * 10000) / 10000;
}

let accountsPayableService = {

    create: async (params) => {
        const supplierName = (params.supplierName || '').trim();
        if (!supplierName) {
            throw 'Indique el nombre del proveedor';
        }
        if (!params.products || !params.products.length) {
            throw 'Debe incluir al menos un producto';
        }
        if (!params.agency || !params.user) {
            throw 'Datos de usuario o sucursal incompletos';
        }

        if (!ObjectId.isValid(params.agency)) {
            throw 'Identificador de sucursal inválido';
        }

        const agencyId = ObjectId(params.agency);
        const userId = ObjectId(params.user);

        const inventoryProducts = [];
        const snapshotLines = [];

        for (const item of params.products) {
            const pid = item.id || item._id;
            if (!pid || !ObjectId.isValid(pid)) {
                throw 'Producto inválido en la lista';
            }
            const kg = parseFloat(item.kg);
            if (Number.isNaN(kg) || kg <= 0) {
                throw 'Cantidad inválida para un producto';
            }
            const price = item.price != null ? parseFloat(item.price) : 0;
            inventoryProducts.push({
                id: pid,
                kg,
                price: Number.isNaN(price) ? 0 : price
            });
            snapshotLines.push({
                code: item.code != null ? String(item.code) : '',
                name: item.name || '',
                kg,
                price: Number.isNaN(price) ? 0 : price
            });
        }

        const total = computeTotalFromProducts(inventoryProducts, params.amount);
        const pending = total;

        /**
         * Solo inventario de productos (café, modelo Product / inventory.service).
         * No usar inventario de suministros (inventoryMiscellaneous); ese flujo sigue por sus propias pantallas.
         */
        const inventoryParam = {
            agency: agencyId,
            note: (params.note && String(params.note).trim()) ? String(params.note).trim() : 'Compra proveedor',
            comment: params.comment || '',
            typeIn: 'externProvider',
            products: inventoryProducts
        };

        await inventoryService.create(inventoryParam);

        let dueDate;
        if (params.dueDate) {
            const d = moment(params.dueDate);
            dueDate = d.isValid() ? d.toDate() : undefined;
        }

        const doc = new AccountsPayable({
            supplierName,
            agency: agencyId,
            user: userId,
            invoiceRef: (params.invoiceRef || '').trim(),
            dueDate,
            note: params.note || '',
            comment: params.comment || '',
            products: snapshotLines,
            total,
            pending,
            status: false,
            daysCounter: 0
        });

        await doc.save();
        return {};
    },

    dataTable: async (dataParams) => {
        const pageSize = dataParams.pageSize || 10;
        const pageIndex = dataParams.pageIndex || 1;

        let sortBy = { createdDate: -1 };
        if (dataParams.sortBy && dataParams.sortBy.id) {
            const field = SORT_FIELDS[dataParams.sortBy.id] || 'createdDate';
            const direction = dataParams.sortBy.desc === true ? -1 : 1;
            sortBy = { [field]: direction };
        }

        const stages = [
            { $lookup: { from: 'agencies', localField: 'agency', foreignField: '_id', as: 'agency' } },
            { $unwind: '$agency' },
            { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $lookup: { from: 'users', localField: 'paidBy', foreignField: '_id', as: 'paidByUser' } },
            { $unwind: { path: '$paidByUser', preserveNullAndEmptyArrays: true } },
            { $sort: sortBy }
        ];

        if (!dataParams.isExcel) {
            stages.push({
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: (pageSize * pageIndex) - pageSize },
                        { $limit: pageSize },
                        { $addFields: { id: '$_id' } }
                    ],
                    totalPending: [
                        { $match: { status: false } },
                        { $group: { _id: null, total: { $sum: '$pending' } } }
                    ]
                }
            });
        }

        const u = dataParams.user;
        if (u && (u.role === role.rol.Cashier || u.role === role.rol.Telesales)) {
            if (u.agency) {
                stages.unshift({ $match: { agency: ObjectId(u.agency) } });
            }
        }

        if (dataParams.filters) {
            const f = dataParams.filters;
            if (f.agency) {
                stages.unshift({ $match: { agency: ObjectId(f.agency) } });
            }
            if (f.documentRef) {
                const regex = new RegExp(f.documentRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                stages.unshift({ $match: { invoiceRef: { $regex: regex } } });
            }
            if (f.order) {
                const ord = String(f.order).trim();
                if (ObjectId.isValid(ord) && ord.length === 24) {
                    stages.unshift({ $match: { _id: ObjectId(ord) } });
                }
            }
            if (f.startDate && !f.endDate) {
                const startDate = moment(f.startDate).utc().startOf('day');
                stages.unshift({ $match: { createdDate: { $gte: new Date(startDate) } } });
            }
            if (!f.startDate && f.endDate) {
                const endDate = moment(f.endDate).utc().endOf('day');
                stages.unshift({ $match: { createdDate: { $lte: new Date(endDate) } } });
            }
            if (f.startDate && f.endDate) {
                const startDate = moment(f.startDate).utc().startOf('day');
                const endDate = moment(f.endDate).utc().endOf('day');
                stages.unshift({
                    $match: {
                        createdDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
                    }
                });
            }
        }

        const agg = await AccountsPayable.aggregate(stages);

        if (dataParams.isExcel) {
            return agg;
        }

        const block = agg[0] || {};
        const meta = block.metadata && block.metadata[0];
        const totalPend = block.totalPending && block.totalPending[0];

        return {
            results: block.data || [],
            metadata: meta ? [{ total: meta.total }] : [{ total: 0 }],
            totalPending: totalPend && totalPend.total != null ? totalPend.total : 0
        };
    },

    /**
     * Registra un abono en USD equivalente (tasas manuales en mixto; no usa liscoin).
     * pending = total - sum(payments.amountUsd). status = true cuando pending ~ 0.
     */
    markPaid: async (id, params) => {
        if (!id || !ObjectId.isValid(id)) {
            throw 'Identificador de cuenta inválido';
        }
        const method = params.paymentMethod;
        if (method !== 'cash' && method !== 'transfer' && method !== 'mixed') {
            throw 'Indique el método de pago: efectivo, transferencia o mixto';
        }
        const paidBy = params.user;
        if (!paidBy || !ObjectId.isValid(paidBy)) {
            throw 'Usuario no válido';
        }

        const doc = await AccountsPayable.findById(id);
        if (!doc) {
            throw 'Cuenta por pagar no encontrada';
        }
        const pendingBefore = parseNum(doc.pending);
        if (pendingBefore <= 0.0001) {
            throw 'No hay saldo pendiente en esta cuenta';
        }

        const ref = (params.paymentReference || '').trim();
        const note = (params.paymentNote || '').trim();

        if (method === 'transfer' && !ref) {
            throw 'Indique referencia o comprobante de la transferencia';
        }

        let payUsd;
        let mix;
        let rates;

        if (method === 'mixed') {
            mix = parsePaymentMix(params.paymentMix);
            rates = parsePaymentRates(params.paymentRates);
            if (!mix || paymentMixSum(mix) <= 0) {
                throw 'Indique al menos un monto en el desglose (efectivo o transferencia)';
            }
            const hasTransferAmount = (mix.transferUsd > 0 || mix.transferVes > 0);
            if (hasTransferAmount && !ref) {
                throw 'Indique referencia o comprobante de la transferencia';
            }
            payUsd = computePaymentUsdFromMix(mix, rates);
        } else {
            let amt = params.paymentAmountUsd;
            if (amt == null || amt === '') {
                payUsd = pendingBefore;
            } else {
                payUsd = parseNum(amt);
                if (payUsd <= 0) {
                    throw 'Indique un monto de abono mayor a 0 (USD equivalente)';
                }
            }
            payUsd = Math.min(payUsd, pendingBefore);
            mix = undefined;
            rates = undefined;
            doc.paymentMix = undefined;
            doc.paymentRates = undefined;
        }

        payUsd = Math.min(payUsd, pendingBefore);
        payUsd = Math.round(payUsd * 10000) / 10000;

        if (method === 'mixed') {
            doc.paymentMix = mix;
            doc.paymentRates = rates;
        }

        doc.paymentNote = note;
        doc.paymentReference = ref;
        doc.paymentMethod = method;
        doc.paymentAmountUsd = payUsd;
        const payDate = moment().subtract(4, 'hours').toDate();
        doc.paymentDate = payDate;
        doc.paidBy = ObjectId(paidBy);

        const entry = {
            amountUsd: payUsd,
            paymentMethod: method,
            paymentReference: ref,
            paymentNote: note,
            paymentMix: mix || undefined,
            paymentRates: rates || undefined,
            paymentDate: payDate,
            paidBy: ObjectId(paidBy)
        };

        if (!doc.payments) {
            doc.payments = [];
        }
        doc.payments.push(entry);

        const total = parseNum(doc.total);
        const sumPaid = sumPaymentsAmounts(doc.payments);
        doc.pending = Math.max(0, Math.round((total - sumPaid) * 10000) / 10000);
        doc.status = doc.pending <= 0.0001;
        if (doc.status) {
            doc.pending = 0;
            doc.daysCounter = 0;
        }

        await doc.save();
        return {};
    },

    /**
     * Reemplaza el único abono (misma validación que al pagar). Solo si hay un solo movimiento en payments.
     */
    updatePayment: async (id, params) => {
        if (!id || !ObjectId.isValid(id)) {
            throw 'Identificador de cuenta inválido';
        }
        const doc = await AccountsPayable.findById(id);
        if (!doc) {
            throw 'Cuenta por pagar no encontrada';
        }
        if (!doc.payments || doc.payments.length !== 1) {
            throw 'Solo se puede editar el pago cuando hay un único abono registrado';
        }
        doc.payments = [];
        doc.pending = parseNum(doc.total);
        doc.status = false;
        doc.paymentMethod = undefined;
        doc.paymentMix = undefined;
        doc.paymentRates = undefined;
        doc.paymentAmountUsd = undefined;
        doc.paymentReference = '';
        doc.paymentNote = '';
        doc.paymentDate = undefined;
        doc.paidBy = undefined;
        await doc.save();
        return accountsPayableService.markPaid(id, params);
    }
};

module.exports = accountsPayableService;
