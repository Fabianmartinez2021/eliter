/* eslint-disable */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { accountsPayableActions, userActions, alertActions } from '../../actions';
import moment from 'moment';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge, Label, Input } from 'reactstrap';
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm, Controller } from "react-hook-form";
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import "../../assets/css/accountsPayable.css";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { isValidDate } from '../../helpers/date';

/** Misma lógica que el backend: tasas manuales, sin liscoin */
function computeMixedUsdEquivalent(mix, rates) {
    const r = rates || {};
    let usd = (mix.cashUsd || 0) + (mix.transferUsd || 0);
    const ves = (mix.cashVes || 0) + (mix.transferVes || 0);
    const eur = (mix.cashEur || 0);
    const cop = (mix.cashCop || 0);
    if (ves > 0) {
        if (!r.vesPerUsd || r.vesPerUsd <= 0) return null;
        usd += ves / r.vesPerUsd;
    }
    if (eur > 0) {
        if (!r.usdPerEur || r.usdPerEur <= 0) return null;
        usd += eur * r.usdPerEur;
    }
    if (cop > 0) {
        if (!r.copPerUsd || r.copPerUsd <= 0) return null;
        usd += cop / r.copPerUsd;
    }
    if (usd <= 0) return null;
    return Math.round(usd * 10000) / 10000;
}

/** Misma lógica que la tabla: pendiente / abonado / pagado */
function getPayModalEstado(row) {
    if (!row) return { label: '—', type: 'pending' };
    const tot = row.total != null ? Number(row.total) : 0;
    const pend = row.pending != null ? Number(row.pending) : 0;
    const eps = 0.005;
    if (pend <= eps) return { label: 'PAGADO', type: 'ok' };
    if (tot > eps && pend < tot - eps) return { label: 'ABONADO', type: 'partial' };
    return { label: 'PENDIENTE', type: 'pending' };
}

