/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pendingPaymentsActions, userActions, alertActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, ModalHeader, ModalBody, ModalFooter, Badge, Label } from 'reactstrap';
import cashRegister from '@iconify/icons-fa-solid/cash-register';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { useRef } from 'react';
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import { useReactToPrint } from 'react-to-print';
import { CSVLink } from "react-csv";
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { pendingPaymentsService } from '../../services';

function PendingPaymentsPage() {

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
    const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();

	const dataPendingPayments = useSelector(state => state.pendingPayments.table);
    const loadingPage = useSelector(state => state.pendingPayments.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	// Total pendiente
	const [totalPending, setTotalPending] = useState(0);

	//Verificar data de redux
	useEffect(() => {

		if(dataPendingPayments && dataPendingPayments.results){

			setData(dataPendingPayments.results);
			setTotalPending(dataPendingPayments.totalPending)
		}
		
		if(dataPendingPayments && dataPendingPayments.metadata && dataPendingPayments.metadata[0]){
			setRowCount(dataPendingPayments.metadata[0].total);
		}
  	},[dataPendingPayments]);

	//obtener sucursales para select
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	},[]);

	const [listAgencies, setListAgencies] = useState(null);
	
	useEffect(() => {
		if(users.obtained){
			setListAgencies(users.list.agencies);
		}
	},[users.obtained]);
    
	
	const [rowCount, setRowCount] = useState(0)

	const [pendingEditOpen, setPendingEditOpen] = useState(false);
	const [pendingEditRow, setPendingEditRow] = useState(null);
	const [pendingEditForm, setPendingEditForm] = useState({
		names: '',
		businessName: '',
		document: '',
		documentType: '',
		phone: '',
		address: '',
		clientType: '',
		taxpayer: '',
		comment: '',
	});

	//Columnas Data table
	const columns = [
		
		{
			name: 'Status',
			selector: 'status',
			sortable: false,
			center: true,
			cell: row => {
				let label = '';
				let color = row.status ? 'success' : 'danger';

				if (row.type === 8) {
				label = row.status ? 'PAGO F' : 'PENDIENTE F';
				} else if (row.type === 4) {
				label = row.status ? 'PAGO' : 'PENDIENTE';
				} 

				return (
				<Badge color={color} pill className="h6 p-2 mt-1">
					{label}
				</Badge>
				);
			}
		},
		{
			name: 'Agencia',
			selector: 'agency.name',
			sortable: false,
			wrap: true,
		},
		{
			name: 'Cajero',
			selector: 'user.username',
			sortable: false,
			wrap: true,
		},
		{
			name: 'Orden',
			selector: 'order',
			sortable: true,
		},
		// {
		// 	name: 'Código',
		// 	selector: 'clientCode',
		// 	sortable: true,
		// },
		{
			name: 'Documento',
			selector: 'document',
			sortable: true,
			cell : (row)=>{
				return [row.documentType, row.document].filter(Boolean).join('-');
			},
		},
		{
			name: 'Nombre',
			selector: 'names',
			sortable: true,
			wrap: true,
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return row.total ? <NumberFormat value={row.total ? row.total.toFixed(2):row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={row.total ? '$ ': ''} /> : 0
			},
		},
		{
			name: 'Pendiente',
			selector: 'pending',
			sortable: true,
			cell : (row)=>{
				return row.pending ? <NumberFormat value={row.pending ? row.pending.toFixed(2):row.pending} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={row.pending ? '$ ': ''} /> : 0
			},
		},
		{
			name: 'Dias',
			selector: 'daysCounter',
			sortable: true,
		},
		
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true, 
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD");
			},
		},
		{
			name: 'Acciones',
			omit: user.role !== 1,
			width: '200px',
			cell: (row) => {
				const pendingAmt = Number(row.pending);
				const isSettled = Boolean(row.status) || (Number.isFinite(pendingAmt) && pendingAmt <= 0);
				if (isSettled) {
					return null;
				}
				return (
				<div className="d-flex flex-wrap" style={{ gap: '6px' }}>
					<Button
						color="primary"
						size="sm"
						outline
						title="Editar datos del cliente"
						onClick={() => {
							setPendingEditRow(row);
							setPendingEditForm({
								names: row.names || '',
								businessName: row.businessName || '',
								document: row.document || '',
								documentType: row.documentType || '',
								phone: row.phone || '',
								address: row.address || '',
								clientType: row.clientType || '',
								taxpayer: row.taxpayer || '',
								comment: row.comment || '',
							});
							setPendingEditOpen(true);
						}}
					>
						Editar
					</Button>
					<Button
						color="danger"
						size="sm"
						outline
						title="Eliminar crédito sin abonos (reintegra inventario)"
						onClick={async () => {
							const id = row.id || row._id;
							if (
								!window.confirm(
									`¿Eliminar la cuenta pendiente orden ${row.order}? Solo si no tiene abonos. Se borrará la venta de crédito y se reintegrará inventario.`
								)
							) {
								return;
							}
							try {
								await pendingPaymentsService.pendingPaymentsAdminDeleteUnpaid(id);
								dispatch(alertActions.success('Cuenta eliminada'));
								dispatch(
									pendingPaymentsActions.dataTable(
										getUserData(),
										1,
										perPageSelect == 0 ? perPage : perPageSelect,
										direction,
										filters ? filters : {}
									)
								);
							} catch (err) {
								dispatch(
									alertActions.error(
										typeof err === 'string' ? err : err.message || 'Error al eliminar'
									)
								);
							}
						}}
					>
						Eliminar
					</Button>
				</div>
				);
			},
		},
	];
  
	const headers = [
		{ label: "Fecha emitida", key: "createdDate" },
		{ label: "Fecha de pago", key: "paymentDate" },
		{ label: "Días pendiente", key: "daysCounter" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Número de orden", key: "order" },
		{ label: "Cliente", key: "names" },
		{ label: "Total", key: "total" },
		{ label: "Pendiente", key: "pending" },
		{ label: "Dolares", key: "dollar" },
		{ label: "Bs efectivo", key: "ves" },
		{ label: "Cop efectivo", key: "cop" },
		{ label: "Transferencia", key: "tAmmount" },
		{ label: "Monto PDV", key: "pAmmount" },
		{ label: "Tasa de cambio", key: "valueDollar" },
		{ label: "Status", key: "status" },
	
	];

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });

	const getDataTable = (page) => {
		dispatch(pendingPaymentsActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(pendingPaymentsActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(pendingPaymentsActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(pendingPaymentsActions.dataTable(getUserData(), page, newPerPage, direction, filters ? filters: {}));
	};
	
	const [filters, setFilters] = useState('');

	//Consultar al entrar
	useEffect(() => {
		setData([])
		getDataTable(1);
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//Consultar por filtros
	const onFilterData = (data, e) => {

		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate =  moment(data.endDate).isValid();

		if(data.endDate != "" && !validEndDate){
			setModalVisible(true);
            setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if(isafter){
			setModalVisible(true);
            setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');   // =1

		//Si el rango de fechas es superior a los seis días abrir modal
		if ( dateDiff > 100 ){
			setModalVisible(true);
            setModalMsg('El rango de fechas no puede superar los 15 días');
			return;
		}

		setFilters(data);
		setTotalPending(0)

		dispatch(pendingPaymentsActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();
	const agencyFilterWatch = watch('agency');
	useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const clearFilters = () =>{
		setStartDate(''); 
		setEndDate(''); 
		reset({order:'', documentClient:'', startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
		<div className="mt-4"><b></b></div>
		<Table striped responsive>
			<thead>
				<tr>
					<th>Producto</th>
					<th>Precio ($)</th>
					<th>Peso (kg)</th>
					<th>Total ($)</th>
				</tr>
			</thead>
			<tbody>
			{data.products && data.products.map((product, index) => {
				return (
					<tr key={index}>
						<td>{product.name}</td>
						<td><NumberFormat value={product.wholesalePrice.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '}  /></td>
						<td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={product.totalDollars.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '}  /></td>
					</tr>
					)
				})
			}

			</tbody>
    	</Table>
		<div className="mb-2"><b>Total pagado</b></div>
		<Table striped responsive>
			<thead>
				<tr>
					<th>Bs Efectivo</th>
					<th>$ Dólares</th>
					<th>€ Euros</th>
					<th>$ Pesos</th>
					<th>Transferencia</th>
					<th>Punto de venta</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><NumberFormat value={ data.ves ? data.ves.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.ves ? 'Bs ' : ''} /></td>
					<td><NumberFormat value={ data.dollar ? data.dollar.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.dollar ? '$ ' : ''} /></td>
					<td><NumberFormat value={ data.eur ? data.eur.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.cop ? data.cop.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.tAmmount ? data.tAmmount.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.tAmmount ? 'Bs ' : ''} /></td>
					<td><NumberFormat value={ data.pAmmount ? data.pAmmount.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.pAmmount ? 'Bs ' : ''} /></td>
				</tr>
			</tbody>
    	</Table>

		{ 
			!!data.payments.length && <div className="mb-2 mt-2"><b>Pagos realizados</b></div>
		}
		{
			data.payments.map((payment) => {

				return(
					<Table bordered striped responsive>
						<thead>
							<tr style={{backgroundColor: '#fffec8'}}>
								<th style={{width: "20%"}}>Fecha: {'  ' + moment(payment.createdDate).utc().format("YYYY-MM-DD")}</th>
								<th style={{width: "20%"}}>Hora: {'  ' + moment(payment.createdDate).utc().format("hh:mm:ss a")}</th>
								<th style={{width: "20%"}}>Tasa BCV: Bs. { payment.valueDollar ? payment.valueDollar.toFixed(2) : 0 }</th>
								<th style={{width: "20%"}}></th>
								<th style={{width: "20%"}}></th>
							</tr>
						</thead>
						{
							(payment.ves || payment.dollar || payment.eur || payment.cop) &&  
								<>
									<thead>
										<tr>
											<th><strong>Efectivo</strong></th>
											{payment.ves ? <th style={{width: "20%"}}>Bs Efectivo</th> : <th style={{width: "20%"}}></th>}
											{payment.dollar ? <th style={{width: "20%"}}>$ Dólares</th> : <th style={{width: "20%"}}></th>}
											{payment.eur ? <th style={{width: "20%"}}>€ Euros</th> : <th style={{width: "20%"}}></th>}
											{payment.cop ? <th style={{width: "20%"}}>$ Pesos</th> : <th style={{width: "20%"}}></th>}
										</tr>
									</thead>
									<tbody>
										<tr>
											<td></td>
											<td><NumberFormat value={ payment.ves ? payment.ves.toFixed(2):''} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={payment.ves ? 'Bs ' : ''} /></td>
											<td><NumberFormat value={ payment.dollar ? payment.dollar.toFixed(2):''} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={payment.dollar ? '$ ' : ''} /></td>
											<td>{payment.eur}</td>
											<td>{payment.cop}</td>
										</tr>
									</tbody>
								</>
						}
						{
							!!(payment.vesChange || payment.dollarChange || payment.eurChange || payment.copChange) &&  
								<>
									<thead>
										<tr>
											<th><strong>Cambio</strong></th>
											{payment.vesChange ? <th style={{width: "20%"}}>Bs Efectivo</th> : <th style={{width: "20%"}}></th>}
											{payment.dollarChange ? <th style={{width: "20%"}}>$ Dólares</th> : <th style={{width: "20%"}}></th>}
											{payment.eurChange ? <th style={{width: "20%"}}>€ Euros</th> : <th style={{width: "20%"}}></th>}
											{payment.copChange ? <th style={{width: "20%"}}>$ Pesos</th> : <th style={{width: "20%"}}></th>}
										</tr>
									</thead>
									<tbody>
										<tr>
											<td></td>
											<td>{payment.vesChange ? payment.vesChange : ''}</td>
											<td>{payment.dollarChange ? payment.dollarChange : ''}</td>
											<td>{payment.eurChange ? payment.eurChange : ''}</td>
											<td>{payment.copChange ? payment.copChange : ''}</td>
										</tr>
									</tbody>
								</>
								
						}
						{
							payment.tAmmount &&  
								<>
									<thead>
										<tr>
											<td></td>
											<th>Transferencia</th>
											<th>Banco</th>
											<th>Referencia</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td></td>
											<td><NumberFormat value={payment.tAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
											<td>{payment.tBank}</td>
											<td>{payment.tReference}</td>
										</tr>
									</tbody>
								</>
								
						}
						{
							payment.pAmmount &&
								<>
									<thead>
										<tr>
											<td></td>
											<th>Monto por punto</th>
											<th>Referencia</th>
											<th>Punto de venta</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td></td>
											<td><NumberFormat value={ payment.pAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
											<td>{payment.pReference}</td>
											<td>{payment.terminal.code}</td>
										</tr>
									</tbody>
								</>
						}
						{
							payment.pAmmountExtra && 
								<>
									<thead>
										<tr>
											<td></td>
											<th>Monto por punto</th>
											<th>Referencia</th>
											<th>Punto de venta</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td></td>
											<td><NumberFormat value={payment.pAmmountExtra.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
											<td>{payment.pReferenceExtra}</td>
											<td>{payment.terminalExtra}</td>
										</tr>
									</tbody>
								</>
						}
						
					</Table>
				)
			})
		}
		
			
		{ !dataToPrint &&  <div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '50px', marginBottom: '50px'}}>
					<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
						<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
					</Button>
				</div>
		}
		
		<div className="mb-4 mt-2"><b></b></div>
		</>
	);


	/** PARA IMPRIMIR **/
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef(); 

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: 'Orden N° ' + (dataToPrint ? dataToPrint.order : ''),
		onAfterPrint: () => setDataToPrint(null),
		//pageStyle: "@page{margin: 20mm;	}"
		pageStyle: "@media print { @page {margin: 0mm;} body {padding: 20mm !important;}}"
	})

	const ComponentToPrint = ({ data }) => (
		 <>
			{ data && <div ref={printRef} > 
				
				<div className="align-self-center">
					<h2 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '10mm'}}>Orden N° {data.order}</h2>
				</div>
				<Table striped responsive>
					<thead>
						<tr>
							<th>Status</th>
							<th>Agencia</th>
							<th>Orden</th>
							<th>Documento</th>
							<th>Nombre</th>
							<th>Total</th>
							<th>Pendiente</th>
							<th>Fecha de registro</th>
							<th>Dias</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<Badge color={data.status ? "success" : "danger"}  pill className="h6 p-2 mt-1">
									{
										data.status ? "PAGO" : "PENDIENTE"
									}
								</Badge>
							</td>
							<td>{data.agency ? data.agency.name : ''}</td>
							<td>{data.order ? data.order : ''}</td>
							<td>{[data.documentType, data.document].filter(Boolean).join('-')}</td>
							<td>{data.names ? data.names : ''}</td>
							<td>{data.total ? <NumberFormat value={data.total ? data.total.toFixed(2):data.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.total ? '$ ': ''} /> : ''}</td>
							<td>{data.pending ? <NumberFormat value={data.pending ? data.pending.toFixed(2):data.pending} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.pending ? '$ ': ''} /> : ''}</td>
							<td>{moment(data.createdDate).utc().format("YYYY-MM-DD HH:mm")}</td>
							<td>{data.daysCounter ? data.daysCounter : ''}</td>
						</tr>
					</tbody>
				</Table>
				<ExpandedComponent data={data} />
				<div className="align-self-right">
					<p style={{ fontWeight:'bold', fontSize: 'small', fontStyle: 'italic', position: 'fixed', bottom: "20mm", width: "88%"}}>
						NOTA: Esto es un recibo virtual y no posee validéz fiscal. Los datos no deben ser usados para realizar retenciones de impuestos
						por lo que solo debe tomar el monto para calcular su cotización, y una vez pagado podrá solicitar su factura fiscal
					</p>
				</div>
			</div>
			}
		</>
	)

	useEffect(() => {
		if (dataToPrint){
			handlePrint();
		}
	}, [dataToPrint]);
	
	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(pendingPaymentsActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'Cuentasporcobrar.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuentas por cobrar');

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

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(excel && excel.results){

			// Se una copia de los detalles para que estos no sean los modificados
			let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

			//Se modifican los datos antes de la descarga en excel
			 fixedData.forEach((item) => {

			 	item.pending = item.pending?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
			 							.replace(".", ',')||0;  // se cambia la coma por punto

			    item.tAmmount = item.tAmmount?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
			 							.replace(".", ',')||0;  // se cambia la coma por punto

				item.pAmmount = item.pAmmount?.toString()
				.replace(/\,/g, '')  // se eliminan las comas
			 	.replace(".", ',')||0;  // se cambia la coma por punto

															
				
				item.dollar = item.dollar?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
									.replace(".", ',')||0;   // se cambia la coma por punto
				
				item.ves = item.ves?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
									.replace(".", ',')||0;   // se cambia la coma por punto
				

				item.cop = item.cop?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
									.replace(".", ',')||0;   // se cambia la coma por punto
				

				item.valueDollar = item.valueDollar?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
									.replace(".", ',')||0;   // se cambia la coma por punto
				

				item.total = item.total?.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',')||0;  // se cambia la coma por punto
				
				item.paymentDate = moment(item.paymentDate).utc().format("YYYY-MM-DD")
				item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD");
			})

			setDataExcel(fixedData);
		}
	},[excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted);
			setDataExcel([]);
		}
	}, [dataExcel]);
	
	/*** Exportar ***/

	const conditionalRowStyles = [
		{
		  when: row => row.pending === 0,
		  style: {
			backgroundColor: 'rgba(144, 238, 144, 0.5)', // Verde
		  },
		},
		{
		  when: row => (row.pending > 0 && row.daysCounter >= 7 && row.daysCounter <= 13),
		  style: {
			backgroundColor: 'rgba(255, 255, 102, 0.5)', // Amarillo
		  },
		},
		{
		  when: row =>(row.pending > 0 && row.daysCounter >= 14),
		  style: {
			backgroundColor: 'rgba(255, 99, 71, 0.5)', // Rojo
		  },
		},
	  ];
	  
    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Cuentas por cobrar</h3>
							</div>
							{ user.role !== 10 && (
								<div className="d-flex align-items-center">
									<span style={{fontWeight:'bold', marginRight:8}}>
										Añadir
									</span>
									<Button id="add" onClick={()=>history.push('/credit-payment')} className="btn-round btn-icon" color="primary">
										<i className="fa fa-plus" />
									</Button>
								</div>
							)}
						</div>
						{/* Filtros */}
						<div className="filter">
							<div className="d-flex justify-content-between">
								<a href="#" onClick={e => {e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault();  clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}	
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{marginTop:15}}>
									<Col>
										<Row>
											<FormGroup className="mr-3">
												<select 
													className='form-control' 
													name="agency"
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
											
											<FormGroup className="mr-3">
												<input
													className="form-control"
													placeholder="N° de Orden"
													type="number"
													name="order"
													min="1"
													ref={register}
												></input>
											</FormGroup>
											{/* <FormGroup className="mr-3">
												<input
													className="form-control"
													name="clientCode"
													placeholder="Código del cliente"
													type="number"
													ref={register}
												></input>
											</FormGroup> */}
											<FormGroup className="mr-3">
												<input
													className="form-control"
													name="documentClient"
													placeholder="Documento"
													type="number"
													ref={register}
												></input>
											</FormGroup>
											<FormGroup className="mr-3">
												<label>
													<input 
														className="form-check-input"
														name="unpaid"
														id="unpaid" 
														type="checkbox" 
														value={true}
														ref={register}/> PENDIENTES
												</label>
											</FormGroup>
											<FormGroup className="mr-3">
												<label>
													<input 
														className="form-check-input"
														name="paid"
														id="paid" 
														type="checkbox" 
														value={true}
														ref={register}/> PAGADOS
												</label>
											</FormGroup>

											{ user.role === 2  && (
												<>
											<FormGroup className="mr-3">
												<label>
													<input 
														className="form-check-input"
														name="unpaidF"
														id="unpaidF" 
														type="checkbox" 
														value={true}
														ref={register}/> PENDIENTES F
												</label>
											</FormGroup>
											<FormGroup className="mr-3">
												<label>
													<input 
														className="form-check-input"
														name="paidF"
														id="paidF" 
														type="checkbox" 
														value={true}
														ref={register}/> PAGADOS F
												</label>
											</FormGroup>
											</>
											)}
										</Row>
										<Row>
											<FormGroup className="mr-3">
												<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
													inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
												/>
											</FormGroup>
											<FormGroup className="mr-3">
												<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
													inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
												/>
											</FormGroup>
											<Button color="primary" type="submit" disabled={loadingPage}>
												{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
											</Button>
										</Row>
									</Col>
								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						{
							(((user.role != 4) && ((user.role == 3) && (filters.agency == user.agency.id))) || (user.role == 1) || (user.role == 2)  || (user.role == 5) )  &&  
								<>
									<div className="align-self-right">
											<h4 style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '100px'}}>Total pendiente: ${totalPending ? totalPending.toFixed(2) : 0}</h4>
									</div>
								</>
						}
						<Row>
							<Col>
							<DataTable
								className="dataTables_wrapper"
								responsive
								highlightOnHover
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
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
								conditionalRowStyles={conditionalRowStyles}
							/>
							</Col>
						</Row>
						<Modal isOpen={pendingEditOpen} toggle={() => setPendingEditOpen(false)} size="lg">
							<ModalHeader toggle={() => setPendingEditOpen(false)}>
								Editar cuenta pendiente (orden {pendingEditRow ? pendingEditRow.order : ''})
							</ModalHeader>
							<ModalBody>
								<p className="text-muted small">
									Corrección de datos de cliente. No modifica montos, productos ni abonos.
								</p>
								<FormGroup>
									<Label>Nombres</Label>
									<input
										className="form-control"
										value={pendingEditForm.names}
										onChange={(e) =>
											setPendingEditForm((f) => ({ ...f, names: e.target.value }))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Razón social</Label>
									<input
										className="form-control"
										value={pendingEditForm.businessName}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												businessName: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Tipo doc.</Label>
									<input
										className="form-control"
										value={pendingEditForm.documentType}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												documentType: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Documento</Label>
									<input
										className="form-control"
										value={pendingEditForm.document}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												document: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Teléfono</Label>
									<input
										className="form-control"
										value={pendingEditForm.phone}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												phone: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Dirección</Label>
									<input
										className="form-control"
										value={pendingEditForm.address}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												address: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Tipo cliente</Label>
									<input
										className="form-control"
										value={pendingEditForm.clientType}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												clientType: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Contribuyente</Label>
									<input
										className="form-control"
										value={pendingEditForm.taxpayer}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												taxpayer: e.target.value,
											}))
										}
									/>
								</FormGroup>
								<FormGroup>
									<Label>Comentario</Label>
									<input
										className="form-control"
										value={pendingEditForm.comment}
										onChange={(e) =>
											setPendingEditForm((f) => ({
												...f,
												comment: e.target.value,
											}))
										}
									/>
								</FormGroup>
							</ModalBody>
							<ModalFooter>
								<Button color="secondary" onClick={() => setPendingEditOpen(false)}>
									Cancelar
								</Button>
								<Button
									color="primary"
									onClick={async () => {
										if (!pendingEditRow) return;
										const id = pendingEditRow.id || pendingEditRow._id;
										try {
											await pendingPaymentsService.pendingPaymentsAdminUpdate(
												id,
												pendingEditForm
											);
											dispatch(alertActions.success('Cuenta actualizada'));
											setPendingEditOpen(false);
											dispatch(
												pendingPaymentsActions.dataTable(
													getUserData(),
													1,
													perPageSelect == 0 ? perPage : perPageSelect,
													direction,
													filters ? filters : {}
												)
											);
										} catch (err) {
											dispatch(
												alertActions.error(
													typeof err === 'string'
														? err
														: err.message || 'Error al guardar'
												)
											);
										}
									}}
								>
									Guardar
								</Button>
							</ModalFooter>
						</Modal>
						{data && data.length > 0 && (
                            <Button
                                className="btn"
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    exportExcel();
                                }}
                                disabled={loadingExcel}
                            >
                                <Icon icon={fileDownload} /> Exportar{" "}
                                {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                        )}
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible} className={` ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ventas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
                                Cerrar
                            </Button>
                            </div>
                        </Modal>
					</div>
				</div>
            </div>
			{/* Componente para imprimir (está oculto) */}
			<div style={{ display: "none" }}>
				<ComponentToPrint data={dataToPrint}/>
			</div>
        </>
    );
}

export default PendingPaymentsPage;