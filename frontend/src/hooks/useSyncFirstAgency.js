import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getFirstAgencyId } from '../helpers/defaultAgency';

/**
 * Sincroniza filters.agency con la primera sucursal cuando está vacío.
 */
export function useSyncFirstAgencyInFilterState(listAgencies, filters, setFilters) {
  const firstFromAgencyReducer = useSelector((s) => s.agencies?.firstAgencyId || '');
  const firstFromUserReducer = useSelector((s) => s.users?.firstAgencyId || '');
  const currentAgency =
    typeof filters === 'object' && filters !== null && !Array.isArray(filters)
      ? filters.agency
      : undefined;

  useEffect(() => {
    const first =
      getFirstAgencyId(listAgencies) || firstFromAgencyReducer || firstFromUserReducer;
    if (!first) return;

    setFilters((prev) => {
      if (prev === '' || prev == null) {
        return { agency: first };
      }
      if (typeof prev !== 'object' || Array.isArray(prev)) return prev;
      if (prev.agency !== undefined && prev.agency !== null && prev.agency !== '') {
        return prev;
      }
      return { ...prev, agency: first };
    });
  }, [
    listAgencies,
    firstFromAgencyReducer,
    firstFromUserReducer,
    currentAgency,
    setFilters,
  ]);
}

/**
 * react-hook-form: deja seleccionada la primera sucursal si el campo agency está vacío.
 */
export function useSyncFirstAgencyFormField(
  listAgencies,
  setValue,
  currentAgencyValue,
  fieldName = 'agency'
) {
  const firstFromAgencyReducer = useSelector((s) => s.agencies?.firstAgencyId || '');
  const firstFromUserReducer = useSelector((s) => s.users?.firstAgencyId || '');

  useEffect(() => {
    const first =
      getFirstAgencyId(listAgencies) || firstFromAgencyReducer || firstFromUserReducer;
    if (!first) return;
    if (currentAgencyValue !== undefined && currentAgencyValue !== null && currentAgencyValue !== '') {
      return;
    }
    setValue(fieldName, first, { shouldValidate: false, shouldDirty: false });
  }, [
    listAgencies,
    firstFromAgencyReducer,
    firstFromUserReducer,
    currentAgencyValue,
    setValue,
    fieldName,
  ]);
}
