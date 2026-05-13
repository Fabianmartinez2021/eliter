/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { orderActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Badge, Label, Alert, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup, Table, ButtonGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm, Controller  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useReactToPrint } from 'react-to-print';
import { Role } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OrderHistoryPage() {

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

	const dataTable = useSelector(state => state.order.table);
    const loadingPage = useSelector(state => state.order.loading);

	//Verificar data de redux
	useEffect(() => {

		if(dataTable && dataTable.results){

			setDataStores(dataTable.results);
			setDataGeneral(dataTable.resultsTotal);
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
			name: 'Status',
			selector: 'isModification',
			sortable: true,
			center:true,
			cell: row => {
				return <>
						<Badge 
								color={row.isModification ? "info" : "success"}  
								pill className="h6 p-2 mt-1">
									{
										row.isModification ? "ANEXO" : "ORDEN"
									}
						</Badge>
					</>
			} 
		},
        {
			name: 'Orden',
			selector: 'order',
			sortable: true,
        },
        {
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
        },
		{
			name: 'Usuario',
			selector: 'row.user',
			sortable: true,
			wrap:true,
			cell : (row)=>{
				return  (row.user ? row.user.firstName + ' ' + row.user.lastName : '')
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
			name: 'Status',
			selector: 'wasConfirmed',
			sortable: false,
			center:true,
			cell: row => {
				return <>
						<Badge 
								color={row.wasConfirmed ? "success" : "danger"}  
								pill className="h6 p-2 mt-1">
									{
										row.wasConfirmed ? "CONFIRMADO" : "PENDIENTE"
									}
						</Badge>
					</>
			} 
		},
		{
			name: '',
			selector: 'date',
			center:true,
			omit: ((user.role !== 1) && (user.role !== 2)),
			cell : (row)=>{
				if(row.wasConfirmed === false){
					return <>
						<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
							<Button color="primary" disabled={loadingOrder} onClick={() => {setOrderProducts(row.products); setOrderToConfirm(row); setModalOrderOpen(true)}}>
								<i className="fas fa-pencil-alt"></i> {loadingOrder && <span className="spinner-border spinner-border-sm mr-1"></span>} 
							</Button>
						</div>
					</>	
				}		
			},
		},
		{
			name: '',
			selector: 'date',
			center:true,
			omit: ((user.role !== 1) && (user.role !== 2)),
			cell : (row)=>{
				if(row.wasConfirmed === false){
					return <>
						<div className="align-self-left" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
							<Button color="primary" disabled={loadingOrder} onClick={() => {setOrderToConfirm(row); setModalMsg(true)}}>
							<i className="fas fa-thumbs-up"></i> {loadingOrder && <span className="spinner-border spinner-border-sm mr-1"></span>} 
							</Button>
						</div>
					</>			
				}
			},
		},
		{
			name: 'Usuario que confirmó',
			selector: 'row.confirmationUser',
			sortable: true,
			cell : (row)=>{
				return  (row.confirmationUser ? row.confirmationUser.firstName + ' ' + row.confirmationUser.lastName : '')
			},
		},
		{
			name: 'Fecha de confirmación',
			selector: 'updatedDate',
			sortable: true,
			cell : (row)=>{
				return (row.updatedDate ? moment(row.updatedDate).utc().format("YYYY-MM-DD hh:mm:ss a") : '')
			},
		},
		{
			name: '',
			selector: 'date',
			cell : (row)=>{
				return <>
					<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
						<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(row)}}>
							<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
						</Button>
					</div>
				</>			
			},
		},
	];

	
	const columns2 = [
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
			cell : (row)=>{
				return <>
					<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
						<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(row)}}>
							<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
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
		dispatch(orderActions.orderTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(orderActions.orderTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(orderActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(orderActions.orderTable(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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

	const agencyFilterWatch = watch('agency');
	useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

	const [filters, setFilters] = useState({});

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
	const [modalMsg, setModalMsg] = useState(false);

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
		dispatch(orderActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(orderActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}

	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(excel && excel.results){

			// Se una copia de los detalles para que estos no sean los mod.mapificados
			let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

			//Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {

				item.in = item.in.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.out = item.out.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.total = item.total.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				

				item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
			})

			setDataExcel(fixedData);
		}
	},[excel]);

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
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Pedido del dia {moment(data.createdDate).format('dddd')} {moment(data.createdDate).format('LL')} <br></br> {data.agency.name}</th>
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
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2} >Código</th>
						<th rowSpan={1} colSpan={4}>Nombre</th>
						<th rowSpan={1} colSpan={2}>Pedido</th>
						<th rowSpan={1} colSpan={2}>Anexo</th>	
						<th rowSpan={1} colSpan={2}>Total</th>					
					</tr>

					
					{
						data.products.map((item) => {

							if(!item.kgTotal)
								return;

							if(data.isModification && !item.wasModified)
								return;

							return <tr key={item.product.code}>
									<th rowSpan={1} colSpan={2} >{ item.product.code }</th>
									<th rowSpan={1} colSpan={4}>{ item.product.name }</th>
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kg ? item.kg.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kgDifferential ? item.kgDifferential.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kgTotal ? item.kgTotal.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					
								</tr>
						})
					}
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
					
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>

								{ 	((data && !data.wasConfirmed) && ((user.role === 1) || (user.role === 2))) &&
										<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
											<Button color="primary" disabled={loadingOrder} onClick={() => {setOrderProducts(data.products); setOrderToConfirm(data); setModalOrderOpen(true)}}>
												<i className="fas fa-pencil-alt"></i> Editar{loadingOrder && <span className="spinner-border spinner-border-sm mr-1"></span>} 
											</Button>
										</div>
								}

								{ 	((data && !data.wasConfirmed) && ((user.role === 1)  || (user.role === 2))) &&
										<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
											<Button color="primary" disabled={loadingOrder} onClick={() => {setOrderToConfirm(data); setModalMsg(true)}}>
												<i className="fas fa-thumbs-up"></i> Confirmar{loadingOrder && <span className="spinner-border spinner-border-sm mr-1"></span>} 
											</Button>
										</div>
								}
								
								<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
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

	//Data al expandir una fila en el reporte GENERAL 
	const ExpandedComponentGeneralReport = ({ data, buttonStatus = true }) => (
		<Row>
			<Col md="12" sm="12" lg="12">
			{loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
			<Table responsive hover bordered size="sm">
				<tbody style={{textAlign:'center', color: "black"}}>
					<tr style={{height:'7rem', fontSize: 'x-large'}}>
						<th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Pedidos totales del dia {moment(data.createdDate).format('dddd')} {moment(data.createdDate).format('LL')} <br></br></th>
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
						<td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
					</tr>
					<tr>
						<th rowSpan={1} colSpan={2} >Código</th>
						<th rowSpan={1} colSpan={4}>Nombre</th>
						<th rowSpan={1} colSpan={2}>Pedido</th>
						<th rowSpan={1} colSpan={2}>Anexo</th>	
						<th rowSpan={1} colSpan={2}>Total</th>					
					</tr>
					{
						data.products.map((item) => {

							if(!item.kgTotal)
								return;

							return <tr key={item.product.code}>
									<th rowSpan={1} colSpan={2} >{ item.product.code }</th>
									<th rowSpan={1} colSpan={4}>{ item.product.name }</th>
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kg ? item.kg.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kgDifferential ? item.kgDifferential.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					
									<th rowSpan={1} colSpan={2}><NumberFormat value={item.kgTotal ? item.kgTotal.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					
								</tr>
						})
					}
					
					{buttonStatus && <tr>
							<td rowSpan={1} colSpan={12}>
								<div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
									<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
										<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
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

	/** PARA EXPORTAR **/
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef(); 

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: 'Pedidos totales del dia ' + (dataToPrint ? moment(dataToPrint.createdDate).utc().format("YYYY-MM-DD") : ''),
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
	

	// MODAL DE CONFIRMACION
	
	
	const order = useSelector( state => state.order )
	const loadingOrder = useSelector( state => state.order.updating )

	// Productos que se van a modificar 
	const [orderProducts, setOrderProducts] = useState([]);
	// La orden que va a ser modificada
	const [orderToConfirm, setOrderToConfirm] = useState(null);
	// La data que se va a enviar para la modificacion
	const [dataToSend, setDataToSend] = useState(null);
	const [lastOrder, setLastOrder] = useState(null);
	
    //	Form para el modal de la orden
	const { handleSubmit: handleSubmitOrder, register: registerOrder, control: controlOrder, errors: errorsOrder, reset:resetOrder } = useForm();

	// Estado para abrir o cerrar el modal de hacer pedido
	const [modalOrderOpen, setModalOrderOpen] = useState(false);

	const onSubmitOrder = (data) => {
		setDataToSend(data);
		setModalMsg(true)
	}

	// Funcion para eliminar toda la data correspondiente a las ordenes
	const cleanOrderData = () => {

		// Se cierra el modal de modificacion de la orden
		setModalOrderOpen(false);
		// Se resetean la orden para confirmar
		setOrderProducts([])
		// Se cierra el modal de confirmación de la orden
		setModalMsg(false)
		// Se resetea la orden para confirmar 
		setOrderToConfirm(null);
		// Se resetea la data para modificar
		setDataToSend(null);
		
		setModalWarning(false);
	}

	// En caso de que se emita la orden de manera satisfactoria
	useEffect(() => {

		cleanOrderData();

		// Se realiza una nueva busqueda de las órdenes para ver estas actualizadas
		dispatch(orderActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, false));

	},[order.success]);


	const confirmOrder = () => {
		
		if (dataToSend){
			dispatch(orderActions.updateOrder(getUserData(), orderToConfirm._id , dataToSend))
		}
		else{
			dispatch(orderActions.updateOrder(getUserData(), orderToConfirm._id))
		}
	}

	//Alertas
	const alert = useSelector(state => state.alert);
	//Mostrar alertas
	const [visible, setVisible] = useState(true);
	const onDismiss = () => setVisible(false);

	useEffect(() => {
		if(alert.message){
			setVisible(true); 
			window.setTimeout(()=>{setVisible(false)},5000);   
		}

		//Si hay algun error cerrar modal y limpiar valores
		if(alert.type == "alert-danger"){
			cleanOrderData();
		}
	},[alert]);


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de pedidos</h3>
							</div>
						</div>
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
                                    {(user.role == 1 || user.role == 2) && <FormGroup className="mr-3">
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
									<FormGroup className="mr-3">
										<label>
											<input 
												className="form-check-input"
												name="showConfirmedModifications"
												id="showConfirmedModifications" 
												type="checkbox" 
												value={true}
												ref={register}/> Ver anexos confirmados
										</label>
									</FormGroup>
									<ButtonGroup className="mr-5">
										<Button
											color="primary"
											outline={reportToSearch !== 1}
											onClick={() => setReportToSearch(1)}
											active={reportToSearch === 1}
											>
											Reporte por tiendas
										</Button>
										<Button
											color="primary"
											outline={reportToSearch !== 2}
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
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns2}
								data={dataGeneral}
								persistTableHead
								theme={darkMode ? "dark" : "default"}

							/>
							</Col>
						</Row>
						{ dataStores && dataStores.length > 0 && <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel} style={{display:'none'}}> 
								<Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"HistorialDeCaja.csv"}  style={{display:'none'}}>
										Exportar
									</CSVLink>
								</>
							}
							</>	
						}
						{/* Modal de notificaciones */}
						<Modal toggle={() => { cleanOrderData() }} isOpen={modalMsg} className={`${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
							<h5 className="modal-title" id="examplemodalMsgLabel">
								Ventas
							</h5>
							<button
								aria-label="Close"
								className="close"
								type="button"
								onClick={() =>  { cleanOrderData() }}
							>
								<span aria-hidden={true}>×</span>
							</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<p>¿Desea confirmar el pedido de Nro { orderToConfirm ? orderToConfirm.order : ''} de la agencia {orderToConfirm ? orderToConfirm.agency.name : ''}</p>
								
								<div className="d-flex justify-content-between">
									<Button color="primary" disabled={loadingOrder} onClick={() => {confirmOrder();}} >
										{false && <span className="spinner-border spinner-border-sm mr-1"></span>}
										Confirmar pedido
									</Button>							
									<Button color="secondary" type="button" onClick={() =>  { cleanOrderData()}} >
										Cerrar
									</Button>
								</div>
							</div>
						</Modal>
						<Modal toggle={() => { cleanOrderData() }} isOpen={modalOrderOpen} backdrop="static" className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ingreso de los valores a solicitar 
                            </h5>
                            <button  aria-label="Close" className="close" type="button" onClick={() =>  { cleanOrderData() }}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
							<Form onSubmit={handleSubmitOrder(onSubmitOrder)} className="form">

									<Row>
										<Col md={1}>
											<div className="modal-header" >
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Cód.
												</h5>
											</div>
										</Col>
										<Col md={4}>
											<div className="modal-header" >
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Producto 
												</h5>
											</div>
										</Col>
										<Col md={2} className={"px-0.5"}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Pedido 
												</h5>
											</div>
										</Col>
										<Col md={2} className={"px-0.5"}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Anexo 
												</h5>
											</div>
										</Col>
										<Col md={2}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Total 
												</h5>
											</div>
										</Col>
									</Row>
									<div className="modal-body" >
										{(orderProducts.length > 0) && orderProducts.map((item, index) => (
											<Row form key={item.product.code}>
												<Col md={1} style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
															<b>{item.product.code}</b>
														</Label>
													</FormGroup>
												</Col>
												<Col md={4} style={{display: "flex", alignItems: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
															<b>{item.product.name}</b>
														</Label>
													</FormGroup>
												</Col>
												<Col md={2} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Controller
																name={`product.${item.product.code}`}
																control={controlOrder}
																placeholder={"Ingrese cantidad"} 
																disabled={orderToConfirm.isModification}
																defaultValue={ (item && item.kg) ? item.kg.toFixed(2) : 0}
																rules={{
																	min: {
																		value: 0,
																		message: "El monto es requerido"
																	},
																	required: "El monto es requerido",
																}}
																as={<NumberFormat className={'form-control' + (errorsOrder.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
															/>
													</FormGroup>
												</Col>
												<Col md={2} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Controller
																name={`productModification.${item.product.code}`}
																control={controlOrder}
																placeholder={"Ingrese cantidad"} 
																disabled={!orderToConfirm.isModification}
																defaultValue={ (item && item.kgDifferential) ? item.kgDifferential.toFixed(2) : 0}
																rules={{
																	min: {
																		message: "El monto es requerido"
																	},
																	required: "El monto es requerido",
																}}
																as={<NumberFormat className={'form-control' + (errorsOrder.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
															/>
													</FormGroup>
												</Col>
												<Col md={2}>
													<FormGroup>
														<Label for="name">
															<NumberFormat value={item.kgTotal ? item.kgTotal.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Kg  ' />
														</Label>
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
													className={'form-control' + (errorsOrder.comment ? ' is-invalid' : '')}
													name="comment"
													ref={registerOrder}
												/>
											</FormGroup>
                                        </Col>
									</Row>

                                    <div className="d-flex justify-content-between">
										<Button color="primary" disabled={loadingOrder}>
                                            {false && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Confirmar pedido
                                        </Button>
										                                       
										<Button color="secondary" type="button" onClick={() =>  { cleanOrderData() }}>
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
				<ComponentToPrint data={dataToPrint}/>
			</div>
        </>
    );
}

export default OrderHistoryPage;