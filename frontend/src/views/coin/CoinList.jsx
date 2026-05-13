/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { coinActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { InputGroup, InputGroupAddon, Button, Input, Spinner, Row, Col, UncontrolledTooltip } from 'reactstrap';
import { history } from '../../helpers';
import useDebounce from '../../components/Debounce'; 
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import Currency from '../currency/Currency';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

// Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
	return <InputGroup style={{ "width": "200px"}}>
		<Input autoComplete="off" style={{"height": "38px", "marginTop":"10px"}} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>	
}

function CoinListPage() {

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

	const dataCoins = useSelector(state => state.coin.data);
	
    const loadingPage = useSelector(state => state.coin.loading);

	useEffect(() => {
		if (dataCoins && dataCoins.results) {
			setData(dataCoins.results); // Guardamos los elementos en la posición 2
		} else {
			setData([]); // Aseguramos que 'data' esté vacío si no hay suficientes resultados
		}
	}, [dataCoins]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
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
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD");
			},
		},
		{
			name: 'Fecha de actualización',
			selector: 'updatedDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.updatedDate).utc().format("YYYY-MM-DD");
			},
		},
		{
			name: '',
			button: true,
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => 
				{
					e.preventDefault(); 
					history.push('/update-coin', { id: row.id });
				}
			}><i className="fas fa-pencil-alt"></i></Button>,
		},
	];

	//data inicial
	const getDataTable = () => {
		dispatch(coinActions.dataTable());
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
				setData(dataCoins.results);
			}
		};
		return;
	}, [filterText, resetPaginationToggle]);


	//Filtrar con delay 
	useEffect(() => {
		if (debouncedSearchTerm) {
			setData(dataCoins.results.filter(item => ( 
					(item.createdDate &&  moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
					|| (item.name &&  item.name.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.value &&  item.value.toString().toLowerCase().includes(filterText.toLowerCase()))
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

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/> 
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}> 
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic', marginBottom: 0}}>Valor moneda </h3>
							</div> 
							{ (user.role===1) &&
								<div>
									<span style={{fontWeight:'bold', marginRight:8}}>
										Historial
									</span>
									<Button id="add" onClick={()=>history.push('/history-coin')} className="btn-round btn-icon" color="primary">
										<i className="fa fa-undo" />
									</Button>
								</div>
							}
						 </div> 
						<Row>
							<Col>
							<DataTable
								className="dataTables_wrapper"
								responsive
								highlightOnHover
								striped
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Monedas"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={data}
								// pagination
								// paginationResetDefaultPage={resetPaginationToggle} // optionally, a hook to reset pagination to page 1
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

export default CoinListPage;