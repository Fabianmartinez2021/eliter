/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions, inventoryActions } from '../../actions';
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
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 

// Lista de empresas
const companies = [
  "Principal",
  "EMBUTIDOS MOHAN",
  "DELICATESES EMMANUEL",
  "DELICATESES MOMOY",
  "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

function InventoryEntryHistoryPage() {

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

	const dataInventoryEntryHistory = useSelector(state => state.inventories.data);
	
    const loadingPage = useSelector(state => state.inventories.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataInventoryEntryHistory && dataInventoryEntryHistory.results){
			
			// Si hay comentario o nota, la fila se podra expandir
			const dataFixed = dataInventoryEntryHistory.results.map(item => {
				let disabled = false;
				if ((item.comment === '') || (item.note === '')) {
					disabled = true;
				}
				return { ...item, disabled };
			});
			setData(dataFixed);
		}
		if(dataInventoryEntryHistory && dataInventoryEntryHistory.metadata && dataInventoryEntryHistory.metadata[0]){
			setRowCount(dataInventoryEntryHistory.metadata[0].total);
		}
  	},[dataInventoryEntryHistory]);
    
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
			name: 'Empresa',
			selector: 'company',
			sortable: true,
			wrap:true,
		},
		{
			name: 'Producto',
			selector: 'product.name',
			sortable: true,
		},
		{
			name: 'Ingresos',
			selector: 'in',
			sortable: true,
			cell : (row)=>{
				return ( 
					<>
						<NumberFormat 
							value={row.in ? row.in.toFixed(3) : row.in} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'}  
						/> {' Kg'} 
					</> 
				)
			},
		},
		{
			name: 'Precio',
			selector: `product.price`,
			sortable: true,
			cell: (row) => {
				return (
					<>
						<NumberFormat 
							value={row.product?.price ? row.product.price.toFixed(2) : '0.000'} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'} 
							prefix='$ '
						/> 
					</>
				);
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell: (row) => {
				const total = row.in && row.product?.price ? row.in * row.product.price : 0;
				return (
					<>
						<NumberFormat 
							value={total.toFixed(2)} 
							displayType={'text'} 
							thousandSeparator={','} 
							decimalSeparator={'.'}
							prefix='$ '
						/> 
					</>
				);
			},
		},
		{
			name: 'Motivo',
			selector: 'typeIn',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				switch (row.typeIn){
					case 1 : return 'Por despacho'
					case 2 : return 'Proveedor externo' 
					case 3 : return 'Traslado de tienda' 
					case 4 : return 'Corrección' 
					case 5 : return 'Devolución' 
					case 6 : return 'Devolución de Mayor' 
				}
			},
		},
		{
			name: 'Nota',
			selector: 'note',
			sortable: true,
			wrap: true
		},
		{
			name: 'Comentario',
			selector: 'comment',
			sortable: true,
			wrap: true
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
		{ label: "Empresa", key: "company" },
		{ label: "Producto", key: "product.name" },
		{ label: "Ingresos(kg)", key: "in" },
		{label: "Precio", key:"product.price"},
		{ label: "Total", key: "total" },
		{ label: "Motivo", key: "motivo" }
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
		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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

	const agencyFilterWatch = watch('agency');
	useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

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
		reset({agency:'', company:'', startDate:'', endDate:'', code:''})
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

		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	//Calcular total general cuando cambie la información
		const [loadingTotal, setLoadingTotal] = useState(false);
		const [general, setGeneral] = useState(0);
		const [totalKg, setTotalKg] = useState(0);

		useEffect(() => {
			
			if (!data || data.length === 0) {
				setGeneral(0);
				setTotalKg(0);
				return;
			}
			
			setLoadingTotal(true);
		
			let sumTotalKg = 0;
			let sumTotal = 0;
		
			data.forEach((item) => {
				const kg = item.in || 0;  // Cantidad de kg
				const price = item.product?.price || 0; // Precio del producto
		
				sumTotalKg += kg;  // Acumulamos los kg totales
				sumTotal += kg * price; // Multiplicamos kg * precio y sumamos al total general
			});

			setLoadingTotal(false);
			setTotalKg(sumTotalKg);
			setGeneral(sumTotal);

		}, [data]);

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'historialdeentradas.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de entradas');

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
		if (excel && excel.results) {
			// Se crea una copia de los detalles para que estos no sean los modificados
			let fixedData = excel.results.map((item) => {
				let newItem = { ...item };
	
				// Calcular el total
				const total = newItem.in && newItem.product?.price ? (newItem.in * newItem.product.price).toFixed(2) : "0.00";
	
				newItem.in = newItem.in.toString()
									  .replace(/\,/g, '')  // Se eliminan las comas
									  .replace(".", ',');  // Se cambia el punto por coma
				
				newItem.kg = newItem.kg.toString()
									   .replace(/\,/g, '')  // Se eliminan las comas
									   .replace(".", ',');  // Se cambia el punto por coma
				
				newItem.createdDate = moment(newItem.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
	
				// Asignar el total calculado con formato correcto
				newItem.total = total.replace(".", ","); 

				  // Convertir el typeIn a su descripción correspondiente
				switch (newItem.typeIn) {
					case 1: newItem.motivo = 'Por despacho'; break;
					case 2: newItem.motivo = 'Proveedor externo'; break;
					case 3: newItem.motivo = 'Traslado de tienda'; break;
					case 4: newItem.motivo = 'Corrección'; break;
					case 5: newItem.motivo = 'Devolución'; break;
					case 6: newItem.motivo = 'Devolución de Mayor'; break;
					default: newItem.motivo = 'Desconocido'; // Manejo de valores inesperados
				}
	
				return newItem;
			});

			setDataExcel(fixedData);
		}
	}, [excel]);

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
				{ data.note && <ListGroupItemText>
						<b>Nota: </b>{ data.note }
					</ListGroupItemText>
				}
				{ data.comment && <ListGroupItemText>
						<b>Comentario: </b>{ data.comment }
					</ListGroupItemText>
				}
			</ListGroupItem>
			</ListGroup>
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de entradas</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6) && <FormGroup className="mr-3">
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
										<select
											name="company"
											ref={register}
											className="form-control"
										>
											<option value="">Seleccione empresa</option>
											{companies.map((company, index) => (
												<option key={index} value={company}>
													{company}
												</option>
											))}
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
									<FormGroup className="mr-3">
										<select
											name="searchType"
											className={'form-control'}
											ref={register}
											>
											<option name="" value="">Motivo</option>
											<option name="dispatch" value="dispatch">Por Despacho</option>
											<option name="externProvider" value="externProvider">Proveedor Externo</option>
											<option name="storeRelocation" value="storeRelocation">Traslado de Tienda</option>
											<option name="correction" value="correction">Corrección</option>
											<option name="return" value="return">Devolución</option>
											<option name="wholesaleReturn" value="wholesaleReturn">Devolución de Mayor</option>
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
						<Row xs="12">
							<Col><div className="pull-right">
								{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>} 
								<b>Total Bs: <NumberFormat value={ general ? general.toFixed(2):general } displayType={'text'} thousandSeparator={true} /></b> 
							</div>
							</Col>
						</Row>
						<Row xs="12">
							<Col><div className="pull-right">
								{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>} 
								<b>Total Kg: <NumberFormat value={ totalKg ? totalKg.toFixed(3):totalKg } displayType={'text'} thousandSeparator={true} /></b> 
							</div>
							</Col>
						</Row>
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

