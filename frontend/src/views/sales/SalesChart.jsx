/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { salesActions, userActions } from "../../actions";
import moment from "moment";
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import {
    Button,
    Row,
    Col,
    Table,
    Form,
    FormGroup,
    Modal,
    Badge,
} from "reactstrap";
//componente dataTable sede
import "../../assets/css/table.css";
import "../../assets/css/filters.css";
import NumberFormat from "react-number-format";
import Datetime from "react-datetime";
import "moment/locale/es";
import { useForm } from "react-hook-form";
import { Icon } from "@iconify/react";
import pdfIcon from "@iconify/icons-fa-solid/file-pdf";
import { useReactToPrint } from "react-to-print";
import fileDownload from "@iconify/icons-fa-solid/file-download";
import { isValidDate } from "../../helpers/date";
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

const companies = [
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

const CustomLoader = () => (<><div className="loading-table"></div></>);

function SalesChartPage() {
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
    const user = useSelector((state) => state.authentication.user);
    const dispatch = useDispatch();

    const dataSales = useSelector((state) => state.sales.table);
    const loadingPage = useSelector((state) => state.sales.loading);
    const chartDataState = useSelector((state) => state.sales.chartData);
    const loadingChart = useSelector((state) => state.sales.loadingChart);

    // Inicializar tabla sin data
    const [data, setData] = useState([]);

    //Obtener toda la data necesaria para ventas
    const sales = useSelector((state) => state.sales);

    //Obtener monedas, productos y terminales de sucursal
    useEffect(() => {
        dispatch(salesActions.salesDataForm(user.agency.id));
    }, []);

    const [listCoin, setListCoin] = useState(null);

    useEffect(() => {
        if (sales.obtained) {
            setListCoin(sales.data.coins);
        }
    }, [sales.obtained]);
    const valueDollar = listCoin ? listCoin[0].value : "";

    //Verificar data de redux
    useEffect(() => {
        if (dataSales && dataSales.results) {
            setData(dataSales.results);
        }
        if (dataSales && dataSales.metadata && dataSales.metadata[0]) {
            setRowCount(dataSales.metadata[0].total);
        }
    }, [dataSales]);

    const [rowCount, setRowCount] = useState(0);
    //Columnas Data table
    const columns = [
        {
            name: "Sucursal",
            selector: "agency.name",
            sortable: false,
            omit: user.role == 1 || user.role == 2 || user.role == 9 ? false : true, //Visible si es admin o supervisor
            wrap: true,
        },
        {
            name: "Empresa",
            selector: "agency.company",
            sortable: false,
            omit: user.role == 1 || user.role == 2 || user.role == 9 ? false : true, //Visible si es admin o supervisor
            wrap: true,
        },
        {
            name: "Cajero",
            cell: (row) => {
                if (row.user) {
                    return `${row.user.firstName} ${row.user.lastName}`;
                }
            },
            sortable: false,
        },
        {
            name: "Vendedor",
            selector: "seller.firstName",
            sortable: true,
            cell: (row) => {
                return row.seller ? row.seller.firstName : "";
            },
        },
        {
            name: "Operador",
            omit: true,
            selector: "operator.firstName",
            sortable: true,
            cell: (row) => {
                return row.operator
                    ? row.operator.firstName + " " + row.operator.lastName
                    : "";
            },
        },
        {
            name: "N° de Ticket",
            selector: "order",
            sortable: true,
        },
        {
            name: "Nombres",
            selector: "names",
            sortable: true,
        },
        {
            name: "Empresa",
            selector: "businessName",
            sortable: true,
        },
        {
            name: "Total Bs",
            selector: "total",
            sortable: true,
            cell: (row) => {
                return (
                    <NumberFormat
                        value={row.total ? row.total.toFixed(2) : row.total}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        prefix="Bs "
                    />
                );
            },
        },

        {
            name: "Diff",
            selector: "differential",
            sortable: true,
            center: true,
            cell: (row) => {
                return (
                    <div style={{ flexDirection: "column" }}>
                        <div>
                            <NumberFormat
                                value={row.differential ? row.differential.toFixed(2) : ""}
                                displayType={"text"}
                                thousandSeparator={","}
                                decimalSeparator={"."}
                                prefix="Bs "
                            />
                        </div>
                        <div>
                            <NumberFormat
                                value={
                                    row.wholesaleDiscountDifferential
                                        ? row.wholesaleDiscountDifferential.toFixed(2)
                                        : ""
                                }
                                displayType={"text"}
                                thousandSeparator={","}
                                decimalSeparator={"."}
                                prefix="Bs "
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            name: "Tipo",
            selector: "type",
            sortable: true,
            center: true,
            cell: (row) => {
                //	Se agregan notas en caso de que sean ingresos NO al detal

                //	Si es un crédito
                if (row.isCredit && row.type === 4)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"CRÉDITO"}
                            </Badge>
                        </>
                    );
                else if (row.isCredit && row.type === 8)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"CRÉDITO F"}
                            </Badge>
                        </>
                    );

                //	Si es un abono
                else if (row.isSumation && row.type === 3)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"ABONO"}
                            </Badge>
                        </>
                    );
                else if (row.isSumation && row.type === 7)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"ABONO F"}
                            </Badge>
                        </>
                    )
                //	Si es una venta al mayor
                else if (row.isWholesale && row.type === 2)
                    return (
                        <>
                            <Badge color={"info"} pill className="h6 p-2 mt-1">
                                {"MAYOR"}
                            </Badge>
                            &nbsp;
                            {row.appliedWholesaleDiscount && (
                                <i className="fa fa-exclamation-circle text-warning"></i>
                            )}
                        </>
                    );
                else if (row.isWholesale && row.type === 6)
                    return (
                        <>
                            <Badge color={"info"} pill className="h6 p-2 mt-1">
                                {"MAYOR F"}
                            </Badge>
                            &nbsp;
                            {row.appliedWholesaleDiscount && (
                                <i className="fa fa-exclamation-circle text-warning"></i>
                            )}
                        </>
                    );
                else if (row.type === 12)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"VALE PEND"}
                            </Badge>
                            &nbsp;
                            {row.appliedWholesaleDiscount && (
                                <i className="fa fa-exclamation-circle text-warning"></i>
                            )}
                        </>
                    );
                else if (row.isWholesale && row.type === 10)
                    return (
                        <>
                            <Badge color={"success"} pill className="h6 p-2 mt-1">
                                {"VALE PAG"}
                            </Badge>
                            &nbsp;
                            {row.appliedWholesaleDiscount && (
                                <i className="fa fa-exclamation-circle text-warning"></i>
                            )}
                        </>
                    );
                else if (row.isWholesale && row.type === 11)
                    return (
                        <>
                            <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                {"VALE ABO"}
                            </Badge>
                            &nbsp;
                            {row.appliedWholesaleDiscount && (
                                <i className="fa fa-exclamation-circle text-warning"></i>
                            )}
                        </>
                    );
                //	Si es un pago al detal
                else
                    if (row.type === 1) {
                        return (
                            <>
                                <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                    {"DETAL"}
                                </Badge>
                            </>
                        );
                    } else if (row.type === 5) {
                        return (
                            <>
                                <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                    {"DETAL F"}
                                </Badge>
                            </>
                        );
                    } else if (row.type === 9) {
                        return (
                            <>
                                <Badge color={"success"} pill className="h6 p-2 mt-1">
                                    {"VALE"}
                                </Badge>
                            </>
                        );
                    }
            }
        },
        {
            name: "Referencia",
            cell: (row) => {
                if (
                    ((row.pAmmount && row.pAmmount > 0) ||
                        (row.pAmmountExtra && row.pAmmountExtra > 0)) &&
                    !row.dollar &&
                    !row.eur &&
                    !row.cop &&
                    !row.tAmmount &&
                    !row.ves
                ) {
                    if (row.pReferenceExtra != "") {
                        return `${row.pReference}, ${row.pReferenceExtra}`;
                    } else {
                        return `${row.pReference}`;
                    }
                } else if (
                    row.tAmmount &&
                    row.tAmmount > 0 &&
                    !row.dollar &&
                    !row.eur &&
                    !row.cop &&
                    !row.pAmmount &&
                    !row.pAmmountExtra &&
                    !row.ves
                ) {
                    return `${row.tReference}`;
                } else if (
                    row.dollar &&
                    row.dollar > 0 &&
                    !row.eur &&
                    !row.cop &&
                    !row.pAmmount &&
                    !row.pAmmountExtra &&
                    !row.tAmmount &&
                    !row.ves
                ) {
                    return "Dólar";
                } else if (
                    row.eur &&
                    row.eur > 0 &&
                    !row.dollar &&
                    !row.cop &&
                    !row.pAmmount &&
                    !row.pAmmountExtra &&
                    !row.tAmmount &&
                    !row.ves
                ) {
                    return "Euros";
                } else if (
                    row.cop &&
                    row.cop > 0 &&
                    !row.dollar &&
                    !row.eur &&
                    !row.pAmmount &&
                    !row.pAmmountExtra &&
                    !row.tAmmount &&
                    !row.ves
                ) {
                    return "Pesos";
                } else if (
                    row.ves &&
                    row.ves > 0 &&
                    !row.dollar &&
                    !row.eur &&
                    !row.cop &&
                    !row.pAmmount &&
                    !row.pAmmountExtra &&
                    !row.tAmmount
                ) {
                    return "Efectivo";
                } else if (row.credit && row.credit > 0) {
                    return "Crédito";
                } else {
                    return "Mixto";
                }
            },
        },
        {
            name: "Hora de registro",
            selector: "createdDate",
            sortable: true,
            cell: (row) => {
                return moment(row.createdDate).utc().format("hh:mm:ss a");
            },
        },

        {
            name: "Fecha de registro",
            selector: "createdDate",
            sortable: true,
            cell: (row) => {
                return moment(row.createdDate).utc().format("YYYY-MM-DD");
            },
        },
    ];

    const headers = [
        { label: "Fecha emitida", key: "createdDate" },
        { label: "Responsable", key: "user.username" },
        { label: "Operador", key: "oprator.username" },
        { label: "Sucursal", key: "agency.name" },
        { label: "Empresa", key: "agency.company" },
        { label: "Ticket", key: "order" },
        { label: "Cliente", key: "names" },
        { label: "Razón social", key: "businessName" },
        { label: "Total", key: "total" },
        { label: "Dolares", key: "dollar" },
        { label: "Bs", key: "ves" },
        { label: "Cop", key: "cop" },
        { label: "Transferencia", key: "tAmmount" },
        { label: "Monto PDV", key: "pAmmount" },
        { label: "Tasa de cambio", key: "valueDollar" },
        { label: "Abono", key: "isSumation" },
        { label: "Credito", key: "isCredit" },
        { label: "Mayor", key: "isPayment" },
    ];

    //obtener data de usuario necesaria
    const getUserData = () => {
        return {
            agency: user.agency.id,
            role: user.role,
            id: user.id,
        };
    };

    //Filas por default
    const [perPage] = useState(10);
    //Cantidad de filas seleccionadas
    const [perPageSelect, setPerPageSelect] = useState(0);
    //Direccion del ordenamiento y columna
    const [direction, setDirection] = useState({ id: "createdDate", desc: true });

    //obtener sucursales para select
    const getting = useSelector((state) => state.users.getting);
    const users = useSelector((state) => state.users);
    useEffect(() => {
        dispatch(userActions.getListUserAgencies(getUserData()));
    }, []);

    const [listUsers, setListUsers] = useState(null);
    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (users.obtained) {
            setListUsers(users.list.users);
            setListAgencies(users.list.agencies);
        }
    }, [users.obtained]);

    const [filters, setFilters] = useState("");

    // Estado para controlar si se ha realizado una búsqueda
    const [hasSearched, setHasSearched] = useState(false);
    // Estado para controlar la vista (global o detallada)
    const [viewMode, setViewMode] = useState("global");

    //Calcular total general cuando cambie la información
    const [loadingTotal, setLoadingTotal] = useState(false);
    const [general, setGeneral] = useState(0);
    const [wholesaleDifferential, setWholesaleDifferential] = useState(0);
    const [discountDifferential, setDiscountDifferential] = useState(0);
    const [totalAmountDifferential, setTotalAmountDifferential] = useState(0);
    const [totalAmmountDeliverys, setTotalAmmountDeliverys] = useState(0);

    useEffect(() => {
        let sumtotal = 0;
        let sumWholesaleDifferential = 0;
        let sumDiscountDifferential = 0;
        let sumTotalAmountDifferential = 0;
        let sumTotalAmmountDeliverys = 0;
        if (data && data.length > 0) {
            setLoadingTotal(true);
            if (dataSales && dataSales.total && Array.isArray(dataSales.total) && dataSales.total[0] && dataSales.total[0].totalAmount) {
                sumtotal = dataSales.total[0].totalAmount;
                sumWholesaleDifferential = dataSales.total[0].wholesaleDifferential;
                sumDiscountDifferential = dataSales.total[0].discountDifferential;
                sumTotalAmountDifferential = dataSales.total[0].totalAmountDifferential;
                sumTotalAmmountDeliverys = dataSales.total[0].totalAmmountDeliverys;
            }
        }
        setLoadingTotal(false);
        setGeneral(sumtotal);
        setWholesaleDifferential(sumWholesaleDifferential);
        setDiscountDifferential(sumDiscountDifferential);
        setTotalAmountDifferential(sumTotalAmountDifferential);
        setTotalAmmountDeliverys(sumTotalAmmountDeliverys);
    }, [data]);

    //Abrir/Cerrar filtros
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    //Consultar por filtros
    const onFilterData = (data, e) => {
        // Limpiar errores previos
        setStartDateError("");
        setEndDateError("");
        setAgencyError("");

        // Validar que la sucursal sea requerida (solo si el usuario puede seleccionar sucursal)
        if ((user.role == 1 ||
            user.role == 2 ||
            user.role == 10) && (!data.agency || data.agency === "")) {
            setAgencyError("La sucursal es obligatoria");
            return;
        }

        // Validar que la fecha inicial sea requerida
        if (!data.startDate || data.startDate === "") {
            setStartDateError("La fecha de inicio es requerida");
            return;
        }

        const startMoment = moment(data.startDate);
        const validStartDate = startMoment.isValid();

        if (!validStartDate) {
            setStartDateError("Ingrese una fecha de inicio válida");
            return;
        }

        // Sólo permitir seleccionar días lunes
        if (startMoment.isoWeekday() !== 1) {
            setStartDateError("Solo puede seleccionar días lunes");
            return;
        }

        // Calcular automáticamente la fecha final como el siguiente domingo
        const endMoment = moment(startMoment).isoWeekday(7);

        // Si el rol es 3, usar siempre la sucursal del usuario autenticado
        const effectiveAgency =
            user.role === 3 && user.agency && user.agency.id
                ? user.agency.id
                : data.agency;

        const payloadFilters = {
            ...data,
            startDate: startMoment.format("YYYY-MM-DD"),
            endDate: endMoment.format("YYYY-MM-DD"),
            agency: effectiveAgency,
        };

        setFilters(payloadFilters);
        setHasSearched(true); // Marcar que se ha realizado una búsqueda
        setViewMode("global"); // Volver siempre a vista global al buscar

        // Solo obtener datos para gráficos
        dispatch(salesActions.salesChart(getUserData(), payloadFilters));
    };

    //Form Data Filter
    const { handleSubmit, register, reset, setValue, watch } = useForm();
    const agencyFilterWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

    const handleChangeStartDate = (date) => {
        setStartDate(date);
        // Limpiar error cuando el usuario empiece a escribir
        if (startDateError) {
            setStartDateError("");
        }
    };

    const [startDate, setStartDate] = useState("");
    const [startDateError, setStartDateError] = useState("");
    const [endDateError, setEndDateError] = useState("");
    const [agencyError, setAgencyError] = useState("");

    const clearFilters = () => {
        setStartDate("");
        setStartDateError("");
        setEndDateError("");
        setAgencyError("");
        reset({ ticket: "", names: "", reference: "", startDate: "", endDate: "", agency: "" });
    };

    //Modal genérico y mensaje
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState("");

    //Data al expandir una fila
    const ExpandedComponent = ({ data }) => (
        <>
            {(data.tReference || data.pReference || data.pReferenceExtra) && (
                <>
                    <div className="mb-2 mt-4">
                        <b>Referencias</b>
                    </div>
                    <Table striped responsive>
                        <thead style={{ color: "black" }}>
                            <tr>
                                <th>Transferencia</th>
                                <th>Punto</th>
                                <th>Punto adicional</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: "black" }}>
                            <tr>
                                <td>{data.tReference ? data.tReference : ""}</td>
                                <td>{data.pReference ? data.pReference : ""}</td>
                                <td>{data.pReferenceExtra ? data.pReferenceExtra : ""}</td>
                            </tr>
                        </tbody>
                    </Table>
                </>
            )}
            {data.products && data.products.length !== 0 && (
                <Table striped responsive className="mt-4">
                    <thead style={{ color: "black" }}>
                        <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Peso</th>
                            <th>Total</th>
                            {data.isWholesale ? <th>Diferencial</th> : ""}
                        </tr>
                    </thead>
                    <tbody style={{ color: "black" }}>
                        {data.products &&
                            data.products.map((product, index) => {
                                return (
                                    <tr
                                        key={index}
                                        style={{
                                            backgroundColor: product.appliedWholesaleDiscount
                                                ? "#D3FFDF"
                                                : "",
                                        }}
                                    >
                                        <td>{product.name}</td>
                                        <td>
                                            <NumberFormat
                                                value={product.price.toFixed(2)}
                                                displayType={"text"}
                                                thousandSeparator={","}
                                                decimalSeparator={"."}
                                            />
                                        </td>
                                        <td>
                                            <NumberFormat
                                                value={product.kg.toFixed(3)}
                                                displayType={"text"}
                                                thousandSeparator={","}
                                                decimalSeparator={"."}
                                            />
                                        </td>
                                        <td>
                                            <NumberFormat
                                                value={product.total.toFixed(2)}
                                                displayType={"text"}
                                                thousandSeparator={","}
                                                decimalSeparator={"."}
                                            />
                                        </td>
                                        {product.isWholesale ? (
                                            <td>
                                                <NumberFormat
                                                    value={product.differential.toFixed(2)}
                                                    displayType={"text"}
                                                    thousandSeparator={","}
                                                    decimalSeparator={"."}
                                                />
                                            </td>
                                        ) : (
                                            ""
                                        )}
                                    </tr>
                                );
                            })}
                    </tbody>
                </Table>
            )}
            {!data.isCredit && (
                <>
                    <div className="mb-2">
                        <b>Métodos de pago</b>
                    </div>
                    <Table striped responsive>
                        <thead style={{ color: "black" }}>
                            <tr>
                                <th>BsF</th>
                                <th>$ Dólares</th>
                                <th>€ Euros</th>
                                <th>$ Pesos</th>
                                <th>Transferencia</th>
                                <th>Punto de venta</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: "black" }}>
                            <tr>
                                <td>
                                    <NumberFormat
                                        value={data.ves ? data.ves.toFixed(2) : 0}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                                <td>
                                    <NumberFormat
                                        value={data.dollar ? data.dollar.toFixed(2) : 0}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                                <td>
                                    <NumberFormat
                                        value={data.eur ? data.eur.toFixed(2) : 0}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                                <td>
                                    <NumberFormat
                                        value={data.cop ? data.cop.toFixed(2) : 0}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                                <td>
                                    <NumberFormat
                                        value={data.tAmmount ? data.tAmmount.toFixed(2) : 0}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                                <td>
                                    <NumberFormat
                                        value={
                                            data.totalTerminal ? data.totalTerminal.toFixed(2) : 0
                                        }
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </>
            )}
            {!dataToPrint && (
                <div
                    className="align-self-right"
                    style={{
                        fontWeight: "bold",
                        fontStyle: "italic",
                        textAlign: "right",
                        marginRight: "50px",
                        marginBottom: "50px",
                    }}
                >
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
        </>
    );

    /** PARA EXPORTAR **/

    const [dataToPrint, setDataToPrint] = useState(null);

    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: "Ticket N° " + (dataToPrint ? dataToPrint.order : ""),
        onAfterPrint: () => setDataToPrint(null),
        //pageStyle: "@page{margin: 20mm;	}"
        pageStyle:
            "@media print { @page {margin: 0mm;} body {padding: 20mm !important;}}",
    });

    const ComponentToPrint = ({ data }) => (
        <>
            {data && (
                <div ref={printRef}>
                    <div className="align-self-center">
                        <h2
                            style={{
                                fontWeight: "bold",
                                fontStyle: "italic",
                                marginBottom: "10mm",
                                color: "black",
                            }}
                        >
                            Ticket N° {data.order}
                        </h2>
                    </div>
                    <Table striped responsive>
                        <thead style={{ color: "black" }}>
                            <tr>
                                <th>Agencia</th>
                                <th>Nro de Ticket</th>
                                <th>Nombres</th>
                                <th>Total</th>
                                <th>Tipo</th>
                                <th>Hora de registro</th>
                                <th>Fecha de registro</th>
                            </tr>
                        </thead>
                        <tbody style={{ color: "black" }}>
                            <tr>
                                <td>{data.agency ? data.agency.name : ""}</td>
                                <td>{data.order ? data.order : ""}</td>
                                <td>{data.names ? data.names : ""}</td>
                                <td>
                                    {data.total ? (
                                        <NumberFormat
                                            value={data.total ? data.total.toFixed(2) : data.total}
                                            displayType={"text"}
                                            thousandSeparator={","}
                                            decimalSeparator={"."}
                                            prefix={"Bs "}
                                        />
                                    ) : (
                                        ""
                                    )}
                                </td>
                                <td>
                                    {data.isCredit ? (
                                        <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                            {"CRÉDITO"}
                                        </Badge>
                                    ) : data.isSumation ? (
                                        <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                            {"ABONO"}
                                        </Badge>
                                    ) : data.isWholesale ? (
                                        <Badge color={"info"} pill className="h6 p-2 mt-1">
                                            {"MAYOR"}
                                        </Badge>
                                    ) : (
                                        <Badge color={"danger"} pill className="h6 p-2 mt-1">
                                            {"DETAL"}
                                        </Badge>
                                    )}
                                </td>
                                <td>{moment(data.createdDate).utc().format("hh:mm:ss a")}</td>
                                <td>{moment(data.createdDate).utc().format("YYYY-MM-DD")}</td>
                            </tr>
                        </tbody>
                    </Table>
                    <ExpandedComponent data={data} />
                    <div
                        className="align-self-center"
                        style={{
                            width: "100%",
                            marginTop: "10mm",
                            marginBottom: "5mm",
                            textAlign: "right",
                            color: "black",
                        }}
                    >
                        <div className="align-self-center">
                            <h2
                                style={{
                                    fontWeight: "bold",
                                    fontStyle: "italic",
                                    bottom: "0",
                                    right: "0",
                                    marginTop: "10mm",
                                    marginBottom: "10mm",
                                    color: "black",
                                }}
                            >
                                Total:{" "}
                                {
                                    <NumberFormat
                                        value={data.total ? data.total.toFixed(2) : ""}
                                        displayType={"text"}
                                        thousandSeparator={","}
                                        decimalSeparator={"."}
                                        prefix={data.total ? "Bs " : ""}
                                    />
                                }
                            </h2>
                        </div>
                    </div>
                    <div className="align-self-right">
                        <p
                            style={{
                                fontWeight: "bold",
                                fontSize: "small",
                                fontStyle: "italic",
                                position: "fixed",
                                bottom: "20mm",
                                width: "88%",
                                color: "black",
                            }}
                        >
                            NOTA: Esto es un recibo virtual y no posee validéz fiscal. Los
                            datos no deben ser usados para realizar retenciones de impuestos
                            por lo que solo debe tomar el monto para calcular su cotización, y
                            una vez pagado podrá solicitar su factura fiscal
                        </p>
                    </div>
                </div>
            )}
        </>
    );


    useEffect(() => {
        if (dataToPrint) {
            handlePrint();
        }
    }, [dataToPrint]);

    /*** Exportar datos de gráficos ***/
    const exportExcel = () => {
        // Manejar nueva estructura: puede ser objeto con 'types' o array directo
        let typesArray = null;
        let agencyInfo = null;
        let dailyArray = null;

        if (chartDataState) {
            if (Array.isArray(chartDataState)) {
                typesArray = chartDataState;
            } else {
                if (chartDataState.types && Array.isArray(chartDataState.types)) {
                    typesArray = chartDataState.types;
                }
                if (chartDataState.agency) {
                    agencyInfo = chartDataState.agency;
                }
                if (Array.isArray(chartDataState.dailyByType)) {
                    dailyArray = chartDataState.dailyByType;
                }
            }
        }

        // Obtener información adicional para el Excel
        const sucursalName = agencyInfo ? (agencyInfo.agencyName || '') : (user.agency ? (user.agency.name || user.agencyName || '') : '');
        const companyName = agencyInfo ? (agencyInfo.company || '') : (user.agency ? (user.agency.company || user.agencyCompany || '') : '');
        const fechaInicial = filters && filters.startDate ? moment(filters.startDate).format('YYYY-MM-DD') : '';
        const fechaFinal = filters && filters.endDate ? moment(filters.endDate).format('YYYY-MM-DD') : '';

        let exportData = [];
        let sheetName = 'Datos de Gráficos';

        // Cuando estamos en vista detallada, exportar el detalle diario (dailyByType)
        if (viewMode === "detallado") {
            if (!dailyArray || dailyArray.length === 0) {
                setModalVisible(true);
                setModalMsg("No hay datos detallados para exportar");
                return;
            }

            exportData = dailyArray.map((item) => {
                const totalDollar = item.totalDollar || 0;
                const count = item.count || 0;
                const fecha = item.day ? moment(item.day).format('YYYY-MM-DD') : '';
                const dia = item.day ? moment(item.day).format('dddd') : '';

                return {
                    'Agencia': sucursalName,
                    'Compañía': companyName,
                    'Fecha': fecha,
                    'Día': dia,
                    'Tipo de Venta': item.typeName || '',
                    'Total de clientes': count,
                    'Total en $': totalDollar.toFixed(2),
                };
            });

            sheetName = 'Detalle Diario';
        } else {
            // Vista global (por tipo) - comportamiento original
            if (!typesArray || typesArray.length === 0) {
                setModalVisible(true);
                setModalMsg("No hay datos de gráficos para exportar");
                return;
            }

            exportData = typesArray.map((item) => {
                const totalDollar = item.totalDollar || 0;
                const count = item.count || 0;
                const averagePerTicketDollar = item.averagePerTicketDollar || 0;

                return {
                    'Agencia': sucursalName,
                    'Compañía': companyName,
                    'Tipo de Venta': item.typeName || '',
                    'Cantidad de Clientes': count,
                    'Total en $': totalDollar.toFixed(2),
                    'Promedio por Cliente ($)': averagePerTicketDollar.toFixed(2),
                    'Porcentaje': (item.percentage || 0).toFixed(2) + '%',
                    'Fecha Inicial': fechaInicial,
                    'Fecha Final': fechaFinal,
                };
            });

            // Agregar fila de totales al final
            if (agencyInfo) {
                const totalCount = agencyInfo.count || 0;
                const totalDollar = agencyInfo.totalDollar || 0;
                const totalAveragePerTicketDollar = agencyInfo.averagePerTicketDollar || 0;
                const totalPercentage = agencyInfo.percentage || (totalDollar > 0 ? 100 : 0);

                exportData.push({
                    'Agencia': sucursalName,
                    'Compañía': companyName,
                    'Tipo de Venta': 'TOTAL',
                    'Cantidad de Clientes': totalCount,
                    'Total en $': totalDollar.toFixed(2),
                    'Promedio por Cliente ($)': totalAveragePerTicketDollar.toFixed(2),
                    'Porcentaje': totalPercentage.toFixed(2) + '%',
                    'Fecha Inicial': fechaInicial,
                    'Fecha Final': fechaFinal,
                });
            }
        }

        // Exportar a Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        const blob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, 'DatosGraficosVentas.xlsx');
    };

    /*** Exportar ***/

    return (
        <>
            <style>
                {`
                /* Estilos para checkboxes personalizados naranjas */
                .custom-checkbox-wrapper {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0.5rem;
                }
                
                .custom-checkbox {
                    position: absolute;
                    opacity: 0;
                    cursor: pointer;
                    height: 0;
                    width: 0;
                }
                
                .custom-checkbox-label {
                    position: relative;
                    padding-left: 35px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    color: #333;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    min-height: 20px;
                }
                
                .custom-checkbox-label:before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 20px;
                    width: 20px;
                    background-color: #fff;
                    border: 2px solid #ddd;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .custom-checkbox-label:hover:before {
                    border-color: #ff8c00;
                    box-shadow: 0 2px 8px rgba(255, 140, 0, 0.2);
                }
                
                .custom-checkbox:checked + .custom-checkbox-label:before {
                    background-color: #ff8c00;
                    border-color: #ff8c00;
                    box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
                }
                
                .custom-checkbox:checked + .custom-checkbox-label:after {
                    content: '✓';
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                    animation: checkmark 0.3s ease;
                }
                
                @keyframes checkmark {
                    0% {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0);
                    }
                    100% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                /* Responsive mejoras */
                @media (max-width: 576px) {
                    .custom-checkbox-label {
                        font-size: 12px;
                        padding-left: 30px;
                    }
                    
                    .custom-checkbox-label:before {
                        height: 18px;
                        width: 18px;
                    }
                    
                    .custom-checkbox:checked + .custom-checkbox-label:after {
                        font-size: 10px;
                    }
                }
                
                /* Modo oscuro */
                .dark-mode .custom-checkbox-label {
                    color: #fff;
                }
                
                .dark-mode .custom-checkbox-label:before {
                    background-color: #2d3748;
                    border-color: #4a5568;
                }
                
                .dark-mode .custom-checkbox-label:hover:before {
                    border-color: #ff8c00;
                }
                `}
            </style>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="flex-column flex-md-row p-3">
                        <div
                            className="d-flex justify-content-between"
                            style={{ padding: "4px 16px 4px 24px" }}
                        >
                            <div className="align-self-center">
                                <h3
                                    style={{
                                        fontWeight: "bold",
                                        fontStyle: "italic",
                                        marginBottom: "0",
                                    }}
                                >
                                    Indicadores de ventas
                                </h3>
                            </div>
                        </div>
                        {/* Filtros */}
                        <div className="filter">
                            <div className="d-flex justify-content-between">
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggle();
                                    }}
                                >
                                    <i className="fa fa-search" aria-hidden="true"></i> Búsqueda
                                    avanzada
                                </a>
                                {isOpen && (
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearFilters();
                                        }}
                                    >
                                        <i className="fa fa-times" aria-hidden="true"></i> Borrar
                                        filtros
                                    </a>
                                )}
                            </div>
                            {isOpen && (
                                <>
                                    <Form
                                        onSubmit={handleSubmit(onFilterData)}
                                        style={{ marginTop: 15 }}
                                    >
                                        {/* Primera fila - Campos principales */}
                                        <Row className="mb-3">
                                            {(user.role == 1 || user.role == 2 || user.role == 10) && (
                                                    <Col xs={12} sm={6} lg={3} className="mb-2">
                                                        <FormGroup>
                                                            {getting && (
                                                                <span className="spinner-border spinner-border-sm mr-1"></span>
                                                            )}
                                                            <select
                                                                className="form-control"
                                                                name="agency"
                                                                ref={register}
                                                                onChange={(e) => {
                                                                    if (agencyError) {
                                                                        setAgencyError("");
                                                                    }
                                                                }}
                                                            >
                                                                <option key="" name="" value="">
                                                                    Seleccione sucursal
                                                                </option>
                                                                {listAgencies &&
                                                                    listAgencies.map((list) => (
                                                                        <option
                                                                            key={list.id}
                                                                            name={list.id}
                                                                            value={list.id}
                                                                        >
                                                                            {`${list.name}`}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            {agencyError && (
                                                                <span style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '5px' }}>
                                                                    {agencyError}
                                                                </span>
                                                            )}
                                                        </FormGroup>
                                                    </Col>
                                                )}
                                            <Col xs={12} sm={6} lg={3} className="mb-2">
                                                <FormGroup>
                                                    <Datetime
                                                        timeFormat={false}
                                                        dateFormat={"YYYY-MM-DD"}
                                                        closeOnSelect
                                                        onChange={handleChangeStartDate}
                                                        value={startDate}
                                                        inputProps={{
                                                            name: "startDate",
                                                            ref: register,
                                                            placeholder: "Fecha inicial",
                                                            autoComplete: "off",
                                                        }}
                                                        isValidDate={(current) => isValidDate(current) && moment(current).isoWeekday() === 1}
                                                    />
                                                    {startDateError && (
                                                        <span style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '5px' }}>
                                                            {startDateError}
                                                        </span>
                                                    )}
                                                </FormGroup>
                                            </Col>
                                            <Col xs={12} sm={6} md={3} >
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={loadingPage}
                                                    className="w-35"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    {loadingPage && (
                                                        <span className="spinner-border spinner-border-sm mr-1"></span>
                                                    )}{" "}
                                                    Buscar
                                                </Button>
                                            </Col>
                                        </Row>


                                        {/* Tercera fila - Campos adicionales */}
                                        {/* <Row className="mb-3">
                                            <Col xs={12} sm={6} lg={3} className="mb-2">
                                                <FormGroup>
                                                    <input
                                                        className="form-control"
                                                        name="productCode"
                                                        placeholder="Cod. Producto"
                                                        type="text"
                                                        ref={register}
                                                    ></input>
                                                </FormGroup>
                                            </Col>
                                            <Col xs={12} sm={6} lg={3} className="mb-2">
                                                <FormGroup>
                                                    <input
                                                        className="form-control"
                                                        name="onlyProductCode"
                                                        placeholder="Cod. Producto Único"
                                                        type="text"
                                                        ref={register}
                                                    ></input>
                                                </FormGroup>
                                            </Col>
                                        </Row> */}
                                        {/* <Row className="mb-3">
                                            <Col xs={12} sm={6} md={3} className="mb-2">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    disabled={loadingPage}
                                                    className="w-35"
                                                    style={{ minWidth: '120px' }}
                                                >
                                                    {loadingPage && (
                                                        <span className="spinner-border spinner-border-sm mr-1"></span>
                                                    )}{" "}
                                                    Buscar
                                                </Button>
                                            </Col>
                                        </Row> */}


                                    </Form>
                                </>
                            )}
                        </div>
                        {/* Filtros */}
                        {/* Gráficos - Solo mostrar después de realizar una búsqueda */}
                        {hasSearched && (
                            <>
                                {/* Título con Agencia y Compañía */}
                                {(() => {
                                    let agencyInfo = null;
                                    if (chartDataState && !Array.isArray(chartDataState) && chartDataState.agency) {
                                        agencyInfo = chartDataState.agency;
                                    }
                                    // Solo usar datos del backend, sin fallback a user.agency
                                    const agencyName = agencyInfo ? (agencyInfo.agencyName || '') : '';
                                    const companyName = agencyInfo ? (agencyInfo.company || '') : '';

                                    if (agencyName || companyName) {
                                        return (
                                            <Row className="mb-4">
                                                <Col>
                                                    <div style={{
                                                        padding: '20px',
                                                        backgroundColor: darkMode ? '#2d3748' : '#f8f9fa',
                                                        borderRadius: '8px',
                                                        marginBottom: '20px',
                                                        textAlign: 'center'
                                                    }}>
                                                        <h3 style={{
                                                            margin: 0,
                                                            color: darkMode ? '#fff' : '#000',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {agencyName && <span>{agencyName}</span>}
                                                            {agencyName && companyName && <span> - </span>}
                                                            {companyName && <span>{companyName}</span>}
                                                        </h3>
                                                    </div>
                                                </Col>
                                            </Row>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Botones para cambiar entre vista Global y Detallada */}
                                <Row className="mb-3">
                                    <Col>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                                                <Button
                                                    color={viewMode === "global" ? "primary" : "secondary"}
                                                    onClick={() => setViewMode("global")}
                                                    size="sm"
                                                >
                                                    Global
                                                </Button>
                                                <Button
                                                    color={viewMode === "detallado" ? "primary" : "secondary"}
                                                    onClick={() => setViewMode("detallado")}
                                                    size="sm"
                                                >
                                                    Detallado
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Vista KPI / Detallado */}
                                <>
                                    {(() => {
                                        let typesArray = null;
                                        let agencyInfo = null;
                                        let dailyArray = null;
                                        let sellersArray = null;
                                        if (chartDataState) {
                                            if (Array.isArray(chartDataState)) {
                                                typesArray = chartDataState;
                                            } else {
                                                if (chartDataState.types && Array.isArray(chartDataState.types)) {
                                                    typesArray = chartDataState.types;
                                                }
                                                if (chartDataState.agency) {
                                                    agencyInfo = chartDataState.agency;
                                                }
                                                if (Array.isArray(chartDataState.dailyByType)) {
                                                    dailyArray = chartDataState.dailyByType;
                                                }
                                                if (Array.isArray(chartDataState.sellers)) {
                                                    sellersArray = chartDataState.sellers;
                                                }
                                            }
                                        }

                                        if (loadingChart) {
                                            return (
                                                <Row>
                                                    <Col>
                                                        <div style={{
                                                            padding: '40px',
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            alignItems: 'center'
                                                        }}>
                                                            <CustomLoader />
                                                        </div>
                                                    </Col>
                                                </Row>
                                            );
                                        }

                                        if (!typesArray || typesArray.length === 0) {
                                            return (
                                                <Row>
                                                    <Col>
                                                        <div className="text-center" style={{ padding: '40px', color: darkMode ? '#fff' : '#000' }}>
                                                            No hay datos disponibles
                                                        </div>
                                                    </Col>
                                                </Row>
                                            );
                                        }

                                        // Función para crear tarjeta KPI
                                        const createKPICard = (item, color) => {
                                            if (!item) return null;
                                            const totalDollar = item.totalDollar || 0;
                                            const count = item.count || 0;
                                            const averagePerTicketDollar = item.averagePerTicketDollar || 0;
                                            const percentage = item.percentage || 0;
                                            
                                            // Obtener weeklyTicketGoal del vendedor si es tipo 1
                                            let weeklyTicketGoal = 0;
                                            if (item.type === 1 && sellersArray && sellersArray.length > 0) {
                                                // Tomar el primer vendedor (o sumar todos si hay múltiples)
                                                weeklyTicketGoal = sellersArray[0]?.weeklyTicketGoal || 0;
                                            }
                                            
                                            // Determinar el color del averagePerTicketDollar según la comparación con weeklyTicketGoal
                                            let averagePerTicketColor = darkMode ? '#fff' : '#000';
                                            if (item.type === 1 && weeklyTicketGoal > 0) {
                                                if (averagePerTicketDollar >= weeklyTicketGoal) {
                                                    averagePerTicketColor = '#28a745'; // Verde
                                                } else {
                                                    averagePerTicketColor = '#dc3545'; // Rojo
                                                }
                                            }

                                            return (
                                                <Col md={6} lg={3} className="mb-4" key={item.type}>
                                                    <div style={{
                                                        padding: '20px',
                                                        backgroundColor: darkMode ? '#2d3748' : '#fff',
                                                        borderRadius: '8px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        borderTop: `4px solid ${color}`,
                                                        height: '100%'
                                                    }}>
                                                        <h6 style={{
                                                            color: color,
                                                            fontWeight: 'bold',
                                                            marginBottom: '15px',
                                                            fontSize: '14px',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {item.typeName || 'N/A'}
                                                        </h6>
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <div style={{
                                                                fontSize: '15px',
                                                                color: darkMode ? '#a0aec0' : 'black',
                                                                marginBottom: '6px',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                Clientes atendidos
                                                            </div>
                                                            <div style={{
                                                                fontSize: '22px',
                                                                fontWeight: 'bold',
                                                                color: darkMode ? '#fff' : '#000'
                                                            }}>
                                                                {count.toLocaleString()}
                                                            </div>
                                                        </div>
                                                      
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: darkMode ? '#a0aec0' : '#718096',
                                                                marginBottom: '4px'
                                                            }}>
                                                                Total en $
                                                            </div>
                                                            <div style={{
                                                                fontSize: '20px',
                                                                fontWeight: 'bold',
                                                                color: darkMode ? '#fff' : '#000'
                                                            }}>
                                                                <NumberFormat
                                                                    value={totalDollar.toFixed(2)}
                                                                    displayType={'text'}
                                                                    thousandSeparator={','}
                                                                    decimalSeparator={'.'}
                                                                    prefix={'$ '}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                        </div>
                                                        {/* Mostrar weeklyTicketGoal solo para tipo 1 (Venta al detal) */}
                                                        {item.type === 1 && weeklyTicketGoal >= 0 && (
                                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${darkMode ? '#4a5568' : '#e2e8f0'}` }}>
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: darkMode ? '#a0aec0' : '#718096',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Meta Ticket Semanal
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '16px',
                                                                    fontWeight: 'bold',
                                                                    color: darkMode ? '#fff' : '#000'
                                                                }}>
                                                                    <NumberFormat
                                                                        value={weeklyTicketGoal.toFixed(2)}
                                                                        displayType={'text'}
                                                                        thousandSeparator={','}
                                                                        decimalSeparator={'.'}
                                                                        prefix={'$ '}
                                                                    />
                                                                </div>
                                                                <div style={{ marginBottom: '12px' }}>
                                                                <div style={{
                                                                    fontSize: '12px',
                                                                    color: darkMode ? '#a0aec0' : '#718096',
                                                                    marginBottom: '4px'
                                                                }}>
                                                                    Promedio de ticket en $ por Cliente
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '18px',
                                                                    fontWeight: 'bold',
                                                                    color: averagePerTicketColor
                                                                }}>
                                                                    <NumberFormat
                                                                        value={averagePerTicketDollar.toFixed(2)}
                                                                        displayType={'text'}
                                                                        thousandSeparator={','}
                                                                        decimalSeparator={'.'}
                                                                        prefix={'$ '}
                                                                    />
                                                                </div>
                                                                {/* Diferencial entre averagePerTicketDollar y weeklyTicketGoal */}
                                                                {weeklyTicketGoal > 0 && (
                                                                    <div style={{ marginTop: '12px', paddingTop: '12px' }}>
                                                                        <div style={{
                                                                            fontSize: '12px',
                                                                            color: darkMode ? '#a0aec0' : '#718096',
                                                                            marginBottom: '4px'
                                                                        }}>
                                                                            Diff.
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: '16px',
                                                                            fontWeight: 'bold',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            color: averagePerTicketDollar >= weeklyTicketGoal ? '#28a745' : '#dc3545'
                                                                        }}>
                                                                            {averagePerTicketDollar >= weeklyTicketGoal ? (
                                                                                <>
                                                                                    <NumberFormat
                                                                                        value={Math.abs(averagePerTicketDollar - weeklyTicketGoal).toFixed(2)}
                                                                                        displayType={'text'}
                                                                                        thousandSeparator={','}
                                                                                        decimalSeparator={'.'}
                                                                                        prefix={'$ '}
                                                                                    />
                                                                                    <span style={{ fontSize: '18px' }}>↑</span>

                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <NumberFormat
                                                                                        value={Math.abs(averagePerTicketDollar - weeklyTicketGoal).toFixed(2)}
                                                                                        displayType={'text'}
                                                                                        thousandSeparator={','}
                                                                                        decimalSeparator={'.'}
                                                                                        prefix={'$ '}
                                                                                    />
                                                                                    <span style={{ fontSize: '18px' }}>↓</span>

                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                            );
                                        };

                                        // Vista detallada por día y tipo (agrupada por fecha)
                                        if (viewMode === "detallado") {
                                            if (!dailyArray || dailyArray.length === 0) {
                                                return (
                                                    <Row>
                                                        <Col>
                                                            <div className="text-center" style={{ padding: '40px', color: darkMode ? '#fff' : '#000' }}>
                                                                No hay datos detallados disponibles
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                );
                                            }

                                            // Agrupar registros por fecha
                                            const groupedByDate = dailyArray.reduce((acc, item) => {
                                                const dateKey = moment(item.day).format('YYYY-MM-DD');
                                                if (!acc[dateKey]) {
                                                    acc[dateKey] = [];
                                                }
                                                acc[dateKey].push(item);
                                                return acc;
                                            }, {});

                                            const dateKeys = Object.keys(groupedByDate);
                                            const firstRowDates = dateKeys
                                                .filter((d) => {
                                                    const wd = moment(d).isoWeekday(); // 1 = lunes ... 7 = domingo
                                                    return wd >= 1 && wd <= 4;
                                                })
                                                .sort((a, b) => moment(a).diff(moment(b)));
                                            const secondRowDates = dateKeys
                                                .filter((d) => {
                                                    const wd = moment(d).isoWeekday();
                                                    return wd >= 5 && wd <= 7;
                                                })
                                                .sort((a, b) => moment(a).diff(moment(b)));

                                            const renderDateCard = (dateKey) => {
                                                const momentDate = moment(dateKey);
                                                const dia = momentDate.format('dddd');
                                                const itemsForDate = groupedByDate[dateKey];

                                                // Colores distintivos por día (similar a las tarjetas globales)
                                                const weekday = momentDate.isoWeekday(); // 1 = lunes ... 7 = domingo
                                                let borderColor = '#6c757d';
                                                if (weekday === 1) borderColor = '#28a745'; // lunes - verde
                                                else if (weekday === 2) borderColor = '#17a2b8'; // martes - azul
                                                else if (weekday === 3) borderColor = '#ffc107'; // miércoles - amarillo
                                                else if (weekday === 4) borderColor = '#007bff'; // jueves - azul primario
                                                else if (weekday === 5) borderColor = '#dc3545'; // viernes - rojo
                                                else if (weekday === 6) borderColor = '#6f42c1'; // sábado - púrpura
                                                else if (weekday === 7) borderColor = '#20c997'; // domingo - verde agua

                                                return (
                                                    <div
                                                        key={dateKey}
                                                        style={{
                                                            flex: '1 1 0',
                                                            minWidth: '220px',
                                                            maxWidth: '25%',
                                                            padding: '0 8px',
                                                            marginBottom: '16px'
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: '10px 14px',
                                                                borderRadius: '8px',
                                                                backgroundColor: darkMode ? '#1f2933' : '#f8f9fa',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                                borderTop: `4px solid ${borderColor}`
                                                            }}
                                                        >
                                                            {/* Encabezado por fecha (día arriba, fecha abajo, centrados) */}
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    marginBottom: '8px',
                                                                    color: darkMode ? '#e2e8f0' : '#2d3748',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '14px',
                                                                    textTransform: 'capitalize'
                                                                }}
                                                            >
                                                                <span>{dia}</span>
                                                                <span style={{ fontSize: '13px', marginTop: 2 }}>{dateKey}</span>
                                                            </div>

                                                            {/* Labels de columnas */}
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    marginBottom: '4px',
                                                                    padding: '0 4px',
                                                                    color: darkMode ? '#a0aec0' : '#718096',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600
                                                                }}
                                                            >
                                                                <div style={{ flex: 1, textAlign: 'left' }}>
                                                                    Tipo de Venta
                                                                </div>
                                                                <div style={{ flex: 1, textAlign: 'center' }}>
                                                                    Total de clientes
                                                                </div>
                                                                <div style={{ flex: 1, textAlign: 'right' }}>
                                                                    Total en $
                                                                </div>
                                                                <div style={{ flex: 1, textAlign: 'right' }}>
                                                                    Promedio por ticket
                                                                </div>
                                                            </div>

                                                            {/* Tarjetas por tipo dentro de la fecha */}
                                                            {itemsForDate.map((item, index) => (
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        marginBottom: '6px',
                                                                        padding: '8px 10px',
                                                                        borderRadius: '6px',
                                                                        backgroundColor: darkMode ? '#243b53' : '#ffffff',
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            color: darkMode ? '#e2e8f0' : '#2d3748'
                                                                        }}
                                                                    >
                                                                        {/* Izquierda: tipo de venta */}
                                                                        <div style={{ flex: 1, textAlign: 'left', fontWeight: '600', fontSize: '13px' }}>
                                                                            {item.typeName}
                                                                        </div>
                                                                        {/* Centro: cantidad de clientes */}
                                                                        <div style={{ flex: 1, textAlign: 'center', fontSize: '13px' }}>
                                                                            <NumberFormat
                                                                                value={item.count || 0}
                                                                                displayType={"text"}
                                                                                thousandSeparator={","}
                                                                                decimalSeparator={"."}
                                                                            />
                                                                        </div>
                                                                        {/* Derecha: total en $ */}
                                                                        <div style={{ flex: 1, textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>
                                                                            <NumberFormat
                                                                                value={(item.totalDollar || 0).toFixed(2)}
                                                                                displayType={"text"}
                                                                                thousandSeparator={","}
                                                                                decimalSeparator={"."}
                                                                                prefix={"$ "}
                                                                            />
                                                                        </div>
                                                                        <div style={{ flex: 1, textAlign: 'right', fontWeight: '600', fontSize: '13px' }}>
                                                                            <NumberFormat
                                                                                value={(item.averagePerTicketDollar || 0).toFixed(2)}
                                                                                displayType={"text"}
                                                                                thousandSeparator={","}
                                                                                decimalSeparator={"."}
                                                                                prefix={"$ "}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            };

                                            return (
                                                <Row>
                                                    <Col>
                                                        <div
                                                            style={{
                                                                padding: '20px',
                                                                backgroundColor: darkMode ? '#2d3748' : '#fff',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                            }}
                                                        >
                                                            
                                                            {/* Primera fila: lunes a jueves */}
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexWrap: 'nowrap',
                                                                    marginBottom: '8px'
                                                                }}
                                                            >
                                                                {firstRowDates.map(renderDateCard)}
                                                            </div>
                                                            {/* Segunda fila: viernes a domingo */}
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexWrap: 'nowrap'
                                                                }}
                                                            >
                                                                {secondRowDates.map(renderDateCard)}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                </Row>
                                            );
                                        }

                                        // Vista global (tarjetas por tipo) - por defecto
                                        return (
                                            <>
                                                <Row>
                                                    {typesArray.map(item => {
                                                        let color = '#6c757d';
                                                        if (item.type === 1) color = '#28a745'; // Detal - Verde
                                                        else if (item.type === 2) color = '#17a2b8'; // Mayor - Azul
                                                        else if (item.type === 3) color = '#ffc107'; // Abono - Amarillo
                                                        else if (item.type === 4) color = '#007bff'; // Crédito - Azul primario
                                                        return createKPICard(item, color);
                                                    })}
                                                </Row>

                                                {/* Tarjeta de Total General */}
                                                {agencyInfo && (
                                                    <Row className="mt-3">
                                                        <Col md={12}>
                                                            <div style={{
                                                                padding: '20px',
                                                                backgroundColor: darkMode ? '#2d3748' : '#fff',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                                borderTop: '4px solid #dc3545'
                                                            }}>
                                                                <Row>
                                                                    <Col md={3}>
                                                                        <h5 style={{
                                                                            color: '#dc3545',
                                                                            fontWeight: 'bold',
                                                                            marginBottom: '15px'
                                                                        }}>
                                                                            TOTAL GENERAL
                                                                        </h5>
                                                                    </Col>
                                                                    <Col md={3}>
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <div style={{
                                                                                fontSize: '12px',
                                                                                color: darkMode ? '#a0aec0' : '#718096',
                                                                                marginBottom: '4px'
                                                                            }}>
                                                                            Total en $
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: '24px',
                                                                                fontWeight: 'bold',
                                                                                color: darkMode ? '#fff' : '#000'
                                                                            }}>
                                                                                <NumberFormat
                                                                                    value={(agencyInfo.totalDollar || 0).toFixed(2)}
                                                                                    displayType={'text'}
                                                                                    thousandSeparator={','}
                                                                                    decimalSeparator={'.'}
                                                                                    prefix={'$ '}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col md={3}>
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <div style={{
                                                                                fontSize: '12px',
                                                                                color: darkMode ? '#a0aec0' : '#718096',
                                                                                marginBottom: '4px'
                                                                            }}>
                                                                                Cantidad de Clientes
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: '24px',
                                                                                fontWeight: 'bold',
                                                                                color: darkMode ? '#fff' : '#000'
                                                                            }}>
                                                                                {(agencyInfo.count || 0).toLocaleString()}
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                    <Col md={3}>
                                                                        <div style={{ marginBottom: '12px' }}>
                                                                            <div style={{
                                                                                fontSize: '12px',
                                                                                color: darkMode ? '#a0aec0' : '#718096',
                                                                                marginBottom: '4px'
                                                                            }}>
                                                                                Promedio por Cliente
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: '20px',
                                                                                fontWeight: 'bold',
                                                                                color: darkMode ? '#fff' : '#000'
                                                                            }}>
                                                                                <NumberFormat
                                                                                    value={(agencyInfo.averagePerTicketDollar || 0).toFixed(2)}
                                                                                    displayType={'text'}
                                                                                    thousandSeparator={','}
                                                                                    decimalSeparator={'.'}
                                                                                    prefix={'$ '}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </Col>
                                                                </Row>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            </>
                        )}
                        {/* Botón de exportar al final, a la izquierda */}
                        <Row className="mt-4">
                            <Col>
                                <div style={{ textAlign: 'left' }}>
                                    <Button
                                        className="btn"
                                        color="primary"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            exportExcel();
                                        }}
                                        disabled={!hasSearched || !chartDataState ||
                                            (!Array.isArray(chartDataState) && (!chartDataState.types || !Array.isArray(chartDataState.types) || chartDataState.types.length === 0)) ||
                                            (Array.isArray(chartDataState) && chartDataState.length === 0)}
                                    >
                                        <Icon icon={fileDownload} /> Exportar
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                        <Modal
                            toggle={() => {
                                setModalVisible(false);
                                setModalMsg("");
                            }}
                            isOpen={modalVisible}
                            className={`modal-lg ${darkMode ? "dark-mode" : ""}`}
                        >
                            <div className={`modal-header ${darkMode ? "bg-dark text-white border-secondary" : ""}`}>
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Ventas
                                </h5>
                                <button
                                    aria-label="Close"
                                    className="close"
                                    type="button"
                                    onClick={() => {
                                        setModalVisible(false);
                                        setModalMsg("");
                                    }}
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
                                    onClick={() => {
                                        setModalVisible(false);
                                        setModalMsg("");
                                    }}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </Modal>
                    </div>
                </div>
            </div >
            {/* Componente para imprimir (está oculto) */}
            < div style={{ display: "none" }
            }>
                <ComponentToPrint data={dataToPrint} />
            </div >
        </>
    );
}

export default SalesChartPage;
