/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resguardActions, userActions} from '../../actions';
import { resguardConfirmMultipleWithdrawals } from '../../actions/resguard.actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Badge, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { Role, history } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function WithdrawalReportPage() {

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

	const dataResguard = useSelector(state => state.resguard.table);
    const loadingPage = useSelector(state => state.resguard.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataResguard && dataResguard.results){
			setData(dataResguard.results);
		}
		if(dataResguard && dataResguard.metadata && dataResguard.metadata[0]){
			setRowCount(dataResguard.metadata[0].total);
		}
  	},[dataResguard]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [rowCount, setRowCount] = useState(0);
	const [selectedRows, setSelectedRows] = useState([]);
	const [modalVisible, setModalVisible] = useState(false);
	
	const selectAllRows = () => {
		const allIds = data.map(row => row._id);  // Obtener los IDs de todas las filas
		setSelectedRows(allIds);  // Establecer todos los IDs como seleccionados
	};


	const toggleSelection = (id) => {
		setSelectedRows(prevSelected => 
			prevSelected.includes(id) ? prevSelected.filter(rowId => rowId !== id) : [...prevSelected, id]
		);
	};

	const handleConfirmClick = () => {
		setModalMsg("¿Estás seguro de aplicar todas las confirmaciones?");
		setModalVisible(true);
	};

	const confirmMultiplesWithdrawals = () => {
		setModalVisible(false);
		const selectedIds = selectedRows.filter(id => id);

		if (selectedIds.length === 0) {
			console.error("No hay IDs válidos para confirmar.");
			return;
		}
	
		dispatch(resguardActions.resguardConfirmMultipleWithdrawals(getUserData(),selectedIds));
	
		getDataTable(1); 
		setSelectedRows([]);
	};

	const shouldShowStatusColumn = data.some(row => !row.confirmationStatus);
		
	//Columnas Data table
	const columns = [
        {
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
        },
		{
			name: 'Bolívares',
			selector: 'amountBs',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.amountBs ? row.amountBs.toFixed(2) : row.amountBs} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Bs ' />
			},
		},
		{
			name: 'Dólares',
			selector: 'amountDollar',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.amountDollar ? row.amountDollar.toFixed(2) : row.amountDollar} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},
		},
		{
			name: 'Euros',
			selector: 'amountEur',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.amountEur ? row.amountEur.toFixed(2) : row.amountEur} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Eur ' />
			},
		},
		{
			name: 'Pesos',
			selector: 'amountCop',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.amountCop ? row.amountCop.toFixed(2) : row.amountCop} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Cop ' />
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
			selector: 'confirmationStatus',
			sortable: true,
			cell : (row)=>{
				return <>
					<Badge color={row.confirmationStatus ? "success" : "danger"} pill className="h6 p-2 mt-1">
						{
							row.confirmationStatus ? "CONFIRMADO" : "PENDIENTE"
						}
					</Badge>
				</>
			},
        },
		// {
		// 	name: 'Confirmar',
		// 	sortable: true,
		// 	omit: user.role !== Role.Admin && user.role !== Role.AuditorGeneral,	// Unicamente los administradores pueden realizar las confirmaciones de los retiros
		// 	cell : (row)=>{
		// 		if(user.role === Role.Admin || user.role === Role.AuditorGeneral){
		// 			return 	(row.confirmationStatus === false) && <Button color="primary" type="submit" disabled={loadingPage} onClick={e => 
		// 				{
		// 					e.preventDefault(); 
		// 					history.push('/resguard-confirm-withdrawal',{id:row._id})
		// 				}}>
		// 						{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Confirmar
		// 					</Button>
		// 		}
		// 	},
		// },
		{
			sortable: true,
			omit: user.role !== Role.Admin && user.role !== Role.AuditorGeneral,
			cell: (row) => ( 
				!row.confirmationStatus && (
					<input className='w-50' type="checkbox" checked={selectedRows.includes(row._id)} onChange={() => toggleSelection(row._id)} 
					/>
	
				)
			),
			ignoreRowClick: true,
			allowOverflow: true,
			button: true,
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
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(resguardActions.resguardWithdrawalsTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'RetirosporConfirmar.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Retiros por confirmar');

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

				item.in = item.in.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				item.out = item.out.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				
				// item.total = item.total.toString()
				// 						.replace(/\,/g, '')  // se eliminan las comas
				// 						.replace(".", ',');  // se cambia la coma por punto
				

				item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
			})

			setDataExcel(fixedData);
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

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => {
		return <ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading>
				<b>Gerente que envió el dinero: </b>{ data.user.firstName + ' ' +  data.user.lastName}
				</ListGroupItemHeading>
				<ListGroupItemHeading>
					<b>Responsable de entregar el dinero: </b>{ data.responsible }
				</ListGroupItemHeading>
				<ListGroupItemText>
					<b>Comentario: </b>{ data.comment }
				</ListGroupItemText>
				<ListGroupItemHeading>
					<b>Usuario que confirmó: </b>{ data.confirmationUser ? data.confirmationUser.username : '' }
				</ListGroupItemHeading>
				<ListGroupItemHeading>
					<b>Fecha de Confirmación: </b>{ data.confirmationUser ? moment(data.confirmationDate).utc().format("YYYY-MM-DD hh:mm:ss a") : '' }
				</ListGroupItemHeading>
			</ListGroupItem>
		</ListGroup>
	};
	
	const conditionalRowStyles = [
		{
		  when: row => row.out === true && row.confirmationStatus === false,
		  	style: {
				backgroundColor: 'rgba(255, 199, 199)',
			},
		},
		{
		  when: row => row.out === true && row.confirmationStatus === true,
		  	style: {
				backgroundColor: 'rgba(232, 255, 232)',
			},
		},
	  ];

	

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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Retiros de caja fuerte por confirmar</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
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
												name="showAll"
												id="showAll"
												type="checkbox"
												value={true}
												ref={register}/> Ver todo
										</label>
									</FormGroup>
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						{(user.role === 1 || user.role === 10) && (
						<div className="d-flex justify-content-end">
						<Button color="primary" onClick={handleConfirmClick} disabled={selectedRows.length === 0} className="me-4">
							{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>}
							Confirmar Seleccionados
						</Button>
						<Button color="primary" onClick={selectAllRows}>
							Seleccionar Todos
						</Button>
						</div>
						)}
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
						{/* Modal de notificaciones */}
						<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
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
						<Modal isOpen={modalVisible} toggle={() => setModalVisible(false)}>
							<div className='modal-header'>
							<div className="modal-title" toggle={() => setModalVisible(false)}>Confirmación</div>
							
							</div>
							<div className='modal-body'>
								{modalMsg}
							</div>
							<div className='modal-footer'>
								<Button color="danger" onClick={() => setModalVisible(false)}>Cancelar</Button>
								<Button color="success" onClick={confirmMultiplesWithdrawals}>Confirmar</Button>
							</div>
						</Modal>
					</div>
				</div>
            </div>
        </>
    );
}

export default WithdrawalReportPage;