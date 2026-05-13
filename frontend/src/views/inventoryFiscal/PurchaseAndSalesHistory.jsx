/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { salesActions, userActions } from "../../actions";
import { invoiceActions } from "../../actions/invoice.actions";
import { salesFiscalActions } from "../../actions/salesFiscal.action";

import moment from "moment";
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import DataTable from "react-data-table-component";
import {
  Button,
  Spinner,
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
import { useReactToPrint } from "react-to-print";
import { CSVLink } from "react-csv";
import fileDownload from "@iconify/icons-fa-solid/file-download";
import { isValidDate } from "../../helpers/date";
import { useDarkMode } from '../../helpers/darkModeContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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

function TicketsListFiscalPage() {

  const dispatch = useDispatch();

  // Modo oscuro 
  const { darkMode } = useDarkMode();

  //usuario
  const user = useSelector((state) => state.authentication.user);
  const dataInvoice = useSelector((state) => state.invoice.totals);
  const invoiceTotalsByCompany = useSelector((state) => state.salesFiscal.totalsByCompany);
  const [showCompanyView, setShowCompanyView] = useState(false);

  const loadingPage = useSelector((state) => state.invoice.loadingTotals);
  const loadingPageSales = useSelector((state) => state.salesFiscal.loadingTotalsByCompany);

  const isLoading = showCompanyView ? loadingPageSales : loadingPage;

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
    if (showCompanyView) {
      if (invoiceTotalsByCompany && invoiceTotalsByCompany.results) {
        setData(invoiceTotalsByCompany.results);
      }
      if (invoiceTotalsByCompany?.metadata?.[0]) {
        setRowCount(invoiceTotalsByCompany.metadata[0].total);
      }
    } else {
      if (dataInvoice && dataInvoice.results) {
        setData(dataInvoice.results);
      }
      if (dataInvoice?.metadata?.[0]) {
        setRowCount(dataInvoice.metadata[0].total);
      }
    }
  }, [showCompanyView, dataInvoice, invoiceTotalsByCompany]);

  // Inicializar tabla sin data
  const [data, setData] = useState([]);

  const [rowCount, setRowCount] = useState(0);

  const columns = [
   
    // {
    //   name: "Sucursal",
    //   selector: "agencyName",
    //   sortable: true,
    //   cell: (row) => `${row.agencyName ? row.agencyName : ''}` 
    // },
    {
      name: "Empresa",
      selector: "companyName",
      sortable: true,
      cell: (row) => `${row.companyName ? row.companyName : ''}` 
    },
    {
      name: "Total Exento",
      selector: "exempt",
      sortable: true,
      cell: (row) => (
        <NumberFormat
          value={row.exempt ? row.exempt.toFixed(2) : "0.00"}
          displayType={"text"}
          thousandSeparator={","}
          decimalSeparator={"."}
          suffix=" bs"
        />
      ),
    },
    {
      name: "Total Base Imponible",
      selector: "taxableBase",
      sortable: true,
      cell: (row) => (
        <NumberFormat
          value={row.taxableBase ? row.taxableBase.toFixed(2) : "0.00"}
          displayType={"text"}
          thousandSeparator={","}
          decimalSeparator={"."}
          suffix=" bs"
        />
      ),
    },
    {
      name: "Total IVA",
      selector: "iva",
      sortable: true,
      cell: (row) => (
        <NumberFormat
          value={row.iva ? row.iva.toFixed(2) : "0.00"}
          displayType={"text"}
          thousandSeparator={","}
          decimalSeparator={"."}
          suffix=" bs"
        />
      ),
    },
    {
      name: "Total",
      selector: "totalAmount",
      sortable: true,
      cell: (row) => (
        <NumberFormat
          value={row.totalAmount ? row.totalAmount.toFixed(2) : "0.00"}
          displayType={"text"}
          thousandSeparator={","}
          decimalSeparator={"."}
          suffix=" bs"
        />
      ),
    },
    
  ];

  const headers = [
    { label: "Empresa", key: "companyName" },
    { label: "Total exento", key: "exempt" },
    { label: "Total base imponible", key: "taxableBase" },
    { label: "Total IVA", key: "iva" },
    { label: "Total", key: "totalAmount" },
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

  const onFilterData = (data, e) => {
    setFilters(data);
    if (showCompanyView) {
      // Vista por compañía
      dispatch(
        salesFiscalActions.dataInvoiceTotalsByCompany(
          getUserData(),
          1,
          perPageSelect === 0 ? perPage : perPageSelect,
          direction,
          data
        )
      );


    } else {
      // Vista general por sucursal
      dispatch(
        invoiceActions.dataInvoiceTotalsByAgencyMonthly(
          getUserData(),
          1,
          perPageSelect === 0 ? perPage : perPageSelect,
          direction,
          data
        )
      );

    }
  };

  //Form Data Filter
  const { handleSubmit, register, setValue, reset, watch } = useForm();

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
      {data.invoices && data.invoices.length > 0 ? (
        <Table striped responsive className="mt-4">
          <thead style={{ color: "black" }}>
            <tr>
              <th>Numero de Factura</th>
              <th>Nombre Emisor</th>
              <th>Sucursal</th>
              <th>Total Exento</th>
              <th>Total Base Imponible</th>
              <th>Total IVA</th>
              <th>Total</th>
              <th>Fecha de Emision</th>
            </tr>
          </thead>
          <tbody style={{ color: "black" }}>
            {data.invoices.map((invoices, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: invoices.appliedWholesaleDiscount
                    ? "#D3FFDF"
                    : "",
                }}
              >
                <td>
                 {invoices.controlNumber ? invoices.controlNumber : ''}
                </td>
                <td>
                 {invoices.names ? invoices.names : ''}
                </td>
                <td>
                 {invoices.agencyName ? invoices.agencyName : ''}
                </td>
               <td>
                  <NumberFormat
                    value={invoices.totals.exempt ? invoices.totals.exempt.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
               <td>
                  <NumberFormat
                    value={invoices.totals.taxableBase ? invoices.totals.taxableBase.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                  <NumberFormat
                    value={invoices.totals.iva ? invoices.totals.iva.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                  <NumberFormat
                    value={invoices.totals.totalAmount ? invoices.totals.totalAmount.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                <td>
                {invoices.date ? moment.utc(invoices.date).format("DD/MM/YYYY") : ""}
                </td>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div>No hay facturas.</div>
      )}
    </>
  );
};

 // Data al expandir una fila
 const ExpandedComponentSales = ({ data }) => {


  if (!data) {
    return <div>No hay datos para mostrar.</div>;
  }

  return (
    <>
      {/* Productos */}
      {data.invoices && data.invoices.length > 0 ? (
        <Table striped responsive className="mt-4">
          <thead style={{ color: "black" }}>
            <tr>
            <th>Sucursal</th>
              <th>Total Exento</th>
              <th>Total Base Imponible</th>
              <th>Total IVA</th>
              <th>Total</th>
              <th>Fecha de Cierre Z</th>
            </tr>
          </thead>
          <tbody style={{ color: "black" }}>
            {data.invoices.map((invoices, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: invoices.appliedWholesaleDiscount
                    ? "#D3FFDF"
                    : "",
                }}
              >
               <td>
                 {invoices.agencyName ? invoices.agencyName : ''}
                </td>
               <td>
                  <NumberFormat
                    value={invoices.exento ? invoices.exento.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "
                  />
                </td>
               <td>
                  <NumberFormat
                    value={invoices.baseImponible ? invoices.baseImponible.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                  <NumberFormat
                    value={invoices.iva ? invoices.iva.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                  <NumberFormat
                    value={invoices.total ? invoices.total.toFixed(2) : "0.00"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    prefix="Bs "

                  />
                </td>
                <td>
                <td>
                {invoices.date ? moment.utc(invoices.date).format("DD/MM/YYYY") : ""}
                </td>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div>No hay facturas.</div>
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
                <td>{data.agency ? data.agencyName : ""}</td>
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

  const exportExcel = ( ) => {

    //El mismo método, el ultimo parametro define si es para descarga
    if (showCompanyView) {
      // Vista por compañía
      dispatch(
        salesFiscalActions.dataInvoiceTotalsByCompany(
          getUserData(),
          1,
          perPageSelect === 0 ? perPage : perPageSelect, 
          direction,
          filters, 
          true
        )
      );
    } else {
      // Vista general por sucursal
      dispatch(
        invoiceActions.dataInvoiceTotalsByAgencyMonthly(
          getUserData(),
          1,
          perPageSelect === 0 ? perPage : perPageSelect,
          direction,
          filters,
          true
        )
      );

    }
   
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

  
    const exportToExcel = (data, filename = showCompanyView ?  'VentasPorempresa.xlsx' :'comprasPorempresa.xlsx') => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
  
      XLSX.utils.book_append_sheet(workbook, worksheet, showCompanyView ?  'Ventas Por Empresa' : 'Compras Por Empresa');
  
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
        item.exempt =
          item.exempt
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.taxableBase =
          item.taxableBase
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.iva =
          item.iva
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto

        item.totalAmount =
          item.totalAmount
            ?.toString()
            .replace(/\,/g, "") // se eliminan las comas
            .replace(".", ",") || 0; // se cambia la coma por punto
       
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
                {showCompanyView
                  ? "Ventas especiales por empresa"
                  : "Compras especiales por empresa"}
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
                    {/* {(user.role == 1 ||
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
                    )} */}
                    <FormGroup className="mr-3">
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
                      {isLoading && (
                        <span className="spinner-border spinner-border-sm mr-1"></span>
                      )}{" "}
                      Buscar
                    </Button>
                    <FormGroup className="ml-3">
                      <Button
                        color="primary"
                        onClick={() => {
                          setShowCompanyView(!showCompanyView);
                          setData([]);
                          clearFilters();
                        }}
                        disabled={isLoading}
                      >
                        {isLoading && (
                          <span className="spinner-border spinner-border-sm mr-1"></span>
                        )}{" "}
                        {showCompanyView ? "Volver a facturación especial" : "Ver ventas por empresa"}
                      </Button>                    
                    </FormGroup>
                    {/* <FormGroup className="mr-3">
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
                    </FormGroup> */}
                  </Form>
                </>
              )}
            </div>
            {/* Filtros */}
            <Row>
              <Col>
              {showCompanyView ? (
                  <DataTable
                    className="dataTables_wrapper"
                    responsive
                    highlightOnHover
                    expandableRows
                    expandableRowsComponent={<ExpandedComponentSales />}
                    expandableRowExpanded={(row) => expandAll}
                    sortIcon={
                      <i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>
                    }
                    title="Ventas por empresa"
                    progressPending={loadingPageSales}
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
                ) : (
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
                />
              )}
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
      {/* Componente para imprimir (está oculto) */}
      <div style={{ display: "none" }}>
        <ComponentToPrint data={dataToPrint} />
      </div>
    </>
  );
}

export default TicketsListFiscalPage;