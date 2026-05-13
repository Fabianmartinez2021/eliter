/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { agencyActions, terminalActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos
import NumberFormat from 'react-number-format';

// Lista de empresas
const companies = [
    "EMBUTIDOS FATTORIA",
    "Principal",
    "EMBUTIDOS MOHAN",
    "DELICATESES EMMANUEL",
    "DELICATESES MOMOY",
    "DISTRIBUIDORA Y COMERCIALIZADORA MOREFINA"
];


function AgencyUpdatePage() {

    //Modo oscuro 
    const { darkMode} = useDarkMode();
          
    const location = useLocation();

    const agencyState = useSelector(state => state.agencies.agency);
    const searching = useSelector(state => state.agencies.searching);
    //obtener sede del state
    const [agency, setAgency] = useState(null);

    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(agencyActions.getAgency( location.state.id ));
            
        }
    }, [location]);

    useEffect(() => {
        setAgency(agencyState); 
    },[agencyState]);


  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
    });

	//usuario
    const user = useSelector(state => state.authentication.user);
    const isDisabled = user.role === 10;

    const dispatch = useDispatch();

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if(alert.message){
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);

    //Form Data
    const { handleSubmit, register, errors, control, watch, setValue } = useForm();

    //Registrar data
    const agencyData = agency;

    const [billingWeeklyHistory, setBillingWeeklyHistory] = useState([]);
    const [invoiceWeeklyHistory, setInvoiceWeeklyHistory] = useState([]);

    const [weeklyGoalDisplay, setWeeklyGoalDisplay] = useState('');
    const [weeklyTicketGoalDisplay, setWeeklyTicketGoalDisplay] = useState('');
    const weeklyGoalValueRef = useRef(0);
    const weeklyTicketGoalValueRef = useRef(0);

    useEffect(() => {
        if (agencyData) {
            if (Array.isArray(agencyData.billingWeeklyHistory)) {
                setBillingWeeklyHistory(agencyData.billingWeeklyHistory);
            }
            if (Array.isArray(agencyData.invoiceWeeklyHistory)) {
                setInvoiceWeeklyHistory(agencyData.invoiceWeeklyHistory);
            }
            if (agencyData.billingWeeklyGoal) {
                setValue('billingWeeklyGoal', agencyData.billingWeeklyGoal);
            }
            if (agencyData.invoiceWeeklyGoal) {
                setValue('invoiceWeeklyGoal', agencyData.invoiceWeeklyGoal);
            }
        }
    }, [agencyData, setValue]);

    useEffect(() => {
        if (!agencyData || !agencyData.id) return;

        const wg = agencyData.weeklyGoal != null && agencyData.weeklyGoal !== '' ? Number(agencyData.weeklyGoal) : 0;
        const wt = agencyData.weeklyTicketGoal != null && agencyData.weeklyTicketGoal !== '' ? Number(agencyData.weeklyTicketGoal) : 0;
        weeklyGoalValueRef.current = wg;
        weeklyTicketGoalValueRef.current = wt;
        setWeeklyGoalDisplay(wg > 0 ? String(wg) : '');
        setWeeklyTicketGoalDisplay(wt > 0 ? String(wt) : '');
        setValue('weeklyGoal', wg);
        setValue('weeklyTicketGoal', wt);
        setValue('weeklyGoalMinimumPercentageOfSales', agencyData.weeklyGoalMinimumPercentageOfSales != null ? agencyData.weeklyGoalMinimumPercentageOfSales : 80);
        setValue('wholesalesGoal', agencyData.wholesalesGoal != null ? agencyData.wholesalesGoal : 0);
        setValue('wholesalesGoalCommissionPercentage', agencyData.wholesalesGoalCommissionPercentage != null ? agencyData.wholesalesGoalCommissionPercentage : 0);
        setValue('applyForWeeklyGoal', !!agencyData.applyForWeeklyGoal);
    }, [
        agencyData?.id,
        agencyData?.weeklyGoal,
        agencyData?.weeklyTicketGoal,
        agencyData?.applyForWeeklyGoal,
        agencyData?.weeklyGoalMinimumPercentageOfSales,
        agencyData?.wholesalesGoal,
        agencyData?.wholesalesGoalCommissionPercentage,
        setValue
    ]);

    const createHistoryEntry = (type, oldValue, newValue) => {
        const timestamp = new Date().toISOString();
        const changedBy = user?.username || 'admin';
        return {
            id: `${type}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
            date: timestamp,
            changedBy,
            type,
            oldValue,
            newValue,
            agencyId: location.state.id,
            agencyName: agencyData?.name || ''
        };
    };

    const getNumberValue = (value) => {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const billingWeeklyGoal = watch('billingWeeklyGoal');
    const invoiceWeeklyGoal = watch('invoiceWeeklyGoal');

    const onUpdateData = (data, e) => {
        const originalBillingWeekly = getNumberValue(agencyData?.billingWeeklyGoal || 0);
        const originalInvoiceWeekly = getNumberValue(agencyData?.invoiceWeeklyGoal || 0);

        const newBillingWeekly = getNumberValue(
            billingWeeklyGoal !== undefined && billingWeeklyGoal !== null && billingWeeklyGoal !== ''
                ? billingWeeklyGoal
                : agencyData?.billingWeeklyGoal ?? 0
        );
        const newInvoiceWeekly = getNumberValue(
            invoiceWeeklyGoal !== undefined && invoiceWeeklyGoal !== null && invoiceWeeklyGoal !== ''
                ? invoiceWeeklyGoal
                : agencyData?.invoiceWeeklyGoal ?? 0
        );

        const billingHistory = [...billingWeeklyHistory];
        const invoiceHistory = [...invoiceWeeklyHistory];

        const hasBillingChange = originalBillingWeekly !== newBillingWeekly;
        const hasInvoiceChange = originalInvoiceWeekly !== newInvoiceWeekly;

        if (hasBillingChange) {
            billingHistory.push(
                createHistoryEntry(
                    'billing_weekly_goal_update',
                    originalBillingWeekly,
                    newBillingWeekly
                )
            );
        }

        if (hasInvoiceChange) {
            invoiceHistory.push(
                createHistoryEntry(
                    'invoice_weekly_goal_update',
                    originalInvoiceWeekly,
                    newInvoiceWeekly
                )
            );
        }

        const applyWeekly =
            data.applyForWeeklyGoal === true || data.applyForWeeklyGoal === 'true';

        const payload = {
            ...data,
            billingWeeklyGoal: newBillingWeekly,
            invoiceWeeklyGoal: newInvoiceWeekly,
            billingWeeklyHistory: billingHistory,
            invoiceWeeklyHistory: invoiceHistory,
            applyForWeeklyGoal: applyWeekly,
            weeklyGoal: weeklyGoalValueRef.current,
            weeklyTicketGoal: weeklyTicketGoalValueRef.current,
            weeklyGoalMinimumPercentageOfSales: getNumberValue(data.weeklyGoalMinimumPercentageOfSales),
            wholesalesGoal: getNumberValue(data.wholesalesGoal),
            wholesalesGoalCommissionPercentage: getNumberValue(data.wholesalesGoalCommissionPercentage),
            lastUpdated: new Date().toISOString(),
            updatedBy: user?.username || 'admin'
        };

        dispatch(agencyActions.updateAgency(location.state.id, payload, user));
    };

    //State de actualizacion
    const updating = useSelector(state => state.agencies.updating);
    const agencies = useSelector(state => state.agencies);

    //Actualizar estado de sede al cambio de información
    useEffect(() => {
        if(agencies.success){
            setAgency(agencies.agencyUpdated);
        }
    },[agencies.success]);

    //obtener terminales para multiselect
    const getting = useSelector(state => state.terminal.getting);
    const terminals = useSelector(state => state.terminal);
    useEffect(() => {
        dispatch(terminalActions.listUnused());
    },[]);

    const [listTerminals, setListTerminals] = useState([]);

    useEffect(() => {
        if(terminals.obtained && agency){
            //Añadir al typeAhead las terminales sin usar y la que trae
            let terminal = agency.terminal;

            let tahead = []
            for (let item of terminal) {
                tahead.push(item);
            }
            for (let item of terminals.list) {
                tahead.push(item);
            }
            setListTerminals(tahead);
        }
    },[terminals.obtained, agency]);

    const TypeAhead = useRef(null);

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
				<SideBar/>
				<div id="page-content-wrapper">
					<AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Actualizar sede</h3>
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
                                {searching &&  <div className="d-flex justify-content-center">
                                    <Spinner color="primary" />
                                </div>}                       
                                {agency &&
                                <Form key={agency.id + (agency.updatedDate || '')} onSubmit={handleSubmit(onUpdateData)} className="form">
                                    <Row form>
                                        <Col md={4}>
                                        <FormGroup>
                                            <Label for="name">Nombre</Label>
                                            <input
                                                disabled={isDisabled}
                                                maxLength="20"
                                                autoComplete="off"
                                                className={'form-control' + (errors.name ? ' is-invalid' : '')}
                                                name="name"
                                                ref={register({
                                                    required: "El nombre es requerido",
                                                })}
                                                defaultValue={agency.name}
                                            />
                                            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                      {  /*<FormGroup>
                                            <Label for="company">Empresa</Label>
                                            <select
                                                disabled={isDisabled}
                                                name="company"
                                                ref={register({ required: "Seleccione una empresa" })}
                                                className={'form-control' + (errors.company ? ' is-invalid' : '')}
                                                style={{ width: '100%',}}
                                                defaultValue={agency.company}
                                            >
                                                <option value="">Seleccione una empresa</option>
                                                {companies.map(company => (
                                                    <option key={company} value={company}>{company}</option>
                                                ))}
                                            </select>
                                            {errors.company && <div className="invalid-feedback">{errors.company.message}</div>}
                                        </FormGroup>*/}
                                        </Col>
                                        <Col md={4}>
                                       {/* <FormGroup>
                                            <Label for="rif">RIF</Label>
                                            <input
                                                type="text"
                                                maxLength="50"
                                                autoComplete="off"
                                                className={'form-control' + (errors.rif ? ' is-invalid' : '')}
                                                name="rif"
                                                ref={register}
                                                defaultValue={agency.rif || ''}
                                            />
                                            {errors.rif && <div className="invalid-feedback">{errors.rif.message}</div>}
                                        </FormGroup>*/}
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="attendant">Nombre del encargado</Label>
                                            <input
                                                maxLength="100"
                                                autoComplete="off"
                                                className={'form-control' + (errors.attendant ? ' is-invalid' : '')}
                                                name="attendant"
                                                ref={register({
                                                    required: "El encargado es requerido",
                                                })}
                                                defaultValue={agency.attendant}
                                            />
                                            {errors.attendant && <div className="invalid-feedback">{errors.attendant.message}</div>}
                                        </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                        <FormGroup>
                                            <Label for="attendant">Numero de telefono</Label>
                                            <input
                                                maxLength="1000000"
                                                autoComplete="off"
                                                className={'form-control' + (errors.phone ? ' is-invalid' : '')}
                                                name="phone"
                                                ref={register({
                                                    required: "El numero de telefono es requerido",
                                                })}
                                                defaultValue={agency.phone}
                                            />
                                            {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                                        </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label for="address">Dirección</Label>
                                        <input
                                            maxLength="250"
                                            autoComplete="off"
                                            className={'form-control' + (errors.address ? ' is-invalid' : '')}
                                            name="address"
                                            ref={register({
                                                required: "El dirección es requerida"
                                            })}
                                            defaultValue={agency.address}
                                        />
                                        {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
                                    </FormGroup>
                                    <h5 className="mt-3 mb-2" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Metas de venta (sucursal)</h5>
                                    <p className="text-muted small">Estos valores definen las metas en pantalla de ventas y reportes en tiempo real para esta sucursal.</p>
                                    <Row form>
                                        <Col md={12}>
                                            <FormGroup className="ml-1">
                                                <label className="d-flex align-items-center">
                                                    <input
                                                        className="form-check-input mr-2"
                                                        name="applyForWeeklyGoal"
                                                        type="checkbox"
                                                        value="true"
                                                        ref={register}
                                                        defaultChecked={!!agency.applyForWeeklyGoal}
                                                    />
                                                    Aplica meta semanal al detal ($)
                                                </label>
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="agencyWeeklyGoal">Meta semanal al detal ($)</Label>
                                                <NumberFormat
                                                    className="form-control"
                                                    thousandSeparator={true}
                                                    value={weeklyGoalDisplay}
                                                    onValueChange={(values) => {
                                                        const num = values.floatValue !== undefined && values.floatValue !== null && !isNaN(values.floatValue) ? values.floatValue : 0;
                                                        setWeeklyGoalDisplay(values.formattedValue ?? '');
                                                        weeklyGoalValueRef.current = num;
                                                        setValue('weeklyGoal', num);
                                                    }}
                                                    prefix="$ "
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="weeklyGoalMinimumPercentageOfSales">% Mínimo de meta</Label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={'form-control' + (errors.weeklyGoalMinimumPercentageOfSales ? ' is-invalid' : '')}
                                                    name="weeklyGoalMinimumPercentageOfSales"
                                                    ref={register}
                                                    defaultValue={agency.weeklyGoalMinimumPercentageOfSales != null ? agency.weeklyGoalMinimumPercentageOfSales : 80}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="agencyWeeklyTicketGoal">Meta compra promedio por cada cliente ($)</Label>
                                                <NumberFormat
                                                    className="form-control"
                                                    thousandSeparator={true}
                                                    value={weeklyTicketGoalDisplay}
                                                    onValueChange={(values) => {
                                                        const num = values.floatValue !== undefined && values.floatValue !== null && !isNaN(values.floatValue) ? values.floatValue : 0;
                                                        setWeeklyTicketGoalDisplay(values.formattedValue ?? '');
                                                        weeklyTicketGoalValueRef.current = num;
                                                        setValue('weeklyTicketGoal', num);
                                                    }}
                                                    prefix="$ "
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="wholesalesGoal">Meta ventas al mayor ($)</Label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={'form-control' + (errors.wholesalesGoal ? ' is-invalid' : '')}
                                                    name="wholesalesGoal"
                                                    ref={register}
                                                    defaultValue={agency.wholesalesGoal != null ? agency.wholesalesGoal : 0}
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="wholesalesGoalCommissionPercentage">% Comisión meta mayoreo</Label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className={'form-control' + (errors.wholesalesGoalCommissionPercentage ? ' is-invalid' : '')}
                                                    name="wholesalesGoalCommissionPercentage"
                                                    ref={register}
                                                    defaultValue={agency.wholesalesGoalCommissionPercentage != null ? agency.wholesalesGoalCommissionPercentage : 0}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label for="terminal">Terminales</Label>
                                        {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        <Controller
                                            name="terminal"
                                            control={control}
                                            rules={{
                                                required: "Seleccione al menos una terminal",
                                                validate: terminal => {
                                                    return Array.isArray(terminal) && terminal.length > 0;
                                                }
                                            }}
                                            defaultValue={agency.terminal}
                                            as={
                                                <Typeahead
                                                    ref={TypeAhead}
                                                    isInvalid={errors.terminal ? true:false}
                                                    id="matter-select"
                                                    labelKey={option => `${option.code} - ${option.serial}`}
                                                    multiple
                                                    defaultSelected={agency.terminal}
                                                    name="terminal"
                                                    options={listTerminals}
                                                    placeholder="Seleccione terminales"  
                                                    emptyLabel="No hay resultados"
                                                />
                                            }
                                        />
                                        {errors.terminal && <div className="invalid-feedback d-block">Seleccione al menos una terminal</div>}
                                    </FormGroup> 
                                   {/* <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="billingWeeklyGoal">Facturación semanal (Bs)</Label>
                                                <Controller
                                                    name="billingWeeklyGoal"
                                                    rules={{
                                                        min: {
                                                            value: 0,
                                                            message: "El valor no puede ser negativo"
                                                        },
                                                    }}
                                                    control={control}
                                                    defaultValue={agency?.billingWeeklyGoal || ''}
                                                    render={({ onChange, value }) => (
                                                        <NumberFormat
                                                            className={'form-control' + (errors.billingWeeklyGoal ? ' is-invalid' : '')}
                                                            thousandSeparator={true}
                                                            value={value || ''}
                                                            onValueChange={(values) => {
                                                                onChange(values.floatValue || '');
                                                            }}
                                                        />
                                                    )}
                                                />
                                                {errors.billingWeeklyGoal && <div className="invalid-feedback">{errors.billingWeeklyGoal.message}</div>}
                                                {billingWeeklyHistory.length > 0 && (
                                                    <small className="form-text text-muted">
                                                        Último cambio: {new Date(billingWeeklyHistory[billingWeeklyHistory.length - 1].date).toLocaleString()} por {billingWeeklyHistory[billingWeeklyHistory.length - 1].changedBy}
                                                    </small>
                                                )}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="invoiceWeeklyGoal">Cantidad de facturas semanal</Label>
                                                <input
                                                    type="number"
                                                    className={'form-control' + (errors.invoiceWeeklyGoal ? ' is-invalid' : '')}
                                                    name="invoiceWeeklyGoal"
                                                    ref={register}
                                                    defaultValue={agency?.invoiceWeeklyGoal || ''}
                                                />
                                                {errors.invoiceWeeklyGoal && <div className="invalid-feedback">{errors.invoiceWeeklyGoal.message}</div>}
                                                {invoiceWeeklyHistory.length > 0 && (
                                                    <small className="form-text text-muted">
                                                        Último cambio: {new Date(invoiceWeeklyHistory[invoiceWeeklyHistory.length - 1].date).toLocaleString()} por {invoiceWeeklyHistory[invoiceWeeklyHistory.length - 1].changedBy}
                                                    </small>
                                                )}
                                            </FormGroup>
                                        </Col>
                                    </Row>*/}
                                  
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={updating}>
                                            {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Actualizar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                                }
                            </Col>
                        </Row>
                        </Container>
                    </div>

				</div>
            </div>
        </>
    );
}

export default AgencyUpdatePage;