export default InventoryEntryHistoryPage;

// /* eslint-disable */
// import React, { useEffect, useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { userActions, inventoryActions } from '../../actions';
// import moment from 'moment';
// // core components
// import AdminNavbar from "../../components/Navbars/AdminNavbar";
// import SideBar from "../../components/SideBar/SideBar"
// import DataTable from 'react-data-table-component';
// import { Button, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup } from 'reactstrap';
// //componente dataTable
// import '../../assets/css/table.css';
// import NumberFormat from 'react-number-format';
// import { CSVLink } from "react-csv";
// import { useForm  } from "react-hook-form";
// import Datetime from 'react-datetime';
// import { Icon } from '@iconify/react';
// import fileDownload from '@iconify/icons-fa-solid/file-download';
// import { isValidDate } from '../../helpers/date';

// function InventoryEntryHistoryPage() {

//   	useEffect(() => {
// 		document.body.classList.add("landing-page");
// 		document.body.classList.add("sidebar-collapse");
// 		document.documentElement.classList.remove("nav-open");
// 		return function cleanup() {
// 			document.body.classList.remove("landing-page");
// 			document.body.classList.remove("sidebar-collapse");
// 		};
//   	});
   
// 	//usuario
//     const user = useSelector(state => state.authentication.user);
//     const dispatch = useDispatch();

// 	const dataInventoryEntryHistory = useSelector(state => state.inventories.data);
// 	console.log("data inventario de entrada", dataInventoryEntryHistory);
	
//     const loadingPage = useSelector(state => state.inventories.loading);

