/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Table, Form, FormGroup  } from 'reactstrap';
import { history } from '../../helpers';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { useForm  } from "react-hook-form";

function SalesListDailyPage() {

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
  	});
   
	//usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

	const dataSales = useSelector(state => state.sales.table);
    const loadingPage = useSelector(state => state.sales.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataSales && dataSales.results && dataSales.results.length > 0){
			setData(dataSales.results);
		}
  	},[dataSales]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
		{
			name: 'Sucursal',
			selector: 'agency.name',
			sortable: true,
			omit: true,//Esconder
		},
		{
			name: 'Cajero',
			cell : (row)=>{
				if(row.user){
					return `${row.user.firstName} ${row.user.lastName}`
				}
			},
			omit: true,//Esconder
		},
		{
			name: 'N° de Ticket',
			selector: 'order',
			sortable: true,
		},
		{
			name: 'Nombres',
			selector: 'names',
			sortable: true,
		},
		{
			name: 'Total',
			selector: 'total',
			sortable: true,
			cell : (row)=>{
				return <NumberFormat value={row.total?row.total.toFixed(2):row.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  />
			},
		},
		{
			name: 'Referencia',
			wrap:true,
			cell : (row)=>{
				if((row.pAmmount && row.pAmmount>0 || (row.pAmmountExtra && row.pAmmountExtra>0)) && !row.dollar && !row.eur && !row.cop && !row.tAmmount && !row.ves){
					if(row.pReferenceExtra != ""){
						return `${row.pReference}, ${row.pReferenceExtra}`;
					}else{
						return `${row.pReference}`;
					}
				}else if((row.tAmmount && row.tAmmount>0) && !row.dollar && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.ves){
					return `${row.tReference}`
				}else if((row.dollar && row.dollar>0) && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Dólar"
				}else if((row.eur && row.eur>0) && !row.dollar && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Euros"
				}else if((row.cop && row.cop>0) && !row.dollar && !row.eur && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount && !row.ves){
					return "Pesos"
				}else if((row.ves && row.ves>0) && !row.dollar && !row.eur && !row.cop && !row.pAmmount && !row.pAmmountExtra && !row.tAmmount){
					return "Efectivo"
				}else if((row.credit && row.credit>0)){
					return "Crédito"
				}else{
					return "Mixto"
				}
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
	];

	//data inicial
	const getDataTable = () => {
		let userData = {
			agency: user.agency.id,
			id: user.id
		}
		dispatch(salesActions.dataTableDaily(userData));
	}

	//Consultar al entrar
	useEffect(() => {
		setData([]);
		getDataTable();
	}, []);

	//Calcular total general cuando cambie la información
	const [loadingTotal, setLoadingTotal] = useState(false);
	const [general, setGeneral] = useState(0)
	useEffect(() => {
		let sumtotal = 0
		if(data && data.length>0){
			setLoadingTotal(true);
			for (let item of data) {
				sumtotal += item.total;
			}
		}
		setLoadingTotal(false);
		setGeneral(sumtotal);
	}, [data]);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	//Abrir/Cerrar filtros
	const [isOpen, setIsOpen] = useState(false);
	const toggle = () => setIsOpen(!isOpen);

	//Form Data Filter
	const { handleSubmit, register, reset } = useForm();

	//Consultar por filtros
	const onFilterData = (data, e) => {
		if(dataSales && dataSales.results){
			setData(dataSales.results.filter(item => ( 
					(item.order &&  item.order.toString().toLowerCase().includes(data.ticket.toLowerCase()))
					&& (item.names &&  item.names.toLowerCase().includes(data.names.toLowerCase()))
					&& ((item.pReference &&  item.pReference.toString().toLowerCase().includes(data.reference.toLowerCase()) 
						|| (item.tReference &&  item.tReference.toString().toLowerCase().includes(data.reference.toLowerCase())))
						|| (item.pReferenceExtra &&  item.pReferenceExtra.toString().toLowerCase().includes(data.reference.toLowerCase()))
					)	
				) 
			));
		}
	};

	const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

	const clearFilters = () =>{
		setResetPaginationToggle(!resetPaginationToggle);
		reset({ticket:'', names:'', reference:''});
		if(dataSales && dataSales.results){
			setData(dataSales.results);
		}
	}

	//Data al expandir una fila
	const ExpandedComponent = ({ data }) => (
		<>
		<div className="mb-2 mt-2"><b>Referencias</b></div>
		<Table striped responsive>
			<thead>
				<tr>
					<th>Transferencia</th>
					<th>Punto</th>
					<th>Punto adicional</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>{data.tReference ? data.tReference : ''}</td>
					<td>{data.pReference ? data.pReference : ''}</td>
					<td>{data.pReferenceExtra ? data.pReferenceExtra : ''}</td>
				</tr>
			</tbody>
    	</Table>
		<Table striped responsive>
			<thead>
				<tr>
					<th>Producto</th>
					<th>Precio</th>
					<th>Peso</th>
					<th>Total</th>
				</tr>
			</thead>
			<tbody>
			{data.products && data.products.map((product, index) => {
				return (
					<tr key={index}>
						<td>{product.name}</td>
						<td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
						<td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					</tr>
					)
				})
			}

			</tbody>
    	</Table>
		<div className="mb-2"><b>Métodos de pago</b></div>
		<Table striped responsive>
			<thead>
				<tr>
					<th>BsF</th>
					<th>$ Dólares</th>
					<th>€ Euros</th>
					<th>$ Pesos</th>
					<th>Transferencia</th>
					<th>Punto de venta</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><NumberFormat value={ data.ves ? data.ves.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.dollar ? data.dollar.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.eur ? data.eur.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.cop ? data.cop.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.tAmmount ? data.tAmmount.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
					<td><NumberFormat value={ data.totalTerminal ? data.totalTerminal.toFixed(2):0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></td>
				</tr>
			</tbody>
    	</Table>
		</>
	);

    return (
        <>
            <div className="d-flex" id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Ventas del día</h3>
							</div>
							<Button id="add" onClick={()=>history.push('/register-sale')} className="btn-round btn-icon" color="primary">
								<i className="fa fa-plus" />
							</Button>
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
									<FormGroup className="mr-3">
										<input
											className="form-control"
											placeholder="N° de Ticket"
											type="number"
											name="ticket"
											min="1"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<input
											className="form-control"
											name="names"
											placeholder="Nombres"
											type="text"
											ref={register}
										></input>
									</FormGroup>
									<FormGroup className="mr-3">
										<input
											className="form-control"
											name="reference"
											placeholder="Comanda o Referencia"
											type="text"
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
								expandableRows
								expandableRowsComponent={<ExpandedComponent />}
								sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
								title="Ventas"
								progressPending={loadingPage}
								paginationComponentOptions={paginationOptions}
								progressComponent={<CustomLoader />}
								noDataComponent="No hay registros para mostrar"
								noHeader={true}
								columns={columns}
								data={data}
								pagination
								paginationResetDefaultPage={resetPaginationToggle} // optionally, a hook to reset pagination to page 1
								subHeader
								persistTableHead
							/>
							</Col>
						</Row>
						{user.role !== 4 &&
						<Row xs="12">
							<Col><div className="pull-right">
								{loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>} 
								<b>Total: <NumberFormat value={general.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'}  /></b> 
							</div>
							</Col>
						</Row>}
						
					</div>
				</div>
            </div>
        </>
    );
}

export default SalesListDailyPage;