function AccountsPayableListPage() {

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    const { darkMode } = useDarkMode();
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    const getUserData = () => ({
        agency: user.agency.id,
        role: user.role,
        id: user.id
    });

    const dataTableState = useSelector(state => state.accountsPayable.table);
    const loadingPage = useSelector(state => state.accountsPayable.loading);

    const [data, setData] = useState([]);
    const [totalPending, setTotalPending] = useState(0);

    useEffect(() => {
        if (dataTableState && dataTableState.results) {
            setData(dataTableState.results);
            if (dataTableState.totalPending != null) {
                setTotalPending(dataTableState.totalPending);
            }
        }
        if (dataTableState && dataTableState.metadata && dataTableState.metadata[0]) {
            setRowCount(dataTableState.metadata[0].total);
        }
    }, [dataTableState]);

    const users = useSelector(state => state.users);

    useEffect(() => {
        if (user && user.agency) {
            dispatch(userActions.getListUserAgencies(getUserData()));
        }
    }, [dispatch, user]);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (users.obtained) {
            setListAgencies(users.list.agencies);
        }
    }, [users.obtained]);

    const [rowCount, setRowCount] = useState(0);

    const { handleSubmit, register, reset, setValue, watch } = useForm();
    const { register: registerPay, handleSubmit: handleSubmitPay, reset: resetPay, watch: watchPay, control: controlPay } = useForm({
        defaultValues: {
            paymentMethod: 'cash',
            paymentReference: '',
            paymentNote: '',
            paymentAmountUsd: '',
            mixCashUsd: '',
            mixCashVes: '',
            mixCashEur: '',
            mixCashCop: '',
            mixTransferUsd: '',
            mixTransferVes: '',
            rateVesPerUsd: '',
            rateUsdPerEur: '',
            rateCopPerUsd: ''
        }
    });
    const _agencyWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, _agencyWatch);

    const payMethod = watchPay('paymentMethod');
    const payWatchAll = watchPay();

    const supplierLabel = useCallback((row) => {
        if (!row.supplier) return row.supplierName || '—';
        return row.supplier.name || row.supplier.businessName || '—';
    }, []);

    const [perPage] = useState(10);
    const [perPageSelect, setPerPageSelect] = useState(0);
    const [direction, setDirection] = useState({ "id": "createdDate", "desc": true });

    const getDataTable = (page) => {
        dispatch(accountsPayableActions.dataTable(getUserData(), page, perPageSelect === 0 ? perPage : perPageSelect, direction, {}));
    };

    const handlePageChange = async (page) => {
        dispatch(accountsPayableActions.dataTable(getUserData(), page, perPageSelect === 0 ? perPage : perPageSelect, direction, filters ? filters : {}));
    };

    const handleSort = (column, sortDirection) => {
        const colId = typeof column.selector === 'string' ? column.selector : 'createdDate';
        let sort = { "id": colId, "desc": (sortDirection === "asc" ? false : true) };
        setDirection(sort);
        dispatch(accountsPayableActions.dataTable(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, sort, filters ? filters : {}));
    };

    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPageSelect(newPerPage);
        dispatch(accountsPayableActions.dataTable(getUserData(), page, newPerPage, direction, filters ? filters : {}));
    };

    const [filters, setFilters] = useState('');

    useEffect(() => {
        if (!user || !user.agency) return;
        setData([]);
        getDataTable(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };
    const CustomLoader = () => (<><div className="loading-table"></div></>);

    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    const onFilterData = (formData) => {
        const data = {
            ...formData,
            startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : '',
            endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : '',
        };
        var validStartDate = !data.startDate || moment(data.startDate).isValid();
        if (data.startDate !== "" && !validStartDate) {
            setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
            return;
        }
        var validEndDate = !data.endDate || moment(data.endDate).isValid();
        if (data.endDate !== "" && !validEndDate) {
            setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
            return;
        }
        if (data.startDate && data.endDate) {
            var isafter = moment(data.startDate).isAfter(data.endDate);
            if (isafter) {
                setModalVisible(true);
                setModalMsg('La fecha inicial no puede ser superior a la final');
                return;
            }
            var a = moment(data.startDate);
            var b = moment(data.endDate);
            let dateDiff = b.diff(a, 'days');
            if (dateDiff > 100) {
                setModalVisible(true);
                setModalMsg('El rango de fechas no puede superar los 100 días');
                return;
            }
        }
        setFilters(data);
        setTotalPending(0);
        dispatch(accountsPayableActions.dataTable(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, direction, data));
    };

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleChangeStartDate = (date) => setStartDate(date);
    const handleChangeEndDate = (date) => setEndDate(date);

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setFilters('');
        setTotalPending(0);
        reset({ order: '', documentRef: '', agency: '', startDate: '', endDate: '' });
        dispatch(accountsPayableActions.dataTable(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, direction, {}));
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    const [payRow, setPayRow] = useState(null);
    const [payModalEditMode, setPayModalEditMode] = useState(false);
    const [paySubmitting, setPaySubmitting] = useState(false);

    const payModalEstado = useMemo(() => (payRow ? getPayModalEstado(payRow) : null), [payRow]);

    const refetchTable = useCallback(() => {
        dispatch(accountsPayableActions.dataTable(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, direction, filters ? filters : {}));
    }, [dispatch, user, perPageSelect, perPage, direction, filters]);

    const parseMixAmount = (v) => {
        if (v == null || v === '') return 0;
        const n = parseFloat(String(v).replace(/,/g, ''));
        return Number.isNaN(n) ? 0 : n;
    };

    const mixedAbonoUsdPreview = useMemo(() => {
        if (payMethod !== 'mixed' || !payRow) return null;
        const mix = {
            cashUsd: parseMixAmount(payWatchAll.mixCashUsd),
            cashVes: parseMixAmount(payWatchAll.mixCashVes),
            cashEur: parseMixAmount(payWatchAll.mixCashEur),
            cashCop: parseMixAmount(payWatchAll.mixCashCop),
            transferUsd: parseMixAmount(payWatchAll.mixTransferUsd),
            transferVes: parseMixAmount(payWatchAll.mixTransferVes),
        };
        const rates = {
            vesPerUsd: parseMixAmount(payWatchAll.rateVesPerUsd),
            usdPerEur: parseMixAmount(payWatchAll.rateUsdPerEur),
            copPerUsd: parseMixAmount(payWatchAll.rateCopPerUsd),
        };
        const hasAny = Object.values(mix).some((x) => x > 0);
        if (!hasAny) return null;
        return computeMixedUsdEquivalent(mix, rates);
    }, [payMethod, payRow, payWatchAll]);

    const simpleAbonoUsdPreview = useMemo(() => {
        if ((payMethod !== 'cash' && payMethod !== 'transfer') || !payRow) return null;
        const pend = Number(payRow.pending != null ? payRow.pending : 0);
        const v = payWatchAll.paymentAmountUsd;
        if (v == null || v === '') return pend;
        const n = parseMixAmount(v);
        if (n <= 0) return null;
        return Math.min(n, pend);
    }, [payMethod, payRow, payWatchAll.paymentAmountUsd]);

    const openPayModal = useCallback((row) => {
        setPayModalEditMode(false);
        resetPay({
            paymentMethod: 'cash',
            paymentReference: '',
            paymentNote: '',
            paymentAmountUsd: '',
            mixCashUsd: '',
            mixCashVes: '',
            mixCashEur: '',
            mixCashCop: '',
            mixTransferUsd: '',
            mixTransferVes: '',
            rateVesPerUsd: '',
            rateUsdPerEur: '',
            rateCopPerUsd: ''
        });
        setPayRow(row);
    }, [resetPay]);

    const openEditPayModal = useCallback((row) => {
        const pm = row.paymentMethod || 'cash';
        const mix = row.paymentMix || {};
        const pr = row.paymentRates || {};
        resetPay({
            paymentMethod: pm,
            paymentReference: row.paymentReference || '',
            paymentNote: row.paymentNote || '',
            paymentAmountUsd: row.paymentAmountUsd != null && row.paymentAmountUsd !== '' ? row.paymentAmountUsd : '',
            mixCashUsd: mix.cashUsd != null && mix.cashUsd !== '' ? mix.cashUsd : '',
            mixCashVes: mix.cashVes != null && mix.cashVes !== '' ? mix.cashVes : '',
            mixCashEur: mix.cashEur != null && mix.cashEur !== '' ? mix.cashEur : '',
            mixCashCop: mix.cashCop != null && mix.cashCop !== '' ? mix.cashCop : '',
            mixTransferUsd: mix.transferUsd != null && mix.transferUsd !== '' ? mix.transferUsd : '',
            mixTransferVes: mix.transferVes != null && mix.transferVes !== '' ? mix.transferVes : '',
            rateVesPerUsd: pr.vesPerUsd != null && pr.vesPerUsd !== '' ? pr.vesPerUsd : '',
            rateUsdPerEur: pr.usdPerEur != null && pr.usdPerEur !== '' ? pr.usdPerEur : '',
            rateCopPerUsd: pr.copPerUsd != null && pr.copPerUsd !== '' ? pr.copPerUsd : '',
        });
        setPayModalEditMode(true);
        setPayRow(row);
    }, [resetPay]);

    const onSubmitPay = (data) => {
        if (!payRow) return;
        const refTrim = (data.paymentReference || '').trim();
        if (data.paymentMethod === 'transfer' && !refTrim) {
            dispatch(alertActions.error('Indique referencia o comprobante de la transferencia.'));
            return;
        }
        const payload = {
            user: user.id,
            paymentMethod: data.paymentMethod,
            paymentReference: refTrim,
            paymentNote: (data.paymentNote || '').trim()
        };
        if (data.paymentMethod === 'mixed') {
            const paymentMix = {
                cashUsd: parseMixAmount(data.mixCashUsd),
                cashVes: parseMixAmount(data.mixCashVes),
                cashEur: parseMixAmount(data.mixCashEur),
                cashCop: parseMixAmount(data.mixCashCop),
                transferUsd: parseMixAmount(data.mixTransferUsd),
                transferVes: parseMixAmount(data.mixTransferVes)
            };
            const sum = paymentMix.cashUsd + paymentMix.cashVes + paymentMix.cashEur + paymentMix.cashCop
                + paymentMix.transferUsd + paymentMix.transferVes;
            if (sum <= 0) {
                dispatch(alertActions.error('Indique al menos un monto en el desglose (efectivo o transferencia).'));
                return;
            }
            if ((paymentMix.transferUsd > 0 || paymentMix.transferVes > 0) && !refTrim) {
                dispatch(alertActions.error('Si registra monto por transferencia, indique referencia o comprobante.'));
                return;
            }
            const paymentRates = {
                vesPerUsd: parseMixAmount(data.rateVesPerUsd),
                usdPerEur: parseMixAmount(data.rateUsdPerEur),
                copPerUsd: parseMixAmount(data.rateCopPerUsd)
            };
            const equiv = computeMixedUsdEquivalent(paymentMix, paymentRates);
            if (equiv == null) {
                dispatch(alertActions.error('Complete las tasas según las monedas usadas: Bs/USD, USD por EUR, COP/USD (tasas manuales).'));
                return;
            }
            payload.paymentMix = paymentMix;
            payload.paymentRates = paymentRates;
        }
        if (data.paymentMethod === 'cash' || data.paymentMethod === 'transfer') {
            const amt = data.paymentAmountUsd;
            if (amt != null && amt !== '') {
                payload.paymentAmountUsd = parseMixAmount(amt);
            }
        }
        const rowId = payRow.id || payRow._id;
        setPaySubmitting(true);
        const action = payModalEditMode
            ? accountsPayableActions.editAccountsPayablePayment(rowId, payload)
            : accountsPayableActions.payAccountsPayable(rowId, payload);
        dispatch(action).then(() => {
            setPaySubmitting(false);
            setPayRow(null);
            setPayModalEditMode(false);
            refetchTable();
        }).catch(() => {
            setPaySubmitting(false);
        });
    };

    const columns = useMemo(() => [
        {
            name: 'Estado',
            selector: 'status',
            sortable: false,
            center: true,
            cell: row => {
                const tot = row.total != null ? Number(row.total) : 0;
                const pend = row.pending != null ? Number(row.pending) : 0;
                const eps = 0.005;
                if (pend <= eps) {
                    return (
                        <Badge color="success" pill className="ap-badge-estado mt-1">
                            PAGADO
                        </Badge>
                    );
                }
                if (tot > eps && pend < tot - eps) {
                    return (
                        <Badge pill className="ap-badge-estado mt-1 border-0" style={{ backgroundColor: '#fd7e14', color: '#fff' }}>
                            ABONADO
                        </Badge>
                    );
                }
                return (
                    <Badge color="danger" pill className="ap-badge-estado mt-1">
                        PENDIENTE
                    </Badge>
                );
            }
        },
        {
            name: 'Agencia',
            selector: 'agency.name',
            sortable: false,
            wrap: true,
            cell: row => row.agency ? row.agency.name : '—',
        },
        {
            name: 'Proveedor',
            sortable: false,
            wrap: true,
            cell: row => supplierLabel(row),
        },
        {
            name: 'Ref. documento',
            selector: 'invoiceRef',
            sortable: true,
            cell: row => row.invoiceRef || row.documentRef || '—',
        },
        {
            name: 'Total',
            selector: 'total',
            sortable: true,
            cell: row => row.total != null
                ? <NumberFormat value={Number(row.total).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
                : '—',
        },
        {
            name: 'Pendiente',
            selector: 'pending',
            sortable: true,
            cell: row => row.pending != null
                ? <NumberFormat value={Number(row.pending).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
                : '—',
        },
        {
            name: 'Días',
            selector: 'daysCounter',
            sortable: true,
        },
        {
            name: 'Fecha registro',
            selector: 'createdDate',
            sortable: true,
            cell: row => row.createdDate ? moment(row.createdDate).utc().format("YYYY-MM-DD") : '—',
        },
        {
            name: 'Acción',
            width: '178px',
            center: true,
            cell: row => {
                const pend = row.pending != null ? Number(row.pending) : 0;
                const paid = pend <= 0.0001;
                const canEdit = paid && row.payments && row.payments.length === 1;
                if (paid) {
                    return (
                        <Button
                            type="button"
                            size="sm"
                            color="secondary"
                            outline
                            className="ap-btn-accion"
                            disabled={paySubmitting || !canEdit}
                            title={!canEdit ? 'Solo editable si hay un único abono' : ''}
                            onClick={() => openEditPayModal(row)}
                        >
                            Editar pago
                        </Button>
                    );
                }
                return (
                    <Button
                        type="button"
                        size="sm"
                        color="primary"
                        outline
                        className="ap-btn-accion"
                        disabled={paySubmitting}
                        onClick={() => openPayModal(row)}
                    >
                        Pagar o abonar
                    </Button>
                );
            }
        },
    ], [paySubmitting, openPayModal, openEditPayModal, supplierLabel]);

    const ExpandedComponent = ({ data: row }) => (
        <div className="ap-expand-detail">
            <div className="ap-expand-card">
                <div className="ap-expand-card__head">Productos</div>
                <Table responsive size="sm" striped className="ap-expand-table mb-0">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th className="text-end">Kg / unid.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {row.products && row.products.length > 0 ? row.products.map((product, index) => (
                            <tr key={index}>
                                <td>{product.name}</td>
                                <td className="text-end">
                                    <NumberFormat displayType="text" value={product.kg != null ? Number(product.kg).toFixed(3) : ''} thousandSeparator="," />
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={2} className="text-muted">Sin detalle de productos</td></tr>
                        )}
                    </tbody>
                </Table>
            </div>
            {row.note && (
                <div className="ap-expand-note">
                    <strong>Nota:</strong> {row.note}
                </div>
            )}
            {row.payments && row.payments.length > 0 && row.paymentMethod === 'mixed' && row.paymentRates && (
                <div className="ap-expand-card ap-expand-card--rates">
                    <div className="ap-expand-card__head">Tasas del último abono</div>
                    <div className="ap-expand-rates">
                        <span className="ap-expand-rate-chip">Bs/USD <strong>{row.paymentRates.vesPerUsd != null && row.paymentRates.vesPerUsd !== '' ? row.paymentRates.vesPerUsd : '—'}</strong></span>
                        <span className="ap-expand-rate-chip">USD/EUR <strong>{row.paymentRates.usdPerEur != null && row.paymentRates.usdPerEur !== '' ? row.paymentRates.usdPerEur : '—'}</strong></span>
                        <span className="ap-expand-rate-chip">COP/USD <strong>{row.paymentRates.copPerUsd != null && row.paymentRates.copPerUsd !== '' ? row.paymentRates.copPerUsd : '—'}</strong></span>
                    </div>
                </div>
            )}
            {row.payments && row.payments.length > 0 && (
                <div className="ap-expand-card">
                    <div className="ap-expand-card__head">Abonos registrados ({row.payments.length})</div>
                    <Table size="sm" className="ap-expand-table mb-0">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th className="text-end">Equiv. USD</th>
                                <th>Método</th>
                            </tr>
                        </thead>
                        <tbody>
                            {row.payments.map((p, idx) => (
                                <tr key={p.id || p._id || idx}>
                                    <td className="text-nowrap">{p.paymentDate ? moment(p.paymentDate).utc().format('YYYY-MM-DD HH:mm') : '—'}</td>
                                    <td className="text-end font-weight-bold">
                                        <NumberFormat value={Number(p.amountUsd).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                    </td>
                                    <td>
                                        <span className="ap-expand-method">
                                            {p.paymentMethod === 'transfer' ? 'Transferencia' : p.paymentMethod === 'mixed' ? 'Mixto' : 'Efectivo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
            {((row.status === true || row.status === 1) && row.paymentMethod && (!row.payments || row.payments.length === 0)) && (
                <div className="ap-expand-card">
                    <div className="ap-expand-card__head">Pago (referencial, registro anterior)</div>
                    <div className="ap-expand-legacy">
                        <div>
                            <strong>Método:</strong>{' '}
                            {row.paymentMethod === 'transfer' ? 'Transferencia' : row.paymentMethod === 'mixed' ? 'Mixto' : 'Efectivo'}
                        </div>
                        {row.paymentMethod === 'mixed' && row.paymentMix && (
                            <Table size="sm" className="ap-expand-table mt-2 mb-0">
                                <tbody>
                                    {Number(row.paymentMix.cashUsd) > 0 && (
                                        <tr><td>Efectivo USD</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.cashUsd).toFixed(2)} displayType="text" thousandSeparator prefix="$ " /></td></tr>
                                    )}
                                    {Number(row.paymentMix.cashVes) > 0 && (
                                        <tr><td>Efectivo Bs</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.cashVes).toFixed(2)} displayType="text" thousandSeparator prefix="Bs " /></td></tr>
                                    )}
                                    {Number(row.paymentMix.cashEur) > 0 && (
                                        <tr><td>Efectivo EUR</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.cashEur).toFixed(2)} displayType="text" thousandSeparator prefix="€ " /></td></tr>
                                    )}
                                    {Number(row.paymentMix.cashCop) > 0 && (
                                        <tr><td>Efectivo COP</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.cashCop).toFixed(2)} displayType="text" thousandSeparator prefix="$ " /></td></tr>
                                    )}
                                    {Number(row.paymentMix.transferUsd) > 0 && (
                                        <tr><td>Transferencia USD</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.transferUsd).toFixed(2)} displayType="text" thousandSeparator prefix="$ " /></td></tr>
                                    )}
                                    {Number(row.paymentMix.transferVes) > 0 && (
                                        <tr><td>Transferencia Bs</td><td className="text-end"><NumberFormat value={Number(row.paymentMix.transferVes).toFixed(2)} displayType="text" thousandSeparator prefix="Bs " /></td></tr>
                                    )}
                                </tbody>
                            </Table>
                        )}
                        {row.paymentAmountUsd != null && (
                            <div><strong>Equiv. USD abono:</strong>{' '}
                                <NumberFormat value={Number(row.paymentAmountUsd).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                            </div>
                        )}
                        {row.paymentReference ? <div><strong>Ref. transferencia:</strong> {row.paymentReference}</div> : null}
                        {row.paymentNote ? <div><strong>Observaciones:</strong> {row.paymentNote}</div> : null}
                        {row.paymentDate ? <div><strong>Fecha:</strong> {moment(row.paymentDate).utc().format('YYYY-MM-DD HH:mm')}</div> : null}
                        {row.paidByUser && (row.paidByUser.firstName || row.paidByUser.lastName) ? (
                            <div><strong>Registrado por:</strong> {[row.paidByUser.firstName, row.paidByUser.lastName].filter(Boolean).join(' ')}</div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );

    const conditionalRowStyles = [
        {
            when: row => {
                const tot = row.total != null ? Number(row.total) : 0;
                const pend = row.pending != null ? Number(row.pending) : 0;
                return pend <= 0.005;
            },
            style: { backgroundColor: 'rgba(144, 238, 144, 0.35)' },
        },
        {
            when: row => {
                const tot = row.total != null ? Number(row.total) : 0;
                const pend = row.pending != null ? Number(row.pending) : 0;
                const eps = 0.005;
                return tot > eps && pend > eps && pend < tot - eps;
            },
            style: { backgroundColor: 'rgba(255, 165, 0, 0.28)' },
        },
        {
            when: row => {
                const tot = row.total != null ? Number(row.total) : 0;
                const pend = row.pending != null ? Number(row.pending) : 0;
                const eps = 0.005;
                return pend > eps && (tot <= eps || pend >= tot - eps);
            },
            style: { backgroundColor: 'rgba(220, 53, 69, 0.18)' },
        },
    ];

    const tableCustomStyles = useMemo(() => ({
        headRow: {
            style: {
                backgroundColor: darkMode ? '#2a2a2a' : '#f1f3f5',
                borderBottomWidth: '2px',
                borderBottomColor: darkMode ? '#404040' : '#dee2e6',
                minHeight: '44px',
            },
        },
        headCells: {
            style: {
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: darkMode ? '#adb5bd' : '#64748b',
                paddingLeft: '14px',
                paddingRight: '14px',
            },
        },
        cells: {
            style: {
                fontSize: '0.875rem',
                paddingTop: '12px',
                paddingBottom: '12px',
                color: darkMode ? '#e9ecef' : '#212529',
            },
        },
        rows: {
            style: {
                minHeight: '48px',
            },
        },
        pagination: {
            style: {
                borderTop: darkMode ? '1px solid #333' : '1px solid #e9ecef',
                backgroundColor: darkMode ? '#252525' : '#fafbfc',
                fontSize: '0.85rem',
                minHeight: '52px',
            },
        },
    }), [darkMode]);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="flex-column flex-md-row py-3 px-2 ap-page">
                        <div className="ap-header">
                            <div>
                                <h3 className="ap-title">Cuentas por pagar</h3>
                                <p className="ap-title-sub mb-0">Obligaciones y abonos (referencial, sin caja)</p>
                            </div>
                            <div className="ap-register">
                                <span className="ap-register-label">Nueva compra</span>
                                <Button id="add-ap" onClick={() => history.push('/register-accounts-payable')} className="btn-round btn-icon" color="primary" aria-label="Registrar cuenta por pagar">
                                    <i className="fa fa-plus" />
                                </Button>
                            </div>
                        </div>
                        {totalPending > 0 && (
                            <div>
                                <div className="ap-summary">
                                    <span className="ap-summary-label">Total pendiente (vista actual)</span>
                                    <span className="ap-summary-value"><NumberFormat value={totalPending.toFixed(2)} displayType="text" thousandSeparator prefix="$ " /></span>
                                </div>
                            </div>
                        )}
                        <div className="ap-filter-wrap">
                        <div className="filter">
                            <div className="d-flex justify-content-between">
                                <a href="#search" onClick={e => { e.preventDefault(); toggle(); }}>
                                    <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
                                </a>
                                {isOpen && <a href="#clear" onClick={e => { e.preventDefault(); clearFilters(); }}>
                                    <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
                                </a>}
                            </div>
                            {isOpen && <>
                                <Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
                                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                        <Label for="agency" className="mr-2">Sucursal</Label>
                                        <select className="form-control" name="agency" ref={register}>
                                            <option value="">Todas</option>
                                            {listAgencies && listAgencies.map(list => (
                                                <option key={list.id} value={list.id}>{list.name}</option>
                                            ))}
                                        </select>
                                    </FormGroup>
                                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                        <Label for="order" className="mr-2">N° orden / id</Label>
                                        <input name="order" className="form-control" ref={register} />
                                    </FormGroup>
                                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                        <Label for="documentRef" className="mr-2">Ref. documento</Label>
                                        <input name="documentRef" className="form-control" ref={register} />
                                    </FormGroup>
                                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                        <Label className="mr-2">Desde</Label>
                                        <Datetime
                                            timeFormat={false}
                                            dateFormat="YYYY-MM-DD"
                                            closeOnSelect
                                            locale="es"
                                            onChange={handleChangeStartDate}
                                            value={startDate}
                                            inputProps={{ placeholder: 'Fecha inicial', autoComplete: 'off' }}
                                            isValidDate={isValidDate}
                                        />
                                    </FormGroup>
                                    <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                        <Label className="mr-2">Hasta</Label>
                                        <Datetime
                                            timeFormat={false}
                                            dateFormat="YYYY-MM-DD"
                                            closeOnSelect
                                            locale="es"
                                            onChange={handleChangeEndDate}
                                            value={endDate}
                                            inputProps={{ placeholder: 'Fecha final', autoComplete: 'off' }}
                                            isValidDate={isValidDate}
                                        />
                                    </FormGroup>
                                    <Button color="primary" type="submit" className="mr-2" disabled={loadingPage}>
                                        {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        Filtrar
                                    </Button>
                                </Form>
                            </>}
                        </div>
                        </div>
                        <Row className="mx-0 mb-3 mt-1">
                            <Col className="px-0">
                                <div className="ap-table-card">
                                <DataTable
                                    noHeader
                                    striped
                                    highlightOnHover
                                    customStyles={tableCustomStyles}
                                    columns={columns}
                                    data={data}
                                    progressPending={loadingPage}
                                    progressComponent={<CustomLoader />}
                                    pagination
                                    paginationServer
                                    paginationTotalRows={rowCount}
                                    onChangeRowsPerPage={handlePerRowsChange}
                                    onChangePage={handlePageChange}
                                    sortServer
                                    onSort={handleSort}
                                    paginationPerPage={perPage}
                                    paginationRowsPerPageOptions={[10, 15, 20, 50]}
                                    paginationComponentOptions={paginationOptions}
                                    expandableRows
                                    expandableRowsComponent={<ExpandedComponent />}
                                    conditionalRowStyles={conditionalRowStyles}
                                    noDataComponent={loadingPage ? <Spinner color="primary" /> : 'Sin registros'}
                                />
                                </div>
                            </Col>
                        </Row>
                        <Modal isOpen={modalVisible} toggle={() => setModalVisible(false)}>
                            <div className="modal-header"><h5 className="modal-title">Cuentas por pagar</h5></div>
                            <div className="modal-body">{modalMsg}</div>
                            <div className="modal-footer">
                                <Button color="secondary" onClick={() => setModalVisible(false)}>Cerrar</Button>
                            </div>
                        </Modal>

                        <Modal
                            isOpen={!!payRow}
                            toggle={() => { if (!paySubmitting) { setPayRow(null); setPayModalEditMode(false); } }}
                            contentClassName="ap-pay-modal-content"
                            size="lg"
                        >
                            <Form onSubmit={handleSubmitPay(onSubmitPay)}>
                                <div className="modal-header ap-pay-modal-header">
                                    <h5 className="modal-title mb-0">{payModalEditMode ? 'Editar pago al proveedor' : 'Registrar pago al proveedor'}</h5>
                                </div>
                                <div className="modal-body ap-pay-modal-body">
                                    <div className="ap-pay-modal-alert">
                                        <p className="mb-0">
                                            Registro informativo únicamente: <strong>no se descuenta nada de las cajas</strong> ni se afectan saldos de efectivo en el sistema.
                                        </p>
                                    </div>
                                    {payRow && (
                                        <>
                                            <div className="ap-pay-summary">
                                                <div className="ap-pay-summary__title">{supplierLabel(payRow)}</div>
                                                <div className="ap-pay-summary__row">
                                                    {payModalEstado && (
                                                        <span className={`ap-pay-estado ap-pay-estado--${payModalEstado.type}`}>
                                                            {payModalEstado.label}
                                                        </span>
                                                    )}
                                                    <div className="ap-pay-summary__amounts">
                                                        {payRow.total != null && (
                                                            <div className="ap-pay-summary__chip">
                                                                <strong>Total</strong>
                                                                <span>
                                                                    <NumberFormat value={Number(payRow.total).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                                                </span>
                                                            </div>
                                                        )}
                                                        {payRow.pending != null && (
                                                            <div className="ap-pay-summary__chip ap-pay-summary__chip--pending">
                                                                <strong>Pendiente</strong>
                                                                <span>
                                                                    <NumberFormat value={Number(payRow.pending).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <FormGroup className="ap-pay-field">
                                                <Label for="paymentMethod" className="ap-pay-label">Forma de pago</Label>
                                                <Input type="select" name="paymentMethod" id="paymentMethod" innerRef={registerPay({ required: true })}>
                                                    <option value="cash">Solo efectivo</option>
                                                    <option value="transfer">Solo transferencia</option>
                                                    <option value="mixed">Mixto (varias monedas y/o transferencia)</option>
                                                </Input>
                                            </FormGroup>
                                            {payMethod === 'transfer' && (
                                                <>
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentReference" className="ap-pay-label">Referencia / comprobante</Label>
                                                        <Input
                                                            name="paymentReference"
                                                            id="paymentReference"
                                                            innerRef={registerPay}
                                                            placeholder="N° referencia, banco, etc."
                                                            maxLength={200}
                                                        />
                                                    </FormGroup>
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentAmountUsdTransfer" className="ap-pay-label">Abono (USD equivalente)</Label>
                                                        <p className="ap-pay-field-hint">Vacío = abona el pendiente completo. Si indica un monto menor, queda saldo pendiente.</p>
                                                        <Controller name="paymentAmountUsd" control={controlPay} render={({ onChange, value }) => (
                                                            <NumberFormat className="form-control" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                        )} />
                                                    </FormGroup>
                                                    {simpleAbonoUsdPreview != null && (
                                                        <div className="ap-pay-preview">
                                                            <div><strong>Total a registrar (USD):</strong>{' '}
                                                                <NumberFormat value={Number(simpleAbonoUsdPreview).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentNoteTransfer" className="ap-pay-label">Observaciones (opcional)</Label>
                                                        <Input type="textarea" name="paymentNote" id="paymentNoteTransfer" innerRef={registerPay} rows={3} maxLength={500} className="form-control" />
                                                    </FormGroup>
                                                </>
                                            )}
                                            {payMethod === 'cash' && (
                                                <>
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentAmountUsdCash" className="ap-pay-label">Abono (USD equivalente)</Label>
                                                        <p className="ap-pay-field-hint">Vacío = abona el pendiente completo. Si indica un monto menor, queda saldo pendiente.</p>
                                                        <Controller name="paymentAmountUsd" control={controlPay} render={({ onChange, value }) => (
                                                            <NumberFormat className="form-control" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                        )} />
                                                    </FormGroup>
                                                    {simpleAbonoUsdPreview != null && (
                                                        <div className="ap-pay-preview">
                                                            <div><strong>Total a registrar (USD):</strong>{' '}
                                                                <NumberFormat value={Number(simpleAbonoUsdPreview).toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentNoteCash" className="ap-pay-label">Observaciones (opcional)</Label>
                                                        <Input type="textarea" name="paymentNote" id="paymentNoteCash" innerRef={registerPay} rows={3} maxLength={500} className="form-control" />
                                                    </FormGroup>
                                                </>
                                            )}
                                            {payMethod === 'mixed' && (
                                                <>
                                                    <p className="small text-muted mb-3">Indique montos por canal. Las monedas distintas de USD se convierten a USD con las <strong>tasas que usted ingrese</strong> (no se usa cotización automática). Si hay monto en transferencia, la referencia es obligatoria.</p>
                                                    <div className="ap-pay-rates-block">
                                                        <strong className="small d-block mb-3">Tasas para total en USD (abono)</strong>
                                                        <Row form>
                                                            <Col md={4}>
                                                                <FormGroup className="mb-2">
                                                                    <Label className="small mb-0">Bs por 1 USD</Label>
                                                                    <Controller name="rateVesPerUsd" control={controlPay} render={({ onChange, value }) => (
                                                                        <NumberFormat className="form-control form-control-sm" thousandSeparator onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} placeholder="Ej. 36,50" />
                                                                    )} />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={4}>
                                                                <FormGroup className="mb-2">
                                                                    <Label className="small mb-0">USD por 1 EUR</Label>
                                                                    <Controller name="rateUsdPerEur" control={controlPay} render={({ onChange, value }) => (
                                                                        <NumberFormat className="form-control form-control-sm" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} placeholder="Ej. 1,08" />
                                                                    )} />
                                                                </FormGroup>
                                                            </Col>
                                                            <Col md={4}>
                                                                <FormGroup className="mb-2">
                                                                    <Label className="small mb-0">COP por 1 USD</Label>
                                                                    <Controller name="rateCopPerUsd" control={controlPay} render={({ onChange, value }) => (
                                                                        <NumberFormat className="form-control form-control-sm" thousandSeparator onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                    )} />
                                                                </FormGroup>
                                                            </Col>
                                                        </Row>
                                                        <p className="small text-muted mb-0">Solo complete la tasa de las monedas que use en el desglose.</p>
                                                    </div>
                                                    <Row form className="mt-1">
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Efectivo USD</Label>
                                                                <Controller name="mixCashUsd" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Efectivo Bs</Label>
                                                                <Controller name="mixCashVes" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="Bs " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row form>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Efectivo EUR</Label>
                                                                <Controller name="mixCashEur" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="€ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Efectivo COP</Label>
                                                                <Controller name="mixCashCop" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row form>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Transferencia USD</Label>
                                                                <Controller name="mixTransferUsd" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="$ " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label className="small">Transferencia Bs</Label>
                                                                <Controller name="mixTransferVes" control={controlPay} render={({ onChange, value }) => (
                                                                    <NumberFormat className="form-control" thousandSeparator prefix="Bs " onValueChange={(v) => onChange(v.floatValue)} value={value === '' || value == null ? '' : value} allowNegative={false} />
                                                                )} />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    {mixedAbonoUsdPreview != null && payRow && (
                                                        <div className="ap-pay-preview">
                                                            <div><strong>Total abonado (equiv. USD):</strong>{' '}
                                                                <NumberFormat value={mixedAbonoUsdPreview.toFixed(2)} displayType="text" thousandSeparator prefix="$ " />
                                                            </div>
                                                            <div className="ap-pay-preview-muted">
                                                                Pendiente tras este abono:{' '}
                                                                <NumberFormat
                                                                    value={Math.max(0, Number(payRow.pending || 0) - mixedAbonoUsdPreview).toFixed(2)}
                                                                    displayType="text"
                                                                    thousandSeparator
                                                                    prefix="$ "
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentReferenceMix" className="ap-pay-label">Referencia / comprobante (transferencias)</Label>
                                                        <Input
                                                            name="paymentReference"
                                                            id="paymentReferenceMix"
                                                            innerRef={registerPay}
                                                            placeholder="Obligatorio si hay monto en transferencia"
                                                            maxLength={200}
                                                        />
                                                    </FormGroup>
                                                    <FormGroup className="ap-pay-field">
                                                        <Label for="paymentNote" className="ap-pay-label">Observaciones (opcional)</Label>
                                                        <Input type="textarea" name="paymentNote" id="paymentNote" innerRef={registerPay} rows={3} maxLength={500} className="form-control" />
                                                    </FormGroup>
                                                </>
                                            )}
                                            <p className="ap-pay-footnote">La nota de la compra sigue visible al expandir la fila (productos y nota original).</p>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer ap-pay-modal-footer">
                                    <Button type="button" color="secondary" outline disabled={paySubmitting} onClick={() => { setPayRow(null); setPayModalEditMode(false); }}>Cancelar</Button>
                                    <Button type="submit" color="success" disabled={paySubmitting}>
                                        {paySubmitting && <span className="spinner-border spinner-border-sm mr-1" />}
                                        {payModalEditMode ? 'Guardar cambios' : 'Pagar o abonar'}
                                    </Button>
                                </div>
                            </Form>
                        </Modal>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AccountsPayableListPage;