// 	//Verificar data de redux
// 	useEffect(() => {
// 		if(dataInventoryEntryHistory && dataInventoryEntryHistory.results){
			
// 			// Si hay comentario o nota, la fila se podra expandir
// 			const dataFixed = dataInventoryEntryHistory.results.map(item => {
// 				let disabled = false;
// 				if ((item.comment === '') || (item.note === '')) {
// 					disabled = true;
// 				}
// 				return { ...item, disabled };
// 			});
// 			setData(dataFixed);
// 		}
// 		if(dataInventoryEntryHistory && dataInventoryEntryHistory.metadata && dataInventoryEntryHistory.metadata[0]){
// 			setRowCount(dataInventoryEntryHistory.metadata[0].total);
// 		}
//   	},[dataInventoryEntryHistory]);
    
// 	// Inicializar tabla sin data
// 	const [data, setData] = useState([]);
// 	const [rowCount, setRowCount] = useState(0);

// 	//Columnas Data table
// 	const columns = [
//         {
// 			name: 'Sucursal',
// 			selector: 'agency.name',
// 			sortable: true,
// 			wrap:true,
//         },
// 		{
// 			name: 'Producto',
// 			selector: 'product.name',
// 			sortable: true,
// 		},
// 		{
// 			name: 'Ingresos',
// 			selector: 'in',
// 			sortable: true,
// 			cell : (row)=>{
// 				return  <NumberFormat value={row.in ? row.in.toFixed(3) : row.in} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
// 			},
// 		},
// 		{
// 			name: 'Total',
// 			selector: 'kg',
// 			sortable: true,
// 			cell : (row)=>{
// 				return  <NumberFormat value={row.kg ? row.kg.toFixed(3) : row.in} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
// 			},
// 		},
// 		{
// 			name: 'Motivo',
// 			selector: 'typeIn',
// 			sortable: true,
// 			wrap: true,
// 			cell : (row)=>{
// 				switch (row.typeIn){
// 					case 1 : return 'Por despacho'
// 					case 2 : return 'Proveedor externo' 
// 					case 3 : return 'Traslado de tienda' 
// 					case 4 : return 'Corrección' 
// 					case 5 : return 'Devolución' 
// 					case 6 : return 'Devolución de Mayor' 
// 				}
// 			},
// 		},
// 		{
// 			name: 'Nota',
// 			selector: 'note',
// 			sortable: true,
// 			wrap: true
// 		},
// 		{
// 			name: 'Comentario',
// 			selector: 'comment',
// 			sortable: true,
// 			wrap: true
// 		},
// 		{
// 			name: 'Fecha',
// 			selector: 'createdDate',
// 			sortable: true,
// 			cell : (row)=>{
// 				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
// 			},
// 		},
// 	];

// 	const headers = [
// 		{ label: "Fecha", key: "createdDate" },
// 		{ label: "Sucursal", key: "agency.name" },
// 		{ label: "Producto", key: "product.name" },
// 		{ label: "Ingresos", key: "in" },
// 		{ label: "Total", key: "kg" },
// 		{ label: "Motivo", key: "typeIn" }
// 	];

// 	//Consultar al entrar
// 	useEffect(() => {
// 		getDataTable(1);
// 	}, []);

// 	//Opciones de paginacion
// 	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

// 	//Loader de la tabla
// 	const CustomLoader = () => (<><div className="loading-table"></div></>);

// 	//obtener data de usuario necesaria
// 	const getUserData = () => {
// 		return {
// 			agency: user.agency.id,
// 			role:user.role,
// 			id: user.id
// 		}
// 	}

// 	//Filas por default
// 	const [perPage] = useState(10);
// 	//Cantidad de filas seleccionadas
// 	const [perPageSelect, setPerPageSelect] = useState(0);
// 	//Direccion del ordenamiento y columna
// 	const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });

// 	const getDataTable = (page) => {
// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
// 	}

// 	//Paginar
// 	const handlePageChange = async (page) => {
// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
// 	};
	
// 	//Ordenar
// 	const handleSort = (column, sortDirection) => {
// 		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
// 		setDirection(sort);
// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
// 	};

// 	//Cambiar cantidad de filas
// 	const handlePerRowsChange = async (newPerPage, page) => {
// 		setPerPageSelect(newPerPage);
// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
// 	};

// 	//Form Data Filter
// 	const { handleSubmit, register, reset } = useForm();

// 	//Abrir/Cerrar filtros
// 	const [isOpen, setIsOpen] = useState(false);
// 	const toggle = () => setIsOpen(!isOpen);

// 	//obtener sucursales para select
// 	const getting = useSelector(state => state.users.getting);
// 	const users = useSelector(state => state.users);

