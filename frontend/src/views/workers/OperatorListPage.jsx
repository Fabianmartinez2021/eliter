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
import { Role, history } from '../../helpers';
import useDebounce from '../../components/Debounce'; 
import NumberFormat from 'react-number-format';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
// import '../../assets/css/table.css';
//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
	return <InputGroup style={{ "width": "200px"}}>
		<Input autoComplete="off" style={{"height": "38px", "marginTop":"10px"}} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>	
}

function OperatorListPage() {

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
		if(dataUsers && dataUsers.results){

			const dataFixed = dataUsers.results.map(operator => {
				let disabled = false;
				if (operator.comment === '') {
					disabled = true;
				}
				return { ...operator, disabled };
			});

			const dataFiltered = dataFixed.filter((operator) => {

				// Si es gerente unicamente se verán los de su sucursal
				if (user.role === Role.Manager){
					return (JSON.stringify(operator.agency.id) === JSON.stringify(user.agency.id))
				}
				return true;
			})

			setData(dataFiltered);
			
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
			omit: true
		},
		{
			name: 'Documento ',
			selector: 'document',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.document
			},
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
			name: 'Estado ',
			selector: 'status',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.status === 1 ? 'Activo' : 'Inactivo';
			},
		},
		{
			name: 'Tiene camisa ',
			selector: 'hasShirt',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.hasShirt ? 'Sí' : 'No';
			},
		},
		{
			name: 'Tiene pantalon ',
			selector: 'hasPant',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.hasPant ? 'Sí' : 'No';
			},
		},
		{
			name: 'Botas de seguridad ',
			selector: 'hasSecurityBoots',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.hasSecurityBoots ? 'Sí' : 'No';
			},
		},
		{
			name: 'Tiene gorro ',
			selector: 'hasHat',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.hasHat ? 'Sí' : 'No';
			},
		},
		{
			name: 'Comentario ',
			selector: 'comment',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.comment ? 'Sí' : 'No';
			},
		},
		{
			name: '',
			button: true,
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => 
				{
					e.preventDefault(); 
					history.push('/update-operator',{id:row.id})
				}
			}><i className="fas fa-pencil-alt"></i></Button>,
		},
		{
			name: 'Fecha de ingreso',
			selector: 'startDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.startDate).utc().format("YYYY-MM-DD")
			},
		},
	];

	//data inicial
	const getDataTable = () => {
		dispatch(userActions.getOperators(getUserData()));
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

			// Si es gerente unicamente se verán los operadores de su sucursal
			const dataFiltered = dataUsers.results.filter((operator) => {
				if (user.role === Role.Manager){
					return (JSON.stringify(operator.agency.id) === JSON.stringify(user.agency.id))
				}
				return true;
			})

			// Si no hay nada en el texto, se deja como nueva la busqueda
			if(filterText === ''){
				setData(dataFiltered)
				return
			}

			setData(dataFiltered.filter(item => ( 
					(item.createdDate &&  moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
					|| (item.username &&  item.username.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.firstName &&  item.firstName.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.lastName &&  item.lastName.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.document &&  item.document.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.agency.name &&  item.agency.name.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.profile &&  item.profile.toLowerCase().includes(filterText.toLowerCase()))
				) 
			));
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

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<ListGroup>
			<ListGroupItem>
				<ListGroupItemHeading>Comentario</ListGroupItemHeading>
				<ListGroupItemText>
					{ data.comment}
				</ListGroupItemText>
			</ListGroupItem>
	  	</ListGroup>
	);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`}  id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic', marginBottom: '0' }}>Operadores</h3>
							</div>
							{ user.role !== 10 && ( <>
							<div className="d-flex align-items-center">
								<span style={{fontWeight:'bold', marginRight:8}}>
									Añadir
								</span>
								<Button id="add" onClick={()=>history.push('/register-operator')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
								</Button>
							</div>
							</>)}
							
						</div>
						<Row>
							<Col>
							
							<DataTable
								className="dataTables_wrapper"
								expandableRows
								expandableRowDisabled={row => row.disabled}
								expandableRowsComponent={<ExpandedComponent />}
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

export default OperatorListPage;