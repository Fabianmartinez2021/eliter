/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../../actions';
import { reportsFiscalActions } from '../../actions/reportsFiscal.actions'
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Modal, Form, FormGroup, Table } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import '../../assets/css/options.css';

import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { Role } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import * as XLSX from "xlsx";
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

// Lista de empresas
const companies = [
    "EMBUTIDOS FATTORIA",
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

function ReportFiscalPage() {

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

      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);
  
      // Configura las columnas de la tabla

	const columns = [
	{
		name: 'Cod. Producto',
		selector: row => row.code || 'N/A',
		sortable: true,
	},
	{
		name: 'Producto',
		selector: row => row.name,
		sortable: true,
		wrap: true,
	},
	{
		name: 'Costo Unitario inicial',
		selector: row => row.avgLastPrice,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.avgLastPrice || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	{
		name: 'Cantidad inicial',
		selector: row => row.quantityI,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.quantityI || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={3}
			suffix=" kg"
		/>
		),
	},
	{
		name: 'Monto inicial',
		selector: row => row.amountI,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.amountI || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	{
		name: 'Cantidad compras',
		selector: row => row.quantity,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.quantity || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={3}
			suffix=" kg"
		/>
		),
	},
	{
		name: 'Monto compras',
		selector: row => row.amount,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.amount || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	{
		name: 'Costo Unitario ventas',
		selector: row => row.finalUnitCost,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.finalUnitCost || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	{
		name: 'Cantidad ventas',
		selector: row => row.finalQuantity,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.finalQuantity || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={3}
			suffix=" kg"
		/>
		),
	},
	{
		name: 'Monto ventas',
		selector: row => row.finalAmount,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.finalAmount || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	{
		name: 'Cantidad Final',
		selector: row => row.totalQuantity,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.totalQuantity || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={3}
			suffix=" kg"
		/>
		),
	},
	{
		name: 'Monto Final',
		selector: row => row.finalInventory,
		sortable: true,
		right: true,
		cell: row => (
		<NumberFormat
			value={row.finalInventory || 0}
			displayType="text"
			thousandSeparator="."
			decimalSeparator=","
			fixedDecimalScale={true}
			decimalScale={2}
			suffix=" bs"
		/>
		),
	},
	];

   
	//usuario
    const user = useSelector(state => state.authentication.user);

    const dispatch = useDispatch();

	const reportsFiscal = useSelector(state => state.reportsFiscal)
	console.log('reportsFiscal', reportsFiscal)
    const loadingPage = useSelector(state => state.reportsFiscal.loading);
	  
	// Inicializar tabla sin data
	const [data, setData] = useState([]);
	const [totalAdjustment, setTotalAdjustment] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [rowCount, setRowCount] = useState(0);


	
	//Opciones de paginacion
	const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

	//Loader de la tabla
	const CustomLoader = () => (<><div className="loading-table"></div></>);

	// //Modal mermas
	// const [modalVisible, setModalVisible] = useState(false);

	// //Modal mermas
	// const [modalDepartureVisible, setModalDepartureVisible] = useState(false);

	// //Modal recortes
	// const [modalCutVisible, setModalCutVisible] = useState(false);

	// const [listDetail, setListDetail] = useState([]);
	// const [totalDetail, setTotalDetail] = useState(0);

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
	const [direction, setDirection] = useState({ "id":"date", "desc":true  });

	useEffect(() => {
		getDataTable(1);
	}, []);
	
	const getDataTable = (page) => {
		dispatch(reportsFiscalActions.dataTableReportFiscal(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
	}

	//Paginar
	// const handlePageChange = async (page) => {
	// 	dispatch(reportsFiscalActions.dataTableReportFiscal(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
	// };
	
	//Ordenar
	const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
		setDirection(sort);
		dispatch(reportsFiscalActions.dataTableReportFiscal(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
	};

	//Cambiar cantidad de filas
	const handlePerRowsChange = async (newPerPage, page) => {
		setPerPageSelect(newPerPage);
		dispatch(reportsFiscalActions.dataTableReportFiscal(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
	};

	//Form Data Filter
	const { handleSubmit, register, setValue, reset, errors, watch } = useForm();

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
		setSelectedMonth(''); 
		reset({agency:'', company:'', month:'', code:''})
		// setFilters('');
	}

	//Modal genérico y mensaje
	const [modalWarning, setModalWarning] = useState(false);
	const [modalMsg, setModalMsg] = useState('');

	const [isExportDisabled, setIsExportDisabled] = useState(true);

	const [selectedMonth, setSelectedMonth] = useState(""); // Estado para almacenar el mes seleccionado
	
	const handleChangeMonth = (date) => {
		if (moment(date, 'YYYY-MM', true).isValid()) {
			const formattedMonth = moment(date).format('YYYY-MM');
			setSelectedMonth(formattedMonth); // Actualiza el estado local
			setValue('month', formattedMonth); // Actualiza el valor en el formulario
		} else {
			setSelectedMonth(""); // Limpia el estado si el valor no es válido
			setValue('month', ""); // Limpia el formulario si el valor no es válido
		}
	};
	
	

	const handlePageChange = (page) => {
		setCurrentPage(page); // Actualiza la página actual
	};

	const onFilterData = (data, e) => {
	
		const month = data.month; // Obtén el mes directamente del formulario
	
		// Validar el mes seleccionado
		const validMonth = moment(month, 'YYYY-MM', true).isValid();
		if (!validMonth) {
			setModalWarning(true);
			setModalMsg('Ingrese un mes válido');
			return;
		}
	
		// Verificar que el mes no esté en el futuro
		const selectedMonthMoment = moment(month, 'YYYY-MM');
		const currentMonth = moment().startOf('month');
		if (selectedMonthMoment.isAfter(currentMonth)) {
			setModalWarning(true);
			setModalMsg('El mes seleccionado no puede ser futuro');
			return;
		}
	
		// Actualizar el estado del botón de exportar
		setIsExportDisabled(false);
	
		// Establecer los filtros y realizar la acción correspondiente
		setFilters(data);
	
		dispatch(reportsFiscalActions.dataTableReportFiscal(
			getUserData(),
			1,
			perPageSelect === 0 ? perPage : perPageSelect,
			direction,
			data,
			false
		))
	};

	const reportData = {
		invoices: reportsFiscal.data?.invoices || [],
		sales: reportsFiscal.data?.salesFiscal || [],
		inventory: reportsFiscal.data?.inventoryRecordFiscal || [],
	};


	

	const combinedData = reportData ? (() => {
		const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

		const agencyData = reportData.invoices?.[0]?.agency || {
			name: "N/A",
			company: "N/A",
			address: "N/A",
		};

		const productsFromInvoices = [...(reportData.invoices || []).flatMap(inv => inv.products || [])];

		const productsData = productsFromInvoices
			.reduce((acc, item) => {
				const productName = item.product?.name || item.name || 'N/A';
				const existingProduct = acc.find(p => p.name === productName);

				if (existingProduct) {
					existingProduct.quantity += Number(item.kg || 0);
					existingProduct.totalAmount += (Number(item.lastPrice) || 0) * (Number(item.kg) || 0);
					existingProduct.productCount += 1;
					existingProduct.lastPrices.push(Number(item.lastPrice) || 0);
					const code = item.product?.code || item.code;
                	if (code) existingProduct.codes.add(code);
				} else {
					const code = item.product?.code || item.code;
					acc.push({
						name: productName,
						codes: new Set(code ? [code] : []),
						quantity: Number(item.kg || 0),
						totalAmount: (Number(item.lastPrice) || 0) * (Number(item.kg) || 0),
						productCount: 1,
						lastPrices: [Number(item.lastPrice) || 0],
						quantityI: 0,
						finalQuantity: 0,
						finalUnitCost: 0,
						finalAmount: 0,
						totalQuantity: 0,
						finalInventory: 0
					});
				}
				return acc;
			}, [])
			.map(item => {
				const inventoryData = (reportData.inventory || [])
					.filter(inv => (inv.product?.name || inv.name) === item.name)
					.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
				const lastInventoryEntry = inventoryData[0];
				const quantityI = lastInventoryEntry?.kg || 0;

				const avgPrice = item.lastPrices.reduce((sum, price) => sum + price, 0) / item.lastPrices.length || 0;

				const allSalesProducts = (reportData.sales || []).flatMap(sale => sale.products || []);
				const salesData = allSalesProducts.filter(p => (p.product?.name || p.name) === item.name);

				const finalQuantity = salesData.reduce((sum, sale) => sum + (Number(sale.kg) || 0), 0);
				const finalUnitCost = salesData.reduce((sum, sale) => sum + (Number(sale.price) || 0), 0) / (salesData.length || 1);
				const finalAmount = finalUnitCost * finalQuantity || 0;

				const totalQuantity = (quantityI + item.quantity) - finalQuantity;
				const finalInventory = avgPrice * totalQuantity;

				return {
					code: [...item.codes].join(', '),// mostrar todos los códigos asociados separados por coma
					name: item.name,
					quantityI: roundToTwo(quantityI),
					amountI: roundToTwo(avgPrice * quantityI),
					quantity: roundToTwo(item.quantity),
					avgLastPrice: roundToTwo(avgPrice),
					amount: roundToTwo(avgPrice * item.quantity),
					finalQuantity: roundToTwo(finalQuantity),
					finalUnitCost: roundToTwo(finalUnitCost),
					finalAmount: roundToTwo(finalAmount),
					totalQuantity: roundToTwo(totalQuantity),
					finalInventory: roundToTwo(finalInventory),
					agencyName: agencyData.name,
					agencyCompany: agencyData.company,
					agencyAddress: agencyData.address,
					_debug: {
						salesCount: salesData.length,
						inventoryCount: inventoryData.length,
						avgPriceCalculated: avgPrice
					}
				};
			});

		return productsData;
	})() : [];


	
	/*** Exportar ***/
	const refExcel = useRef(null);

	// const exportExcel = () => {
	// 	//El mismo método, el ultimo parametro define si es para descarga
	// 	dispatch(reportsFiscalActions.dataTableReportFiscal(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
	// }

	const excel = useSelector(state => state.download.excel);
	const loadingExcel = useSelector(state => state.download.loading);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);

	// Verificar data de Redux de la data de Excel
	useEffect(() => {
		if (excel && excel.combinedData) {
			// Crear una copia de los datos originales
			let fixedData = excel.combinedData.map((item) => ({ 
				...item,
				avgLastPrice: item.avgLastPrice.toString().replace(",", ".") || 0,
				initialAmount: item.initialAmount.toString().replace(",", ".") || 0,
				totalIn: item.totalIn.toString().replace(",", ".") || 0,
				quantityI: item.quantityI?.toString().replace(",", ".") || "0" || 0,
				amountI: item.amountI?.toString().replace(",", ".") || "0" || 0,
				quantity: item.quantity.toString().replace(",", ".") || 0,
				finalAmount: item.finalAmount.toString().replace(",", ".") || 0,
				finalUnitCost: item.finalUnitCost.toString().replace(",", ".") || 0,
				finalQuantity: item.finalQuantity.toString().replace(",", ".") || 0,
				autoConsumoC: item.autoConsumoC?.toString().replace(",", ".") || "0" || 0,
				autoConsumoM: item.autoConsumoM?.toString().replace(",", ".") || "0" || 0,
				totalQuantity: item.totalQuantity.toString().replace(",", ".")|| 0,
				finalInventory: item.finalInventory.toString().replace(",", ".") || 0,
				
			}));


			// // Modificar los datos para limpiar etiquetas, convertir a números y formatear
			fixedData.forEach((item) => {
			});

			// Establecer los datos procesados
			setDataExcel(fixedData);
		}
	}, [excel]);


	const headers = [
		["", "DESCRIPCION", "COSTO UNITARIO", "CANTIDAD", "MONTO", 
		"CANTIDAD", "MONTO", "COSTO UNITARIO", "CANTIDAD", "MONTO", 
		"CANTIDAD", "MONTO","CANTIDAD FINAL", "INV. FINAL"],
	];

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

	const exportExcel = () => {

		if (!listAgencies) {
			console.log("Lista de agencias no cargada aún.");
			return; // O mostrar un mensaje de advertencia si es necesario
		}
	
		// Información general basada en filtros
		const agencyId = filters.agency || "N/A"; // Sucursal del filtro
		const month = filters.month || "N/A"; // Mes del filtro
	
		// Buscar la agencia por su ID
		const agency = listAgencies.find(agency => agency.id === agencyId);
	
		// Si no se encuentra la agencia, asignar "N/A" a todos los campos
		const company = agency ? agency.company : ( filters.company || "N/A"); // Nombre de la agencia o "N/A"
		const address = agency ? agency.address : "N/A"; // Dirección de la agencia o "N/A"
		
		// Formatear mes si es válido
		const formattedMonth = moment(month, "YYYY-MM", true).isValid()
			? moment(month, "YYYY-MM").format("MMMM YYYY")
			: "N/A";
	
		let generalInfo = [
			["EMPRESA:", company],
			["SUCURSAL:", agency?.name|| "N/A"],
			["", "Movimiento de Unidades según el artículo 177 ley de impuesto sobre la renta"],
			// ["MES:", formattedMonth],
		];
	
		// Agregar la dirección solo si se encontró una agencia válida
		if (address !== "N/A") {
			generalInfo.push(["DIRECCIÓN:", address]);
		}
	
		// Fechas de inicio y fin basadas en el mes filtrado
		const startOfMonth = moment(month, "YYYY-MM", true).isValid()
			? moment(month, "YYYY-MM").startOf("month").format("DD/MM/YYYY")
			: "N/A";
		const endOfMonth = moment(month, "YYYY-MM", true).isValid()
			? moment(month, "YYYY-MM").endOf("month").format("DD/MM/YYYY")
			: "N/A";
		
		// Agregar las fechas y la descripción
		generalInfo.push(
			["FECHA DESDE:", startOfMonth],
			["FECHA HASTA:", endOfMonth],
		);

		// Fila explicativa con columnas agrupadas
		const explanatoryRow = [
			"COD.", // Código Producto
			"PRODUCTOS", // Producto
			"EXISTENCIA INICIAL", "", "", // Ocupa 3 columnas
			"COMPRAS", "", // Ocupa 2 columnas
			"VENTAS", "", "", // Ocupa 3 columnas
			"AUTOCONSUMO", "", // Ocupa 2 columnas
			"INV. FINAL", "", // Ocupa 2 columnas
		];

		// Datos reales
		const fixedData = mapDataWithHeaders(combinedData, [
		{ label: "Código", key: "code" },
		{ label: "Producto", key: "name" },
		{ label: "Costo Unitario Inicial", key: "avgLastPrice" },
		{ label: "Cantidad Inicial", key: "initialAmount" },
		{ label: "Monto Inicial", key: "totalIn" },
		{ label: "Cantidad Compras", key: "quantity" },
		{ label: "Monto Compras", key: "finalAmount" },
		{ label: "Costo Unitario Ventas", key: "finalUnitCost" },
		{ label: "Cantidad Ventas", key: "finalQuantity" },
		{ label: "Monto Ventas", key: "finalAmount" },
		{ label: "AutoConsumo Cantidad", key: "autoConsumoC" },
		{ label: "AutoConsumo Monto", key: "autoConsumoM" },
		{ label: "Cantidad Final", key: "totalQuantity" },
		{ label: "Inventario Final", key: "finalInventory" },
	]);

		// Combinar todo
		const sheetData = [...generalInfo, explanatoryRow, ...headers, ...fixedData.map(Object.values)];

		// Crear hoja y archivo
		const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

		// Fusionar celdas
		worksheet["!merges"] = [
			{ s: { r: generalInfo.length, c: 2 }, e: { r: generalInfo.length, c: 4 } }, // EXISTENCIA INICIAL (3 columnas)
			{ s: { r: generalInfo.length, c: 5 }, e: { r: generalInfo.length, c: 6 } }, // COMPRAS (2 columnas)
			{ s: { r: generalInfo.length, c: 7 }, e: { r: generalInfo.length, c: 9 } }, // VENTAS (3 columnas)
			{ s: { r: generalInfo.length, c: 10 }, e: { r: generalInfo.length, c: 11 } }, // AUTOCONSUMO (2 columnas)
			{ s: { r: generalInfo.length, c: 12 }, e: { r: generalInfo.length, c: 13 } }, // INV. FINAL (2 columnas)
		];

		// Aplicar estilos
		Object.keys(worksheet).forEach(cellKey => {
			if (!cellKey.startsWith('!')) { // Ignorar metadatos como !ref y !merges
				worksheet[cellKey].s = {
					alignment: {
						horizontal: "center",
						vertical: "center",
					},
					font: { bold: true }, // Opcional: poner en negrita los encabezados
				};
			}
		});

		// Crear libro y hoja
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

		// Descargar archivo
		XLSX.writeFile(workbook, "reporte_mensual.xlsx");
	};


	useEffect(() => {
		if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
			setTimeout(() => {
				refExcel.current.link.click();
				setDataExcel([]);
			});
		}
	},[dataExcel]);
	
	/*** Exportar ***/

	const paginatedData = useMemo(() => {
		const startIndex = (currentPage - 1) * (perPageSelect === 0 ? perPage : perPageSelect);
		const endIndex = startIndex + (perPageSelect === 0 ? perPage : perPageSelect);
		return combinedData.slice(startIndex, endIndex);
	}, [combinedData, currentPage, perPageSelect, perPage]);

	useEffect(() => {
		setRowCount(combinedData.length);
	}, [combinedData]);
    
    const _defaultAgencyWatch = watch('agency');
    
    useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);

    
    return (
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
					<div className="flex-column flex-md-row p-3">
						<div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
							<div className="align-self-center">
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Reporte mensual</h3>
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
                                    {(user.role == 1 || user.role == 2 || user.role == 5 || user.role == 6 || user.role == 9) &&
                                        <FormGroup className="mr-3">
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
                                    {/* <FormGroup className="mr-3">
                                        <select
                                            name="company"
                                            ref={register()}
                                            className="form-control"
                                        >
                                            <option value="">Seleccione empresa</option>
                                            {companies.map((company, index) => (
                                                <option key={index} value={company}>
                                                    {company}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.company && <div className="invalid-feedback">{errors.company.message}</div>}
                                    </FormGroup> */}
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
										<div>
											<Datetime
												timeFormat={false}
												dateFormat={'YYYY-MM'}
												closeOnSelect
												onChange={handleChangeMonth} // Asignar manejador de cambio de mes
												value={selectedMonth} // Usar el estado seleccionado
												inputProps={{
													name: 'month',
													placeholder: "Seleccionar mes",
													autoComplete: "off"
												}}
											/>
											<input
												type="hidden" // Campo oculto para el mes
												name="month"
												ref={register({ required: "El mes es obligatorio" })} // Registro en react-hook-form
											/>
											{errors.month && (
												<span className="text-danger mt-1 small">
													{errors.month.message}
												</span>
											)}
										</div>
									</FormGroup>

									<Button color="primary" type="submit" disabled={loadingPage}>
										{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
									</Button>

								</Form>
							</>
							}
						</div>
						{/* Filtros */}
						<div className="align-self-right">
							<h4 style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right', marginRight: '100px'}}>
							{totalAdjustment < 0 && <>Ajuste: <i className="fa fa-arrow-up text-success"></i>&nbsp;<NumberFormat displayType={'text'} value={totalAdjustment ? totalAdjustment.toFixed(2) : 0} thousandSeparator={true} prefix="Bs. "/> </>}
							{totalAdjustment > 0 && <>Ajuste: <i className="fa fa-arrow-down text-danger"></i>&nbsp;<NumberFormat displayType={'text'} value={totalAdjustment ? totalAdjustment.toFixed(2) : 0} thousandSeparator={true} prefix="Bs. "/> </>}
							</h4>
						</div>
						<Row>
							<Col>
								<DataTable
									className="dataTables_wrapper"
									striped
									responsive
									highlightOnHover
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title= "Reporte mensual"
									progressPending={loadingPage}
									paginationComponentOptions={paginationOptions}
									progressComponent={<CustomLoader />}
									noDataComponent="No hay registros para mostrar"
									noHeader={true}
									columns={columns}
									data={paginatedData}
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
					{ (combinedData && combinedData.length >0 ) && <>
						<Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel || isExportDisabled}> 
							<Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
						</Button>
						{ 
							dataExcel.length>0 && <>
								<CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"ReporteDeInventarios.csv"}  style={{display:'none'}}>
									Exportar
								</CSVLink>
							</>
						}
						</>	
					} 
                </div>
            </div>  
        </div> 
    )                          
}

export default ReportFiscalPage;
