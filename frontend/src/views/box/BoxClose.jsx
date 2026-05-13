/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { boxActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, Modal, Form, FormGroup, ListGroupItemHeading, Table, Label, Alert } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm, Controller } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import checkIcon from '@iconify/icons-fa-solid/check';
import timesIcon from '@iconify/icons-fa-solid/times';
import { getUrlBoxWhatsapp } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function BoxClosePage() {

	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
	});

	const formatter = new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2
	})

	//Modo oscuro 
	const { darkMode} = useDarkMode();

	//usuario
	const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();

	//Alertas
	const alert = useSelector(state => state.alert);
	//Mostrar alertas
	const [visible, setVisible] = useState(true);
	const onDismiss = () => setVisible(false);

	useEffect(() => {
		if (alert.message) {
			setVisible(true);
			window.setTimeout(() => { setVisible(false) }, 5000);
		}
	}, [alert]);

	const dataBoxes = useSelector(state => state.box.data);
	const loadingPage = useSelector(state => state.box.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([]);

	//Verificar data de redux
	useEffect(() => {
		if (dataBoxes && dataBoxes.results) {
			setData(dataBoxes.results);
		}
		if (dataBoxes && dataBoxes.metadata && dataBoxes.metadata[0]) {
			setRowCount(dataBoxes.metadata[0].total);
		}
	}, [dataBoxes]);

	const [rowCount, setRowCount] = useState(0);
	const [date, setDate] = useState(null);
	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
		},
		{
			name: 'Fecha',
			selector: 'date',
			sortable: true,
			cell: (row) => {
				return moment(row.date).utc().format("YYYY-MM-DD")
			},
		},
		{
			name: '',
			sortable: false,
			cell: (row) => {
				//Solo gerente puede cerrar la caja
				if ((user.role == 3) || (user.role == 7)) {
					const startDate = moment(row.date).startOf('day');
					const endDate = moment(row.date).endOf('day');

					var isafter = moment().isAfter(startDate);
					var isbefore = moment().isBefore(endDate);

					if (isafter && isbefore && !row.isClosed) {
						return <Button color="primary" onClick={() => { setDate(row.date); close(row) }}>
							Cerrar
						</Button>
					} else {
						return <></>;
					}
				} else {
					return <></>;
				}
			},
		},
		// Envio de mensaje por whatsapp
		{
			name: '',
			sortable: false,
			cell: (row) => {
				//Si es gerente verificar si cerrado la caja, sino no se permite enviar
				if (user.role == 3) {
					var isbefore = moment(row.date).isBefore(moment().startOf('day'));
					if (isbefore || row.isClosed) {
						return <Button color="primary" onClick={() => { sendData(row) }}>
							<i className="fa fa-comment" aria-hidden="true"></i> Enviar
						</Button>
					} else {
						return <></>;
					}
					//Si es supervisor o admin puede enviar la informacion actual
				} else if (user.role == 1 || user.role == 2) {
					return <Button color="primary" onClick={() => { sendData(row) }}>
						<i className="fa fa-comment" aria-hidden="true"></i> Enviar
					</Button>
				} else {
					return <></>;
				}
			},
		},
	];

	//Columnas detalle
	const columnsDetail = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap: true
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
			cell: (row) => {
				return <NumberFormat value={row.in ? row.in.toFixed(2) : row.in} displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Egresos',
			selector: 'out',
			sortable: true,
			cell: (row) => {
				return <NumberFormat value={row.out ? row.out.toFixed(2) : row.out} displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell: (row) => {
				return <NumberFormat value={row.total ? row.total.toFixed(2) : row.total} displayType={'text'} thousandSeparator={true} />
			},
		},
		{
			name: 'Fecha',
			selector: 'createdDate',
			sortable: true,
			cell: (row) => {
				return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a")
			},
		},
	];

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id
		}
	}

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id": "date", "desc": true });

	const getDataTable = (page) => {
		dispatch(boxActions.boxToCloseTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(boxActions.boxToCloseTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters : {}, false));
	};

	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = { "id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(boxActions.boxToCloseTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters : {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(boxActions.boxToCloseTable(getUserData(), page, newPerPage, direction, filters ? filters : {}, false));
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
			coin: type,
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
		if (boxDetail.successDetail) {
			setListDetail(boxDetail.dataDetail.results);
		}
	}, [boxDetail.successDetail]);

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
	const clearModal = () => {
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
	}, []);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if (users.obtained) {
			setListAgencies(users.list.agencies);
		}
	}, [users.obtained]);

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

	const clearFilters = () => {
		setStartDate('');
		setEndDate('');
		reset({ agency: '', startDate: '', endDate: '' })
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
		dispatch(boxActions.boxToCloseTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	//Data al expandir una fila
	const ExpandedComponentDetail = ({ data }) => (
		<ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading>{data.agency.name}</ListGroupItemHeading>
				<ListGroupItemText>
					{data.coinDescription}
				</ListGroupItemText>
				<ListGroupItemText>
					<b>Usuario: </b>{data.user.username}
				</ListGroupItemText>
			</ListGroupItem>
		</ListGroup>
	);

	//Data al expandir fila
	const ExpandedComponent = ({ data }) => {

		const startDate = moment(data.date).startOf('day');
		const endDate = moment(data.date).endOf('day');

		var isafter = moment().isAfter(startDate);
		var isbefore = moment().isBefore(endDate);

		if (isafter && isbefore && !data.isClosed && user.role == 3) {
			// Si no ha cerrado la caja y es gerente no mostrar informacion
			// admin y supervisor si ven la informacion
			return (<> No existe registro de cierre del dia </>)
		} else {
			return (
				<>
					<Table striped responsive className={darkMode ? 'dark-mode' : ''}>
						<thead>
							<tr>
								<th>Fecha</th>
								<th>Moneda</th>
								<th>Saldo inicial</th>
								<th>Ingresos</th>
								<th>Egresos</th>
								<th>Saldo Final</th>
								<th></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{moment(data.date).utc().format("YYYY-MM-DD")}</td>
								<td>BsS</td>
								<td><NumberFormat value={data.bsTotalInitial.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalInBs.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalOutBs.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.bsTotalFinal.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td>
									{data.isClosed && <>
										{data.validBs == true && <Icon icon={checkIcon} color="green" />}
										{data.validBs == false && <Icon icon={timesIcon} color="red" />}
									</>}
								</td>
								<td><Button size="sm" className="btn-link" style={{ margin: 0, padding: 0 }} color="primary" onClick={() => { getDetails(data.date, 1, data.agency) }}>
									Detalle
								</Button></td>
							</tr>
							<tr>
								<td>{moment(data.date).utc().format("YYYY-MM-DD")}</td>
								<td>Dólar</td>
								<td><NumberFormat value={data.dollarTotalInitial.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalInDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalOutDollar.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.dollarTotalFinal.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td>
									{data.isClosed && <>
										{data.validDollar == true && <Icon icon={checkIcon} color="green" />}
										{data.validDollar == false && <Icon icon={timesIcon} color="red" />}
									</>}
								</td>
								<td><Button size="sm" className="btn-link" style={{ margin: 0, padding: 0 }} color="primary" onClick={() => { getDetails(data.date, 2, data.agency) }}>
									Detalle
								</Button></td>
							</tr>
							<tr>
								<td>{moment(data.date).utc().format("YYYY-MM-DD")}</td>
								<td>Euro</td>
								<td><NumberFormat value={data.eurTotalInitial.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalInEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalOutEur.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.eurTotalFinal.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td>
									{data.isClosed && <>
										{data.validEur == true && <Icon icon={checkIcon} color="green" />}
										{data.validEur == false && <Icon icon={timesIcon} color="red" />}
									</>}
								</td>
								<td><Button size="sm" className="btn-link" style={{ margin: 0, padding: 0 }} color="primary" onClick={() => { getDetails(data.date, 3, data.agency) }}>
									Detalle
								</Button></td>
							</tr>
							<tr>
								<td>{moment(data.date).utc().format("YYYY-MM-DD")}</td>
								<td>Pesos</td>
								<td><NumberFormat value={data.copTotalInitial.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalInCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.totalOutCop.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td><NumberFormat value={data.copTotalFinal.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
								<td>
									{data.isClosed && <>
										{data.validCop == true && <Icon icon={checkIcon} color="green" />}
										{data.validCop == false && <Icon icon={timesIcon} color="red" />}
									</>}
								</td>
								<td><Button size="sm" className="btn-link" style={{ margin: 0, padding: 0 }} color="primary" onClick={() => { getDetails(data.date, 4, data.agency) }}>
									Detalle
								</Button></td>
							</tr>
						</tbody>
					</Table>
				</>
			);
		}

	}

	//Cierre 
	const [modalClose, setModalClose] = useState(false);
	const [dataToClose, setDataToClose] = useState(null);

	//cerrar modal de cierre de caja
	const close = (data) => {
		setDataToClose(data);
		setModalClose(true)
	}

	const sendData = (data) => {
		try {
			let createdDate = data._id.createdDate;
			let agency = data.agency.name;
			let isClosed = data.isClosed;
			let userClose = data.userClose;

			//Bs
			let bsTotalInitial = formatter.format(data.bsTotalInitial.toFixed(2));
			let totalInBs = formatter.format(data.totalInBs.toFixed(2));
			let totalOutBs = formatter.format(data.totalOutBs.toFixed(2));
			let bsTotalFinal = formatter.format(data.bsTotalFinal.toFixed(2));
			let inUserBs = formatter.format(data.inUserBs.toFixed(2));
			let differenceBs = formatter.format(data.differenceBs.toFixed(2));
			let validBs = data.validBs;
			//Dolar
			let dollarTotalInitial = formatter.format(data.dollarTotalInitial.toFixed(2));
			let totalInDollar = formatter.format(data.totalInDollar.toFixed(2));
			let totalOutDollar = formatter.format(data.totalOutDollar.toFixed(2));
			let dollarTotalFinal = formatter.format(data.dollarTotalFinal.toFixed(2));
			let inUserDollar = formatter.format(data.inUserDollar.toFixed(2));
			let differenceDollar = formatter.format(data.differenceDollar.toFixed(2));
			let validDollar = data.validDollar;
			//Eur
			let eurTotalInitial = formatter.format(data.eurTotalInitial.toFixed(2));
			let totalInEur = formatter.format(data.totalInEur.toFixed(2));
			let totalOutEur = formatter.format(data.totalOutEur.toFixed(2));
			let eurTotalFinal = formatter.format(data.eurTotalFinal.toFixed(2));
			let inUserEur = formatter.format(data.inUserEur.toFixed(2));
			let differenceEur = formatter.format(data.differenceEur.toFixed(2));
			let validEur = data.validEur;
			//Cop
			let copTotalInitial = formatter.format(data.copTotalInitial.toFixed(2));
			let totalInCop = formatter.format(data.totalInCop.toFixed(2));
			let totalOutCop = formatter.format(data.totalOutCop.toFixed(2));
			let copTotalFinal = formatter.format(data.copTotalFinal.toFixed(2));
			let inUserCop = formatter.format(data.inUserCop.toFixed(2));
			let differenceCop = formatter.format(data.differenceCop.toFixed(2));
			let validCop = data.validCop;

			let MessageData = {
				isClosed, createdDate, agency, bsTotalInitial, totalInBs, totalOutBs, bsTotalFinal, validBs,
				dollarTotalInitial, totalInDollar, totalOutDollar, dollarTotalFinal, validDollar,
				eurTotalInitial, totalInEur, totalOutEur, eurTotalFinal, validEur,
				copTotalInitial, totalInCop, totalOutCop, copTotalFinal, validCop,
				inUserBs, inUserDollar, inUserEur, inUserCop, userClose,
				differenceBs, differenceDollar, differenceEur, differenceCop
			}

			let urlbalance = getUrlBoxWhatsapp(MessageData);
			window.open(urlbalance, "_blank", "");

		} catch (error) {
			setModalWarning(true);
			setModalMsg('Ocurrió un error, al formatear la información');
		}
	}

	//Form Data
	const { handleSubmit: handleSubmitClose, errors: errorsClose, reset: resetClose, control: controlClose } = useForm();

	const onCreateData = (data, e) => {
		let values = [];
		let dataBs = { coin: 1, amount: data.bsValue };
		let dataDolar = { coin: 2, amount: data.dolarValue };
		let dataEur = { coin: 3, amount: data.eurValue };
		let dataCop = { coin: 4, amount: data.copValue };

		//crear array de valores 
		values.push(dataBs);
		values.push(dataDolar);
		values.push(dataEur);
		values.push(dataCop);
		data.values = values;
		data.user = user.id;
		data.rowBox = dataToClose;
		data.agency = dataToClose.agency._id;
		data.date = date;

		dispatch(boxActions.boxClose(data));
	}

	const [buttonVisible, setButtonVisible] = useState(true);
	const [reload, setReload] = useState(false);

	const onCloseModal = () => {
		resetClose({
			bsValue: '',
			dolarValue: '',
			eurValue: '',
			copValue: '',
		});
		setDataToClose(null);
		setModalClose(false);

		//recargar busqueda
		if (reload) {
			setReload(false);
			setButtonVisible(true);

			handleSubmit(onFilterData)();
		}
	}

	//State de cierre
	const closingBox = useSelector(state => state.box.closing);
	const boxStateClose = useSelector(state => state.box);

	//Actualizar estado de inventario al cambio de información
	useEffect(() => {
		if (boxStateClose.closingSuccess) {
			resetClose({
				bsValue: '',
				dolarValue: '',
				eurValue: '',
				copValue: '',
			});

			setDataToClose(null);

			//Colocar invisible el boton de cerrar caja
			setButtonVisible(false);
			//Recargar al cerrar el modal
			setReload(true);
		}
	}, [boxStateClose.closingSuccess]);

	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<div className="align-self-center">
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Cierre de caja</h3>
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
									{(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9) && <FormGroup className="mr-3">
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
											inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }} isValidDate={isValidDate}
											theme={darkMode ? "dark" : "default"}
										/>
									</FormGroup>
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref: register, placeholder: "Fecha final", autoComplete: "off" }} isValidDate={isValidDate}
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
									expandableRows
									expandableRowsComponent={<ExpandedComponent />}
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
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
						<Modal toggle={() => { clearModal() }} isOpen={modalVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Detalle
								</h5>
								<button
									aria-label="Close"
									className="close"
									type="button"
									onClick={() => { clearModal() }}
								>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
								<Row>
									<Col>
										<DataTable
											className="dataTables_wrapper"
											responsive
											highlightOnHover
											striped
											expandableRows
											expandableRowsComponent={<ExpandedComponentDetail />}
											sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
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
							<div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
								{listDetail && listDetail.length > 0 &&
									<CSVLink data={listDetail} separator={";"} headers={headersDetail} filename={"detalleCaja.csv"} className="btn btn-primary">
										<Icon icon={fileDownload} /> Exportar
									</CSVLink>
								}
								<Button color="secondary" type="button" onClick={() => { clearModal() }}>
									Cerrar
								</Button>
							</div>
						</Modal>
						<Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									Cierre
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
						<Modal toggle={() => { onCloseModal() }} isOpen={modalClose} backdrop="static" className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
							<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
								<h5 className="modal-title" id="examplemodalMsgLabel">
									¿Confirmar cierre de caja?
								</h5>
								<button aria-label="Close" className="close" type="button" onClick={() => { onCloseModal() }}>
									<span aria-hidden={true}>×</span>
								</button>
							</div>
							<div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
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
								<Form onSubmit={handleSubmitClose(onCreateData)} className="form">
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label>Moneda</Label>
											</FormGroup>
											<FormGroup>
												<Label for="bs">Bs</Label>
											</FormGroup>
										</Col>
										<Col md={8}>
											<FormGroup>
												<Label for="bsValue">Monto</Label>
												<Controller
													name="bsValue"
													control={controlClose}
													rules={{
														min: {
															value: 0,
															message: "El valor es requerido"
														},
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.bsValue ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.bsValue && <div className="invalid-feedback">{errorsClose.bsValue.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bs">Dólar</Label>
											</FormGroup>
										</Col>
										<Col md={8}>
											<FormGroup>
												<Controller
													name="dolarValue"
													control={controlClose}
													rules={{
														min: {
															value: 0,
															message: "El valor es requerido"
														},
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.dolarValue ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.dolarValue && <div className="invalid-feedback">{errorsClose.dolarValue.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bs">Euro</Label>
											</FormGroup>
										</Col>
										<Col md={8}>
											<FormGroup>
												<Controller
													name="eurValue"
													control={controlClose}
													rules={{
														min: {
															value: 0,
															message: "El valor es requerido"
														},
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.eurValue ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.eurValue && <div className="invalid-feedback">{errorsClose.eurValue.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<Row form>
										<Col md={4}>
											<FormGroup>
												<Label for="bs">Pesos</Label>
											</FormGroup>
										</Col>
										<Col md={8}>
											<FormGroup>
												<Controller
													name="copValue"
													control={controlClose}
													rules={{
														min: {
															value: 0,
															message: "El valor es requerido"
														},
														required: "El valor es requerido",
													}}
													as={<NumberFormat className={'form-control' + (errorsClose.copValue ? ' is-invalid' : '')} thousandSeparator={true} />}
												/>
												{errorsClose.copValue && <div className="invalid-feedback">{errorsClose.copValue.message}</div>}
											</FormGroup>
										</Col>
									</Row>
									<div className="d-flex justify-content-between">
										{buttonVisible && <Button color="primary" disabled={closingBox}>
											{closingBox && <span className="spinner-border spinner-border-sm mr-1"></span>}
											Confirmar cierre
										</Button>
										}

										<Button color="secondary" type="button" onClick={() => { onCloseModal() }}>
											Cerrar
										</Button>
									</div>
								</Form>
							</div>
						</Modal>
					</div>
				</div>
			</div>
		</>
	);
}

export default BoxClosePage;