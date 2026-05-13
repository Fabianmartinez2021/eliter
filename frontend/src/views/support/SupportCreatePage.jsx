/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button, FormGroup, Label, Card,
    CardBody, Input, Spinner
} from 'reactstrap';
import { supportActions } from '../../actions/support.actions';
import { agencyActions } from '../../actions';
import { history } from '../../helpers';
import { useDarkMode } from '../../helpers/darkModeContext';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";

const PRIORITY_CONFIG = {
    Baja: {
        color: '#3498db',
        bg: 'rgba(52, 152, 219, 0.08)',
        icon: 'fa-info-circle',
        label: 'Consulta general',
        desc: 'Preguntas o dudas sin urgencia'
    },
    Media: {
        color: '#e67e22',
        bg: 'rgba(230, 126, 34, 0.08)',
        icon: 'fa-exclamation-circle',
        label: 'Error funcional',
        desc: 'Algo no funciona correctamente'
    },
    Alta: {
        color: '#e74c3c',
        bg: 'rgba(231, 76, 60, 0.08)',
        icon: 'fa-times-circle',
        label: 'Bloqueo crítico',
        desc: 'Impide realizar tu trabajo'
    }
};

const styles = `
    .support-create-page {
        background: #fff;
        min-height: 100vh;
    }
    .support-create-page.dark-mode {
        background: #121212;
    }
    .support-create-header-bar {
        padding: 4px 16px 4px 24px;
        margin: 0.5rem 1.5rem 0 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
        border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    .support-create-page.dark-mode .support-create-header-bar {
        border-bottom-color: rgba(255,255,255,0.08);
    }
    .support-create-title {
        font-weight: bold;
        font-style: italic;
        margin: 0;
        color: #1e293b;
        font-size: 1.25rem;
    }
    .support-create-page.dark-mode .support-create-title {
        color: #f1f5f9;
    }
    .support-create-card {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        overflow: hidden;
        margin: 0 1.5rem 1.5rem;
        max-width: 640px;
    }
    @media (max-width: 575px) {
        .support-create-header-bar {
            padding: 4px 12px 4px 12px;
            margin: 0.5rem 0.5rem 0 0;
        }
        .support-create-card {
            margin: 0 0.75rem 1rem;
        }
        .support-create-card .card-body {
            padding: 1rem 1rem;
        }
        .support-create-title {
            font-size: 1.1rem;
        }
        .priority-option {
            padding: 0.5rem 0.75rem;
        }
    }
    .support-create-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .support-create-page.dark-mode .support-create-card {
        border-color: rgba(255,255,255,0.08);
        background: #1e1e1e;
    }
    .support-create-header {
        background: linear-gradient(135deg, #c0392b 0%, #e74c3c 50%, #e67e22 100%);
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .support-create-header-icon {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .support-create-header-icon i {
        font-size: 1.1rem;
        color: #fff;
    }
    .support-create-header-text h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #fff;
    }
    .support-create-header-text p {
        margin: 0.15rem 0 0 0;
        font-size: 0.8rem;
        color: rgba(255,255,255,0.9);
    }
    .support-create-card .card-body {
        padding: 1.25rem 1.5rem;
    }
    .support-create-input {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }
    .support-create-input:focus {
        border-color: #e74c3c;
        box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15);
        outline: none;
    }
    .support-create-input::placeholder {
        color: #94a3b8;
    }
    .support-create-textarea {
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        font-size: 0.9rem;
        min-height: 100px;
        resize: vertical;
        transition: all 0.2s ease;
    }
    .support-create-textarea:focus {
        border-color: #e74c3c;
        box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.15);
        outline: none;
    }
    .support-create-textarea::placeholder {
        color: #94a3b8;
    }
    .support-create-card .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
    }
    .support-create-page.dark-mode .support-create-card .form-group label {
        color: #94a3b8;
    }
    .priority-option {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.65rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #fff;
    }
    .support-create-page.dark-mode .priority-option {
        background: #2a2a2a;
        border-color: rgba(255,255,255,0.1);
    }
    .priority-option:hover {
        border-color: #cbd5e1;
    }
    .priority-option.active {
        border-color: transparent;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .btn-submit-support {
        background: #e74c3c !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 0.5rem 1.25rem !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        transition: all 0.2s ease !important;
    }
    .btn-submit-support:hover:not(:disabled) {
        background: #c0392b !important;
    }
    .btn-submit-support:disabled {
        opacity: 0.85;
    }
    .support-create-btn-secondary {
        border-radius: 8px !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        border-color: #cbd5e1 !important;
        color: #64748b !important;
        transition: all 0.2s ease !important;
    }
    .support-create-btn-secondary:hover:not(:disabled) {
        border-color: #94a3b8 !important;
        color: #334155 !important;
        background: rgba(148, 163, 184, 0.08) !important;
    }
    .support-create-page.dark-mode .support-create-btn-secondary {
        border-color: rgba(255,255,255,0.2) !important;
        color: #94a3b8 !important;
    }
    .support-create-page.dark-mode .support-create-btn-secondary:hover:not(:disabled) {
        border-color: rgba(255,255,255,0.35) !important;
        color: #f1f5f9 !important;
        background: rgba(255,255,255,0.06) !important;
    }
    .btn-attach-image {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .btn-attach-image:hover {
        border-color: #e74c3c;
        background: rgba(231, 76, 60, 0.04);
        color: #e74c3c;
    }
    .support-create-page.dark-mode .btn-attach-image {
        background: rgba(255,255,255,0.04);
        border-color: rgba(255,255,255,0.15);
        color: #94a3b8;
    }
    .support-create-page.dark-mode .btn-attach-image:hover {
        border-color: #e74c3c;
        background: rgba(231, 76, 60, 0.12);
        color: #f87171;
    }
`;

