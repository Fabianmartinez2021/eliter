/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assetsActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText} from 'reactstrap';
//componente dataTable sede
import { Role, history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import assetsEnum from '../../enums/assets.enum';
import NumberFormat from 'react-number-format';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function AssetsRecordPage() {

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

	const dataAssets = useSelector(state => state.assets.table);
    const loadingPage = useSelector(state => state.assets.loading);
    const assets = useSelector(state => state.assets);

	// Inicializar tabla sin data
	const [data, setData] = useState([])
	// Inicializar el valor total de los activos
	const [totalAmount, setTotalAmount] = useState(0);

	//Verificar data de redux
	useEffect(() => {
		if(dataAssets && dataAssets.results){
			setData(dataAssets.results);
		}
		if(dataAssets && dataAssets.metadata && dataAssets.metadata[0]){
			setRowCount(dataAssets.metadata[0].total);
		}

		if(dataAssets && dataAssets.totalAmount){
			setTotalAmount(dataAssets.totalAmount);
		}
		else{
			setTotalAmount(0)
		}
  	},[dataAssets]);


	// Recargar luego de eliminar un activo
	useEffect(() => {
		if(assets.deleted){
			dispatch(assetsActions.getRecordList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters));
		}
  	},[assets.deleted]);
    
	
	const [rowCount, setRowCount] = useState(0)
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: false,
            wrap:true,
		},
		{
			name: 'Tipo',
			selector: 'recordType',
			sortable: true,
		},
		{
			name: 'Modificación',
			selector: 'modification',
			sortable: true,
		},
		{
			name: 'Código',
			selector: 'code',
			sortable: true,
		},
		{
			name: 'Serial',
			selector: 'serial',
			sortable: true,
            wrap:true,
			cell : (row)=>{
				return  row.hasSerial === false ? 'No aplica' : row.serial
			},
		},
		{
			name: 'Nombre',
			selector: 'name',
			sortable: true,
			wrap:true,
		},
		{
			name: 'Condición',
			selector: 'condition',
			sortable: true,
            wrap:true,
		},
		{
			name: 'Tipo',
			selector: 'type',
			sortable: true,
            wrap:true,
		},
		{
			name: 'Categoria',
			selector: 'category',
			sortable: true,
            wrap:true,
		},
		{
			name: 'Valor',
			selector: 'price',
			sortable: true,
            wrap:true,
			omit: (user.role != Role.Admin),
			cell : (row)=>{
				return  <NumberFormat value={row.price ? row.price.toFixed(2) : ''} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},
		},
		{
			name: 'Status',
			selector: 'status',
			sortable: true,
            wrap:true,
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
			button: true,
			omit: true,
			cell: row => {
				if((user.role === 1) || (user.role === 2)){
					return <><Button color="primary btn-round" size="sm" style={{fontSize:12}} disabled={loadingPage} onClick={e => 
								{
									e.preventDefault(); 
									dispatch(assetsActions.restoreAssets(row._id, user))
									const newData = data.filter(item => item.id !== row._id);
									setData(newData)
								}
							}><i className="fa fa-trash" aria-hidden="true"></i>
							</Button>
						</>
				}
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
		dispatch(assetsActions.getRecordList(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(assetsActions.getRecordList(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(assetsActions.getRecordList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(assetsActions.getRecordList(getUserData(), page, newPerPage, direction, filters ? filters: {}));
    };
    

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

	const [filters, setFilters] = useState({});

	
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	
	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
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
		dispatch(assetsActions.getRecordList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();


	const clearFilters = () =>{
		reset({ticket:'', names:'', reference:'', startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [expandAll, setExpandAll] = useState(false);

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading><b>Usuario que INGRESÓ el activo: </b>{ data.user.username + ' ( ' + data.user.firstName + ' ' + data.user.lastName + ' )' }</ListGroupItemHeading>
				<ListGroupItemHeading><b>Usuario que MODIFICÓ el activo: </b>{ data.modificationUser.username + ' ( ' + data.modificationUser.firstName + ' ' + data.modificationUser.lastName + ' )'}</ListGroupItemHeading>
				<ListGroupItemText>
					<b>Descripción del activo: </b>{ data.description }
				</ListGroupItemText>
			</ListGroupItem>
	  	</ListGroup>
	);
	
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Movimientos y modificaciones de los activos</h3>
							</div>
							{(user.role===1)&&<div>
								<span style={{ fontWeight: 'bold', marginRight: 8 }}>
									Papelera de activos
								</span>
								<Button id="add" onClick={()=>history.push('/assets-dump')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-trash" />
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5) && <FormGroup className="mr-3">
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
										<input
											className="form-control"
											name="name"
											placeholder="Nombre"
											type="text"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<input
											className="form-control"
											name="serial"
											placeholder="Serial"
											type="text"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="condition"
											ref={register}>
												<option key="0" name="" value="">Condición</option>
												{
													assetsEnum.condition.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="category"
											ref={register}>
												<option key="0" name="" value="">Categoria</option>
												{
													assetsEnum.category.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="type"
											ref={register}>
												<option key="0" name="" value="">Tipo</option>
												{
													assetsEnum.type.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="status"
											ref={register}>
												<option key="0" name="" value="">Estatus</option>
												{
													assetsEnum.status.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
                                    <FormGroup className="mr-3">
										<input
											className="form-control"
											placeholder="Código"
											type="number"
											name="code"
											min="1"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="recordType"
											ref={register}>
												<option key="0" name="" value="">Tipo de registro</option>
												{
													assetsEnum.recordTypeArray.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<select 
											className="form-control"
											name="modification"
											ref={register}>
												<option key="0" name="" value="">Modificación</option>
												{
													assetsEnum.modificationArray.map((item) => {
														return <option key={item} name={item} value={item}>{item}</option>
													})
												}
										</select>
									</FormGroup>
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
									<FormGroup className="mr-3">
										<Button color="primary" disabled={loadingPage} onClick={() => { setExpandAll(!expandAll)}}>
											{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Desplegar todo
										</Button>
									</FormGroup>
								</Form>
							</>
							}
						</div>
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

export default AssetsRecordPage;