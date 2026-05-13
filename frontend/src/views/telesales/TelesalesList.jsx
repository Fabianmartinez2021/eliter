/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import { useReactToPrint } from 'react-to-print';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function TelesalesListPage() {

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

	const dataSales = useSelector(state => state.sales.table);
    const loadingPage = useSelector(state => state.sales.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Verificar data de redux
	useEffect(() => {
		if(dataSales && dataSales.results){
			setData(dataSales.results);
		}
		if(dataSales && dataSales.metadata && dataSales.metadata[0]){
			setRowCount(dataSales.metadata[0].total);
		}
  	},[dataSales]);
    
	
	const [rowCount, setRowCount] = useState(0)
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: false,
            omit: user.role == 1 || user.role == 2 ? false:true,//Visible si es admin o supervisor
            wrap:true,
		},
		{
			name: 'Cajero',
			cell : (row)=>{
				if(row.user){
					return `${row.user.firstName} ${row.user.lastName}`
				}
			},
			sortable: false,
		},
		{
			name: 'Operador',
			selector: 'operator.firstName',
			omit: true,
			sortable: true,
			cell : (row)=>{
				return row.operator ? row.operator.firstName + ' ' + row.operator.lastName : ''
			},
		},
		{
			name: 'N° de Ticket',
			selector: 'order',
			sortable: true,
		},
		{
			name: 'Nombres',
			selector: 'names',
			sortable: true,
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.total?row.total.toFixed(2):row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' />
			},
		},
		{
			name: 'Tipo',
			selector: 'type',
			sortable: true,
			center:true,
			cell: row => {
			
				//	Se agregan notas en caso de que sean ingresos NO al detal

				//	Si es un crédito
				if (row.isCredit)
					return <>
							<Badge color={"danger"} pill className="h6 p-2 mt-1">
								{"CRÉDITO"}
							</Badge>
						</>
				//	Si es un abono 
				else if (row.isSumation)
					return <>
							<Badge color={"danger"} pill className="h6 p-2 mt-1">
								{"ABONO"}
							</Badge>
						</>
				//	Si es una venta al mayor
				else if (row.isWholesale)
					return <>
							<Badge color={"info"} pill className="h6 p-2 mt-1">
								{"MAYOR"}
							</Badge>
						</>
				//	Si es un pago al detal
				else
					return <>
							<Badge color={"danger"} pill className="h6 p-2 mt-1">
								{"DETAL"}
							</Badge>
						</>
			} 
		},
		{
			name: 'Referencia',
			cell : (row)=>{
				if((row.pAmmount && row.pAmmount>0 || (row.pAmmountExtra && row.pAmmountExtra>0)) && !row.dollar && !row.eur && !row.cop && !row.tAmmount && !row.ves){
					if(row.pReferenceExtra != ""){
						return `${row.pReference}, ${row.pReferenceExtra}`;
					}else{
						return `${row.pReference}`;
					}
				}else if((row.tAmmount && row.tAmmount>0) && !row.dollar && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.ves){
					return `${row.tReference}`
				}else if((row.dollar && row.dollar>0) && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Dólar"
				}else if((row.eur && row.eur>0) && !row.dollar && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Euros"
				}else if((row.cop && row.cop>0) && !row.dollar && !row.eur && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Pesos"
				}else if((row.ves && row.ves>0) && !row.dollar && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount){
					return "Efectivo"
				}else if((row.credit && row.credit>0)){
					return "Crédito"
				}else{
					return "Mixto"
				}
			},
		},
		{
			name: 'Hora de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("hh:mm:ss a");
			},
		},

		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD");
			},
		},
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
		dispatch(salesActions.dataTableUser(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {telesale: true}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(salesActions.dataTableUser(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {telesale: true}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(salesActions.dataTableUser(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {telesale: true}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(salesActions.dataTableUser(getUserData(), page, newPerPage, direction, filters ? filters: {telesale: true}));
    };
    

    //obtener sucursales para select
    const getting = useSelector(state => state.users.getting);
    const users = useSelector(state => state.users);
    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    },[]);

    const [listUsers, setListUsers] = useState(null);
    const [listAgencies, setListAgencies] = useState(null);
    
    useEffect(() => {
        if(users.obtained){
            setListUsers(users.list.users);
            setListAgencies(users.list.agencies);
        }
    },[users.obtained]);

	const [filters, setFilters] = useState('');

	//Consultar al entrar
	useEffect(() => {
		setData([])
		getDataTable(1);
	}, []);

	//Calcular total general cuando cambie la información
	const [loadingTotal, setLoadingTotal] = useState(false);
    const [general, setGeneral] = useState(0);
	const [generalDifferential, setGeneralDifferential] = useState(0);

	useEffect(() => {
		let sumtotal = 0
		let sumtotalDifferential = 0
		if(data && data.length>0){
			setLoadingTotal(true);
			if(dataSales.total[0] && dataSales.total[0].totalAmount){
				sumtotal = dataSales.total[0].totalAmount;
				sumtotalDifferential = dataSales.total[0].totalAmountDifferential;
			}
		}
		setLoadingTotal(false);
		setGeneral(sumtotal);
		setGeneralDifferential(sumtotalDifferential);
	}, [data]);

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
		if ( dateDiff > 60 ){
			setModalVisible(true);
            setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);
		dispatch(salesActions.dataTableUser(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
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
		reset({ticket:'', names:'', reference:'', startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [expandAll, setExpandAll] = useState(false);

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
			{(data.tReference || data.pReference || data.pReferenceExtra) && <> 
				<div className="mb-2 mt-4"><b>Referencias</b></div>
				<Table striped responsive>
					<thead style={{color: "black"}}>
						<tr>
							<th>Transferencia</th>
							<th>Punto</th>
							<th>Punto adicional</th>
						</tr>
					</thead>
					<tbody style={{color: "black"}}>
						<tr>
							<td>{data.tReference ? data.tReference : ''}</td>
							<td>{data.pReference ? data.pReference : ''}</td>
							<td>{data.pReferenceExtra ? data.pReferenceExtra : ''}</td>
						</tr>
					</tbody>
				</Table>
			</>
			}
			{(data.products && (data.products.length !== 0)) && <Table striped responsive className="mt-4">
					<thead style={{color: "black"}}>
						<tr>
							<th>Producto</th>
							<th>Precio</th>
							<th>Peso</th>
							<th>Total</th>
							{ data.isWholesale ?  <th>Diferencial</th> : ''}
						</tr>
					</thead>
					<tbody style={{color: "black"}}>
					{data.products && data.products.map((product, index) => {
						return (
							<tr key={index}>
								<td>{product.name}</td>
								<td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
								<td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
								<td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
								{ product.isWholesale ? <td><NumberFormat value={product.differential.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td> : ''	}
							</tr>
							)
						})
					}

					</tbody>
				</Table>
			}
			{ (!data.isCredit) && <>  
				<div className="mb-2"><b>Métodos de pago</b></div>
				<Table striped responsive>
					<thead style={{color: "black"}}>
						<tr>
							<th>BsF</th>
							<th>$ Dólares</th>
							<th>€ Euros</th>
							<th>$ Pesos</th>
							<th>Transferencia</th>
							<th>Punto de venta</th>
						</tr>
					</thead>
					<tbody style={{color: "black"}}>
						<tr>
							<td><NumberFormat value={ data.ves ? data.ves.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={ data.dollar ? data.dollar.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={ data.eur ? data.eur.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={ data.cop ? data.cop.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={ data.tAmmount ? data.tAmmount.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={ data.totalTerminal ? data.totalTerminal.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						</tr>
					</tbody>
				</Table>
			</>
			}
			{ !dataToPrint &&  <div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '50px', marginBottom: '50px'}}>
					<Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
						<Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
					</Button>
				</div>
			}
		</>
	);

	/** PARA EXPORTAR **/
	
	const [dataToPrint, setDataToPrint] = useState(null);

	const printRef = useRef(); 

	const handlePrint = useReactToPrint({
		content: () => printRef.current,
		documentTitle: 'Ticket N° ' + (dataToPrint ? dataToPrint.order : ''),
		onAfterPrint: () => setDataToPrint(null),
		//pageStyle: "@page{margin: 20mm;	}"
		pageStyle: "@media print { @page {margin: 0mm;} body {padding: 20mm !important;}}"
	})
	
	const ComponentToPrint = ({ data }) => (
		 <>
			{ data && <div ref={printRef} > 
				
				<div className="align-self-center">
					<h2 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '10mm', color: "black"}}>Ticket N° {data.order}</h2>
				</div>
				<Table striped responsive>
					<thead style={{color: "black"}}>
						<tr>
							<th>Agencia</th>
							<th>Nro de Ticket</th>
							<th>Nombres</th>
							<th>Total</th>
							<th>Tipo</th>
							{/*<th>Referencia</th>*/}
							<th>Hora de registro</th>
							<th>Fecha de registro</th>
						</tr>
					</thead>
					<tbody style={{color: "black"}}>
						<tr>
							<td>{data.agency ? data.agency.name : ''}</td>
							<td>{data.order ? data.order : ''}</td>
							<td>{data.names ? data.names : ''}</td>
							<td>{data.total ? <NumberFormat value={data.total?data.total.toFixed(2):data.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /> : ''}</td>
							<td>{data.isCredit ? 
									<Badge color={"danger"} pill className="h6 p-2 mt-1">
										{"CRÉDITO"}
									</Badge> : (
										data.isSumation ? 
											<Badge color={"danger"} pill className="h6 p-2 mt-1">
												{"ABONO"}
											</Badge> : (

											data.isWholesale ? 
												<Badge color={"info"} pill className="h6 p-2 mt-1">
													{"MAYOR"}
												</Badge> : 
												
												<Badge color={"danger"} pill className="h6 p-2 mt-1">
													{"DETAL"}
												</Badge>
											)
									) 
								}
							</td>
							{/*<td><ReferenceComponent data={data} /></td>*/}
							<td>{moment(data.createdDate).utc().format("hh:mm:ss a")}</td>
							<td>{moment(data.createdDate).utc().format("YYYY-MM-DD")}</td>
						</tr>
					</tbody>
				</Table>
				<ExpandedComponent data={data} />
				<div className="align-self-center"  style={{ width:"100%", marginTop:"10mm", marginBottom: '5mm', textAlign: "right", color: "black"}}>
					<div className="align-self-center">
						<h2 style={{ fontWeight:'bold',fontStyle: 'italic', bottom: "0", right: "0", marginTop: '10mm', marginBottom: '10mm', color: "black"}}>
							Total: {<NumberFormat value={data.total ? data.total.toFixed(2): ''} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={data.total ? 'Bs ' : ''} />}
						</h2>
					</div>
				</div>
				<div className="align-self-right">
					<p style={{ fontWeight:'bold', fontSize: 'small', fontStyle: 'italic', position: 'fixed', bottom: "20mm", width: "88%", color: "black"}}>
						NOTA: Esto es un recibo virtual y no posee validéz fiscal. Los datos no deben ser usados para realizar retenciones de impuestos
						por lo que solo debe tomar el monto para calcular su cotización, y una vez pagado podrá solicitar su factura fiscal
					</p>
				</div>
			</div>
			}
		</>
	)

	/*const ReferenceComponent = ({ data }) => {

		if((data.pAmmount && data.pAmmount>0 || (data.pAmmountExtra && data.pAmmountExtra>0)) && !data.dollar && !data.eur && !data.cop && !data.tAmmount && !data.ves){
			if(data.pReferenceExtra != ""){
				return `${data.pReference}, ${data.pReferenceExtra}`;
			}else{
				return `${data.pReference}`;
			}
		}else if((data.tAmmount && data.tAmmount>0) && !data.dollar && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.ves){
			return `${data.tReference}`
		}else if((data.dollar && data.dollar>0) && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
			return "Dólar"
		}else if((data.eur && data.eur>0) && !data.dollar && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
			return "Euros"
		}else if((data.cop && data.cop>0) && !data.dollar && !data.eur && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
			return "Pesos"
		}else if((data.ves && data.ves>0) && !data.dollar && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount){
			return "Efectivo"
		}else if((data.credit && data.credit>0)){
			return "Crédito"
		}else{
			return "Mixto"
		}
	}*/

	useEffect(() => {
		if (dataToPrint){
			handlePrint();
		}
	}, [dataToPrint]);

	
    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Ventas (Televentas)</h3>
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
								<Form onSubmit={handleSubmit(onFilterData)} style={{marginTop:15}}>
                                    {/* Primera fila - Campos principales */}
                                    <Row className="mb-3">
                                        {(user.role == 1 || user.role == 2) && (
                                            <Col xs={12} sm={6} lg={3} className="mb-2">
                                                <FormGroup>
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
                                            </Col>
                                        )}
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <input
                                                    className="form-control"
                                                    placeholder="N° de Ticket"
                                                    type="number"
                                                    name="ticket"
                                                    min="1"
                                                    ref={register}
                                                ></input>
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <input
                                                    className="form-control"
                                                    name="names"
                                                    placeholder="Nombres"
                                                    type="text"
                                                    ref={register}
                                                ></input>
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <input
                                                    className="form-control"
                                                    name="reference"
                                                    placeholder="Comanda o Referencia"
                                                    type="text"
                                                    ref={register}
                                                ></input>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    {/* Segunda fila - Fechas */}
                                    <Row className="mb-3">
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
                                                    inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
                                                    inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    {/* Tercera fila - Campo de producto */}
                                    <Row className="mb-3">
                                        <Col xs={12} sm={6} lg={3} className="mb-2">
                                            <FormGroup>
                                                <input
                                                    className="form-control"
                                                    name="productCode"
                                                    placeholder="Cod. Producto"
                                                    type="text"
                                                    ref={register}
                                                ></input>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    {/* Cuarta fila - Checkboxes con estilo personalizado */}
                                    <Row className="mb-3">
                                        <Col xs={6} sm={6} md={2} className="mb-2">
                                            <div className="custom-checkbox-wrapper">
                                                <input className="custom-checkbox" name="retail" id="retail" type="checkbox" value={true} ref={register} />
                                                <label htmlFor="retail" className="custom-checkbox-label">DETAL</label>
                                            </div>
                                        </Col>
                                        <Col xs={6} sm={6} md={2} className="mb-2">
                                            <div className="custom-checkbox-wrapper">
                                                <input className="custom-checkbox" name="wholesale" id="wholesale" type="checkbox" value={true} ref={register} />
                                                <label htmlFor="wholesale" className="custom-checkbox-label">MAYOR</label>
                                            </div>
                                        </Col>
                                        <Col xs={6} sm={6} md={2} className="mb-2">
                                            <div className="custom-checkbox-wrapper">
                                                <input className="custom-checkbox" name="sumation" id="sumation" type="checkbox" value={true} ref={register} />
                                                <label htmlFor="sumation" className="custom-checkbox-label">ABONOS</label>
                                            </div>
                                        </Col>
                                        <Col xs={6} sm={6} md={2} className="mb-2">
                                            <div className="custom-checkbox-wrapper">
                                                <input className="custom-checkbox" name="credit" id="credit" type="checkbox" value={true} ref={register} />
                                                <label htmlFor="credit" className="custom-checkbox-label">CRÉDITOS</label>
                                            </div>
                                        </Col>
                                        <Col xs={6} sm={6} md={2} className="mb-2">
                                            <div className="custom-checkbox-wrapper">
                                                <input className="custom-checkbox" name="telesale" id="telesale" type="checkbox" value={true} disabled={true} checked ref={register} />
                                                <label htmlFor="telesale" className="custom-checkbox-label">TELEVENTAS</label>
                                            </div>
                                        </Col>
                                    </Row>
                                    {/* Quinta fila - Botones */}
                                    <Row className="mb-3">
                                        <Col xs={12} sm={6} md={6} className="mb-2">
                                            <Button color="primary" type="submit" disabled={loadingPage} className="w-35" style={{ minWidth: '120px' }}>
                                                {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
                                            </Button>
                                        </Col>
                                        <Col xs={12} sm={6} md={6} className="mb-2">
                                            <Button color="primary" disabled={loadingPage} onClick={() => { setExpandAll(!expandAll)}} className="w-35" style={{ minWidth: '120px' }}>
                                                {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Desplegar todo
                                            </Button>
                                        </Col>
                                    </Row>
								</Form>
                                
                                {/* Estilos para checkboxes personalizados naranjas */}
                                <style>
                                    {`
                                    /* Estilos para checkboxes personalizados naranjas */
                                    .custom-checkbox-wrapper {
                                        display: flex;
                                        align-items: center;
                                        margin-bottom: 0.5rem;
                                    }
                                    .custom-checkbox {
                                        position: absolute;
                                        opacity: 0;
                                        cursor: pointer;
                                        height: 0;
                                        width: 0;
                                    }
                                    .custom-checkbox-label {
                                        position: relative;
                                        padding-left: 35px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        font-weight: 500;
                                        color: #333;
                                        user-select: none;
                                        display: flex;
                                        align-items: center;
                                        min-height: 20px;
                                    }
                                    .custom-checkbox-label:before {
                                        content: '';
                                        position: absolute;
                                        left: 0;
                                        top: 50%;
                                        transform: translateY(-50%);
                                        height: 20px;
                                        width: 20px;
                                        background-color: #fff;
                                        border: 2px solid #ddd;
                                        border-radius: 50%; /* Circular */
                                        transition: all 0.3s ease;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                    }
                                    .custom-checkbox-label:hover:before {
                                        border-color: #ff8c00;
                                        box-shadow: 0 2px 8px rgba(255, 140, 0, 0.2);
                                    }
                                    .custom-checkbox:checked + .custom-checkbox-label:before {
                                        background-color: #ff8c00;
                                        border-color: #ff8c00;
                                        box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
                                    }
                                    .custom-checkbox:checked + .custom-checkbox-label:after {
                                        content: '✓'; /* Checkmark symbol */
                                        position: absolute;
                                        left: 50%;
                                        top: 50%;
                                        transform: translate(-50%, -50%);
                                        color: white;
                                        font-size: 12px;
                                        font-weight: bold;
                                        animation: checkmark 0.3s ease;
                                    }
                                    @keyframes checkmark {
                                        0% {
                                            opacity: 0;
                                            transform: translate(-50%, -50%) scale(0);
                                        }
                                        100% {
                                            opacity: 1;
                                            transform: translate(-50%, -50%) scale(1);
                                        }
                                    }
                                    /* Responsive mejoras */
                                    @media (max-width: 576px) {
                                        .custom-checkbox-label {
                                            font-size: 12px;
                                            padding-left: 30px;
                                        }
                                        .custom-checkbox-label:before {
                                            height: 18px;
                                            width: 18px;
                                        }
                                        .custom-checkbox:checked + .custom-checkbox-label:after {
                                            font-size: 10px;
                                        }
                                    }
                                    /* Modo oscuro */
                                    .dark-mode .custom-checkbox-label {
                                        color: #fff;
                                    }
                                    .dark-mode .custom-checkbox-label:before {
                                        background-color: #2d3748;
                                        border-color: #4a5568;
                                    }
                                    .dark-mode .custom-checkbox-label:hover:before {
                                        border-color: #ff8c00;
                                    }
                                    `}
                                </style>
							</>
							}
						</div>
						{/* Filtros */}
						<Row>
							<Col>
							<DataTable
								className="dataTables_wrapper"
								responsive
								highlightOnHover
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								expandableRowExpanded={row => expandAll}
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
							/>
							</Col>
						</Row>
						{user.role !== 4 && <>
							<Row xs="12">
								<Col>
									<div className="pull-right">
										{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>} 
										{!!general && <b>Total: <NumberFormat value={general.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></b>}
									</div>
								</Col>
							</Row>
							<Row xs="12">
								<Col>
									<div className="pull-right">
										{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>} 
										{!!generalDifferential > 0 && <b>Total diff: <NumberFormat value={generalDifferential.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></b>}
									</div>
								</Col>
							</Row>
						</>}
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

export default TelesalesListPage;