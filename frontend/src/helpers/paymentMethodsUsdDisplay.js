/**
 * Valores en USD calculados en backend (`displayUsd`) o conversión Bs → USD con `valueDollar`.
 */
export function usdFromRow(row, field) {
  if (!row) return null;
  if (
    row.displayUsd &&
    row.displayUsd[field] != null &&
    Number.isFinite(Number(row.displayUsd[field]))
  ) {
    return Number(row.displayUsd[field]);
  }
  const vd = parseFloat(row.valueDollar);
  if (!Number.isFinite(vd) || vd <= 0) return null;
  const bs = parseFloat(row[field]);
  if (!Number.isFinite(bs)) return null;
  return bs / vd;
}

export function formatUsd(val, fallback = "0.00") {
  if (val == null || !Number.isFinite(Number(val))) return fallback;
  return Number(val).toFixed(2);
}