function SupportCreatePage() {
    const dispatch = useDispatch();
    const { darkMode } = useDarkMode();
    const user = useSelector(state => state.authentication?.user);
    const agencies = useSelector(state => state.agencies || {});
    const isAdmin = user?.role === 1;
    const canUseBroadcast = isAdmin || user?.role === 10;

    const [ticket, setTicket] = useState({
        affair: '',
        description: '',
        priority: 'Baja',
        targetAgencyId: ''
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [redirecting, setRedirecting] = useState(false);
    const submitInProgress = useRef(false);

    const listAgencies = useMemo(() => {
        if (agencies.list && Array.isArray(agencies.list)) return agencies.list;
        if (agencies.data && Array.isArray(agencies.data)) return agencies.data;
        if (agencies.data?.results && Array.isArray(agencies.data.results)) return agencies.data.results;
        return [];
    }, [agencies]);

    useEffect(() => {
        if (canUseBroadcast) dispatch(agencyActions.listAgencies());
    }, [canUseBroadcast, dispatch]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        if (file.size > 3 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result);
            setImageBase64(reader.result);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const removeImage = () => {
        setImagePreview(null);
        setImageBase64(null);
    };

    const handleCancel = () => {
        setTicket({ affair: '', description: '', priority: 'Baja', targetAgencyId: '' });
        setImagePreview(null);
        setImageBase64(null);
    };

    const handleVolver = () => {
        history.push('/support-list');
    };

    const { creating } = useSelector(state => state.support || {});
    const isSubmitting = creating || redirecting;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTicket(prev => ({ ...prev, [name]: value }));
    };

    const setPriority = (p) => setTicket(prev => ({ ...prev, priority: p }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (submitInProgress.current || isSubmitting) return;
        const hasRequired = ticket.affair.trim() && ticket.description.trim();
        const broadcastHasTarget = !canUseBroadcast || (canUseBroadcast && (ticket.targetAgencyId === 'all' || ticket.targetAgencyId));
        if (hasRequired && broadcastHasTarget) {
            submitInProgress.current = true;
            const payload = { affair: ticket.affair, description: ticket.description, priority: ticket.priority };
            if (imageBase64) payload.initialImage = imageBase64;
            if (canUseBroadcast && ticket.targetAgencyId) payload.targetAgencyId = ticket.targetAgencyId;
            dispatch(supportActions.create(payload))
                .then(() => {
                    setRedirecting(true);
                    setTimeout(() => {
                        history.replace('/support-list', { successMessage: 'Ticket de soporte creado con éxito' });
                    }, 800);
                })
                .catch(() => {
                    submitInProgress.current = false;
                });
        }
    };

    return (
        <div className={`d-flex support-create-page ${darkMode ? 'dark-mode' : ''}`} id="wrapper">
            <style>{styles}</style>
            <SideBar />
            <div id="page-content-wrapper" style={{ flex: 1, minHeight: '100vh' }}>
                <AdminNavbar />
                <div className="p-2 p-md-3 support-create-wrapper">
                    <div className="support-create-header-bar" style={{ width: '100%', maxWidth: 640 }}>
                        <h3 className="support-create-title">Nuevo ticket de soporte</h3>
                        <Button
                            color="link"
                            className="p-0 text-muted"
                            onClick={() => history.push('/support-list')}
                            style={{ fontSize: '0.9rem' }}
                        >
                            <i className="fa fa-arrow-left mr-2"></i>
                            Volver
                        </Button>
                    </div>

                    <Card className="support-create-card border-0">
                        <div className="support-create-header">
                            <div className="support-create-header-icon">
                                <i className="fa fa-headset"></i>
                            </div>
                            <div className="support-create-header-text">
                                <h4>Describe tu consulta</h4>
                                <p>Nuestro equipo te atenderá lo antes posible</p>
                            </div>
                        </div>

                        <CardBody>
                                    <form onSubmit={handleSubmit}>
                                        {canUseBroadcast && (
                                            <FormGroup className="mb-3">
                                                <Label className="d-block mb-2">Enviar a <span className="text-danger">*</span></Label>
                                                <Input
                                                    type="select"
                                                    name="targetAgencyId"
                                                    value={ticket.targetAgencyId}
                                                    onChange={handleChange}
                                                    className="support-create-input"
                                                    required={canUseBroadcast}
                                                >
                                                    <option value="">Seleccione destino</option>
                                                    <option value="all">Todas las tiendas (difusión a todos los gerentes)</option>
                                                    {listAgencies.map(a => (
                                                        <option key={a.id || a._id} value={a.id || a._id}>
                                                            {a.name}
                                                        </option>
                                                    ))}
                                                </Input>
                                                <small className="text-muted d-block mt-1">
                                                    {ticket.targetAgencyId === 'all'
                                                        ? 'Ticket especial: todos los gerentes podrán ver, responder y recibirán notificaciones.'
                                                        : 'La notificación llegará a todos los gerentes de la tienda seleccionada.'}
                                                </small>
                                            </FormGroup>
                                        )}

                                        <FormGroup className="mb-3">
                                            <Label className="d-block mb-2">Asunto</Label>
                                            <Input
                                                type="text"
                                                name="affair"
                                                placeholder="Ej: Error en facturación, problema con reporte, consulta sobre inventario..."
                                                onChange={handleChange}
                                                value={ticket.affair}
                                                className="support-create-input"
                                                required
                                            />
                                        </FormGroup>

                                        <FormGroup className="mb-3">
                                            <Label className="d-block mb-2">Nivel de prioridad</Label>
                                            <div className="d-flex flex-column" style={{ gap: '8px' }}>
                                                {['Baja', 'Media', 'Alta'].map((p) => {
                                                    const config = PRIORITY_CONFIG[p];
                                                    const isActive = ticket.priority === p;
                                                    return (
                                                        <div
                                                            key={p}
                                                            className={`priority-option d-flex align-items-center ${isActive ? 'active' : ''}`}
                                                            onClick={() => setPriority(p)}
                                                            style={{
                                                                background: isActive ? config.bg : undefined,
                                                                borderColor: isActive ? config.color : undefined
                                                            }}
                                                        >
                                                            <div
                                                                className="d-flex align-items-center justify-content-center mr-2 rounded-circle"
                                                                style={{
                                                                    width: 36,
                                                                    height: 36,
                                                                    background: isActive ? config.color : config.bg,
                                                                    color: isActive ? '#fff' : config.color
                                                                }}
                                                            >
                                                                <i className={`fa ${config.icon}`} style={{ fontSize: '1.1rem' }}></i>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="font-weight-bold" style={{ color: isActive ? config.color : '#334155', fontSize: '0.9rem' }}>
                                                                    {p} — {config.label}
                                                                </div>
                                                                <div className="small" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                                    {config.desc}
                                                                </div>
                                                            </div>
                                                            {isActive && (
                                                                <i className="fa fa-check-circle ml-2" style={{ color: config.color, fontSize: '1rem' }}></i>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </FormGroup>

                                        <FormGroup className="mb-3">
                                            <Label className="d-block mb-2">Detalle del problema</Label>
                                            <Input
                                                type="textarea"
                                                name="description"
                                                rows="4"
                                                placeholder="Incluye todos los detalles que puedan ayudar a resolver tu caso: pasos para reproducir, pantallas afectadas, fechas, etc."
                                                onChange={handleChange}
                                                value={ticket.description}
                                                className="support-create-textarea"
                                                required
                                            />
                                        </FormGroup>

                                        <FormGroup className="mb-3">
                                            <Label className="d-block mb-2">Imagen (opcional)</Label>
                                            <div className="d-flex align-items-center flex-wrap" style={{ gap: '0.5rem' }}>
                                                <label className="btn-attach-image mb-0">
                                                    <i className="fa fa-image"></i>
                                                    <span>Adjuntar imagen (JPG, PNG, GIF…)</span>
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff"
                                                        onChange={handleImageChange}
                                                        style={{ display: 'none' }}
                                                    />
                                                </label>
                                                {imagePreview && (
                                                    <div className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
                                                        <img src={imagePreview} alt="Vista previa" style={{ maxHeight: 60, borderRadius: 8, border: '1px solid #dee2e6' }} />
                                                        <Button color="link" size="sm" className="p-0 text-muted" onClick={removeImage}>
                                                            <i className="fa fa-times"></i>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </FormGroup>

                                        <div className="d-flex flex-wrap align-items-center justify-content-between mt-4 pt-2" style={{ gap: '0.75rem' }}>
                                            <div className="d-flex" style={{ gap: '0.5rem' }}>
                                                <Button
                                                    type="button"
                                                    color="secondary"
                                                    outline
                                                    className="support-create-btn-secondary"
                                                    onClick={handleCancel}
                                                    disabled={isSubmitting}
                                                >
                                                    <i className="fa fa-times mr-2"></i>
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    color="secondary"
                                                    outline
                                                    className="support-create-btn-secondary"
                                                    onClick={handleVolver}
                                                    disabled={isSubmitting}
                                                >
                                                    <i className="fa fa-arrow-left mr-2"></i>
                                                    Volver
                                                </Button>
                                            </div>
                                            <Button
                                                type="submit"
                                                className="btn-submit-support"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Spinner size="sm" className="mr-2" />
                                                        {redirecting ? 'Redirigiendo...' : 'Enviando...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa fa-paper-plane mr-2"></i>
                                                        Enviar solicitud
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
export default SupportCreatePage;
