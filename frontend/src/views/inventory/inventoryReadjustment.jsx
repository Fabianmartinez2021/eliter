/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryActions, orderActions, userActions } from '../../actions';
import moment from 'moment'
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, UncontrolledTooltip, Modal, Table, Form, FormGroup, Label , Alert} from 'reactstrap';
//componente dataTable
import { Role, history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useForm, Controller } from "react-hook-form";
import { useRef } from 'react';
import { useDarkMode } from '../../helpers/darkModeContext';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 

function InventoryReadjustmentPage() {

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
	
	// Valores totales
	const [totalKg, setTotalKg] = useState(0);
	const [totalKgMinimum, setTotalKgMinimum] = useState(0);

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
			wrap:true,
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
			name: 'Inv. Físico',
			selector: 'physical',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.physical?row.physical.toFixed(3):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Stock Mínimo',
			selector: 'minimumStock',
			sortable: true,
			cell : (row)=>{
				return  <NumberFormat value={row.minimumStock?row.minimumStock.toFixed(3):''} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Pedido Realizado',
			selector: 'order',
			sortable: true,
			cell : (row)=>{
				return  <>
				<i style={{marginRight: "0.5rem"}} className={"fa fa-exclamation-circle " + (row.orderWasConfirmed ? "text-success" : "text-danger")}></i>
					<NumberFormat value={row.order?row.order.toFixed(3):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
				</>
			},
		},
		{
			name: 'Anexo Realizado',
			selector: 'modification',
			sortable: true,
			cell : (row)=>{
				return  <>
				<i style={{marginRight: "0.5rem"}} className={"fa fa-exclamation-circle " + (row.modificationWasConfirmed ? "text-success" : "text-danger")}></i>
					<NumberFormat value={row.modification?row.modification.toFixed(3):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
				</>
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
			name: 'Fecha Actualización',
			selector: 'updatedDate',
			sortable: true,
			cell : (row)=>{
				if(row.updatedDate){
					return moment(row.updatedDate).utc().format("YYYY-MM-DD hh:mm:ss a")
				}else{
					return ''
				}
				
			},
		},
		{
			name: 'Ajuste',
		    selector: 'physical',
			selector: 'kg',
			sortable: true,
			cell : (row)=>{
				if (row.physical != 0){

					let  result =  row.physical-row.kg;

					if(result < 0){
						return <>
							<i className="fa fa-arrow-down text-danger"></i>&nbsp;
							<NumberFormat value={result.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						</>
					}else {
						return <>
							<i className="fa fa-arrow-up text-success"></i>&nbsp;	
							<NumberFormat value={result.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
						</>
					}
				}
				else {
					return ''
				}
			},			
		},		
		{
			name: '', 
			button: true,
			cell: row => {
				return <>
						{
							((user.role === 3)&&(row.agency._id.toString() !== user.agency.id)) ?	//	Si es usuario Gerente, solo puede editar los productos de su sucursal
							
							''

							:

							<Button color="primary btn-round" size="sm" style={{fontSize:12}} onClick={e => 
								{
									e.preventDefault(); 
									setModalVisible(true);
									setEditRow(row);
								}
							}>Editar
							</Button>
						}
                	</>               
			} 
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

	//data inicial
	const getDataTable = () => {
		dispatch(inventoryActions.dataTable(getUserData()));
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

    //modal
    const [modalVisible, setModalVisible] = useState(false);
    //fila seleccionada
	const [editRow, setEditRow] =  useState(null);
	const [newValue, setNewValue] =  useState(null);
    //Form Data
    const { handleSubmit, errors, reset, control, register } = useForm();

    //Registrar data
    const onCreateData = (data, e) => {

		
		if(editRow){
			//id de inventario 
			let id = editRow.id;
			setNewValue(data.physical);
			data.user = user.id;
			dispatch(inventoryActions.updateInventoryReadjustment( id, data  ));
		}
	};
	
	//State de actualizacion
	const updating = useSelector(state => state.inventories.updating);
	const inventories = useSelector(state => state.inventories);

	//Actualizar estado de inventario al cambio de información
	useEffect(() => {
		if(inventories.success){
			//actualizar los kg en el grid
			let newPhysical = parseFloat(newValue);
			let newData = data.map(inv => {
				if(inv.id == editRow.id)
				   return Object.assign({}, inv, {physical:newPhysical, updatedDate:moment().subtract(4, 'hours')})
				return inv
			});
			
			setData(newData);
			setNewValue(null);
			reset({
				physical:'', comment:''
			});
			setModalVisible(false);
			setEditRow(null);
		}
	},[inventories.success]);

	//Alertas
	const alert = useSelector(state => state.alert);
	//Mostrar alertas
	const [visible, setVisible] = useState(true);
	const onDismiss = () => setVisible(false);

	useEffect(() => {
		if(alert.message){
			setVisible(true); 
			window.setTimeout(()=>{setVisible(false)},5000);   
		}

		//Si hay algun error cerrar modal y limpiar valores
		if(alert.type == "alert-danger"){
			setNewValue(null);
			reset({
				kg:''
			});
			setModalVisible(false);
			setEditRow(null);
		}
	},[alert]);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	const [filters, setFilters] = useState({});

	//Consultar por filtros
	const onFilterData = (data, e) => {

		
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results.filter(item => (
				//Solo admin y supervisor filtran por sucursal
				user.role == 1 || user.role == 2 || user.role == 3  || user.role == 7 || user.role == 6?
					(item.agency._id && item.agency._id.toString().toLowerCase().includes(data.agency.toLowerCase()))		
					&& (data.code !== "" ? item.product.code && item.product.code.toString().toLowerCase() == data.code.toLowerCase() : true)
				:
					(item.product.code &&  item.product.code.toString().toLowerCase() == data.code.toLowerCase())
				) 
			));

			const sortByProductCode = (itemA, itemB) => {
				const a = String(itemA.product?.code ?? '').trim();
				const b = String(itemB.product?.code ?? '').trim();
				const na = parseInt(a, 10);
				const nb = parseInt(b, 10);
				if (!isNaN(na) && !isNaN(nb) && a === String(na) && b === String(nb)) return na - nb;
				return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
			};

			const filteredArray = dataInventories.results.filter(item => (
				user.role == 1 || user.role == 2 || user.role == 3 || user.role == 7 || user.role == 6
					? (item.agency._id && item.agency._id.toString().toLowerCase().includes(data.agency.toLowerCase()))
					&& (data.code !== '' ? item.product.code && item.product.code.toString().toLowerCase() === data.code.toLowerCase() : true)
					: (item.product.code && item.product.code.toString().toLowerCase() === data.code.toLowerCase())
			)).sort(sortByProductCode);
			
			setInventoryProducts(filteredArray);
			
			setLastOrder(dataInventories.order);
			setLastModification(dataInventories.modification);

			setFilters(data);

			// Se calculan los valores totales
			const sumKg =  filteredArray.reduce((accumulator, currentValue) => {
				return accumulator + currentValue.kg
			},0);
			
			const sumKgMinimum =  filteredArray.reduce((accumulator, currentValue) => {
				return accumulator + currentValue.minimumStock
			},0);

			setTotalKg(sumKg);
			setTotalKgMinimum(sumKgMinimum);
		}
	};

	//Form filtros
	const { handleSubmit:handleSubmitFilter, register: registerFilter , reset:resetFilter, setValue: setFilterFormValue, watch: watchFilterForm } = useForm();

	const clearFilters = () =>{
		setResetPaginationToggle(!resetPaginationToggle);
		resetFilter({agency:'', code:''});
		if(dataInventories && dataInventories.results){
			setData(dataInventories.results);
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

	const agencyFilterWatch = watchFilterForm('agency');
	useSyncFirstAgencyFormField(listAgencies, setFilterFormValue, agencyFilterWatch);

	const [verify, setVerify] = useState(true);

	const [notVerifiedItems, setNotVerifiedItems] = useState(true);

	const probeItems = () => { 
		
		setVerify(!verify)
		
		let result = data.every((item) => {
			
			return !(item.kg && !moment(item.updatedDate).isSame(moment(), 'day'))
		})
		setNotVerifiedItems(result)
	}

	// Se realiza la verificacion por defecto al entrar
	useEffect(() => {
		if (data.length > 0){ 
			let result = data.every((item) => {
			
				return !(item.kg && !moment(item.updatedDate).isSame(moment(), 'day'))
			})
			setNotVerifiedItems(result)
		}
	},[data]);

	const conditionalRowStyles = [
		{
		  when: row => row.kg && !moment(row.updatedDate).isSame(moment(), 'day') && verify,
		  	style: {
				backgroundColor: 'rgba(255, 199, 199)',
			},
		},
	  ];


	//  PARA REALIZAR PEDIDOS 
		
	const order = useSelector( state => state.order )
	const loadingOrder = useSelector( state => state.order.loading )

	// Data para realizar pedidos
	const [inventoryProducts, setInventoryProducts] = useState([]);
	const [lastOrder, setLastOrder] = useState(null);
	const [lastModification, setLastModification] = useState(null);
	
    //	Form para el modal de la orden
	const { handleSubmit: handleSubmitOrder, register: registerOrder, control: controlOrder, errors: errorsOrder, reset:resetOrder } = useForm();

	// Estado para abrir o cerrar el modal de hacer pedido
	const [modalOrderOpen, setModalOrderOpen] = useState(false);
	const [dataToOrder, setDataToOrder] = useState(null);

	const onSubmitOrder = (data) => {

		// Con esto se avisa al backend si se estan enviando los datos correspondientes a una modificacion o no, para evitar incongruencias
		data.isModification = (lastOrder && lastOrder.wasConfirmed)
		// Se envian los datos
		dispatch(orderActions.createOrder(getUserData(), data))
	}

	// En caso de que se emita la orden de manera satisfactoria
	useEffect(() => {

		getDataTable();
		// Se cuerra el modal
		setModalOrderOpen(false)

	},[order.success]);

	
	/*** Exportar ***/

	const refExcel = useRef(null)

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


	const exportToExcel = (data, filename = 'registrarinventariofisico.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrar inventario físico');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};
	
	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);;
	const loadingExcel = useSelector(state => state.download.loading);
	

	const exportExcel = () => {

		let fixedData = data.map((value) => {return {...value}})

		//Se modifican los datos para la descarga en excel
		fixedData = fixedData.map((item, index) => {

			// Se eliminan las comas y se cambian los puntos por una coma
			
			item.kg = item.kg;
						
			item.physical = item.physical;
						

			item.minimumStock = item.minimumStock ? item.minimumStock : '';
			
			item.order = item.order ? item.order : '';
			
			item.modification = item.modification ? item.modification : '';


			//item.adjustment = Number(item.physical) - Number(item.kg);
			
			item.updatedDate = moment(item.updatedDate).utc().format("YYYY-MM-DD hh:mm:ss a");

			return item
		})


		setDataExcel(fixedData)
	}

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted); // Ya no se hace click en CSVLink
			setDataExcel([]);
		}
	}, [dataExcel]);

	const headers = [
		{ label: "Sucursal", key: "agency.name" },
		{ label: "Cod. Producto", key: "product.code" },
		{ label: "Producto", key: "product.name" },
		{ label: "Cantidad (kg/Unidad)", key: "kg" },
		{ label: "Precio (detal bs)", key: "product.price" },
		{ label: "Inv. Físico", key: "physical" },
		{ label: "Stock Mínimo", key: "minimumStock" },
		{ label: "Pedido Realizado", key: "order" },
		{ label: "Anexo Realizado", key: "modification" },
		{ label: "Fecha Actualización", key: "updatedDate" },
		//{ label: "Ajuste", key: "adjustment" },
	];
	
	/*** Exportar ***/


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3"> 

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic' , marginBottom:0}}>Registrar inventario físico</h3>
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
								<a href="#" onClick={e => {e.preventDefault(); toggle() }}>
									<i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
								</a>
								{isOpen && <a href="#" onClick={e => { e.preventDefault();  clearFilters(); }}>
									<i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
								</a>
								}	
							</div>
							{isOpen && <>
								<Form onSubmit={handleSubmitFilter(onFilterData)} className="form-inline" style={{marginTop:15}}>
									{(user.role == 1 || user.role == 2  || user.role == 3 || user.role == 7  || user.role == 6) && <FormGroup className="mr-3">
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
										<input
										style={{minWidth:"181px"}}
											className="form-control"
											placeholder="Cod. producto"
											type="text"
											name="code"
											maxLength={50}
											autoComplete="off"
											ref={registerFilter}
										></input>
									</FormGroup>
									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>
								</Form>
							</>
							}
						</div>
						<div className="align-self-right">
								<h6 style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '100px'}}>
									{ ((user.role === Role.Manager ||  (user.role === Role.Telesales))) && <Button color="primary" type="submit" disabled={loadingPage || (user.agency.id !== filters.agency)} onClick={() => setModalOrderOpen(true)}>
										Realizar pedido
									</Button>}
									<Button color="primary" type="submit" disabled={loadingPage || (user.agency.id !== filters.agency)} onClick={probeItems}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Comprobar
									</Button>
								</h6>
								{(verify) &&									
										(notVerifiedItems ? 
											
											<Alert color="success">
												Todos los productos están corresctamente actualizados
											</Alert>											
										:
											<Alert color="danger">
												Aún hay productos sin actualizar
											</Alert>)
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
								title="Invetario"
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
								conditionalRowStyles={conditionalRowStyles}
								theme={darkMode ? "dark" : "default"}
							/>
							</Col>
						
						</Row>
						<Row xs="12">
							<Col>
								<div className="pull-right">
									{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									{!!totalKg && <b>Kg que hay: <NumberFormat value={totalKg.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'kg '} /></b>}
								</div>
							</Col>
						</Row>
						<Row xs="12">
							<Col>
								<div className="pull-right">
									{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									{totalKgMinimum && <b>Kg que debe haber: <NumberFormat value={totalKgMinimum.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'kg '} /></b>}
								</div>
							</Col>
						</Row>
						<Row xs="12">
							<Col>
								<div className="pull-right">
									{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
									{(totalKg && totalKgMinimum) && <b>Porcentaje: <NumberFormat value={(totalKg / totalKgMinimum * 100).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'% '} /></b>}
								</div>
							</Col>
						</Row>
                        <Modal toggle={() => {setModalVisible(false); setEditRow(null)}} isOpen={modalVisible} backdrop="static" >
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Modificar
                            </h5>
                            <button aria-label="Close" className="close" type="button" onClick={() => {setModalVisible(false); setEditRow(null)}} disabled={updating}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                {editRow && <><Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Sucursal</th>
                                            <th>Producto</th>
                                            <th>kg/unidades</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr key={1}>
                                            <td>{editRow.agency.name}</td>
                                            <td>{editRow.product.name}</td>
                                            <td><NumberFormat value={ editRow.kg.toFixed(3) } displayType={'text'} thousandSeparator={true} /></td>
                                        </tr>      
                                    </tbody>
                                </Table>
                                <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                    <Row form>
                                        <Col md={12}>
                                            <Label for="physical">Cantidad</Label>
                                            <FormGroup>
                                                <Controller
                                                    name="physical"
                                                    control={control}
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "La cantidad es requerida"
                                                        },
                                                        setValueAs: (value) => {

                                                            return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                        },
                                                        required: "La cantidad es requerida",
                                                    }}
                                                    as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errors.physical ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errors.physical && <div className="invalid-feedback">{errors.physical.message}</div>}
                                            </FormGroup>
                                        </Col>
										<Col md={12}>  
										</Col>

                                    </Row>
                                    <div className="modal-footer">
                                        <Button color="primary" disabled={updating}>
                                            {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Guardar cambios
                                        </Button>
                                        <Button color="secondary" type="button"onClick={() =>  {setModalVisible(false); setEditRow(null)}} disabled={updating}>
                                            Cerrar
                                        </Button>
                                    </div>
                                </Form>
                                </>
                                }
                                {
                                !editRow && <>
                                    <span className="spinner-border spinner-border-sm mr-1"></span>
                                    <div className="modal-footer">
                                        <Button color="secondary" type="button"onClick={() =>  {setModalVisible(false); setEditRow(null)}}>
                                            Cerrar
                                        </Button>
                                    </div>
                                </>
                                } 
                            </div>
                            
                        </Modal>
						
						<Modal toggle={() => {setModalOrderOpen(false)}} isOpen={modalOrderOpen} backdrop="static" className={"modal-lg"}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ingreso de los valores a solicitar 
                            </h5>
                            <button  aria-label="Close" className="close" type="button" onClick={() =>  {setModalOrderOpen(false)}}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
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
							<Form onSubmit={handleSubmitOrder(onSubmitOrder)} className="form">

									<Row>
										<Col md={1}>
											<div className="modal-header" >
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Cód.
												</h5>
											</div>
										</Col>
										<Col md={3}>
											<div className="modal-header" >
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Producto 
												</h5>
											</div>
										</Col>
										<Col md={2} className={"px-0.5"}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Inventario 
												</h5>
											</div>
										</Col>
										<Col md={2}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Orden inicial
												</h5>
											</div>
										</Col>
										<Col md={2}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Anexo
												</h5>
											</div>
										</Col>
										<Col md={2}>
											<div className="modal-header" style={{paddingLeft:'0'}}>
												<h5 className="modal-title my-10px" id="examplemodalMsgLabel">
													Stok mínimo.
												</h5>
											</div>
										</Col>
									</Row>
									<div className="modal-body" >
										{(inventoryProducts.length > 0) && inventoryProducts.map((item, index) => {
											const invDisplayKg = item.physical
												? Number(item.physical)
												: Number(item.kg ?? 0);
											const invDisplaySafe = Number.isFinite(invDisplayKg) ? invDisplayKg : 0;
											return (
											<Row form key={item.product.code} style={{marginBottom:'0.5rem'}}>
												<Col md={1} style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
															<b>{item.product.code}</b>
														</Label>
													</FormGroup>
												</Col>
												<Col md={3} style={{display: "flex", alignItems: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
															<b>{item.product.name}</b>
														</Label>
													</FormGroup>
												</Col>
												<Col md={2} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
														<NumberFormat value={invDisplaySafe.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix='Kg  ' />
														</Label>
													</FormGroup>
												</Col>
												<Col md={2}>
													<FormGroup>
														<Controller
															name={`product.${item.product.code}`}
															control={controlOrder}
															placeholder={"Ingrese cantidad"}
															defaultValue={ (lastOrder && lastOrder.products[index])? lastOrder.products[index].kg : 0}
															disabled={lastOrder && lastOrder.wasConfirmed}
															rules={{
																min: {
																	value: 0,
																	message: "El monto es requerido"
																},
																required: "El monto es requerido",
															}}
															as={<NumberFormat className={'form-control' + (errorsOrder.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
														/>
													</FormGroup>
												</Col>
												<Col md={2}>
													<FormGroup>
														<Controller
															name={`productModification.${item.product.code}`}
															control={controlOrder}
															placeholder={"Ingrese cantidad"}
															disabled={!(lastOrder && lastOrder.wasConfirmed) || (lastModification && lastModification.wasConfirmed)}
															defaultValue={ (lastModification && lastModification.products[index])? lastModification.products[index].kgDifferential : 0}
															rules={{
																min: {
																	message: "El monto es requerido"
																},
																required: "El monto es requerido",
															}}
															as={<NumberFormat className={'form-control' + (errorsOrder.dollar ? ' is-invalid' : '')} thousandSeparator={true} />}
														/>
													</FormGroup>
												</Col>
												<Col md={1} style={{display: "flex", alignItems: "center", marginLeft: "auto"}}>
													<FormGroup style={{margin: "0"}}>
														<Label for="name">
															<b>Kg {item.minimumStock}</b>
														</Label>
													</FormGroup>
												</Col>
											</Row>
											);
										})}
									</div>
									<Row>
                                        <Col md={12}>
											<FormGroup>
											<Label for="comment">Nota: Debe igualar o superar su stok actual al stok mínimo indicado, sin embargo, si hay bajas de inventario por análisis externo como días feriados, situaciones alterna que demoren el despacho o pedidos al mayor puntuales. La responsabilidad recae sobre el gerente de igual manera.</Label>
												<Label for="comment">Comentario</Label>
												<input
													maxLength="200"
													autoComplete="off"
													placeholder='Ingrese un comentario (Opcional)'
													className={'form-control' + (errorsOrder.comment ? ' is-invalid' : '')}
													name="comment"
													defaultValue={ (lastOrder && !lastOrder.wasConfirmed && lastOrder.comment) ? lastOrder.comment : ((lastModification && lastModification.comment)? lastModification.comment : '')}
													ref={registerOrder}
												/>
												{errorsOrder.comment && <div className="invalid-feedback">{errorsOrder.comment.message}</div>}
											</FormGroup>
                                        </Col>
									</Row>

                                    <div className="d-flex justify-content-between">
										<Button color="primary" disabled={loadingOrder || (lastModification && lastModification.wasConfirmed)}>
                                            {loadingOrder && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Confirmar pedido
                                        </Button>  
										                                       
										<Button color="secondary" type="button" onClick={() =>  {setModalOrderOpen(false)}}>
											Cerrar
										</Button>
                                    </div>
                                </Form>  
                            </div>
                        </Modal>						
						{data && data.length > 0 && (
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
                        )}
					</div>
				</div>
            </div>
        </>
    );
}

export default InventoryReadjustmentPage;