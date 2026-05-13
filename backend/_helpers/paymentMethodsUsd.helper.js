"use strict";

function num(x) {
  const n = parseFloat(x);
  return Number.isFinite(n) ? n : 0;
}

function bsToUsd(amountBs, valueDollar) {
  const vd = num(valueDollar);
  if (vd <= 0) return 0;
  return num(amountBs) / vd;
}

/**
 * Fila del reporte diario de formas de pago (Sales agrupado por agencia/fecha).
 */
function addDisplayUsdToDailySalesReportRow(row) {
  if (!row || typeof row !== "object") return;
  const vd = num(row.valueDollar);
  if (vd <= 0) {
    row.displayUsd = null;
    return;
  }
  const ve = num(row.valueEur);
  const vc = num(row.valueCop);
  const conv = (bs) => bsToUsd(bs, vd);

  const transferUsd = {};
  Object.keys(row).forEach((k) => {
    if (k.startsWith("totalTransfer") && k !== "totalTransfer") {
      transferUsd[k] = conv(num(row[k]));
    }
  });

  row.displayUsd = {
    totalAmount: conv(row.totalAmount),
    totalSell: conv(row.totalSell),
    totalVes: conv(row.totalVes),
    totalDollar: num(row.totalDollar),
    totalEur: ve > 0 ? (num(row.totalEur) * ve) / vd : 0,
    totalCop: vc > 0 ? num(row.totalCop) / vc / vd : 0,
    totalTransfer: conv(row.totalTransfer),
    totalPos: conv(row.totalPos),
    totalPosApply: conv(row.totalPosApply),
    totalPosNotApply: conv(row.totalPosNotApply),
    totalCredit: conv(row.totalCredit),
    totalSumation: conv(row.totalSumation),
    totalAmountBox: conv(row.totalAmountBox),
    totalCouponDiscount: conv(row.totalCouponDiscount),
    totalDollarVes: conv(row.totalDollarVes),
    totalEurVes: conv(row.totalEurVes),
    totalCopVes: conv(row.totalCopVes),
    ...transferUsd,
  };
}

/**
 * Registro de cierre (PaymentMethodsRecord) o payload equivalente al guardar.
 */
function addDisplayUsdToPaymentMethodsRecord(doc) {
  if (!doc || typeof doc !== "object") return;
  const vd = num(doc.valueDollar);
  if (vd <= 0) {
    doc.displayUsd = null;
    return;
  }
  const ve = num(doc.valueEur);
  const vc = num(doc.valueCop);
  const vv = doc.virtualValues || {};

  doc.displayUsd = {
    totalDeclared:
      num(doc.ves) / vd +
      num(doc.dollar) +
      (num(doc.eur) * ve) / vd +
      num(doc.cop) / (vc || 1) / vd +
      num(doc.tAmmount) / vd +
      num(doc.pAmmount) / vd,
    total: bsToUsd(doc.total, vd),
    differential: bsToUsd(doc.differential, vd),
    ves: num(doc.ves) / vd,
    dollar: num(doc.dollar),
    eur: ve > 0 ? (num(doc.eur) * ve) / vd : 0,
    cop: vc > 0 ? num(doc.cop) / vc / vd : 0,
    tAmmount: bsToUsd(doc.tAmmount, vd),
    pAmmount: bsToUsd(doc.pAmmount, vd),
    virtualValues: {
      totalAmount: bsToUsd(vv.totalAmount, vd),
      totalSell: bsToUsd(vv.totalSell, vd),
      totalVes: bsToUsd(vv.totalVes, vd),
      totalTransfer: bsToUsd(vv.totalTransfer, vd),
      totalPos: bsToUsd(vv.totalPos, vd),
      totalAmountBox: bsToUsd(vv.totalAmountBox, vd),
      totalCredit: bsToUsd(vv.totalCredit, vd),
      totalSumation: bsToUsd(vv.totalSumation, vd),
      totalCouponDiscount: bsToUsd(vv.totalCouponDiscount, vd),
      totalDollarVes: bsToUsd(vv.totalDollarVes, vd),
      totalEurVes: bsToUsd(vv.totalEurVes, vd),
      totalCopVes: bsToUsd(vv.totalCopVes, vd),
    },
  };

  if (Array.isArray(doc.transferAmmounts)) {
    doc.displayUsd.transferAmmounts = doc.transferAmmounts.map((t) => ({
      code: t.code,
      bank: t.bank,
      account: t.account,
      total: num(t.total),
      totalUsd: bsToUsd(t.total, vd),
    }));
  }

  if (Array.isArray(doc.operatorsAmmount)) {
    doc.operatorsAmmount.forEach((op) => {
      op.displayUsd = {
        total: bsToUsd(op.total, vd),
        totalWholesales: bsToUsd(op.totalWholesales, vd),
        totalRetail: bsToUsd(op.totalRetail, vd),
      };
    });
  }

  if (Array.isArray(doc.cashiersAmmount)) {
    doc.cashiersAmmount.forEach((c) => {
      c.displayUsd = {
        total: bsToUsd(c.total, vd),
        totalWholesales: bsToUsd(c.totalWholesales, vd),
        totalRetail: bsToUsd(c.totalRetail, vd),
      };
    });
  }
}

/** Fila del reporte general agregado (historial por día, varias sucursales). */
function addDisplayUsdToAggregatedHistoryRow(row) {
  if (!row || typeof row !== "object") return;
  const vd = num(row.valueDollar);
  if (vd <= 0) {
    row.displayUsd = null;
    return;
  }
  const ve = num(row.valueEur);
  const vc = num(row.valueCop);
  row.displayUsd = {
    ves: num(row.ves) / vd,
    dollar: num(row.dollar),
    eur: (num(row.eur) * ve) / vd,
    cop: num(row.cop) / (vc || 1) / vd,
    tAmmount: bsToUsd(row.tAmmount, vd),
    pAmmount: bsToUsd(row.pAmmount, vd),
    total: bsToUsd(row.total, vd),
    differential: bsToUsd(row.differential, vd),
    virtualValues_totalPos: bsToUsd(row.virtualValues_totalPos, vd),
    virtualValues_totalAmountBox: bsToUsd(row.virtualValues_totalAmountBox, vd),
  };
}

function enrichPaymentMethodsHistoryResponse(resp) {
  if (!resp || typeof resp !== "object") return resp;
  if (Array.isArray(resp.resultsStores)) {
    resp.resultsStores.forEach(addDisplayUsdToPaymentMethodsRecord);
  }
  if (Array.isArray(resp.resultsGeneral)) {
    resp.resultsGeneral.forEach(addDisplayUsdToAggregatedHistoryRow);
  }
  return resp;
}

module.exports = {
  num,
  bsToUsd,
  addDisplayUsdToDailySalesReportRow,
  addDisplayUsdToPaymentMethodsRecord,
  addDisplayUsdToAggregatedHistoryRow,
  enrichPaymentMethodsHistoryResponse,
};
