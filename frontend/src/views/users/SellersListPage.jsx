/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { InputGroup, InputGroupAddon, Button, Input, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText, UncontrolledTooltip } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import useDebounce from '../../components/Debounce'; 
import NumberFormat from 'react-number-format';
// import '../../assets/css/table.css';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
	return <InputGroup style={{ "width": "200px"}}>
		<Input autoComplete="off" style={{"height": "38px", "marginTop":"10px"}} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>	
}

function UsersListPage() {

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

	const dataUsers = useSelector(state => state.users.data);
    const loadingPage = useSelector(state => state.users.loading);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Verificar data de redux
	useEffect(() => {
		if(dataUsers){
			setData(dataUsers.results);
		}else{

		}
	  },[dataUsers]);
	  
	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id,
		}
	}

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			cell : (row)=>{
				return row.agency ? row.agency.name: ''
			},
		},
		{
			name: 'Código',
			selector: 'code',
			sortable: true,
		},
		{
			name: 'Nombre ',
			selector: 'firstName',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.firstName + ' ' +  row.lastName
			},
		},
        {
			name: 'Límite de crédito',
			selector: 'creditLimit',
            sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.creditLimit ? row.creditLimit : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Meta semanal',
			selector: 'weeklyGoal',
			sortable: true,
			cell : (row)=>{
				if (!row.applyForWeeklyGoal) {
					return 'No aplica';
				}
				const value = row.weeklyGoal !== undefined && row.weeklyGoal !== null && row.weeklyGoal !== ''
					? Number(row.weeklyGoal)
					: null;
				if (value === null) {
					return <span title="Editar vendedor para definir meta">Sin definir</span>;
				}
				return <NumberFormat value={value} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />;
			},
		},
		{
			name: 'Porcentaje mínimo de ventas',
			selector: 'weeklyGoalMinimumPercentageOfSales',
			sortable: true,
			cell : (row)=>{
				if (row.applyForWeeklyGoal){
					return <NumberFormat value={row.weeklyGoalMinimumPercentageOfSales ? row.weeklyGoalMinimumPercentageOfSales : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
				}
				else{
					return "No aplica"
				}
			},
		},
		{
			name: 'Meta por mayoreo',
			selector: 'wholesalesGoal',
			sortable: true,
			cell : (row)=>{					
				return <NumberFormat value={row.wholesalesGoal ? row.wholesalesGoal : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Porcentaje por meta de mayoreo',
			selector: 'wholesalesGoalCommissionPercentage',
			sortable: true,
			cell : (row)=>{					
				return <NumberFormat value={row.wholesalesGoalCommissionPercentage ? row.wholesalesGoalCommissionPercentage : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={'%'} />
			},
		},
		{
			name: 'Meta Ticket semanal',
			selector: 'weeklyTicketGoal',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.weeklyTicketGoal ? row.weeklyTicketGoal : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: '',
			button: true,
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => 
				{
					e.preventDefault(); 
					history.push('/update-seller',{id:row.id})
				}
			}><i className="fas fa-pencil-alt"></i></Button>,
		},
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD")
			},
		},
	];

	//data inicial
	const getDataTable = () => {
		dispatch(userActions.getSellers(getUserData()));
	}
	
	const [filterText, setFilterText] = useState('');
	const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
	
	//Retraso 500ms input search
	const debouncedSearchTerm = useDebounce(filterText, 500);

	//Header search del DataTable
	const subHeaderComponentMemo = useMemo(() => {
		const handleClear = () => {
			if (filterText) {
				setResetPaginationToggle(!resetPaginationToggle);
				setFilterText('');
				if(dataUsers && dataUsers.results){
					setData(dataUsers.results);
				}
			}
		};
		return <FilterComponent onFilter={e =>  setFilterText(e.target.value) } onClear={handleClear} filterText={filterText} />;
	}, [filterText, resetPaginationToggle]);


	//Filtrar con delay 
	useEffect(() => {
		if(dataUsers && dataUsers.results){
			if (debouncedSearchTerm) {
				setData(dataUsers.results.filter(item => ( 
						(item.createdDate &&  moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
						|| (item.username &&  item.username.toLowerCase().includes(filterText.toLowerCase()))
						|| (item.firstName &&  item.firstName.toLowerCase().includes(filterText.toLowerCase()))
						|| (item.lastName &&  item.lastName.toLowerCase().includes(filterText.toLowerCase()))
						|| (item.agency.name &&  item.agency.name.toLowerCase().includes(filterText.toLowerCase()))
						|| (item.profile &&  item.profile.toLowerCase().includes(filterText.toLowerCase()))
					) 
				));
			}
		}
	},[debouncedSearchTerm]);

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`}  id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic', marginBottom: '0' }}>Vendedores</h3>
								<p className="text-muted small mb-0 mt-1">Las metas de venta por tienda se definen al <strong>actualizar la sucursal</strong>. Las columnas de meta muestran valores guardados en el vendedor (referencia o datos previos).</p>
							</div>
							{user.role !== 10 && (
							<div className="d-flex align-items-center">
								<span style={{fontWeight:'bold', marginRight:8}}>
									Añadir
								</span>
								<Button id="add" onClick={()=>history.push('/register-seller')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
								</Button>
							</div>)}
						</div>
						<Row>
							<Col>
							
							<DataTable
								className="dataTables_wrapper"
								//expandableRows
								//expandableRowsComponent={<ExpandedComponent />}
								responsive
								striped
								highlightOnHover
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Usuarios"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={data}
								pagination
								paginationResetDefaultPage={resetPaginationToggle}
								subHeader
								subHeaderComponent={subHeaderComponentMemo}
								persistTableHead
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

export default UsersListPage;