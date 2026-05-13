/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productActions, userActions, pendingPaymentsActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup, Modal, Badge, Label } from 'reactstrap';
import cashRegister from '@iconify/icons-fa-solid/cash-register';
//componente dataTable sede
import { history } from '../../helpers';
import '../../assets/css/table.css';
import '../../assets/css/filters.css';
import NumberFormat from 'react-number-format';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm  } from "react-hook-form";
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

function CombosPage() {

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

	// Inicializar tabla sin data
	const [data, setData] = useState([])
	// Fuente de datos para filtros en el cliente
	const [allCombos, setAllCombos] = useState([]);

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');


	//Verificar data de redux
	useEffect(() => {

		// combosGetAll puede devolver:
		// 1) { results: [...], metadata: [...] }
		// 2) [...] (array directo)
		// 3) { products: [...] } / { combos: [...] } / { data: [...] } (variante backend)
		let combosList = null;
		let metaTotal = null;

		if (Array.isArray(dataProducts)) {
			combosList = dataProducts;
		} else if (dataProducts && Array.isArray(dataProducts.results)) {
			combosList = dataProducts.results;
			metaTotal = dataProducts?.metadata?.[0]?.total ?? null;
		} else if (dataProducts && Array.isArray(dataProducts.products)) {
			combosList = dataProducts.products;
		} else if (dataProducts && Array.isArray(dataProducts.combos)) {
			combosList = dataProducts.combos;
		} else if (dataProducts && Array.isArray(dataProducts.data)) {
			combosList = dataProducts.data;
		} else if (dataProducts && dataProducts.data && Array.isArray(dataProducts.data.results)) {
			combosList = dataProducts.data.results;
			metaTotal = dataProducts?.data?.metadata?.[0]?.total ?? null;
		}

		if (Array.isArray(combosList)) {
			setData(combosList);
			setAllCombos(combosList);
			setRowCount(metaTotal ?? combosList.length);
		}
  	},[dataProducts]);

	//obtener sucursales para select
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
    
	
	const [rowCount, setRowCount] = useState(0)
	//Columnas Data table (solo: agencia, código, nombre y precio)
	const columns = [
		{
			name: 'Agencia',
			selector: 'agency.name',
			sortable: false,
			wrap: true,
			cell: row => {
				return <> {row.toAllAgencies ? "Todas" : row.agency?.name}</>;
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
			wrap: true
		},
		{
			name: 'Precio',
			selector: 'price',
			sortable: true,
			cell : (row)=>{
				return (row.price.toFixed(2));
			},
		},
		{
			name: '',
			button: true,
			cell: row => {
				if(user.role == 1){
					return (
						<>
							<Button
								color="primary btn-round"
								size="sm"
								style={{fontSize:12}}
								disabled={loadingPage}
								onClick={e => {
									e.preventDefault();
									history.push('/update-combo',{id:row.id});
								}}
							>
								Editar
							</Button>
						</>
					);
				}
			},
		},
		{
			name: '',
			button: true,
			cell: row => {
				if((user.role === 1)){
					return (
						<>
							<Button
								color="primary btn-round"
								size="sm"
								style={{fontSize:12}}
								disabled={loadingPage}
								onClick={e => {
									e.preventDefault();
									dispatch(productActions.deleteCombo(row.id));
									const newData = data.filter(item => item.id !== row.id);
									setData(newData);
									setAllCombos(newData);
								}}
							>
								<i className="fa fa-trash" aria-hidden="true"></i>
							</Button>
						</>
					);
				}
			},
		},
	];

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
		dispatch(productActions.listCombos(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(pendingPaymentsActions.dataTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(pendingPaymentsActions.dataTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(pendingPaymentsActions.dataTable(getUserData(), page, newPerPage, direction, filters ? filters: {}));
	};
	
	const [filters, setFilters] = useState('');

	const getAllCombos = () => {
		dispatch(productActions.combosGetAll());
	}

	//Consultar al entrar
	useEffect(() => {
		setData([])
		getAllCombos();
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//Consultar por filtros (solo: agencia, código, nombre y precio)
	const onFilterData = (values) => {
		const agencyFilter = values.agency || '';
		const codeFilter = (values.code || '').toString().trim().toLowerCase();
		const nameFilter = (values.name || '').toString().trim().toLowerCase();

		const priceRaw = values.price;
		const priceFilter =
			priceRaw === '' || priceRaw === null || priceRaw === undefined ? null : Number(priceRaw);

		const list = allCombos || [];
		const filtered = list.filter((row) => {
			if (!row) return false;

			if (agencyFilter) {
				// Si el backend devuelve TODAS/ÚNICO, mantenemos compatibilidad.
				if (!row.toAllAgencies) {
					const rowAgencyId = String(row.agency?.id ?? '');
					if (rowAgencyId !== String(agencyFilter)) return false;
				}
			}

			if (codeFilter) {
				const rowCode = String(row.code ?? '').toLowerCase();
				if (!rowCode.includes(codeFilter)) return false;
			}

			if (nameFilter) {
				const rowName = String(row.name ?? '').toLowerCase();
				if (!rowName.includes(nameFilter)) return false;
			}

			if (priceFilter !== null && !Number.isNaN(priceFilter)) {
				const rowPrice = Number(row.price);
				if (Number.isNaN(rowPrice)) return false;
				if (rowPrice.toFixed(2) !== priceFilter.toFixed(2)) return false;
			}

			return true;
		});

		setData(filtered);
		setRowCount(filtered.length);
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}
	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const clearFilters = () =>{
		setStartDate('');
		setEndDate('');
		reset({ agency: '', code: '', name: '', price: '' });
		setData(allCombos || []);
		setRowCount((allCombos || []).length);
	}

	//Modal genérico y mensaje
	const [modalVisible, setModalVisible] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => {
		return (
			<>
				<div className="mt-4"><b></b></div>
				<Table striped responsive style={{ width: "50%", textAlign: "center", marginLeft: "25%" }}>
					<thead>
						<tr>
							<th>Producto</th>
							<th>Peso (kg)</th>
						</tr>
					</thead>
					<tbody>
						{data.items && data.items.map((product, index) => (
							<tr key={index}>
								<td>{product.name}</td>
								<td>
									<NumberFormat
										value={product.kg.toFixed(3)}
										displayType={'text'}
										thousandSeparator={','}
										decimalSeparator={'.'}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
				<div className="mb-4 mt-2"><b></b></div>
			</>
		);
	};

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Lista de combos</h3>
					
						</div>
						{(user.role===1)&&<div>
							<span style={{ fontWeight: 'bold', marginRight: 8 }}>
								Añadir
							</span>
							<Button id="add" onClick={()=>history.push('/create-combo')} className="btn-round btn-icon" color="primary">
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
									<Col>
										<Row>
											<FormGroup className="mr-3">
												<select 
													className='form-control' 
													name="agency"
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
										
											<FormGroup className="mr-3">
												<input
													className="form-control"
													name="code"
													placeholder="Código del combo"
													type="text"
													ref={register}
												></input>
											</FormGroup>
											<FormGroup className="mr-3">
												<input
													className="form-control"
													name="name"
													placeholder="Nombre del combo"
													type="text"
													ref={register}
												></input>
											</FormGroup>
											<FormGroup className="mr-3">
												<input
													className="form-control"
													name="price"
													placeholder="Precio"
													type="number"
													step="0.01"
													ref={register}
												></input>
											</FormGroup>
										</Row>
										<Row>
											<Button color="primary" type="submit" disabled={loadingPage}>
												{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
											</Button>
										</Row>
									</Col>
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
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Combos"
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
						<Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible} className={`${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ventas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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

export default CombosPage;