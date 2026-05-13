/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { userActions, invoiceActions } from "../../actions";
import moment from "moment";
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import {
    Button,
    Row,
    Col,
    Form,
    FormGroup,
    Modal,
} from "reactstrap";
//componente dataTable sede
import { history } from "../../helpers";
import "../../assets/css/table.css";
import "../../assets/css/filters.css";
import NumberFormat from "react-number-format";
import Datetime from "react-datetime";
import "moment/locale/es";
import { useForm } from "react-hook-form";
import { Icon } from "@iconify/react";
import fileDownload from "@iconify/icons-fa-solid/file-download";
import { isValidDate } from "../../helpers/date";
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

// Lista de empresas
const companies = [
  "EMBUTIDOS FATTORIA",
  "Principal",
  "EMBUTIDOS MOHAN",
  "DELICATESES EMMANUEL",
  "DELICATESES MOMOY",
  "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

const CustomLoader = () => (<><div className="loading-table"></div></>);

function KPIsMonitoreoEspecialPage() {
    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    // Modo oscuro 
    const { darkMode } = useDarkMode();

    //usuario
    const user = useSelector((state) => state.authentication.user);
    const dispatch = useDispatch();

    // Estado para datos de KPIs desde Redux
    const kpiDataState = useSelector((state) => state.invoice.stats);
    const loadingKpis = useSelector((state) => state.invoice.loadingStats);
    const paymentStatsState = useSelector((state) => state.invoice.paymentStats);
    const loadingPaymentStats = useSelector((state) => state.invoice.loadingPaymentStats);
    const [kpiData, setKpiData] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [agencyInfo, setAgencyInfo] = useState(null);
    const [paymentData, setPaymentData] = useState(null);

    //obtener data de usuario necesaria
    const getUserData = () => {
        return {
            agency: user.agency.id,
            role: user.role,
            id: user.id,
        };
    };

    //obtener sucursales para select
    const getting = useSelector((state) => state.users.getting);
    const users = useSelector((state) => state.users);
    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    }, []);

    const [listUsers, setListUsers] = useState(null);
    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (users.obtained) {
            setListUsers(users.list.users);
            setListAgencies(users.list.agencies);
        }
    }, [users.obtained]);

    const [filters, setFilters] = useState("");

    // Estado para controlar si se ha realizado una búsqueda
    const [hasSearched, setHasSearched] = useState(false);

    // Actualizar datos de KPIs cuando lleguen desde Redux
    useEffect(() => {
        if (kpiDataState) {
            // Procesar la estructura de datos recibida
            if (kpiDataState.results && Array.isArray(kpiDataState.results)) {
                setKpiData(kpiDataState.results);
            }
            if (kpiDataState.metadata) {
                setMetadata(kpiDataState.metadata);
            }
            // Obtener información de la primera sucursal para el título
            if (kpiDataState.results && kpiDataState.results.length > 0) {
                const firstResult = kpiDataState.results[0];
                setAgencyInfo({
                    branchName: firstResult.branchName || '',
                    companyName: firstResult.companyName || ''
                });
            }
        }
    }, [kpiDataState]);

    // Actualizar datos de Payment Methods cuando lleguen desde Redux
    useEffect(() => {
        if (paymentStatsState) {
            // Procesar la estructura de datos recibida (asumiendo estructura similar)
            if (paymentStatsState.results && Array.isArray(paymentStatsState.results)) {
                setPaymentData(paymentStatsState.results);
            }
        }
    }, [paymentStatsState]);

    //Abrir/Cerrar filtros
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    //Consultar por filtros
    const onFilterData = (data, e) => {
        // Limpiar errores previos
        setStartDateError("");
        setEndDateError("");
        setAgencyError("");

        // Validar que las fechas sean requeridas
        if (!data.startDate || data.startDate === "") {
            setStartDateError("La fecha de inicio es requerida");
            return;
        }

        if (!data.endDate || data.endDate === "") {
            setEndDateError("La fecha final es requerida");
            return;
        }

        var validStartDate = moment(data.startDate).isValid();

        if (!validStartDate) {
            setStartDateError("Ingrese una fecha de inicio válida");
            return;
        }

        var validEndDate = moment(data.endDate).isValid();

        if (!validEndDate) {
            setEndDateError("Ingrese una fecha final válida");
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
        let dateDiff = b.diff(a, "days"); // =1

        //Si el rango de fechas es superior a los 60 días abrir modal
        if (dateDiff > 60) {
            setModalVisible(true);
            setModalMsg("El rango de fechas no puede superar los 60 días");
            return;
        }

        setFilters(data);
        setHasSearched(true); // Marcar que se ha realizado una búsqueda

        // Obtener datos de KPIs desde el backend
        dispatch(invoiceActions.invoiceStatsByCompanyBranch(getUserData(), data));
        // Obtener datos de Payment Methods desde el backend
        dispatch(invoiceActions.paymentFiscalMethodsStatsByCompanyBranch(getUserData(), data));
    };

    //Form Data Filter
    const { handleSubmit, register, reset, setValue, watch } = useForm();
    const agencyFilterWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

    const handleChangeStartDate = (date) => {
        setStartDate(date);
        // Limpiar error cuando el usuario empiece a escribir
        if (startDateError) {
            setStartDateError("");
        }
    };

    const handleChangeEndDate = (date) => {
        setEndDate(date);
        // Limpiar error cuando el usuario empiece a escribir
        if (endDateError) {
            setEndDateError("");
        }
    };

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const [agencyError, setAgencyError] = useState("");

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
        setStartDateError("");
        setEndDateError("");
        setAgencyError("");
        reset({ ticket: "", names: "", reference: "", startDate: "", endDate: "", agency: "", company: "" });
        setHasSearched(false);
        setKpiData(null);
        setMetadata(null);
        setAgencyInfo(null);
        setPaymentData(null);
    };

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState("");

    /*** Exportar datos de KPIs ***/
    const exportExcel = () => {
        if (!kpiData || (Array.isArray(kpiData) && kpiData.length === 0)) {
            setModalVisible(true);
            setModalMsg("No hay datos de KPIs para exportar");
            return;
        }

        const fechaInicial = filters && filters.startDate ? moment(filters.startDate).format('YYYY-MM-DD') : '';
        const fechaFinal = filters && filters.endDate ? moment(filters.endDate).format('YYYY-MM-DD') : '';

        // Preparar datos para exportar
        const exportData = Array.isArray(kpiData) ? kpiData.map((item) => ({
            'Compañía': item.companyName || '',
            'Sucursal': item.branchName || '',
            'Total Facturado': (item.totalAmount || 0).toFixed(2),
            'Cantidad de Facturas': item.invoiceCount || 0,
            'Promedio por Factura': (item.averagePerInvoice || 0).toFixed(2),
            'Base Imponible': (item.totalTaxableBase || 0).toFixed(2),
            'IVA': (item.totalIva || 0).toFixed(2),
            'Exento': (item.totalExempt || 0).toFixed(2),
            'Porcentaje Promedio': (item.averagePercentage || 0).toFixed(2) + '%',
            'Fecha Inicial': fechaInicial,
            'Fecha Final': fechaFinal,
        })) : [];

        // Agregar fila de totales al final
        if (metadata) {
            exportData.push({
                'Compañía': 'TOTAL GENERAL',
                'Sucursal': '',
                'Total Facturado': (metadata.totalGeneralAmount || 0).toFixed(2),
                'Cantidad de Facturas': metadata.totalGeneralCount || 0,
                'Promedio por Factura': (metadata.averageGeneral || 0).toFixed(2),
                'Base Imponible': '',
                'IVA': '',
                'Exento': '',
                'Porcentaje Promedio': '',
                'Fecha Inicial': fechaInicial,
                'Fecha Final': fechaFinal,
            });
        }

        // Exportar a Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, 'KPIs Monitoreo Especial');

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, 'KPIsMonitoreoEspecial.xlsx');
    };

    // Función para crear tarjeta KPI de métodos de pago
    const createPaymentMethodsKPICard = (item, color) => {
        if (!item) return null;

        return (
            <Col md={6} lg={5} className="mb-4 ml-4 mr-4" key={item.agencyId || `payment-${Math.random()}`}>
                <div style={{
                    padding: '20px',
                    backgroundColor: darkMode ? '#2d3748' : '#fff', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderTop: `4px solid ${color}`,
                    height: '100%'
                }}>
                    <h6 style={{
                        color: '#000000',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textTransform: 'uppercase'
                    }}>
                        VENTAS
                    </h6>
                    <h6 style={{
                        color: color,
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textTransform: 'uppercase'
                    }}>
                        {item.branchName || ''}
                    </h6>
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: darkMode ? '#a0aec0' : '#718096' }}>
                        {item.companyName}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Exento
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalExempt || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Base Imponible
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalTaxableBase || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total IVA
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalIva || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Facturado
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalAmount || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Cantidad de Cierres
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            {item.closingCount || 0}
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Promedio por Cierre
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.averagePerClosing || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    // Función para crear tarjeta KPI de sucursal
    const createBranchKPICard = (item, color) => {
        if (!item) return null;

        return (
            <Col md={6} lg={5} className="mb-4 ml-4 mr-4"  key={item.agencyId || Math.random()}>
                <div style={{
                    padding: '20px',
                    backgroundColor: darkMode ? '#2d3748' : '#fff', 
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderTop: `4px solid ${color}`,
                    height: '100%'
                }}>
                    <h6 style={{
                        color: '#000000',
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textTransform: 'uppercase'
                    }}>
                        COMPRAS
                    </h6>
                    <h6 style={{
                        color: color,
                        fontWeight: 'bold',
                        marginBottom: '15px',
                        fontSize: '14px',
                        textTransform: 'uppercase'
                    }}>
                        {item.branchName || ''}
                    </h6>
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: darkMode ? '#a0aec0' : '#718096' }}>
                        {item.companyName}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Exento
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalExempt || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Base Imponible
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalTaxableBase || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total IVA
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalIva || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Total Facturado
                        </div>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.totalAmount || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Cantidad de Facturas
                        </div>
                        <div style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            {item.invoiceCount || 0}
                        </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Promedio por Factura
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: darkMode ? '#fff' : '#000'
                        }}>
                            <NumberFormat
                                value={(item.averagePerInvoice || 0).toFixed(2)}
                                displayType={'text'}
                                thousandSeparator={','}
                                decimalSeparator={'.'}
                                prefix={'Bs '}
                            />
                        </div>
                    </div>                                        
                    <div>
                        <div style={{
                            fontSize: '12px',
                            color: darkMode ? '#a0aec0' : '#718096',
                            marginBottom: '4px'
                        }}>
                            Porcentaje Promedio
                        </div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: color
                        }}>
                            {(item.averagePercentage || 0).toFixed(2)}%
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="flex-column flex-md-row p-3">
                        <div
                            className="d-flex justify-content-between"
                            style={{ padding: "4px 16px 4px 24px" }}
                        >
                            <div className="align-self-center">
                                <h3
                                    style={{
                                        fontWeight: "bold",
                                        fontStyle: "italic",
                                        marginBottom: "0",
                                    }}
                                >
                                    KPIs Monitoreo Especial
                                </h3>
                            </div>
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
                                    <i className="fa fa-search" aria-hidden="true"></i> Búsqueda
                                    avanzada
                                </a>
                                {isOpen && (
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearFilters();
                                        }}
                                    >
                                        <i className="fa fa-times" aria-hidden="true"></i> Borrar
                                        filtros
                                    </a>
                                )}
                            </div>
                            {isOpen && (
                                <>
                                    <Form
                                        onSubmit={handleSubmit(onFilterData)}
                                        style={{ marginTop: 15 }}
                                    >
                                        {/* Primera fila - Campos principales */}
                                        <Row className="mb-3">
                                            {(user.role == 1 ||
                                                user.role == 2 ||
                                                user.role == 6 ||
                                                user.role == 5 ||
                                                user.role == 7 ||
                                                user.role == 9 ||
                                                user.role == 10
                                            ) && (
                                                    <Col xs={12} sm={6} lg={3} className="mb-2">
                                                        <FormGroup>
                                                            {getting && (
                                                                <span className="spinner-border spinner-border-sm mr-1"></span>
                                                            )}
                                                            <select
                                                                className="form-control"
                                                                name="agency"
                                                                ref={register}
                                                                onChange={(e) => {
                                                                    if (agencyError) {
                                                                        setAgencyError("");
                                                                    }
                                                                }}
                                                            >
                                                                <option key="" name="" value="">
                                                                    Seleccione sucursal
                                                                </option>
                                                                {listAgencies &&
                                                                    listAgencies.map((list) => (
                                                                        <option
                                                                            key={list.id}
                                                                            name={list.id}
                                                                            value={list.id}
                                                                        >
                                                                            {`${list.name}`}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            {agencyError && (
                                                                <span style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '5px' }}>
                                                                    {agencyError}
                                                                </span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                )}
                                            <Col xs={12} sm={6} lg={3} className="mb-2">
                                                <FormGroup>
                                                    <select
                                                        className="form-control"
                                                        name="company"
                                                        ref={register}
                                                    >
                                                        <option key="" name="" value="">
                                                            Seleccione compañía
                                                        </option>
                                                        {companies.map((company, index) => (
                                                            <option
                                                                key={index}
                                                                name={company}
                                                                value={company}
                                                            >
                                                                {company}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>
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
                                                    {startDateError && (
                                                        <span style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '5px' }}>
                                                            {startDateError}
                                                        </span>
                                                    )}
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
                                                    {endDateError && (
                                                        <span style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '5px' }}>
                                                            {endDateError}
                                                        </span>
                                                    )}
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row className="mb-3">
                                            <Col xs={12} sm={6} md={3} className="mb-2">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={loadingKpis || loadingPaymentStats}
                                                    className="w-35"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    {loadingKpis && (
                                                        <span className="spinner-border spinner-border-sm mr-1"></span>
                                                    )}{" "}
                                                    Buscar
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </>
                            )}
                        </div>
                        {/* Filtros */}
                        {/* KPIs - Solo mostrar después de realizar una búsqueda */}
                        {hasSearched && (
                            <>
                                {/* Título con Agencia y Compañía */}
                                {agencyInfo && (agencyInfo.branchName || agencyInfo.companyName) && (
                                    <Row className="mb-4">
                                        <Col>
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: darkMode ? '#2d3748' : '#f8f9fa',
                                                borderRadius: '8px',
                                                marginBottom: '20px',
                                                textAlign: 'center'
                                            }}>
                                                <h3 style={{
                                                    margin: 0,
                                                    color: darkMode ? '#fff' : '#000',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {agencyInfo.branchName && <span>{agencyInfo.branchName}</span>}
                                                    {agencyInfo.branchName && agencyInfo.companyName && <span> - </span>}
                                                    {agencyInfo.companyName && <span>{agencyInfo.companyName}</span>}
                                                </h3>
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                {/* Vista KPI - Tarjetas de Sucursales */}
                                <>
                                    {loadingKpis ? (
                                        <Row>
                                            <Col>
                                                <div style={{
                                                    padding: '40px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <CustomLoader />
                                                </div>
                                            </Col>
                                        </Row>
                                    ) : !kpiData || (Array.isArray(kpiData) && kpiData.length === 0) ? (
                                        <Row>
                                            <Col>
                                                <div className="text-center" style={{ padding: '40px', color: darkMode ? '#fff' : '#000' }}>
                                                    No hay datos disponibles
                                                </div>
                                            </Col>
                                        </Row>
                                    ) : (
                                        <>
                                            <Row>
                                                {/* Tarjetas de Compras (izquierda) - Color naranja */}
                                                {Array.isArray(kpiData) && kpiData.map((item, index) => {
                                                    const color = '#ff8c00'; // Naranja
                                                    return createBranchKPICard(item, color);
                                                })}
                                                
                                                {/* Tarjetas de Métodos de Pago (derecha) - Color azul claro */}
                                                {paymentData && Array.isArray(paymentData) && paymentData.length > 0 && paymentData.map((item, index) => {
                                                    const color = '#87ceeb'; // Azul claro
                                                    return createPaymentMethodsKPICard(item, color);
                                                })}
                                            </Row>
                                            
                                            
                                            {metadata && (
                                                <Row className="mt-3">
                                                    <Col md={12}>
                                                        <div style={{
                                                            padding: '20px',
                                                            backgroundColor: darkMode ? '#2d3748' : '#fff',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                            borderTop: '4px solid #dc3545'
                                                        }}>
                                                            <Row>
                                                                <Col md={3}>
                                                                    <h5 style={{
                                                                        color: '#dc3545',
                                                                        fontWeight: 'bold',
                                                                        marginBottom: '15px'
                                                                    }}>
                                                                        Cálculo promedio de IVA a pagar
                                                                    </h5>
                                                                   
                                                                </Col>
                                                                <Col md={3}>
                                                                    <div style={{ marginBottom: '12px' }}>
                                                                        <div style={{
                                                                            fontSize: '12px',
                                                                            color: darkMode ? '#a0aec0' : '#718096',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            Total Facturado
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '24px',
                                                                            fontWeight: 'bold',
                                                                            color: darkMode ? '#fff' : '#000'
                                                                        }}>
                                                                            {/* <NumberFormat
                                                                                value={(metadata.totalGeneralAmount || 0).toFixed(2)}
                                                                                displayType={'text'}
                                                                                thousandSeparator={','}
                                                                                decimalSeparator={'.'}
                                                                                prefix={'Bs '}
                                                                            /> */}
                                                                            0
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col md={3}>
                                                                    <div style={{ marginBottom: '12px' }}>
                                                                        <div style={{
                                                                            fontSize: '12px',
                                                                            color: darkMode ? '#a0aec0' : '#718096',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            Cantidad de Facturas
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '24px',
                                                                            fontWeight: 'bold',
                                                                            color: darkMode ? '#fff' : '#000'
                                                                        }}>
                                                                            {/* {(metadata.totalGeneralCount || 0).toLocaleString()} */}
                                                                            0
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                                <Col md={3}>
                                                                    <div style={{ marginBottom: '12px' }}>
                                                                        <div style={{
                                                                            fontSize: '12px',
                                                                            color: darkMode ? '#a0aec0' : '#718096',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            Promedio General
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '20px',
                                                                            fontWeight: 'bold',
                                                                            color: darkMode ? '#fff' : '#000'
                                                                        }}>
                                                                            {/* <NumberFormat
                                                                                value={(metadata.averageGeneral || 0).toFixed(2)}
                                                                                displayType={'text'}
                                                                                thousandSeparator={','}
                                                                                decimalSeparator={'.'}
                                                                                prefix={'Bs '}
                                                                            /> */}
                                                                            0
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            )}
                                        </>
                                    )}
                                </>
                            </>
                        )}
                        {/* Botón de exportar al final, a la izquierda */}
                        <Row className="mt-4">
                            <Col>
                                <div style={{ textAlign: 'left' }}>
                                    <Button
                                        className="btn"
                                        color="primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            exportExcel();
                                        }}
                                        disabled={!hasSearched || !kpiData ||
                                            (Array.isArray(kpiData) && kpiData.length === 0)}
                                    >
                                        <Icon icon={fileDownload} /> Exportar
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                        <Modal
                            toggle={() => {
                                setModalVisible(false);
                                setModalMsg("");
                            }}
                            isOpen={modalVisible}
                            className={`modal-lg ${darkMode ? "dark-mode" : ""}`}
                        >
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    KPIs Monitoreo Especial
                                </h5>
                                <button
                                    aria-label="Close"
                                    className="close"
                                    type="button"
                                    onClick={() => {
                                        setModalVisible(false);
                                        setModalMsg("");
                                    }}
                                >
                                    <span aria-hidden={true}>×</span>
                                </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                                <p>{modalMsg}</p>
                            </div>
                            <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                                <Button
                                    color="secondary"
                                    type="button"
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
                </div>
            </div>
        </>
    );
}

export default KPIsMonitoreoEspecialPage;
