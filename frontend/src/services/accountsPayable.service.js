/* eslint-disable */
import { apiUrl } from '../config/config';
import authHeader from '../helpers/auth-header';
import handleResponse from '../helpers/handleResponse';

/**
 * Contrato esperado con el backend:
 * POST /accounts-payable/table-accounts-payable → tabla paginada (mismo patrón que pending-payments)
 * POST /accounts-payable/create-accounts-payable → alta: inventario + cuenta por pagar
 *   body incluye supplierName (texto libre) en lugar de supplierId
 * PATCH /accounts-payable/pay-accounts-payable/:id → registrar pago (referencial)
 * PATCH /accounts-payable/edit-payment-accounts-payable/:id → editar datos del pago ya registrado (mismo body que pay)
 */
export const accountsPayableService = {

    accountsPayableTable: async (user, pageIndex, pageSize, sortBy, filters, isExcel) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pageIndex, pageSize, sortBy, filters, isExcel })
        };
        const response = await fetch(`${apiUrl}/accounts-payable/table-accounts-payable`, requestOptions);
        return handleResponse(response);
    },

    createAccountsPayable: async (payload) => {
        const requestOptions = {
            method: 'POST',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };
        const response = await fetch(`${apiUrl}/accounts-payable/create-accounts-payable`, requestOptions);
        return handleResponse(response);
    },

    /** Marca como pagada (solo referencial; no mueve cajas). Body: user, paymentMethod, paymentReference? */
    payAccountsPayable: async (id, payload) => {
        const requestOptions = {
            method: 'PATCH',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };
        const response = await fetch(`${apiUrl}/accounts-payable/pay-accounts-payable/${id}`, requestOptions);
        return handleResponse(response);
    },

    /** Actualiza datos del pago ya registrado (mismo cuerpo que al pagar). */
    editAccountsPayablePayment: async (id, payload) => {
        const requestOptions = {
            method: 'PATCH',
            headers: { ...authHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };
        const response = await fetch(`${apiUrl}/accounts-payable/edit-payment-accounts-payable/${id}`, requestOptions);
        return handleResponse(response);
    },
};
