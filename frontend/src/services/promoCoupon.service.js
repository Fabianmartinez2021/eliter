/* eslint-disable */
import { apiUrl } from "../config/config";
import authHeader from "../helpers/auth-header";
import handleResponse from "../helpers/handleResponse";

/**
 * Valida si un cupón existe y está disponible (solo para UX; la reserva real es al crear la venta).
 * Si se envía total, el backend devuelve montos con y sin descuento para mostrarlos en pantalla.
 * @param {string} couponCode - Código del cupón
 * @param {number} [total] - Total actual de la venta (opcional). Si se envía, la respuesta incluye totalBeforeDiscount, couponDiscount, totalAfterDiscount.
 * @returns {Promise<{ valid: boolean, message?: string, totalBeforeDiscount?: number, couponDiscount?: number, totalAfterDiscount?: number }>}
 */
export const validateCoupon = async (couponCode, total) => {
  const body = { couponCode: couponCode ? String(couponCode).trim() : "" };
  if (typeof total === "number" && !isNaN(total) && total > 0) body.total = total;
  const requestOptions = {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const response = await fetch(`${apiUrl}/sales/validate-coupon`, requestOptions);
  return handleResponse(response);
};

/**
 * Obtiene el historial de cupones usados con datos del cliente (nombre, teléfono, dirección).
 * @param {Object} [params] - Parámetros opcionales: date (YYYY-MM-DD), dateFrom, dateTo (rango).
 * @returns {Promise<Array>}
 */
export const getCouponHistory = async (params = {}) => {
  const requestOptions = {
    method: "GET",
    headers: authHeader(),
  };
  const q = new URLSearchParams();
  if (params.date) q.set("date", params.date);
  if (params.dateFrom) q.set("dateFrom", params.dateFrom);
  if (params.dateTo) q.set("dateTo", params.dateTo);
  const query = q.toString();
  const url = query ? `${apiUrl}/sales/coupon-history?${query}` : `${apiUrl}/sales/coupon-history`;
  const response = await fetch(url, requestOptions);
  return handleResponse(response);
};
