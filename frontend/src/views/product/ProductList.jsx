/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { salesActions, userActions } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { productActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { InputGroup, InputGroupAddon, Button, Input, Spinner, Row, Col, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText, UncontrolledTooltip } from 'reactstrap';
//componente dataTable sede
import { Role, history } from '../../helpers';
import useDebounce from '../../components/Debounce';
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css";

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
	return <InputGroup style={{ "width": "200px" }}>
		<Input autoComplete="off" style={{ "height": "38px", "marginTop": "10px" }} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>
}

const formatter = new Intl.NumberFormat('es-Es', {
	minimumFractionDigits: 2
})

function ProductListPage() {

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

	//Verificar data de redux
	useEffect(() => {
		if (dataProducts) {
			setData(dataProducts.results);
		} else {

		}
	}, [dataProducts]);

	// Inicializar tabla sin data
	const [data, setData] = useState([])



	//Obtener toda la data necesaria para ventas
	const getting = useSelector(state => state.sales.getting);
	const sales = useSelector(state => state.sales);


	//Obtener monedas, productos y terminales de sucursal
	useEffect(() => {
		dispatch(salesActions.salesDataForm(user.agency.id));
	}, []);

	const [listCoin, setListCoin] = useState(null);
	const [listProducts, setListProducts] = useState(null);
	const [offerProducts, setOfferProducts] = useState(null);

	useEffect(() => {
		if (sales.obtained) {
			setListCoin(sales.data.coins);
			setListProducts(sales.data.products);
			setOfferProducts(sales.data.offers);
		}
	}, [sales.obtained]);
	const valueDollar = listCoin ? listCoin[0].value : "";
	const valueEur = listCoin ? listCoin[1].value : "";
	const valueCop = listCoin ? listCoin[2].value : "";

	// Estado para la tasa del día siguiente
	const [nextDayRate, setNextDayRate] = useState('');

	//Estado para guardar precios
	const updatingPrices = useSelector(state => state.products.updatingPrices);
	const pricesUpdated = useSelector(state => state.products.pricesUpdated);

	//Función para guardar precios del día siguiente
	const handleSavePrices = () => {
		if (!nextDayRate || parseFloat(nextDayRate) <= 0) {
			alert('Por favor, ingrese una tasa válida mayor a 0');
			return;
		}

		if (!data || data.length === 0) {
			alert('No hay productos para actualizar');
			return;
		}

		// Preparar los productos con sus nuevos precios calculados
		const productsToUpdate = data.map(product => {
			const nextDayPrice = product.price ? (product.price * parseFloat(nextDayRate)) : 0;
			return {
				id: product.id,
				nextDayPrice: nextDayPrice
			};
		});

		dispatch(productActions.updateProductsPrices(parseFloat(nextDayRate), productsToUpdate, user));
	};

	//Efecto para limpiar estado después de guardar
	useEffect(() => {
		if (pricesUpdated) {
			setNextDayRate('');
			// Recargar la tabla después de un pequeño delay para que el usuario vea el mensaje de éxito
			setTimeout(() => {
				getDataTable();
			}, 500);
		}
	}, [pricesUpdated]);

	//Columnas Data table
	const columns = useMemo(() => [
		{
			name: 'Código',
			selector: 'code',
			sortable: true,
			compact: true,
			center: true
		},
		{
			name: 'Nombre',
			selector: 'name',
			sortable: true,
			wrap: true,
			compact: true,
			cell: (row) => row.name,
		},
		{
			name: 'Presentación',
			selector: 'presentation',
			sortable: true,
			compact: true
		},
		{
			name: 'Merma por empaque',
			selector: 'decrease',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.decrease == true ? "Si" : "No")
			},
		},
		{
			name: 'Merma por humedad',
			selector: 'reweigh',
			sortable: true,
			compact: true,

			cell: (row) => {
				return (row.reweigh == true ? "Si" : "No")
			},
		},
		{
			name: 'Merma por picadillo',
			selector: 'mincemeat',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.mincemeat == true ? "Si" : "No")
			},
		},
		{
			name: 'Precio al detal ($)',
			selector: 'price',
			sortable: true,
			compact: true,
			omit: user.role !== 1,
			cell: (row) => {
				return <NumberFormat value={row.price} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Precio al detal (bs)',
			selector: 'price',
			sortable: true,
			compact: true,
			cell: (row) => {
				const priceInBs = valueDollar && row.price ? (row.price * valueDollar).toFixed(0) : 0;
				return <NumberFormat value={priceInBs} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Precio al detal (anterior)',
			selector: 'lastPrice',
			sortable: true,
			omit: true,
			compact: true,
			cell: (row) => {
				return <NumberFormat value={row.lastPrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},
		{
			name: 'Precio al mayor',
			selector: 'wholesalePrice',
			sortable: true,
			compact: true,
			omit: true,
			cell: (row) => {
				return <NumberFormat value={row.wholesalePrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Precio al mayor (anterior)',
			selector: 'lastWholesalePrice',
			sortable: true,
			omit: true,
			compact: true,
			cell: (row) => {
				return <NumberFormat value={row.lastWholesalePrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Peso Mínimo',
			selector: 'minWeight',
			sortable: true,
			compact: true,
			omit: true,
			cell: (row) => {
				return <NumberFormat value={row.minWeight} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} suffix={' kg'} />
			},
		},
		{
			name: 'Aplica para descuento al mayor',
			selector: 'applyWholesaleDiscount',
			sortable: true,
			omit: true,
			cell: (row) => {
				return (row.applyWholesaleDiscount == true ? "Si" : "No")
			},
		},
		{
			name: 'Precio de descuento',
			selector: 'wholesaleDiscountPrice',
			sortable: true,
			omit: true,
			compact: true,
			cell: (row) => {
				return <NumberFormat value={row.wholesaleDiscountPrice ? row.wholesaleDiscountPrice : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Editar',
			button: true,
			compact: true,
			omit: user.role !== 1,
			cell: row => (
				<Button
					outline
					color="primary"
					size="sm"
					title="Editar producto"
					aria-label="Editar producto"
					onClick={e => {
						e.preventDefault();
						history.push('/update-product', { id: row.id });
					}}
				>
					<i className="fa fa-pencil" aria-hidden="true" />
				</Button>
			),
		},
		{
			name: 'Fecha de actualización',
			selector: 'updateDate',
			sortable: true,
			cell: (row) => {
				return row.updateDate ? moment(row.updateDate).utc().format("YYYY-MM-DD hh:mm:ss a") : ''
			},
		},
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell: (row) => {
				return moment(row.createdDate).utc().format("YYYY-MM-DD")
			},
		},
		{
			name: 'Precio para mañana',
			selector: 'nextDayPrice',
			sortable: true,
			compact: true,
			cell: (row) => {
				// Si hay una tasa ingresada en el input, calcular temporalmente
				// Si no hay tasa pero existe nextDayPrice del backend, mostrar ese valor
				let displayPrice = 0;
				if (nextDayRate && row.price) {
					// Calcular con la tasa del input (preview temporal)
					displayPrice = (row.price * parseFloat(nextDayRate)).toFixed(0);
				} else if (row.nextDayPrice !== undefined && row.nextDayPrice !== null) {
					// Mostrar el valor guardado del backend
					displayPrice = row.nextDayPrice.toFixed(0);
				}
				return <NumberFormat value={displayPrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} />
			},
		},

	], [nextDayRate, user.role, valueDollar]);

	//data inicial
	const getDataTable = () => {
		dispatch(productActions.dataTable());
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
				if (dataProducts && dataProducts.results) {
					setData(dataProducts.results);
				}
			}
		};
		return <FilterComponent onFilter={e => setFilterText(e.target.value)} onClear={handleClear} filterText={filterText} />;
	}, [filterText, resetPaginationToggle]);


	//Filtrar con delay 
	useEffect(() => {
		if (dataProducts && dataProducts.results) {
			if (debouncedSearchTerm) {
				setData(dataProducts.results.filter(item => (
					(item.createdDate && moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
					|| item.code && item.code.toString().toLowerCase().includes(filterText.toLowerCase())
					|| item.price && item.price.toString().toLowerCase().includes(filterText.toLowerCase())
					|| item.name && item.name.toLowerCase().includes(filterText.toLowerCase())
					|| item.presentation && item.presentation.toString().toLowerCase().includes(filterText.toLowerCase())

				)
				));
			}
		}
	}, [debouncedSearchTerm]);

	//Consultar al entrar
	useEffect(() => {
		getDataTable();
	}, []);

	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	/*** Exportar ***/

	const refExcel = useRef(null)

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);;
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


	const exportToExcel = (data, filename = 'catalogodeproductos.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo de productos');

		const excelBuffer = XLSX.write(workbook, {
			bookType: 'xlsx',
			type: 'array'
		});

		const blob = new Blob([excelBuffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});

		saveAs(blob, filename);
	};

	const exportExcel = () => {

		let fixedData = data

		//Se modifican los datos para la descarga en excel
		fixedData.forEach((item) => {

			// Se modifican los true y false por Si o No
			item.decrease = item.decrease ? "Si" : "No";
			item.reweigh = item.reweigh ? "Si" : "No";
			item.mincemeat = item.mincemeat ? "Si" : "No";

			item.type = item.taxed ? "Gravado" : item.exempt ? "Exento" : "N/A"
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
		{ label: "Código", key: "code" },
		{ label: "Nombre", key: "name" },
		{ label: "Presentación", key: "presentation" },
		{ label: "Merma por empaque", key: "decrease" },
		{ label: "Merma por humedad", key: "reweigh" },
		{ label: "Merma por picadillo", key: "mincemeat" },
		{ label: "Precio", key: "price" },
	];

	/*** Exportar ***/

	return (
		<>
			<div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar />
				<div id="page-content-wrapper">
					<AdminNavbar />
					<div className="flex-column flex-md-row p-3">

						<div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
							<div className="align-self-center">
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Catálogo de productos</h3>
							</div>
							{(user.role === 1) && <>
								<div>
									<span style={{ fontWeight: 'bold', marginRight: 8 }}>
										Añadir
									</span>
									<Button id="add" disabled={user.role != Role.Admin} onClick={() => history.push('/register-product')} className="btn-round btn-icon" color="primary">
										<i className="fa fa-plus" />
									</Button>
								</div>
							</>}
						</div>
						{user.role === 100 && (
							<Row className="mb-3" style={{ padding: "4px 16px" }}>
								<Col xs="12" md="6" lg="5" className="d-flex align-items-center">
									<div className="d-flex align-items-center" style={{ gap: "10px" }}>
										<Input
											type="number"
											placeholder="Tasa"
											value={nextDayRate}
											onChange={(e) => setNextDayRate(e.target.value)}
											style={{
												height: "40px",
												fontSize: "14px",
												borderRadius: "4px",
												width: "180px"
											}}
											min="0"
											step="0.01"
											disabled={updatingPrices}
										/>
										<Button
											color="primary"
											onClick={handleSavePrices}
											disabled={updatingPrices || !nextDayRate || parseFloat(nextDayRate) <= 0}
											style={{
												height: "40px",
												borderRadius: "4px",
												minWidth: "120px",
												fontWeight: "500",
											}}
										>
											{updatingPrices ? (
												<>
													<span className="spinner-border spinner-border-sm mr-2" style={{ width: "1rem", height: "1rem" }}></span>
													Guardando...
												</>
											) : (
												<>
													<i className="fa fa-save mr-2"></i>
													Guardar
												</>
											)}
										</Button>
									</div>
								</Col>
							</Row>
						)}
						<Row>
							<Col>
								<DataTable
									className="dataTables_wrapper"
									//expandableRows
									//expandableRowsComponent={<ExpandedComponent />}
									responsive
									highlightOnHover
									striped
									sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
									title="Productos"
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
									subHeaderComponent={subHeaderComponentMemo}
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

export default ProductListPage;