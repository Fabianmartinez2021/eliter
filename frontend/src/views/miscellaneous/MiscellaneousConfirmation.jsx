/* eslint-disable */
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { miscellaneousActions, salesActions, userActions } from "../../actions";
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
  Badge,
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

function MiscellaneousToConfirmPage() {

  const dispatch = useDispatch();

  // Modo oscuro 
  const { darkMode } = useDarkMode();

  //usuario
  const user = useSelector((state) => state.authentication.user);
  const dataTable = useSelector((state) => state.miscellaneous.dataPending);
  console.log('dataTable', dataTable);
  const [comment, setComment] = useState("");
  const loadingPage = useSelector((state) => state.miscellaneous.loading);
  
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
    if (dataTable && dataTable.results) {
      setData(dataTable.results);
    }
    if (dataTable && dataTable.metadata && dataTable.metadata[0]) {
      setRowCount(dataTable.metadata[0].total);
    }
  }, [dataTable]);

  // Inicializar tabla sin data
  const [data, setData] = useState([]);


  const [rowCount, setRowCount] = useState(0);

  const columns = [
    {
      name: "Estado",
      selector: "confirmed",
      sortable: true,    
      cell: row => {
        let color = "danger";
        let text = "Pendiente";

        if (row.confirmed && !row.modified) {
          color = "success"; // verde
          text = "Confirmado";
        } else if (row.confirmed && row.modified) {
          color = "warning"; // naranja
          text = "Modificado";
        }

        return (
          <Badge color={color} pill className="h6 p-2 mt-1">
            {text}
          </Badge>
        );
      }
    },
   {
      name: 'Tipo',
      selector: 'typeIn',
      sortable: true,
      cell: row =>
        row.typeIn == '1'
          ? 'Por despacho'
          : row.typeIn == '3'
          ? 'Traslado de tienda'
          : 'Proveedor externo'
    },
    {
      name: "A cargo de",
      selector: row => row.userName,
      sortable: true,
    },
    {
      name: "Sucursal",
      selector: "agencyName",
      sortable: true,
      cell: (row) => `${row.agencyName}` 
    },
   
    {
      name: "Fecha de registro",
      selector: "createdDate",
      sortable: true,
      cell: (row) => moment(row.createdDate).utc().format("YYYY-MM-DD"),
    },
    {
      name: "",
      button: true,
      cell: (row) => {
         if (row.confirmed) return null; 
        const createdDate = moment(row.createdAt);
        const currentDate = moment();
        const daysSinceCreation = currentDate.diff(createdDate, 'days');

        const canEditOrAnulate =
          (user.role === 1 || user.role === 2  || user.role === 3) &&
          daysSinceCreation <= 40;

        return row.isAnulated ? (
          <span className="text-danger font-weight-bold"></span>
        ) : (
          canEditOrAnulate && (
            <div className="d-flex gap-2">           
                <Button
                  className="btn-link text-danger"
                  color="link"
                  size="sm"
                  onClick={() => handleApprove(row._id)}
                >
                  <i className="fas fa-thumbs-up"></i>
                </Button>
                <Button
                className="btn-link"
                color="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  history.push("/updated-miscellaneous-inventory/", { id: row._id });
                }}
              >
                <i className="fas fa-pencil-alt"></i>
              </Button>
            </div>
          )
        );
      },
    }
  ,
]


  const headers = [
    { label: "Fecha emitida", key: "createdDate" },
    { label: "A cargo de ", key: "userName" },
    { label: "Sucursal", key: "agencyName" },
  
  ];

  useEffect(() => {
      getDataTable(1);
    }, []);

  //obtener data de usuario necesaria
  const getUserData = () => {
    return {
      agency: user.agency.id,
      role: user.role,
      id: user.id,
    };
  };

 const handleApprove = (id) => {
  setInvoiceIdToAnulate(id);
  setModalMsg("¿Estás seguro que deseas aceptar estos suministros?");
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
      miscellaneousActions.dataPending(
        getUserData(),
        page,
        perPageSelect === 0 ? perPage : perPageSelect,
        direction,
        {}, false
      )
    );
  };

  //Paginar
  const handlePageChange = async (page) => {
    dispatch(
      miscellaneousActions.dataPending(
        getUserData(),
        page,
        perPageSelect == 0 ? perPage : perPageSelect,
        direction,
        filters ? filters : {},   false
      )
    );
  };

  //Ordenar
  const handleSort = (column, sortDirection) => {
		let sort = {"id": column.selector, "desc": (sortDirection == "asc" ? false : true) }
    
    setDirection(sort);
    dispatch(
      miscellaneousActions.dataPending(
        getUserData(),
        1,
        perPageSelect == 0 ? perPage : perPageSelect,
        sort,
        filters ? filters : {},
        false
      )
    );
  };

  //Cambiar cantidad de filas
  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPageSelect(newPerPage);
    dispatch(
      miscellaneousActions.dataPending(
        getUserData(),
        page,
        newPerPage,
        direction,
        filters ? filters : {},
        false
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

    dispatch(
      miscellaneousActions.dataPending(
        getUserData(),
        1,
        perPageSelect === 0 ? perPage : perPageSelect,
        direction,
        data, 
        false
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

 const ExpandedComponent = ({ data }) => {
  if (!data) {
    return <div>No hay datos para mostrar.</div>;
  }

  // Obtener los productos originales (de originalData o de products)
  const originalProducts = data.originalData && data.originalData.products 
    ? data.originalData.products 
    : data.products;

  // Obtener la última modificación (si existe)
  const lastModification = data.modifications && data.modifications.length > 0 
    ? data.modifications[data.modifications.length - 1].changes 
    : null;

  const _defaultAgencyWatch = watch('agency');

  useSyncFirstAgencyFormField(listAgencies, setValue, _defaultAgencyWatch);


  return (
    <>
      {/* Pedido Original */}
      <div className="ml-2 mt-4">
        <b>Pedido original</b>
      </div>
      
      {originalProducts && originalProducts.length > 0 ? (
        <Table striped responsive className="mt-2">
          <thead style={{ color: "black" }}>
            <tr>
              <th>Producto</th>
              <th>Peso Kg/Unidad</th>
            </tr>
          </thead>
          <tbody style={{ color: "black" }}>
            {originalProducts.map((product, index) => (
              <tr key={index}>
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
                    value={product.kg ? product.kg : "0.000"}
                    displayType={"text"}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    decimalScale={product.kg % 1 !== 0 ? 3 : 0}
                    fixedDecimalScale={product.kg % 1 !== 0}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div>No hay productos disponibles.</div>
      )}

      {/* Pedido Modificado - Solo mostrar si hay modificaciones */}
      {lastModification && lastModification.products && lastModification.products.length > 0 && (
        <>
          <div className="ml-2 mt-4">
            <b>Pedido modificado</b>
          </div>
          
          <Table striped responsive className="mt-2">
            <thead style={{ color: "black" }}>
              <tr>
                <th>Producto</th>
                <th>Peso Kg/Unidad</th>
                <th>Cambio</th>
              </tr>
            </thead>
            <tbody style={{ color: "black" }}>
              {lastModification.products.map((product, index) => {
                const originalProduct = originalProducts 
                  ? originalProducts.find(p => 
                      p.id === product.id || 
                      p.code === product.code ||
                      p.name === product.name
                    )
                  : null;
                
                const cambio = originalProduct 
                  ? (product.kg - originalProduct.kg)
                  : 'Nuevo';

                const cambioStyle = {
                  color: cambio === 'Nuevo' ? 'green' : cambio > 0 ? 'green' : 'black',
                  fontWeight: 'bold'
                };

                return (
                  <tr key={index}>
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
                        value={product.kg ? product.kg : "0.000"}
                        displayType={"text"}
                        thousandSeparator={","}
                        decimalSeparator={"."}
                        decimalScale={product.kg % 1 !== 0 ? 3 : 0}
                        fixedDecimalScale={product.kg % 1 !== 0}
                      />
                    </td>
                    <td style={cambioStyle}>
                      {cambio === 'Nuevo' ? (
                        'Nuevo'
                      ) : (
                        <>
                          {cambio > 0 ? '+' : ''}
                          {typeof NumberFormat !== 'undefined' ? (
                            <NumberFormat
                              value={cambio}
                              displayType={"text"}
                              thousandSeparator={","}
                              decimalSeparator={"."}
                              decimalScale={cambio % 1 !== 0 ? 3 : 0}
                              fixedDecimalScale={cambio % 1 !== 0}
                            />
                          ) : (
                            // Fallback si NumberFormat no existe
                            <span>
                              {Number(cambio).toFixed(cambio % 1 !== 0 ? 3 : 0)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* Nota y comentario modificados */}
          {(lastModification.comment) && (
            <div className="ml-2 mt-3">
              <b>Observaciones de modificación:</b>
              {lastModification.comment && (
                <p><b>Comentario:</b> {lastModification.comment}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Información de modificación */}
      {data.wasModified && (
        <div className="ml-2 mt-3">
          <small className="text-muted">
            Este pedido fue modificado el {data.modifiedDate ? new Date(data.modifiedDate).toLocaleString() : 'N/A'}
            {data.modifiedBy && ` por usuario ID: ${data.modifiedBy}`}
          </small>
        </div>
      )}
    </>
  );
};
//  const ExpandedComponent = ({ data }) => {

//   if (!data) {
//     return <div>No hay datos para mostrar.</div>;
//   }

//   return (
//     <>
//       {/* Productos */}
//       {data.products && data.products.length > 0 ? (
//         <>
//         <div className="ml-2 mt-4">
//           <b>Pedido original</b>
//         </div>
//         <div className="ml-2 mt-4">
//           <b>Productos</b>
//         </div>
//         <Table striped responsive className="mt-4">
//           <thead style={{ color: "black" }}>
//             <tr>
//               <th>Producto</th>
//               <th>Peso Kg/Unidad</th>
//             </tr>
//           </thead>
//           <tbody style={{ color: "black" }}>
//             {data.products.map((product, index) => (
//               <tr
//                 key={index}
//                 style={{
//                   backgroundColor: product.appliedWholesaleDiscount
//                     ? "#D3FFDF"
//                     : "",
//                 }}
//               >
//                 <td>
//                   {product.name ? (
//                     <>
//                       {product.name}{" "}
//                       {product.exempt ? "(E)" : product.taxed ? "(G)" : ""}
//                     </>
//                   ) : (
//                     "N/A"
//                   )}
//                 </td>
               
//                 <td>
//                   <NumberFormat
//                     value={product.kg ? product.kg.toFixed(3) : "0.000"}
//                     displayType={"text"}
//                     thousandSeparator={","}
//                     decimalSeparator={"."}
//                   />
//                 </td>
               
//                 {data.isWholesale && (
//                   <td>
//                     <NumberFormat
//                       value={
//                         product.wholesalePrice
//                           ? product.wholesalePrice.toFixed(2)
//                           : "0.00"
//                       }
//                       displayType={"text"}
//                       thousandSeparator={","}
//                       decimalSeparator={"."}
//                       prefix="$ "
//                     />
//                   </td>
//                 )}
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//         </>

//       ) : (
//         <div>No hay productos disponibles.</div>
//       )}

//       {/* Totales */}
//       {data.totals ? (
//         <>
//           <div className="ml-2 mt-4">
//             <b>Totales</b>
//           </div>
//           <Table striped responsive className="mt-4">
//             <thead style={{ color: "black" }}>
//               <tr>
//                 <th>Exento</th>
//                 <th>Base Imponible</th>
//                 <th>IVA</th>
//                 <th>Monto Total</th>
//               </tr>
//             </thead>
//             <tbody style={{ color: "black" }}>
//               <tr>
//                 <td>
//                   <NumberFormat
//                     value={
//                       data.totals.exempt
//                         ? parseFloat(data.totals.exempt).toFixed(2)
//                         : "0.00"
//                     }
//                     displayType={"text"}
//                     thousandSeparator={","}
//                     decimalSeparator={"."}
//                     prefix="Bs "
//                   />
//                 </td>
//                 <td>
//                   <NumberFormat
//                     value={
//                       data.totals.taxableBase
//                         ? parseFloat(data.totals.taxableBase).toFixed(2)
//                         : "0.00"
//                     }
//                     displayType={"text"}
//                     thousandSeparator={","}
//                     decimalSeparator={"."}
//                     prefix="Bs "
//                   />
//                 </td>
//                 <td>
//                   <NumberFormat
//                     value={
//                       data.totals.iva
//                         ? parseFloat(data.totals.iva).toFixed(2)
//                         : "0.00"
//                     }
//                     displayType={"text"}
//                     thousandSeparator={","}
//                     decimalSeparator={"."}
//                     prefix="Bs "
//                   />
//                 </td>
//                 <td>
//                   <NumberFormat
//                     value={
//                       data.totals.totalAmount
//                         ? parseFloat(data.totals.totalAmount).toFixed(2)
//                         : "0.00"
//                     }
//                     displayType={"text"}
//                     thousandSeparator={","}
//                     decimalSeparator={"."}
//                     prefix="Bs "
//                   />
//                 </td>
//               </tr>
//             </tbody>
//           </Table>
//           {data.isAnulated && data.anulationComment && (
//             <>
//               <div className="ml-2 mt-4">
//                 <b>Motivo de Anulación</b>
//               </div>
//               <Table striped responsive className="mt-4">
//                 <thead style={{ color: "black" }}>
//                   <tr>
//                     <th>Comentario</th>
//                   </tr>
//                 </thead>
//                 <tbody style={{ color: "black" }}>
//                   <tr>
//                     <td>{data.anulationComment}</td>
//                   </tr>
//                 </tbody>
//               </Table>
//             </>
//           )}
//           {!dataToPrint && (
//                   <div
//                     className="align-self-right"
//                     style={{
//                       fontWeight: "bold",
//                       fontStyle: "italic",
//                       textAlign: "right",
//                       marginRight: "50px",
//                       marginBottom:"50px",
//                     }}
//                   >
//                     <Button
//                       color="primary"
//                       disabled={loadingPage}
//                       onClick={() => {
//                         setDataToPrint(data);
//                       }}
//                     >
//                       <Icon icon={pdfIcon} /> Exportar
//                       {loadingPage && (
//                         <span className="spinner-border spinner-border-sm mr-1"></span>
//                       )}
//                     </Button>
//                   </div>
//                 )}
               
//         </>
//       ) : (
//         <div></div>
//       )}
//       {
//         data.comment && (        
//        <>
        
//         <Table striped responsive className="mt-4">
//           <thead style={{ color: "black" }}>
//             <tr>
//               <th>Comentario</th>
//             </tr>
//           </thead>
//           <tbody style={{ color: "black" }}>
//             <tr>
//               <td>{data.comment}</td>
//             </tr>
//           </tbody>
//         </Table>
//       </>)
//       }
//     </>
//   );
// };

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
  const exportExcel = () => {
    //El mismo método, el ultimo parametro define si es para descarga
    dispatch(
      miscellaneousActions.dataPending(
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


  const exportToExcel = (data, filename = 'historialdesuministros.xlsx') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial de suministros');

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
     
      fixedData.forEach((item) => {
      
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
        exportToExcel(dataFormatted);
        setDataExcel([]);
      }
    }, [dataExcel]);

  /*** Exportar ***/

  
   const conditionalRowStyles = [
  {
    when: row => row.confirmed === false,
    style: {
      backgroundColor: 'rgba(255, 0, 0, 0.1)', // rojo suave
    },
  },
  {
    when: row => row.confirmed === true,
    style: {
      backgroundColor: 'rgba(0, 128, 0, 0.1)', // verde suave
    },
  },

];

  const handleConfirm = () => {

    if (invoiceIdToAnulate) {
      dispatch(miscellaneousActions.accepteMiscellaneous(invoiceIdToAnulate, comment));
    }
    // getDataTable(1);
    
    
    setModalVisible(false);
    setModalMsg("");
    setInvoiceIdToAnulate(null);
    setComment("");

    setTimeout(() => {
      window.location.reload();
    }, 100);

  };

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
                  Historial de pedidos
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
            Aceptar Suministros
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
            onClick={handleConfirm}
            disabled={!comment}
          >
            Confirmar
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

export default MiscellaneousToConfirmPage;