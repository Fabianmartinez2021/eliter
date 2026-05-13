/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousInventoryWeeklyActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Col, Modal, Form, FormGroup } from 'reactstrap';
import NumberFormat from 'react-number-format';
import { useForm } from "react-hook-form";
import Datetime from 'react-datetime';
import { Role } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { validateDateRange } from '../../helpers';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import '../../assets/css/table.css';
import { CSVLink } from "react-csv";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function InventoryWeeklyKpiPage() {

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
	const dataInventories = useSelector(state => state.miscellaneousInventoryWeekly.data);
	const loadingPage = useSelector(state => state.miscellaneousInventoryWeekly.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	// Data para exportar
	const [dataExcel, setDataExcel] = useState([]);
	const refExcel = useRef(null);

	// Verificar data de redux
	useEffect(() => {
		if (dataInventories && dataInventories.results) {
			setData(dataInventories.results);
		} else {
			setData([]);
		}
	}, [dataInventories]);

	// Preparar data para exportar (formato plano)
	useEffect(() => {
		if (data && data.length > 0) {
			const mapped = data.map(item => ({
				code: item.product && item.product.code ? item.product.code : '',
				name: item.product && item.product.name ? item.product.name : '',
				totalUsed: item.totalUsed != null ? item.totalUsed : 0,
			}));
			setDataExcel(mapped);
		} else {
			setDataExcel([]);
		}
	}, [data]);

	const headers = [
		{ label: "Cod. Producto", key: "code" },
		{ label: "Producto", key: "name" },
		{ label: "Usado", key: "totalUsed" },
	];

	// Columnas de la tabla (lista semanal de uso)
	const columns = [
		{
			name: 'Cod. Producto',
			selector: 'product.code',
			sortable: true,
		},
		{
			name: 'Producto',
			selector: 'product.name',
			sortable: true,
			wrap: true,
		},
		{
			name: 'Usado',
			selector: 'usedAdjustment',
			sortable: true,
			cell: (row) => (
				<NumberFormat
					value={row.usedAdjustment != null ? row.usedAdjustment : 0}
					displayType={'text'}
					thousandSeparator={','}
					decimalSeparator={'.'}
				/>
			),
		},
	];

	// Opciones de paginación
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	// Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Datos para consulta
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id
		}
	}

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(true);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	}, []);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if (users.obtained) {
			setListAgencies(users.list.agencies);
		}
	}, [users.obtained]);

	const [filters, setFilters] = useState('');

	const [startDate, setStartDate] = useState('');

	// Solo permitir selección de lunes (inicio de semana)
	const isValidWeekStart = (current) => {
		return isValidDate(current) && current.isoWeekday() === 1;
	};

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const clearFilters = () => {
		setStartDate('');
		reset({ agency: '', startDate: '', code: '' })
		setFilters('');
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Consultar por filtros
	const onFilterData = (data, e) => {
		// La fecha seleccionada debe ser lunes; generamos el domingo automáticamente
		if (!data.startDate) {
			setModalWarning(true);
			setModalMsg('Debe seleccionar una fecha de inicio (lunes).');
			return;
		}

		// Validar sucursal obligatoria cuando el usuario tiene acceso al selector de agencias
		if (
			(user.role == Role.Admin ||
				user.role == Role.Supervisor ||
				user.role == Role.Auditor ||
				user.role == Role.suplyRole) &&
			(!data.agency || data.agency === '')
		) {
			setModalWarning(true);
			setModalMsg('Debe seleccionar una sucursal.');
			return;
		}

		const start = moment(data.startDate).format('YYYY-MM-DD');
		const end = moment(start).add(6, 'days').format('YYYY-MM-DD');

		const validation = validateDateRange(start, end, 120);
		if (!validation.isValid) {
			setModalWarning(true);
			setModalMsg(validation.message);
			return;
		}

		const filtersToSend = {
			agency: data.agency || user.agency.id,
			code: data.code,
			startDate: start,
			endDate: end
		};

		setFilters(filtersToSend);
		// página fija 1, tamaño fijo 50 (lista acotada por semana)
		const sort = { id: "date", desc: true };
		dispatch(miscellaneousInventoryWeeklyActions.dataTableWeekly(getUserData(), 1, 50, sort, filtersToSend));
	}

	// Cargar por defecto la última semana del usuario actual
	useEffect(() => {
		// Semana actual: lunes a domingo
		const start = moment().startOf('isoWeek').format("YYYY-MM-DD");
		const end = moment(start).add(6, 'days').format("YYYY-MM-DD");
		setStartDate(start);

		const defaultFilters = { startDate: start, endDate: end, code: '', agency: user.agency.id };
		setFilters(defaultFilters);
		const sort = { id: "date", desc: true };
		dispatch(miscellaneousInventoryWeeklyActions.dataTableWeekly(getUserData(), 1, 50, sort, defaultFilters));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const _defaultAgencyWatch = watch('agency');

	useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<div className="align-self-center">
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Consumo semanal de suministros</h3>
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
									{(user.role == Role.Admin || user.role == Role.Supervisor || user.role == Role.Auditor || user.role == Role.suplyRole) && <FormGroup className="mr-3">
										{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										<select className='form-control' name="agency"
											ref={register}>
                                            <option value="">Todas las sucursales</option>
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
											style={{ minWidth: "181px" }}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime
											timeFormat={false}
											dateFormat={'YYYY-MM-DD'}
											closeOnSelect
											onChange={handleChangeStartDate}
											value={startDate}
											inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha (lunes)", autoComplete: "off" }}
											isValidDate={isValidWeekStart}
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

						{/* Lista semanal de uso de suministros */}
						<Row className="mt-4">
							<Col>
								<DataTable
									className="dataTables_wrapper"
									striped
									responsive
									highlightOnHover
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
									title="Consumo semanal de suministros"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="No hay registros para mostrar"
									noHeader={true}
									columns={columns}
									data={data}
									pagination
									persistTableHead
									theme={darkMode ? "dark" : "default"}
								/>
							</Col>
						</Row>

						<Row className="mt-3">
							<Col>
								<div>
									{data && data.length > 0 &&
										<>
											<Button className="btn" color="primary" onClick={(e) => { e.preventDefault(); refExcel && refExcel.current && refExcel.current.link && refExcel.current.link.click(); }}>
												<Icon icon={fileDownload} /> Exportar
											</Button>
											{dataExcel && dataExcel.length > 0 &&
												<CSVLink
													ref={refExcel}
													data={dataExcel}
													separator={";"}
													headers={headers}
													filename={"ConsumoSemanalSuministros.csv"}
													style={{ display: 'none' }}
												>
													Exportar
												</CSVLink>
											}
										</>
									}
								</div>
							</Col>
						</Row>
					</div>

					{/* Modal de notificaciones */}
					<Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
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
		</>
	);
}

export default InventoryWeeklyKpiPage;
