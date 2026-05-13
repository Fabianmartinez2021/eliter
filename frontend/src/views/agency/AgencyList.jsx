/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { agencyActions } from '../../actions';
import moment from 'moment';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import DataTable from 'react-data-table-component';
import { InputGroup, InputGroupAddon, Button, Input, Row, Col, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText } from 'reactstrap';
import { history } from '../../helpers';
import useDebounce from '../../components/Debounce'; 
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import "../../assets/css/table.css";
import NumberFormat from 'react-number-format';

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => (
	<InputGroup style={{ width: "200px" }}>
		<Input autoComplete="off" style={{ height: "38px", marginTop: "10px" }} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>
);

function AgencyListPage() {
	useEffect(() => {
		document.body.classList.add("landing-page", "sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return () => {
			document.body.classList.remove("landing-page", "sidebar-collapse");
		};
	}, []);

	// Modo oscuro 
	const { darkMode } = useDarkMode();

	// Redux
	const user = useSelector(state => state.authentication.user);
	const dispatch = useDispatch();
	const dataAgencies = useSelector(state => state.agencies.data);
	const loadingPage = useSelector(state => state.agencies.loading);

	// Estado de la tabla
	const [data, setData] = useState([]);
	console.log('data dee las agencias', data)
	const [filterText, setFilterText] = useState('');
	const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
	const debouncedSearchTerm = useDebounce(filterText, 500);

	// Obtener datos
	useEffect(() => {
		if (dataAgencies) {
			setData(dataAgencies.results.filter(item => item.name?.toLowerCase().includes(filterText.toLowerCase())));
		}
	}, [dataAgencies]);

	useEffect(() => {
		if (dataAgencies && dataAgencies.results) {
			setData(dataAgencies.results.filter(item =>
				(item.createdDate && moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase())) ||
				(item.name?.toLowerCase().includes(filterText.toLowerCase())) ||
				(item.company?.toLowerCase().includes(filterText.toLowerCase())) ||
				(item.attendant?.toLowerCase().includes(filterText.toLowerCase())) ||
				(item.address?.toLowerCase().includes(filterText.toLowerCase())) ||
				(item.terminalCodes?.toLowerCase().includes(filterText.toLowerCase()))
			));
		}
	}, [debouncedSearchTerm]);

	useEffect(() => {
		dispatch(agencyActions.dataTable());
	}, []);

	// Columnas DataTable
	const columns = [
		{ name: 'Nombre', selector: row => row.name, sortable: true, wrap: true },
	//	{ name: 'Empresa', selector: row => row.company, sortable: true, wrap: true },
		{ name: 'Encargado', selector: row => row.attendant, sortable: true, wrap: true },
	//	{ name: 'Monto semanal a facturar', sortable: true, wrap: true, selector: (row) => <NumberFormat value={row.billingWeeklyGoal ? row.billingWeeklyGoal.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /> },
		{
			name: 'Terminales',
			selector: row => row.terminal.map(e => e.code).join(", "),
			sortable: false,
			wrap: true
		},
		{
			name: 'Fecha de registro',
			selector: row => moment(row.createdDate).utc().format("YYYY-MM-DD"),
			sortable: true
		},
		{
			name: '',
			button: true,
			cell: row => (
				<Button
					outline
					color="primary"
					size="sm"
					title="Editar sucursal"
					aria-label="Editar sucursal"
					onClick={e => {
						e.preventDefault();
						history.push('/update-agency', { id: row.id });
					}}
				>
					<i className="fa fa-pencil" aria-hidden="true" />
				</Button>
			)
		}
		
	];

	// Opciones de paginación
	const paginationOptions = {
		rowsPerPageText: 'Filas por página',
		rangeSeparatorText: 'de',
		selectAllRowsItem: true,
		selectAllRowsItemText: 'Todos'
	};

	// Loader personalizado
	const CustomLoader = () => <div className="loading-table"></div>;

	// Expansión de filas
	const ExpandedComponent = ({ data }) => (
		<ListGroup className={darkMode ? "dark-mode" : ""}>
		  <ListGroupItem className={darkMode ? "dark-mode" : ""}>
			<ListGroupItemText className={darkMode ? "text-white" : ""}>Numero de telefono: {data.phone}</ListGroupItemText>
			<ListGroupItemText className={darkMode ? "text-white" : ""}>Dirección: {data.address}</ListGroupItemText>
			<ListGroupItemText className={darkMode ? "text-white" : ""}>Terminales: {data.terminal.map(e => e.code).join(", ")}</ListGroupItemText>
		  </ListGroupItem>
		</ListGroup>
	  );

	return (
		<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
			<SideBar />
			<div id="page-content-wrapper">
				<AdminNavbar />
				<div className="flex-column flex-md-row p-3">
					<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
						<h3 style={{ marginBottom: '0', fontWeight: 'bold', fontStyle: 'italic' }}>Sucursales</h3>
						{user.role !== 10 && (
						<div>	
							<span style={{ fontWeight: 'bold', marginRight: 8 }}>
								Añadir
							</span>
							<Button id="add" onClick={() => history.push('/register-agency')} className="btn-round btn-icon" color="primary">
								<i className="fa fa-plus" />
							</Button>
						</div>
						)}
					</div>
					<Row>
						<Col>
							<DataTable
								className="dataTables_wrapper"
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								responsive
								highlightOnHover
								striped
								sortIcon={<i className="fa fa-arrow-down ml-2" />}
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader
								columns={columns}
								data={data}
								pagination
								paginationResetDefaultPage={resetPaginationToggle}
								subHeader
								subHeaderComponent={<FilterComponent filterText={filterText} onFilter={e => setFilterText(e.target.value)} onClear={() => setFilterText('')} />}
								persistTableHead
								theme={darkMode ? "dark" : "default"}
							/>
						</Col>
					</Row>
				</div>
			</div>
		</div>
	);
}

export default AgencyListPage;
