/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { departureActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal } from 'reactstrap';
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

// Lista de empresas
const companies = [
	"Principal",
	//"EMBUTIDOS MOHAN",
	//"DELICATESES EMMANUEL",
	//"DELICATESES MOMOY",
	//"DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

function DepartureListPage() {

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

	const dataDeparture = useSelector(state => state.departure.data);
	console.log('dataDeparture', dataDeparture);
    const loadingPage = useSelector(state => state.departure.loading);
	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	//Verificar data de redux
	useEffect(() => {
        if(dataDeparture && dataDeparture.results){
			setData(dataDeparture.results);
		}
		if(dataDeparture && dataDeparture.metadata && dataDeparture.metadata[0]){
			setRowCount(dataDeparture.metadata[0].total);
		}
  	},[dataDeparture]);
    
    const [rowCount, setRowCount] = useState(0);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	// Data para exportar
	const [dataExcel, setDataExcel] = useState([]);

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true
		},
		{
			name: 'Empresa',
			selector: 'company',
			sortable: true,
			wrap:true
		},
		{
			name: 'Nombres',
			selector: 'names',
			sortable: true,
			wrap:true
        },
        /*{
			name: 'Télefono',
			selector: 'phone',
			sortable: true,
        },*/
        {
			name: 'Tipo',
			selector: 'typeDescription',
			sortable: true,
        },
        {
			name: 'Comentario',
			selector: 'comment',
			sortable: true,
			wrap:true
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.total?row.total.toFixed(2):row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ '  />
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

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);


	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
			{(data.typeDescription === 'Vale') && <>
					<Table striped responsive>
						<thead>
							<tr>
								<th>Autorizado por:</th>
								<th>Retirado por:</th>
								<th>Motivo</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{data.authorizedBy ? data.authorizedBy : "no data"}</td>
								<td>{data.withdrawnBy ? data.withdrawnBy : "no data"}</td>
								<td>{data.reason ? data.reason : "no data"}</td>
								<td></td>
							</tr>
						</tbody>
					</Table>
					&emsp;
				</>
			}
			<Table striped responsive>
				<thead>
					<tr>
						<th>Producto</th>
						<th>Precio</th>
						<th>kg/unidades</th>
						<th>Sub Total</th>
					</tr>
				</thead>
				<tbody>
				{data.products && data.products.map((product, index) => {
					return (
						<tr key={index}>
							<td>{product.name}</td>
							 <td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
							<td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						</tr>
						)
					})
				}
				</tbody>
			</Table>
			{/* <Col><div className="pull-right"><b>Total: <NumberFormat value={ data.total.toFixed(2) } displayType={'text'} thousandSeparator={true} /></b> </div></Col> */}
		</>
    );

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
		dispatch(departureActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(departureActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(departureActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(departureActions.dataTable(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
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
		reset({agency:'', company:'', startDate:'', endDate:'', names:'', type:'', comment:'', phone:''})
	}

// Mapear data a un formato plano para Excel
const mapDataForExcel = (rows) => {
	return rows.map(item => ({
		Sucursal: item.agency && item.agency.name ? item.agency.name : '',
		Empresa: item.company || '',
		Nombres: item.names || '',
		Tipo: item.typeDescription || '',
		Comentario: item.comment || '',
		Total: item.total != null ? Number(item.total).toFixed(2) : '0.00',
		'Fecha de registro': item.createdDate ? moment(item.createdDate).utc().format('YYYY-MM-DD') : ''
	}));
};

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');
	const [expandAll, setExpandAll] = useState(false);

	// Exportar
	const exportExcel = () => {
		// Traer todos los registros filtrados (page 1 con pageSize grande)
		dispatch(
			departureActions.dataTable(
				getUserData(),
				1,
				perPageSelect === 0 ? 10000 : perPageSelect,
				direction,
				filters ? filters : {},
				true
			)
		);
	};

	const exportToExcel = (rows, filename = 'Salidas.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(rows);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Salidas');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};

	// Cuando llega la data para excel desde redux
	useEffect(() => {
		if (excel && excel.results) {
			const mapped = mapDataForExcel(excel.results);
			setDataExcel(mapped);
		}
	}, [excel]);

	// Disparar descarga cuando haya dataExcel
	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			exportToExcel(dataExcel);
			setDataExcel([]);
		}
	}, [dataExcel]);

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
		dispatch(departureActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}


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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Registro de Salidas</h3>
							</div>
							{(user.role===1 || user.role==3) &&
							<div>
								<span style={{fontWeight:'bold', marginRight:8}}>
									Añadir
								</span>							
								<Button id="add" onClick={()=>history.push('/departure')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
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
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
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
										<input
											className="form-control"
											name="names"
											placeholder="Nombres"
											type="text"
											ref={register}
										></input>
									</FormGroup>
                                    {/* <FormGroup className="mr-3">
										<input
											className="form-control"
											name="phone"
											placeholder="Teléfono"
											type="text"
											ref={register}
										></input>
									</FormGroup> */}
                                    <FormGroup className="mr-3">
                                        <select className='form-control' name="type"
                                            ref={register}>
                                                <option key="" name="" value="">Seleccione tipo</option>
                                                <option key="6" name="6" value="6">Degustación</option>
                                                <option key="5" name="5" value="5">Desechos</option>
                                                <option key="4" name="4" value="4">Empaques/Aserrin</option>
                                                {/* <option key="8" name="8" value="8">Vale</option> */}
                                                <option key="9" name="9" value="9">Corrección</option>
                                                <option key="10" name="10" value="10">Traslado Entre Tiendas</option>
                                                <option key="12" name="12" value="12">Recorte</option>
                                                <option key="16" name="16" value="16">Traslado a Fabrica</option>
                                        
										</select>
                                    </FormGroup>
                                    <FormGroup className="mr-3">
										<input
											className="form-control"
											name="comment"
											placeholder="Comentario"
											type="text"
											ref={register}
										></input>
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
									<FormGroup className="mr-3">
										<Button
										color="primary"
										disabled={loadingPage}
										onClick={() => {
											setExpandAll(!expandAll);
										}}
										>
										{loadingPage && (
											<span className="spinner-border spinner-border-sm mr-1"></span>
										)}{" "}
										Desplegar todo
										</Button>
									</FormGroup>
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
								expandableRowsComponent={<ExpandedComponent />}
                  				expandableRowExpanded={(row) => expandAll}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Salidas"
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
								Exportar{" "}
								{loadingExcel && (
									<span className="spinner-border spinner-border-sm mr-1"></span>
								)}
							</Button>
						)}
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

export default DepartureListPage;