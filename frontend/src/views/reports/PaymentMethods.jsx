/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Alert, Label, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, Modal, Table, Form, FormGroup, Collapse } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import TerminalListPage from '../terminal/TerminalList';
import { useReactToPrint } from 'react-to-print';
import { isValidDate } from '../../helpers/date';
import { useHistory } from "react-router-dom";
import { useDarkMode } from '../../helpers/darkModeContext';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css";
import { usdFromRow, formatUsd } from '../../helpers/paymentMethodsUsdDisplay';

// Tabla de resumen de caja desplegable (fuera del componente para conservar estado al colapsar)
function SummaryTableCollapsible({ data, darkMode }) {
	const [isSummaryOpen, setIsSummaryOpen] = useState(false);
	const boxUsd = usdFromRow(data, 'totalAmountBox');
	const amtUsd = usdFromRow(data, 'totalAmount');
	const sellUsd = usdFromRow(data, 'totalSell');
	const sumUsd = usdFromRow(data, 'totalSumation');
	const isOk = boxUsd != null && amtUsd != null && (boxUsd - amtUsd) >= 0;
	const summaryHeaderBg = darkMode ? (isOk ? 'rgba(26, 82, 61, 0.35)' : 'rgba(198, 40, 40, 0.35)') : (isOk ? 'rgba(26, 82, 61, 0.12)' : 'rgba(198, 40, 40, 0.12)');
	const summaryRowBg = darkMode ? (isOk ? 'rgba(26, 82, 61, 0.15)' : 'rgba(198, 40, 40, 0.15)') : (isOk ? 'rgba(26, 82, 61, 0.08)' : 'rgba(198, 40, 40, 0.08)');
	const borderColor = darkMode ? (isOk ? '#328a6c' : '#c62828') : (isOk ? '#8fbcab' : '#e57373');
	const rows = data ? [
		{ label: 'Total de abonos (USD)', value: sumUsd != null ? formatUsd(sumUsd) : '0.00', fmt: true },
		{ label: 'Monto vendido (USD)', value: sellUsd != null ? formatUsd(sellUsd) : '0.00', fmt: true },
		{ label: 'Monto en caja (USD)', value: amtUsd != null ? formatUsd(amtUsd) : '0.00', fmt: true },
		{ label: 'Monto real en caja (USD)', value: boxUsd != null ? formatUsd(boxUsd) : '0.00', fmt: true },
		{ label: 'Diferencia (USD)', value: (boxUsd != null && amtUsd != null) ? (boxUsd - amtUsd).toFixed(2) : '0.00', fmt: false }
	] : [];
	return (
		<div style={{ marginTop: '20px', maxWidth: '420px', border: `1px solid ${borderColor}`, borderRadius: '10px', overflow: 'hidden', boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)' }}>
			<button
				type="button"
				onClick={() => setIsSummaryOpen(!isSummaryOpen)}
				style={{
					width: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '12px 16px',
					background: summaryHeaderBg,
					border: 'none',
					borderBottom: isSummaryOpen ? `1px solid ${borderColor}` : 'none',
					color: darkMode ? '#e0e0e0' : '#333',
					fontWeight: 600,
					fontSize: '14px',
					cursor: 'pointer',
					transition: 'background 0.2s ease'
				}}
			>
				<span>Resumen de caja</span>
				<Icon icon={isSummaryOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} style={{ fontSize: '20px', opacity: 0.9 }} />
			</button>
			<Collapse isOpen={isSummaryOpen}>
				<Table borderless responsive size="sm" style={{ marginBottom: 0 }}>
					<tbody>
						{rows.map((row, idx) => (
							<tr key={idx} style={{ background: summaryRowBg }}>
								<th style={{ width: '55%', padding: '10px 14px', fontWeight: 600, color: darkMode ? '#e0e0e0' : '#333', borderBottom: idx < rows.length - 1 ? (darkMode ? '1px solid #444' : '1px solid rgba(0,0,0,0.06)') : 'none' }}>{row.label}</th>
								<td className="text-right font-weight-bold" style={{ padding: '10px 14px', color: darkMode ? '#fff' : '#333', borderBottom: idx < rows.length - 1 ? (darkMode ? '1px solid #444' : '1px solid rgba(0,0,0,0.06)') : 'none' }}>
									{row.fmt ? <NumberFormat value={row.value} displayType="text" thousandSeparator={true} prefix="US$ " /> : `US$ ${row.value}`}
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			</Collapse>
		</div>
	);
}

function PaymentMethodsPage() {

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

	const history = useHistory();

	//usuario
	const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();

	const dataSales = useSelector(state => state.sales.table);
	const loadingPage = useSelector(state => state.sales.loading);
	const registeringData = useSelector(state => state.sales.registering);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);

	//Verificar data de redux
	useEffect(() => {
		if (dataSales && dataSales.results) {
			setData(dataSales.results);
		}
		if (dataSales && dataSales.metadata && dataSales.metadata[0]) {
			setRowCount(dataSales.metadata[0].total);
		}
	}, [dataSales]);

	const [rowCount, setRowCount] = useState(0);

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id
		}
	}

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id": "date", "desc": true });
	const [loadingExportTransfer, setLoadingExportTransfer] = useState(false);
	const [loadingExportPdv, setLoadingExportPdv] = useState(false);

	const getDataTable = (page) => {
		dispatch(salesActions.salesPaymentMethods(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(salesActions.salesPaymentMethods(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters : {}, false));
	};

	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = { "id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(salesActions.salesPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters : {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(salesActions.salesPaymentMethods(getUserData(), page, newPerPage, direction, filters ? filters : {}, false));
	};

	//Consultar al entrar
	useEffect(() => {
		getDataTable(1);
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Calcular total general cuando cambie la información
	const [loadingTotal, setLoadingTotal] = useState(false);
	const [general, setGeneral] = useState(0);

	useEffect(() => {
		let sumtotal = 0
		if (data && data.length > 0) {
			setLoadingTotal(true);
			if (dataSales && dataSales.total[0] && dataSales.total[0].totalAmount) {
				sumtotal = dataSales.total[0].totalAmount;
			}
		}
		setLoadingTotal(false);
		setGeneral(sumtotal);
	}, [data]);

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<div style={{ padding: '20px', backgroundColor: darkMode ? '#2d2d2d' : '#f8f9fa', borderRadius: '8px', maxWidth: '560px' }}>
			{/* Estilos inline para animaciones */}
			<style>{`
				.payment-method-card {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 12px 16px;
					margin-bottom: 10px;
					background: ${darkMode ? '#3a3a3a' : '#ffffff'};
					border-radius: 8px;
					border: 1px solid ${darkMode ? '#555' : '#e0e0e0'};
					transition: all 0.3s ease;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}
				.payment-method-card:hover {
					transform: translateY(-2px);
					box-shadow: 0 4px 8px rgba(0,0,0,0.15);
					border-color: ${darkMode ? '#777' : '#e65100'};
				}
				.payment-method-label {
					font-weight: 600;
					color: ${darkMode ? '#e0e0e0' : '#333'};
					margin-right: 12px;
					font-size: 14px;
				}
				.payment-method-value {
					font-weight: 700;
					color: ${darkMode ? '#fff' : '#e65100'};
					font-size: 15px;
					margin-right: auto;
				}
				.detail-btn-modern {
					padding: 4px 10px;
					font-size: 12px;
					font-weight: 500;
					border-radius: 6px;
					transition: all 0.3s ease;
					border: none;
					cursor: pointer;
					background: linear-gradient(135deg, #c62828 0%, #e65100 50%, #ff8f00 100%);
					color: white;
					box-shadow: 0 2px 4px rgba(198, 40, 40, 0.4);
					width: auto;
					min-width: auto;
					flex-shrink: 0;
				}
				.detail-btn-modern:hover {
					transform: scale(1.05);
					box-shadow: 0 4px 12px rgba(198, 40, 40, 0.5);
					background: linear-gradient(135deg, #b71c1c 0%, #c62828 50%, #ff8f00 100%);
				}
				.detail-btn-modern:active {
					transform: scale(0.98);
				}
			`}</style>
			
			{/* Métodos de pago uno debajo del otro */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
				{/* Punto de venta */}
				<div className="payment-method-card">
					<span className="payment-method-label">Punto de venta (USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalPos') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalPos ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 5, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Efectivo Bs */}
				<div className="payment-method-card">
					<span className="payment-method-label">Efectivo Bs (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalVes') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalVes ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 7, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Dólar */}
				<div className="payment-method-card">
					<span className="payment-method-label">Dólar (USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalDollar') ?? data.totalDollar ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalDollar ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 1, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Euros */}
				<div className="payment-method-card">
					<span className="payment-method-label">Euros (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalEur') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalEur ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 2, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Pesos */}
				<div className="payment-method-card">
					<span className="payment-method-label">Pesos (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalCop') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalCop ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 3, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Transferencias - botón Detalle solo si hay datos */}
				<div className="payment-method-card">
					<span className="payment-method-label">Transferencias (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalTransfer') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalTransfer ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 4, data.agency._id) }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Descuentos por cupón */}
				<div className="payment-method-card">
					<span className="payment-method-label">Descuentos por cupón (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalCouponDiscount') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{((data.totalCouponDiscount != null ? data.totalCouponDiscount : 0) > 0) ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { history.push('/historial-cupones' + (data.date ? '?date=' + moment(data.date).utc().format('YYYY-MM-DD') : '')); }}
						>
							Detalle
						</button>
					) : null}
				</div>

				{/* Saldo final por créditos */}
				<div className="payment-method-card">
					<span className="payment-method-label">Saldo final por créditos del día (equiv. USD):</span>
					<span className="payment-method-value">
						US$ <NumberFormat value={(usdFromRow(data, 'totalCredit') ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} />
					</span>
					{data.totalCredit && data.totalCredit > 0 ? (
						<button 
							className="detail-btn-modern"
							onClick={() => { getDetails(data.date, 6, data.agency._id) }}
						>
							Créditos dados en el dia
						</button>
					) : null}
				</div>
			</div>

			{/* Resumen de caja desplegable */}
			<SummaryTableCollapsible data={data} darkMode={darkMode} />
		</div>
	);

	const [listDetail, setListDetail] = useState([]);

	// Normaliza los nombres viejos de transferencias a los nombres que el negocio quiere mostrar.
	// Nota: el backend sigue guardando los valores históricos en `tBank`, por eso normalizamos en el front.
	const normalizeTransferBankLabel = (tBank) => {
		const val = (tBank ?? '').toString();
		if (/MOHAN 2025/i.test(val)) {
			if (/BANESCO/i.test(val)) return 'Principal - BANESCO';
			return 'Principal - VENEZUELA';
		}
		if (/EMBUTIDOS MOHAN/i.test(val)) return 'Personal - BICENTENARIO';
		// Si ya viene con el nombre nuevo, lo dejamos pasar.
		if (val === 'Principal') return 'Principal - VENEZUELA';
		if (val === 'Principal - VENEZUELA') return 'Principal - VENEZUELA';
		if (val === 'Principal - PROVINCIAL') return 'Principal - VENEZUELA';
		if (val === 'Principal - BANESCO') return 'Principal - BANESCO';
		if (val === 'Personal - BICENTENARIO') return 'Personal - BICENTENARIO';
		return val;
	};

	const isTransferBankAllowed = (tBank) => {
		const val = (tBank ?? '').toString();
		// Solo permitimos (y por tanto mostramos) Principal y Personal (ex-EMBUTIDOS MOHAN).
		return /MOHAN 2025/i.test(val) || /EMBUTIDOS MOHAN/i.test(val) || /^Principal\b/i.test(val) || val === 'Personal - BICENTENARIO';
	};

	const [totalDetail, setTotalDetail] = useState(0);
	const [totalDetailUsd, setTotalDetailUsd] = useState(null);
	const [type, setType] = useState(0);
	const [modalVisible, setModalVisible] = useState(false);

	//Consultar detalle de monedas por fecha y tipo de moneda
	const getDetails = (date, type, agency, searchAllTransfers = false) => {
		// Si solo es para ver detalle (no exportar), no disparar descarga
		if (!searchAllTransfers) {
		  exportDetailsRequestedRef.current = false;
		}
		let data = { date, coin: type, agency };
	  
		if (searchAllTransfers) {
		  setAllTransfers(true);
		}
	  
		if (filters.mixData || searchAllTransfers) {
		  data.dataIsMixed = true;
	  
		  if (filters.startDate && filters.endDate) {
			data.startDate = filters.startDate;
			data.endDate = filters.endDate;
		  } else if (!filters.startDate && filters.endDate) {
			data.startDate = filters.endDate;
			data.endDate = filters.endDate;
		  } else if (filters.startDate && !filters.endDate) {
			data.startDate = filters.startDate;
			data.endDate = moment();
		  } else {
			data.startDate = moment();
			data.endDate = moment();
		  }
		}
	  
		setType(type);
		dispatch(salesActions.salesDetailPaymentMethods(data));
	  
		if (!searchAllTransfers) {
		  setModalVisible(true);
		}
	  };

	//State de detalle
	const loadingDetail = useSelector(state => state.sales.loadingDetail);
	const saleDetail = useSelector(state => state.sales);

	//Actualizar listDetail cuando llega la respuesta del detalle (cada exportación trae su tipo de data)
	useEffect(() => {
		if (!saleDetail.loadingDetail && saleDetail.dataDetail?.results) {
			setTotalDetail(saleDetail.dataDetail.total);
			setTotalDetailUsd(
				saleDetail.dataDetail.totalUsd != null
					? saleDetail.dataDetail.totalUsd
					: null
			);
			setListDetail(saleDetail.dataDetail.results);
			setLoadingExportTransfer(false);
			setLoadingExportPdv(false);
		}
	}, [saleDetail.loadingDetail, saleDetail.dataDetail]);

	//Header datatable excel
	const headers = [
		{ label: "Fecha", key: "date" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Monto Total (USD)", key: "displayUsd.totalAmountBox" },
		{ label: "Punto de venta (USD)", key: "displayUsd.totalPos" },
		{ label: "Efectivo Bs eq. USD", key: "displayUsd.totalVes" },
		{ label: "Dólar", key: "totalDollar" },
		{ label: "Euros eq. USD", key: "displayUsd.totalEur" },
		{ label: "Pesos eq. USD", key: "displayUsd.totalCop" },
		{ label: "Transferencias eq. USD", key: "displayUsd.totalTransfer" }
	];

	const [exportConfig, setExportConfig] = useState({
		headers: [],
		filename: "export.csv",
	});


	//Header transferencias excel
	const headersTransfer = [
		{ label: "Fecha", key: "createdDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Razón social", key: "razonSocial" },
		{ label: "Ticket", key: "order" },
		{ label: "Monto", key: "tAmmount" },
		{ label: "Banco", key: "tBank" },
		{ label: "Referencia", key: "tReference" },
	];

	//Header puntos de venta
	const headersPDV = [
		{ label: "Fecha", key: "createdDate" },
		{ label: "Agencia", key: "agency.name" },
		{ label: "Razón social", key: "razonSocial" },
		{ label: "Banco", key: "terminal.bank" },
		{ label: "Descripcion", key: "terminal.description" },
		{ label: "Terminal", key: "terminal.code" },		
		{ label: "Cierre de sistema", key: "subTotal" },
	];

	// Ref para exportar detalles solo cuando el usuario pidió la exportación (evitar descarga al entrar a la página)
	const exportDetailsRequestedRef = useRef(false);

	const handleExport = (type) => {
		exportedDetailsRef.current = false;
		exportDetailsRequestedRef.current = true;
		if (type === "transfer") {
			setLoadingExportTransfer(true);
			setExportConfig({
				headers: headersTransfer,
				filename: "Transferencias.csv",
			});
			getDetails("", 4, filters.agency ? filters.agency : null, true);
		} else if (type === "pdv") {
			setLoadingExportPdv(true);
			setExportConfig({
				headers: headersPDV,
				filename: "PuntosDeVenta.csv",
			});
			getDetails("", 5, filters.agency ? filters.agency : null, true);
		}
	};

	//limpiar data de modal
	const clearModal = () => {
		setModalVisible(false);
		setListDetail([]);
		setTotalDetail(0);
		setTotalDetailUsd(null);
		setType(0);
	}

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();
	//Form formas de pago
	const { handleSubmit: handleSubmitClose, register: registerClose, errors: errorsClose, reset: resetClose, control: controlClose } = useForm({ defaultValues: { eur: '', dollar: '', eur: '', eur: '' } });

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	}, []);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if (users.obtained) {
			setListAgencies(users.list.agencies);
		}
	}, [users.obtained]);

	const agencyFilterWatch = watch('agency');
	useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

	const [filters, setFilters] = useState('');


	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const clearFilters = () => {
		setStartDate('');
		setEndDate('');
		reset({ agency: '', startDate: '', endDate: '' })
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');


	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate = moment(data.startDate).isValid();

		if (data.startDate != "" && !validStartDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate = moment(data.endDate).isValid();

		if (data.endDate != "" && !validEndDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if (isafter) {
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');

		//Si el rango de fechas es superior a los seis días abrir modal
		if
			(user.role == 3 && dateDiff > 1) {
			setModalWarning(true);
			setModalMsg('Acceso denegado');
			return;
		}

		setFilters(data);
		dispatch(salesActions.salesPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
		},
		{
			name: 'Monto Total',
			selector: 'totalAmountBox',
			sortable: true,
			cell: (row) => {
				const u = usdFromRow(row, 'totalAmountBox');
				return <NumberFormat value={u != null ? u.toFixed(2) : '0.00'} displayType={'text'} thousandSeparator={true} prefix={'US$ '} />
			},
		},
		{
			name: 'Fecha',
			selector: 'date',
			sortable: true,
			cell: (row) => {
				return moment(row.date).utc().format("YYYY-MM-DD")
			},
		},
		{
			name: '',
			selector: 'date',
			omit: ((user.role == 4) || (user.role == 5) || (user.role == 8) || ((filters) && (filters.mixData))),
			cell: (row) => {
				return <Button color="primary" type="submit" disabled={loadingPage} onClick={() => { findTerminals(row) }}>
					{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Cerrar
				</Button>
			},
		},
		{
			name: '',
			selector: 'date',
			omit: ((user.role == 4) || (user.role == 5) || (user.role == 8) || ((filters) && (filters.mixData))),
			cell: (row) => {
				return <Button color="info" type="submit" disabled={loadingPage}   onClick={() => {
					findTerminals(row);  // Ejecuta la función existente
					history.push("/payment-special-methods-report"); // Redirige a la página
				}}>
					{loadingPage && <span className="spinner-border spinner-border-sm"></span>} Cerrar Z
				</Button>
			},
		},
	];


	/*** Exportar ***/
	const refExcel = useRef(null);

	// Ref para exportar general solo cuando el usuario pidió la exportación (evitar descarga al entrar)
	const exportGeneralRequestedRef = useRef(false);

	const exportExcel = () => {
		exportGeneralRequestedRef.current = true;
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(salesActions.salesPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}

	const mapDataWithHeaders = (data, headers) => {
		return data.map((item) => {
			const mappedItem = {};
			headers.forEach(({ label, key }) => {
				let value = key.includes(".")
					? key.split(".").reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item)
					: item[key];

				// Caso 1: Es un string con formato "123,456" → Convertir a número y limitar a 3 decimales
				if (typeof value === "string" && value.match(/^\d+,\d+$/)) {
					value = parseFloat(value.replace(",", "."));
					value = parseFloat(value.toFixed(3)); // Máximo 3 decimales (sin convertirlo a string)
				}
				// Caso 2: Es un string numérico sin decimales (ejemplo: "100") → Convertir a número
				else if (typeof value === "string" && /^\d+$/.test(value)) {
					value = parseInt(value, 10); // o parseFloat(value) si puede haber números grandes
				}
				// Caso 3: Si el valor ya es un número pero tiene muchos decimales → Redondear a 3
				else if (typeof value === "number") {
					value = parseFloat(value.toFixed(3)); // Aseguramos 3 decimales máximo
				}

				mappedItem[label] = value;
			});
			return mappedItem;
		});
	};



	const exportToExcel = (data, filename = 'Formasdepago.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Formas de pago');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};

	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	// Refs para evitar doble descarga al exportar
	const exportedGeneralRef = useRef(false);
	const exportedDetailsRef = useRef(false);

	//Verificar data de redux de la data de excel (solo procesar si el usuario pidió la exportación)
	useEffect(() => {
		if (!exportGeneralRequestedRef.current || !excel || !excel.results) return;
		exportGeneralRequestedRef.current = false;

		// Se una copia de los detalles para que estos no sean los modificados
		let fixedData = excel.results.map((item) => { return Object.assign({}, item) })

			//Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {

				item.date = moment(item.date).utc().format("YYYY-MM-DD")

				item.totalAmountBox = item.totalAmountBox.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalPos = item.totalPos.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalVes = item.totalVes.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalDollar = item.totalDollar.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalEur = item.totalEur.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalCop = item.totalCop.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

				item.totalTransfer = item.totalTransfer.toString()
					.replace(/\,/g, '')  // se eliminan las comas
					.replace(".", ',');  // se cambia la coma por punto

			})

		setDataExcel(fixedData);
	}, [excel]);

	
	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			if (exportedGeneralRef.current) return;
			exportedGeneralRef.current = true;
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted);
			setDataExcel([]);
			const t = setTimeout(() => { exportedGeneralRef.current = false; }, 100);
			return () => clearTimeout(t);
		}
	}, [dataExcel]);


	/*** Exportar Detalles ***/

	const refDetailsExcel = useRef(null);

	// Para diferenciar el ver los detalles de las transferencias y al querer exportar todas las transferencias
	const [allTransfers, setAllTransfers] = useState(false);

	// Inicializar data de excel
	const [dataDetailsExcel, setDataDetailsExcel] = useState([]);

	// Solo exportar detalles cuando el usuario pidió la exportación (evitar descarga automática al entrar)
	useEffect(() => {
		if (!exportDetailsRequestedRef.current) return;
		if (!loadingExportTransfer && !loadingExportPdv && listDetail && listDetail.length > 0) {
		  exportDetailsRequestedRef.current = false;
		  exportDetailsExcel();
		}
	  }, [listDetail, loadingExportTransfer, loadingExportPdv]);


	const exportDetailsExcel = () => {
		// Se hace una copia de los detalles para que estos no sean los modificados
		let fixedData = listDetail.map((item) => Object.assign({}, item));

		// Para “Transferencias”, ocultamos las demás cuentas y normalizamos los nombres.
		if (type === 4) {
			fixedData = fixedData
				.filter((item) => isTransferBankAllowed(item.tBank))
				.map((item) => {
					item.tBank = normalizeTransferBankLabel(item.tBank);
					return item;
				});
		}
	  
		// Se modifican los datos antes de la descarga en excel
		fixedData.forEach((item) => {
		  // Normalizar montos
		  item.tAmmount = item.tAmmount ? item.tAmmount.toString().replace(/\,/g, '').replace(".", ',') : '';
		  item.pAmmount = item.pAmmount ? item.pAmmount.toString().replace(/\,/g, '').replace(".", ',') : '';
		  item.pAmmountExtra = item.pAmmountExtra ? item.pAmmountExtra.toString().replace(/\,/g, '').replace(".", ',') : '';
		  item.subTotal = item.subTotal ? item.subTotal.toString().replace(/\,/g, '').replace(".", ',') : '';
	  
		  // Formatear fecha
		  item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
	  
		  // Fallback para terminal: usar terminalExtra si no existe terminal
		  item.terminal = item.terminal || item.terminalExtra || {};
	  
		  // Asegurar que las propiedades que usas en headers existan
		  item["terminal.bank"] = item.terminal.bank || "";
		  item["terminal.description"] = item.terminal.description || "";
		  item["terminal.code"] = item.terminal.code || "";
		  item.razonSocial = (item.agency && item.agency.company) ? item.agency.company : "";
		});
	  
		// Se ordenan por sucursales
		fixedData.sort((a, b) =>
		  a.agency.name > b.agency.name ? 1 : b.agency.name > a.agency.name ? -1 : 0
		);

	  
		setDataDetailsExcel(fixedData);
	  };
	

	  useEffect(() => {
		if (dataDetailsExcel.length > 0 && refDetailsExcel.current?.link) {
		  if (exportedDetailsRef.current) return;
		  exportedDetailsRef.current = true;
		  refDetailsExcel.current.link.click();
		  setDataDetailsExcel([]);
		  setLoadingExportTransfer(false);
		  setLoadingExportPdv(false);
		  const t = setTimeout(() => { exportedDetailsRef.current = false; }, 400);
		  return () => clearTimeout(t);
		}
	  }, [dataDetailsExcel]);

	// useEffect(() => {
	// 	if (dataDetailsExcel && dataDetailsExcel.length > 0 && refDetailsExcel && refDetailsExcel.current && refDetailsExcel.current.link) {
	// 		refDetailsExcel.current.link.click();
	// 		setDataDetailsExcel([]);
	// 	}
	// 	if (dataDetailsExcel && dataDetailsExcel.length > 0 && refDetailsExcel && allTransfers) {
	// 		refDetailsExcel.current.link.click();
	// 		setDataDetailsExcel([]);
	// 	}
	// }, [dataDetailsExcel]);

	/*** Exportar todas las transferencias / PDV: solo en useEffect 763 con exportDetailsRequestedRef ***/

	// Solo resetear allTransfers cuando llegue listDetail (no disparar descarga aquí)
	useEffect(() => {
		if (allTransfers && listDetail?.length >= 0) {
			setAllTransfers(false);
		}
	}, [listDetail]);

	/*** Exportar ***/


	// Cierre de formas de pago

	// Funcion para buscar los terminales
	const findTerminals = (data) => {
		dispatch(salesActions.salesDataForm(user.agency.id));
		setDataToClose(data);
		setModalClose(true)
	}

	const [terminaList, setTerminalList] = useState([]);

	const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
		control: controlClose, // control props comes from useForm (optional: if you are using FormContext)
		name: "terminalInputs", // unique name for your Field Array
	});

	useEffect(() => {
		if (saleDetail.obtained) {
			setTerminalList(saleDetail.data.agency.terminal);

			if (terminaList && terminaList.length == 0) {
				saleDetail.data.agency.terminal.forEach((terminal) => {

					let terminalToInput = { terminalId: terminal.id, terminalName: terminal.code }

					append(terminalToInput)
				})
			}
		}
	}, [saleDetail.obtained]);

	//Alertas
	const alert = useSelector(state => state.alert);
	//Mostrar alertas
	const [visible, setVisible] = useState(true);
	const onDismiss = () => setVisible(false);

	useEffect(() => {
		if (alert.message) {
			setVisible(true);
			window.setTimeout(() => { setVisible(false) }, 5000);
		}
	}, [alert]);


	const [modalClose, setModalClose] = useState(false);
	const [dataToClose, setDataToClose] = useState(null);
	const [modalConfirmClose, setModalConfirmClose] = useState(false);
	const [pendingCloseData, setPendingCloseData] = useState(null);

	const onCloseModal = () => {
		resetClose({
			eur: '',
			dollar: '',
			eur: '',
			eur: '',
		});
		setDataToClose(null);
		setModalClose(false);
	}

	// Función para enviar la data del cierre de formas de pago (abre modal de confirmación)
	const onCreateData = (data, e) => {
		setPendingCloseData({ data });
		setModalConfirmClose(true);
	}

	// Ejecutar el cierre tras confirmar en el modal
	const doConfirmClose = () => {
		if (!pendingCloseData) return;
		const data = pendingCloseData.data;

		data.user = user.id;
		data.virtualValues = dataToClose;		// Valores dados por el sistema en formas de pago
		data.agency = dataToClose.agency._id;
		data.date = dataToClose.date;

		// Se obtienen los valores ingresados para los puntos de venta
		const keys = Object.keys(data.terminalInputs)

		data.terminalAmmounts = keys.map((item, index) => {
			return {
				terminal: item,
				debit: data.terminalInputs[item].debit,
				credit: data.terminalInputs[item].credit,
				lote: data.terminalInputs[item].lote,
			}
		})

		data.transferAmmounts = [
			{
				code: 'VENEZUELA Principal',
				bank: 'VENEZUELA',
				account: 'Principal',
				total: dataToClose.totalTransferMohan2025
			},
			{
				code: 'PROVINCIAL DANIEL PERSONAL',
				bank: 'PROVINCIAL',
				account: 'DANIEL PERSONAL',
				total: dataToClose.totalTransferDanielPersonal
			},
			{
				code: 'PROVINCIAL EMBUTIDOS MOHAN',
				bank: 'PROVINCIAL',
				account: 'EMBUTIDOS MOHAN',
				total: dataToClose.totalTransferEmbutidosMohan
			},
			{
				code: 'BANESCO DELICATESES MOMOY',
				bank: 'BANESCO',
				account: 'DELICATESES MOMOY',
				total: dataToClose.totalTransferDelicatesesMomoy
			},
			{
				code: 'BANESCO DELICATESES ENMANUEL',
				bank: 'BANESCO',
				account: 'DELICATESES ENMANUEL',
				total: dataToClose.totalTransferDelicatesesEnmanuel
			},
			{
				code: 'MERCANTIL PERSONAL',
				bank: 'MERCANTIL',
				account: 'PERSONAL',
				total: dataToClose.totalTransferMercantilPersonal
			},
			{
				code: 'FATTORIA BICENTENARIO',
				bank: 'BICENTENARIO',
				account: 'FATTORIA BICENTENARIO',
				total: dataToClose.totalTransferEmbutidosFattoria
			},
			{
				code: 'BANESCO EMBUTIDOS MOHAN',
				bank: 'BANESCO',
				account: 'EMBUTIDOS MOHAN B',
				total: dataToClose.totalTransferEmbutidosMohanB
			},
			{
				code: 'BANESCO Principal',
				bank: 'BANESCO',
				account: 'Principal',
				total: dataToClose.totalTransferMohan2025B
			},
		]

		dispatch(salesActions.salesPaymentMethodsClose(data));
		setModalConfirmClose(false);
		setPendingCloseData(null);
		onCloseModal();
	}

	/** PARA EXPORTAR **/


	// Registro almacenado para imprimir

	const detailsToPrint = useSelector(state => state.sales.reference);
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef();

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: (dataToPrint ? dataToPrint.agency.name : '') + ' ' + (dataToPrint ? moment(dataToPrint.date).utc().format("YYYY-MM-DD") : ''),
		onAfterPrint: () => setDataToPrint(null),
		pageStyle: "@page{margin: 20mm;	}"
	})

	const ComponentToPrint = ({ dataComponent }) => (
		<>
			{dataComponent && <div ref={printRef} >
				<Row >
					<Col md="12" sm="12" lg="12">
						{loadingPage && <div className="justify-content-center"><CustomLoader /></div>}
						<Table responsive hover bordered size="sm">
							<tbody style={{ textAlign: 'center', color: "black" }}>
								<tr style={{ height: '7rem', fontSize: 'x-large' }}>
									<th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={12}> Cierre del dia {moment(dataComponent.date).format('dddd')} {moment(dataComponent.date).format('LL')} <br></br> {dataComponent.agency.name}</th>
								</tr>
								<tr style={{ height: "0" }}>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
									<th style={{ width: '8.33%' }} rowSpan={1} colSpan={1} ></th>
								</tr>
								<tr>
									<th style={{ width: '25%' }} rowSpan={1} colSpan={3} >Dólar BCV</th>
									<th style={{ width: '25%' }} rowSpan={1} colSpan={3}>Pesos</th>
									<th style={{ width: '25%' }} rowSpan={1} colSpan={3}>Euros BCV</th>
									<th style={{ width: '25%', verticalAlign: 'middle', fontSize: 'x-large' }} rowSpan={2} colSpan={3}>{dataComponent.totalClients ? 'Clientes ' + dataComponent.totalClients : ''}</th>
								</tr>
								<tr>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
								</tr>
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3} >Operador</th>
									<th rowSpan={1} colSpan={2} >Documento</th>
									<th rowSpan={1} colSpan={2}>Clientes al mayor</th>
									<th rowSpan={1} colSpan={2}>Clientes al detal</th>
									<th rowSpan={1} colSpan={3}>Total de clientes</th>
								</tr>
								{
									dataComponent.operatorsAmmount.map((operatorAmmounts) => {
										return <tr>
											<td rowSpan={1} colSpan={3}>{operatorAmmounts.operator ? operatorAmmounts.operator.firstName + ' ' + operatorAmmounts.operator.lastName : ''}</td>
											<td rowSpan={1} colSpan={2}>{operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}</td>
											<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalWholesaleClients ? operatorAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalRetailClients ? operatorAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											<td rowSpan={1} colSpan={3}><NumberFormat value={operatorAmmounts.totalClients ? operatorAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
										</tr>
									})
								}
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								{
									dataComponent.terminalAmmounts.map((terminalAmmount) => {
										return <TerminalRow terminalAmmount={terminalAmmount} valueDollar={dataComponent.valueDollar} key={terminalAmmount.terminal.code} />
									})
								}
								<tr>
									<th rowSpan={1} colSpan={6}>Total PDV</th>
									<td rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.pAmmount != null ? dataComponent.displayUsd.pAmmount : (dataComponent.pAmmount / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={6}>Total PDV según sistema</th>
									<td rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalPos != null ? dataComponent.displayUsd.virtualValues.totalPos : (dataComponent.virtualValues.totalPos / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>

								</tr>
								<tr>
									<th rowSpan={1} colSpan={6}>Diferencia</th>
									<td rowSpan={1} colSpan={6}><NumberFormat value={((dataComponent.displayUsd && dataComponent.displayUsd.pAmmount != null ? dataComponent.displayUsd.pAmmount : dataComponent.pAmmount / (dataComponent.valueDollar || 1)) - (dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalPos != null ? dataComponent.displayUsd.virtualValues.totalPos : dataComponent.virtualValues.totalPos / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={6}>Total por Transferencia</th>
									<td rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.tAmmount != null ? dataComponent.displayUsd.tAmmount : (dataComponent.tAmmount / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3}>Divisa</th>
									<th rowSpan={1} colSpan={3}>Total</th>
									<th rowSpan={1} colSpan={3}>Cambio</th>
									<th rowSpan={1} colSpan={3}>Equiv. USD</th>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3}>Efectivo</th>
									<td rowSpan={1} colSpan={3}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.ves != null ? dataComponent.displayUsd.ves : (dataComponent.ves / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
									<td rowSpan={1} colSpan={3}></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.ves != null ? dataComponent.displayUsd.ves : (dataComponent.ves / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3}>Dólares</th>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.dollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalDollarVes != null ? dataComponent.displayUsd.virtualValues.totalDollarVes : ((dataComponent.dollar * dataComponent.valueDollar) / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3}>Pesos</th>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.cop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'COP$ '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalCopVes != null ? dataComponent.displayUsd.virtualValues.totalCopVes : ((dataComponent.cop / (dataComponent.valueCop || 1)) / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<th rowSpan={1} colSpan={3}>Euros</th>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.eur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'€ '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={dataComponent.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalEurVes != null ? dataComponent.displayUsd.virtualValues.totalEurVes : ((dataComponent.eur * dataComponent.valueEur) / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								<tr style={{ height: '4rem', fontSize: 'x-large' }}>
									<th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}>INGRESOS TOTALES DE LA TIENDA REALES</th>
									<td style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.total != null ? dataComponent.displayUsd.total : (dataComponent.total / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr style={{ height: '4rem', fontSize: 'x-large' }}>
									<th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}>INGRESOS TOTALES POR SISTEMA</th>
									<td style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.virtualValues && dataComponent.displayUsd.virtualValues.totalAmountBox != null ? dataComponent.displayUsd.virtualValues.totalAmountBox : (dataComponent.virtualValues.totalAmountBox / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								<tr style={{ height: '4rem', fontSize: 'x-large' }}>
									<th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}>DIFERENCIA</th>
									<td style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={6}><NumberFormat value={(dataComponent.displayUsd && dataComponent.displayUsd.differential != null ? dataComponent.displayUsd.differential : (dataComponent.differential / (dataComponent.valueDollar || 1))).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
								</tr>
								{dataComponent.comment && <>
									<tr>
										<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
									</tr>
									<tr>
										<th rowSpan={1} colSpan={3}>Comentario</th>
										<td rowSpan={1} colSpan={9}>{dataComponent.comment}</td>
									</tr>
								</>
								}

								<tr>
									<td style={{ background: '#dddddd', height: "2rem" }} rowSpan={1} colSpan={12}></td>
								</tr>
								<tr style={{ height: '2rem', fontSize: 'large' }}>
									<th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada operador</th>
								</tr>
								<tr>
									<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
								</tr>
								{data.operatorsAmmount && <>
									<tr>
										<th rowSpan={1} colSpan={3} >Operador</th>
										<th rowSpan={1} colSpan={2} >Documento</th>
										<th rowSpan={1} colSpan={2}>Total Mayor</th>
										<th rowSpan={1} colSpan={2}>Total Detal</th>
										<th rowSpan={1} colSpan={3}>TOTAL</th>
									</tr>

									{data.operatorsAmmount.sort((a, b) => { return b.totalClients - a.totalClients }).map((operatorAmmounts) => {
										return <tr key={operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}>

											<td rowSpan={1} colSpan={3}>{operatorAmmounts.operator ? operatorAmmounts.operator.firstName + ' ' + operatorAmmounts.operator.lastName : ''}</td>
											<td rowSpan={1} colSpan={2}>{operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}</td>
											<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalWholesaleClients ? operatorAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalRetailClients ? operatorAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											<td rowSpan={1} colSpan={3}><NumberFormat value={operatorAmmounts.totalClients ? operatorAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
										</tr>
									})
									}
								</>
								}
								<tr style={{ height: '2rem', fontSize: 'small' }}>
									<th style={{ verticalAlign: 'middle', textAlign: "start", padding: "1rem" }} rowSpan={1} colSpan={12}> Nota: Debera cada operador conocer su numeros diariamente para que al finalizar la semana no tengan problemas con el ''ganador'' del bono y sea de conocimiento general el acumulado.</th>
								</tr>

							</tbody>
						</Table>
					</Col>
				</Row>
			</div>
			}
		</>
	)

	const TerminalRow = ({ terminalAmmount, valueDollar }) => {
		const vd = parseFloat(valueDollar) || 1;
		const du = (n) => (Number(n) / vd).toFixed(2);

		return <>
			<tr>
				<th style={{ verticalAlign: 'middle', fontSize: 'x-large' }} rowSpan={4} colSpan={6}>{terminalAmmount.terminal.code}</th>
				<th rowSpan={1} colSpan={2}>LOTE</th>
				<th rowSpan={1} colSpan={2}>TIPO</th>
				<th rowSpan={1} colSpan={2}>TOTAL</th>
			</tr>
			<tr>
				<td style={{ verticalAlign: 'middle', fontSize: 'x-large' }} rowSpan={3} colSpan={2}>{terminalAmmount.lote}</td>
				<th rowSpan={1} colSpan={2}>Debito impreso</th>
				<td rowSpan={1} colSpan={2}><NumberFormat value={du(terminalAmmount.debit)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
			</tr>
			<tr>
				<th rowSpan={1} colSpan={2}>Crédito impreso</th>
				<td rowSpan={1} colSpan={2}><NumberFormat value={du(terminalAmmount.credit)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
			</tr>
			<tr>
				<th rowSpan={1} colSpan={2}>Total impreso</th>
				<td rowSpan={1} colSpan={2}><NumberFormat value={du(terminalAmmount.total)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'US$ '} /></td>
			</tr>
			<tr>
				<td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
			</tr>
		</>

	}

	useEffect(() => {
		if (detailsToPrint) {
			setDataToPrint(detailsToPrint.result)
		}
	}, [detailsToPrint]);

	useEffect(() => {
		if (dataToPrint) {
			handlePrint();
		}
	}, [dataToPrint]);

	const fecha = new Date()
	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<div className="align-self-center">
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Formas de pago</h3>
							</div>
						</div>
						{/* Filtros */}
						<div className="filter">
							<div className="d-flex justify-content-between">
								<a href="#" onClick={e => { e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
									{(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5 || user.role == 7 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
										{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										<select className='form-control' name="agency"
											ref={register}>
											<option key="" name="" value="">Seleccione sucursal</option>
											{listAgencies && listAgencies.map(list =>
												<option
													key={list.id}
													name={list.id}
													value={list.id}>
													{`${list.name}`}
												</option>
											)}
										</select>
									</FormGroup>
									}
									{(user.role === 3) &&
										<FormGroup className="mr-3">
											<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={fecha}

												inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }}
												isValidDate={isValidDate}
											/>
										</FormGroup>
									}
									{(user.role !== 3) &&
										<FormGroup className="mr-3">
											<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}

												inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }}
												isValidDate={isValidDate}

											/>
										</FormGroup>
									}

									{(user.role !== 3) &&
										<FormGroup className="mr-3">
											<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
												inputProps={{ name: 'endDate', ref: register, placeholder: "Fecha final", autoComplete: "off" }}
												isValidDate={isValidDate}

											/>
										</FormGroup>
									}

									{(user.role !== 3) && (
										<FormGroup className="mr-3 mb-0 align-self-center">
											<div className="sumar-periodos-checkbox">
												<input
													className="sumar-periodos-input"
													name="mixData"
													id="mixData"
													type="checkbox"
													value={true}
													ref={register}
												/>
												<label className="sumar-periodos-label" htmlFor="mixData">
													Sumar periodos
												</label>
											</div>
										</FormGroup>
									)}
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<Row>
							<Col>
								<DataTable
									className="dataTables_wrapper"
									responsive
									striped
									highlightOnHover
									expandableRows
									expandableRowsComponent={<ExpandedComponent />}
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
									title="Ventas"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="No hay registros para mostrar"
									noHeader={true}
									columns={columns}
									data={data}
									pagination
									paginationServer
									paginationTotalRows={rowCount}
									onSort={handleSort}
									sortServer
									onChangeRowsPerPage={handlePerRowsChange}
									onChangePage={handlePageChange}
									persistTableHead
									theme={darkMode ? "dark" : "default"}
								/>
							</Col>
						</Row>
						{data && data.length > 0 && (user.role == 1 || user.role == 9 || user.role == 10) && ( <>
							<div className="d-flex flex-nowrap align-items-center mt-3 mb-2" style={{ gap: '0.5rem' }}>
								<Button
									className="btn btn-export-formas-pago"
									color="primary"
									onClick={(e) => {
										e.preventDefault();
										exportExcel();
									}}
									disabled={loadingExcel}
									style={{ minWidth: '180px' }}
								>
									<Icon icon={fileDownload} style={{ marginRight: 6, verticalAlign: 'middle' }} />
									<span>Exportar</span>
									{loadingExcel && <span className="spinner-border spinner-border-sm ml-2" style={{ verticalAlign: 'middle' }}></span>}
								</Button>
								<Button
									className="btn btn-export-formas-pago"
									color="primary"
									onClick={() => handleExport("transfer")}
									disabled={loadingExportTransfer || loadingExportPdv}
									style={{ minWidth: '180px' }}
								>
									<Icon icon={fileDownload} style={{ marginRight: 6, verticalAlign: 'middle' }} />
									<span>Exportar transferencias</span>
									{loadingExportTransfer && <span className="spinner-border spinner-border-sm ml-2" style={{ verticalAlign: 'middle' }}></span>}
								</Button>
								<Button
									className="btn btn-export-formas-pago"
									color="primary"
									onClick={() => handleExport("pdv")}
									disabled={loadingExportTransfer || loadingExportPdv}
									style={{ minWidth: '180px' }}
								>
									<Icon icon={fileDownload} style={{ marginRight: 6, verticalAlign: 'middle' }} />
									<span>Exportar puntos de venta</span>
									{loadingExportPdv && <span className="spinner-border spinner-border-sm ml-2" style={{ verticalAlign: 'middle' }}></span>}
								</Button>
							</div>
							<CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={exportConfig.headers} filename={exportConfig.filename} style={{ display: 'none' }} >
								Exportar
							</CSVLink>
						</>
						)}
						<Row xs="12">
							<Col><div className="pull-right">
								{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>}
								{general > 0 && <b>Total: <NumberFormat value={general.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>}
							</div>
							</Col>
						</Row>
						<Modal toggle={() => { clearModal() }} isOpen={modalVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Detalle
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
								onClick={() => { clearModal(); 
									setLoadingExportTransfer(false);
									setLoadingExportPdv(false);
									}}
								>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								{loadingDetail && <span className="spinner-border spinner-border-sm mr-1"></span>}
								{listDetail.length > 0 && <><div className="table-wrapper-scroll-y my-custom-scrollbar">
									{/* Tabla de monedas */}
									{(type == 1 || type == 2 || type == 3 || type == 7) && <><Table striped responsive>
										<thead>
											<tr>
												<th>Ticket</th>
												{filters.mixData ? <th>Fecha</th> : ''}	{/* Fecha en caso de que se muestre la data mezclada */}
												<th>Hora</th>
												{type === 7 ? '' : <th>Cantidad</th>}	{/* Para los bolivares no se toma en cuenta ni la cantidad inicial ni la tasa */}
												{type === 7 ? '' : <th>Tasa</th>}
												{type === 7 ? <th>Total</th> : <th>Sub Total</th>} {/* Para los bolivares  el Sub Total pasa a ser el Total */}
												<th>Tipo</th>
												<th>Comentario</th>
											</tr>
										</thead>
										<tbody>
											{listDetail.length > 0 && listDetail.map((detail, index) => {
												return (
													<tr key={index}>
														<td>{detail.order}</td>
														{filters.mixData ? <td>{moment(detail.createdDate).utc().format("YYYY-MM-DD")}</td> : ''}	{/* Fecha en caso de que se muestre la data mezclada */}
														<td>{moment(detail.createdDate).utc().format("hh:mm:ss a")}</td>
														{type === 7 ? '' : <td><NumberFormat value={(type == 1 && detail.dollar) ? (detail.dollar.toFixed(2)) : ((type == 2 && detail.eur) ? (detail.eur.toFixed(2)) : detail.cop.toFixed(2))} displayType={'text'} thousandSeparator={true} /></td>}
														{type === 7 ? '' : <td><NumberFormat value={(type == 1 && detail.valueDollar) ? (detail.valueDollar.toFixed(2)) : ((type == 2 && detail.valueEur) ? (detail.valueEur.toFixed(2)) : detail.valueCop.toFixed(2))} displayType={'text'} thousandSeparator={true} /></td>}
														<td><NumberFormat value={(detail.subTotalUsd != null ? detail.subTotalUsd : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'US$ '} /></td>
														<td>
															{
															detail.isSumation
																? detail.type === 7
																? 'Abono F'
																: detail.type === 11
																	? 'Abono V'
																	: 'Abono'
																: detail.isWholesale
																? detail.type === 6
																	? 'Mayor F'
																	: 'Mayor'
																: detail.type === 5
																	? 'Detal F'
																	: 'Detal'
															}

														</td>
														<td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
													</tr>
												)
											})
											}
										</tbody>
									</Table>
									</>
									}
									{/* Tabla de transferencias */}
									{type == 4 && <><Table striped responsive>
										<thead>
											<tr>
												<th>Ticket</th>
												<th>Monto</th>
												<th>Referencia</th>
												<th>Banco</th>
												<th>Tipo</th>
												<th>Comentario</th>
											</tr>
										</thead>
										<tbody>
											{listDetail.length > 0 && listDetail.filter((d) => isTransferBankAllowed(d.tBank)).map((detail, index) => {
												return (
													<tr key={index}>
														<td>{detail.order}</td>
														<td><NumberFormat value={(detail.tAmmount ?? 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'US$ '} /></td>
														<td>{detail.tReference}</td>
														<td>{normalizeTransferBankLabel(detail.tBank)}</td>
														<td>
															{
																detail.isSumation
																	? (detail.type === 7 ? 'Abono F' : 'Abono')
																	: detail.isWholesale
																	? (detail.type === 6 ? 'Mayor F' : 'Mayor')
																	: detail.type === 12
																		? 'Vale'
																		: detail.type === 12
																		? 'Vale'
																		: detail.type === 11
																		? 'Abono V'
																		: detail.type === 5
																			? 'Detal F'
																			: 'Detal'
															}
														</td>
														<td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
													</tr>
												)
											})
											}
										</tbody>
									</Table>
									</>
									}
									{/* Tabla de puntos de venta */}
									{((type == 5) || (type == 5.1) || (type == 5.2)) && <><Table striped responsive>
										<thead>
											<tr>
												<th>Ticket</th>
												<th>Monto</th>
												<th>Referencia</th>
												<th>Terminal</th>
												<th>Monto Extra</th>
												<th>Referencia Extra</th>
												<th>Sub Total</th>
												<th>Tipo</th>
												<th>Comentario</th>

											</tr>
										</thead>
										<tbody>
											{listDetail.length > 0 && listDetail.map((detail, index) => {
												return (
													<tr key={index}>
														<td>{detail.order}</td>
														<td><NumberFormat value={detail.pAmmount ? detail.pAmmount.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
														<td>{detail.pReference ? detail.pReference : ''}</td>
														<td>{detail.terminal ? detail.terminal.code : ''}</td>
														<td><NumberFormat value={detail.pAmmountExtra ? detail.pAmmountExtra.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
														<td>{detail.pReferenceExtra ? detail.pReferenceExtra : ''}</td>
														<td><NumberFormat value={(detail.subTotalUsd != null ? detail.subTotalUsd : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'US$ '} /></td>
														<td>
															{detail.type === 2
															? 'Mayor'
															: detail.type === 3
															? 'Abono'
															: detail.type === 4
															? 'Credito'
															: detail.type === 5
															? 'Detal F'
															: detail.type === 6
															? 'Mayor F'
															: detail.type === 7
															? 'Abono F'
															: detail.type === 8
															? 'Credito F'
															: detail.type === 10
															? 'Vale'
															
															: 'Detal'}
														</td>
														<td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
													</tr>
												)
											})
											}
										</tbody>
									</Table>
									</>
									}
									{/* Tabla de creditos */}
									{type == 6 && <><Table striped responsive>
										<thead>
											<tr>
												<th>Orden</th>
												<th>Nombre</th>
												<th>Monto</th>
											</tr>
										</thead>
										<tbody>
											{listDetail.length > 0 && listDetail.map((detail, index) => {
												return (
													<tr key={index}>
														<td>{detail.order}</td>
														<td>{detail.names}</td>
														<td><NumberFormat value={(detail.subTotalUsd != null ? detail.subTotalUsd : 0).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'US$ '} /></td>

													</tr>
												)
											})
											}
										</tbody>
									</Table>
									</>
									}
								</div>
									{totalDetail > 0 && <Row xs="12">
										{type == 5 && <Col>
											<div className="pull-left">
												<a href="#" onClick={e => { e.preventDefault(); exportDetailsExcel() }}>
													Exportar
												</a>
											</div>
											<div className="pull-left">
												<CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={headersPDV} filename={"PuntosDeVenta.csv"} style={{ display: 'none' }} >
													Exportar
												</CSVLink>
											</div>
										</Col>}
										{type == 4 && <Col>
											<div className="pull-left">
												<a href="#" onClick={e => { e.preventDefault(); exportDetailsExcel() }}>
													Exportar
												</a>
											</div>
											<div className="pull-left">
												<CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={headersTransfer} filename={"Transferencias.csv"} style={{ display: 'none' }} >
													Exportar
												</CSVLink>
											</div>
										</Col>}
										<Col><div className="pull-right"><b>Total: <NumberFormat value={(totalDetailUsd != null ? totalDetailUsd : (listDetail[0] && listDetail[0].valueDollar ? totalDetail / listDetail[0].valueDollar : totalDetail)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'US$ '} /></b> </div></Col>
									</Row>
									}
								</>
								}
							</div>
							<div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
								<Button color="secondary" type="button" onClick={() => { clearModal() 
									setLoadingExportTransfer(false);
									setLoadingExportPdv(false);
								}}>
									Cerrar
								</Button>
							</div>
						</Modal>
						<Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning} className={` ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Ventas
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
									onClick={() => { setModalWarning(false); setModalMsg('') }}
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
									onClick={() => { setModalWarning(false); setModalMsg('') }}
								>
									Cerrar
								</Button>
							</div>
						</Modal>
						<Modal toggle={() => { setModalConfirmClose(false); setPendingCloseData(null); }} isOpen={modalConfirmClose} backdrop="static" className={`${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="modalConfirmCloseLabel">
									Confirmar cierre
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
									onClick={() => { setModalConfirmClose(false); setPendingCloseData(null); }}
								>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<p>¿Está seguro del cierre? Una vez realizado ya no se podrá hacer ventas por ese día.</p>
							</div>
							<div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
								<Button
									color="secondary"
									type="button"
									onClick={() => { setModalConfirmClose(false); setPendingCloseData(null); }}
								>
									Cancelar
								</Button>
								<Button
									color="primary"
									type="button"
									onClick={doConfirmClose}
								>
									Aceptar
								</Button>
							</div>
						</Modal>
						<Modal toggle={() => { onCloseModal() }} isOpen={modalClose} backdrop="static" className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Cierre de formas de pago dia {dataToClose ? moment(dataToClose.date).utc().format("YYYY-MM-DD") : ''}
								</h5>
								<button aria-label="Close" className="close" type="button" onClick={() => { onCloseModal() }}>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								{alert.message &&
									<Alert color={`alert ${alert.type}`} isOpen={visible} fade={true}>
										<div className="container">
											{alert.message}
											<button
												type="button"
												className="close"
												aria-label="Close"
												onClick={onDismiss}
											>
												<span aria-hidden="true">
													<i className="now-ui-icons ui-1_simple-remove"></i>
												</span>
											</button>
										</div>
									</Alert>
								}
								<Form onSubmit={handleSubmitClose(onCreateData)} className="form">

									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label>Moneda</Label>
											</FormGroup>
											<FormGroup>
												<Label for="bsValue">
													<b>Efectivo Bs: <NumberFormat value={dataToClose ? dataToClose.totalVes.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
													{(dataToClose && dataToClose.totalVes) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(dataToClose.date, 7, dataToClose.agency._id) }}>
														Detalle
													</Button> : ''}
												</Label>
											</FormGroup>
										</Col>
										<Col md={4}>
											<FormGroup>
												<Label for="eur">Monto</Label>
												<Controller
													name="ves"
													control={controlClose}
													placeholder={"Ingrese los bolivares"}
													rules={{
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.eur ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.eur && <div className="invalid-feedback">{errorsClose.eur.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bsValue">
													<b>Dólar: $<NumberFormat value={dataToClose ? dataToClose.totalDollar.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
													{(dataToClose && dataToClose.totalDollar) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(dataToClose.date, 1, dataToClose.agency._id) }}>
														Detalle
													</Button> : ''}
												</Label>
											</FormGroup>
										</Col>
										<Col md={4}>
											<FormGroup>
												<Controller
													name="dollar"
													control={controlClose}
													placeholder={"Ingrese los dólares"}
													rules={{
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.dollar && <div className="invalid-feedback">{errorsClose.dollar.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bsValue">
													<b>Euros: <NumberFormat value={dataToClose ? dataToClose.totalEur.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
													{(dataToClose && dataToClose.totalEur) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(dataToClose.date, 2, dataToClose.agency._id) }}>
														Detalle
													</Button> : ''}
												</Label>
											</FormGroup>
										</Col>
										<Col md={4}>
											<FormGroup>
												<Controller
													name="eur"
													control={controlClose}
													placeholder={"Ingrese los euros"}
													rules={{
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.eur ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.eur && <div className="invalid-feedback">{errorsClose.eur.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bsValue">
													<b>Pesos: <NumberFormat value={dataToClose ? dataToClose.totalCop.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
													{(dataToClose && dataToClose.totalCop) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(dataToClose.date, 3, dataToClose.agency._id) }}>
														Detalle
													</Button> : ''}
												</Label>
											</FormGroup>
										</Col>
										<Col md={4}>
											<FormGroup>
												<Controller
													name="cop"
													control={controlClose}
													placeholder={"Ingrese los pesos"}
													rules={{
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.eur ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.eur && <div className="invalid-feedback">{errorsClose.eur.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label>
													<b>Descuentos por cupón: Bs <NumberFormat value={dataToClose && dataToClose.totalCouponDiscount != null ? dataToClose.totalCouponDiscount.toFixed(2) : '0.00'} displayType={'text'} thousandSeparator={true} /></b>
													{(dataToClose && (dataToClose.totalCouponDiscount || 0) > 0) ? (
														<Button className="btn-link" color="primary" onClick={() => { history.push('/historial-cupones' + (dataToClose.date ? '?date=' + moment(dataToClose.date).utc().format('YYYY-MM-DD') : '')); }}>
															Detalle
														</Button>
													) : ''}
												</Label>
											</FormGroup>
										</Col>
									</Row>
									<Row>
										<Col md={4}>
											<div className="modal-header" style={{ paddingLeft: '0' }}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Puntos de venta
												</h5>
											</div>
										</Col>
										<Col md={3} className={"px-0.5"}>
											<div className="modal-header" style={{ paddingLeft: '0' }}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Débito
												</h5>
											</div>
										</Col>
										<Col md={3} className={"px-0.5"}>
											<div className="modal-header" style={{ paddingLeft: '0' }}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Crédito
												</h5>
											</div>
										</Col>
										<Col md={2} className={"px-0.5"}>
											<div className="modal-header" style={{ paddingLeft: '0' }}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Lote
												</h5>
											</div>
										</Col>
									</Row>
									<div className="modal-body" style={{ paddingLeft: '0' }}>
										{fields && fields.map((field, index) => (
											<Row form key={field.terminalId}>
												<Col md={4}>
													<FormGroup>
														<Label for="bsValue">
															<b>{field.terminalName}</b>
														</Label>
													</FormGroup>
												</Col>
												<Col md={3}>
													<FormGroup>
														<Controller
															name={`terminalInputs.${field.terminalId}.debit`}
															control={controlClose}
															placeholder={"DÉBITO impreso"}
															defaultValue={0}
															rules={{
																min: {
																	value: 0,
																	message: "El monto es requerido"
																},
																required: "El monto es requerido",
															}}
															as={<NumberFormat className={'form-control' + (errorsClose.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
														/>
													</FormGroup>
												</Col>
												<Col md={3}>
													<FormGroup>
														<Controller
															name={`terminalInputs.${field.terminalId}.credit`}
															control={controlClose}
															placeholder={"CRÉDITO impreso"}
															defaultValue={0}
															rules={{
																min: {
																	value: 0,
																	message: "El monto es requerido"
																},
																required: "El monto es requerido",
															}}
															as={<NumberFormat className={'form-control' + (errorsClose.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
														/>
													</FormGroup>
												</Col>
												<Col md={2}>
													<FormGroup>
														<Controller
															name={`terminalInputs.${field.terminalId}.lote`}
															control={controlClose}
															placeholder={"Nro de lote"}
															defaultValue={0}
															rules={{
																min: {
																	value: 0,
																	message: "El lote es requerido"
																},
																required: "El lote es requerido",
															}}
															as={<NumberFormat className={'form-control' + (errorsClose.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
														/>
													</FormGroup>
												</Col>
											</Row>
										))}
									</div>
									<Row>
										<Col md={12}>
											<FormGroup>
												<Label for="comment">Comentario</Label>
												<input
													maxLength="200"
													autoComplete="off"
													placeholder='Ingrese un comentario (Opcional)'
													className={'form-control' + (errorsClose.comment ? ' is-invalid' : '')}
													name="comment"
													ref={registerClose}
												/>
												{errorsClose.comment && <div className="invalid-feedback">{errorsClose.comment.message}</div>}
											</FormGroup>
										</Col>
									</Row>

									<div className="d-flex justify-content-between">
										<Button color="primary" disabled={registeringData}>
											{registeringData && <span className="spinner-border spinner-border-sm mr-1"></span>}
											Confirmar cierre
										</Button>

										<Button color="secondary" type="button" onClick={() => { onCloseModal() }}>
											Cerrar
										</Button>
									</div>
								</Form>
							</div>
						</Modal>
					</div>
				</div>
			</div>
			{/* Componente para imprimir (está oculto) */}
			<div style={{ display: "none" }}>
				<ComponentToPrint dataComponent={dataToPrint} />
			</div>
		</>
	);
}

export default PaymentMethodsPage;