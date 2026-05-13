/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { userActions } from '../../actions';
import moment from 'moment';
import Datetime from 'react-datetime';
import 'moment/locale/es';
import AdminNavbar from '../../components/Navbars/AdminNavbar';
import SideBar from '../../components/SideBar/SideBar';
import DataTable from 'react-data-table-component';
import { Row, Col, Form, FormGroup, Button } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { getCouponHistory } from '../../services/promoCoupon.service';
import { useDarkMode } from '../../helpers/darkModeContext';
import { isValidDate } from '../../helpers/date';
import NumberFormat from 'react-number-format';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Icon } from '@iconify/react';
import fileDownload from '@iconify/icons-fa-solid/file-download';
import '../../assets/css/table.css';
import '../../assets/css/darkMode.css';
import '../../assets/css/filters.css';
import '../../assets/css/options.css';

function CouponHistoryPage() {
  const dispatch = useDispatch();
  const { darkMode } = useDarkMode();
  const location = useLocation();
  const user = useSelector((state) => state.authentication.user);
  const users = useSelector((state) => state.users);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [listAgencies, setListAgencies] = useState(null);
  const [clientFilters, setClientFilters] = useState({ agencyName: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { register, handleSubmit, reset, setValue } = useForm();
  const toggle = () => setIsOpen(!isOpen);

  const getUserData = () => ({ agency: user?.agency?.id, role: user?.role, id: user?.id });

  useEffect(() => {
    if (user?.agency?.id) dispatch(userActions.getListUserAgencies(getUserData()));
  }, [user?.agency?.id]);

  useEffect(() => {
    if (users.obtained && users.list?.agencies) setListAgencies(users.list.agencies);
  }, [users.obtained, users.list]);

  const handleChangeStartDate = (mom) => {
    const str = moment(mom).format('YYYY-MM-DD');
    setStartDate(str);
    setValue('dateFrom', str);
  };
  const handleChangeEndDate = (mom) => {
    const str = moment(mom).format('YYYY-MM-DD');
    setEndDate(str);
    setValue('dateTo', str);
  };

  const dateParam = (() => {
    const params = new URLSearchParams(location.search);
    const d = params.get('date');
    return d && moment(d, 'YYYY-MM-DD', true).isValid() ? d : null;
  })();

  useEffect(() => {
    document.body.classList.add('landing-page');
    document.body.classList.add('sidebar-collapse');
    document.documentElement.classList.remove('nav-open');
    return () => {
      document.body.classList.remove('landing-page');
      document.body.classList.remove('sidebar-collapse');
    };
  }, []);

  const fetchList = (params) => {
    setLoading(true);
    setError(null);
    getCouponHistory(params || (dateParam ? { date: dateParam } : {}))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err?.message || 'Error al cargar historial de cupones');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCouponHistory(dateParam ? { date: dateParam } : {})
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch((err) => {
        setError(err?.message || 'Error al cargar historial de cupones');
        setList([]);
      })
      .finally(() => setLoading(false));
  }, [dateParam]);

  const onFilterSubmit = (values) => {
    const dateFrom = values.dateFrom && moment(values.dateFrom, 'YYYY-MM-DD', true).isValid() ? values.dateFrom : null;
    const dateTo = values.dateTo && moment(values.dateTo, 'YYYY-MM-DD', true).isValid() ? values.dateTo : null;
    setClientFilters({ agencyName: (values.filterAgencyName || '').trim() });
    if (dateFrom && dateTo) {
      fetchList({ dateFrom, dateTo });
    } else {
      fetchList(dateParam ? { date: dateParam } : {});
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    reset();
    setClientFilters({ agencyName: '' });
    fetchList(dateParam ? { date: dateParam } : {});
  };

  // Filtro solo por sucursal (sede)
  const filteredList = useMemo(() => {
    if (!clientFilters.agencyName) return list;
    const agencyFilter = clientFilters.agencyName.trim().toLowerCase();
    return list.filter((row) => {
      const agency = (row.agencyName || '').toString().trim().toLowerCase();
      return agency.includes(agencyFilter);
    });
  }, [list, clientFilters]);

  const NoRecordsMessage = () => (
    <div className="py-5 text-center text-muted">
      No hay registros para mostrar.
    </div>
  );

  const CustomLoader = () => (<><div className="loading-table"></div></>);

  // Formato numérico para Excel: miles con punto, decimales con coma (como en otras exportaciones)
  const formatNumberForExcel = (value) => {
    if (value == null || value === '') return '—';
    const num = Number(value);
    if (isNaN(num)) return '—';
    return num
      .toFixed(2)
      .replace(/\,/g, '')
      .replace('.', ',');
  };

  const exportToExcel = () => {
    const rows = filteredList.map((row) => ({
      'Código cupón': row.code || row.couponCode || '—',
      'Fecha uso': row.usedAt ? moment(row.usedAt).utc().format('DD/MM/YYYY HH:mm') : '—',
      'Registrado por': row.registeredBy ?? '—',
      'Sede': row.agencyName ?? '—',
      'N° venta': row.orderNumber ?? '—',
      'Nombre cliente': row.clientName ?? '—',
      'Teléfono': row.clientPhone ?? '—',
      'Monto descuento': formatNumberForExcel(row.discountAmount),
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial cupones');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Historial-cupones-${moment().format('YYYY-MM-DD')}.xlsx`);
  };

  const columns = [
    {
      name: 'Código cupón',
      selector: (row) => row.code || row.couponCode || '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Fecha uso',
      selector: (row) => row.usedAt,
      sortable: true,
      cell: (row) =>
        row.usedAt
          ? moment(row.usedAt).utc().format('DD/MM/YYYY HH:mm')
          : '—',
    },
    {
      name: 'Registrado por',
      selector: (row) => row.registeredBy ?? '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Sede',
      selector: (row) => row.agencyName ?? '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'N° venta',
      selector: (row) => row.orderNumber ?? '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Nombre cliente',
      selector: (row) =>
        row.clientName ?? row.client?.names ?? row.sale?.names ?? '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Teléfono',
      selector: (row) =>
        row.clientPhone ?? row.client?.phone ?? row.sale?.phone ?? '—',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Monto descuento',
      selector: (row) => row.discountAmount,
      sortable: true,
      cell: (row) =>
        row.discountAmount != null ? (
          <NumberFormat value={Number(row.discountAmount).toFixed(2)} displayType="text" thousandSeparator="," decimalSeparator="." prefix="Bs " />
        ) : '—',
    },
  ];

  return (
    <>
      <div className={`d-flex ${darkMode ? 'dark-mode' : ''}`} id="wrapper">
        <SideBar />
        <div id="page-content-wrapper">
          <AdminNavbar />
          <div className="container-fluid">
            <div className="flex-column flex-md-row p-3">
              <div className="d-flex justify-content-between" style={{ padding: '4px 16px 4px 24px' }}>
                <div className="align-self-center">
                  <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Historial de cupones</h3>
                  <p className="text-muted small mb-0 mt-1">
                    Cupones utilizados con datos del cliente (nombre, teléfono).
                    {dateParam && !clientFilters.agencyName && (
                      <span className="ml-2">Mostrando cupones del día {moment(dateParam).format('DD/MM/YYYY')}.</span>
                    )}
                  </p>
                </div>
              </div>
              {/* Filtros */}
              <div className="filter">
                <div className="d-flex justify-content-between">
                  <a href="#" onClick={(e) => { e.preventDefault(); toggle(); }}>
                    <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
                  </a>
                  {isOpen && (
                    <a href="#" onClick={(e) => { e.preventDefault(); clearFilters(); }}>
                      <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
                    </a>
                  )}
                </div>
                {isOpen && (
                  <>
                    <Form onSubmit={handleSubmit(onFilterSubmit)} className="form-inline" style={{ marginTop: 15 }}>
                      <FormGroup className="mr-3">
                        <select className="form-control" name="filterAgencyName" ref={register}>
                          <option value="">Seleccione sede</option>
                          {listAgencies && listAgencies.map((ag) => (
                            <option key={ag.id} value={ag.name}>{ag.name}</option>
                          ))}
                        </select>
                      </FormGroup>
                      <FormGroup className="mr-3">
                        <Datetime
                          timeFormat={false}
                          dateFormat="YYYY-MM-DD"
                          closeOnSelect
                          onChange={handleChangeStartDate}
                          value={startDate}
                          inputProps={{
                            name: 'dateFrom',
                            ref: register,
                            placeholder: 'Fecha inicial',
                            autoComplete: 'off',
                          }}
                          isValidDate={isValidDate}
                        />
                      </FormGroup>
                      <FormGroup className="mr-3">
                        <Datetime
                          timeFormat={false}
                          dateFormat="YYYY-MM-DD"
                          closeOnSelect
                          onChange={handleChangeEndDate}
                          value={endDate}
                          inputProps={{
                            name: 'dateTo',
                            ref: register,
                            placeholder: 'Fecha final',
                            autoComplete: 'off',
                          }}
                          isValidDate={isValidDate}
                        />
                      </FormGroup>
                      <Button color="primary" type="submit" disabled={loading}>
                        {loading && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
                      </Button>
                    </Form>
                  </>
                )}
              </div>
              {error && (
                <div className="alert alert-warning">
                  {error}
                </div>
              )}
              <Row>
                <Col>
                  <DataTable
                    className="dataTables_wrapper"
                    columns={columns}
                    data={filteredList}
                    pagination
                    paginationPerPage={10}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    paginationComponentOptions={{
                      selectAllRowsItem: true,
                      selectAllRowsItemText: 'TODOS',
                    }}
                    noDataComponent={<NoRecordsMessage />}
                    striped
                    responsive
                    highlightOnHover
                    sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
                    progressPending={loading}
                    progressComponent={<CustomLoader />}
                    className={darkMode ? 'dark-mode' : ''}
                  />
                  {filteredList && filteredList.length > 0 && !loading && (
                    <div className="pull-left mt-2">
                      <Button
                        className="btn"
                        color="primary"
                        onClick={(e) => { e.preventDefault(); exportToExcel(); }}
                        disabled={loading}
                      >
                        <Icon icon={fileDownload} /> Exportar
                      </Button>
                    </div>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CouponHistoryPage;
