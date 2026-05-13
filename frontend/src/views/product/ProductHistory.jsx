/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Modal, UncontrolledTooltip, Form, FormGroup } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm } from "react-hook-form";
import Datetime from 'react-datetime';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

function ProductListHistoryPage() {

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
		if (dataProducts && dataProducts.results) {
			setData(dataProducts.results);
		}
		if (dataProducts && dataProducts.metadata && dataProducts.metadata[0]) {
			setRowCount(dataProducts.metadata[0].total);
		}
	}, [dataProducts]);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
		{
			name: 'Usuario',
			selector: 'user.username',
			sortable: true,
			wrap: true,
			cell: (row) => {
				return row.user && row.user.username ? row.user.username : ''
			},
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
			cell: (row) => row.name,
		},
		{
			name: 'Presentación',
			selector: 'presentation',
			sortable: true,
		},
		{
			name: 'Merma por empaque',
			selector: 'decrease',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.decrease == true ? "Si" : "No")
			},
		},
		{
			name: 'Merma por humedad',
			selector: 'reweigh',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.reweigh == true ? "Si" : "No")
			},
		},
		{
			name: 'Merma por picadillo',
			selector: 'mincemeat',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.mincemeat == true ? "Si" : "No")
			},
		},
		{
			name: 'Precio detal',
			selector: 'price',
			sortable: true,
			cell: (row) => {
				return <NumberFormat value={row.price} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},
		},
		{
			name: 'Precio de referencia',
			selector: 'endPrice',
			omit: true,
			sortable: true,
			cell: (row) => {
				return (row.endPrice == true ? "Si" : "No")
			},
		},
		{
			name: 'Precio al mayor',
			selector: 'wholesalePrice',
			sortable: true,
			omit: true,
			cell: (row) => {
				return <NumberFormat value={row.wholesalePrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},

		},
		{
			name: 'Precio oferta de contado (mayoreo)',
			selector: 'wholesaleDiscountPrice',
			sortable: true,
			omit: true,
			cell: (row) => {
				return <NumberFormat value={row.wholesaleDiscountPrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},

		},
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell: (row) => {
				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a")
			},
		},
	];

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id,
			product: true, //consultar usuario admin/supervisor
		}
	}

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id": "createdDate", "desc": true });

	const getDataTable = (page) => {
		dispatch(productActions.dataTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(productActions.dataTableHistory(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters : {}, false));
	};

	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = { "id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(productActions.dataTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters : {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(productActions.dataTableHistory(getUserData(), page, newPerPage, direction, filters ? filters : {}, false));
	};

	//Form Data Filter
	const { handleSubmit, register, reset } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	}, []);

	const [listUsers, setListUsers] = useState(null);

	useEffect(() => {
		if (users.obtained) {
			setListUsers(users.list.users);
		}
	}, [users.obtained]);

	const [filters, setFilters] = useState('');

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const clearFilters = () => {
		setStartDate('');
		setEndDate('');
		reset({ presentation: '', startDate: '', endDate: '', code: '' })
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate = moment(data.startDate).isValid();

		if (data.startDate != "" && !validStartDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate = moment(data.endDate).isValid();

		if (data.endDate != "" && !validEndDate) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if (isafter) {
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');

		//Si el rango de fechas es superior a los seis días abrir modal
		if (dateDiff > 60) {
			setModalWarning(true);
			setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);
		dispatch(productActions.dataTableHistory(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<div className="align-self-center">
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Historial de productos</h3>
							</div>
							<div>
							{(user.role === 1) && <>
								<span style={{ fontWeight: 'bold', marginRight: 8 }}>
									Añadir
								</span>
							
								<Button id="add" onClick={() => history.push('/register-product')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
								</Button>
								</>}
							</div>
						</div>
						{/* Filtros */}
						<div className="filter">
							<div className="d-flex justify-content-between">
								<a href="#" onClick={e => { e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
									<FormGroup className="mr-3">
										<input
											style={{ minWidth: "181px" }}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={register({
												maxLength: {
													value: 50,
													message: "El código no puede superar 50 caracteres"
												}
											})}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										<select className='form-control' name="idUser"
											ref={register}>
											<option key="" name="" value="">Seleccione usuario</option>
											{listUsers && listUsers.map(list =>
												<option
													key={list.id}
													name={list.id}
													value={list.id}>
													{/* {`${list.firstName} ${list.lastName}`} */}
													{`${list.username}`}
												</option>
											)}
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<select className="form-control" name="presentation"
											ref={register}>
											<option key="" name="" value="">Seleccione presentación</option>
											<option key="kg" name="kg" value="kg">kg</option>
											<option key="Unidades" name="Unidades" value="Unidades">Unidades</option>
										</select>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }} isValidDate={isValidDate}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref: register, placeholder: "Fecha final", autoComplete: "off" }} isValidDate={isValidDate}
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
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
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
						{/* Modal de notificaciones */}
						<Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning}  className={`${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Ventas
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
									onClick={() => { setModalWarning(false); setModalMsg('') }}
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
									onClick={() => { setModalWarning(false); setModalMsg('') }}
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

export default ProductListHistoryPage;