// 	useEffect(() => {
// 		dispatch(userActions.getListUserAgencies(getUserData()));
// 	},[]);

// 	const [listAgencies, setListAgencies] = useState(null);

// 	useEffect(() => {
// 		if(users.obtained){
// 			setListAgencies(users.list.agencies);
// 		}
// 	},[users.obtained]);

// 	const [filters, setFilters] = useState('');

// 	const handleChangeStartDate = (date) => {
// 		setStartDate(date);
// 	}

// 	const handleChangeEndDate = (date) => {
// 		setEndDate(date);
// 	}

// 	const [startDate, setStartDate] = useState('');
// 	const [endDate, setEndDate] = useState('');

// 	const clearFilters = () =>{
// 		setStartDate(''); 
// 		setEndDate(''); 
// 		reset({agency:'', startDate:'', endDate:'', code:''})
// 	}

// 	//Modal genérico y mensaje
// 	const [modalWarning, setModalWarning] = useState(false);
// 	const [modalMsg, setModalMsg] = useState('');

// 	//Consultar por filtros
// 	const onFilterData = (data, e) => {
// 		var validStartDate =  moment(data.startDate).isValid();

// 		if(data.startDate != "" && !validStartDate){
// 			setModalWarning(true);
// 			setModalMsg('Ingrese una fecha válida');
// 			return;
// 		}

// 		var validEndDate =  moment(data.endDate).isValid();

// 		if(data.endDate != "" && !validEndDate){
// 			setModalWarning(true);
// 			setModalMsg('Ingrese una fecha válida');
// 			return;
// 		}

// 		//Verificar que la fecha final sea superior o igual a la inicial
// 		var isafter = moment(data.startDate).isAfter(data.endDate);

// 		if(isafter){
// 			setModalWarning(true);
// 			setModalMsg('La fecha inicial no puede ser superior a la final');
// 			return;
// 		}

// 		var a = moment(data.startDate);
// 		var b = moment(data.endDate);
// 		let dateDiff = b.diff(a, 'days');

// 		//Si el rango de fechas es superior a los seis días abrir modal
// 		if ( dateDiff > 60 ){
// 			setModalWarning(true);
// 			setModalMsg('El rango de fechas no puede superar los 60 días');
// 			return;
// 		}

// 		setFilters(data);

// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
// 	}

// 	/*** Exportar ***/
// 	const refExcel = useRef(null);

// 	const exportExcel = () => {
// 		//El mismo método, el ultimo parametro define si es para descarga
// 		dispatch(inventoryActions.dataTableEntryHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
// 	}

// 	const excel = useSelector(state => state.download.excel);
// 	const loadingExcel = useSelector(state => state.download.loading);

// 	// Inicializar data de excel
// 	const [dataExcel, setDataExcel] = useState([]);

// 	//Verificar data de redux de la data de excel
// 	useEffect(() => {
// 		if(excel && excel.results){

// 			// Se una copia de los detalles para que estos no sean los modificados
// 			let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

// 			//Se modifican los datos antes de la descarga en excel
// 			fixedData.forEach((item) => {

// 				item.in = item.in.toString()
// 										.replace(/\,/g, '')  // se eliminan las comas
// 										.replace(".", ',');  // se cambia la coma por punto
				
// 				item.kg = item.kg.toString()
// 										.replace(/\,/g, '')  // se eliminan las comas
// 										.replace(".", ',');  // se cambia la coma por punto
				
// 				item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
// 			})

// 			setDataExcel(fixedData);
// 		}
// 	},[excel]);

// 	useEffect(() => {
// 		if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
// 			setTimeout(() => {
// 				refExcel.current.link.click();
// 				setDataExcel([]);
// 			});
// 		}
// 	},[dataExcel]);
	
// 	/*** Exportar ***/

// 	//Data al expandir una fila
// 	const ExpandedComponent = ({ data }) => (
// 		<ListGroup>
// 			<ListGroupItem>
// 				{ data.note && <ListGroupItemText>
// 						<b>Nota: </b>{ data.note }
// 					</ListGroupItemText>
// 				}
// 				{ data.comment && <ListGroupItemText>
// 						<b>Comentario: </b>{ data.comment }
// 					</ListGroupItemText>
// 				}
// 			</ListGroupItem>
// 			</ListGroup>
// 	);

//     return (
//         <>
//             <div className="d-flex" id="wrapper">
// 				<SideBar/>
// 				<div id="page-content-wrapper">
// 					<AdminNavbar/>
// 					<div className="flex-column flex-md-row p-3">

