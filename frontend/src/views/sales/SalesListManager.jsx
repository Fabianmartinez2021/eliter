/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { salesActions, userActions, alertActions } from "../../actions";
import moment from "moment";
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import DataTable from "react-data-table-component";
import {
  Button,
  Row,
  Col,
  Table,
  Form,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
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
import { useSyncFirstAgencyFormField } from "../../hooks/useSyncFirstAgency";
import { salesService } from "../../services";

const companies = [
  "Principal",
  "EMBUTIDOS MOHAN",
  "DELICATESES EMMANUEL",
  "DELICATESES MOMOY",
  "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];

/** Misma regla que backend: día calendario Venezuela (UTC−4). */
function venezuelaCalendarDayKey(d) {
  return moment(d).utc().subtract(4, "hours").format("YYYY-MM-DD");
}
function isSameVenezuelaCalendarDayAsNow(date) {
  if (!date) return false;
  return (
    venezuelaCalendarDayKey(date) ===
    venezuelaCalendarDayKey(moment().toDate())
  );
}

function SalesListManagerPage() {
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

  const [saleEditOpen, setSaleEditOpen] = useState(false);
  const [saleEditRow, setSaleEditRow] = useState(null);
  const [saleEditAllowPayments, setSaleEditAllowPayments] = useState(false);
  const [saleEditForm, setSaleEditForm] = useState({
    names: "",
    businessName: "",
    document: "",
    phone: "",
    comment: "",
    ves: "",
    dollar: "",
    eur: "",
    cop: "",
    tAmmount: "",
    pAmmount: "",
    pAmmountExtra: "",
    total: "",
    valueDollar: "",
    valueEur: "",
    valueCop: "",
  });

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
      name: "Total $",
      selector: "total",
      sortable: true,
      cell: (row) => {
        return (
          <NumberFormat
            value={row.type === 12 ? (row.total).toFixed(2) : (row.total/row.valueDollar).toFixed(2)}
            displayType={"text"}
            thousandSeparator={","}
            decimalSeparator={"."}
            prefix="$ "
          />
        );
      },
    },
    {
      name: "Total Bs",
      selector: "total",
      sortable: true,
      cell: (row) => {
        return (
          <NumberFormat
            value={row.type === 12 ?  (row.total*row.valueDollar).toFixed(2) : row.total.toFixed(2)}
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
                value={row.differential && row.type !== 13 ? row.differential.toFixed(2) : ""}
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
                  && row.type !== 13
                    ? row.wholesaleDiscountDifferential.toFixed(2)
                    : ""
                }
                displayType={"text"}
                thousandSeparator={","}
                decimalSeparator={"."}
                prefix="Bs "
              />
            </div>
            <div>
              <NumberFormat
                value={
                  row.couponDiscount && row.couponDiscount > 0 && (row.type === 1 || row.type === 5)
                    ? row.couponDiscount.toFixed(2)
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
      style: { verticalAlign: "top", alignSelf: "flex-start" },
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
        else if (row.type === 12 || row.type === 13)
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
                {row.couponCode && (
                  <>
                    &nbsp;
                    <Badge color={"danger"} pill className="h6 p-2 mt-1 badge-cupon-outline">
                      Cupón
                    </Badge>
                  </>
                )}
              </>
            );
          } else if (row.type === 5) {
            return (
              <>
                <Badge color={"danger"} pill className="h6 p-2 mt-1">
                  {"DETAL F"}
                </Badge>
                {row.couponCode && (
                  <>
                    &nbsp;
                    <Badge color={"danger"} pill className="h6 p-2 mt-1 badge-cupon-outline">
                      Cupón
                    </Badge>
                  </>
                )}
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
    {
      name: "Acciones",
      omit: user.role !== 1,
      width: "200px",
      cell: (row) => (
        <div className="d-flex flex-wrap" style={{ gap: "6px" }}>
          <Button
            color="primary"
            size="sm"
            outline
            title="Editar datos de cliente / nota; montos solo si la venta es de hoy (Venezuela) y no es crédito"
            onClick={() => {
              setSaleEditRow(row);
              const allowPay =
                isSameVenezuelaCalendarDayAsNow(row.createdDate) &&
                !row.isCredit &&
                !row.isPayment &&
                !row.isSumation;
              setSaleEditAllowPayments(allowPay);
              setSaleEditForm({
                names: row.names || "",
                businessName: row.businessName || "",
                document: row.document || "",
                phone: row.phone || "",
                comment: row.comment || "",
                ...(allowPay
                  ? {
                      ves: row.ves ?? "",
                      dollar: row.dollar ?? "",
                      eur: row.eur ?? "",
                      cop: row.cop ?? "",
                      tAmmount: row.tAmmount ?? "",
                      pAmmount: row.pAmmount ?? "",
                      pAmmountExtra: row.pAmmountExtra ?? "",
                      total: row.total ?? "",
                      valueDollar: row.valueDollar ?? "",
                      valueEur: row.valueEur ?? "",
                      valueCop: row.valueCop ?? "",
                    }
                  : {
                      ves: "",
                      dollar: "",
                      eur: "",
                      cop: "",
                      tAmmount: "",
                      pAmmount: "",
                      pAmmountExtra: "",
                      total: "",
                      valueDollar: "",
                      valueEur: "",
                      valueCop: "",
                    }),
              });
              setSaleEditOpen(true);
            }}
          >
            Editar
          </Button>
          <Button
            color="danger"
            size="sm"
            outline
            disabled={row.isSumation || row.isPayment}
            title={
              row.isSumation || row.isPayment
                ? "Abonos/pagos de crédito no se eliminan desde aquí"
                : row.isCredit
                ? "Eliminar crédito inicial sin abonos (cuenta pendiente e inventario)"
                : "Eliminar venta y reintegrar inventario"
            }
            onClick={async () => {
              const saleId = row.id || row._id;
              const msg = row.isCredit
                ? `¿Eliminar el crédito / cuenta pendiente del ticket N° ${row.order}? Solo si no tiene abonos. Se reintegrará inventario.`
                : `¿Eliminar la venta N° ${row.order}? Se reintegrará el inventario y se eliminarán los movimientos de caja asociados a este ticket.`;
              if (!window.confirm(msg)) {
                return;
              }
              try {
                await salesService.salesDeleteAdmin(saleId);
                dispatch(alertActions.success("Venta eliminada"));
                dispatch(
                  salesActions.dataTableUser(
                    {
                      agency: user.agency.id,
                      role: user.role,
                      id: user.id,
                    },
                    1,
                    perPageSelect == 0 ? perPage : perPageSelect,
                    direction,
                    filters ? filters : {}
                  )
                );
              } catch (err) {
                dispatch(
                  alertActions.error(
                    typeof err === "string" ? err : err.message || "Error al eliminar"
                  )
                );
              }
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
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
    { label: "Total $", key: "totalDollar" },
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

  const getDataTable = (page) => {
    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        page,
        perPageSelect == 0 ? perPage : perPageSelect,
        direction,
        {}
      )
    );
  };

  //Paginar
  const handlePageChange = async (page) => {
    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        page,
        perPageSelect == 0 ? perPage : perPageSelect,
        direction,
        filters ? filters : {}
      )
    );
  };

  //Ordenar
  const handleSort = (column, sortDirection) => {
    let sort = {
      id: column.selector,
      desc: sortDirection == "asc" ? false : true,
    };
    setDirection(sort);
    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        1,
        perPageSelect == 0 ? perPage : perPageSelect,
        sort,
        filters ? filters : {}
      )
    );
  };

  //Cambiar cantidad de filas
  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPageSelect(newPerPage);
    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        page,
        newPerPage,
        direction,
        filters ? filters : {}
      )
    );
  };

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

  //Consultar al entrar
  useEffect(() => {
    setData([]);
    getDataTable(1);
  }, []);

  //Calcular total general cuando cambie la información
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [general, setGeneral] = useState(0);
  const [generalDollar, setGeneralDollar] = useState(0);
  const [wholesaleDifferential, setWholesaleDifferential] = useState(0);
  const [discountDifferential, setDiscountDifferential] = useState(0);
  const [couponDifferential, setCouponDifferential] = useState(0);
  const [totalAmountDifferential, setTotalAmountDifferential] = useState(0);
  const [totalAmmountDeliverys, setTotalAmmountDeliverys] = useState(0);

  useEffect(() => {
    let sumtotal = 0;
    let sumtotalDollar = 0;
    let sumWholesaleDifferential = 0;
    let sumDiscountDifferential = 0;
    let sumCouponDifferential = 0;
    let sumTotalAmountDifferential = 0;
    let sumTotalAmmountDeliverys = 0;
    if (data && data.length > 0) {
      setLoadingTotal(true);
      if (dataSales && dataSales.total && dataSales.total[0] && dataSales.total[0].totalAmount && dataSales.total[0].totalAmountDollar) {
        sumtotal = dataSales.total[0].totalAmount;
        sumtotalDollar = dataSales.total[0].totalAmountDollar;
        sumWholesaleDifferential = dataSales.total[0].wholesaleDifferential;
        sumDiscountDifferential = dataSales.total[0].discountDifferential;
        sumCouponDifferential = (dataSales.total[0].couponDifferential != null) ? dataSales.total[0].couponDifferential : 0;
        sumTotalAmountDifferential = dataSales.total[0].totalAmountDifferential;
        sumTotalAmmountDeliverys = dataSales.total[0].totalAmmountDeliverys;
      }
    }
    setLoadingTotal(false);
    setGeneral(sumtotal);
    setGeneralDollar(sumtotalDollar);
    setWholesaleDifferential(sumWholesaleDifferential);
    setDiscountDifferential(sumDiscountDifferential);
    setCouponDifferential(sumCouponDifferential);
    setTotalAmountDifferential(sumTotalAmountDifferential);
    setTotalAmmountDeliverys(sumTotalAmmountDeliverys);
  }, [data, dataSales, valueDollar]);

  //Opciones de paginacion
  const paginationOptions = {
    rowsPerPageText: "Filas por página",
    rangeSeparatorText: "de",
    selectAllRowsItem: true,
    selectAllRowsItemText: "Todos",
  };

  //Loader de la tabla
  const CustomLoader = () => (
    <>
      <div className="loading-table"></div>
    </>
  );

  //Abrir/Cerrar filtros
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  //Consultar por filtros
  const onFilterData = (data, e) => {
    var validStartDate = moment(data.startDate).isValid();

    if (data.startDate != "" && !validStartDate) {
      setModalVisible(true);
      setModalMsg("Ingrese una fecha válida");
      return;
    }

    var validEndDate = moment(data.endDate).isValid();

    if (data.endDate != "" && !validEndDate) {
      setModalVisible(true);
      setModalMsg("Ingrese una fecha válida");
      return;
    }

    //Verificar que la fecha final sea superior o igual a la inicial
    var isafter = moment(data.startDate).isAfter(data.endDate);

    if (isafter) {
      setModalVisible(true);
      setModalMsg("La fecha inicial no puede ser superior a la final");
      return;
    }

    var a = moment(data.startDate);
    var b = moment(data.endDate);
    let dateDiff = b.diff(a, "days"); // =1

    //Si el rango de fechas es superior a los seis días abrir modal
    if (dateDiff > 60) {
      setModalVisible(true);
      setModalMsg("El rango de fechas no puede superar los 60 días");
      return;
    }


    setFilters(data);


    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        1,
        perPageSelect == 0 ? perPage : perPageSelect,
        direction,
        data
      )
    );
  };

  //Form Data Filter - defaultValues en false para que al marcar solo "Detal cupon" / "Detal F cupon" se envíen explícitamente los filtros
  const { handleSubmit, register, reset, setValue, watch } = useForm();
  const agencyFilterWatch = watch('agency');
  useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

  const handleChangeStartDate = (date) => {
    setStartDate(date);
  };

  const handleChangeEndDate = (date) => {
    setEndDate(date);
  };

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    reset({
      retail: false,
      retailC: false,
      wholesale: false,
      sumation: false,
      credit: false,
      retailF: false,
      retailFC: false,
      wholesaleF: false,
      sumationF: false,
      creditF: false,
      valePend: false,
      valePag: false,
      abonVale: false,
      ticket: "",
      names: "",
      reference: "",
      startDate: "",
      endDate: "",
    });
  };

  //Modal genérico y mensaje
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const [expandAll, setExpandAll] = useState(false);

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

  const ComponentToPrint = ({ data }) => {
    return (
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
                <th>Total $</th>
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
                  <NumberFormat
                    value={data.total ? (data.total/data.valueDollar).toFixed(2) : 0}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix={"Bs "}
                  />
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
                Total $:{" "}
                {
                  <NumberFormat
                    value={data.totalAmountDollar ? (data.totalAmountDollar).toFixed(2) : ""}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix={data.totalAmountDollar ? "$ " : ""}
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
  );}

  /*const ReferenceComponent = ({ data }) => {

    if((data.pAmmount && data.pAmmount>0 || (data.pAmmountExtra && data.pAmmountExtra>0)) && !data.dollar && !data.eur && !data.cop && !data.tAmmount && !data.ves){
      if(data.pReferenceExtra != ""){
        return `${data.pReference}, ${data.pReferenceExtra}`;
      }else{
        return `${data.pReference}`;
      }
    }else if((data.tAmmount && data.tAmmount>0) && !data.dollar && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.ves){
      return `${data.tReference}`
    }else if((data.dollar && data.dollar>0) && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
      return "Dólar"
    }else if((data.eur && data.eur>0) && !data.dollar && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
      return "Euros"
    }else if((data.cop && data.cop>0) && !data.dollar && !data.eur && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount && !data.ves){
      return "Pesos"
    }else if((data.ves && data.ves>0) && !data.dollar && !data.eur && !data.cop && !data.pAmmount && !data.pAmmountExtra && !data.tAmmount){
      return "Efectivo"
    }else if((data.credit && data.credit>0)){
      return "Crédito"
    }else{
      return "Mixto"
    }
  }*/

  useEffect(() => {
    if (dataToPrint) {
      handlePrint();
    }
  }, [dataToPrint]);

  /*** Exportar ***/
  const refExcel = useRef(null);
  const exportExcel = () => {
    //El mismo método, el ultimo parametro define si es para descarga
    dispatch(
      salesActions.dataTableUser(
        getUserData(),
        1,
        perPageSelect == 0 ? perPage : perPageSelect,
        direction,
        filters,
        true
      )
    );
  };

  const mapDataWithHeaders = (data, headers) => {
    return data.map((item) => {
      const mappedItem = {};
      headers.forEach(({ label, key }) => {
        let value;
        
        // Caso especial: totalDollar ya está calculado en el useEffect
        if (key === "totalDollar") {
          // El valor ya viene calculado, solo necesita formateo si es string
          value = item.totalDollar;
          if (typeof value === "string") {
            // Si tiene formato con comas, convertir a número y luego formatear
            value = value.toString().replace(/\./g, "").replace(",", ".");
            value = parseFloat(value) || 0;
          } else if (typeof value === "number") {
            value = parseFloat(value.toFixed(2));
          } else {
            value = parseFloat(value) || 0;
          }
        } else {
          value = key.includes(".")
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
        }

        mappedItem[label] = value;
      });
      return mappedItem;
    });
  };


  const exportToExcel = (data, filename = 'TicketsRegistrados.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets registrados');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, filename);
  };

  const excel = useSelector((state) => state.download.excel);
  const loadingExcel = useSelector((state) => state.download.loading);

  // Inicializar data de excel
  const [dataExcel, setDataExcel] = useState([]);

  //Verificar data de redux de la data de excel
  useEffect(() => {
    if (excel && excel.results) {
      // Se una copia de los detalles para que estos no sean los modificados
      let fixedData = excel.results.map((item) => {
        return Object.assign({}, item);
      });

      //Se modifican los datos antes de la descarga en excel
      fixedData.forEach((item) => {
        // Calcular totalDollar ANTES de formatear los valores (cuando aún son números)
        if (item.total && item.valueDollar && item.valueDollar > 0) {
          item.totalDollar = (item.total / item.valueDollar).toFixed(2);
        } else {
          item.totalDollar = 0;
        }

        item.pending =
          item.pending
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.tAmmount =
          item.tAmmount
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.pAmmount =
          item.pAmmount
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto




        item.dollar =
          item.dollar
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.ves =
          item.ves
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.cop =
          item.cop
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.valueDollar =
          item.valueDollar
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.total =
          item.total
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        // Formatear totalDollar también
        item.totalDollar =
          item.totalDollar
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.paymentDate = moment(item.paymentDate)
          .utc()
          .format("YYYY-MM-DD");
        item.createdDate = moment(item.createdDate)
          .utc()
          .format("YYYY-MM-DD");
      });

      setDataExcel(fixedData);
    }
  }, [excel]);

  useEffect(() => {
    if (dataExcel && dataExcel.length > 0) {
      const dataFormatted = mapDataWithHeaders(dataExcel, headers);
      exportToExcel(dataFormatted); // Ya no se hace click en CSVLink
      setDataExcel([]);
    }
  }, [dataExcel]);

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
                  Tickets registrados
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
                      {(user.role == 1 ||
                        user.role == 2 ||
                        user.role == 6 ||
                        user.role == 5 ||
                        user.role == 7 ||
                        user.role == 9 ||
                        user.role == 10
                      ) && (
                          <Col xs={12} sm={6} lg={3} className="mb-2">
                            <FormGroup>
                              {getting && (
                                <span className="spinner-border spinner-border-sm mr-1"></span>
                              )}
                              <select
                                className="form-control"
                                name="agency"
                                ref={register}
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
                            </FormGroup>
                          </Col>
                        )}
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
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
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          {getting && (
                            <span className="spinner-border spinner-border-sm mr-1"></span>
                          )}
                          <select
                            className="form-control"
                            name="cashier"
                            ref={register}
                          >
                            <option key="" name="" value="">
                              Seleccione usuario
                            </option>
                            {listUsers &&
                              listUsers.map((list) => (
                                <option
                                  key={list.id}
                                  name={list.id}
                                  value={list.id}
                                >
                                  {/* {`${list.firstName} ${list.lastName}`} */}
                                  {`${list.username}`}
                                </option>
                              ))}
                          </select>
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <input
                            className="form-control"
                            placeholder="N° de Ticket"
                            type="number"
                            name="ticket"
                            min="1"
                            ref={register}
                          ></input>
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <input
                            className="form-control"
                            name="names"
                            placeholder="Nombres"
                            type="text"
                            ref={register}
                          ></input>
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <input
                            className="form-control"
                            name="reference"
                            placeholder="Referencia"
                            type="text"
                            ref={register}
                          ></input>
                        </FormGroup>
                      </Col>
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
                            isValidDate={isValidDate}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <Datetime
                            timeFormat={false}
                            dateFormat={"YYYY-MM-DD"}
                            closeOnSelect
                            onChange={handleChangeEndDate}
                            value={endDate}
                            inputProps={{
                              name: "endDate",
                              ref: register,
                              placeholder: "Fecha final",
                              autoComplete: "off",
                            }}
                            isValidDate={isValidDate}
                          />
                        </FormGroup>
                      </Col>
                    </Row>


                    {/* Tercera fila - Campos adicionales */}
                    <Row className="mb-3">
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
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <input
                            className="form-control"
                            name="initialHour"
                            placeholder="Hora inicial  (XX:XX)"
                            type="text"
                            ref={register}
                          ></input>
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} lg={3} className="mb-2">
                        <FormGroup>
                          <input
                            className="form-control"
                            name="finalHour"
                            placeholder="Hora final  (XX:XX)"
                            type="text"
                            ref={register}
                          ></input>
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Cuarta fila - Checkboxes con estilo personalizado */}
                    <Row className="mb-3">
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="retail"
                            id="retail"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="retail" className="custom-checkbox-label">
                            DETAL
                          </label>
                        </div>
                      </Col>
                      {/* <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="retailC"
                            id="retailC"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="retailC" className="custom-checkbox-label">
                            Detal cupon
                          </label>
                        </div>
                      </Col> */}
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="wholesale"
                            id="wholesale"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="wholesale" className="custom-checkbox-label">
                            MAYOR
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="sumation"
                            id="sumation"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="sumation" className="custom-checkbox-label">
                            ABONOS
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="credit"
                            id="credit"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="credit" className="custom-checkbox-label">
                            CRÉDITOS
                          </label>
                        </div>
                      </Col>
                      {/* <Col xs={6} sm={4} md={2} className="mb-2">
                      <div className="custom-checkbox-wrapper">
                        <input
                          className="custom-checkbox"
                          name="telesale"
                          id="telesale"
                          type="checkbox"
                          value={true}
                          ref={register}
                        />
                        <label htmlFor="telesale" className="custom-checkbox-label">
                          TELEVENTAS
                        </label>
                      </div>
                    </Col> */}
                      {/* Fiscal / cupón — oculto en tickets registrados
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="retailF"
                            id="retailF"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="retailF" className="custom-checkbox-label">
                            DETAL FISCAL
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="retailFC"
                            id="retailFC"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="retailFC" className="custom-checkbox-label">
                            Detal F cupon
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="wholesaleF"
                            id="wholesaleF"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="wholesaleF" className="custom-checkbox-label">
                            MAYOR FISCAL
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="sumationF"
                            id="sumationF"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="sumationF" className="custom-checkbox-label">
                            ABONOS FISCALES
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="creditF"
                            id="creditF"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="creditF" className="custom-checkbox-label">
                            CRÉDITOS FISCALES
                          </label>
                        </div>
                      </Col>
                      */}
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="valePend"
                            id="valePend"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="valePend" className="custom-checkbox-label">
                            VALES PENDIENTES
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="valePag"
                            id="valePag"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="valePag" className="custom-checkbox-label">
                            VALES PAGADOS
                          </label>
                        </div>
                      </Col>
                      <Col xs={6} sm={6} md={2} className="mb-2">
                        <div className="custom-checkbox-wrapper">
                          <input
                            className="custom-checkbox"
                            name="abonVale"
                            id="abonVale"
                            type="checkbox"
                            value={true}
                            ref={register}
                          />
                          <label htmlFor="abonVale" className="custom-checkbox-label">
                            ABONOS VALES
                          </label>
                        </div>
                      </Col>
                    </Row>
                    <Row className="mb-3">
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
                      <Col xs={12} sm={6} md={3} className="mb-2">
                        <Button
                          color="primary"
                          disabled={loadingPage}
                          onClick={() => {
                            setExpandAll(!expandAll);
                          }}
                          className="w-35"
                          style={{ minWidth: '120px' }}
                        >
                          {loadingPage && (
                            <span className="spinner-border spinner-border-sm mr-1"></span>
                          )}{" "}
                          Desplegar todo
                        </Button>
                      </Col>
                    </Row>


                  </Form>
                </>
              )}
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
                  expandableRowExpanded={(row) => expandAll}
                  sortIcon={
                    <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>
                  }
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
                  conditionalRowStyles={[
                    {
                      when: (row) => (row.type === 1 || row.type === 5) && !!row.couponCode,
                      style: {
                        backgroundColor: darkMode ? "rgba(79, 70, 229, 0.35)" : "rgba(79, 70, 229, 0.12)",
                      },
                    },
                  ]}
                />
              </Col>
            </Row>
            <Modal isOpen={saleEditOpen} toggle={() => setSaleEditOpen(false)} size="lg">
              <ModalHeader toggle={() => setSaleEditOpen(false)}>
                Editar venta (ticket N° {saleEditRow ? saleEditRow.order : ""})
              </ModalHeader>
              <ModalBody>
                <p className="text-muted small">
                  {saleEditAllowPayments
                    ? "Venta del día (Venezuela), no crédito: puede corregir montos; la caja se recalcula. No se editan productos ni inventario desde aquí."
                    : "Solo datos de cliente y nota. Los montos solo el mismo día calendario Venezuela y si la venta no es crédito/abono/pago. Los productos no se modifican desde aquí."}
                </p>
                <FormGroup>
                  <Label>Nombres</Label>
                  <input
                    className="form-control"
                    value={saleEditForm.names}
                    onChange={(e) =>
                      setSaleEditForm((f) => ({ ...f, names: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Razón social</Label>
                  <input
                    className="form-control"
                    value={saleEditForm.businessName}
                    onChange={(e) =>
                      setSaleEditForm((f) => ({
                        ...f,
                        businessName: e.target.value,
                      }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Documento</Label>
                  <input
                    className="form-control"
                    value={saleEditForm.document}
                    onChange={(e) =>
                      setSaleEditForm((f) => ({
                        ...f,
                        document: e.target.value,
                      }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Teléfono</Label>
                  <input
                    className="form-control"
                    value={saleEditForm.phone}
                    onChange={(e) =>
                      setSaleEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Comentario / forma de pago (texto)</Label>
                  <input
                    className="form-control"
                    value={saleEditForm.comment}
                    onChange={(e) =>
                      setSaleEditForm((f) => ({
                        ...f,
                        comment: e.target.value,
                      }))
                    }
                  />
                </FormGroup>
                {saleEditAllowPayments && (
                  <>
                    <hr />
                    <p className="small font-weight-bold">Montos (ajuste de caja)</p>
                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>Bs</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.ves}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                ves: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>USD</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.dollar}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                dollar: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>EUR</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.eur}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                eur: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>COP</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.cop}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                cop: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Total</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.total}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                total: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Tasa USD (Bs)</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.valueDollar}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                valueDollar: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>Tasa EUR</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.valueEur}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                valueEur: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Tasa COP</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.valueCop}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                valueCop: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col md="4">
                        <FormGroup>
                          <Label>Punto / transfer (tAmmount)</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.tAmmount}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                tAmmount: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>Efectivo extra (pAmmount)</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.pAmmount}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                pAmmount: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                      <Col md="4">
                        <FormGroup>
                          <Label>pAmmountExtra</Label>
                          <input
                            className="form-control"
                            type="number"
                            step="0.01"
                            value={saleEditForm.pAmmountExtra}
                            onChange={(e) =>
                              setSaleEditForm((f) => ({
                                ...f,
                                pAmmountExtra: e.target.value,
                              }))
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="secondary" onClick={() => setSaleEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onClick={async () => {
                    if (!saleEditRow) return;
                    const id = saleEditRow.id || saleEditRow._id;
                    const payload = {
                      names: saleEditForm.names,
                      businessName: saleEditForm.businessName,
                      document: saleEditForm.document,
                      phone: saleEditForm.phone,
                      comment: saleEditForm.comment,
                    };
                    if (saleEditAllowPayments) {
                      Object.assign(payload, {
                        ves: saleEditForm.ves,
                        dollar: saleEditForm.dollar,
                        eur: saleEditForm.eur,
                        cop: saleEditForm.cop,
                        tAmmount: saleEditForm.tAmmount,
                        pAmmount: saleEditForm.pAmmount,
                        pAmmountExtra: saleEditForm.pAmmountExtra,
                        total: saleEditForm.total,
                        valueDollar: saleEditForm.valueDollar,
                        valueEur: saleEditForm.valueEur,
                        valueCop: saleEditForm.valueCop,
                      });
                    }
                    try {
                      await salesService.salesAdminUpdate(id, payload);
                      dispatch(alertActions.success("Venta actualizada"));
                      setSaleEditOpen(false);
                      dispatch(
                        salesActions.dataTableUser(
                          {
                            agency: user.agency.id,
                            role: user.role,
                            id: user.id,
                          },
                          1,
                          perPageSelect == 0 ? perPage : perPageSelect,
                          direction,
                          filters ? filters : {}
                        )
                      );
                    } catch (err) {
                      dispatch(
                        alertActions.error(
                          typeof err === "string"
                            ? err
                            : err.message || "Error al guardar"
                        )
                      );
                    }
                  }}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </Modal>
            {user.role !== 4 && (
              <>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!general && (
                        <b>
                          Total:{" "}
                          <NumberFormat
                            value={general.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!generalDollar && (
                        <b>
                          Total:{" "}
                          <NumberFormat
                            value={generalDollar.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"$ "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!wholesaleDifferential > 0 && (
                        <b>
                          Diff Mayor:{" "}
                          <NumberFormat
                            value={wholesaleDifferential.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                {/* El diferencial por combos se puede sacar directamente de los tickets, aunque esta manera es provisional mientras se llena la base de datos */}
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!totalAmountDifferential > 0 && (
                        <b>
                          Diff Combos:{" "}
                          <NumberFormat
                            value={(
                              totalAmountDifferential -
                              (wholesaleDifferential
                                ? wholesaleDifferential
                                : 0) -
                              (discountDifferential ? discountDifferential : 0)
                            ).toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!discountDifferential > 0 && (
                        <b>
                          Diff descuento:{" "}
                          <NumberFormat
                            value={discountDifferential.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!couponDifferential > 0 && (
                        <b>
                          Diff Cupón:{" "}
                          <NumberFormat
                            value={couponDifferential.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!totalAmountDifferential > 0 && (
                        <b>
                          Diff Total:{" "}
                          <NumberFormat
                            value={totalAmountDifferential.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
                <Row xs="12">
                  <Col>
                    <div className="pull-right">
                      {loadingTotal && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}
                      {!!totalAmmountDeliverys > 0 && (
                        <b>
                          Total por Deliverys:{" "}
                          <NumberFormat
                            value={totalAmmountDeliverys.toFixed(2)}
                            displayType={"text"}
                            thousandSeparator={","}
                            decimalSeparator={"."}
                            prefix={"Bs "}
                          />
                        </b>
                      )}
                    </div>
                  </Col>
                </Row>
              </>
            )}
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
      </div>
      {/* Componente para imprimir (está oculto) */}
      <div style={{ display: "none" }}>
        <ComponentToPrint data={dataToPrint} />
      </div>
    </>
  );
}

export default SalesListManagerPage;
