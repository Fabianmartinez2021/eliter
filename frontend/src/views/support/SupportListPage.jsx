/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
    Button, Badge, Row, Col, Modal, ModalBody, Alert,
    Input, Form, FormGroup, ListGroup, ListGroupItem, ListGroupItemHeading, ListGroupItemText
} from 'reactstrap';
import DataTable from 'react-data-table-component';
import Datetime from 'react-datetime';
import moment from 'moment';
import 'moment/locale/es';
import { useForm } from 'react-hook-form';
import { supportActions } from '../../actions/support.actions';
import { agencyActions } from '../../actions';
import { history } from '../../helpers';
import { isValidDate } from '../../helpers/date';
import { useDarkMode } from '../../helpers/darkModeContext';
import '../../assets/css/darkMode.css';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import '../../assets/css/filters.css';
import '../../assets/css/table.css';
import '../../assets/css/supportList.css';
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';

function SupportListPage() {
    const dispatch = useDispatch();
    const location = useLocation();
    const { darkMode } = useDarkMode();
    const { tickets, loading } = useSelector(state => state.support || { tickets: [] });
    const agencies = useSelector(state => state.agencies || {});
    const user = useSelector(state => state.authentication?.user);
    const canDelete = user?.role !== 3;
    const [deleteModal, setDeleteModal] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [batchDeleteModal, setBatchDeleteModal] = useState(false);
    const [deletingBatch, setDeletingBatch] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    // Estados temporales para los inputs (no se aplican hasta presionar buscar)
    const [tempStartDate, setTempStartDate] = useState('');
    const [tempEndDate, setTempEndDate] = useState('');
    const [tempFilterPriority, setTempFilterPriority] = useState('');
    const [tempFilterUserId, setTempFilterUserId] = useState('');
    const [tempFilterAgency, setTempFilterAgency] = useState('');
    const [tempFilterStatus, setTempFilterStatus] = useState('');
    // Estados para los filtros aplicados (se usan en filteredData)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterUserId, setFilterUserId] = useState('');
    const [filterAgency, setFilterAgency] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const { handleSubmit, register, reset, setValue, watch } = useForm();
    const toggle = () => setIsOpen(!isOpen);

    const ExpandedComponent = ({ data }) => (
        <ListGroup>
            <ListGroupItem>
                <ListGroupItemHeading>Descripción</ListGroupItemHeading>
                <ListGroupItemText>{data.description || 'Sin descripción'}</ListGroupItemText>
            </ListGroupItem>
        </ListGroup>
    );

    useEffect(() => {
        dispatch(supportActions.getAll());
    }, [dispatch]);

    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    }, [dispatch]);

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            const t = setTimeout(() => {
                setSuccessMessage(null);
                history.replace('/support-list', {});
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [location.state?.successMessage]);

    const handleDeleteClick = (t) => {
        setTicketToDelete(t);
        setDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (ticketToDelete?._id) {
            dispatch(supportActions.deleteTicket(ticketToDelete._id))
                .then(() => {
                    setDeleteModal(false);
                    setTicketToDelete(null);
                })
                .catch(() => {});
        }
    };

    const handleCancelDelete = () => {
        setDeleteModal(false);
        setTicketToDelete(null);
    };

    const handleBatchDeleteClick = () => {
        if (selectedRows?.length > 0) setBatchDeleteModal(true);
    };

    const handleConfirmBatchDelete = () => {
        const ids = selectedRows.map(r => r._id).filter(Boolean);
        if (ids.length === 0) return;
        setDeletingBatch(true);
        dispatch(supportActions.deleteBatch(ids))
            .then(() => {
                setBatchDeleteModal(false);
                setSelectedRows([]);
                setDeletingBatch(false);
            })
            .catch(() => setDeletingBatch(false));
    };

    const handleCancelBatchDelete = () => {
        setBatchDeleteModal(false);
    };

    const paginationOptions = {
        rowsPerPageText: 'Filas por página',
        rangeSeparatorText: 'de',
        selectAllRowsItem: true,
        selectAllRowsItemText: 'Todos'
    };

    const CustomLoader = () => (<div className="loading-table"></div>);

    const sortedTickets = useMemo(() => {
        if (!tickets || !Array.isArray(tickets)) return [];
        return [...tickets].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    }, [tickets]);

    const uniqueUsers = useMemo(() => {
        if (!sortedTickets) return [];
        const seen = new Set();
        return sortedTickets
            .filter(t => t.user && (t.user.id || t.user._id))
            .filter(t => {
                const id = t.user.id || t.user._id;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            })
            .map(t => ({ id: t.user.id || t.user._id, name: `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || 'Sin nombre' }));
    }, [sortedTickets]);

    const filteredData = useMemo(() => {
        let result = sortedTickets;

        if (filterPriority) {
            result = result.filter(t => (t.priority || 'Baja') === filterPriority);
        }

        if (filterUserId) {
            result = result.filter(t => {
                const uid = t.user?.id || t.user?._id;
                return uid && String(uid) === String(filterUserId);
            });
        }

        if (startDate) {
            const start = moment(startDate).startOf('day');
            result = result.filter(t => t.createdDate && moment(t.createdDate).isSameOrAfter(start));
        }

        if (endDate) {
            const end = moment(endDate).endOf('day');
            result = result.filter(t => t.createdDate && moment(t.createdDate).isSameOrBefore(end));
        }

        if (filterAgency) {
            result = result.filter(t => {
                if (t.broadcastToAllManagers) return filterAgency === 'all';
                const userAgencyId = t.user?.agency?.id || t.user?.agency?._id;
                const targetAgencyId = t.targetAgency?.id || t.targetAgency?._id;
                return (userAgencyId && String(userAgencyId) === String(filterAgency)) ||
                    (targetAgencyId && String(targetAgencyId) === String(filterAgency));
            });
        }

        if (filterStatus) {
            result = result.filter(t => {
                const s = (t.status || 'Abierto').toLowerCase();
                if (filterStatus === 'Cerrado') return s.includes('cerrado');
                if (filterStatus === 'En Proceso') return s.includes('proceso');
                if (filterStatus === 'Abierto') return !s.includes('cerrado') && !s.includes('proceso');
                return true;
            });
        }

        return result;
    }, [sortedTickets, filterPriority, filterUserId, filterAgency, filterStatus, startDate, endDate]);

    useEffect(() => {
        setResetPaginationToggle(prev => !prev);
    }, [filterPriority, filterUserId, filterAgency, filterStatus, startDate, endDate]);

    const onFilterData = (data) => {
        // Usar los valores temporales que el usuario ha ingresado
        const startDateValue = tempStartDate || data.startDate || '';
        const endDateValue = tempEndDate || data.endDate || '';
        const priorityValue = tempFilterPriority || data.priority || '';
        const userIdValue = tempFilterUserId || data.userId || '';
        const agencyValue = tempFilterAgency || data.agency || '';
        const statusValue = tempFilterStatus || data.status || '';

        // Validar fechas
        if (startDateValue && !moment(startDateValue).isValid()) {
            return;
        }
        if (endDateValue && !moment(endDateValue).isValid()) {
            return;
        }
        // Verificar que la fecha final sea superior o igual a la inicial
        if (startDateValue && endDateValue && moment(startDateValue).isAfter(endDateValue)) {
            return;
        }
        // Aplicar los filtros
        setStartDate(startDateValue);
        setEndDate(endDateValue);
        setFilterPriority(priorityValue);
        setFilterUserId(userIdValue);
        setFilterAgency(agencyValue);
        setFilterStatus(statusValue);
        setResetPaginationToggle(prev => !prev);
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setFilterPriority('');
        setFilterUserId('');
        setFilterAgency('');
        setFilterStatus('');
        setTempStartDate('');
        setTempEndDate('');
        setTempFilterPriority('');
        setTempFilterUserId('');
        setTempFilterAgency('');
        setTempFilterStatus('');
        reset({ startDate: '', endDate: '', priority: '', userId: '', agency: '', status: '' });
        setResetPaginationToggle(prev => !prev);
    };

    const listAgencies = useMemo(() => {
        if (agencies.list && Array.isArray(agencies.list)) return agencies.list;
        if (agencies.data && Array.isArray(agencies.data)) return agencies.data;
        if (agencies.data?.results && Array.isArray(agencies.data.results)) return agencies.data.results;
        return [];
    }, [agencies]);

    const agencyFilterWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyFilterWatch);

    const columns = [
        {
            name: 'ID',
            selector: 'supportNumber',
            sortable: true,
            width: '80px',
            cell: (row, i) => `#${row.supportNumber || String(i + 1)}`
        },
        {
            name: 'Asunto',
            selector: 'affair',
            sortable: true,
            wrap: true,
            cell: (row) => row.affair || '-'
        },
        {
            name: 'Solicitante',
            sortable: true,
            wrap: true,
            cell: (row) => row.user ? `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim() || 'Sin nombre' : 'Usuario No Identificado'
        },
        {
            name: 'Sucursal',
            sortable: true,
            wrap: true,
            cell: (row) => row.broadcastToAllManagers ? 'Todas (difusión)' : (row.targetAgency?.name || row.user?.agency?.name || 'Sede Central')
        },
        {
            name: 'Prioridad',
            selector: 'priority',
            sortable: true,
            width: '120px',
            center: true,
            cell: (row) => {
                const p = (row.priority || 'Baja').toLowerCase();
                const cls = p === 'alta' ? 'alta' : p === 'media' ? 'media' : 'baja';
                return <span className={`badge-priority ${cls}`}>{row.priority || 'Baja'}</span>;
            }
        },
        {
            name: 'Estado',
            selector: 'status',
            sortable: true,
            width: '140px',
            center: true,
            cell: (row) => {
                const s = (row.status || 'Abierto').toLowerCase();
                const cls = s.includes('cerrado') ? 'cerrado' : s.includes('proceso') ? 'en-proceso' : 'abierto';
                const label = s.includes('cerrado') ? 'Cerrado' : s.includes('proceso') ? 'En Proceso' : 'Abierto';
                return <span className={`badge-status ${cls}`}>{label}</span>;
            }
        },
        {
            name: 'Fecha',
            selector: 'createdDate',
            sortable: true,
            width: '140px',
            cell: (row) => row.createdDate ? new Date(row.createdDate).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'
        },
        {
            name: '',
            button: true,
            width: '100px',
            cell: (row) => (
                <div className="d-flex align-items-center justify-content-center">
                    <button
                        type="button"
                        className="btn-support-action view"
                        onClick={e => { e.preventDefault(); history.push(`/support-detail/${row._id}`); }}
                        title="Ver conversación"
                    >
                        <i className="fa fa-comment"></i>
                    </button>
                    {canDelete && (
                        <button
                            type="button"
                            className="btn-support-action delete"
                            onClick={e => { e.preventDefault(); handleDeleteClick(row); }}
                            title="Eliminar"
                        >
                            <i className="fa fa-trash-alt"></i>
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className={`d-flex support-history-page ${darkMode ? 'dark-mode' : ''}`} id="wrapper">
            <SideBar />
            <div id="page-content-wrapper">
                <AdminNavbar />
                <div className="flex-column flex-md-row p-3">
                    {successMessage && (
                        <Alert color="success" className="rounded-pill mb-2 mx-2 mx-md-4 mt-3">
                            <i className="fa fa-check-circle mr-2"></i> {successMessage}
                        </Alert>
                    )}

                    <div className={`support-history-header ${darkMode ? 'dark-mode' : ''}`}>
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center" style={{ width: '100%', gap: '0.5rem' }}>
                            <h3 className="support-history-title-h3 mb-0">Historial de Soporte</h3>
                            <div className="d-flex align-items-center flex-wrap" style={{ gap: '0.5rem' }}>
                                {canDelete && selectedRows?.length > 0 && (
                                    <Button color="danger" outline size="sm" onClick={handleBatchDeleteClick}>
                                        <i className="fa fa-trash-alt mr-1"></i>
                                        Eliminar seleccionados ({selectedRows.length})
                                    </Button>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row' }}>
                                    <Button onClick={() => history.push('/support-create')} className="btn-round btn-icon" color="primary">
                                        <i className="fa fa-plus"></i>
                                    </Button>
                                    <span style={{ fontWeight: 'bold', marginRight: 8 }}>
                                        Nuevo Ticket
                                    </span>
                                    
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="filter">
                        <div className="d-flex justify-content-between">
                            <a href="#" onClick={e => { e.preventDefault(); toggle(); }}>
                                <i className="fa fa-search" aria-hidden="true"></i> Búsqueda avanzada
                            </a>
                            {isOpen && <a href="#" onClick={e => { e.preventDefault(); clearFilters(); }}>
                                <i className="fa fa-times" aria-hidden="true"></i> Borrar filtros
                            </a>
                            }
                        </div>
                        {isOpen && <>
                            <Form onSubmit={handleSubmit(onFilterData)} className="form-inline" style={{ marginTop: 15 }}>
                                <Col>
                                    <Row>
                                        <FormGroup className="mr-3">
                                            <Input
                                                type="select"
                                                name="priority"
                                                innerRef={register()}
                                                onChange={e => setTempFilterPriority(e.target.value)}
                                                value={tempFilterPriority}
                                                className="form-control"
                                            >
                                                <option value="">Todas las prioridades</option>
                                                <option value="Baja">Baja</option>
                                                <option value="Media">Media</option>
                                                <option value="Alta">Alta</option>
                                            </Input>
                                        </FormGroup>
                                        <FormGroup className="mr-3">
                                            <Input type="select" name="userId" innerRef={register()} onChange={e => setTempFilterUserId(e.target.value)} value={tempFilterUserId} className="form-control">
                                                <option value="">Todos los usuarios</option>
                                                {uniqueUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                        <FormGroup className="mr-3">
                                            <Input type="select" name="agency" innerRef={register()} onChange={e => setTempFilterAgency(e.target.value)} value={tempFilterAgency} className="form-control">
                                                <option value="">Todas las sucursales</option>
                                                <option value="all">Todas (difusión)</option>
                                                {listAgencies.map(a => (
                                                    <option key={a.id || a._id} value={a.id || a._id}>{a.name}</option>
                                                ))}
                                            </Input>
                                        </FormGroup>
                                        <FormGroup className="mr-3">
                                            <Input type="select" name="status" innerRef={register()} onChange={e => setTempFilterStatus(e.target.value)} value={tempFilterStatus} className="form-control">
                                                <option value="">Todos los estados</option>
                                                <option value="Abierto">Abierto</option>
                                                <option value="En Proceso">En Proceso</option>
                                                <option value="Cerrado">Cerrado</option>
                                            </Input>
                                        </FormGroup>
                                    </Row>
                                    <Row>
                                        <FormGroup className="mr-3">
                                            <Datetime
                                                timeFormat={false}
                                                dateFormat="YYYY-MM-DD"
                                                closeOnSelect
                                                onChange={(val) => setTempStartDate(val ? moment(val).format('YYYY-MM-DD') : '')}
                                                value={tempStartDate}
                                                isValidDate={isValidDate}
                                                inputProps={{
                                                    name: "startDate",
                                                    ref: register,
                                                    placeholder: "Fecha inicial",
                                                    autoComplete: "off",
                                                }}
                                            />
                                        </FormGroup>
                                        <FormGroup className="mr-3">
                                            <Datetime
                                                timeFormat={false}
                                                dateFormat="YYYY-MM-DD"
                                                closeOnSelect
                                                onChange={(val) => setTempEndDate(val ? moment(val).format('YYYY-MM-DD') : '')}
                                                value={tempEndDate}
                                                isValidDate={isValidDate}
                                                inputProps={{
                                                    name: "endDate",
                                                    ref: register,
                                                    placeholder: "Fecha final",
                                                    autoComplete: "off",
                                                }}
                                            />
                                        </FormGroup>
                                        <FormGroup className="mr-3">
                                            <Button color="primary" type="submit" disabled={loading}>
                                                {loading && <span className="spinner-border spinner-border-sm mr-1"></span>} Buscar
                                            </Button>
                                        </FormGroup>
                                    </Row>
                                </Col>
                            </Form>
                        </>
                        }
                    </div>

                    <Row>
                        <Col>
                            <DataTable
                                keyField="_id"
                                className="dataTables_wrapper"
                                responsive
                                highlightOnHover
                                expandableRows
                                expandableRowsComponent={<ExpandedComponent />}
                                sortIcon={<i className="fa fa-arrow-down ml-2" aria-hidden="true"></i>}
                                progressPending={loading}
                                paginationComponentOptions={paginationOptions}
                                progressComponent={<CustomLoader />}
                                noDataComponent="No hay tickets registrados en el sistema."
                                noHeader={true}
                                columns={columns}
                                data={filteredData}
                                pagination
                                paginationDefaultPage={1}
                                paginationPerPage={10}
                                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                                paginationResetDefaultPage={resetPaginationToggle}
                                persistTableHead
                                theme={darkMode ? "dark" : "default"}
                                selectableRows={canDelete}
                                onSelectedRowsChange={({ selectedRows: rows }) => setSelectedRows(rows)}
                            />
                        </Col>
                    </Row>
                </div>
            </div>

            <Modal isOpen={deleteModal} toggle={handleCancelDelete} centered>
                <ModalBody className="text-center p-4">
                    <div className="mb-4">
                        <i className="fa fa-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h5 className="font-weight-bold mb-2">¿Eliminar ticket?</h5>
                    {ticketToDelete && (
                        <p className="text-muted small mb-4">#{ticketToDelete.supportNumber || ticketToDelete._id?.slice(-6)} - {ticketToDelete.affair}</p>
                    )}
                    <p className="text-muted small mb-4">Esta acción no se puede deshacer.</p>
                    <div className="d-flex justify-content-center" style={{ gap: '0.75rem' }}>
                        <Button
                            color="secondary"
                            outline
                            onClick={handleCancelDelete}
                            className="support-modal-btn-cancel"
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="danger"
                            onClick={handleConfirmDelete}
                            className="support-modal-btn-delete"
                        >
                            Eliminar
                        </Button>
                    </div>
                </ModalBody>
            </Modal>

            <Modal isOpen={batchDeleteModal} toggle={handleCancelBatchDelete} centered>
                <ModalBody className="text-center p-4">
                    <div className="mb-4">
                        <i className="fa fa-exclamation-triangle text-danger" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <h5 className="font-weight-bold mb-2">¿Eliminar {selectedRows?.length || 0} ticket(s) seleccionado(s)?</h5>
                    <p className="text-muted small mb-4">Esta acción no se puede deshacer.</p>
                    <div className="d-flex justify-content-center" style={{ gap: '0.75rem' }}>
                        <Button
                            color="secondary"
                            outline
                            onClick={handleCancelBatchDelete}
                            disabled={deletingBatch}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="danger"
                            onClick={handleConfirmBatchDelete}
                            disabled={deletingBatch}
                        >
                            {deletingBatch ? <><i className="fa fa-spinner fa-spin mr-1"></i> Eliminando...</> : 'Eliminar todos'}
                        </Button>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
}

export default SupportListPage;