// 						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
// 							<div className="align-self-center">
// 								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Historial de entradas</h3>
// 							</div>
// 						</div>
// 						{/* Filtros */}
// 						<div className="filter">
// 							<div className="d-flex justify-content-between">
// 								<a href="#" onClick={e => {e.preventDefault(); toggle() }}>
// 									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
// 								</a>
// 								{isOpen && <a href="#" onClick={e => { e.preventDefault();  clearFilters(); }}>
// 									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
// 								</a>
// 								}	
// 							</div>
// 							{isOpen && <>
// 								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{marginTop:15}}>
//                                     {(user.role == 1 || user.role == 2 || user.role == 6) && <FormGroup className="mr-3">
//                                             {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
//                                             <select className='form-control' name="agency"
//                                                 ref={register}>
//                                                     <option key="" name="" value="">Seleccione sucursal</option>
//                                                     {listAgencies && listAgencies.map(list => 
//                                                         <option
//                                                             key={list.id}
//                                                             name={list.id}
//                                                             value={list.id}>
//                                                             {`${list.name}`}
//                                                         </option>
//                                                     )}
//                                             </select>
//                                         </FormGroup>
//                                     }
// 									<FormGroup className="mr-3">
// 										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
// 											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
// 										/>
// 									</FormGroup>
// 									<FormGroup className="mr-3">
// 										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
// 											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
// 										/>
// 									</FormGroup>
// 									<FormGroup className="mr-3">
// 										<select
// 											name="searchType"
// 											className={'form-control'}
// 											ref={register}
// 											>
// 											<option name="" value="">Motivo</option>
// 											<option name="dispatch" value="dispatch">Por Despacho</option>
// 											<option name="externProvider" value="externProvider">Proveedor Externo</option>
// 											<option name="storeRelocation" value="storeRelocation">Traslado de Tienda</option>
// 											<option name="correction" value="correction">Corrección</option>
// 											<option name="return" value="return">Devolución</option>
// 											<option name="wholesaleReturn" value="wholesaleReturn">Devolución de Mayor</option>
// 										</select>
// 									</FormGroup>
// 									<Button color="primary" type="submit" disabled={loadingPage}>
// 										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
// 									</Button>
// 								</Form>
// 							</>
// 							}
// 						</div>
// 						{/* Filtros */}
// 						<Row>
// 							<Col>
// 							<DataTable
// 								className="dataTables_wrapper"
// 								responsive
// 								striped
// 								highlightOnHover
// 								expandableRows
// 								expandableRowDisabled={row => row.disabled}
// 								expandableRowsComponent={<ExpandedComponent />}
// 								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
// 								title="Reporte de inventarios"
// 								progressPending={loadingPage}
// 								paginationComponentOptions={paginationOptions}
// 								progressComponent={<CustomLoader />}
// 								noDataComponent="No hay registros para mostrar"
// 								noHeader={true}
// 								columns={columns}
// 								data={data}
// 								pagination
// 								paginationServer
// 								paginationTotalRows={rowCount}
// 								onSort={handleSort}
// 								sortServer
// 								onChangeRowsPerPage={handlePerRowsChange}
// 								onChangePage={handlePageChange}
// 								persistTableHead
// 							/>
// 							</Col>
// 						</Row>
// 						{ data && data.length > 0 && <>
// 							<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel}> 
// 								<Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
// 							</Button>
// 							{ 
// 								dataExcel.length>0 && <>
// 									<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"HistorialDeEntrada.csv"}  style={{display:'none'}}>
// 										Exportar
// 									</CSVLink>
// 								</>
// 							}
// 							</>	
// 						}
// 						{/* Modal de notificaciones */}
// 						<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning}>
// 							<div className="modal-header">
// 							<h5 className="modal-title" id="examplemodalMsgLabel">
// 								Ventas
// 							</h5>
// 							<button
// 								aria-label="Close"
// 								className="close"
// 								type="button"
// 								onClick={() =>  {setModalWarning(false); setModalMsg('')}}
// 							>
// 								<span aria-hidden={true}>×</span>
// 							</button>
// 							</div>
// 							<div className="modal-body">
// 								<p>{modalMsg}</p>
// 							</div>
// 							<div className="modal-footer">
// 							<Button
// 								color="secondary"
// 								type="button"
// 								onClick={() =>  {setModalWarning(false); setModalMsg('')}}
// 							>
// 								Cerrar
// 							</Button>
// 							</div>
// 						</Modal>
// 					</div>
// 				</div>
//             </div>
//         </>
//     );
// }

// export default InventoryEntryHistoryPage;