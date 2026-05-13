/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { offerActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Form, FormGroup, Modal, Alert } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm } from "react-hook-form";
import Datetime from 'react-datetime';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OfferListPage() {

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

	//Alertas
	const alert = useSelector(state => state.alert);
	//Mostrar alertas
	const [visible, setVisible] = useState(true);
	const [timeoutID, setTimeoutID] = useState(null);

	const onDismiss = () => {
		setVisible(false);

		//Limpiar timeout al cerrar la alerta
		if (timeoutID && typeof timeoutID == "number") {
			window.clearTimeout(timeoutID);
			setTimeoutID(null)
		}
	}

	useEffect(() => {
		if (alert.message) {
			setVisible(true);
			let timeout = window.setTimeout(() => { setVisible(false) }, 5000);
			setTimeoutID(timeout);
		}
	}, [alert]);

	//usuario
	const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();

	const dataOffers = useSelector(state => state.offer.data);
	const loadingPage = useSelector(state => state.offer.loading);

	//Verificar data de redux
	useEffect(() => {
		if (dataOffers) {
			setData(dataOffers.results);
		}
	}, [dataOffers]);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap: true,
		},
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
			name: 'Precio regular',
			selector: 'regularPrice',
			sortable: true,
			cell: (row) => {
				return <NumberFormat value={row.regularPrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
		{
			name: 'Precio oferta',
			selector: 'price',
			sortable: true,
			cell: (row) => {
				return <NumberFormat value={row.price} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} />
			},
		},
		{
			name: 'Comentario',
			selector: 'comment',
			sortable: true,
			wrap: true,
		},
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell: (row) => {
				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a")
			},
		},
		{
			name: '',
			button: true,
			omit: user.role != 1,
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => {
				e.preventDefault();
				onDismiss();
				setItemRemove(row);
				setModalVisible(true);
				setModalMsg(`Desea eliminar ${row.product.name} de las ofertas?`);
			}
			}><i className="fa fa-trash"></i></Button>,
		},
	];

	//data inicial
	const getDataTable = () => {
		dispatch(offerActions.dataTable(getUserData()));
	}

	const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id,
			admin: true, //consultar usuario admin/supervisor/gerente
		}
	}

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
	const users = useSelector(state => state.users);

	useEffect(() => {
		dispatch(userActions.getListUserAgencies(getUserData()));
	}, []);

	const [listAgencies, setListAgencies] = useState(null);
	const [listUsers, setListUsers] = useState(null);

	useEffect(() => {
		if (users.obtained) {
			setListUsers(users.list.users);
			setListAgencies(users.list.agencies);
		}
	}, [users.obtained]);

	//Consultar por filtros
	const onFilterData = (data, e) => {

		//validar objeto no vacio
		if (Object.keys(data).length !== 0) {
			let formDate = moment();
			if (data.startDate != "") {
				formDate = moment(data.startDate).utc().format("YYYY-MM-DD");
			}
			if (dataOffers && dataOffers.results) {

				setData(dataOffers.results.filter(item => (
					//Solo admin y supervisor filtran por sucursal
					user.role == 1 || user.role == 2 ?
						(data.agency !== "" ? item.agency.id && item.agency.id.toString().toLowerCase().includes(data.agency.toLowerCase()) : true)
						&& (data.code !== "" ? item.product.code && item.product.code.toString().toLowerCase() == data.code.toLowerCase() : true)
						&& (data.startDate !== "" ? moment(item.createdDate).utc().format("YYYY-MM-DD") == formDate : true)
						&& (data.idUser !== "" ? item.user.id && item.user.id.toString().toLowerCase() == data.idUser.toLowerCase() : true)
						&& (data.comment !== "" ? item.comment && item.comment.toLowerCase().includes(data.comment.toLowerCase()) : true)
						:
						(data.code !== "" ? item.product.code && item.product.code.toString().toLowerCase() == data.code.toLowerCase() : true)
						&& (data.startDate !== "" ? moment(item.createdDate).utc().format("YYYY-MM-DD") == formDate : true)
						&& (data.idUser !== "" ? item.user.id && item.user.id.toString().toLowerCase() == data.idUser.toLowerCase() : true)
						&& (data.comment !== "" ? item.comment && item.comment.toLowerCase().includes(data.comment.toLowerCase()) : true)
				)
				));
			}
		}
	};

	//Form filtros
	const { handleSubmit: handleSubmitFilter, register: registerFilter, reset: resetFilter, setValue, watch } = useForm();

	const clearFilters = () => {
		setResetPaginationToggle(!resetPaginationToggle);
		resetFilter({ agency: '', code: '', startDate: '' });
		if (dataOffers && dataOffers.results) {
			setData(dataOffers.results);
		}
		onDismiss();
	}

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}
	const [startDate, setStartDate] = useState('');

	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [itemRemove, setItemRemove] = useState(null);

	useEffect(() => {
		if (!modalVisible) {
			setItemRemove(null);
		}
	}, [modalVisible]);

	//State de eliminacion de la oferta
	const deletingOffer = useSelector(state => state.offer.deleting);

	//Eliminar oferta
	const removeOffer = () => {
		let id = itemRemove.id;
		dispatch(offerActions.removeOffer(id, getUserData()));
	}

	const successDeleted = useSelector(state => state.offer.successDeleted);

	//Si el registro fue eliminado correctamente se cierra el modal
	//y se coloca nulo la fila o item seleccionado
	useEffect(() => {
		if (successDeleted) {
			setModalVisible(false);
			setItemRemove(null);
			//filtrar en dado caso
			handleSubmitFilter(onFilterData)();
		}
	}, [successDeleted]);

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
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Ofertas</h3>
							</div>
							<div className=' d-flex justify-content-between flex-row'>
							{ user.role === 1 && (
								<div className='mr-2'>
									<span style={{ fontWeight: 'bold', marginRight: 8 }}>
										Crear Oferta
									</span>
									<Button onClick={() => history.push('/create-offer')} className="btn-round btn-icon" color="primary">
										<i className="fa fa-plus" />
									</Button>
								</div>
								)}
								<div>
									<span style={{ fontWeight: 'bold', marginRight: 8 }}>
										Historial
									</span>
									<Button onClick={() => history.push('/offer-history')} className="btn-round btn-icon" color="primary">
										<i className="fa fa-undo" />
									</Button>
								</div>
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
								<a href="#" onClick={e => { e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmitFilter(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
									{(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 10) && <FormGroup className="mr-3">
										{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										<select className='form-control' name="agency"
											ref={registerFilter}>
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
										{getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
										<select className='form-control' name="idUser"
											ref={registerFilter}>
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
										<input
											style={{ minWidth: "181px" }}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={registerFilter}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<input
											className="form-control"
											name="comment"
											placeholder="Comentario"
											type="text"
											ref={registerFilter}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											inputProps={{ name: 'startDate', ref: registerFilter, placeholder: "Fecha", autoComplete: "off" }} isValidDate={isValidDate}
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
									highlightOnHover
									striped
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
									title="Productos"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="No hay registros para mostrar"
									noHeader={true}
									columns={columns}
									data={data}
									pagination
									paginationResetDefaultPage={resetPaginationToggle} // optionally, a hook to reset pagination to page 1
									persistTableHead
									theme={darkMode ? "dark" : "default"}
								/>
							</Col>
						</Row>
						<Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible} backdrop="static">
							<div className="modal-header">
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Ofertas
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
									onClick={() => { setModalVisible(false); setModalMsg('') }}
								>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className="modal-body">
								<p>{modalMsg}</p>
							</div>
							<div className="modal-footer">
								<Button color="primary" disabled={deletingOffer} onClick={() => removeOffer()}>
									{deletingOffer && <span className="spinner-border spinner-border-sm mr-1"></span>}
									Eliminar
								</Button>
								<Button color="secondary" type="button" onClick={() => { setModalVisible(false); setModalMsg('') }} disabled={deletingOffer}>
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

export default OfferListPage;