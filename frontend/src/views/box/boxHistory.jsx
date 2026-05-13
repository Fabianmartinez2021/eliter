/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { boxActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function BoxHistory() {

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

	const dataBox = useSelector(state => state.box.data);
    const loadingPage = useSelector(state => state.box.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataBox && dataBox.results){
			const dataFixed = dataBox.results.map(item => {
				let disabled = false;
				if (item.comment === '') {
					disabled = true;
				}
				return { ...item, disabled };
			});
			setData(dataFixed);
		}
		if(dataBox && dataBox.metadata && dataBox.metadata[0]){
			setRowCount(dataBox.metadata[0].total);
		}
  	},[dataBox]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
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
			name: 'Divisa',
			selector: 'coinDescription',
			sortable: true,
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
			name: 'Motivo',
			selector: 'typeDescription',
			sortable: true,
		},
		{
			name: 'Ticket',
			selector: 'order',
			sortable: true,
			wrap:true,
		},
		{
			name: 'Ingresos',
			selector: 'in',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.in ? row.in.toFixed(2) : row.in} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
        {
			name: 'Egresos',
			selector: 'out',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.out ? row.out.toFixed(2) : row.out} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.total ? row.total.toFixed(2) : row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
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
		dispatch(boxActions.boxDataTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(boxActions.boxDataTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(boxActions.boxDataTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(boxActions.boxDataTableHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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
		dispatch(boxActions.boxDataTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(boxActions.boxDataTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'Historialdecaja.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de caja');

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
				
				item.total = item.total.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
				

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
	const ExpandedComponent = ({ data }) => (
		<ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading>
				<b>Usuario: </b>{ data.user.username }
				</ListGroupItemHeading>
				{data.authorization && 
					<ListGroupItemText>
						<b>Autorizó: </b>{ data.authorization }
					</ListGroupItemText>
				}
				{(data.authorizationCode && (Object.keys(data.authorizationCode).length > 0)) && <>
					<ListGroupItemText>
						<b>Generó del código: </b>{ data.authorizationCode.authorizerUser.firstName + ' ' + data.authorizationCode.authorizerUser.lastName }
					</ListGroupItemText>
					<ListGroupItemText>
						<b>Código: </b>{ data.authorizationCode.code }
					</ListGroupItemText>
				</>}
				<ListGroupItemText>
					<b>Comentario: </b>{ data.comment }
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de caja</h3>
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
										<select
											name="searchType"
											className={'form-control'}
											ref={register}
											>
											<option name="" value="">Motivo</option>
											<option name="sale" value="sale">Venta</option>
											<option name="change" value="change">Cambio</option>
											<option name="withdrawal" value="withdrawal">Retiro</option>
											<option name="addition" value="addition">Ingreso</option>
											<option name="spending" value="spending">Gasto</option>
											<option name="correction" value="correction">Corrección</option>
											<option name="resguard" value="resguard">Resguardo</option>
										</select>
									</FormGroup>
									<FormGroup className="mr-5">
										<select
											name="searchCoin"
											className={'form-control'}
											ref={register}
											>
											<option name="" value="">Moneda</option>
											<option name="bs" value="bs">Bolivares</option>
											<option name="dollar" value="dollar">Dólares</option>
											<option name="eur" value="eur">Euros</option>
											<option name="cop" value="cop">Pesos</option>
										</select>
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
					</div>
				</div>
            </div>
        </>
    );
}

export default BoxHistory;