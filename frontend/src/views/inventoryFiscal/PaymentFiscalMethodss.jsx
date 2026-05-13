/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions } from '../../actions';
import { salesFiscalActions } from '../../actions/salesFiscal.action';
import moment from 'moment';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import DataTable from 'react-data-table-component';
import { Button, Spinner, Alert, Label, Row, Col, ListGroup, ListGroupItem, ListGroupItemText, Modal, Table, Form, FormGroup } from 'reactstrap';
//componente dataTable
import '../../assets/css/table.css';
import NumberFormat from 'react-number-format';
import { CSVLink } from "react-csv";
import '../../assets/css/filters.css';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import { useReactToPrint } from 'react-to-print';
import { isValidDate } from '../../helpers/date';
import { useHistory } from "react-router-dom";
import { useDarkMode } from '../../helpers/darkModeContext';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import "../../assets/css/darkMode.css"; 


function PaymentFiscalMethodsPagee() {

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

    const history = useHistory();

    //usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    const dataSales = useSelector(state => state.salesFiscal.table);
    const loadingPage = useSelector(state => state.salesFiscal.loading);
    const registeringData = useSelector(state => state.salesFiscal.registeringFiscal);

    // Inicializar tabla sin data
    const [data, setData] = useState([]);

    //Verificar data de redux
    useEffect(() => {
        if (dataSales) {
            setData(dataSales);
        }
        if (dataSales && dataSales.metadata && dataSales.metadata[0]) {
            setRowCount(dataSales.metadata[0].total);
        }
    }, [dataSales]);

    const [rowCount, setRowCount] = useState(0);

    //obtener data de usuario necesaria
    const getUserData = () => {
        return {
            agency: user.agency.id,
            role: user.role,
            id: user.id
        }
    }

    //Filas por default
    const [perPage] = useState(10);
    //Cantidad de filas seleccionadas
    const [perPageSelect, setPerPageSelect] = useState(0);
    //Direccion del ordenamiento y columna
    const [direction, setDirection] = useState({ "id": "date", "desc": true });

    const getDataTable = (page) => {
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, {}, false));
    }

    //Paginar
    const handlePageChange = async (page) => {
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), page, perPageSelect == 0 ? perPage : perPageSelect, direction, filters ? filters : {}, false));
    };

    //Ordenar
    const handleSort = (column, sortDirection) => {
        let sort = { "id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
        setDirection(sort);
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, sort, filters ? filters : {}, false));
    };

    //Cambiar cantidad de filas
    const handlePerRowsChange = async (newPerPage, page) => {
        setPerPageSelect(newPerPage);
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), page, newPerPage, direction, filters ? filters : {}, false));
    };

    //Consultar al entrar
    useEffect(() => {
        getDataTable(1);
    }, []);

    //Opciones de paginacion
    const paginationOptions = { rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', selectAllRowsItem: true, selectAllRowsItemText: 'Todos' };

    //Loader de la tabla
    const CustomLoader = () => (<><div className="loading-table"></div></>);

    //Calcular total general cuando cambie la información
    const [loadingTotal, setLoadingTotal] = useState(false);
    const [general, setGeneral] = useState(0);

    //Data al expandir una fila

    const ExpandedComponent = ({ data }) => (
        <ListGroup>
            <ListGroupItem>
                {/* <ListGroupItemText>
                    <b>Punto de venta: <NumberFormat value={data.pAmmount.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.pAmmount) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 5, data.agency) }}>
                        Detalle
                    </Button> : ''}
                    &emsp; */}
                   {/*  <b>Aplica: <NumberFormat value={data.totalPosApply.toFixed(2)} displayType={'text'} thousandSeparator={true} /> ({(data.totalPosApply / data.totalPos * 100).toFixed(1)}%)</b>
                    {(data.totalPosApply) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 5.1, data.agency) }}>
                        Detalle
                    </Button> : ''}
                    &emsp;
                    <b>NO aplica: <NumberFormat value={data.totalPosNotApply.toFixed(2)} displayType={'text'} thousandSeparator={true} /> ({(data.totalPosNotApply / data.totalPos * 100).toFixed(1)}%)</b>
                    {(data.totalPosNotApply) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 5.2, data.agency) }}>
                        Detalle
                    </Button> : ''}*/}
                {/* </ListGroupItemText>  */}
                {/* <ListGroupItemText>
                    <b>Efectivo Bs: <NumberFormat value={data.totalVes.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.totalVes) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 7, data.agency) }}>
                        Detalle
                    </Button> : ''}
                </ListGroupItemText>
                <ListGroupItemText>
                    <b>Dólar: <NumberFormat value={data.totalDollar.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.totalDollar) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 1, data.agency) }}>
                        Detalle
                    </Button> : ''}
                </ListGroupItemText>
                <ListGroupItemText>
                    <b>Euros: <NumberFormat value={data.totalEur.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.totalEur) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 2, data.agency) }}>
                        Detalle
                    </Button> : ''}
                </ListGroupItemText>
                <ListGroupItemText>
                    <b>Pesos: <NumberFormat value={data?.totalCop.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.totalCop) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 3, data.agency) }}>
                        Detalle
                    </Button> : ''}
                </ListGroupItemText>
                <ListGroupItemText>
                    <b>Transferencias: <NumberFormat value={data?.tAmount.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.tAmount && data.tAmount > 0) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 4, data.agency) }}>
                        Detalle
                    </Button> : ''}
                </ListGroupItemText> */}

                <Table bordered striped responsive>
                    <thead>
                        <tr>
                            <th>Base imponible</th>
                            <th>Exento</th>
                            <th>IVA</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <thead>
                        <td className='font-weight-bold'><NumberFormat value={data.totalBaseImponible ? data.totalBaseImponible.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                        <td className='font-weight-bold'><NumberFormat value={data.totalExento ? data.totalExento.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                        <td className='font-weight-bold'><NumberFormat value={data.totalIVA ? data.totalIVA.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                        <td className='font-weight-bold'><NumberFormat value={data.totalAmount ? data.totalAmount.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                    </thead>
                </Table>

                {/* <ListGroupItemText>
                    <b>Saldo final por créditos del día: Bs <NumberFormat value={data.totalCredit.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                    {(data.totalCredit && data.totalCredit > 0) ? <Button className="btn-link" color="primary" onClick={() => { getDetails(data.date, 6, data.agency) }}>
                        Créditos dados en el dia
                    </Button> : ''}
                </ListGroupItemText> */}
            </ListGroupItem>
        </ListGroup>
    );

    const [listDetail, setListDetail] = useState([]);

    // Normaliza los nombres viejos de transferencias a los nombres que el negocio quiere mostrar.
    const normalizeTransferBankLabel = (tBank) => {
        const val = (tBank ?? '').toString();
        if (/MOHAN 2025/i.test(val)) {
            if (/BANESCO/i.test(val)) return 'Principal - BANESCO';
            return 'Principal - VENEZUELA';
        }
        if (/EMBUTIDOS MOHAN/i.test(val)) return 'Personal - BICENTENARIO';
        if (val === 'Principal') return 'Principal - VENEZUELA';
        if (val === 'Principal - VENEZUELA') return 'Principal - VENEZUELA';
        if (val === 'Principal - PROVINCIAL') return 'Principal - VENEZUELA';
        if (val === 'Principal - BANESCO') return 'Principal - BANESCO';
        if (val === 'Personal - BICENTENARIO') return 'Personal - BICENTENARIO';
        return val;
    };

    const isTransferBankAllowed = (tBank) => {
        const val = (tBank ?? '').toString();
        return /MOHAN 2025/i.test(val) || /EMBUTIDOS MOHAN/i.test(val) || /^Principal\b/i.test(val) || val === 'Personal - BICENTENARIO';
    };

    const [totalDetail, setTotalDetail] = useState(0);
    const [type, setType] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);

    //Consultar detalle de monedas por fecha y tipo de moneda
    const getDetails = (date, type, agency, searchAllTransfers = false) => {
        let data = {
            date,
            coin: type,
            agency: agency._id
        }


        if (searchAllTransfers) {
            // Se elimina la agencia para que las busque todas
            delete data.agency;
            // Se "avisa" de que los detalles corersponden a todas las transferencias
            setAllTransfers(true);
        }

        // Si la data está mezclada o se solicitan todas las transferencias, se envian los rangos de dias
        if (filters.mixData || searchAllTransfers) {

            data.dataIsMixed = true;

            if (filters.startDate && filters.endDate) {
                data.startDate = filters.startDate;
                data.endDate = filters.endDate;
            }
            else if (!filters.startDate && filters.endDate) {
                data.startDate = filters.endDate;
                data.endDate = filters.endDate;
            }
            else if (filters.startDate && !filters.endDate) {
                data.startDate = filters.startDate;
                data.endDate = moment();
            }
            else {
                data.startDate = moment();
                data.endDate = moment();
            }
        }

        setType(type);
        dispatch(salesActions.salesDetailPaymentMethods(data));
        //abrir modal si no se están buscando todas las transferencias
        if (!searchAllTransfers) {
            setModalVisible(true);
        }
    }

    //State de detalle
    const loadingDetail = useSelector(state => state.sales.loadingDetail);
    const saleDetail = useSelector(state => state.sales);

    //Actualizar listDetail cuando llega la respuesta del detalle (cada exportación trae su tipo de data)
    useEffect(() => {
        if (!saleDetail.loadingDetail && saleDetail.dataDetail?.results) {
            setTotalDetail(saleDetail.dataDetail.total);
            setListDetail(saleDetail.dataDetail.results);
        }
    }, [saleDetail.loadingDetail, saleDetail.dataDetail]);

    //Header datatable excel
    const headers = [
        { label: "Fecha", key: "date" },
        { label: "Sucursal", key: "agency.name" },
        { label: "Monto Total", key: "totalAmountBox" },
        { label: "Punto de venta", key: "totalPos" },
        { label: "Efectivo Bs", key: "totalVes" },
        { label: "Dólar", key: "totalDollar" },
        { label: "Euros", key: "totalEur" },
        { label: "Pesos", key: "totalCop" },
        { label: "Transferencias", key: "totalTransfer" },

        { label: "Base imponible", key: "totalBaseImponible" },
        { label: "Exento", key: "totalExento" },
        { label: "IVA", key: "totalIVA" },

    ];

    //Header transferencias excel
    const headersTransfer = [
        { label: "Fecha", key: "createdDate" },
        { label: "Sucursal", key: "agency.name" },
        { label: "Razón social", key: "razonSocial" },
        { label: "Ticket", key: "order" },
        { label: "Monto", key: "tAmmount" },
        { label: "Banco", key: "tBank" },
        { label: "Referencia", key: "tReference" },
    ];

    //Header puntos de venta
    const headersPDV = [
        { label: "Fecha", key: "createdDate" },
        { label: "Sucursal", key: "agency.name" },
        { label: "Razón social", key: "razonSocial" },
        { label: "Ticket", key: "order" },
        { label: "Monto", key: "pAmmount" },
        { label: "Referencia", key: "pReference" },
        { label: "Terminal", key: "terminal.code" },
        { label: "Monto Extra", key: "pAmmountExtra" },
        { label: "Referencia Extra", key: "pReferenceExtra" },
        { label: "Terminal Extra", key: "terminalExtra.code" },
        { label: "Sub Total", key: "subTotal" },
    ];

    //limpiar data de modal
    const clearModal = () => {
        setModalVisible(false);
        setListDetail([]);
        setTotalDetail(0);
        setType(0);

    }

    //Form Data Filter
    const { handleSubmit, register, reset, setValue, watch } = useForm();
    //Form formas de pago
    const { handleSubmit: handleSubmitClose, register: registerClose, errors: errorsClose, reset: resetClose, control: controlClose } = useForm({ defaultValues: { eur: '', dollar: '', eur: '', eur: '' } });

    //Abrir/Cerrar filtros
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    //obtener sucursales para select
    const getting = useSelector(state => state.users.getting);
    const users = useSelector(state => state.users);

    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    }, []);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (users.obtained) {
            setListAgencies(users.list.agencies);
        }
    }, [users.obtained]);

    const agencyFilterWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

    const [filters, setFilters] = useState('');

    const handleChangeStartDate = (date) => {
        setStartDate(date);
    }

    const handleChangeEndDate = (date) => {
        setEndDate(date);
    }

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        reset({ agency: '', startDate: '', endDate: '' })
    }

    //Modal genérico y mensaje
    const [modalWarning, setModalWarning] = useState(false);
    const [modalMsg, setModalMsg] = useState('');


    //Consultar por filtros
    const onFilterData = (data, e) => {
        var validStartDate = moment(data.startDate).isValid();

        if (data.startDate != "" && !validStartDate) {
            setModalWarning(true);
            setModalMsg('Ingrese una fecha válida');
            return;
        }

        var validEndDate = moment(data.endDate).isValid();

        if (data.endDate != "" && !validEndDate) {
            setModalWarning(true);
            setModalMsg('Ingrese una fecha válida');
            return;
        }

        //Verificar que la fecha final sea superior o igual a la inicial
        var isafter = moment(data.startDate).isAfter(data.endDate);

        if (isafter) {
            setModalWarning(true);
            setModalMsg('La fecha inicial no puede ser superior a la final');
            return;
        }

        setFilters(data);
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, data, false));
    }

    //Columnas Data table
    const columns = [
        {
            name: 'Sucursal',
            selector: 'agency.name',
            sortable: true,
        },
        {
            name: 'Monto Total',
            selector: 'totalAmountBox',
            sortable: true,
            cell: (row) => {
                return <NumberFormat value={(row.totalAmount).toFixed(2)} displayType={'text'} thousandSeparator={true} />
            },
        },
        {
            name: 'Fecha',
            selector: 'date',
            sortable: true,
            cell: (row) => {
                return moment(row.date).utc().format("YYYY-MM-DD")
            },
        },
        {
            name: '',
            selector: 'date',
            omit: ((user.role == 4) || (user.role == 5) || (user.role == 8) || ((filters) && (filters.mixData))),
            cell: (row) => {
                return <Button color="info" type="submit" disabled={loadingPage} onClick={() => { findTerminals(row) }}>
                    {loadingPage && <span className="spinner-border spinner-border-sm mr-1"></span>} Cerrar Z
                </Button>
            },
        },
    ];


    /*** Exportar ***/
    const refExcel = useRef(null);

    const exportExcel = () => {
        //El mismo método, el ultimo parametro define si es para descarga
        dispatch(salesFiscalActions.salesFiscalPaymentMethods(getUserData(), 1, perPageSelect == 0 ? perPage : perPageSelect, direction, filters, true));
    }

    const excel = useSelector(state => state.download.excel);
    const loadingExcel = useSelector(state => state.download.loading);

    // Inicializar data de excel
    const [dataExcel, setDataExcel] = useState([]);

    //Verificar data de redux de la data de excel
    useEffect(() => {
        if (excel && excel.results) {

            // Se una copia de los detalles para que estos no sean los modificados
            let fixedData = excel.results.map((item) => { return Object.assign({}, item) })

            
            //Se modifican los datos antes de la descarga en excel
            fixedData.forEach((item) => {

                item.date = moment(item.date).utc().format("YYYY-MM-DD")

                item.totalAmountBox = item.totalAmount.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalPos = item.totalPos.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalVes = item.totalVes.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalDollar = item.totalDollar.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalEur = item.totalEur.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalCop = item.totalCop.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto

                item.totalTransfer = item.totalTransfer.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto
                item.totalBaseImponible = item.totalBaseImponible.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto
                    
                item.totalExento = item.totalExento.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto
                    
                item.totalIVA = item.totalIVA.toString()
                    .replace(/\,/g, '')  // se eliminan las comas
                    .replace(".", ',');  // se cambia la coma por punto
                    


            })

            setDataExcel(fixedData);
        }
    }, [excel]);

    const exportedGeneralRef = useRef(false);
    useEffect(() => {
        if (dataExcel && dataExcel.length > 0 && refExcel?.current?.link) {
            if (exportedGeneralRef.current) return;
            exportedGeneralRef.current = true;
            setTimeout(() => {
                refExcel.current.link.click();
                setDataExcel([]);
                setTimeout(() => { exportedGeneralRef.current = false; }, 100);
            });
        }
    }, [dataExcel]);


    /*** Exportar Detalles ***/

    const refDetailsExcel = useRef(null);

    // Para diferenciar el ver los detalles de las transferencias y al querer exportar todas las transferencias
    const [allTransfers, setAllTransfers] = useState(false);

    // Inicializar data de excel
    const [dataDetailsExcel, setDataDetailsExcel] = useState([]);

    const exportDetailsExcel = () => {

        // Se una copia de los detalles para que estos no sean los modificados
        let fixedData = listDetail.map((item) => { return Object.assign({}, item) })

        // Para “Transferencias”, ocultamos las demás cuentas y normalizamos los nombres.
        if (type === 4) {
            fixedData = fixedData
                .filter((item) => isTransferBankAllowed(item.tBank))
                .map((item) => {
                    item.tBank = normalizeTransferBankLabel(item.tBank);
                    return item;
                });
        }

        //Se modifican los datos antes de la descarga en excel
        fixedData.forEach((item) => {

            item.tAmmount = item.tAmmount ? item.tAmmount.toString().replace(/\,/g, '').replace(".", ',') : '';
            item.pAmmount = item.pAmmount ? item.pAmmount.toString().replace(/\,/g, '').replace(".", ',') : '';
            item.pAmmountExtra = item.pAmmountExtra ? item.pAmmountExtra.toString().replace(/\,/g, '').replace(".", ',') : '';
            item.subTotal = item.subTotal ? item.subTotal.toString().replace(/\,/g, '').replace(".", ',') : '';

            item.createdDate = moment(item.createdDate).utc().format("YYYY-MM-DD hh:mm:ss a");
            item.razonSocial = (item.agency && item.agency.company) ? item.agency.company : "";
        })

        // Se ordenan por sucursales
        fixedData.sort((a, b) => { return (a.agency.name > b.agency.name) ? 1 : ((b.agency.name > a.agency.name) ? -1 : 0) });

        setDataDetailsExcel(fixedData);
    }

    

    const exportedDetailsRef = useRef(false);
    useEffect(() => {
        if (dataDetailsExcel?.length > 0 && refDetailsExcel?.current?.link) {
            if (exportedDetailsRef.current) return;
            exportedDetailsRef.current = true;
            refDetailsExcel.current.link.click();
            setDataDetailsExcel([]);
            const t = setTimeout(() => { exportedDetailsRef.current = false; }, 100);
            return () => clearTimeout(t);
        }
    }, [dataDetailsExcel]);

    /*** Exportar todas las transferencias***/


    //Verificar data de redux de la data de excel
    useEffect(() => {
        if (allTransfers) {

            exportDetailsExcel()
            setAllTransfers(false)
        }
    }, [listDetail]);

    /*** Exportar ***/


    // Cierre de formas de pago

    // Funcion para buscar los terminales
    const findTerminals = (data) => {
        dispatch(salesActions.salesDataForm(user.agency.id));
        setDataToClose(data);
        setModalClose(true)
    }

    const [terminaList, setTerminalList] = useState([]);

    const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
        control: controlClose, // control props comes from useForm (optional: if you are using FormContext)
        name: "terminalInputs", // unique name for your Field Array
    });

    useEffect(() => {
        if (saleDetail.obtained) {
            setTerminalList(saleDetail.data.agency.terminal);

            if (terminaList && terminaList.length == 0) {
                saleDetail.data.agency.terminal.forEach((terminal) => {

                    let terminalToInput = { terminalId: terminal.id, terminalName: terminal.code }

                    append(terminalToInput)
                })
            }
        }
    }, [saleDetail.obtained]);

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (alert.message) {
            setVisible(true);
            window.setTimeout(() => { setVisible(false) }, 5000);
        }
    }, [alert]);


    const [modalClose, setModalClose] = useState(false);
    const [dataToClose, setDataToClose] = useState(null);
    const [modalConfirmClose, setModalConfirmClose] = useState(false);
    const [pendingCloseData, setPendingCloseData] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isDisabled, setIsDisabled] = useState(false);


    const [buttonVisible, setButtonVisible] = useState(true);

    const onCloseModal = () => {
        resetClose({
            baseImponible: '',
            iva: '',
            exento: '',
            total: '',
        });
        setDataToPrint(null);
        setModalClose(false);
    }
    

    // Función para enviar la data del cierre de formas de pago (abre modal de confirmación)
    const onCreateData = async (data, e) => {
        setPendingCloseData({ data });
        setModalConfirmClose(true);
    };

    // Ejecutar el cierre tras confirmar en el modal
    const doConfirmClose = () => {
        if (!pendingCloseData) return;
        const data = pendingCloseData.data;

        data.user = user.id;
        data.virtualValues = dataToClose; // Valores dados por el sistema en formas de pago
        data.agency = dataToClose.agency._id;
        data.date = dataToClose.date;
    
        // Eliminamos cualquier posible referencia a terminalInputs
        if (data.terminalInputs) {
            delete data.terminalInputs;
        }
      
        dispatch(salesFiscalActions.salesFiscalPaymentMethodsClose(data));
        setModalConfirmClose(false);
        setPendingCloseData(null);
        onCloseModal();
    };

    /** PARA EXPORTAR **/

    const toNumber = (value) => {
        if (typeof value === "string") {
            return parseFloat(value.replace(/,/g, "")) || 0;
        }
        return value || 0;
    };


    // Registro almacenado para imprimir

    const detailsToPrint = useSelector(state => state.salesFiscal.reference);
    

    const [dataToPrint, setDataToPrint] = useState(null);

    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: (dataToPrint ? dataToPrint.virtualValues.agency.name : '') + ' ' + (dataToPrint ? moment(dataToPrint.virtualValues.date).utc().format("YYYY-MM-DD") : ''),
        onAfterPrint: () => setDataToPrint(null),
        pageStyle: "@page{margin: 20mm;	}"
    })


    const ComponentToPrint = ({ data }) => (
        <>
            {data && <div ref={printRef} >
                <Row >
                    <Col md="12" sm="12" lg="12">
                        {loadingPage && <div className="justify-content-center"><CustomLoader /></div>}
                        <Table responsive hover bordered size="sm">
                            <tbody style={{ textAlign: 'center', color: "black" }}>
                                <tr style={{ height: '7rem', fontSize: 'x-large' }}>
                                    <th style={{ verticalAlign: 'middle' }} rowSpan={1} colSpan={12}> Cierre especial del dia {moment(data.virtualValues.date).format('dddd')} {moment(data.virtualValues.date).format('LL')} <br></br> {data.virtualValues.agency.name}</th>
                                </tr>
                                <tr>
                                    <td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total Base Imponible</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={data.baseImponible} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total Base Imponible según sistema</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(data.virtualValues.totalBaseImponible).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>

                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Diferencia</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(toNumber(data.baseImponible) - toNumber(data.virtualValues.totalBaseImponible)).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total Exento</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={data.exento} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total Exento según sistema</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(data.virtualValues.totalExento).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>

                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Diferencia</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(toNumber(data.exento) - toNumber(data.virtualValues.totalExento)).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total IVA</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={data.IVA} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total IVA según sistema</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(data.virtualValues.totalIVA).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>

                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Diferencia</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(toNumber(data.IVA) - toNumber(data.virtualValues.totalIVA)).toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={data.total} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Total según sistema</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={data.virtualValues.totalAmount} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>

                                </tr>
                                <tr>
                                    <th rowSpan={1} colSpan={6}>Diferencia</th>
                                    <td rowSpan={1} colSpan={6}><NumberFormat value={(toNumber(data.total) - toNumber(data.virtualValues.totalAmount))} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} prefix={'Bs '} /></td>
                                </tr>
                               
                                {data.comment && <>
                                    <tr>
                                        <td style={{ background: '#dddddd' }} rowSpan={1} colSpan={12}></td>
                                    </tr>
                                    <tr>
                                        <th rowSpan={1} colSpan={3}>Comentario</th>
                                        <td rowSpan={1} colSpan={9}>{data.comment}</td>
                                    </tr>
                                </>
                                }

                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </div>
            }
        </>
    )

    useEffect(() => {
        if (detailsToPrint) {
            setDataToPrint(detailsToPrint.result)
        }
    }, [detailsToPrint]);

    useEffect(() => {
        if (dataToPrint) {
            handlePrint();
        }
    }, [dataToPrint]);

    const fecha = new Date()
    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="flex-column flex-md-row p-3">

                        <div className="d-flex justify-content-between" style={{ padding: "4px 16px 4px 24px" }}>
                            <div className="align-self-center">
                                <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Formas de pago Especial</h3>
                            </div>
                        </div>
                        {/* Filtros */}
                        <div className="filter">
                            <div className="d-flex justify-content-between">
                                <a href="#" onClick={e => { e.preventDefault(); toggle() }}>
                                    <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
                                </a>
                                {isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
                                    <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
                                </a>
                                }
                            </div>
                            {isOpen && <>
                                <Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
                                    {(user.role == 1 || user.role == 2 || user.role == 6 || user.role == 5 || user.role == 7 || user.role == 9 || user.role == 10) && <FormGroup className="mr-3">
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
                                    {/* {(user.role === 3) &&
                                        <FormGroup className="mr-3">
                                            <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={fecha}

                                                inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }}
                                                isValidDate={isValidDate}
                                            />
                                        </FormGroup>
                                    }
                                     */}
                                        <FormGroup className="mr-3">
                                            <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeStartDate} value={startDate}

                                                inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }}
                                                isValidDate={isValidDate}

                                            />
                                        </FormGroup>

                                 
                                        <FormGroup className="mr-3">
                                            <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={handleChangeEndDate} value={endDate}
                                                inputProps={{ name: 'endDate', ref: register, placeholder: "Fecha final", autoComplete: "off" }}
                                                isValidDate={isValidDate}

                                            />
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
                                    striped
                                    highlightOnHover
                                    expandableRows
                                    expandableRowsComponent={<ExpandedComponent />}
                                    sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
                                    title="Ventas"
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
                        {data && data.length > 0 && (user.role == 1 || user.role == 9) && ( <>
                            <Button className="btn" color="primary" onClick={() => exportExcel()} disabled={loadingExcel}>
                                <Icon icon={fileDownload} /> Exportar {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                            {
                                dataExcel.length > 0 && <>
                                    <CSVLink ref={refExcel} data={dataExcel} separator={";"} headers={headers} filename={"FormasDePago.csv"} style={{ display: 'none' }}>
                                        Exportar
                                    </CSVLink>
                                </>
                            }

                            <Button className="btn" color="primary" onClick={() => getDetails('', 4, '', true)} disabled={loadingExcel}>
                                <Icon icon={fileDownload} /> Exportar transferencias {loadingExcel && <span className="spinner-border spinner-border-sm mr-1"></span>}
                            </Button>
                            <CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={headersTransfer} filename={"Transferencias.csv"} style={{ display: 'none' }} >
                                Exportar
                            </CSVLink>
                        </>
                        )}
                        <Row xs="12">
                            <Col><div className="pull-right">
                                {loadingTotal && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                {general > 0 && <b>Total: <NumberFormat value={general.toFixed(2)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></b>}
                            </div>
                            </Col>
                        </Row>
                        <Modal toggle={() => { clearModal() }} isOpen={modalVisible} className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Detalle
                                </h5>
                                <button
                                    aria-label="Close"
                                    className="close"
                                    type="button"
                                    onClick={() => { clearModal() }}
                                >
                                    <span aria-hidden={true}>×</span>
                                </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                                {loadingDetail && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                {listDetail.length > 0 && <><div className="table-wrapper-scroll-y my-custom-scrollbar">
                                    {/* Tabla de monedas */}
                                    {(type == 1 || type == 2 || type == 3 || type == 7) && <><Table striped responsive>
                                        <thead>
                                            <tr>
                                                <th>Ticket</th>
                                                {filters.mixData ? <th>Fecha</th> : ''}	{/* Fecha en caso de que se muestre la data mezclada */}
                                                <th>Hora</th>
                                                {type === 7 ? '' : <th>Cantidad</th>}	{/* Para los bolivares no se toma en cuenta ni la cantidad inicial ni la tasa */}
                                                {type === 7 ? '' : <th>Tasa</th>}
                                                {type === 7 ? <th>Total</th> : <th>Sub Total</th>} {/* Para los bolivares  el Sub Total pasa a ser el Total */}
                                                <th>Tipo</th>
                                                <th>Comentario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {listDetail.length > 0 && listDetail.map((detail, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{detail.order}</td>
                                                        {filters.mixData ? <td>{moment(detail.createdDate).utc().format("YYYY-MM-DD")}</td> : ''}	{/* Fecha en caso de que se muestre la data mezclada */}
                                                        <td>{moment(detail.createdDate).utc().format("hh:mm:ss a")}</td>
                                                        {type === 7 ? '' : <td><NumberFormat value={(type == 1 && detail.dollar) ? (detail.dollar.toFixed(2)) : ((type == 2 && detail.eur) ? (detail.eur.toFixed(2)) : detail.cop.toFixed(2))} displayType={'text'} thousandSeparator={true} /></td>}
                                                        {type === 7 ? '' : <td><NumberFormat value={(type == 1 && detail.valueDollar) ? (detail.valueDollar.toFixed(2)) : ((type == 2 && detail.valueEur) ? (detail.valueEur.toFixed(2)) : detail.valueCop.toFixed(2))} displayType={'text'} thousandSeparator={true} /></td>}
                                                        <td><NumberFormat value={detail.subTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>{detail.isSumation ? 'Abono' :
                                                            detail.isWholesale ? 'Mayor' : 'Detal'}</td>
                                                        <td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    </>
                                    }
                                    {/* Tabla de transferencias */}
                                    {type == 4 && <><Table striped responsive>
                                        <thead>
                                            <tr>
                                                <th>Ticket</th>
                                                <th>Monto</th>
                                                <th>Referencia</th>
                                                <th>Banco</th>
                                                <th>Tipo</th>
                                                <th>Comentario</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {listDetail.length > 0 && listDetail.filter((d) => isTransferBankAllowed(d.tBank)).map((detail, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{detail.order}</td>
                                                        <td><NumberFormat value={detail.tAmmount.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>{detail.tReference}</td>
                                                        <td>{normalizeTransferBankLabel(detail.tBank)}</td>
                                                        <td>{detail.isSumation ? 'Abono' :
                                                            detail.isWholesale ? 'Mayor' : 'Detal'}</td>
                                                        <td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    </>
                                    }
                                    {/* Tabla de puntos de venta */}
                                    {((type == 5) || (type == 5.1) || (type == 5.2)) && <><Table striped responsive>
                                        <thead>
                                            <tr>
                                                <th>Ticket</th>
                                                <th>Monto</th>
                                                <th>Referencia</th>
                                                <th>Terminal</th>
                                                <th>Monto Extra</th>
                                                <th>Referencia Extra</th>
                                                <th>Sub Total</th>
                                                <th>Tipo</th>
                                                <th>Comentario</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {listDetail.length > 0 && listDetail.map((detail, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{detail.order}</td>
                                                        <td><NumberFormat value={detail.pAmmount ? detail.pAmmount.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>{detail.pReference ? detail.pReference : ''}</td>
                                                        <td>{detail.terminal ? detail.terminal.code : ''}</td>
                                                        <td><NumberFormat value={detail.pAmmountExtra ? detail.pAmmountExtra.toFixed(2) : 0} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>{detail.pReferenceExtra ? detail.pReferenceExtra : ''}</td>
                                                        <td><NumberFormat value={detail.subTotal.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>
                                                            {detail.type === 2
                                                            ? 'Mayor'
                                                            : detail.type === 3
                                                            ? 'Abono'
                                                            : detail.type === 4
                                                            ? 'Credito'
                                                            : detail.type === 5
                                                            ? 'DetalF'
                                                            : detail.type === 6
                                                            ? 'MayorF'
                                                            : detail.type === 7
                                                            ? 'AbonoF'
                                                            : detail.type === 8
                                                            ? 'CreditoF'
                                                            : 'Detal'}
                                                        </td>
                                                        <td>{(detail.isPayment || detail.isSumation) ? 'Orden ' + detail.comment : detail.comment}</td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    </>
                                    }
                                    {/* Tabla de creditos */}
                                    {type == 6 && <><Table striped responsive>
                                        <thead>
                                            <tr>
                                                <th>Orden</th>
                                                <th>Nombre</th>
                                                <th>Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {listDetail.length > 0 && listDetail.map((detail, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{detail.order}</td>
                                                        <td>{detail.names}</td>
                                                        <td><NumberFormat value={detail.total.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>

                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    </>
                                    }
                                </div>
                                    {totalDetail > 0 && <Row xs="12">
                                        {type == 5 && <Col>
                                            <div className="pull-left">
                                                <a href="#" onClick={e => { e.preventDefault(); exportDetailsExcel() }}>
                                                    Exportar
                                                </a>
                                            </div>
                                            <div className="pull-left">
                                                <CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={headersPDV} filename={"PuntosDeVenta.csv"} style={{ display: 'none' }} >
                                                    Exportar
                                                </CSVLink>
                                            </div>
                                        </Col>}
                                        {type == 4 && <Col>
                                            <div className="pull-left">
                                                <a href="#" onClick={e => { e.preventDefault(); exportDetailsExcel() }}>
                                                    Exportar
                                                </a>
                                            </div>
                                            <div className="pull-left">
                                                <CSVLink ref={refDetailsExcel} data={dataDetailsExcel} separator={";"} headers={headersTransfer} filename={"Transferencias.csv"} style={{ display: 'none' }} >
                                                    Exportar
                                                </CSVLink>
                                            </div>
                                        </Col>}
                                        <Col><div className="pull-right"><b>Total: <NumberFormat value={totalDetail.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b> </div></Col>
                                    </Row>
                                    }
                                </>
                                }
                            </div>
                            <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                                <Button color="secondary" type="button" onClick={() => { clearModal() }}>
                                    Cerrar
                                </Button>
                            </div>
                        </Modal>
                        <Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning} className={` ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Ventas
                                </h5>
                                <button
                                    aria-label="Close"
                                    className="close"
                                    type="button"
                                    onClick={() => { setModalWarning(false); setModalMsg('') }}
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
                                    onClick={() => { setModalWarning(false); setModalMsg('') }}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </Modal>
                        <Modal toggle={() => { setModalConfirmClose(false); setPendingCloseData(null); }} isOpen={modalConfirmClose} backdrop="static" className={`${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="modalConfirmCloseLabel">
                                    Confirmar cierre
                                </h5>
                                <button
                                    aria-label="Close"
                                    className="close"
                                    type="button"
                                    onClick={() => { setModalConfirmClose(false); setPendingCloseData(null); }}
                                >
                                    <span aria-hidden={true}>×</span>
                                </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
                                <p>¿Está seguro del cierre? Una vez realizado ya no se podrá hacer ventas por ese día.</p>
                            </div>
                            <div className={`modal-footer ${darkMode ? "bg-dark border-secondary" : ""}`}>
                                <Button
                                    color="secondary"
                                    type="button"
                                    onClick={() => { setModalConfirmClose(false); setPendingCloseData(null); }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="button"
                                    onClick={doConfirmClose}
                                >
                                    Aceptar
                                </Button>
                            </div>
                        </Modal>
                        <Modal toggle={() => { onCloseModal() }} isOpen={modalClose} backdrop="static" className={`modal-lg ${darkMode ? "dark-mode" : ""}`}>
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Cierre de formas de pago dia {dataToClose ? moment(dataToClose.date).utc().format("YYYY-MM-DD") : ''}
                                </h5>
                                <button aria-label="Close" className="close" type="button" onClick={() => { onCloseModal() }}>
                                    <span aria-hidden={true}>×</span>
                                </button>
                            </div>
                            <div className={`modal-body ${darkMode ? "bg-dark text-white" : ""}`}>
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
                                <Form onSubmit={handleSubmitClose(onCreateData)} className="form">

                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label>Cierre Z</Label>
                                            </FormGroup>
                                            <FormGroup>
                                                <Label for="bsValue">
                                                    <b>Base imponible Bs: <NumberFormat value={dataToClose ? dataToClose?.totalBaseImponible.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
                                                   
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="eur">Monto</Label>
                                                <Controller
                                                    name="baseImponible"
                                                    control={controlClose}
                                                    placeholder={"Ingrese la base imponible"}
                                                    rules={{
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errorsClose.baseImponible ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsClose.baseImponible && <div className="invalid-feedback">{errorsClose.baseImponible.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bsValue">
                                                    <b>Exento Bs: <NumberFormat value={dataToClose ? dataToClose.totalExento.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
                                         
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Controller
                                                    name="exento"
                                                    control={controlClose}
                                                    placeholder={"Ingrese el exento"}
                                                    rules={{
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errorsClose.exento ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsClose.exento && <div className="invalid-feedback">{errorsClose.exento.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bsValue">
                                                    <b>IVA Bs: <NumberFormat value={dataToClose ? dataToClose.totalIVA.toFixed(2) : ''} displayType={'text'} thousandSeparator={true} /></b>
                                               
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Controller
                                                    name="IVA"
                                                    control={controlClose}
                                                    placeholder={"Ingrese el IVA"}
                                                    rules={{
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errorsClose.IVA ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsClose.IVA && <div className="invalid-feedback">{errorsClose.IVA.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="bsValue">
                                                    <b>Total Bs: <NumberFormat value={dataToClose ? dataToClose.totalAmount.toFixed(2)  : ''} displayType={'text'} thousandSeparator={true} /></b>
                                                
                                                </Label>
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Controller
                                                    name="total"
                                                    control={controlClose}
                                                    placeholder={"Ingrese el total"}
                                                    rules={{
                                                        required: "El valor es requerido",
                                                    }}
                                                    as={<NumberFormat className={'form-control' + (errorsClose.total ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsClose.total && <div className="invalid-feedback">{errorsClose.total.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    maxLength="200"
                                                    autoComplete="off"
                                                    placeholder='Ingrese un comentario (Opcional)'
                                                    className={'form-control' + (errorsClose.comment ? ' is-invalid' : '')}
                                                    name="comment"
                                                    ref={registerClose}
                                                />
                                                {errorsClose.comment && <div className="invalid-feedback">{errorsClose.comment.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>

                                    <div className="d-flex justify-content-between">
                                            <Button color="info" disabled={registeringData}>
                                                {registeringData && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Confirmar cierre
                                            </Button>
                                           

                                        <Button color="secondary" type="button" onClick={() => { onCloseModal() }}>
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
                <ComponentToPrint data={dataToPrint} />
            </div>
        </>
    );
}

export default PaymentFiscalMethodsPagee;