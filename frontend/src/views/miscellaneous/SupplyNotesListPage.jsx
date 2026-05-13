/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { orderMarketMiscellaneousActions, agencyActions } from '../../actions';
import moment from 'moment';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import DataTable from 'react-data-table-component';
import { Row, Col, Table, Button, Form, FormGroup, Modal, Badge } from 'reactstrap';
import NumberFormat from 'react-number-format';
import { useDarkMode } from '../../helpers/darkModeContext';
import '../../assets/css/darkMode.css';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm } from 'react-hook-form';
import { isValidDate } from '../../helpers/date';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from 'react-csv';
import { history } from '../../helpers';

const companies = [
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

function SupplyNotesListPage() {
    useEffect(() => {
        document.body.classList.add("landing-page", "sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return () => {
            document.body.classList.remove("landing-page", "sidebar-collapse");
        };
    }, []);

    const { darkMode } = useDarkMode();
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    const orderMarketMiscellaneousTable = useSelector(state => state.orderMarketMiscellaneous.table);
    const loadingPage = useSelector(state => state.orderMarketMiscellaneous.loading);

    // Obtener tiendas (agencies) del store
    const agencies = useSelector(state => state.agencies);
    const [listTiendas, setListTiendas] = useState([]);

    const [data, setData] = useState([]);
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    // Estado para exportar Excel
    const [dataExcel, setDataExcel] = useState([]);
    const refExcel = useRef(null);
    const [filters, setFilters] = useState({});
    const [isExporting, setIsExporting] = useState(false);

    // Escuchar el estado de actualización para refrescar datos
    const orderMarketMiscellaneousState = useSelector(state => state.orderMarketMiscellaneous);
    const isFirstRenderRef = useRef(true);

    // Estado para exportar individualmente a PDF/impresión
    const [dataToPrint, setDataToPrint] = useState(null);
    const printRef = useRef();

    const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };
    const CustomLoader = () => (<div className="loading-table"></div>);

    const getUserData = () => ({ agency: user.agency.id, role: user.role, id: user.id });

    // Función helper para obtener filtros por defecto según el role
    const getDefaultFilters = () => {
        const defaultFilters = {};
        // Si el usuario es role 3, incluir automáticamente su tienda en los filtros
        if (user && user.role === 3 && user.agency && user.agency.id) {
            defaultFilters.marketId = user.agency.id;
        }
        return defaultFilters;
    };

    // Obtener tiendas disponibles
    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    }, []);

    useEffect(() => {
        if (agencies.obtained) {
            let tiendasList = [];
            if (agencies.list && Array.isArray(agencies.list)) {
                tiendasList = agencies.list;
            } else if (agencies.data) {
                if (Array.isArray(agencies.data)) {
                    tiendasList = agencies.data;
                } else if (agencies.data.results && Array.isArray(agencies.data.results)) {
                    tiendasList = agencies.data.results;
                }
            }
            setListTiendas(tiendasList);
        }
    }, [agencies.obtained, agencies.list, agencies.data]);

    //Abrir/Cerrar filtros
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    //Form Data Filter
    const { handleSubmit, register, reset } = useForm();

    const handleChangeStartDate = (date) => {
        setStartDate(date);
    };

    const handleChangeEndDate = (date) => {
        setEndDate(date);
    };

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState("");

    // Función para manejar edición - navegar a SupplyUpdated
    const handleEditNote = (row) => {
        console.log('row', row);
        const noteId = row._id;
        if (noteId) {
            history.push('/supply-updated', { id: noteId });
        }
    };

    //Consultar por filtros
    const onFilterData = (data, e) => {
        var validStartDate = moment(data.startDate).isValid();

        if (data.startDate != "" && !validStartDate) {
            setModalVisible(true);
            setModalMsg("Ingrese una fecha válida");
            return;
        }

        var validEndDate = moment(data.endDate).isValid();

        if (data.endDate != "" && !validEndDate) {
            setModalVisible(true);
            setModalMsg("Ingrese una fecha válida");
            return;
        }

        //Verificar que la fecha final sea superior o igual a la inicial
        var isafter = moment(data.startDate).isAfter(data.endDate);

        if (isafter) {
            setModalVisible(true);
            setModalMsg("La fecha inicial no puede ser superior a la final");
            return;
        }

        var a = moment(data.startDate);
        var b = moment(data.endDate);
        let dateDiff = b.diff(a, "days");

        //Si el rango de fechas es superior a los 60 días abrir modal
        if (dateDiff > 60) {
            setModalVisible(true);
            setModalMsg("El rango de fechas no puede superar los 60 días");
            return;
        }

        // Limpiar campos vacíos antes de enviar
        const cleanFilters = {};
        if (data.order && data.order !== "") cleanFilters.order = data.order;
        if (data.marketId && data.marketId !== "") cleanFilters.marketId = data.marketId;
        if (data.marketCompany && data.marketCompany !== "") cleanFilters.marketCompany = data.marketCompany;
        if (data.startDate && data.startDate !== "") cleanFilters.startDate = data.startDate;
        if (data.endDate && data.endDate !== "") cleanFilters.endDate = data.endDate;

        // Si el usuario es role 3, forzar el marketId de su tienda
        if (user && user.role === 3 && user.agency && user.agency.id) {
            cleanFilters.marketId = user.agency.id;
        }

        setFilters(cleanFilters);
        dispatch(
            orderMarketMiscellaneousActions.dataTable(
                getUserData(),
                1,
                10000,
                { id: 'createdDate', desc: true },
                cleanFilters
            )
        );
    };

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        const defaultFilters = getDefaultFilters();
        setFilters(defaultFilters);
        reset({ order: "", marketId: user && user.role === 3 && user.agency ? user.agency.id : "", marketCompany: "", startDate: "", endDate: "" });
        dispatch(orderMarketMiscellaneousActions.dataTable(getUserData(), 1, 10000, { id: 'createdDate', desc: true }, defaultFilters));
    };

    useEffect(() => {
        if (user && user.agency) {
            const defaultFilters = getDefaultFilters();
            setFilters(defaultFilters);
            dispatch(orderMarketMiscellaneousActions.dataTable(getUserData(), 1, 10000, { id: 'createdDate', desc: true }, defaultFilters));
        }
    }, []);

    // Recargar datos cuando se actualiza una nota exitosamente
    useEffect(() => {
        // Evitar que se ejecute en el montaje inicial
        if (isFirstRenderRef.current) {
            isFirstRenderRef.current = false;
            return;
        }

        // Si se actualizó una nota exitosamente, recargar la tabla con los filtros actuales
        if (orderMarketMiscellaneousState.successUpdated && !orderMarketMiscellaneousState.updating) {
            dispatch(orderMarketMiscellaneousActions.dataTable(getUserData(), 1, 10000, { id: 'createdDate', desc: true }, filters));
        }
    }, [orderMarketMiscellaneousState.successUpdated, orderMarketMiscellaneousState.updating, filters]);

    // Detectar cuando se regresa desde otra página y recargar
    useEffect(() => {
        let previousPath = history.location.pathname;

        const unlisten = history.listen((location) => {
            // Si regresamos a /supply-notes desde otra ruta, recargar datos
            if (previousPath !== '/supply-notes' && location.pathname === '/supply-notes') {
                // Pequeño delay para asegurar que el componente ya está montado
                setTimeout(() => {
                    dispatch(orderMarketMiscellaneousActions.dataTable(getUserData(), 1, 10000, { id: 'createdDate', desc: true }, filters));
                }, 100);
            }
            previousPath = location.pathname;
        });

        return () => {
            unlisten();
        };
    }, [filters]);


    // Headers para exportar Excel
    const headers = [
        { label: 'N° de nota', key: 'order' },
        { label: 'Tienda', key: 'marketName' },
        { label: 'Empresa', key: 'marketCompany' },
        { label: 'Chofer', key: 'driverName' },
        { label: 'Usuario registrador', key: 'userName' },
        { label: 'Fecha', key: 'createdDate' },
    ];

    // Función helper para formatear números para Excel (Number con dos decimales y punto decimal)
    const formatNumberForExcel = (value) => {
        if (value === null || value === undefined || value === '') return 0;

        // Normalizar a número: quitar separadores de miles y ajustar decimal
        let str = value.toString().trim();
        // Quitar comas de miles
        str = str.replace(/,/g, '');
        // Reemplazar coma decimal por punto (por si viene en formato local)
        str = str.replace(',', '.');

        const num = parseFloat(str);
        if (Number.isNaN(num)) return 0;

        // Devolver como número con dos decimales (punto decimal) para que Excel lo trate como Number
        return Number(num.toFixed(2));
    };

    // Función para exportar Excel
    const exportExcel = () => {
        setIsExporting(true);
        dispatch(
            orderMarketMiscellaneousActions.dataTable(
                getUserData(),
                1,
                10000, // Número grande para obtener todos los registros
                { id: 'createdDate', desc: true },
                filters,
                true // isExcel = true
            )
        );
    };

    // Verificar data de redux de la data de excel
    useEffect(() => {
        if (isExporting && orderMarketMiscellaneousTable && orderMarketMiscellaneousTable.results && orderMarketMiscellaneousTable.results.length > 0) {
            // Copiar datos para exportar
            let fixedData = orderMarketMiscellaneousTable.results.map((item) => {
                return Object.assign({}, item);
            });

            // Formatear datos para Excel
            fixedData.forEach((item) => {
                // Formatear totalDollar y total Bs con 2 decimales para Excel
                item.totalDollar = formatNumberForExcel(item.totalDollar);
                item.total = formatNumberForExcel(item.total);

                // Formatear fecha
                item.createdDate = moment(item.createdDate)
                    .utc()
                    .format("YYYY-MM-DD HH:mm");
            });

            setDataExcel(fixedData);
            setIsExporting(false);
        } else if (!isExporting && orderMarketMiscellaneousTable && orderMarketMiscellaneousTable.results) {
            // Si no estamos exportando, actualizar la tabla normal
            setData(orderMarketMiscellaneousTable.results);
        }
    }, [orderMarketMiscellaneousTable, isExporting]);

    // Descargar cuando dataExcel esté listo
    useEffect(() => {
        if (
            dataExcel &&
            dataExcel.length > 0 &&
            refExcel &&
            refExcel.current &&
            refExcel.current.link
        ) {
            setTimeout(() => {
                refExcel.current.link.click();
                setDataExcel([]);
            });
        }
    }, [dataExcel]);

    const columns = [
        {
            name: 'Status',
            selector: 'status',
            sortable: true,
            cell: (row) => {
                const status = row.status || 'PENDIENTE';
                const statusUpper = status.toUpperCase();
                if (statusUpper === 'PENDIENTE' || statusUpper === 'PENDING') {
                    return <Badge color="danger">PENDIENTE</Badge>;
                } else if (statusUpper === 'CONFIRMADO' || statusUpper === 'CONFIRMED') {
                    return <Badge color="success">CONFIRMADO</Badge>;
                } else if (statusUpper === 'ACEPTADO' || statusUpper === 'ACCEPTED' || statusUpper === 'ACEPT') {
                    return <Badge color="success">ACEPTADO</Badge>;
                } else if (statusUpper === 'MODIFICADO' || statusUpper === 'MODIFIED') {
                    return <Badge color="warning">MODIFICADO</Badge>;
                }
                return <Badge color="secondary">{status}</Badge>;
            }
        },
        { name: 'N° de nota', selector: 'order', sortable: true },
        { name: 'Tienda', selector: 'marketName', sortable: true, wrap: true },
        { name: 'Empresa', selector: 'marketCompany', sortable: true, wrap: true },
        { name: 'Chofer', selector: 'driverName', sortable: true, wrap: true, cell: (row) => row.driverName || row.driverFullName || '' },
        { name: 'Usuario registrador', selector: 'userName', sortable: true, wrap: true, cell: (row) => row.userName || '' },
        { name: 'Fecha', selector: 'createdDate', sortable: true, cell: (row) => moment(row.createdDate).utc().format('YYYY-MM-DD HH:mm') },
        {
            name: '',
            button: true,
            width: '100px',
            cell: (row) => {
                const statusUpper = (row.status || '').toString().toUpperCase();
                const createdDate = row.createdDate ? moment(row.createdDate).utc().local() : null;
                const today = moment();
                const isToday = createdDate ? createdDate.isSame(today, 'day') : false;

                // Si audit es true, ocultar botón de editar
                if (row.audit === true) {
                    return null;
                }

                // Si la nota NO es de hoy y está en uno de estos estados, ocultar botón como antes
                if (['ACEPT', 'ACEPTADO', 'ACCEPTED', 'MODIFIED', 'MODIFICADO'].includes(statusUpper)) {
                    return null;
                }

                // Si es de hoy, mostrar siempre el botón, sin importar el status
                return (
                    <Button
                        className="btn-link"
                        color="primary"
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            handleEditNote(row);
                        }}
                    >
                        <i className="fas fa-pencil-alt" aria-hidden="true"></i>
                    </Button>
                );
            }
        },
    ];

    const ExpandedComponent = ({ data, hideExportButton = false }) => {
        if (!data) {
            return <div>No hay datos para mostrar.</div>;
        }

        // Obtener productos actuales
        const currentProducts = Array.isArray(data.products) ? data.products : [];

        // Obtener productos originales (si existe originalData, sino usar products como originales)
        // Filtrar productos con kg = 0.00
        const originalProductsRaw = data.originalData && Array.isArray(data.originalData.products)
            ? data.originalData.products
            : currentProducts;
        const originalProducts = originalProductsRaw.filter(product => {
            const kg = parseFloat(product.kg ?? 0) || 0;
            return kg !== 0;
        });

        // Obtener productos modificados
        const modifiedProducts = Array.isArray(data.modifiedProducts) ? data.modifiedProducts : [];
        const hasModified = modifiedProducts.length > 0;

        // Helper para obtener presentación confiable (tomando en cuenta products / originalData por code)
        const getTrustedPresentation = (product = {}) => {
            const directPres = (product.presentation || '').toString().trim();
            if (directPres) return directPres;

            const code =
                (product.code ||
                    (product.product && product.product.code) ||
                    '').toString().trim();
            if (!code) return '';

            const allSources = [
                ...currentProducts,
                ...originalProductsRaw,
            ];

            const found = allSources.find((p) => {
                const pCode =
                    (p.code ||
                        (p.product && p.product.code) ||
                        '').toString().trim();
                return pCode && pCode === code;
            });

            return (found && found.presentation) ? found.presentation.toString().trim() : '';
        };

        const isUnitsPresentation = (product = {}) => {
            const pres = getTrustedPresentation(product).toString().trim().toLowerCase();
            return pres === 'unidades';
        };

        const formatValue = (value, decimals = 2) => {
            const numeric = parseFloat(value);
            if (Number.isNaN(numeric)) {
                return (0).toFixed(decimals);
            }
            return numeric.toFixed(decimals);
        };

        const getBeforeProduct = (item) => item.before || item.product || {};
        const getAfterProduct = (item) => item.after || item.product || {};

        const buildDetail = (item) => {
            const type = (item.type || '').toLowerCase();
            if (type === 'added') {
                return <span className="text-success font-weight-bold">Nuevo</span>;
            }
            if (type === 'removed') {
                return <span className="text-danger font-weight-bold">Eliminado</span>;
            }
            if (type === 'updated') {
                const before = getBeforeProduct(item);
                const after = getAfterProduct(item);

                const parts = [];

                if (parts.length === 0) {
                    return <span className="text-warning font-weight-bold">Actualizado</span>;
                }
                return <span className="text-warning font-weight-bold">Actualizado ({parts.join(' | ')})</span>;
            }
            return <span>-</span>;
        };

        // Determinar si hay productos originales separados
        const hasOriginalData = data.originalData && data.originalData.products && data.originalData.products.length > 0;
        const showOriginalSection = hasOriginalData && (hasModified || currentProducts.length > 0);

        return (
            <>
                {/* Pedido Original - Solo mostrar si existe originalData y hay productos */}
                {showOriginalSection && (
                    <>
                        <div className="ml-2 mt-4">
                            <b>Pedido original</b>
                        </div>
                        <Table striped responsive className="mt-2">
                            <thead style={{ color: "black" }}>
                                <tr>
                                    <th>Producto</th>
                                    <th>Peso</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: "black" }}>
                                {originalProducts.map((product, index) => (
                                    <tr key={`orig-${index}`}>
                                        <td>{product.name || "N/A"}</td>
                                        <td>
                                            <NumberFormat
                                                value={
                                                    isUnitsPresentation(product)
                                                        ? parseInt(product.kg || 0, 10)
                                                        : formatValue(product.kg, 3)
                                                }
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}

                {/* Pedido Modificado - Solo mostrar si hay modificaciones y hay originalData */}
                {showOriginalSection && hasModified && currentProducts.length > 0 && (
                    <>
                        <div className="ml-2 mt-4">
                            <b>Pedido modificado</b>
                        </div>
                        <Table striped responsive className="mt-2">
                            <thead style={{ color: "black" }}>
                                <tr>
                                    <th>Producto</th>
                                    <th>Peso</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: "black" }}>
                                {currentProducts.map((product, index) => (
                                    <tr key={`mod-prod-${index}`}>
                                        <td>{product.name || "N/A"}</td>   
                                        <td>
                                            <NumberFormat
                                                value={
                                                    isUnitsPresentation(product)
                                                        ? parseInt(product.kg || 0, 10)
                                                        : formatValue(product.kg, 3)
                                                }
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                            />
                                        </td>
                                        <td>
                                            <NumberFormat
                                                value={formatValue(product.total, 2)}
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                                prefix={'Bs '}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}

                {/* Productos actuales - Mostrar si no hay originalData o si no hay modificaciones */}
                {!showOriginalSection && currentProducts.length > 0 && (
                    <>
                        <Table striped responsive className="mt-2">
                            <thead style={{ color: "black" }}>
                                <tr>
                                    <th>Producto</th>
                                    <th>Peso</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: "black" }}>
                                {currentProducts.map((product, index) => (
                                    <tr key={`prod-${index}`}>
                                        <td>{product.name || "N/A"}</td>
                                        <td>
                                            <NumberFormat
                                                value={
                                                    isUnitsPresentation(product)
                                                        ? parseInt(product.kg || 0, 10)
                                                        : formatValue(product.kg, 3)
                                                }
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </>
                )}

                {/* Productos modificados con detalles - Solo mostrar si hay modificaciones */}
                {hasModified && (
                    <>
                        <div className="mt-3 ml-2">
                            <b>Original</b>
                        </div>
                        <Table striped responsive className="mt-2">
                            <thead style={{ color: "black" }}>
                                <tr>
                                    <th>Producto</th>
                                    <th>Peso</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: "black" }}>
                                {modifiedProducts
                                    .filter((item) => {
                                        const before = getBeforeProduct(item);
                                        const kg = parseFloat(before.kg ?? 0) || 0;
                                        return kg !== 0;
                                    })
                                    .map((item, index) => {
                                        const before = getBeforeProduct(item);
                                        const fallbackName = before.name || 'Producto';
                                        const priceValue = formatValue(before.price ?? 0, 2);
                                        const kgValue = formatValue(before.kg ?? 0, 3);
                                        const unitsValue = formatValue(before.units ?? 0, 0);

                                        return (
                                            <tr key={`mod-before-${index}`}>
                                                <td>{before.name || fallbackName}</td>
                                                <td>
                                                    <NumberFormat
                                                        value={
                                                            isUnitsPresentation(before)
                                                                ? parseInt(before.kg || 0, 10)
                                                                : kgValue
                                                        }
                                                        displayType={'text'}
                                                        thousandSeparator={','}
                                                        decimalSeparator={'.'}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </Table>

                        {/* Productos modificados - Después (After) */}
                        <div className="mt-3 ml-2">
                            <b>Modificación</b>
                        </div>
                        <Table striped responsive className="mt-2">
                            <thead style={{ color: "black" }}>
                                <tr>
                                    <th>Producto</th>
                                    <th>Peso</th>
                                    <th>Detalle</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: "black" }}>
                                {modifiedProducts.map((item, index) => {
                                    const after = getAfterProduct(item);
                                    const before = getBeforeProduct(item);
                                    const fallbackName = after.name || before.name || 'Producto';
                                    const priceValue = formatValue(after.price ?? 0, 2);
                                    const kgValue = formatValue(after.kg ?? 0, 3);
                                    const unitsValue = formatValue(after.units ?? 0, 0);
            
                                    const originalKg = parseFloat(before.kg ?? 0) || 0;
                                    const originalPrice = parseFloat(before.price ?? 0) || 0;
                                    const originalTotal = originalKg * originalPrice;
            
                                    const modifiedKg = parseFloat(after.kg ?? 0) || 0;
                                    const modifiedPrice = parseFloat(after.price ?? 0) || 0;
                                    const modifiedTotal = modifiedKg * modifiedPrice;
            
                                    const diffWithOriginal = modifiedTotal - originalTotal;
                                    const diffDisplay = formatValue(diffWithOriginal, 2);

                                    return (
                                        <tr key={`mod-after-${index}`}>
                                            <td>{after.name || fallbackName}</td>
                                            <td>
                                                <NumberFormat
                                                    value={
                                                        isUnitsPresentation(after)
                                                            ? parseInt(after.kg || 0, 10)
                                                            : kgValue
                                                    }
                                                    displayType={'text'}
                                                    thousandSeparator={','}
                                                    decimalSeparator={'.'}
                                                />
                                            </td>
                                            <td>{buildDetail(item)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </>
                )}

                {(!currentProducts || currentProducts.length === 0) && (
                    <div className="py-2">No hay productos disponibles.</div>
                )}

                {/* Información de modificación */}
                {data.wasModified && (
                    <div className="ml-2 mt-3">
                        <small className="text-muted">
                            Este pedido fue modificado el {data.modifiedDate ? new Date(data.modifiedDate).toLocaleString() : 'N/A'}
                            {data.modifiedBy && ` por usuario ID: ${data.modifiedBy}`}
                        </small>
                    </div>
                )}

                {/* Sección AUDITADO POR FABRICA */}
                {data.commentAudit && (
                    <div className="ml-2 mt-4">
                        <div className="mb-2">
                            <b>AUDITADO POR FABRICA</b>
                        </div>
                        <div className="ml-2" style={{ whiteSpace: 'pre-line', color: 'black' }}>
                            {data.commentAudit}
                        </div>
                    </div>
                )}

                {/* Botón para exportar/imprimir esta nota */}
                {!hideExportButton && !dataToPrint && (
                    <div className="align-self-right" style={{ fontWeight: 'bold', fontStyle: 'italic', textAlign: 'right', marginRight: '50px', marginBottom: '50px', marginTop: '20px' }}>
                        <Button color="primary" onClick={() => { setDataToPrint(data); }}>
                            <Icon icon={pdfIcon} /> Exportar
                        </Button>
                    </div>
                )}
            </>
        );
    };

    const formatStatus = (status) => {
        if (!status) return 'PENDIENTE';
        const upper = status.toString().toUpperCase();
        if (upper === 'ACEPT' || upper === 'CONFIRMED') return 'ACEPTADO';
        if (upper === 'MODIFIED') return 'MODIFICADO';
        if (upper === 'PENDING') return 'PENDIENTE';
        return upper;
    };

    /** PARA IMPRIMIR **/
    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Nota N° ' + (dataToPrint ? dataToPrint.order : ''),
        onAfterPrint: () => setDataToPrint(null),
        pageStyle: "@media print { @page {margin: 0mm;} body {padding: 20mm !important;}}"
    });

    const ComponentToPrint = ({ data }) => (
        <>
            {data && (
                <div ref={printRef}>
                    <div className="align-self-center">
                        <h2 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '10mm' }}>Nota N° {data.order}</h2>
                    </div>
                    <Table striped responsive>
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>N° de nota</th>
                                <th>Tienda</th>
                                <th>Empresa</th>
                                <th>Encargado</th>
                                <th>Total $</th>
                                <th>Total Bs</th>
                                <th>Chofer</th>
                                <th>Usuario registrador</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <Badge color={
                                        data.status === 'ACEPT' || data.status === 'CONFIRMED'
                                            ? "success"
                                            : data.status === 'MODIFIED'
                                                ? "warning"
                                                : "danger"
                                    }>
                                        {formatStatus(data.status)}
                                    </Badge>
                                </td>
                                <td>{data.order || ''}</td>
                                <td>{data.marketName || ''}</td>
                                <td>{data.marketCompany || ''}</td>
                                <td>{data.marketAttendant || ''}</td>
                                <td>
                                    {data.totalDollar
                                        ? (
                                            <NumberFormat
                                                value={data.totalDollar.toFixed(2)}
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                                prefix={'$ '}
                                            />
                                        )
                                        : ''}
                                </td>
                                <td>
                                    {data.total
                                        ? (
                                            <NumberFormat
                                                value={data.total.toFixed(2)}
                                                displayType={'text'}
                                                thousandSeparator={','}
                                                decimalSeparator={'.'}
                                                prefix={'Bs '}
                                            />
                                        )
                                        : ''}
                                </td>
                                <td>{data.driverName || data.driverFullName || ''}</td>
                                <td>{data.userName || ''}</td>
                                <td>{moment(data.createdDate).utc().format('YYYY-MM-DD HH:mm')}</td>
                            </tr>
                        </tbody>
                    </Table>
                    <ExpandedComponent data={data} hideExportButton={true} />
                    <div className="align-self-right">
                        <p style={{ fontWeight: 'bold', fontSize: 'small', fontStyle: 'italic', position: 'fixed', bottom: "20mm", width: "88%" }}>
                            NOTA: Esto es un recibo virtual y no posee validéz fiscal. Los datos no deben ser usados para realizar retenciones de impuestos
                            por lo que solo debe tomar el monto para calcular su cotización, y una vez pagado podrá solicitar su factura fiscal
                        </p>
                    </div>
                </div>
            )}
        </>
    );

    useEffect(() => {
        if (dataToPrint) {
            handlePrint();
        }
    }, [dataToPrint]);

    return (
        <>
        <div className={`d-flex ${darkMode ? 'dark-mode' : ''}`} id="wrapper">
        <SideBar />
        <div id="page-content-wrapper">
                <AdminNavbar />
                <div className="flex-column flex-md-row p-3">
                    <div className="d-flex justify-content-between" style={{ padding: '4px 16px 4px 24px' }}>
                        <h3 style={{ marginBottom: '0', fontWeight: 'bold', fontStyle: 'italic' }}>Lista de notas de entrega de suministros</h3>
                    </div>
                    {/* Filtros */}
                    <div className="filter">
                        <div className="d-flex justify-content-between">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    toggle();
                                }}
                            >
                                <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
                            </a>
                            {isOpen && (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        clearFilters();
                                    }}
                                >
                                    <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
                                </a>
                            )}
                        </div>
                        {isOpen && (
                            <>
                                <Form onSubmit={handleSubmit(onFilterData)} style={{ marginTop: 15 }}>
                                    <Row className="mb-3">
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <input
                                                    className="form-control"
                                                    placeholder="N° de Nota"
                                                    type="number"
                                                    name="order"
                                                    min="1"
                                                    ref={register}
                                                ></input>
                                            </FormGroup>
                                        </Col>
                                        {user && user.role !== 3 && (
                                            <>
                                                <Col xs={12} sm={6} lg={3} className="mb-2">
                                                    <FormGroup>
                                                        {agencies.loading && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                        <select
                                                            className="form-control"
                                                            name="marketId"
                                                            ref={register}
                                                        >
                                                            <option key="" name="" value="">
                                                                Seleccione tienda
                                                            </option>
                                                            {listTiendas && listTiendas.map(tienda => (
                                                                <option
                                                                    key={tienda.id}
                                                                    name={tienda.id}
                                                                    value={tienda.id}
                                                                >
                                                                    {tienda.name || tienda.nombre || `Tienda ${tienda.id}`}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FormGroup>
                                                </Col>

                                                <Col xs={12} sm={6} lg={3} className="mb-2">
                                                    <FormGroup>
                                                        <select
                                                            name="marketCompany"
                                                            ref={register()}
                                                            className="form-control"
                                                        >
                                                            <option value="">Seleccione empresa</option>
                                                            {companies.map((company, index) => (
                                                                <option key={index} value={company}>
                                                                    {company}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FormGroup>
                                                </Col>
                                            </>
                                        )}
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <Datetime
                                                    timeFormat={false}
                                                    dateFormat={"YYYY-MM-DD"}
                                                    closeOnSelect
                                                    onChange={handleChangeStartDate}
                                                    value={startDate}
                                                    inputProps={{
                                                        name: "startDate",
                                                        ref: register,
                                                        placeholder: "Fecha inicial",
                                                        autoComplete: "off",
                                                    }}
                                                    isValidDate={isValidDate}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <Datetime
                                                    timeFormat={false}
                                                    dateFormat={"YYYY-MM-DD"}
                                                    closeOnSelect
                                                    onChange={handleChangeEndDate}
                                                    value={endDate}
                                                    inputProps={{
                                                        name: "endDate",
                                                        ref: register,
                                                        placeholder: "Fecha final",
                                                        autoComplete: "off",
                                                    }}
                                                    isValidDate={isValidDate}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <Button color="primary" type="submit" disabled={loadingPage}>
                                                    {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
                                                </Button>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </Form>
                            </>
                        )}
                    </div>
                    <Row>
                        <Col>
                            <DataTable
                                className="dataTables_wrapper"
                                responsive
                                highlightOnHover
                                expandableRows
                                expandableRowsComponent={<ExpandedComponent />}
                                striped
                                sortIcon={<i className="fa fa-arrow-down ml-2" />}
                                progressPending={loadingPage}
                                paginationComponentOptions={paginationOptions}
                                progressComponent={<CustomLoader />}
                                noDataComponent="No hay registros para mostrar"
                                noHeader
                                columns={columns}
                                data={data}
                                pagination
                                paginationResetDefaultPage={resetPaginationToggle}
                                persistTableHead
                                theme={darkMode ? 'dark' : 'default'}
                            />
                            {data && data.length > 0 && (
                                <div style={{ marginTop: '15px', textAlign: 'left' }}>
                                    <Button
                                        className="btn"
                                        color="primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            exportExcel();
                                        }}
                                        disabled={loadingPage}
                                    >
                                        <Icon icon={fileDownload} /> Exportar{" "}
                                        {loadingPage && (
                                            <span className="spinner-border spinner-border-sm mr-1"></span>
                                        )}
                                    </Button>
                                </div>
                            )}
                            {dataExcel.length > 0 && (
                                <CSVLink
                                    ref={refExcel}
                                    data={dataExcel}
                                    separator={";"}
                                    headers={headers}
                                    filename={"NotasDeEntregaSuministros.csv"}
                                    style={{ display: "none" }}
                                >
                                    Exportar
                                </CSVLink>
                            )}
                        </Col>
                    </Row>
                </div>
            </div>
            <Modal isOpen={modalVisible} toggle={() => { setModalVisible(false); setModalMsg(""); }}>
                <div className="modal-header">
                    <h5 className="modal-title" id="exampleModalLabel">
                        Mensaje
                    </h5>
                </div>
                <div className="modal-body">
                    <p>{modalMsg}</p>
                </div>
                <div className="modal-footer">
                    <Button
                        color="secondary"
                        onClick={() => {
                            setModalVisible(false);
                            setModalMsg("");
                        }}
                    >
                        Cerrar
                    </Button>
                </div>
            </Modal>
        </div>
        {/* Componente para imprimir (oculto) */}
        <div style={{ display: "none" }}>
            <ComponentToPrint data={dataToPrint} />
        </div>
        </>
    );
}

export default SupplyNotesListPage;
