/* eslint-disable */
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { terminalActions } from '../../actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { InputGroup, InputGroupAddon, Button, Input, Spinner, Row, Col, UncontrolledTooltip } from 'reactstrap';
//componente dataTable sede
import { history } from '../../helpers';
import useDebounce from '../../components/Debounce'; 
import '../../assets/css/table.css';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { CSVLink } from "react-csv";
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
	return <InputGroup style={{ "width": "200px"}}>
		<Input autoComplete="off" style={{"height": "38px", "marginTop":"10px"}} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
		<InputGroupAddon addonType="append">
			<Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
		</InputGroupAddon>
	</InputGroup>	
}

function TerminalListPage() {

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

	const dataTerminals = useSelector(state => state.terminal.data);
    const loadingPage = useSelector(state => state.terminal.loading);

	//Verificar data de redux
	useEffect(() => {
		if(dataTerminals){
			setData(dataTerminals.results);
		}else{

		}
  	},[dataTerminals]);
    
	// Inicializar tabla sin data
	const [data, setData] = useState([])

	//Columnas Data table
	const columns = [
		{
			name: 'Agencia',
			selector: 'agency.name',
			sortable: true,
			wrap: true,
			cell : (row)=>{
				return row.agency ? row.agency.name : '' ;
			},
		},
		{
			name: 'Código',
			selector: 'code',
			sortable: true,
			wrap: true,
		},
		{
			name: 'Serial',
			selector: 'serial',
			sortable: true,
			wrap:true
		},
		{
			name: 'Marca',
			selector: 'brand',
			sortable: true,
			wrap:true
		},
		{
			name: 'Modelo',
			selector: 'model',
			sortable: true,
			wrap:true
		},
		{
			name: 'Banco',
			selector: 'bank',
			sortable: true,
			wrap:true
		},
		{
			name: 'En uso',
			selector: 'used',
			cell : (row)=>{
				return row.used == true ? 'Si':'No' ;
			},
		},
		{
			name: 'Aplica',
			selector: 'apply',
			cell : (row)=>{
				return row.apply == true ? 'Si':'No' ;
			},
		},		
		{
			name: 'Descripción',
			selector: 'description',
			sortable: true,
			omit: false,//Esconder
			wrap:true
		},
		{
			name: 'Comentario',
			selector: 'comment',
			sortable: true,
			omit: false,//Esconder
			wrap:true
		},	
		{
			name: 'Fecha de registro',
			selector: 'createdDate',
			sortable: true,
			cell : (row)=>{
				return moment(row.createdDate).utc().format("YYYY-MM-DD")
			},
		},
		{
			name: '',
			button: true,
			cell: row => <Button className="btn-link" color="primary" size="sm" onClick={e => 
				{
					e.preventDefault(); 
					if (row.id){
						history.push('/update-terminal',{id:row.id})
					}
					else{
						history.push('/update-terminal',{id:row._id})
					}
				}
			}><i className="fas fa-pencil-alt"></i></Button>,
		},
	];

	//data inicial
	const getDataTable = () => {
		dispatch(terminalActions.dataTable());
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
				setData(dataTerminals.results);
			}
		};
		return <FilterComponent onFilter={e =>  setFilterText(e.target.value) } onClear={handleClear} filterText={filterText} />;
	}, [filterText, resetPaginationToggle]);


	//Filtrar con delay 
	useEffect(() => {
		if (debouncedSearchTerm) {
			setData(dataTerminals.results.filter(item => ( 
					(item.createdDate &&  moment(item.createdDate).utc().format("YYYY-MM-DD").toLowerCase().includes(filterText.toLowerCase()))
					|| (item.code &&  item.code.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.serial &&  item.serial.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.description &&  item.description.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.brand &&  item.brand.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.model &&  item.model.toLowerCase().includes(filterText.toLowerCase()))
					|| (item.bank &&  item.bank.toLowerCase().includes(filterText.toLowerCase()))
					// || (item.agency.name &&  item.agency.name.toLowerCase().includes(filterText.toLowerCase()))
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

	
	/*** Exportar ***/

	const refExcel = useRef(null);

	// Inicializar data de excel
	const [dataExcel, setDataExcel] = useState([]);
	const loadingExcel = useSelector(state => state.download.loading);
	

	//Verificar data de redux de la data de excel
	const exportExcel = (e) => {


		if(data && (data.length > 0)){
			setDataExcel(data);
		}
	}
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

	
		const exportToExcel = (data, filename = 'Terminales.xlsx') => {
			const worksheet = XLSX.utils.json_to_sheet(data);
			const workbook = XLSX.utils.book_new();
	
			XLSX.utils.book_append_sheet(workbook, worksheet, 'Terminales');
	
			const excelBuffer = XLSX.write(workbook, {
				bookType: 'xlsx',
				type: 'array'
			});
	
			const blob = new Blob([excelBuffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});
	
			saveAs(blob, filename);
		};
		

	useEffect(() => {
		if (dataExcel && dataExcel.length > 0) {
			const dataFormatted = mapDataWithHeaders(dataExcel, headers);
			exportToExcel(dataFormatted); // Ya no se hace click en CSVLink
			setDataExcel([]);
		}
	}, [dataExcel]);
	
	
	const headers = [
		{ label: "Fecha de registro", key: "createdDate" },
		{ label: "Agencia", key: "agency.name" },
		{ label: "Código", key: "code" },
		{ label: "Serial", key: "serial" },
		{ label: "Marca", key: "brand" },
		{ label: "Modelo", key: "model" },
		{ label: "Banco", key: "bank" },
		{ label: "En uso", key: "used" },
		{ label: "Descripción", key: "description" },
		{label: "Comentario", key:"comment"},
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
								<h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Terminales</h3>
							</div>
							<div>
								<span style={{fontWeight:'bold', marginRight:8}}>
									Añadir
								</span>
								<Button id="add" onClick={()=>history.push('/register-terminal')} className="btn-round btn-icon" color="primary">
									<i className="fa fa-plus" />
								</Button>
							</div>
						</div>
						<Row>
							<Col>
								<DataTable
									className="dataTables_wrapper"
									responsive
									highlightOnHover
									striped
									sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
									title="Sedes"
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

export default TerminalListPage;