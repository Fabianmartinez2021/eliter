/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { coinActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Modal, UncontrolledTooltip, Form, FormGroup } from 'reactstrap';
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm } from "react-hook-form";
import Datetime from 'react-datetime';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 


function CoinHistoryPage() {

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

	const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();

	const dataCoins = useSelector(state => state.coin?.data);
	const loadingPage = useSelector(state => state.coin.loading);

	useEffect(() => {
		if (dataCoins && dataCoins.results) {
			setData(dataCoins.results);
		}
		if (dataCoins && dataCoins.metadata && dataCoins.metadata[0]) {
			setRowCount(dataCoins.metadata[0].total);
		}
	}, [dataCoins]);

	const [data, setData] = useState([]);
	const [rowCount, setRowCount] = useState(0);

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
			name: 'Nombre',
			selector: 'name',
			sortable: true,
		},
        {
			name: 'Valor',
			selector: 'value',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.value} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Fecha de actualización',
			selector: 'updatedDate',
			sortable: true,
			cell: (row) => {
				return moment(row.updatedDate).utc().format("YYYY-MM-DD hh:mm:ss a")
			},
		},
	];

	// Filtrar con la fecha de hoy al montar el componente si no hay filtro seleccionado
	const today = moment().format('YYYY-MM-DD');
	const [filters, setFilters] = useState({ startDate: today, endDate: today });
	const [startDate, setStartDate] = useState(today);
	const [endDate, setEndDate] = useState(today);

	useEffect(() => {
		getDataTableCoin();
	}, []);

	const getUserData = () => {
		return {
			agency: user.agency.id,
			role: user.role,
			id: user.id,
			product: true, // Consultar usuario admin/supervisor
		}
	}

	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	const CustomLoader = () => (<><div className="loading-table"></div></>);

	const [perPage] = useState(10);
	const [perPageSelect, setPerPageSelect] = useState(0);
	const [direction, setDirection] = useState({ "id": "createdDate", "desc": true });

	const getDataTableCoin = (page = 1) => {
		dispatch(coinActions.dataTableHistoryCoin(
			getUserData(), 
			page, 
			perPageSelect === 0 ? perPage : perPageSelect, 
			direction, 
			filters, 
			false
		));
	};

	const handlePageChange = async (page) => {
		dispatch(coinActions.dataTableHistoryCoin(getUserData(), page, perPageSelect === 0 ? perPage : perPageSelect, direction, filters, false));
	};

	const handleSort = (column, sortDirection) => {
		let sort = { "id": column.selector, "desc": (sortDirection === "asc" ? false : true) }
		setDirection(sort);
		dispatch(coinActions.dataTableHistoryCoin(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, sort, filters, false));
	};

	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(coinActions.dataTableHistoryCoin(getUserData(), page, newPerPage, direction, filters, false));
	};

	const { handleSubmit, register, reset } = useForm();

	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

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

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const clearFilters = () => {
		setStartDate(today);
		setEndDate(today);
		setFilters({ startDate: today, endDate: today });
		reset({ startDate: '', endDate: '', name: '' })
	}

	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const onFilterData = (data, e) => {


		if (data.startDate && !moment(data.startDate).isValid()) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		if (data.endDate && !moment(data.endDate).isValid()) {
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		if (moment(data.startDate).isAfter(data.endDate)) {
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		if (moment(data.endDate).diff(moment(data.startDate), 'days') > 60) {
			setModalWarning(true);
			setModalMsg('El rango de fechas no puede superar los 60 días');
			return;
		}

		setFilters(data);
		dispatch(coinActions.dataTableHistoryCoin(getUserData(), 1, perPageSelect === 0 ? perPage : perPageSelect, direction, data, false));
	}

	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">
						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Historial de valor de moneda</h3>
						</div>
						<div className="filter">
							<div className="d-flex justify-content-between">
								<a href="#" onClick={e => { e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>}
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
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
							</>}
						</div>
						<Row>
							<Col>
								<DataTable
									className="dataTables_wrapper"
									columns={columns}
									data={data}
									progressPending={loadingPage}
									progressComponent={<CustomLoader />}
									pagination
									onChangePage={handlePageChange}
									onSort={handleSort}
									sortServer
									paginationServer
									onChangeRowsPerPage={handlePerRowsChange}
									paginationTotalRows={rowCount}
									paginationComponentOptions={paginationOptions}
									noDataComponent="No hay datos para mostrar"
									highlightOnHover
									theme={darkMode ? "dark" : "default"}
								/>
							</Col>
						</Row>
					</div>
				</div>
			</div>
		</>
	);
}

export default CoinHistoryPage;
