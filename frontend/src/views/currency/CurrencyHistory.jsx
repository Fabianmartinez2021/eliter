
// /* eslint-disable */
// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { currencyActions } from '../../actions/currency.actions';
// import moment from 'moment';
// import DataTable from 'react-data-table-component';
// import { Button, Spinner, Row, Col, Modal, Form, FormGroup } from 'reactstrap';
// import { useForm } from "react-hook-form";
// import Datetime from 'react-datetime';
// import { isValidDate } from '../../helpers/date';
// import '../../assets/css/table.css';

// function CurrencyHistoryPage() {

//   useEffect(() => {
//     document.body.classList.add("landing-page");
//     document.body.classList.add("sidebar-collapse");
//     document.documentElement.classList.remove("nav-open");
//     return function cleanup() {
//       document.body.classList.remove("landing-page");
//       document.body.classList.remove("sidebar-collapse");
//     };
//   }, []);

//   const user = useSelector(state => state.authentication.user);
//   const dispatch = useDispatch();

//   const currencyHistory = useSelector(state => state.currency) || {};
  
//   const { data = [], loading, error, totalPages = 0, currentPage = 1 } = currencyHistory;

//   const columns = [

//     { name: 'Nombre', selector: 'title', sortable: true },
//     {
//       name: 'Valor',
//       selector: 'price',
//       sortable: true,
//       cell: row => <span>{row.price}</span>
//     },
//     {
//       name: 'Valor Anterior',
//       selector: 'price_old',
//       sortable: true,
//       cell: row => <span>{row.price_old}</span>
//     },
//     {
//       name: 'Fecha de actualizacion',
//       selector: 'created_at',
//       sortable: true,
//       cell: row => moment(row.created_at).format("YYYY-MM-DD hh:mm:ss a")
//     },
//   ];

//   const [filters, setFilters] = useState({ startDate: moment().format('YYYY-MM-DD'), endDate: moment().format('YYYY-MM-DD') });
//   const { handleSubmit, register, reset } = useForm();

//   const [page, setPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [perPageSelect, setPerPageSelect] = useState(0);

//   const [isOpen, setIsOpen] = useState(false);
//   const toggle = () => setIsOpen(!isOpen);

//   const CustomLoader = () => (<><div className="loading-table"></div></>);

//   useEffect(() => {
//     if (Object.keys(filters).length > 0) {  // Asegura que filters tenga datos
//       const filterParams = {
//         user,
//         pageIndex: page || 1,
//         pageSize: rowsPerPage || 10,
//         sortBy: 'created_at',
//         filters
//       };
  
//       console.log('Parámetros para el backend con filtros:', filterParams);
//       dispatch(currencyActions.fetchCurrencyHistory(filterParams));
//     }
//   }, [dispatch, page, rowsPerPage, filters, user]);
  
//   const handlePageChange = (newPage) => {
//     setPage(newPage);
//   };

//   const handleRowsPerPageChange = (newRowsPerPage) => {
//     setRowsPerPage(newRowsPerPage);
//     setPage(1); 
//   };

//   const clearFilters = () => {
//     reset({ startDate: '', endDate: '' });
//     setFilters({ startDate: moment().format('YYYY-MM-DD'), endDate: moment().format('YYYY-MM-DD') });
//   };

//   const handleFilterData = (data) => {
//     const startDate = moment(data.startDate);
//     const endDate = moment(data.endDate);
  
//     if (!startDate.isValid() || !endDate.isValid()) {
//       setModalWarning(true);
//       setModalMsg('Las fechas proporcionadas no son válidas.');
//       return;
//     }
  
//     if (startDate.isAfter(endDate)) {
//       setModalWarning(true);
//       setModalMsg('La fecha inicial no puede ser superior a la final');
//       return;
//     }
  
//     if (endDate.diff(startDate, 'days') > 60) {
//       setModalWarning(true);
//       setModalMsg('El rango de fechas no puede superar los 60 días');
//       return;
//     }
  
//     const updatedFilters = {
//       startDate: startDate.format('YYYY-MM-DD'),
//       endDate: endDate.format('YYYY-MM-DD'),
//     };
  
//     setFilters(updatedFilters);  // Asegura que filters se actualice con los datos nuevos
//   };

//   const [modalWarning, setModalWarning] = useState(false);
//   const [modalMsg, setModalMsg] = useState('');

//   useEffect(() => {
//     if (error) {
//       setModalWarning(true);
//       setModalMsg(`Error al cargar el historial de divisas: ${error.message}`);
//     }
//   }, [error]);

//   return (
//     <>
//       <div className="d-flex" id="wrapper">
//         <div id="page-content-wrapper">
//           <div className="flex-column flex-md-row p-3">
//             <div className="filter">
//               <div className="d-flex justify-content-between">
//                 <a href="#" onClick={e => { e.preventDefault(); toggle() }}>
//                   <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
//                 </a>
//                 {isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
//                   <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
//                 </a>}
//               </div>
//               {isOpen && <Form onSubmit={handleSubmit(handleFilterData)} className="form-inline" style={{ marginTop: 15 }}>
//                 <FormGroup className="mr-3">
//                   <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={(date) => setFilters({ ...filters, startDate: date.format('YYYY-MM-DD') })} value={filters.startDate}
//                     inputProps={{ name: 'startDate', ref: register, placeholder: "Fecha inicial", autoComplete: "off" }} isValidDate={isValidDate}
//                   />
//                 </FormGroup>
//                 <FormGroup className="mr-3">
//                   <Datetime timeFormat={false} dateFormat={'YYYY-MM-DD'} closeOnSelect onChange={(date) => setFilters({ ...filters, endDate: date.format('YYYY-MM-DD') })} value={filters.endDate}
//                     inputProps={{ name: 'endDate', ref: register, placeholder: "Fecha final", autoComplete: "off" }} isValidDate={isValidDate}
//                   />
//                 </FormGroup>
//                 <Button color="primary" type="submit" disabled={loading}>
//                   {loading && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
//                 </Button>
//               </Form>}
//             </div>

//             <Row>
//               <Col>
//                 <DataTable
//                   className="dataTables_wrapper"
//                   columns={columns}
//                   data={data}
//                   progressPending={loading}
//                   progressComponent={<CustomLoader />}
//                   pagination
//                   paginationServer
//                   paginationTotalRows={totalPages * rowsPerPage}
//                   onChangePage={handlePageChange}
//                   onChangeRowsPerPage={handleRowsPerPageChange}
//                   noDataComponent="No hay registros para mostrar"
//                   highlightOnHover
//                 />
//               </Col>
//             </Row>

//             {/* Modal de notificaciones */}
//             <Modal toggle={() => { setModalWarning(false); setModalMsg('') }} isOpen={modalWarning}>
//               <div className="modal-header">
//                 <h5 className="modal-title">Error</h5>
//                 <button
//                   aria-label="Close"
//                   className="close"
//                   type="button"
//                   onClick={() => { setModalWarning(false); setModalMsg('') }}
//                 >
//                   <span aria-hidden={true}>×</span>
//                 </button>
//               </div>
//               <div className="modal-body">
//                 <p>{modalMsg}</p>
//               </div>
//               <div className="modal-footer">
//                 <Button color="secondary" type="button" onClick={() => { setModalWarning(false); setModalMsg('') }}>
//                   Cerrar
//                 </Button>
//               </div>
//             </Modal>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default CurrencyHistoryPage;
