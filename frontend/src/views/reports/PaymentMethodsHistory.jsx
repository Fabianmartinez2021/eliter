/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup, Table, ButtonGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useReactToPrint } from 'react-to-print';

import * as XLSX from 'xlsx';
import excelIcon from '@iconify/icons-mdi/file-excel';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function PaymentMethodsHistory() {

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

	const dataTable = useSelector(state => state.sales.table);
    const loadingPage = useSelector(state => state.sales.loading);

	//Verificar data de redux
	useEffect(() => {

		if(dataTable && dataTable.resultsStores && dataTable.resultsGeneral){

			setDataStores(dataTable.resultsStores);
			setDataGeneral(dataTable.resultsGeneral);
		}
		if(dataTable && dataTable.metadata && dataTable.metadata[0]){
			setRowCount(dataTable.metadata[0].total);
		}
  	},[dataTable]);
    
	// Inicializar tabla sin data
	const [dataStores, setDataStores] = useState([]);
	const [dataGeneral, setDataGeneral] = useState([]);
	console.log('dataGeneral', dataGeneral);
	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
        {
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
        },
		{
			name: 'Usuario',
			selector: 'row.user.username',
			sortable: true,
			cell : (row)=>{
				return  (row.user ? row.user.username : '')
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.total ? row.total.toFixed(2) : row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Fecha',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
			},
		},
		{
			name: '',
			selector: 'date',
			sortable: true,
			cell : (row)=>{
				return <>
					<div className="d-flex justify-content-end align-items-center" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
						<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(row)}} style={{
                			marginRight: '5px',
                			width: '100px', 
                			padding: '10px 10px', 
              			}}>
							<Icon icon={pdfIcon} /> PDF{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
						</Button>
						<Button
							color="primary"
							disabled={loadingPage}
							onClick={() => {
								exportToExcel(row); 
							}}
							style={{
								width: '100px', 
								padding: '10px 0px', 
							  }} 
							>
							<Icon icon={excelIcon} /> Excel{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>}
            			</Button>
					</div>
				</>			
			},
		},
	];

	const headers = [
		{ label: "Fecha", key: "createdDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Divisa", key: "coinDescription" },
		{ label: "Usuario", key: "user.username" },
		{ label: "Motivo", key: "typeDescription" },
		{ label: "Ticket", key: "order" },
		{ label: "Ingresos", key: "in" },
		{ label: "Egresos", key: "out" },
		{ label: "Total", key: "total" },
		{ label: "Comentario", key: "comment" }
	];

	//Consultar al entrar
	useEffect(() => {
		getDataTable(1);
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

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
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(true);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
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

	const [filters, setFilters] = useState('');

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
		reset({agency:'', startDate:'', endDate:'', code:''})
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate =  moment(data.endDate).isValid();

		if(data.endDate != "" && !validEndDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if(isafter){
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');

		//Si el rango de fechas es superior a los seis días abrir modal
		if ( dateDiff > 60 ){
			setModalWarning(true);
			setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(salesActions.salesPaymentMethodsHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, data, true));
	}

	const excel = useSelector(state => state.download.excel);
	
	const loadingExcel = useSelector(state => state.download.loading);

	// // Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	useEffect(() => {
		if (excel && excel.results) {
		  // Se hace una copia de los resultados para modificarlos
		  let fixedData = excel.results.map(item => Object.assign({}, item));
	  
		  // Se modifica la data antes de la descarga
		  fixedData.forEach(item => {
			item.in = item.in.toString()
			  .replace(/\,/g, '')  // Eliminar comas
			  .replace(".", ',');  // Cambiar el punto por coma
			
			item.out = item.out.toString()
			  .replace(/\,/g, '')
			  .replace(".", ',');
	  
			item.total = item.total.toString()
			  .replace(/\,/g, '')
			  .replace(".", ',');
	  
			item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
		  });
		  // Se actualiza el estado con los datos corregidos
		  setDataExcel(fixedData);
		}
	  }, [excel]); // Observamos cambios en 'excel'
	  
	useEffect(() => {
		if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
			setTimeout(() => {
				refExcel.current.link.click();
				setDataExcel([]);
			});
		}
	},[dataExcel]);
	
	/*** Exportar ***/
	
	// Estado para saber cuál reporte se va a buscar 
	const [reportToSearch, setReportToSearch] = useState(1);



	//Data al expandir una fila en el reporte POR TIENDAS 
	const ExpandedComponentStoreReport = ({ data, buttonStatus = true }) => (
		<Row>
			<Col md="12" sm="12" lg="12">
			{loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
			<Table responsive hover bordered size="sm">
				<tbody style={{textAlign:'center', color: "black"}}>
					<tr style={{height:'7rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Cierre del dia {moment(data.date).format('dddd')} {moment(data.date).format('LL')} <br></br> {data.agency.name}</th>
					</tr>
					<tr style={{height: "0"}}>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3} >Dólar BCV</th>
						<th rowSpan={1} colSpan={3}>Pesos</th>
						<th rowSpan={1} colSpan={3}>Euros BCV</th>
						<th style={{verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={2} colSpan={3}>{data.totalClients ? 'Clientes ' + data.totalClients : ''}</th>
					</tr>
					<tr>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{
						data.terminalAmmounts.map((terminalAmmount) => {
							return <TerminalRowStoreReport terminalAmmount={terminalAmmount} buttonStatus={buttonStatus} key={terminalAmmount.terminal.code} />
						})
					}
					<tr>
						<th rowSpan={1} colSpan={6}>Total PDV</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.pAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Total PDV según sistema</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.virtualValues.totalPos.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>

					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Diferencia</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={(data.pAmmount-data.virtualValues.totalPos).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Total por Transferencia</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.tAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Divisa</th>
						<th rowSpan={1} colSpan={3}>Total</th>
						<th rowSpan={1} colSpan={3}>Cambio</th>
						<th rowSpan={1} colSpan={3}>Total en bolivares</th>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Efectivo</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Dólares</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.dollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.dollar * data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Pesos</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.cop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'COP$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.cop / data.valueCop).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Euros</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.eur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'€ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.eur * data.valueEur).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES DE LA TIENDA REALES</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES POR SISTEMA</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.virtualValues.totalAmountBox.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>DIFERENCIA</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.differential.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					{data.comment && <>
							<tr>
								<td style={{  background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
							</tr>
							<tr>
								<th rowSpan={1} colSpan={3}>Comentario</th>
								<td rowSpan={1} colSpan={9}>{data.comment}</td>
							</tr>
						</>
					}
					<tr>
						<td style={{background: '#dddddd', height: "2rem"}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada operador</th>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{	data.operatorsAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={3} >Operador</th>
								<th rowSpan={1} colSpan={2} >Documento</th>
								<th rowSpan={1} colSpan={2}>Total Mayor</th>
								<th rowSpan={1} colSpan={2}>Total Detal</th>
								<th rowSpan={1} colSpan={3}>TOTAL</th>
							</tr>
					
							{	data.operatorsAmmount.sort((a, b) => {return b.totalClients - a.totalClients}).map((operatorAmmounts) => {
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
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada operador deberá conocer su numeros diariamente para que al finalizar la semana no tengan problemas con el ''ganador'' del bono y sea de conocimiento general el acumulado.</th>
					</tr>	
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada CAJERO</th>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{	data.cashiersAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={3} >Cajero</th>
								<th rowSpan={1} colSpan={2} >Usuario</th>
								<th rowSpan={1} colSpan={2}>Total Mayor</th>
								<th rowSpan={1} colSpan={2}>Total Detal</th>
								<th rowSpan={1} colSpan={3}>TOTAL</th>
							</tr>
							{	data.cashiersAmmount.sort((a, b) => {return b.totalClients - a.totalClients}).map((cashierAmmounts) => {
								return <tr key={cashierAmmounts.user ? cashierAmmounts.user.username : ''}>
								
									<td rowSpan={1} colSpan={3}>{cashierAmmounts.user ? cashierAmmounts.user.firstName + ' ' + cashierAmmounts.user.lastName : ''}</td>
									<td rowSpan={1} colSpan={2}>{cashierAmmounts.user ? cashierAmmounts.user.username : ''}</td>
									<td rowSpan={1} colSpan={2}><NumberFormat value={cashierAmmounts.totalWholesaleClients ? cashierAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
									<td rowSpan={1} colSpan={2}><NumberFormat value={cashierAmmounts.totalRetailClients ? cashierAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
									<td rowSpan={1} colSpan={3}><NumberFormat value={cashierAmmounts.totalClients ? cashierAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								</tr>
								})
							}	
						</>
					}
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada 	CAJERO deberá conocer su numeros diariamente para que al finalizar la semana sea de conocimiento general el acumulado.</th>
					</tr>	
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>
								<div className="d-flex justify-content-center flex-row align-items-center" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> PDF{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									</Button>
									<Button color="primary" disabled={loadingPage} onClick={() => {exportToExcel(data)}}>
										<Icon icon={excelIcon} /> Excel{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									</Button>
									<Button color="primary" disabled={loadingPage} onClick={() => {exportTerminalsToExcel(data)}}>
										<Icon icon={excelIcon} /> Puntos de venta{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									</Button>
								</div>
							</td>
						</tr>
					}
				</tbody>
			</Table>
			</Col>
		</Row>
	);

	const TerminalRowStoreReport = ({ terminalAmmount, buttonStatus }) => {

		return 	<>
					{ (!!terminalAmmount.total || buttonStatus) && <>
							<tr>
								<th style={{verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={4} colSpan={6}>{terminalAmmount.terminal.code}</th>
								<th rowSpan={1} colSpan={2}>LOTE</th>
								<th rowSpan={1} colSpan={2}>TIPO</th>
								<th rowSpan={1} colSpan={2}>TOTAL</th>
							</tr>
							<tr>
								<td style={{verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={3} colSpan={2}>{terminalAmmount.lote}</td>
								<th rowSpan={1} colSpan={2}>Debito impreso</th>
								<td rowSpan={1} colSpan={2}><NumberFormat value={terminalAmmount.debit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
							</tr>
							<tr>
								<th rowSpan={1} colSpan={2}>Crédito impreso</th>
								<td rowSpan={1} colSpan={2}><NumberFormat value={terminalAmmount.credit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
							</tr>
							<tr>
								<th rowSpan={1} colSpan={2}>Total impreso</th>
								<td rowSpan={1} colSpan={2}><NumberFormat value={terminalAmmount.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
							</tr>
							<tr>
								<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
							</tr>
						</>
					}
				</>

	}

	//Data al expandir una fila en el reporte GENERAL 
	const ExpandedComponentGeneralReport = ({ data, buttonStatus = true }) => {
		
		const _defaultAgencyWatch = watch('agency');
		
		useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);

		
		return(
		<Row>
			<Col md="12" sm="12" lg="12">
			{loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
			<Table responsive hover bordered size="sm">
				<tbody style={{textAlign:'center', color: "black"}}>
					<tr style={{height:'7rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Cierre del dia {moment(data.date).format('dddd')} {moment(data.date).format('LL')} <br></br> {data.agency.name}</th>
					</tr>
					<tr style={{height: "0"}}>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
					</tr>
					<tr>
						<th style={{width: '25%'}} rowSpan={1} colSpan={3} >Dólar BCV</th>
						<th style={{width: '25%'}} rowSpan={1} colSpan={3}>Pesos</th>
						<th style={{width: '25%'}} rowSpan={1} colSpan={3}>Euros BCV</th>
						<th style={{width: '25%', verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={2} colSpan={3}>{data.totalClients ? 'Clientes ' + data.totalClients : ''}</th>
					</tr>
					<tr>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{
						data.terminalAmmounts.map((terminalAmmount) => {
							return <TerminalRowGeneralReport terminalAmmount={terminalAmmount} key={terminalAmmount.terminal.code} />
						})
					}
					<tr>
						<th rowSpan={1} colSpan={6}>Total PDV</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.pAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Total PDV según sistema</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.virtualValues.totalPos.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Diferencia</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={(data.pAmmount-data.virtualValues.totalPos).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Total por Transferencia</th>
						<td rowSpan={1} colSpan={6}><NumberFormat value={data.tAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Divisa</th>
						<th rowSpan={1} colSpan={3}>Total</th>
						<th rowSpan={1} colSpan={3}>Cambio</th>
						<th rowSpan={1} colSpan={3}>Total en bolivares</th>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Efectivo</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Dólares</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.dollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.dollar * data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Pesos</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.cop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'COP$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.cop / data.valueCop).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Euros</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.eur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'€ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.valueEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.eur * data.valueEur).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES DE LA TIENDA REALES </th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES POR SISTEMA</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.virtualValues.totalAmountBox.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>DIFERENCIA</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}><NumberFormat value={data.differential.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					{data.comment && <>
							<tr>
								<td style={{  background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
							</tr>
							<tr>
								<th rowSpan={1} colSpan={3}>Comentario</th>
								<td rowSpan={1} colSpan={9}>{data.comment}</td>
							</tr>
						</>
					}
					<tr>
						<td style={{background: '#dddddd', height: "2rem"}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada operador</th>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{
						data.operatorsAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={2} >Agencia</th>
								<th rowSpan={1} colSpan={2} >Operador</th>
								<th rowSpan={1} colSpan={2} >Documento</th>
								<th rowSpan={1} colSpan={2}>Clientes al Mayor</th>
								<th rowSpan={1} colSpan={2}>Clientes al Detal</th>
								<th rowSpan={1} colSpan={2}>Total de Clientes</th>
							</tr>
							{	listAgencies.map((agency) => {

									let operatorsList = data.operatorsAmmount.filter((operator) => agency.id == operator.agency._id)

									if (operatorsList.length === 0)
										return 

									return 	operatorsList.sort((a, b) => {return b.totalClients - a.totalClients}).map((operatorAmmounts, index) => {

											return <tr key={operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}>
												{ index == 0 ? <td style={{verticalAlign: 'middle'}}  rowSpan={operatorsList.length} colSpan={2}>{operatorAmmounts.agency ? operatorAmmounts.agency.name : ''}</td> : null}
												<td rowSpan={1} colSpan={2}>{operatorAmmounts.operator ? operatorAmmounts.operator.firstName + ' ' + operatorAmmounts.operator.lastName : ''}</td>
												<td rowSpan={1} colSpan={2}>{operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}</td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalWholesaleClients ? operatorAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalRetailClients ? operatorAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalClients ? operatorAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											</tr>
										})
								})
							}
						</>
					}
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada operador conocer su numeros diariamente para que al finalizar la semana no tengan problemas con el ''ganador'' del bono y sea de conocimiento general el acumulado.</th>
					</tr>	
					<tr>
						<td style={{background: '#dddddd', height: "2rem"}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada CAJERO</th>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					{
						data.operatorsAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={2} >Agencia</th>
								<th rowSpan={1} colSpan={2} >Cajero</th>
								<th rowSpan={1} colSpan={2} >Usuario</th>
								<th rowSpan={1} colSpan={2}>Clientes al Mayor</th>
								<th rowSpan={1} colSpan={2}>Clientes al Detal</th>
								<th rowSpan={1} colSpan={2}>Total de Clientes</th>
							</tr>
							{	data.cashiersAmmount && listAgencies.map((agency) => {

									let cashiersList = data.cashiersAmmount.filter((cashier) => agency.id == cashier.agency._id)

									if (cashiersList.length === 0)
										return 

									return 	cashiersList.sort((a, b) => {return b.totalClients - a.totalClients}).map((cashiersAmmounts, index) => {

											return <tr key={cashiersAmmounts.operator ? cashiersAmmounts.operator.username : ''}>
												{ index == 0 ? <td style={{verticalAlign: 'middle'}}  rowSpan={cashiersList.length} colSpan={2}>{cashiersAmmounts.agency ? cashiersAmmounts.agency.name : ''}</td> : null}
												<td rowSpan={1} colSpan={2}>{cashiersAmmounts.user ? cashiersAmmounts.user.firstName + ' ' + cashiersAmmounts.user.lastName : ''}</td>
												<td rowSpan={1} colSpan={2}>{cashiersAmmounts.user ? cashiersAmmounts.user.username : ''}</td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={cashiersAmmounts.totalWholesaleClients ? cashiersAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={cashiersAmmounts.totalRetailClients ? cashiersAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
												<td rowSpan={1} colSpan={2}><NumberFormat value={cashiersAmmounts.totalClients ? cashiersAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
											</tr>
										})
								})
							}
						</>
					}
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada cajero deberá conocer su numeros diariamente para que al finalizar la semana sea de conocimiento general el acumulado.</th>
					</tr>	
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>
								<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> PDF {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									</Button>
									<Button color="primary" disabled={loadingPage} onClick={() => {exportToExcel(data)}}>
										<Icon icon={excelIcon} /> Excel{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									</Button>
									
								</div>
							</td>
						</tr>
					}	
				</tbody>
			</Table>
			</Col>
		</Row>
	)};

	const TerminalRowGeneralReport = ({ terminalAmmount }) => {


		return 	<>
					<tr>
						<th style={{verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={5} colSpan={6}>{terminalAmmount.terminal.code}</th>
						<th rowSpan={1} colSpan={3}>Debito PDV</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={terminalAmmount.debit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Crédito PDV</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={terminalAmmount.credit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Total PDV</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={terminalAmmount.totalPDV.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Total por transferencia</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={terminalAmmount.transfer.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>TOTAL</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={terminalAmmount.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
				</>

	}
	
	/** PARA EXPORTAR **/
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef(); 

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: (dataToPrint ? dataToPrint.agency.name : '') + ' ' + (dataToPrint ? moment(dataToPrint.date).utc().format("YYYY-MM-DD") : ''),
		onAfterPrint: () => setDataToPrint(null),
		pageStyle: "@page{margin: 20mm;	}"
	})

	const ComponentToPrint = ({ data }) => (
		 <>
			{ data && <div ref={printRef} > 
				{reportToSearch === 1 ?
					<ExpandedComponentStoreReport data={data} buttonStatus={false} /> : <ExpandedComponentGeneralReport data={data} buttonStatus={false} />
				}
			</div>
			}
		</>
	)

	useEffect(() => {
		if (dataToPrint){
			handlePrint();
		}
	}, [dataToPrint]); 	  

	const exportToExcel = (data) => {

		

		if (!data) {
			console.error("No hay datos para exportar.");
			return;
		}
	
		// Asegurarse de que 'details', 'terminalAmmounts' y 'operatorsAmmount' sean arrays
		const detailsArray = Array.isArray(data.details) ? data.details : [];
		const terminalsArray = Array.isArray(data.terminalAmmounts) ? data.terminalAmmounts : [];
		const operatorsArray = Array.isArray(data.operatorsAmmount) ? data.operatorsAmmount : [];
		const cashiersArray = Array.isArray(data.cashiersAmmount) ? data.cashiersAmmount : [];
			
		// Preparar los datos para la hoja de cálculo en formato vertical
		const exportData = [
			['Nombre de la Agencia', data.agency?.name || 'N/A'],
			['Fecha', moment(data.date).utc().format("YYYY-MM-DD")],
			[''],
			['Ítem', 'Descripción', 'Cantidad', 'Precio'],
			...detailsArray.map((detail, index) => ([
				index + 1,
				detail.description || 'N/A',
				detail.quantity || 0,
				detail.price ? detail.price.toFixed(2).replace(".", ',') : '0,00',
			])),
			[''],
			['Banco','Descripcion','Terminal', 'Total'],
			...terminalsArray.map((terminal) => {
				if (terminal.hasOwnProperty('banka') && terminal.hasOwnProperty('descriptione') && terminal.hasOwnProperty('terminale')) {
					return [
						terminal.banka || 'N/A',
						terminal.descriptione || 'N/A',
						terminal.terminale || 'N/A',
						terminal.total ? terminal.total.toFixed(2).replace(".", ',') : 'Bs 0,00',
					];
				} else {
					return [
						terminal.terminal?.bank || 'N/A',
						terminal.terminal?.description || 'N/A',
						terminal.terminal?.code || 'N/A',
						terminal.total ? terminal.total.toFixed(2).replace(".", ',') : 'Bs 0,00',
					];
				}
        	}),
			[''],
			['Total PDV', data.virtualValues?.totalPos ? data.virtualValues.totalPos.toFixed(2).replace(".", ',') : '0,00'],
			['Total PDV según sistema', data.virtualValues?.totalPos ? data.virtualValues.totalPos.toFixed(2).replace(".", ',') : '0,00'],
			['Diferencia', data.virtualValues?.totalAmountBox && data.virtualValues?.totalPos ? (data.virtualValues.totalAmountBox - data.virtualValues.totalPos).toFixed(2).replace(".", ',') : '0,00'],
			['Total por Transferencia', data.virtualValues?.totalTransfer ? data.virtualValues.totalTransfer.toFixed(2).replace(".", ',') : '0,00'],
			['Total en bolívares', data.virtualValues?.totalAmountBox ? data.virtualValues.totalAmountBox.toFixed(2).replace(".", ',') : '0,00'],
			['Diferencia', data.virtualValues?.totalAmountBox && data.virtualValues?.totalAmount ? (data.virtualValues.totalAmountBox - data.virtualValues.totalAmount).toFixed(2).replace(".", ',') : '0,00'],
			[''],
			['Operador', 'Documento', 'Total Mayor', 'Total Detal', 'TOTAL'],
			...operatorsArray.map((operator) => ([
				`${operator.operator?.firstName || ''} ${operator.operator?.lastName || ''}`,
				operator.operator?.document || 'N/A',
				operator.totalWholesaleClients || 0,
				operator.totalRetailClients || 0,
				operator.totalClients || 0,
			])),
			[''],
			['Cajero', 'Usuario', 'Total Mayor', 'Total Detal', 'TOTAL'],
			...cashiersArray.map((cashier) => ([
				`${cashier.user?.firstName || ''} ${cashier.user?.lastName || ''}`,
				cashier.user?.username || 'N/A',
				cashier.totalWholesaleClients || 0,
				cashier.totalRetailClients || 0,
				cashier.totalClients || 0,
			]))
		];
	
		// Crear una hoja de trabajo (worksheet)
		const ws = XLSX.utils.aoa_to_sheet(exportData);
	
		// Crear un libro de trabajo (workbook)
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
	
		// Guardar el archivo Excel
		XLSX.writeFile(wb, `${data.agency?.name || 'Reporte'}_${moment(data.date).utc().format("YYYY-MM-DD")}.xlsx`);
	};

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

	const exportTerminalsToExcel = (data) => {
	if (!data) {
		console.error("No hay datos para exportar.");
		return;
	}

	const agencyName = data.agency?.name || "N/A";
	const date = moment(data.date).utc().format("YYYY-MM-DD");
	const terminalsArray = Array.isArray(data.terminalAmmounts) ? data.terminalAmmounts : [];

	// Ordenar: primero los que terminan con "PERSONAL"
	const sortedTerminals = [...terminalsArray].sort((a, b) => {
		const descA = a.terminal?.description || a.descriptione || "";
		const descB = b.terminal?.description || b.descriptione || "";
		const endsA = descA.trim().toUpperCase().endsWith("PERSONAL");
		const endsB = descB.trim().toUpperCase().endsWith("PERSONAL");
		if (endsA && !endsB) return -1;
		if (!endsA && endsB) return 1;
		return 0;
	});

	// Definir headers
	const headers = [
		{ label: "Fecha", key: "date" },
		{ label: "Sucursal", key: "agency" },
		{ label: "Banco", key: "terminal.bank" },
		{ label: "Descripción", key: "terminal.description" },
		{ label: "Código Terminal", key: "terminal.code" },
		{ label: "Total", key: "total" },
	];

	// Mapear con valores numéricos reales
	const mappedData = mapDataWithHeaders(
		sortedTerminals.map((t) => ({
			...t,
			date,
			agency: agencyName,
		})),
		headers
	);

	// Crear hoja con objetos (Excel reconoce los números)
	const ws = XLSX.utils.json_to_sheet(mappedData, { header: headers.map(h => h.label) });
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Terminales");

	XLSX.writeFile(wb, `Terminales_${agencyName}_${date}.xlsx`);
};

	
    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de formas de pago</h3>
							</div>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
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
									<ButtonGroup className="mr-5">
										{/* <Button
											color="primary"
											outline={reportToSearch !== 1}
											onClick={() => setReportToSearch(1)}
											active={reportToSearch === 1}
											>
											Reporte por tiendas
										</Button> */}
										<Button
											color="primary"
											outline={reportToSearch !== 2}
											disabled={user.role == 3}
											onClick={() =>  setReportToSearch(2)}
											active={reportToSearch === 1} 
											>
											Reporte general
										</Button>
									</ButtonGroup>
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<Row>
							<Col style={reportToSearch === 1 ? {} : {display: "none"}}>
							
							{/* REPORTE POR TIENDAS */}
							<DataTable
								className="dataTables_wrapper"
								responsive
								striped
								highlightOnHover
								expandableRows
								expandableRowDisabled={row => row.disabled}
								expandableRowsComponent={<ExpandedComponentStoreReport />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Reporte de inventarios"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={dataStores}
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
						<Row>
							<Col style={reportToSearch === 2 ? {} : {display: "none"}}>
							
							{/* REPORTE GENERAL */}
							<DataTable
								className="dataTables_wrapper"
								responsive
								striped
								highlightOnHover
								expandableRows
								expandableRowDisabled={row => row.disabled}
								expandableRowsComponent={<ExpandedComponentGeneralReport />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Reporte de inventarios"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={dataGeneral}
								pagination
								//paginationServer
								//paginationTotalRows={rowCount}
								//onSort={handleSort}
								//sortServer
								//onChangeRowsPerPage={handlePerRowsChange}
								//onChangePage={handlePageChange}
								persistTableHead
								theme={darkMode ? "dark" : "default"}
							/>
							</Col>
						</Row>
						{ user.role !== 6 && dataStores && dataStores.length > 0 && <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel} style={{display:'none'}}> 
								<Icon icon={fileDownload} /> Exportar Excel {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"HistorialDeCaja.csv"}  style={{display:'none'}}>
										Exportar Excel
									</CSVLink>
								</>
							}
							</>	
						}
						{/* Modal de notificaciones */}
						<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={` ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
							<h5 className="modal-title" id="examplemodalMsgLabel">
								Ventas
							</h5>
							<button
								aria-label="Close"
								className="close"
								type="button"
								onClick={() =>  {setModalWarning(false); setModalMsg('')}}
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
								onClick={() =>  {setModalWarning(false); setModalMsg('')}}
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

export default PaymentMethodsHistory;