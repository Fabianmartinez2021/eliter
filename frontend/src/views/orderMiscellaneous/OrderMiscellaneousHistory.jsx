/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../../actions';
import { orderMiscellaneousActions } from '../../actions/orderMiscellaneous.actions';
import { miscellaneousInventoryActions } from '../../actions/miscellaneousInventory.actions';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Row, Col, Badge, Label, Alert, ListGroup, ListGroupItem, ListGroupItemText, ListGroupItemHeading, Modal, Form, FormGroup, Table, ButtonGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import { useForm, Controller  } from "react-hook-form";
import Datetime from 'react-datetime';
import { Icon } from '@iconify/react';
import pdfIcon from '@iconify/icons-fa-solid/file-pdf';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useReactToPrint } from 'react-to-print';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function OrderMiscellaneousHistoryPage() {

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

    const dataTable = useSelector(state => state.orderMiscellaneous.table);
    const loadingPage = useSelector(state => state.orderMiscellaneous.loading);
    const loadingPending = useSelector(state => state.miscellaneousInventory.loadingPending);

    //Verificar data de redux
    useEffect(() => {

        if(dataTable && dataTable.results){

            setDataStores(dataTable.results);
            setDataGeneral(dataTable.resultsTotal);
        }
        if(dataTable && dataTable.metadata && dataTable.metadata[0]){
            setRowCount(dataTable.metadata[0].total);
        }
    },[dataTable]);
    
    // Inicializar tabla sin data
    const [dataStores, setDataStores] = useState([]);
    const [dataGeneral, setDataGeneral] = useState([]);
    const [rowCount, setRowCount] = useState(0);

    //Columnas Data table
    const columns = [
        {
            name: 'Status',
            selector: 'isModification',
            sortable: true,
            center:true,
            cell: row => {
                return <>
                        <Badge 
                                color={row.isModification ? "info" : "success"}  
                                pill className="h6 p-2 mt-1">
                                    {
                                        row.isModification ? "ANEXO" : "ORDEN"
                                    }
                        </Badge>
                    </>
            } 
        },
        {
            name: 'Orden',
            selector: 'order',
            sortable: true,
        },
        {
            name: 'Sucursal',
            selector: 'agency.name',
            sortable: true,
            wrap:true,
        },
        {
            name: 'Usuario',
            selector: 'row.user',
            sortable: true,
            wrap:true,
            cell : (row)=>{
                return  (row.user ? row.user.firstName + ' ' + row.user.lastName : '')
            },
        },
        {
            name: 'Fecha',
            selector: 'createdDate',
            sortable: true,
            cell : (row)=>{
                return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
            },
        },
        {
            name: 'Status',
            selector: 'wasConfirmed',
            sortable: false,
            center:true,
            cell: row => {
                return <>
                        <Badge 
                                color={row.wasConfirmed ? "success" : "danger"}  
                                pill className="h6 p-2 mt-1">
                                    {
                                        row.wasConfirmed ? "CONFIRMADO" : "PENDIENTE"
                                    }
                        </Badge>
                    </>
            } 
        },
        {
            name: 'Usuario que confirmó',
            selector: 'row.confirmationUser',
            sortable: true,
            cell : (row)=>{
                return  (row.confirmationUser ? row.confirmationUser : '')
            },
        },
        {
            name: 'Fecha de confirmación',
            selector: 'updatedDate',
            sortable: true,
            cell : (row)=>{
                return (row.updatedDate ? moment(row.updatedDate).utc().format("YYYY-MM-DD hh:mm:ss a") : '')
            },
        },
    ];

    
    const columns2 = [
        {
            name: 'Fecha',
            selector: 'createdDate',
            sortable: true,
            cell : (row)=>{
                return moment(row.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
            },
        }, 
        {
            name: '',
            selector: 'date',
            cell : (row)=>{
                return <>
                    <div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'right'}}>
                        <Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(row)}}>
                            <Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
                        </Button>
                    </div>
                </>			
            },
        },
    ];

    const headers = [
        { label: "Fecha", key: "createdDate" },
        { label: "Sucursal", key: "agency.name" },
        { label: "Divisa", key: "coinDescription" },
        { label: "Usuario", key: "user.username" },
        { label: "Motivo", key: "typeDescription" },
        { label: "Ticket", key: "order" },
        { label: "Ingresos", key: "in" },
        { label: "Egresos", key: "out" },
        { label: "Total", key: "total" },
        { label: "Comentario", key: "comment" }
    ];

    //Consultar al entrar
    useEffect(() => {
        getDataTable(1);
    }, []);

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

    //Filas por default
    const [perPage] = useState(10);
    //Cantidad de filas seleccionadas
    const [perPageSelect, setPerPageSelect] = useState(0);
    //Direccion del ordenamiento y columna
    const [direction, setDirection] = useState({ "id":"createdDate", "desc":true  });

    const getDataTable = (page) => {
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
    }

    //Paginar
    const handlePageChange = async (page) => {
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters: {}, false));
    };
    
    //Ordenar
    const handleSort = (column, sortDirection) => {
        let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
        setDirection(sort);
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters: {}, false));
    };

    //Cambiar cantidad de filas
    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPageSelect(newPerPage);
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), page, newPerPage, direction, filters ? filters: {}, false));
    };

    //Form Data Filter
    const { handleSubmit, register, reset, setValue, watch } = useForm();

    //Abrir/Cerrar filtros
    const [isOpen, setIsOpen] = useState(true);
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

    const agencyFilterWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

    const [filters, setFilters] = useState({});

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
    const [modalMsg, setModalMsg] = useState(false);

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
        if ( dateDiff > 60 ){
            setModalWarning(true);
            setModalMsg('El rango de fechas no puede superar los 60 días');
            return;
        }

        setFilters(data);
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
    }

    /*** Exportar ***/
    const refExcel = useRef(null);

    const exportExcel = () => {
        //El mismo método, el ultimo parametro define si es para descarga
        dispatch(orderMiscellaneousActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
    }

    const excel = useSelector(state => state.download.excel);
    const loadingExcel = useSelector(state => state.download.loading);

    // Inicializar data de excel
    const [dataExcel, setDataExcel] = useState([]);

    //Verificar data de redux de la data de excel
    useEffect(() => {
        if(excel && excel.results){

            // Se una copia de los detalles para que estos no sean los mod.mapificados
            let fixedData = excel.results.map((item) => {return Object.assign({}, item)})

            //Se modifican los datos antes de la descarga en excel
            fixedData.forEach((item) => {

                item.in = item.in.toString()
                                        .replace(/\,/g, '')  // se eliminan las comas
                                        .replace(".", ',');  // se cambia la coma por punto
                
                item.out = item.out.toString()
                                        .replace(/\,/g, '')  // se eliminan las comas
                                        .replace(".", ',');  // se cambia la coma por punto
                
                item.total = item.total.toString()
                                        .replace(/\,/g, '')  // se eliminan las comas
                                        .replace(".", ',');  // se cambia la coma por punto
                

                item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
            })

            setDataExcel(fixedData);
        }
    },[excel]);

    useEffect(() => {
        if (dataExcel && dataExcel.length > 0 && refExcel && refExcel.current && refExcel.current.link) {
            setTimeout(() => {
                refExcel.current.link.click();
                setDataExcel([]);
            });
        }
    },[dataExcel]);
    
    /*** Exportar ***/
    
    // Estado para saber cuál reporte se va a buscar 
    const [reportToSearch, setReportToSearch] = useState(1);

    //Data al expandir una fila en el reporte POR TIENDAS 
    const ExpandedComponentStoreReport = ({ data, buttonStatus = true }) =>{
        return(

        <Row>
            <Col md="12" sm="12" lg="12">
            {loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
            <Table responsive hover bordered size="sm">
                <tbody style={{textAlign:'center', color: "black"}}>
                    <tr style={{height:'7rem', fontSize: 'x-large'}}>
                        <th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={13}> Pedido de suministros del dia {moment(data.createdDate).format('dddd')} {moment(data.createdDate).format('LL')} <br></br> {data.agency.name}</th>
                    </tr>
                    <tr style={{height: "0"}}>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>

                    </tr>
                    <tr>
                        <td style={{background: '#dddddd'}} rowSpan={1} colSpan={13}></td>
                    </tr>
                    <tr>
                        <th rowSpan={1} colSpan={2} >Código</th>
                        <th rowSpan={1} colSpan={4}>Nombre</th>
                        <th rowSpan={1} colSpan={2}>Stock en tienda</th>
                        <th rowSpan={1} colSpan={2}>Pedido</th>
                        {/* <th rowSpan={1} colSpan={2}>Anexo</th>	 */}
                        <th rowSpan={1} colSpan={2}>Total</th>					
                    </tr>

                    
                    {
                        data.products.map((item) => {

                            if(!item.kgTotal)
                                return;

                            if(data.isModification && !item.wasModified)
                                return;

                            return <tr key={item.product.code}>
                                    <th rowSpan={1} colSpan={2} >{ item.product.code }</th>
                                    <th rowSpan={1} colSpan={4}>{ item.product.name }</th>
                                    <th rowSpan={1} colSpan={2}><NumberFormat value={item.inventory ? item.inventory : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
                                                                    decimalScale={item.inventory % 1 !== 0 ? 3 : 0}
                                                                    fixedDecimalScale={item.inventory % 1 !== 0}
                                                                    /></th>
                                    <th rowSpan={1} colSpan={2}><NumberFormat value={item.kg ? item.kg : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
                                                                    decimalScale={item.kg % 1 !== 0 ? 3 : 0}
                                                                    fixedDecimalScale={item.kg % 1 !== 0}
                                                                    /></th>
                                    {/* <th rowSpan={1} colSpan={2}><NumberFormat value={item.kgDifferential ? item.kgDifferential : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
                                                                        decimalScale={item.kgDifferential % 1 !== 0 ? 3 : 0}
                                                                        fixedDecimalScale={item.kgDifferential % 1 !== 0}
                                                                    /></th>					 */}
                                    <th rowSpan={1} colSpan={2}><NumberFormat value={item.kgTotal ? item.kgTotal : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
                                                                    decimalScale={item.kgTotal % 1 !== 0 ? 3 : 0}
                                                                    fixedDecimalScale={item.kgTotal % 1 !== 0}
                                        /></th>					
                                </tr>
                        })
                    }
                    {data.comment && <>
                            <tr>
                                <td style={{  background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
                            </tr>
                            <tr>
                                <th rowSpan={1} colSpan={3}>Comentario</th>
                                <td rowSpan={1} colSpan={9}>{data.comment}</td>
                            </tr>
                        </>
                    }

                   
                    
                   

                       
                    
                </tbody>
                 
            </Table>
             {(( data.wasConfirmed || data.wasModified) &&
                        ((user.role === 1) || (user.role === 2) || (user.role === 9))) && (
                        <div style={{ width:'280px', display:'flex', flexDirection:'row', justifyContent:'center',  margin:' 0 auto', alignItems:'center' }}>

                        <Button
                        color="primary"
                        disabled={loadingPending}
                        onClick={() => onSendToPending(data)} 
                        >
                        <i className="fas fa-thumbs-up"></i> Enviar
                        {loadingPending && (
                            <span className="spinner-border spinner-border-sm mr-1"></span>
                        )}
                        </Button>
                        </div>
                    )}
            {buttonStatus && (
                        <div style={{ width:'280px', display:'flex', flexDirection:'row', justifyContent:'center',  margin:' 0 auto', alignItems:'center' }}>
                            {/* Columna derecha */}
                            <Button
                                color="primary"
                                disabled={loadingPage}
                                onClick={() => {
                                setDataToPrint(data);
                                }}
                            >
                                <Icon icon={pdfIcon} /> Exportar
                                {loadingPage && (
                                <span className="spinner-border spinner-border-sm mr-1"></span>
                                )}
                            </Button>
                        </div>
                        )}
            </Col>
        </Row>
    )}
    ;

    //Data al expandir una fila en el reporte GENERAL 
    const ExpandedComponentGeneralReport = ({ data, buttonStatus = true }) => (
        <Row>
            <Col md="12" sm="12" lg="12">
            {loadingPage && <div className="justify-content-center"><CustomLoader/></div>}
            <Table responsive hover bordered size="sm">
                <tbody style={{textAlign:'center', color: "black"}}>
                    <tr style={{height:'7rem', fontSize: 'x-large'}}>
                        <th style={{verticalAlign: 'middle'}} rowSpan={1} colSpan={12}> Pedidos totales del dia {moment(data.createdDate).format('dddd')} {moment(data.createdDate).format('LL')} <br></br></th>
                    </tr>
                    <tr style={{height: "0"}}>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                        <th style={{width: '8.33%'}} rowSpan={1} colSpan={1} ></th>
                    </tr>
                    <tr>
                        <td style={{background: '#dddddd'}} rowSpan={1} colSpan={12}></td>
                    </tr>
                    <tr>
                        <th rowSpan={1} colSpan={2} >Código</th>
                        <th rowSpan={1} colSpan={4}>Nombre</th>
                        <th rowSpan={1} colSpan={2}>Pedido</th>
                        {/* <th rowSpan={1} colSpan={2}>Anexo</th>	 */}
                        <th rowSpan={1} colSpan={2}>Total</th>					
                    </tr>
                    {
                        data.products.map((item) => {

                            if(!item.kgTotal)
                                return;

                            return <tr key={item.product.code}>
                                    <th rowSpan={1} colSpan={2} >{ item.product.code }</th>
                                    <th rowSpan={1} colSpan={4}>{ item.product.name }</th>
                                    <th rowSpan={1} colSpan={2}><NumberFormat value={item.kg ? item.kg.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>
                                    {/* <th rowSpan={1} colSpan={2}><NumberFormat value={item.kgDifferential ? item.kgDifferential.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					 */}
                                    <th rowSpan={1} colSpan={2}><NumberFormat value={item.kgTotal ? item.kgTotal.toFixed(2) : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></th>					
                                </tr>
                        })
                    }
                    
                    {buttonStatus && <tr>
                            <td rowSpan={1} colSpan={12}>
                                <div className="align-self-right" style={{ fontWeight:'bold',fontStyle: 'italic',  textAlign: 'center'}}>
                                    <Button color="primary" disabled={loadingPage} onClick={() => {setDataToPrint(data)}}>
                                        <Icon icon={pdfIcon} /> Exportar{loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} 
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    }
                    
                </tbody>
            </Table>
            </Col>
        </Row>
    );

    /** PARA EXPORTAR **/
    
    const [dataToPrint, setDataToPrint] = useState(null);

    const printRef = useRef(); 

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: 'Pedidos totales del dia ' + (dataToPrint ? moment(dataToPrint.createdDate).utc().format("YYYY-MM-DD") : ''),
        onAfterPrint: () => setDataToPrint(null),
        pageStyle: "@page{margin: 20mm;	}"
    })

    const ComponentToPrint = ({ data }) => (
         <>
            { data && <div ref={printRef} > 
                {reportToSearch === 1 ?
                    <ExpandedComponentStoreReport data={data} buttonStatus={false} /> : <ExpandedComponentGeneralReport data={data} buttonStatus={false} />
                }
            </div>
            }
        </>
    )

    useEffect(() => {
        if (dataToPrint){
            handlePrint();
        }
    }, [dataToPrint]);
    

    // MODAL DE CONFIRMACION
    
    
    const order = useSelector( state => state.order )
    const loadingOrder = useSelector( state => state.order.updating )

    // Productos que se van a modificar 
    const [orderProducts, setOrderProducts] = useState([]);
    // La orden que va a ser modificada
    const [orderToConfirm, setOrderToConfirm] = useState(null);
    // La data que se va a enviar para la modificacion
    const [dataToSend, setDataToSend] = useState(null);
    const [lastOrder, setLastOrder] = useState(null);
    
    //	Form para el modal de la orden
    const { handleSubmit: handleSubmitOrder, register: registerOrder, control: controlOrder, errors: errorsOrder, reset:resetOrder } = useForm();

    // Estado para abrir o cerrar el modal de hacer pedido
    const [modalOrderOpen, setModalOrderOpen] = useState(false);
    const [ enviar, setEnviar ] = useState(false);

   const onSubmitOrder = (data) => {
        // guardar para otras peticiones si quieres
        setDataToSend(data);

        // aquí decides si mandas a updateOrder o a confirmOrder
        dispatch(orderMiscellaneousActions.updateOrder(
            getUserData(),
            orderToConfirm._id,
            data
        ));

           setTimeout(() => {
            window.location.reload();
        }, 100);

        getDataTable(1);
        setEnviar(true);
        cleanOrderData();
    };

    const transformReportToPending = (report, user) => {
        return {
            user: user.id,                      // id del usuario que está creando
            agency: report.agency._id,           // agencia de la data original
            note: `Despacho ${moment().format("DD/MM/YYYY")}`,           // o un campo que quieras usar
            comment: report.comment || "",       // comentario original
            typeIn: "1",                    // lo defines fijo o dinámico
            products: report.products
                .filter(item => parseFloat(item.kgTotal) > 0)
                .map(item => ({
                    id: item.product._id,              // id del producto
                    kg: parseFloat(item.kgTotal),      // o item.kg según quieras usar
                    price: item.product.lastPrice || 0, // precio del producto
                    name: item.product.name,           // nombre del producto
                    code: item.product.code,           // código del producto
                    presentation: item.product.presentation, // tipo de producto
                }))
        };
    };


    const onSendToPending = (report) => {
        const pendingData = transformReportToPending(report, user);
        dispatch(miscellaneousInventoryActions.createInventory(pendingData));
        getDataTable(1);
    };

    const cleanOrderData = () => {

        setModalOrderOpen(false);
        setOrderProducts([])
        setModalMsg(false)
        setOrderToConfirm(null);
        setDataToSend(null);
        
        setModalWarning(false);
    }

    useEffect(() => {

        cleanOrderData();

        dispatch(orderMiscellaneousActions.orderTable(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, false));

    },[order.success]);


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
            cleanOrderData();
        }
    },[alert]);


    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar/>
                <div id="page-content-wrapper">
                    <AdminNavbar/>
                    <div className="flex-column flex-md-row p-3">

                        <div className="d-flex justify-content-between" style={{padding:"4px 16px 4px 24px"}}>
                            <div className="align-self-center">
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic',  marginBottom: '0'}}>Pedidos</h3>
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
                                <Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{marginTop:15}}>
                                    {(user.role == 1 || user.role == 2 || user.role == 9) && <FormGroup className="mr-3">
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
                                        <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}
                                            inputProps={{  name: 'startDate', ref:register, placeholder: "Fecha inicial", autoComplete:"off" }} isValidDate={isValidDate}
                                        />
                                    </FormGroup>
                                    <FormGroup className="mr-3">
                                        <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
                                            inputProps={{ name: 'endDate', ref:register, placeholder: "Fecha final", autoComplete:"off" }} isValidDate={isValidDate}
                                        />
                                    </FormGroup>
                                    {/* <FormGroup className="mr-3">
                                        <label>
                                            <input 
                                                className="form-check-input"
                                                name="showConfirmedModifications"
                                                id="showConfirmedModifications" 
                                                type="checkbox" 
                                                value={true}
                                                ref={register}/> Ver anexos confirmados
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
                            <Col style={reportToSearch === 1 ? {} : {display: "none"}}>
                            
                            {/* REPORTE POR TIENDAS */}
                            <DataTable
                                className="dataTables_wrapper"
                                responsive
                                striped
                                highlightOnHover
                                expandableRows
                                expandableRowDisabled={row => row.disabled}
                                expandableRowsComponent={<ExpandedComponentStoreReport />}
                                sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                title="Reporte de inventarios"
                                progressPending={loadingPage}
                                paginationComponentOptions={paginationOptions}
                                progressComponent={<CustomLoader />}
                                noDataComponent="No hay registros para mostrar"
                                noHeader={true}
                                columns={columns}
                                data={dataStores}
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
                        <Row>
                            <Col style={reportToSearch === 2 ? {} : {display: "none"}}>
                            
                            {/* REPORTE GENERAL */}
                            <DataTable
                                className="dataTables_wrapper"
                                responsive
                                striped
                                highlightOnHover
                                expandableRows
                                expandableRowDisabled={row => row.disabled}
                                expandableRowsComponent={<ExpandedComponentGeneralReport />}
                                sortIcon={ <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i> }
                                title="Reporte de inventarios"
                                progressPending={loadingPage}
                                progressComponent={<CustomLoader />}
                                noDataComponent="No hay registros para mostrar"
                                noHeader={true}
                                columns={columns2}
                                data={dataGeneral}
                                persistTableHead
                                theme={darkMode ? "dark" : "default"}

                            />
                            </Col>
                        </Row>
                        { dataStores && dataStores.length > 0 && <>
                            <Button className="btn" color="primary" onClick={(e)=>{e.preventDefault(); exportExcel()}} disabled={loadingExcel} style={{display:'none'}}> 
                                <Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                            { 
                                dataExcel.length>0 && <>
                                    <CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"HistorialDeCaja.csv"}  style={{display:'none'}}>
                                        Exportar
                                    </CSVLink>
                                </>
                            }
                            </>	
                        }
                        {/* Modal de notificaciones */}
                        {/* <Modal toggle={() => { cleanOrderData() }} isOpen={modalMsg} className={`${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ventas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  { cleanOrderData() }}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                                <p>¿Desea confirmar el pedido de Nro { orderToConfirm ? orderToConfirm.order : ''} de la agencia {orderToConfirm ? orderToConfirm.agency.name : ''}</p>
                                
                                <div className="d-flex justify-content-between">
                                    <Button color="primary" disabled={loadingOrder} onClick={() => {confirmOrder();}} >
                                        {false && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        Confirmar pedido
                                    </Button>							
                                    <Button color="secondary" type="button" onClick={() =>  { cleanOrderData()}} >
                                        Cerrar
                                    </Button>
                                </div>
                            </div>
                        </Modal> */}
                        <Modal toggle={() => { cleanOrderData() }} isOpen={modalOrderOpen} backdrop="static" className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Edita o confirma el pedido
                            </h5>
                            <button  aria-label="Close" className="close" type="button" onClick={() =>  { cleanOrderData() }}>
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                            <Form onSubmit={handleSubmitOrder(onSubmitOrder)} className="form">

                                    <Row>
                                        <Col md={1}>
                                            <div className="modal-header" >
                                                <h5 className="modal-title my-10px" id="examplemodalMsgLabel">
                                                    Cód.
                                                </h5>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="modal-header" >
                                                <h5 className="modal-title my-10px" id="examplemodalMsgLabel">
                                                    Producto 
                                                </h5>
                                            </div>
                                        </Col>
                                        <Col md={2} className={"px-0.5"}>
                                            <div className="modal-header" style={{paddingLeft:'0'}}>
                                                <h5 className="modal-title my-10px" id="examplemodalMsgLabel">
                                                    Pedido 
                                                </h5>
                                            </div>
                                        </Col>
                                        <Col md={2} className={"px-0.5"}>
                                            <div className="modal-header" style={{paddingLeft:'0'}}>
                                                <h5 className="modal-title my-10px" id="examplemodalMsgLabel">
                                                    Anexo 
                                                </h5>
                                            </div>
                                        </Col>
                                        <Col md={2}>
                                            <div className="modal-header" style={{paddingLeft:'0'}}>
                                                <h5 className="modal-title my-10px" id="examplemodalMsgLabel">
                                                    Total 
                                                </h5>
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="modal-body" >
                                        {(orderProducts.length > 0) && orderProducts.map((item, index) => (
                                            <Row form key={item.product.code}>
                                                <Col md={1} style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                                                    <FormGroup style={{margin: "0"}}>
                                                        <Label for="name">
                                                            <b>{item.product.code}</b>
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={4} style={{display: "flex", alignItems: "center"}}>
                                                    <FormGroup style={{margin: "0"}}>
                                                        <Label for="name">
                                                            <b>{item.product.name}</b>
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={2} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
                                                    <FormGroup style={{margin: "0"}}>
                                                        <Controller
                                                                name={`product.${item.product.code}`}
                                                                control={controlOrder}
                                                                placeholder={"Ingrese cantidad"} 
                                                                disabled={orderToConfirm.isModification}
                                                                defaultValue={ (item && item.kg) ? item.kg : 0}
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
                                                <Col md={2} style={{marginLeft: "11px", display: "flex", alignItems: "center"}}>
                                                    <FormGroup style={{margin: "0"}}>
                                                        <Controller
                                                                name={`productModification.${item.product.code}`}
                                                                control={controlOrder}
                                                                placeholder={"Ingrese cantidad"} 
                                                                disabled={!orderToConfirm.isModification}
                                                                defaultValue={ (item && item.kgDifferential) ? item.kgDifferential.toFixed(2) : 0}
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
                                                <Col md={2}>
                                                    <FormGroup>
                                                        <Label for="name">
                                                            <NumberFormat value={item.kgTotal ? item.kgTotal : 0} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} 
                                                                decimalScale={item.kgTotal % 1 !== 0 ? 3 : 0}
                                                                fixedDecimalScale={item.kgTotal % 1 !== 0}
                                                            />
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        ))}
                                    </div>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    placeholder='Ingrese un comentario (Opcional)'
                                                    className={'form-control' + (errorsOrder.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    ref={registerOrder}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={loadingOrder} type="submit">
                                            {false && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Confirmar pedido
                                        </Button>
                                                                               
                                        <Button color="secondary" type="button" onClick={() =>  { cleanOrderData() }}>
                                            Cerrar
                                        </Button>
                                    </div>
                                </Form>  
                            </div>
                        </Modal>
                    </div>
                </div>
            </div>
            {/* Componente para imprimir (está oculto) */}
            <div style={{ display: "none" }}>
                <ComponentToPrint data={dataToPrint}/>
            </div>
        </>
    );
}

export default OrderMiscellaneousHistoryPage;
