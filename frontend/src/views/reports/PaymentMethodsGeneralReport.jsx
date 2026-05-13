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
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function PaymentMethodsGeneralReportPage() {

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
	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
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
			selector: 'date',
			sortable: true,
			cell : (row)=>{
				return moment(row.date).utc().format("YYYY-MM-DD");
			},
		},
		{
			name: '',
			selector: 'date',
			sortable: true,
			cell : (row)=>{
				return <>
					<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
						<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(row)}}>
							<Icon icon={pdfIcon} /> Exportar PDF{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
						</Button>
					</div>
				</>			
			},
		},
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
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(salesActions.salesPaymentMethodsGeneralReportHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}

	const excel = useSelector(state => state.download.excel );
	
	const loadingExcel = useSelector(state => state.download.loading);
	

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	useEffect(() => {

    // Usar resultsGeneral o resultsStores dependiendo de la lógica de tu aplicación
    const dataToProcess = excel?.resultsGeneral?.length > 0 ? excel.resultsGeneral : excel?.resultsStores;
    
    if (dataToProcess) {
        // Encabezados principales
        const mainHeaders = [
            "Fecha",
            "BCV",
            "COP",
            "Euros BCV",
            "Clientes",
            "Total en punto de venta",
            "Total en transferencia",
            "Efectivo total"
        ];

        // Encabezados para bankAmmounts
        const bankAmmountsHeaders = [
            "Cuenta",
            "Banco",
            "Código",
            "Crédito",
            "Comisión Crédito",
            "Débito",
            "Comisión Débito",
            "Total",
            // "Total PDV",
			// "Comision PDV",
            "Total PDV Real",
            "Transferencia"
        ];

        // Datos principales
        const exportData = dataToProcess.map(item => [
            moment(item.date).utc().format("YYYY-MM-DD"),
            item.valueDollar.toString().replace(/\,/g, '').replace(".", ','),
            item.valueCop.toString().replace(/\,/g, '').replace(".", ','),
            item.valueEur.toString().replace(/\,/g, '').replace(".", ','),
            item.totalClients,
            item.pAmmountReal.toString().replace(/\,/g, '').replace(".", ','),
            item.tAmmount.toString().replace(/\,/g, '').replace(".", ','),
            item.ves.toString().replace(/\,/g, '').replace(".", ',')
        ]);

        // Datos de bankAmmounts
        const bankAmmountsData = dataToProcess.flatMap(item => 
            item.bankAmmounts.map(ammount => ([
                ammount.account,
                ammount.bank,
                ammount.code,
                ammount.credit.toString().replace(/\,/g, '').replace(".", ','),
                ammount.creditCommission.toString().replace(/\,/g, '').replace(".", ','),
                ammount.debit.toString().replace(/\,/g, '').replace(".", ','),
                ammount.debitCommission.toString().replace(/\,/g, '').replace(".", ','),
                ammount.total.toString().replace(/\,/g, '').replace(".", ','),
                // ammount.totalPDV.toString().replace(/\,/g, '').replace(".", ','),
				// ammount.debitCommission.toString().replace(/\,/g, '').replace(".", ','),
                ammount.totalRealPDV.toString().replace(/\,/g, '').replace(".", ','),
                ammount.transfer.toString().replace(/\,/g, '').replace(".", ',')
            ]))
        );

        // Prepara los datos para exportar
        const fullExportData = [
            mainHeaders,       
            ...exportData,      
            [],                 
            bankAmmountsHeaders, 
            ...bankAmmountsData,
			[],
			// Resúmenes
            [
                'Total Efectivo',
                dataToProcess.reduce((sum, item) => sum + item.ves, 0).toFixed(2).replace(".", ','), 
            ],
            [
                'Total Dólares',
                dataToProcess.reduce((sum, item) => sum + item.dollar, 0).toFixed(2).replace(".", ',') 
            ],
            [
                'Total Pesos',
                (dataToProcess.reduce((sum, item) => sum + item.cop, 0)).toFixed(2).replace(".", ',') 
            ],
            [
                'Total Euros',
                dataToProcess.reduce((sum, item) => sum + item.eur, 0).toFixed(2).replace(".", ',') 
            ],
            [],
            [
                'Ingreso totales reales',
                dataToProcess.reduce((sum, item) => sum + item.total, 0).toFixed(2).replace(".", ','), 
            ]
        ];
        setDataExcel(fullExportData);
    } else {
        // console.log('No se encontraron datos para procesar.');
    }
}, [excel]);


	useEffect(() => {
		if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
			setTimeout(() => {
				refExcel.current.link.click();
				setDataExcel([]);
			},100);
		}
	},[dataExcel]);
	
	/*** Exportar ***/
	
	// Estado para saber cuál reporte se va a buscar 
	const [reportToSearch, setReportToSearch] = useState(2);

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
							return <TerminalRowStoreReport terminalAmmount={terminalAmmount} key={terminalAmmount.terminal.code} />
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
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES DE LA TIENDA</th>
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
					
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>
								<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> Exportar PDF {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
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

	const TerminalRowStoreReport = ({ terminalAmmount }) => {

		return 	<>
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

	//Data al expandir una fila en el reporte GENERAL 
	const ExpandedComponentGeneralReport = ({ data, buttonStatus = true }) => (
		<Row>
			<Col md="12" sm="12" lg="12">
			{loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
			<Table responsive hover bordered size="sm">
				<tbody style={{textAlign:'center', color: "black"}}>
					<tr style={{height:'7rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Cierre del dia {moment(data.date).format('dddd')} {moment(data.date).format('LL')} <br></br> {data.title}</th>
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
						data.bankAmmounts.map((bankAmmount) => {
							return <BankRowGeneralReport bankAmmount={bankAmmount} valueDollar={data.valueDollar} key={bankAmmount.code} />
						})
					}
					<tr>
						<th rowSpan={1} colSpan={6}>Totales en punto de venta</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.pAmmountReal.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.pAmmountReal / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={6}>Totales por Transferencia</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.tAmmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.tAmmount / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Divisa</th>
						<th rowSpan={1} colSpan={3}>Total</th>
						<th rowSpan={1} colSpan={3}>Total en bolivares</th>
						<th rowSpan={1} colSpan={3}>Total en dólares</th>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Efectivo</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.ves.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.ves / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Dólares</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.dollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.dollar * data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.dollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Pesos</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.cop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'COP$ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.cop / data.valueCop).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.cop / data.valueCop / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={3}>Euros</th>
						<td rowSpan={1} colSpan={3}><NumberFormat value={data.eur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'€ '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.eur * data.valueEur).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={3}><NumberFormat value={(data.eur * data.valueEur / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>INGRESOS TOTALES REALES</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={data.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={(data.total / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr><td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td></tr>

					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>TOTAL DE BS EN MERCANCIA (TIENDAS)</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={data.finalInventory.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={(data.finalInventory / data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>

					<tr><td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td></tr>

					<tr style={{height:'4rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={6}>TOTAL DE CUENTAS POR COBRAR (TIENDAS)</th>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={(data.totalPending * data.valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={3}><NumberFormat value={data.totalPending.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>

					<tr>
						<td style={{background: '#dddddd', height: "2rem"}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada OPERADOR</th>
					</tr>
					<tr style={{height: "0"}}>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
						<th style={{width: '8.33%', background: '#dddddd'}} rowSpan={1} colSpan={1} ></th>
					</tr>
					{
						data.operatorsAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={1} >Agencia</th>
								<th rowSpan={1} colSpan={2} >Operador</th>
								<th rowSpan={1} colSpan={1} >Documento</th>
								<th rowSpan={1} colSpan={1}>Clientes al Mayor</th>
								<th rowSpan={1} colSpan={1}>Total</th>
								<th rowSpan={1} colSpan={1}>Clientes al Detal</th>
								<th rowSpan={1} colSpan={2}>Total</th>
								<th rowSpan={1} colSpan={1}>Total de Clientes</th>
								<th rowSpan={1} colSpan={2}>Total</th>
							</tr>
							
							{	listAgencies.map((agency) => {

									let operatorsList = data.operatorsAmmount.filter((operator) => agency.id == operator.agency._id)

									if (operatorsList.length === 0)
										return 

									return 	<>{	operatorsList.sort((a, b) => {return b.totalClients - a.totalClients}).map((operatorAmmounts, index) => {

													return <tr key={operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}>
														{ index == 0 ? <td style={{verticalAlign: 'middle'}}  rowSpan={operatorsList.length} colSpan={1}>{operatorAmmounts.agency ? operatorAmmounts.agency.name : ''}</td> : null}
														<td rowSpan={1} colSpan={2}>{operatorAmmounts.operator ? operatorAmmounts.operator.firstName + ' ' + operatorAmmounts.operator.lastName : ''}</td>
														<td rowSpan={1} colSpan={1}>{operatorAmmounts.operator ? operatorAmmounts.operator.document : ''}</td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={operatorAmmounts.totalWholesaleClients ? operatorAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={operatorAmmounts.totalWholesales ? operatorAmmounts.totalWholesales.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={operatorAmmounts.totalRetailClients ? operatorAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.totalRetail ? operatorAmmounts.totalRetail.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={operatorAmmounts.totalClients ? operatorAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={2}><NumberFormat value={operatorAmmounts.total ? operatorAmmounts.total.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
													</tr>
												})}
											<tr>
												<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
											</tr>
										</>
								})
							}
						</>
					}
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada OPERADOR conocer su numeros diariamente para que al finalizar la semana no tengan problemas con el ''ganador'' del bono y sea de conocimiento general el acumulado.</th>
					</tr>		
					<tr>
						<td style={{background: '#dddddd', height: "2rem"}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr style={{height:'2rem', fontSize: 'large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Resumen de clientes atendidos por cada CAJERO</th>
					</tr>
					
					{
						data.cashiersAmmount && <>
							<tr>
								<th rowSpan={1} colSpan={1} >Agencia</th>
								<th rowSpan={1} colSpan={2} >Cajero</th>
								<th rowSpan={1} colSpan={1} >Usuario</th>
								<th rowSpan={1} colSpan={1}>Clientes al Mayor</th>
								<th rowSpan={1} colSpan={1}>Total</th>
								<th rowSpan={1} colSpan={1}>Clientes al Detal</th>
								<th rowSpan={1} colSpan={2}>Total</th>
								<th rowSpan={1} colSpan={1}>Total de Clientes</th>
								<th rowSpan={1} colSpan={2}>Total</th>
							</tr>
							
							{	listAgencies.map((agency) => {

									let cashiersList = data.cashiersAmmount.filter((cashier) => agency.id == cashier.agency._id)

									if (cashiersList.length === 0)
										return 

									return 	<>{	cashiersList.sort((a, b) => {return b.totalClients - a.totalClients}).map((cashierAmmounts, index) => {

													return <tr key={cashierAmmounts.user ? cashierAmmounts.user.username : ''}>
														{ index == 0 ? <td style={{verticalAlign: 'middle'}}  rowSpan={cashiersList.length} colSpan={1}>{cashierAmmounts.agency ? cashierAmmounts.agency.name : ''}</td> : null}
														<td rowSpan={1} colSpan={2}>{cashierAmmounts.user ? cashierAmmounts.user.firstName + ' ' + cashierAmmounts.user.lastName : ''}</td>
														<td rowSpan={1} colSpan={1}>{cashierAmmounts.user ? cashierAmmounts.user.username : ''}</td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={cashierAmmounts.totalWholesaleClients ? cashierAmmounts.totalWholesaleClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={cashierAmmounts.totalWholesales ? cashierAmmounts.totalWholesales.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={cashierAmmounts.totalRetailClients ? cashierAmmounts.totalRetailClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={2}><NumberFormat value={cashierAmmounts.totalRetail ? cashierAmmounts.totalRetail.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
														<td rowSpan={1} colSpan={1}><NumberFormat value={cashierAmmounts.totalClients ? cashierAmmounts.totalClients : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
														<td rowSpan={1} colSpan={2}><NumberFormat value={cashierAmmounts.total ? cashierAmmounts.total.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '}/></td>
													</tr>
												})}
											<tr>
												<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
											</tr>
										</>
								})
							}
						</>
					}
					<tr style={{height:'2rem', fontSize: 'small'}}>
						<th style={{verticalAlign: 'middle', textAlign: "start", padding: "1rem"}} rowSpan={1} colSpan={12}> Nota: Debera cada CAJERO conocer su numeros diariamente para que al finalizar la semana sea de conocimiento general el acumulado.</th>
					</tr>
					
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>
								<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> Exportar PDF {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
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

	const BankRowGeneralReport = ({ bankAmmount, valueDollar }) => {

		return 	<>
					<tr>
						<th style={{verticalAlign: 'middle', fontSize: 'x-large'}} rowSpan={8} colSpan={6}>{bankAmmount.code}</th>
						<th rowSpan={1} colSpan={2}>Debito</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.debit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.debit / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Comisión por Débito</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.debitCommission.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.debitCommission / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Crédito</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.credit.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.credit / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Comisión por crédito</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.creditCommission.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.creditCommission / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Total con comisión</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.totalPDV.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.totalPDV / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Total sin comisión</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.totalRealPDV.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.totalRealPDV / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>Total por transferencia</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.transfer.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.transfer / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2}>TOTAL</th>
						<td rowSpan={1} colSpan={2}><NumberFormat value={bankAmmount.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
						<td rowSpan={1} colSpan={2}><NumberFormat value={(bankAmmount.total / valueDollar).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} /></td>
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
		documentTitle: 'Cierre general ' + (dataToPrint ? moment(dataToPrint.date).utc().format("YYYY-MM-DD") : '') + (watch("mixData") ? " Sumatoria" : ""),
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
	


    const _defaultAgencyWatch = watch('agency');
	


    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);

	


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte general de formas de pago</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5 || user.role == 10) && <FormGroup className="mr-3">
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
										<Datetime 
											timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
										/>
									</FormGroup>
									{/* <FormGroup className="mr-3">
										<Button
											color="primary"
											name="mixData"
											outline={!watch("mixData")}
											onClick={() =>  setValue("mixData", watch("mixData") ? "" : true)}
											active={true}
											innerRef={register}
											style={{fontWeight: "bold"}}
											>
											SUMAR PERIODOS
										</Button>
									</FormGroup> */}
									{/* <ButtonGroup className="mr-5">
										<Button
											color="primary"
											outline={reportToSearch !== 2}
											onClick={() =>  setReportToSearch(2)}
											active={reportToSearch === 1}
											>
											Reporte general
										</Button>
										<Button
											color="primary"
											disabled= {true}
											outline={reportToSearch !== 1}
											onClick={() => setReportToSearch(1)}
											active={reportToSearch === 1}
											>
											Reporte por tiendas
										</Button>
									</ButtonGroup> */}
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
						{ dataStores && dataStores.length > 0 && <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel}> 
								<Icon icon={fileDownload} /> Exportar Excel {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} filename={"ReporteGeneral.csv"}  style={{display:'none'}}>
										Exportar
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

export default PaymentMethodsGeneralReportPage;