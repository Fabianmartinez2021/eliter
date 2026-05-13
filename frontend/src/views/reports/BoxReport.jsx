/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { boxActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, Modal, Form, FormGroup, ListGroupItemHeading } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function BoxReportPage() {

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

	const dataBoxes = useSelector(state => state.box.data);
    const loadingPage = useSelector(state => state.box.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);

	//Verificar data de redux
	useEffect(() => {
		if(dataBoxes && dataBoxes.results){
			setData(dataBoxes.results);
		}
		if(dataBoxes && dataBoxes.metadata && dataBoxes.metadata[0]){
			setRowCount(dataBoxes.metadata[0].total);
		}
  	},[dataBoxes]);
    
	const [rowCount, setRowCount] = useState(0);
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
		},
		{
			name: 'Divisa',
			selector: 'coinDescription',
            sortable: true,
		},
		{
			name: 'Monto Total',
			selector: 'total',
            sortable: true,
            cell : (row)=>{
				return <Button className="btn-link" color="primary" onClick={()=>{getDetails(row.date, row.coin, row.agency)}}>
						<NumberFormat value={row.total? row.total.toFixed(2):row.total } displayType={'text'} thousandSeparator={true} />
				</Button>
			},
		},
		{
			name: 'Fecha',
			selector: 'date',
			sortable: true,
			cell : (row)=>{
				return moment(row.date).utc().format("YYYY-MM-DD")
			},
		},
	];

	//Columnas detalle
	const columnsDetail = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true
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
		},
		{
			name: 'Ingresos',
			selector: 'in',
            sortable: true,
            cell : (row)=>{
				return <NumberFormat value={row.in? row.in.toFixed(2):row.in } displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Egresos',
			selector: 'out',
            sortable: true,
            cell : (row)=>{
				return <NumberFormat value={row.out? row.out.toFixed(2):row.out } displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Total',
			selector: 'total',
            sortable: true,
            cell : (row)=>{
				return <NumberFormat value={row.total? row.total.toFixed(2):row.total } displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Fecha',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a")
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
	const [direction, setDirection] = useState({ "id":"date", "desc":true  });

	const getDataTable = (page) => {
		dispatch(boxActions.boxTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(boxActions.boxTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(boxActions.boxTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(boxActions.boxTable(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
    };

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	const [listDetail, setListDetail] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

	//Consultar detalle de monedas por fecha y tipo de moneda
	const getDetails = (date, type, agency) => {
		let data = {
			date,
			coin:type,
			agency: agency._id
		}
		dispatch(boxActions.boxDetails(data));
		//abrir modal
		setModalVisible(true);
	}

	//State de detalle
	const loadingDetail = useSelector(state => state.box.loadingDetail);
	const boxDetail = useSelector(state => state.box);

	//Actualizar estado de inventario al cambio de información
	useEffect(() => {
		if(boxDetail.successDetail){
			setListDetail(boxDetail.dataDetail.results);
		}
	},[boxDetail.successDetail]);

	//Header datatable excel
    const headers = [
        { label: "Fecha", key: "date" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Divisa", key: "coinDescription" },
		{ label: "Monto Total", key: "total" },
	];

	//Header detalle excel
	const headersDetail = [
        { label: "Fecha", key: "createdDate" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Usuario", key: "user.username" },
		{ label: "Divisa", key: "coinDescription" },
		{ label: "Motivo", key: "typeDescription" },
		{ label: "Ingresos", key: "in" },
		{ label: "Egresos", key: "out" },
        { label: "Total", key: "total" },
	];

	//limpiar data de modal
	const clearModal = () =>{
		setModalVisible(false); 
		setListDetail([]); 
	}

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
		reset({agency:'', startDate:'', endDate:''})
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
		dispatch(boxActions.boxTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar Reporte de Caja ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(boxActions.boxTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
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


	const exportToExcel = (data, filename = 'CajageneralTienda.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Caja general de la tienda');

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

			let fixedData = excel.results

			//Se modifican los datos antes de la descarga en excel
			fixedData.forEach((item) => {

				item.total = item.total.toString()
										.replace(/\,/g, '')  // se eliminan las comas
										.replace(".", ',');  // se cambia la coma por punto
			})

			setDataExcel(fixedData);
		}
	},[excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted);
			setDataExcel([]);
		}
	}, [dataExcel]);


	/*** Exportar Detalles ***/

	const refDetailsExcel = useRef(null);

	// Inicializar data de excel
	const [dataDetailsExcel, setDataDetailsExcel] = useState([]);
	
	//Verificar data de redux de la data de excel
	const exportDetailsExcel = () => {
		
		// Se una copia de los detalles para que estos no sean los modificados
		const fixedData = listDetail.map((item) => {return Object.assign({}, item)})
		
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
		})

		// Formatear con headers
    const dataFormatted = mapDataWithHeaders(fixedData, headersDetail);

    // Exportar usando XLSX
    exportToExcel(dataFormatted, 'detalleCaja.xlsx');

		setDataDetailsExcel(fixedData);
	}
		
	useEffect(() => {
		if (dataDetailsExcel && dataDetailsExcel.length > 0 && refDetailsExcel && refDetailsExcel.current && refDetailsExcel.current.link) {
			refDetailsExcel.current.link.click();
			setDataDetailsExcel([]);
		}
	},[dataDetailsExcel]);
	
	/*** Exportar ***/
	
	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<ListGroup className={darkMode ? "dark-mode" : ""}>
			<ListGroupItem className={darkMode ? "dark-mode" : ""}>
				<ListGroupItemHeading className={darkMode ? "dark-mode" : ""}>{ data.agency.name }</ListGroupItemHeading>
				<ListGroupItemText className={darkMode ? "dark-mode" : ""}>
				<b>Moneda: </b>{ data.coinDescription }
				</ListGroupItemText>
				<ListGroupItemText className={darkMode ? "dark-mode" : ""}>
					<b>Usuario: </b>{ data.user.username }
				</ListGroupItemText>
				<ListGroupItemText className={darkMode ? "dark-mode" : ""}>
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Caja general de la tienda</h3>
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
											theme={darkMode ? "dark" : "default"}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate} 
											theme={darkMode ? "dark" : "default"}
										/>
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
								
						<Modal toggle={() => {clearModal()}} isOpen={modalVisible} className={`modal-lg ${darkMode ? 'dark-mode' : ''}`} >
                            <div className="modal-header">
                            <h5 className={`modal-title ${darkMode ? 'text-white' : ''}`} id="examplemodalMsgLabel">
                                Detalle
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {clearModal()}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? 'bg-dark text-white' : ''}`}>
								<Row>
                                    <Col>
                                    <DataTable
                                        className="dataTables_wrapper"
                                        responsive
										highlightOnHover
										striped
										expandableRows
										expandableRowsComponent={<ExpandedComponent />}
                                        sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                        title="Detalle"
                                        progressPending={loadingDetail}
                                        paginationComponentOptions={paginationOptions}
                                        progressComponent={<CustomLoader />}
                                        noDataComponent="No hay registros para mostrar"
                                        noHeader={true}
                                        columns={columnsDetail}
                                        data={listDetail}
                                        pagination
                                        persistTableHead
										theme={darkMode ? "dark" : "default"}

                                    />
                                    </Col>
                                </Row>
                            </div>
                            <div className={`modal-footer ${darkMode ? 'bg-dark' : ''}`}>
								{listDetail && listDetail.length > 0 && (
									<Button
										className="btn"
										color="primary"
										onClick={() => exportDetailsExcel()}
										disabled={loadingPage}
									>
										<Icon icon={fileDownload} /> Exportar{" "}
										{loadingPage && (
											<span className="spinner-border spinner-border-sm mr-1"></span>
										)}
									</Button>
								)}
                            <Button color="secondary" type="button" onClick={() => {clearModal()}}>
                                Cerrar
                            </Button>
                            </div>
                        </Modal>
						<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? 'bg-dark' : ''}`}>
                            <h5 className={`modal-title ${darkMode ? 'text-white' : ''}`} id="examplemodalMsgLabel">
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
                            <div className={`modal-body ${darkMode ? 'bg-dark text-white' : ''}`}>
                                <p>{modalMsg}</p>
                            </div>
                            <div className={`modal-footer ${darkMode ? 'bg-dark' : ''}`}>
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

export default BoxReportPage;