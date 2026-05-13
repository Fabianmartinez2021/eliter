/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousActions } from '../../actions';
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
import { Icon } from '@iconify/react';
import undoAlt from '@iconify/icons-fa-solid/undo-alt';

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

function MiscellaneousListPage() {

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

	const dataProducts = useSelector(state => state.miscellaneous.data);
	const loadingPage = useSelector(state => state.miscellaneous.loading);

	//Verificar data de redux
	useEffect(() => {
		if (dataProducts) {
			setData(dataProducts.results);
		} else {

		}
	}, [dataProducts]);

	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
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
			compact: true
		},
		{
			name: 'Presentación',
			selector: 'presentation',
			sortable: true,
			compact: true
		},
		{
			name: 'Precio al detal',
			selector: 'price',
			sortable: true,
			compact: true,
			cell: (row) => {
				return <NumberFormat value={row.price} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: 'Precio al detal (anterior)',
			selector: 'lastPrice',
			sortable: true,
			omit: true,
			compact: true,
			cell: (row) => {
				return <NumberFormat value={row.lastPrice} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'$ '} />
			},
		},
		{
			name: '',
			button: true,
			compact: true,
			omit: !(user.role === Role.Admin || user.role == '9'),
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => {
				e.preventDefault();
				history.push('/update-miscellaneous', { id: row.id })
			}
			}><i className="fas fa-pencil-alt"></i></Button>,
		},
		{
			name: 'Fecha de actualización',
			selector: 'updateDate',
			sortable: true,
			cell: (row) => {
				return row.updateDate ? moment(row.updateDate).format("YYYY-MM-DD hh:mm:ss a") : ''
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

	];

	//data inicial
	const getDataTable = () => {
		dispatch(miscellaneousActions.dataTable());
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
			setData(dataProducts.results.filter(item => (
				(item.createdDate && moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
				|| item.code && item.code.toString().toLowerCase().includes(filterText.toLowerCase())
				|| item.price && item.price.toString().toLowerCase().includes(filterText.toLowerCase())
				|| item.name && item.name.toLowerCase().includes(filterText.toLowerCase())
				|| item.presentation && item.presentation.toString().toLowerCase().includes(filterText.toLowerCase())

			)
			));
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


	const exportToExcel = (data, filename = 'catalogodesuministros.xlsx') => {
		const worksheet = XLSX.utils.json_to_sheet(data);
		const workbook = XLSX.utils.book_new();

		XLSX.utils.book_append_sheet(workbook, worksheet, 'Catálogo de suministros');

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

		let fixedData = data.map((item) => {return Object.assign({}, item)})

		//Se modifican los datos para la descarga en excel
		fixedData.forEach((item) => {

			item.price = item.price.toString()
				.replaceAll(/\,/g, '')  // se eliminan las comas
				.replaceAll(".", ',');  // se cambia la coma por punto
				
			item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
			item.updateDate = moment(item.updateDate).utc().format("YYYY-MM-DD hh:mm:ss a");


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
		{ label: "Precio", key: "price" },
		{ label: "Fecha de actualización", key: "updateDate" },
		{ label: "Fecha de registro", key: "createdDate" }
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
								<h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: 0 }}>Catálogo de suministros</h3>
							</div>
							{(user.role==1 || user.role == 2) && (
							<div style={{
								display: 'flex',
								flexDirection: 'row',
								gap: '10px',
							}}>
							<div>
								<span style={{ fontWeight: 'bold', marginRight: 8 }}>
									Añadir
								</span>
								<Button id="add" disabled={!(user.role == Role.Admin || user.role == Role.suplyRole || user.role == '9')} onClick={() => history.push('/register-miscellaneous')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
								</Button>
							</div>
							<div>
								<span style={{ fontWeight: 'bold', marginRight: 8 }}>
									Historial
								</span>
								<Button id="history" disabled={!(user.role == Role.Admin || user.role == Role.suplyRole || user.role == '9')} onClick={() => history.push('/miscellaneous-history')} className="btn-round btn-icon" color="primary">
									<Icon icon={undoAlt} className="icon" />
								</Button>
							</div>
							</div>
							)}
						</div>
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

export default MiscellaneousListPage;