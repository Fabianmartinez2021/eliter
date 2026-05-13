import { SHOW_COUPONS_AND_PROMOTIONS_MODULE } from '../config/config';

/**
 * Precio unitario mostrado en el catálogo modal: Bs (con tasa del dólar) y USD (precio de lista),
 * alineado con la lógica habitual de línea de venta (oferta en Bs si aplica).
 *
 * @param {object} product — ítem del catálogo (code, price).
 * @param {number} dollarRate — tasa Bs por USD (ej. valor moneda "dólar").
 * @param {Array|null} offerProducts — ofertas del backend, si existen.
 * @returns {{ bs: number|null, usd: number|null }}
 */
export function getCatalogUnitPriceBsUsd(product, dollarRate, offerProducts) {
    const rate = Number(dollarRate);
    const validRate = Number.isFinite(rate) && rate > 0 ? rate : 0;
    const code = String(product?.code ?? '').trim();

    let offer = null;
    if (
        SHOW_COUPONS_AND_PROMOTIONS_MODULE &&
        offerProducts &&
        offerProducts.length > 0 &&
        code
    ) {
        offer = offerProducts.find(
            (item) => String(item.product?.code ?? '').trim() === code
        );
    }

    if (offer != null && offer.price != null && offer.price !== '') {
        const priceBs = parseFloat(offer.price);
        if (!Number.isFinite(priceBs)) return { bs: null, usd: null };
        const usd = validRate > 0 ? priceBs / validRate : null;
        return { bs: priceBs, usd };
    }

    const pr = parseFloat(product?.price);
    if (!Number.isFinite(pr)) return { bs: null, usd: null };

    if (validRate > 0) {
        return { bs: pr * validRate, usd: pr };
    }
    return { bs: null, usd: pr };
}
