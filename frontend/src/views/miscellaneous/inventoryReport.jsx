/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousInventoryActions, userActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Modal, Form, FormGroup, Table } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { Role } from '../../helpers';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function InventoryReportPage() {

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
	const dataInventories = useSelector(state => state.miscellaneousInventory.data);
	const loadingPage = useSelector(state => state.miscellaneousInventory.loading);
	  
	//Verificar data de redux
	useEffect(() => {
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results);
		}
		else {
			setData([])
		}
		if(dataInventories && dataInventories.metadata && dataInventories.metadata[0]){
			setRowCount(dataInventories.metadata[0].total);
		}
		if(dataInventories && dataInventories.totalOutSellAmount){
			setTotalOutSellAmount(dataInventories.totalOutSellAmount);
		}
		else {
			setTotalOutSellAmount(0);
		}
  	},[dataInventories]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [totalOutSellAmount, setTotalOutSellAmount] = useState(null);
	const [rowCount, setRowCount] = useState(0);

	//Columnas Data table
	const columns = [
        {
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			wrap:true,
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
			wrap:true,
		},
		{
			name: 'Cantidad Inicial',
			selector: 'initial',
            sortable: false,
            cell : (row)=>{
				return  <NumberFormat 
					value={row.initial?row.initial:row.initial} 
					displayType={'text'} 
					thousandSeparator={','} 
					decimalSeparator={'.'}  
					decimalScale={row.initial % 1 !== 0 ? 3 : 0}
					fixedDecimalScale={row.initial % 1 !== 0}
					/>
			},
		},
		{
			name: 'Precio final',
			selector: 'product.price',
            sortable: false,
            cell : (row)=>{
				return  <NumberFormat value={row.product.price?row.product.price.toFixed(2):row.product.price} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='$ ' />
			},
		},
        {
			name: 'Entradas',
			selector: 'totalIn',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalIn?row.totalIn.toFixed(3):row.totalIn} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  
				decimalScale={row.totalIn % 1 !== 0 ? 3 : 0}
				fixedDecimalScale={row.totalIn % 1 !== 0}
				/>
			},
		},		
        {
			name: 'Traslados',
			selector: 'totalOutType3',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalOutType3?row.totalOutType3.toFixed(3):row.totalOutType3} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  
				decimalScale={row.totalOutType3 % 1 !== 0 ? 3 : 0}
				fixedDecimalScale={row.totalOutType3 % 1 !== 0}
				/>
			},
		},
		{
			name: 'Total Traslados $',
			sortable: false,
			selector: 'totalUsedAmount',
			cell: (row) => {
				const total = row.totalOutType3 && row.product?.price
					? row.totalOutType3 * row.product.price
					: 0;

				return (
					<NumberFormat
						value={total.toFixed(2)}
						displayType={'text'}
						thousandSeparator={','}
						decimalSeparator={'.'}
						prefix='$ '
					/>
				);
			},
		},
		{
			name: 'Desechos',
			selector: 'totalOutType2',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.totalOutType2?row.totalOutType2.toFixed(3):row.totalOutType2} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
						decimalScale={row.totalOutType2 % 1 !== 0 ? 3 : 0}
						fixedDecimalScale={row.totalOutType2 % 1 !== 0}
						/>
			},
		},
		{
			name: 'Total Desechos $',
			sortable: false,
			selector: 'totalUsedAmount',
			cell: (row) => {
				const total = row.totalOutType2 && row.product?.price
					? row.totalOutType2 * row.product.price
					: 0;

				return (
					<NumberFormat
						value={total.toFixed(2)}
						displayType={'text'}
						thousandSeparator={','}
						decimalSeparator={'.'}
						prefix='$ '
					/>
				);
			},
		},
		{
			name: 'Total Arit.',
			sortable: false,
			selector: 'TotalQuantity',
			cell : (row)=>{
				return  <NumberFormat value={row.TotalQuantity?row.TotalQuantity:row.TotalQuantity} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  
					decimalScale={row.TotalQuantity % 1 !== 0 ? 3 : 0}
					fixedDecimalScale={row.TotalQuantity % 1 !== 0}
				/>
			},
		},
		{
			name: 'Inv. físico',
			sortable: false,
			selector: 'physicalQuantity',
			cell : (row)=>{
				return  <NumberFormat value={row.physicalQuantity?row.physicalQuantity.toFixed(3):row.TotalQuantity.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  
							decimalScale={row.physicalQuantity % 1 !== 0 ? 3 : 0}
							fixedDecimalScale={row.physicalQuantity % 1 !== 0}
						/>
			},
        },
		{
			name: 'Usado',
			sortable: false,
			selector: 'usedAdjustment',
			cell : (row)=>{
				return  <NumberFormat value={row.usedAdjustment?row.usedAdjustment.toFixed(3):row.usedAdjustment} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  
						decimalScale={row.usedAdjustment % 1 !== 0 ? 3 : 0}
						fixedDecimalScale={row.usedAdjustment % 1 !== 0}
					/>			
			},
        },
		{
			name: 'Total usado $',
			sortable: false,
			selector: 'totalUsedAmount',
			cell: (row) => {
				const total = row.usedAdjustment && row.product?.price
					? row.usedAdjustment * row.product.price
					: 0;

				return (
					<NumberFormat
						value={total.toFixed(2)}
						displayType={'text'}
						thousandSeparator={','}
						decimalSeparator={'.'}
						prefix='$ '
					/>
				);
			},
		},
		{
			name: 'Fecha',
			selector: 'weekRange',
			sortable: true,
			wrap:true,
		},
	];

	//Data al expandir una fila data financieraen Bs
	const ExpandedComponent = ({ data }) => (
		<>
			<Table striped responsive>
				<thead>
					<tr>
						<th>Cantidad Inicial</th>
						<th>Compras</th>
						<th>Ventas</th>
						<th>Recorte</th>
						<th>Mermas</th>
						<th>Salidas</th>
						<th>Total Arit.</th>
						<th>Inv. físico</th>
						<th>Ajustes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><NumberFormat value={data.initialAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalInAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalSellAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalCutAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalDecreaseAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalOutAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.TotalAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.physicalAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={data.totalAdjustmentAmount.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					</tr>
				</tbody>
			</Table>
		</>
    );

	const headers = [
		{ label: "Fecha", key: "date" },
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Código Producto", key: "product.code" },
		{ label: "Producto", key: "product.name" },
		{ label: "Cantidad Inicial", key: "initial" },
		{ label: "Precio final", key: "price" },
		{ label: "Entradas", key: "totalIn" },
		{ label: "Traslados", key: "totalOutType3" },
		{label:"Total traslados $", key:'totalTraslados'},
		{ label: "Desechos", key: "totalOutType2" },
		{label:"Total desechos $", key:'totalDesechos'},
		{ label: "Inv. físico", key: "physicalQuantity" },
		{ label: "Usado", key: "totalOutSell" },
		{label:"Total usado $", key:'totalUsado'},
	];

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);


	//obtener data de usuario necesaria
	const getUserData = () => {
		return {
			agency: user.agency.id,
			role:user.role,
			id: user.id
		}
	}

	useEffect(() => {
		getDataTable(1)
	}, []);

	//Filas por default
	const [perPage] = useState(10);
	//Cantidad de filas seleccionadas
	const [perPageSelect, setPerPageSelect] = useState(0);
	//Direccion del ordenamiento y columna
	const [direction, setDirection] = useState({ "id":"date", "desc":true  });

	const getDataTable = (page) => {
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	const handlePageChange = async (page) => {
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	};
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
	};

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
	},[]);

	const [listAgencies, setListAgencies] = useState(null);

	useEffect(() => {
		if(users.obtained){
			setListAgencies(users.list.agencies);
		}
	},[users.obtained]);

	const [filters, setFilters] = useState('');

	const handleChangeStartDate = (date) => {
		setStartDate(date);
	}

	const handleChangeEndDate = (date) => {
		setEndDate(date);
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const clearFilters = () =>{
		setStartDate(''); 
		setEndDate(''); 
		reset({agency:'', startDate:'', endDate:'', code:''})
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	//Consultar por filtros
	const onFilterData = (data, e) => {
		var validStartDate =  moment(data.startDate).isValid();

		if(data.startDate != "" && !validStartDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		var validEndDate =  moment(data.endDate).isValid();

		if(data.endDate != "" && !validEndDate){
			setModalWarning(true);
			setModalMsg('Ingrese una fecha válida');
			return;
		}

		//Verificar que la fecha final sea superior o igual a la inicial
		var isafter = moment(data.startDate).isAfter(data.endDate);

		if(isafter){
			setModalWarning(true);
			setModalMsg('La fecha inicial no puede ser superior a la final');
			return;
		}

		var a = moment(data.startDate);
		var b = moment(data.endDate);
		let dateDiff = b.diff(a, 'days');

		//Si el rango de fechas es superior a los seis días abrir modal
		if ( dateDiff > 120 ){
			setModalWarning(true);
			setModalMsg('El rango de fechas no puede superar los 120 días');
			return;
		}

		setFilters(data);
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
	}

	/*** Exportar ***/
	const refExcel = useRef(null);

	const exportExcel = () => {
		//El mismo método, el ultimo parametro define si es para descarga
		dispatch(miscellaneousInventoryActions.dataTableReportInventories(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	}

	const mapDataWithHeaders = (data, headers) => {
		return data.map((item) => {
			const mappedItem = {};
			headers.forEach(({ label, key }) => {
				let value;
				
				// Para las propiedades calculadas que ya están en el item
				if (key === 'totalTraslados' || key === 'totalDesechos' || key === 'totalUsado') {
					value = item[key];
				} else {
					// Para las propiedades anidadas
					value = key.includes(".")
						? key.split(".").reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : ""), item)
						: item[key];
				}

				// Si el valor ya está formateado como string (con comas), lo dejamos así
				if (typeof value === 'string' && value.includes(',')) {
					mappedItem[label] = value;
				} 
				// Si es un número, lo formateamos
				else if (typeof value === 'number') {
					// Para valores monetarios (que terminan con $ en el label)
					if (label.includes('$')) {
						mappedItem[label] = value.toFixed(2).replace(".", ",");
					} else {
						mappedItem[label] = value.toFixed(3).replace(".", ",");
					}
				}
				// Para otros casos (strings, etc.)
				else {
					mappedItem[label] = value;
				}
			});
			return mappedItem;
		});
	};


	const exportToExcel = (data, filename = 'ReporteSuministros.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte de suministros');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};

	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	//Verificar data de redux de la data de excel
	useEffect(() => {
    if(excel && excel.results){
        // Se hace una copia de los detalles para que estos no sean los modificados
        let fixedData = excel.results.map((item) => {
            const newItem = Object.assign({}, item);
            
            // Agregar las propiedades calculadas
            newItem.totalTraslados = (newItem.totalOutType3 && newItem.price) 
                ? (newItem.totalOutType3 * newItem.price).toFixed(2).replace(".", ",")
                : '0.00';
            
            newItem.totalDesechos = (newItem.totalOutType2 && newItem.price) 
                ? (newItem.totalOutType2 * newItem.price).toFixed(2).replace(".", ",")
                : '0.00';
            
            newItem.totalUsado = (newItem.usedAdjustment && newItem.price) 
                ? (newItem.usedAdjustment * newItem.price).toFixed(2).replace(".", ",")
                : '0.00';
            
            // Formatear los valores numéricos
            newItem.initial = newItem.initial ? newItem.initial.toFixed(3).replace(".", ",") : "0,000";
            newItem.price = newItem.price ? newItem.price.toFixed(2).replace(".", ",") : "0,00";
            newItem.totalIn = newItem.totalIn ? newItem.totalIn.toFixed(3).replace(".", ",") : "0,000";
            newItem.totalOutType3 = newItem.totalOutType3 ? newItem.totalOutType3.toFixed(3).replace(".", ",") : "0,000";
            newItem.totalOutType2 = newItem.totalOutType2 ? newItem.totalOutType2.toFixed(3).replace(".", ",") : "0,000";
            newItem.TotalQuantity = newItem.TotalQuantity ? newItem.TotalQuantity.toFixed(3).replace(".", ",") : "0,000";
            newItem.physicalQuantity = newItem.physicalQuantity ? newItem.physicalQuantity.toFixed(3).replace(".", ",") : "0,000";
            newItem.usedAdjustment = newItem.usedAdjustment ? newItem.usedAdjustment.toFixed(3).replace(".", ",") : "0,000";
            
            return newItem;
        });

        setDataExcel(fixedData);
    }
}, [excel]);

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted);
			setDataExcel([]);
		}
	}, [dataExcel]);
	
	/*** Exportar ***/

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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte de inventario de suministros</h3>
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
                                    {(user.role == Role.Admin || user.role == Role.Supervisor || user.role == Role.Auditor || user.role == Role.suplyRole || user.role == 9) && <FormGroup className="mr-3">
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
									<FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
											isValidDate={currentDate => currentDate.day() === 1}
											inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" , required:true } } 
										/>
									</FormGroup>
									{/* <FormGroup className="mr-3">
										<Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
											inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
										/>
									</FormGroup> */}
									{/* <FormGroup className="mr-3">
										<label>
											<input 
												className="form-check-input"
												name="mixData"
												id="mixData" 
												type="checkbox" 
												value={true}
												ref={register}/> SUMAR PERIODOS
										</label>
									</FormGroup> */}
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
								striped
								responsive
								highlightOnHover
								//expandableRows
								//expandableRowsComponent={<ExpandedComponent />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Reporte de inventarios"
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
						{/* <Row xs="12">
							<Col><div className="pull-right">
								{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
								<b>Cantidad total usada en $: <NumberFormat value={ totalOutSellAmount ? totalOutSellAmount.toFixed(2): 0 } displayType={'text'} thousandSeparator={true} /></b> 
							</div>
							</Col>
						</Row> */}
						{/* Los Auditores no pueden exportar el reporte de inventario */}
						{ (data && data.length > 0 && user.role == 1  ||  user.role == 3 ) && <>
							<Button
                                className="btn"
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    exportExcel();
                                }}
                                disabled={loadingExcel}
                            >
                                <Icon icon={fileDownload} /> Exportar{" "}
                                {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
							</>	
						}
					</div>
					{/* Modal de notificaciones */}
					<Modal toggle={() => {setModalWarning(false); setModalMsg('')}} isOpen={modalWarning} className={`${darkMode ? "dark-mode" : ""}`}>
						<div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
						<h5 className="modal-title" id="examplemodalMsgLabel">
							Ventas
						</h5>
						<button
							aria-label="Close"
							className="close"
							type="button"
							onClick={() =>  {setModalWarning(false); setModalMsg('')}}
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
							onClick={() =>  {setModalWarning(false); setModalMsg('')}}
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

export default InventoryReportPage;