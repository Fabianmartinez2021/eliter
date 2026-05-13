/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner, Input, FormText } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";
import NumberFormat from 'react-number-format';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";

function ProductUpdatePage() {

    // Modo oscuro 
    const { darkMode } = useDarkMode();

    const location = useLocation();

    const productState = useSelector(state => state.products.product);
    const searching = useSelector(state => state.products.searching);
    //obtener sede del state
    const [product, setProduct] = useState(null);

    useEffect(() => {
        if (location.state === undefined) {
            history.goBack();
        } else {
            dispatch(productActions.getProduct(location.state.id));

        }
    }, [location]);

    const [code, setCode] = useState(null)
    useEffect(() => {
        setProduct(productState);

        if (productState) {
            setPresentationSelected(productState.presentation)
            setCode(productState.code)
        }
    }, [productState]);


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
    const dispatch = useDispatch();

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (alert.message) {
            setVisible(true);
            window.setTimeout(() => { setVisible(false) }, 5000);
        }
    }, [alert]);

    //Form Data
    const { handleSubmit, register, errors, control } = useForm();

    //Registrar data
    const onUpdateData = (data, e) => {
        // Sin UI exento/gravado: mantener lo guardado o gravado por defecto
        data.exempt = !!(product?.exempt);
        data.taxed = !!(product?.taxed);
        if (!data.exempt && !data.taxed) {
            data.taxed = true;
        }

        data.wholesalePrice = product?.wholesalePrice ?? 0;
        data.minWeight = product?.minWeight ?? 0;
        data.applyWholesaleDiscount = !!product?.applyWholesaleDiscount;
        data.wholesaleDiscountPrice = product?.wholesaleDiscountPrice ?? 0;

        data.user = user.id;
        dispatch(productActions.updateProduct(location.state.id, data, user));
    };

    //State de actualizacion
    const updating = useSelector(state => state.products.updating);
    const products = useSelector(state => state.products);

    //Actualizar estado de sede al cambio de información
    useEffect(() => {
        if (products.success) {
            setProduct(products.productUpdated);
        }
    }, [products.success]);

    const [presentationSelected, setPresentationSelected] = useState('');

    const handleChange = (e) => {
        setPresentationSelected(e.target.value);
    }

    return (
        <>
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="container-fluid">
                        <Container>
                            <Row>
                                <Col sm="12" md={{ size: 8, offset: 2 }}>
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Actualizar producto</h3>
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
                                    {searching && <div className="d-flex justify-content-center">
                                        <Spinner color="primary" />
                                    </div>}
                                    {product &&
                                        <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                            <Row form>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="code">Código de producto</Label>
                                                        <input
                                                            className="form-control-plaintext"
                                                            defaultValue={code}
                                                            id="staticCode"
                                                            readOnly={true}
                                                            type="text"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="name">Nombre</Label>
                                                        <input
                                                            maxLength="100"
                                                            autoComplete="off"
                                                            className={'form-control' + (errors.name ? ' is-invalid' : '')}
                                                            name="name"
                                                            ref={register({
                                                                required: "El nombre es requerido",
                                                            })}
                                                            defaultValue={product.name}
                                                        />
                                                        {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Row form>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="presentation">Presentación</Label>{' '}
                                                        <select className={'form-control' + (errors.presentation ? ' is-invalid' : '')} name="presentation"
                                                            value={presentationSelected} onChange={handleChange}
                                                            ref={register({
                                                                required: "La presentación es requerida"
                                                            })}>
                                                            <option key="kg" name="kg" value="kg">kg</option>
                                                            <option key="Unidades" name="Unidades" value="Unidades">Unidades</option>
                                                            <option key="kg/Unidades" name="kg/Unidades" value="kg/Unidades">kg/Unidades</option>
                                                        </select>
                                                        {errors.presentation && <div className="invalid-feedback d-block">{errors.presentation.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="price">Precio al detal</Label>
                                                        <Controller
                                                            name="price"
                                                            control={control}
                                                            rules={{
                                                                min: {
                                                                    value: 1,
                                                                    message: "El precio es requerido"
                                                                },
                                                                setValueAs: (value) => {

                                                                    return (value && (typeof (value) === 'string')) ? value.replace('$ ', '') : value;
                                                                },
                                                                required: "El precio es requerido",
                                                            }}
                                                            defaultValue={product.price}
                                                            as={<NumberFormat className={'form-control' + (errors.price ? ' is-invalid' : '')} thousandSeparator={true} prefix='$ ' />}
                                                        />
                                                        {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <FormGroup check>
                                                <Label check>
                                                    <input type="checkbox" name="endPrice" ref={register} defaultChecked></input >
                                                    Precio de referencia del día{" "}
                                                    <span className="form-check-sign">
                                                        <span className="check"></span>
                                                    </span>
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check>
                                                <Label check>
                                                    <input type="checkbox" name="decrease" ref={register} defaultChecked={product.decrease}></input >
                                                    Merma por empaque{" "}
                                                    <span className="form-check-sign">
                                                        <span className="check"></span>
                                                    </span>
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check>
                                                <Label check>
                                                    <input type="checkbox" name="reweigh" ref={register} defaultChecked={product.reweigh}></input >
                                                    Merma por humedad{" "}
                                                    <span className="form-check-sign">
                                                        <span className="check"></span>
                                                    </span>
                                                </Label>
                                            </FormGroup>
                                            <FormGroup check>
                                                <Label check>
                                                    <input type="checkbox" name="mincemeat" ref={register} defaultChecked={product.mincemeat}></input >
                                                    Merma por picadillo{" "}
                                                    <span className="form-check-sign">
                                                        <span className="check"></span>
                                                    </span>
                                                </Label>
                                            </FormGroup>
                                            <FormText className="text-muted" color="default" id="emailHelp" style={{ fontSize: 12, marginTop: 15 }}>
                                                <b>Nota:</b> al marcar <b>precio final</b>, el monto será usado para el reporte financiero a la fecha de actualización,
                                                de lo contrario, se usará el último precio registrado. Se recomienda no cambiar precios en horario laborable.
                                            </FormText>
                                            <div className="d-flex justify-content-between">
                                                <Button color="primary" disabled={updating}>
                                                    {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    Actualizar
                                                </Button>
                                                <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
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

export default ProductUpdatePage;