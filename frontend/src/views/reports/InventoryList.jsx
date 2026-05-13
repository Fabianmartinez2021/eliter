/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, userActions } from '../../actions';
import moment from 'moment'
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, UncontrolledTooltip, Form, FormGroup, Modal } from 'reactstrap';
//componente dataTable
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import syncIcon from '@iconify/icons-fa-solid/sync';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function InventoryListPage() {

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

	const dataInventories = useSelector(state => state.inventories.data);
    const loadingPage = useSelector(state => state.inventories.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataInventories){

			//	Se inicializa la data en misma sucursal del usuario
			onFilterData({agency: user.agency.id, code: ''})	//	Ëse es el formato que admite la funcion onFilterData
			
		}else{

		}
  	},[dataInventories]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
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
		},
		{
			name: 'Cantidad (kg/Unidad)',
			selector: 'kg',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.kg?row.kg.toFixed(3):row.kg} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
        },
		{
			name: 'Fecha',
			selector: 'createdDate',
			sortable: true,
			omit: true,//Esconder
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD")
			},
		},
		{
			name: '',
			button: true,
			cell: row => {
				//Permiso a reseteo a todos menos al cajero
				if(user.role == 1 ){
					if(row.kg !== 0){
						return <>
						<Button className="btn-link" color="primary" size="sm" onClick={e => 
							{
								e.preventDefault(); 
								history.push('/inventory-reset',{id:row.id})
							}
						}><Icon icon={syncIcon} />
						</Button>
						</>
					}
				}
			} 
		},
		{
			name: 'Repesaje',
			button: true,
			cell: row => {
				//Permiso a repesaje a todos menos al cajero, cobranzas, auditores y televentas
				if(((user.role === 1)||(user.role === 2)||((user.role === 3)&&(row.agency._id.toString() == user.agency.id)))){
					if(row.product.reweigh){
						return <>
							<Button className="btn-link" color="primary" size="sm" onClick={e => 
									{
										e.preventDefault(); 
										history.push('/inventory-reweigh',{id:row.id})
									}
								}><i className="fa fa fa-balance-scale"></i>
							</Button>
						</>
					}
				}
			} 
		},
	];

	//data inicial
	const getDataTable = () => {
		let userData = {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
		dispatch(inventoryActions.dataTable(userData));
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

	const headers = [
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Código Producto", key: "product.code" },
		{ label: "Producto", key: "product.name" },
		{ label: "Cantidad (kg/Unidades)", key: "kg" }
	];

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//Consultar por filtros
	const onFilterData = (data, e) => {
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results.filter(item => (
				//Solo los cajeros NO pueden filtrar por sucursal
				user.role == 1 || user.role == 2 || user.role == 3 || user.role == 5 || user.role == 6 || user.role == 7?
					(item.agency._id && item.agency._id.toString().toLowerCase().includes(data.agency.toLowerCase()))		
					&& (data.code !== "" ? item.product.code && item.product.code.toString().toLowerCase() == data.code.toLowerCase() : true)
				:
					(data.code !== "" ? item.product.code && item.product.code.toString().toLowerCase() == data.code.toLowerCase() : true)
				) 
			));
		}
	};

	//Form Data Filter
	const { handleSubmit, register, reset, setValue, watch } = useForm();

	const clearFilters = () =>{
		setResetPaginationToggle(!resetPaginationToggle);
		reset({agency:'', code:''});
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results);
		}
	}

	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	//obtener sucursales para select
	const getting = useSelector(state => state.users.getting);
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



	/*** Exportar ***/

	const refDetailsExcel = useRef(null);

	// Inicializar data de excel
	const [dataDetailsExcel, setDataDetailsExcel] = useState([]);
	const loadingExcel = useSelector(state => state.download.loading);

	const mapDataWithHeaders = (data, headers) => {
		return data.map((item) => {
			const mappedItem = {};
			headers.forEach(({ label, key }) => {
				let value = key.includes(".")
					? key.split(".").reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item)
					: item[key];

				// Caso 1: Es un string con formato "123,456" → Convertir a número y limitar a 3 decimales
				if (typeof value === "string" && value.match(/^\d+,\d+$/)) {
					value = parseFloat(value.replace(",", "."));
					value = parseFloat(value.toFixed(3)); // Máximo 3 decimales (sin convertirlo a string)
				}
				// Caso 2: Es un string numérico sin decimales (ejemplo: "100") → Convertir a número
				else if (typeof value === "string" && /^\d+$/.test(value)) {
					value = parseInt(value, 10); // o parseFloat(value) si puede haber números grandes
				}
				// Caso 3: Si el valor ya es un número pero tiene muchos decimales → Redondear a 3
				else if (typeof value === "number") {
					value = parseFloat(value.toFixed(3)); // Aseguramos 3 decimales máximo
				}

				mappedItem[label] = value;
			});
			return mappedItem;
		});
	};

	
		const exportToExcel = (data, filename = 'inventarioactual.xlsx') => {
			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
	
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario actual');
	
			const excelBuffer = XLSX.write(workbook, {
				bookType: 'xlsx',
				type: 'array'
			});
	
			const blob = new Blob([excelBuffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
	
			saveAs(blob, filename);
		};
	
	//Verificar data de redux de la data de excel
	const exportDetailsExcel = () => {
		
		// Se una copia de los detalles para que estos no sean los modificados
		const fixedData = data.map((item) => {return Object.assign({}, item)})
		
		//Se modifican los datos antes de la descarga en excel
		fixedData.forEach((item) => {

			item.kg = item.kg.toString()
									.replace(/\,/g, '')  // se eliminan las comas
									.replace(".", ',');  // se cambia la coma por punto
		})

		setDataDetailsExcel(fixedData);
	}
	
	useEffect(() => {
			if (dataDetailsExcel && dataDetailsExcel.length > 0) {
				const dataFormatted = mapDataWithHeaders(dataDetailsExcel, headers);
				exportToExcel(dataFormatted); // Ya no se hace click en CSVLink
				setDataDetailsExcel([]);
			}
		}, [dataDetailsExcel]);

	 
    const _defaultAgencyWatch = watch('agency');

	 
    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


	 
    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">
						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Inventario actual</h3>
							</div>
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
									
									{	// Los cajeros no pueden filtrar por tienda
										(user.role !== 4) && <FormGroup className="mr-3">
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
										<input
										style={{minWidth:"181px"}}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={register}
										></input>
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
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Inventario actual"
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
						{data && data.length > 0 && (
                            <Button
                                className="btn"
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    exportDetailsExcel();
                                }}
                                disabled={loadingExcel}
                            >
                                <Icon icon={fileDownload} /> Exportar{" "}
                                {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                        )}
						
					</div>
				</div>
            </div>
        </>
    );
}

export default InventoryListPage;