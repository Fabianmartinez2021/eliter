/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { assetsActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Col, Form, FormGroup, Modal, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText, Alert} from 'reactstrap';
//componente dataTable sede
import { Role, history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import assetsEnum from '../../enums/assets.enum';	
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function AssetsDumpListPage() {

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

	const dataAssets = useSelector(state => state.assets.table);
    const loadingPage = useSelector(state => state.assets.loading);
    const assets = useSelector(state => state.assets);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Verificar data de redux
	useEffect(() => {
		if(dataAssets && dataAssets.results){
			setData(dataAssets.results);
		}
		if(dataAssets && dataAssets.metadata && dataAssets.metadata[0]){
			setRowCount(dataAssets.metadata[0].total);
		}
  	},[dataAssets]);
  
	
	const [rowCount, setRowCount] = useState(0)
	//Columnas Data table
	const columns = [
		{
			name: 'Usuario que eliminó',
			selector: 'deletionUser.username',
			sortable: false,
            wrap:true,
		},
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: false,
            wrap:true,
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
			name: 'Dias en reparación',
			selector: 'daysUnderRepair',
			sortable: true,
            wrap:true,
			cell : (row)=>{
				return  <NumberFormat value={row.daysUnderRepair ? row.daysUnderRepair : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
		{
			name: 'Fecha de Eliminación',
			selector: 'deletionDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD");
			},
		},
	   	{
			name: '',
			button: true,
			cell: row => {
				if((user.role === 1) || (user.role === 2)){
					return <><Button color="primary btn-round" size="sm" style={{fontSize:12}} disabled={loadingPage || restoringAssets} onClick={e => 
								{
									setRestoreModalOpen(true);
									setDataToRestore(row);
								}
							}>{restoringAssets && <span className="spinner-border spinner-border-sm mr-1"></span>}Restaurar
							</Button>
						</>
				}
			},
	  	},
	];
	
	const headers = [
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Código", key: "code" },
		{ label: "Serial", key: "serial" },
		{ label: "Nombre", key: "name" },
		{ label: "Condición", key: "condition" },
		{ label: "Tipo", key: "type" },
		{ label: "Categoria", key: "category" },
		{ label: "Valor", key: "price" },
		{ label: "Status", key: "status" },
		{ label: "Fecha de registro", key: "createdDate" },
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
		dispatch(assetsActions.getDumpList(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(assetsActions.getDumpList(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(assetsActions.getDumpList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(assetsActions.getDumpList(getUserData(), page, newPerPage, direction, filters ? filters: {}));
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
		dispatch(assetsActions.getDumpList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data));
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();


	const clearFilters = () =>{
		reset({ startDate:'', endDate:''})
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [expandAll, setExpandAll] = useState(false);


	// RESTAURAR UN ACTIVO
	const [restoreModalOpen, setRestoreModalOpen] = useState(false);
	const [dataToRestore, setDataToRestore] = useState(null);
	
    const restoringAssets = useSelector(state => state.assets.restoring);

	const restoreAsset = (data) => {
		dispatch(assetsActions.restoreAssets(data._id, user));
	}
	
	const cleanRestoreData = () => {
		setRestoreModalOpen(false);
		setDataToRestore(null);
	}
	
	//Verificar data de redux de la data de excel
	useEffect(() => {
		if(assets.restored){
			cleanRestoreData();
			setData([])
			dispatch(assetsActions.getDumpList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters));
		}
	},[assets.restored]);



	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading><b>Usuario que ingresó el activo: </b>{ data.user.firstName + ' ' + data.user.lastName }</ListGroupItemHeading>
				<ListGroupItemText>
					<b>Descripción del activo: </b>{ data.description }
				</ListGroupItemText>
			</ListGroupItem>
	  	</ListGroup>
	);
	
	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(assetsActions.getDumpList(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'Papeleradeactivos.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Papelera de activos');

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
			setDataExcel(excel.results);
		}
	},[excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted); // Ya no se hace click en CSVLink
			setDataExcel([]);
		}
	}, [dataExcel]);
	
	/*** Exportar ***/
	
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Papelera de activos</h3>
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
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible}>
                            <div className="modal-header">
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
                            <div className="modal-body">
                                <p>{modalMsg}</p>
                            </div>
                            <div className="modal-footer">
                            <Button
                                color="secondary"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
                                Cerrar
                            </Button>
                            </div>
                        </Modal>
						
						{/* Modal de confirmación de restauración del activo */}
						<Modal toggle={() => { cleanRestoreData() }} isOpen={restoreModalOpen}>
							<div className="modal-header">
							<h5 className="modal-title" id="examplemodalMsgLabel">
								Restaurar activo
							</h5>
							<button
								aria-label="Close"
								className="close"
								type="button"
								onClick={() =>  { cleanRestoreData() }}
							>
								<span aria-hidden={true}>×</span>
							</button>
							</div>
							<div className="modal-body">
								<p>Desea restaurar el activo { dataToRestore ? dataToRestore.name : ''} de la agencia {dataToRestore ? dataToRestore.agency.name : ''}</p>
								
								<div className="d-flex justify-content-between">
									<Button color="primary" disabled={restoringAssets} onClick={() => {restoreAsset(dataToRestore);}} >
										{restoringAssets && <span className="spinner-border spinner-border-sm mr-1"></span>}
										Confirmar restauración
									</Button>
									<Button color="secondary" type="button" onClick={() =>  { cleanRestoreData()}} >
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

export default AssetsDumpListPage;