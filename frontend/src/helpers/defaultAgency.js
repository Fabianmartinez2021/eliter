/**
 * ID de la primera sucursal del listado (una sola sede / valor por defecto en filtros).
 */
export function getFirstAgencyId(agencies) {
  if (!Array.isArray(agencies) || agencies.length === 0) return '';
  const first = agencies[0];
  if (first == null) return '';
  const id = first.id != null ? first.id : first._id;
  return id != null ? String(id) : '';
}
