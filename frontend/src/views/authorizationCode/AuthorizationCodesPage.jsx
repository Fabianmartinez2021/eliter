/* eslint-disable */
import React, { useEffect, useState, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authorizationCodeActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Alert, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import { useForm } from "react-hook-form";
import Datetime from 'react-datetime';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { Icon } from '@iconify/react';
import { CSVLink } from "react-csv";


import "../../assets/css/darkMode.css";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

const descriptionCoin = {
	1:'Bs',
	2:'$',
	3:'€',
	4:'Pesos',
}

function AuthorizationCodesPage() {

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

	const authorizationCodes = useSelector(state => state.authorizationCode.table);
	console.log('authorizationCodes', authorizationCodes);
    const loadingPage = useSelector(state => state.authorizationCode.loading);
    const deleting = useSelector(state => state.authorizationCode.deleting);
    const authorizationCode = useSelector(state => state.authorizationCode);

	//Verificar data de redux
	useEffect(() => {
		if(authorizationCodes && authorizationCodes.results){
			setData(authorizationCodes.results);
		}
		if(authorizationCodes && authorizationCodes.metadata && authorizationCodes.metadata[0]){
			setRowCount(authorizationCodes.metadata[0].total);
		}
  	},[authorizationCodes]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([])

	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
		},
		{
			name: 'Usuario creador',
			selector: 'authorizerUser',
			sortable: true,
			cell : (row)=>{
				if(row.authorizerUser){
					return row.authorizerUser.firstName + ' ' + row.authorizerUser.lastName
				}				
			},
		},
		{
			name: 'Usuario autorizado',
			selector: 'authorizedUser',
			sortable: true,
			wrap:true,
			cell : (row)=>{
				if(row.authorizedUser){
					return row.authorizedUser.firstName + ' ' + row.authorizedUser.lastName
				}				
			},
		},
		
		{
			name: 'Código',
			selector: 'code',
			sortable: true
		},
		{
			name: 'Monto',
			selector: 'boxWithdrawalData',
			sortable: true,
			cell: (row) => {
				if(row.boxWithdrawalData){
					const { amount, coin } =  row.boxWithdrawalData;
					const coinName = descriptionCoin[coin] || 'Desconocido';
					return `${amount.toFixed(2)} ${coinName}`
				}else{
					return ''
				}
			},
		},
		{
			name: 'Creado',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				if(row.createdDate){
					return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a")
				}else{
					return ''
				}
				
			},
		},
		{
			name:'Utilizado',
			selector: 'updateDate',
			sortable: true,
			cell : (row)=>{
				if(row.updateDate){
					return moment(row.updateDate).utc().format("YYYY-MM-DD hh:mm:ss a")
				}else{
					return 'Aun no a sido utilizado'
				}
				
			},
		},
		( user.role !== 10 && {
		 name: '',
		 button: true,
		 cell: row => {
			return <><Button color="primary btn-round" size="sm" style={{fontSize:12}} disabled={deleting || row.status} onClick={e => 
				{
					setDeleteModalOpen(true);
					setDataToDelete(row);
				}
			}>{deleting && <span className="spinner-border spinner-border-sm mr-1"></span>}<i className="fa fa-trash" aria-hidden="true"></i>
			</Button>
		</>
		 },
	   }),
	];

	const headers = [
		{ label: "Fecha creacion", key: "createdDate" },
		{ label: "Fecha utilizacion", key: "updateDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Usuario creador", key: "authorizerUser.fullName" },
		{ label: "Usuario autorizado ", key: "authorizedUser.fullName" },
		{ label: "Codigo", key: "code" },
		{ label: "Monto", key: "boxWithdrawalData.amountWithSymbol" },
		{ label: "Comentario", key: "comment" },
	];


	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}
	//Consultar al entrar
	useEffect(() => {
		getDataTable(1);
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);


	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });

	const getDataTable = (page) => {
		dispatch(authorizationCodeActions.getCodes(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(authorizationCodeActions.getCodes(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(authorizationCodeActions.getCodes(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(authorizationCodeActions.getCodes(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
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
	},[alert]);

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
		dispatch(authorizationCodeActions.getCodes(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}
	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(authorizationCodeActions.getCodes(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}


	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(excel && excel.results){

			

			// // Se una copia de los detalles para que estos no sean los modificados
			let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

			// //Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {
				item.authorizerUser.fullName = `${item.authorizerUser.firstName} ${item.authorizerUser.lastName}`;
				item.authorizedUser.fullName = `${item.authorizedUser.firstName} ${item.authorizedUser.lastName}`;
	
				item.boxWithdrawalData.amount = item.boxWithdrawalData.amount.toFixed(2)
				const coinSymbol = descriptionCoin[item.boxWithdrawalData.coin] || 'N/A'; // Si no existe el valor en descriptionCoin, poner 'N/A'
				item.boxWithdrawalData.amountWithSymbol = `${item.boxWithdrawalData.amount} ${coinSymbol} `;  // Ejemplo: '$ 200.00'
	
				

				item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
				item.updateDate ? item.updateDate = moment(item.updateDate).utc().format("YYYY-MM-DD hh:mm:ss a") : item.updateDate = 'Aun no a sido utilizado';
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

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => {
		
		return 	<>
			<ListGroup>
				<ListGroupItem>
					<ListGroupItemText>
						<b>Comentario: </b>{ data.comment ?  data.comment : ''}
					</ListGroupItemText>
				</ListGroupItem>
			</ListGroup>
		</>
	};
	
	const conditionalRowStyles = [
		{
		  when: row => row.status === false,
		  	style: {
				backgroundColor: 'rgba(255, 199, 199)',
			},
		},
	  ];

	// ELIMINAR UN CÓDIGO
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [dataToDelete, setDataToDelete] = useState(null);
	
	const deleteCode = (data) => {
		dispatch(authorizationCodeActions.deleteCode(data._id));
	}
	
	const cleanDeleteData = () => {
		setDeleteModalOpen(false);
		setDataToDelete(null);
	}

	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(authorizationCode.deleted){
			cleanDeleteData();
			setData([])
			getDataTable(1);
		}
	},[authorizationCode.deleted]);


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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic' , marginBottom:0}}>Códigos de autenticación</h3>
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
								expandableRowDisabled={row => row.disabled}
								expandableRowsComponent={<ExpandedComponent />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Reporte de inventarios"
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
								conditionalRowStyles={conditionalRowStyles}
								theme={darkMode ? "dark" : "default"}
							/>
							</Col>
						</Row>
						
						{  Array.isArray(data) && data.length > 0 &&
						 <>
							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel}> 
								<Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
							</Button>
							{ 
								dataExcel.length>0 && <>
									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"HistorialDeCodigosDeAutorizacion.csv"}  style={{display:'none'}}>
										Exportar
									</CSVLink>
								</>
							}
							</>	
						  } 
						{/* Modal de confirmación de eliminación del código */}
						<Modal toggle={() => { cleanDeleteData() }} isOpen={deleteModalOpen} className={`${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
							<h5 className="modal-title" id="examplemodalMsgLabel">
								Eliminar código
							</h5>
							<button
								aria-label="Close"
								className="close"
								type="button"
								onClick={() =>  { cleanDeleteData() }}
							>
								<span aria-hidden={true}>×</span>
							</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								{ dataToDelete ? <p>Desea eliminar el código asignado a  { dataToDelete.authorizedUser.firstName + ' ' +  dataToDelete.authorizedUser.lastName } de la agencia { dataToDelete.agency.name }</p> : ''}
								<div className="d-flex justify-content-between">
									<Button color="primary" disabled={deleting} onClick={() => {deleteCode(dataToDelete);}} >
										{deleting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										Confirmar eliminación
									</Button>
									<Button color="secondary" type="button" onClick={() =>  { cleanDeleteData()}} >
										Cerrar
									</Button>
								</div>
							</div>
						</Modal>
					</div>
				</div>
            </div>
        </>
    );
}

export default AuthorizationCodesPage;