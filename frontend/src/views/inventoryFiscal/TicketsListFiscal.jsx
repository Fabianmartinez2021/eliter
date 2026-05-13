/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { salesActions, userActions } from "../../actions";
import { invoiceActions } from "../../actions/invoice.actions";

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
} from "reactstrap";
//componente dataTable sede
import { history } from "../../helpers";
import "../../assets/css/table.css";
import "../../assets/css/filters.css";
import NumberFormat from "react-number-format";
import Datetime from "react-datetime";
import "moment/locale/es";
import { useForm } from "react-hook-form";
import { Icon } from "@iconify/react";
import pdfIcon from "@iconify/icons-fa-solid/file-pdf";
import { useReactToPrint } from "react-to-print";
import { omit } from "reactstrap/lib/utils";
import { CSVLink } from "react-csv";
import fileDownload from "@iconify/icons-fa-solid/file-download";
import { isValidDate } from "../../helpers/date";
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import "../../assets/css/darkMode.css"; 
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function TicketsListFiscalPage() {

  const dispatch = useDispatch();

  // Modo oscuro 
  const { darkMode } = useDarkMode();

  //usuario
  const user = useSelector((state) => state.authentication.user);
  const dataInvoice = useSelector((state) => state.invoice.table);
  console.log('dataInvoice', dataInvoice)
  const [comment, setComment] = useState("");
  const loadingPage = useSelector((state) => state.invoice.loading);
  
    // Inicialización de datos
  useEffect(() => {
    // Agregar clases al body
    document.body.classList.add("landing-page", "sidebar-collapse");
    dispatch(salesActions.salesDataForm(user.agency.id));
    dispatch(userActions.getListUserAgencies({ agency: user.agency.id }));

    // Limpieza al desmontar el componente
    return () => {
      document.body.classList.remove("landing-page", "sidebar-collapse");
    };
  }, [dispatch, user.agency.id]);

  //Verificar data de redux
  useEffect(() => {
    if (dataInvoice && dataInvoice.results) {
      setData(dataInvoice.results);
    }
    if (dataInvoice && dataInvoice.metadata && dataInvoice.metadata[0]) {
      setRowCount(dataInvoice.metadata[0].total);
    }
  }, [dataInvoice]);

  // Inicializar tabla sin data
  const [data, setData] = useState([]);


  const [rowCount, setRowCount] = useState(0);

  const columns = [
    {
      name: "N° Factura",
      selector: "controlNumber",
      sortable: true,
    },
    {
      name: "N° de Nota",
      selector: "order",
      sortable: true,
    },
    {
      name: "Sucursal",
      selector: "agencyName",
      sortable: true,
      cell: (row) => `${row.market.name}` 
    },
    {
      name: "Documento",
      selector: "document",
      sortable: true,
      cell: (row) => `${row.documentType}-${row.document}`,
    },
    {
      name: "Nombres",
      selector: "names",
      sortable: true,
    },
    {
      name: "Dirección",
      selector: "address",
      sortable: true,
    },
    {
      name: "Fecha de emision",
      selector: "date",
      sortable: true,
      cell: (row) => moment(row.date).utc().format("YYYY-MM-DD"),
    },
    {
      name: "Fecha de registro",
      selector: "createdAt",
      sortable: true,
      cell: (row) => moment(row.createdAt).utc().format("YYYY-MM-DD"),
    },
    // {
    //   name: "",
    //   button: true,
    //   cell: (row) => {
    //     const createdDate = moment(row.createdAt);
    //     const currentDate = moment();
    //     const daysSinceCreation = currentDate.diff(createdDate, 'days');

    //     const canEditOrAnulate =
    //       (user.role === 1 || user.role === 2 || user.role === 9) &&
    //       daysSinceCreation <= 40;

    //     return row.isAnulated ? (
    //       <span className="text-danger font-weight-bold">ANULADA</span>
    //     ) : (
    //       canEditOrAnulate && (
    //         <div className="d-flex gap-2">
    //           <Button
    //             className="btn-link"
    //             color="primary"
    //             size="sm"
    //             onClick={(e) => {
    //               e.preventDefault();
    //               history.push("/update-inventory-special/", { id: row._id });
    //             }}
    //           >
    //             <i className="fas fa-pencil-alt"></i>
    //           </Button>
    //           {user.role !== 9 && (
    //             <Button
    //               className="btn-link text-danger"
    //               color="link"
    //               size="sm"
    //               onClick={() => handleAnulate(row._id)}
    //             >
    //               <i className="fas fa-ban"></i>
    //             </Button>
    //           )}
    //         </div>
    //       )
    //     );
    //   },
    // }
  ,
]


  const headers = [
    { label: "Fecha emitida", key: "createdDate" },
    { label: "Sucursal", key: "market.name" },
    { label: "N° Factura", key: "controlNumber" },
    { label: "N° de Nota", key: "order" },
    { label: "Tipo de documento", key: "documentType" },
    { label: "Documento", key: "document" },
    { label: "Nombre o Razón social", key: "names" },
    { label: "Direccion", key: "address" },
    { label: "Exento", key: "totals.exempt" },
    { label: "Base imponible", key: "totals.taxableBase" },
    { label: "IVA", key: "totals.iva" },
    { label: "Monto total", key: "totals.totalAmount" },
  ];

  //obtener data de usuario necesaria
  const getUserData = () => {
    return {
      agency: user.agency.id,
      role: user.role,
      id: user.id,
    };
  };

 const handleAnulate = (id) => {
  setInvoiceIdToAnulate(id);
  setModalMsg("¿Estás seguro que deseas anular esta factura?");
  setModalVisible(true);
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

    dispatch(
      invoiceActions.dataTicketsInvoice(
        getUserData(),
        1,
        perPageSelect === 0 ? perPage : perPageSelect,
        direction,
        data
      )
    );
  };

  //Form Data Filter
  const { handleSubmit, register, reset, setValue, watch } = useForm();

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
    reset({ ticket: "", names: "", reference: "", startDate: "", endDate: "" });
  };

  //Modal genérico y mensaje
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMsg, setModalMsg] = useState("");
  const [invoiceIdToAnulate, setInvoiceIdToAnulate] = useState(null);
  const [expandAll, setExpandAll] = useState(false);

 // Data al expandir una fila
 const ExpandedComponent = ({ data }) => {

  if (!data) {
    return <div>No hay datos para mostrar.</div>;
  }

  const _defaultAgencyWatch = watch('agency');

  useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


  return (
    <>
      {/* Productos */}
      {data.products && data.products.length > 0 ? (
        <>
        <div className="ml-2 mt-4">
          <b>Productos</b>
        </div>
        <Table striped responsive className="mt-4">
          <thead style={{ color: "black" }}>
            <tr>
              <th>Producto</th>
              <th>Precio Unitario</th>
              <th>Peso Kg/Unidad</th>
              <th>Sub - Total</th>
              {data.isWholesale && <th>Diferencial</th>}
            </tr>
          </thead>
          <tbody style={{ color: "black" }}>
            {data.products.map((product, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: product.appliedWholesaleDiscount
                    ? "#D3FFDF"
                    : "",
                }}
              >
                <td>
                  {product.name ? (
                    <>
                      {product.name}{" "}
                      {product.exempt ? "(E)" : product.taxed ? "(G)" : ""}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>
                <td>
                  <NumberFormat
                    value={product.unitPrice ? product.unitPrice.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
                <td>
                  <NumberFormat
                    value={product.kg ? product.kg.toFixed(3) : "0.000"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                  />
                </td>
                <td>
                  <NumberFormat
                    value={
                      product.kg && product.unitPrice
                        ? (product.kg * product.unitPrice).toFixed(2)
                        : "0.00"
                    }
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
                {data.isWholesale && (
                  <td>
                    <NumberFormat
                      value={
                        product.wholesalePrice
                          ? product.wholesalePrice.toFixed(2)
                          : "0.00"
                      }
                      displayType={"text"}
                      thousandSeparator={","}
                      decimalSeparator={"."}
                      prefix="Bs "
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        </>

      ) : (
        <div>No hay productos disponibles.</div>
      )}

      {/* Totales */}
      {data.totals ? (
        <>
          <div className="ml-2 mt-4">
            <b>Totales</b>
          </div>
          <Table striped responsive className="mt-4">
            <thead style={{ color: "black" }}>
              <tr>
                <th>Exento</th>
                <th>Base Imponible</th>
                <th>IVA</th>
                <th>Monto Total</th>
              </tr>
            </thead>
            <tbody style={{ color: "black" }}>
              <tr>
                <td>
                  <NumberFormat
                    value={
                      data.totals.exempt
                        ? parseFloat(data.totals.exempt).toFixed(2)
                        : "0.00"
                    }
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
                <td>
                  <NumberFormat
                    value={
                      data.totals.taxableBase
                        ? parseFloat(data.totals.taxableBase).toFixed(2)
                        : "0.00"
                    }
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
                <td>
                  <NumberFormat
                    value={
                      data.totals.iva
                        ? parseFloat(data.totals.iva).toFixed(2)
                        : "0.00"
                    }
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
                <td>
                  <NumberFormat
                    value={
                      data.totals.totalAmount
                        ? parseFloat(data.totals.totalAmount).toFixed(2)
                        : "0.00"
                    }
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
              </tr>
            </tbody>
          </Table>
          {data.isAnulated && data.anulationComment && (
            <>
              <div className="ml-2 mt-4">
                <b>Motivo de Anulación</b>
              </div>
              <Table striped responsive className="mt-4">
                <thead style={{ color: "black" }}>
                  <tr>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody style={{ color: "black" }}>
                  <tr>
                    <td>{data.anulationComment}</td>
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
                      marginBottom:"50px",
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
      ) : (
        <div>No hay totales disponibles.</div>
      )}
    </>
  );
};

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
              Ticket N° {data.controlNumber}
            </h2>
          </div>
          <Table striped responsive>
            <thead style={{ color: "black" }}>
              <tr>
                <th>Agencia</th>
                <th>Nro de Ticket</th>
                <th>Nombres</th>
                <th>Fecha de registro</th>
              </tr>
            </thead>
            <tbody style={{ color: "black" }}>
              <tr>
                <td>{data.market ? data.market.name : ""}</td>
                <td>{data.controlNumber ? data.controlNumber : ""}</td>
                <td>{data.names ? data.names : ""}</td>
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

  /*** Exportar ***/
  const refExcel = useRef(null);
  const exportExcel = () => {
    //El mismo método, el ultimo parametro define si es para descarga
    dispatch(
      invoiceActions.dataTicketsInvoice(
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

  
    const exportToExcel = (data, filename = 'historialdefacturas.xlsx') => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
  
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de facturas');
  
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
        item.totals.exempt =
          item.totals.exempt
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.totals.taxableBase =
          item.totals.taxableBase
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.totals.iva =
          item.totals.iva
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.totals.totalAmount =
          item.totals.totalAmount
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto
        item.createdDate = moment(item.createdDate)
          .utc()
          .format("YYYY-MM-DD hh:mm:ss a");
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

  
	const conditionalRowStyles = [
		
		{
		  when: row =>(row.isAnulated === true),
		  style: {
			backgroundColor: 'rgba(255, 99, 71, 0.5)', // Rojo
		  },
		},
	];

  return (
    <>
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
                  Historial de facturas
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
                    className="form-inline"
                    style={{ marginTop: 15 }}
                  >
                    {(user.role == 1 ||
                      user.role == 2 ||
                      user.role == 6 ||
                      user.role == 5 ||
                      user.role == 7 ||
                      user.role == 9 ||
                      user.role == 10
                    ) && (
                      <FormGroup className="mr-3">
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
                    )}
                    <FormGroup className="mr-3">
                      <input
                        className="form-control"
                        placeholder="N° de Control"
                        type="text"
                        name="ticket"
                        min="1"
                        ref={register}
                      ></input>
                    </FormGroup>
                    <FormGroup className="mr-3">
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
                    <FormGroup className="mr-3">
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
                    <Button
                      color="primary"
                      type="submit"
                      disabled={loadingPage}
                    >
                      {loadingPage && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}{" "}
                      Buscar
                    </Button>
                    <FormGroup className="mr-3">
                      <Button
                        color="primary"
                        disabled={loadingPage}
                        onClick={() => {
                          setExpandAll(!expandAll);
                        }}
                      >
                        {loadingPage && (
                          <span className="spinner-border spinner-border-sm mr-1"></span>
                        )}{" "}
                        Desplegar todo
                      </Button>
                    </FormGroup>
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
                  conditionalRowStyles={conditionalRowStyles}
                  onChangeRowsPerPage={handlePerRowsChange}
                  onChangePage={handlePageChange}
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
            <Modal
              toggle={() => {
                setModalVisible(false);
                setModalMsg("");
              }}
              isOpen={modalVisible}
            >
              <div className="modal-header">
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
              <div className="modal-body">
                <p>{modalMsg}</p>
              </div>
              <div className="modal-footer">
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
      <Modal
        toggle={() => {
          setModalVisible(false);
          setModalMsg("");
          setInvoiceIdToAnulate(null);
        }}
        isOpen={modalVisible}
      >
        <div className="modal-header">
          <h5 className="modal-title" id="examplemodalMsgLabel">
            Anulación de factura
          </h5>
          <button
            aria-label="Close"
            className="close"
            type="button"
            onClick={() => {
              setModalVisible(false);
              setModalMsg("");
              setInvoiceIdToAnulate(null);
            }}
          >
            <span aria-hidden={true}>×</span>
          </button>
        </div>
        <div className="modal-body">
          <p>{modalMsg}</p>
          <textarea
            className="form-control"
            label="Motivo de anulación"
            placeholder="Escribir motivo..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <Button
            color="secondary"
            type="button"
            onClick={() => {
              setModalVisible(false);
              setModalMsg("");
              setInvoiceIdToAnulate(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            color="danger"
            type="button"
            onClick={() => {
              if (invoiceIdToAnulate) {
                dispatch(invoiceActions.anulateInvoice(invoiceIdToAnulate, comment));
              }
              setModalVisible(false);
              setModalMsg("");
              setInvoiceIdToAnulate(null);
              getDataTable(1);
              setComment("");
            }}
            disabled={!comment}
          >
            Confirmar anulación
          </Button>
        </div>
      </Modal>
      {/* Componente para imprimir (está oculto) */}
      <div style={{ display: "none" }}>
        <ComponentToPrint data={dataToPrint} />
      </div>
    </>
  );
}

export default TicketsListFiscalPage;