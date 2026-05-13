/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousActions } from '../../actions';
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

function MiscellaneousUpdatePage() {

    // Modo oscuro 
	const { darkMode } = useDarkMode();

    const location = useLocation();

    const productState = useSelector(state => state.miscellaneous.product);
    const searching = useSelector(state => state.miscellaneous.searching);
    //obtener sede del state
    const [product, setProduct] = useState(null);

    useEffect(() => {
        if (location.state === undefined) {
            history.goBack();
        } else {
            dispatch(miscellaneousActions.getProduct(location.state.id));
        }
    }, [location]);

    const [code, setCode] = useState(null)
    useEffect(() => {
        if (productState){
            setProduct(productState);
            if (productState) {
                setPresentationSelected(productState.presentation)
                setCode(productState.code)
            }
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
    const { handleSubmit, register, errors, control, watch } = useForm();

    //Registrar data
    const onUpdateData = (data, e) => {
        data.user = user.id;
        dispatch(miscellaneousActions.updateProduct(location.state.id, data, user));
    };

    //State de actualizacion
    const updating = useSelector(state => state.miscellaneous.updating);
    const products = useSelector(state => state.miscellaneous);

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
                                                            <option key="Litros" name="Litros" value="Litros">Litros</option>                                                     
                                                            <option key="Unidades" name="Unidades" value="Unidades">Unidades</option>
                                                        </select>
                                                        {errors.presentation && <div className="invalid-feedback d-block">{errors.presentation.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="price">Precio al detal ($)</Label>
                                                        <Controller
                                                            name="price"
                                                            control={control}
                                                            rules={{
                                                                setValueAs: (value) => {
                                                                    if (value && (typeof value === 'string') && value.split(' ')[1]) {
                                                                        // Unicamente se va a tomar en cuenta el número por lo que cualquier número únicamete será positivo
                                                                        return value.split(' ')[1].replaceAll(/,/g, '');
                                                                    }
                                                                    return value
                                                                },
                                                                required: "El precio es requerido",
                                                                validate: (value) => {
                                                                    if ((typeof value === 'string') && !value.split(' ')[1]) return 'El valor no puede ser menor que cero'
                                                                }
                                                            }}
                                                            defaultValue={product.price}
                                                            as={<NumberFormat className={'form-control' + (errors.price ? ' is-invalid' : '')} thousandSeparator={true} prefix='$ ' />}
                                                        />
                                                        {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-between">
                                                <Button color="primary" disabled={updating || searching}>
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

export default MiscellaneousUpdatePage;