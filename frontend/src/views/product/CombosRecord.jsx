/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge, Label } from 'reactstrap';
import cashRegister from '@iconify/icons-fa-solid/cash-register';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function CombosRecordPage() {

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

	const dataProducts = useSelector(state => state.products.data);
    const loadingPage = useSelector(state => state.products.loading);

	//Verificar data de redux
	useEffect(() => {
		
		if(dataProducts){
			setData(dataProducts);
		}else{
		}
  	},[dataProducts]);


	// Inicializar tabla sin data
	const [data, setData] = useState([])


	//Verificar data de redux
	useEffect(() => {

		if(dataProducts && dataProducts.results){

			setData(dataProducts.results);
		}
		
		if(dataProducts && dataProducts.metadata && dataProducts.metadata[0]){
			setRowCount(dataProducts.metadata[0].total);
		}
  	},[dataProducts]);

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
	//Columnas Data table
	const columns = [
		{
			name: 'Tipo',
			selector: 'recordType',
			sortable: true,
			center:true,
			cell: row => {
				return <>
						<Badge 
								color={row.recordType === 1 ? "success" :  (row.recordType === 2 ? "danger" : "warning")}  
								pill className="h6 p-2 mt-1">
									{
										row.recordType === 1 ? "CREACIÓN" : (row.recordType === 2 ? "ELIMINACIÓN" : "MODIFICACIÓN")
									}
						</Badge>
					</>
			} 
		},
		{
			name: 'Agencia',
			selector: 'toAllAgencies',
			sortable: true,
			center:true,
			cell: row => {
				return <>
						<Badge 
								color={row.toAllAgencies ? "success" : "danger"}  
								pill className="h6 p-2 mt-1">
									{
										row.toAllAgencies ? "TODAS" : "ÚNICO"
									}
						</Badge>
					</>
			} 
		},
		{
			name: 'Agencia',
			selector: 'agency.name',
			sortable: false,
			wrap: true,
			cell: row => {
				return <> { row.toAllAgencies  ? "Todas" : ( row.agency ? row.agency.name : '')}</>
			} 
		},
		{
			name: 'Código',
			selector: 'code',
			sortable: true,
		},
		{
			name: 'Nombre',
			selector: 'name',
			sortable: true,
			wrap: true
		},
		{
			name: 'Precio',
			selector: 'price',
			sortable: true,
			cell : (row)=>{
				return (row.price.toFixed(2));
			},
		},
		{
			name: 'Precio Regular',
			selector: 'regularPrice',
			sortable: true,
			cell : (row)=>{
				return (row.regularPrice.toFixed(2));
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
		dispatch(productActions.dataTableCombosHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(productActions.dataTableCombosHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(productActions.dataTableCombosHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(productActions.dataTableCombosHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}));
	};
	
	const [filters, setFilters] = useState('');

	const getAllCombos = () => {
		dispatch(productActions.dataTableCombosHistory());
	}

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
		if ( dateDiff > 60 ){
			setModalVisible(true);
            setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);

		dispatch(productActions.dataTableCombosHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
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
		<Table striped responsive  style={{ width: "50%", textAlign: "center", marginLeft: "25%"}}>
			<thead>
				<tr>
					<th>Producto</th>
					<th>Peso (kg)</th>
				</tr>
			</thead>
			<tbody>
			{data.items && data.items.map((product, index) => {
				return (
					<tr key={index}>
						<td>{product.name}</td>
						<td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					</tr>
					)
				})
			}

			</tbody>
    	</Table>
		<div className="mb-4 mt-2"><b></b></div>
		</>
	);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de actualizaciones de combos</h3>
							
							</div>
							{(user.role===1) && <div> 
								<span style={{fontWeight:'bold', marginRight:8}}>
									Pagar o abonar crédito
								</span>
								<Button id="add" onClick={()=>history.push('/credit-payment')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-edit me-2 ml-1" />
								</Button>
							</div>}
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
							/>
							</Col>
						</Row>
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible} className={`${darkMode ? "dark-mode" : ""}`}>
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
        </>
    );
}

export default CombosRecordPage;