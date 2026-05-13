/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { miscellaneousInventoryActions, miscellaneousActions, agencyActions } from '../../actions';
import { departureMiscellaneousActions } from '../../actions/departureMiscellaneous.actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { Role, history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import typeSupplyEnum from '../../enums/typeSupply.enum';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

function DeparturePage() {

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    //Modo oscuro 
    const { darkMode} = useDarkMode();
    

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

    //obtener productos para select
    const getting = useSelector(state => state.miscellaneous.getting);
    const products = useSelector(state => state.miscellaneous);

    const [listProducts, setListProducts] = useState(null);

    useEffect(() => {
        dispatch(miscellaneousActions.dataTable());
    }, []);

    useEffect(() => {
        if (products.obtained) {
            setListProducts(products.data.results);
        }
    }, [products.obtained]);


    //obtener sucursales para select
    const gettingAgency = useSelector(state => state.agencies.getting);
    const agencies = useSelector(state => state.agencies);
    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    }, []);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (agencies.obtained) {
            setListAgencies(agencies.list);
        }
    }, [agencies.obtained]);


    //Form Tabla
    const { handleSubmit, register, errors, reset, control } = useForm();

    //Form resgistrar salida
    const { handleSubmit: handleSubmitDeparture, register: registerDeparture, trigger, errors: errorsDeparture, watch: watchDeparture, reset: resetDeparture, setValue: setDepartureFormValue } = useForm();

    const agencyDepartureWatch = watchDeparture('agency');
    useSyncFirstAgencyFormField(listAgencies, setDepartureFormValue, agencyDepartureWatch);

    //Tabla de productos añadidos
    const [tableDeparture, setTableDeparture] = useState([]);
    const [total, setTotal] = useState(0);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    //Añadir producto a tabla
    const onCreateData = (data, e) => {

        //buscar codigo de producto para añadir
        let productFilter = listProducts.filter(item => item.code.toString() === data.code);

        if (productFilter.length == 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        } else {

            //tomar precio de oferta si existe sino, el precio normal
            let priceProduct = productFilter[0].price;

            const target = { ...productFilter[0] };

            const source = {
                kg: parseFloat(data.kg),
                price: priceProduct,
                total: parseFloat(data.kg) * parseFloat(priceProduct)
            };

            //Añadir al array de productos
            let products = tableDeparture;
            products.unshift(Object.assign(target, source));
            setTableDeparture(products);

            var sum = 0;
            products.map((product) => {
                sum += product.total;
                setTotal(sum);
            });

            //focus en el codigo nuevamente
            codeRef.current.focus();
            //resetear form
            reset({
                code: '',
                kg: ''
            });
        }

    };

    //Quitar elemento de la tabla
    const removeItem = (product) => {

        let products = tableDeparture;
        const index = products.indexOf(product);

        if (index !== -1) {
            products.splice(index, 1);
            setTableDeparture([...products])
        }

        let sum = 0;
        products.map((product) => {
            sum = sum + parseFloat(product.total);
            setTotal(sum);
        })
        if (products.length == 0) {
            setTotal(0);
        }
    }

    //State de guardado
    const registering = useSelector(state => state.departureMiscellaneous.registering);

    //Registrar venta
    const onRegisterSale = async (data, e) => {

        if (tableDeparture.length == 0) {
            setModalMsg('Debe ingresar al menos un producto');
            setModalVisible(true);
            return;
        }


        data.user = user.id;

        // Si el usuario es gerente o supervisor, la agencia es directamente su agencia de lo contrario hay select
        if ((user.role == 2) || (user.role == 3)) {
            data.agency = user.agency.id;
        }
        else {
            const triggerResponse = await trigger(["agency"]);

            //  Se verifica que la agencia haya sido ingresada
            if (!triggerResponse) {
                setModalVisible(true);
                setModalMsg('Debe verificar que todos los datos hayan sido ingresados');
                return;
            }
        }

        data.products = tableDeparture;
        // data.items=tableDeparture
        data.total = total;

        dispatch(departureMiscellaneousActions.createDeparture(data));

        if(type === "2"){

            data.agency = data.agencyIn;
            data.typeIn = '3';

            dispatch(miscellaneousInventoryActions.createInventory( data ));
        }
        
    };

    const statusRegister = useSelector(state => state.departureMiscellaneous);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if (statusRegister.success) {
            resetDeparture({ names: '', phone: '', type: '', comment: '', agency: '', agencyIn: '' });
            setTableDeparture([]);
            setTotal(0);
        }
    }, [statusRegister.success]);

    const codeRef = useRef();

    let type = watchDeparture("type")


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
                                    {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Registro de salida de suministros</h3>
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

                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="names">Dirigido a:</Label>
                                                <input placeholder="Nombre cliente, o tienda para donde va el traslado"
                                                    maxLength="100"
                                                    autoComplete="off"
                                                    className={'form-control' + (errors.names ? ' is-invalid' : '')}
                                                    name="names"
                                                    ref={registerDeparture({
                                                        required: "El Dirijido es requerido",
                                                    })}
                                                />
                                                {errorsDeparture.names && <div className="invalid-feedback d-block">{errorsDeparture.names.message}</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="type">Tipo de salida</Label>
                                                <select className={'form-control' + (errors.type ? ' is-invalid' : '')} name="type"
                                                    ref={registerDeparture({
                                                        required: "El tipo es requerido"
                                                    })}>
                                                    <option key="" name="" value=""></option>
                                                    {/* Para la lista no se tomará en cuenta los suministros usados (index === 0) porque esos se descuentan al hacer el inventario físico */}
                                                    {Object.keys(typeSupplyEnum.outDescription).filter((item, index) => index > 0).map((index) => {
                                                        return <option key={index} name={index} value={index}>{typeSupplyEnum.outDescription[index]}</option>
                                                    })}
                                                </select>
                                                {errorsDeparture.type && <div className="invalid-feedback d-block">Seleccione tipo</div>}
                                            </FormGroup>
                                        </Col>
                                        <Col md={12}>
                                            {/* Solo role admin y supervisor */}
                                             {(user.role === Role.Admin || user.role === Role.suplyRole) &&  (
                                            <>
                                                <FormGroup>
                                                    <Label for="agency">Sucursal</Label>{' '}
                                                    {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    <select
                                                        className={'form-control' + (errors.agency ? ' is-invalid' : '')}
                                                        name="agency"
                                                        ref={registerDeparture({
                                                            required: "La sucursal es requerida"
                                                        })}>
                                                        <option key="" name="" value=""></option>
                                                        {listAgencies && listAgencies.map(list =>
                                                            <option
                                                                key={list.id}
                                                                name={list.id}
                                                                value={list.id}>
                                                                {list.name}
                                                            </option>
                                                        )}
                                                    </select>
                                                    {errors.agency && <div className="invalid-feedback d-block">{errors.agency.message}</div>}
                                                </FormGroup>
                                            </>
                                            )}
                                        </Col>
                                        <Col md={12}>
                                            {/* Solo role admin y supervisor */}
                                             {(type === "2") &&  (
                                            <>
                                                <FormGroup>
                                                    <Label for="agencyIn">Sucursal a donde va el suministro</Label>{' '}
                                                    {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    <select
                                                        className={'form-control' + (errors.agencyIn ? ' is-invalid' : '')}
                                                        name="agencyIn"
                                                        ref={registerDeparture({
                                                            required: "La sucursal es requerida"
                                                        })}>
                                                        <option key="" name="" value=""></option>
                                                        {listAgencies && listAgencies.map(list =>
                                                            <option
                                                                key={list.id}
                                                                name={list.id}
                                                                value={list.id}>
                                                                {list.name}
                                                            </option>
                                                        )}
                                                    </select>
                                                    {errors.agencyIn && <div className="invalid-feedback d-block">{errors.agencyIn.message}</div>}
                                                </FormGroup>
                                            </>
                                            )}
                                        </Col>
                                        <Col md={12}>
                                            <FormGroup>
                                                <Label for="comment">Comentarios</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control'}
                                                    name="comment"
                                                    ref={registerDeparture}
                                                />
                                            </FormGroup>
                                        </Col>
                                        {(type === "8") && <>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="authorizedBy">Autorizado por:</Label>
                                                    <select
                                                        className={'form-control' + (errorsDeparture.authorizedBy ? ' is-invalid' : '')}
                                                        name="authorizedBy"
                                                        ref={registerDeparture({
                                                            required: "El campo es requerido"
                                                        })}
                                                    >
                                                        <option value="Baltazar">Baltazar</option>
                                                    </select>
                                                    {errorsDeparture.authorizedBy && <div className="invalid-feedback d-block">{errorsDeparture.authorizedBy.message}</div>}

                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="withdrawnBy">Retirado por:</Label>
                                                    <input
                                                        maxLength="150"
                                                        autoComplete="off"
                                                        className={'form-control' + (errorsDeparture.withdrawnBy ? ' is-invalid' : '')}
                                                        name="withdrawnBy"
                                                        ref={registerDeparture({
                                                            required: "El campo es requerido"
                                                        })}
                                                    />
                                                    {errorsDeparture.withdrawnBy && <div className="invalid-feedback d-block">{errorsDeparture.withdrawnBy.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label for="reason">Motivo</Label>
                                                    <input
                                                        maxLength="150"
                                                        autoComplete="off"
                                                        className={'form-control' + (errorsDeparture.reason ? ' is-invalid' : '')}
                                                        name="reason"
                                                        ref={registerDeparture({
                                                            required: "El campo es requerido"
                                                        })}
                                                    />
                                                    {errorsDeparture.reason && <div className="invalid-feedback d-block">{errorsDeparture.reason.message}</div>}
                                                </FormGroup>
                                            </Col>
                                        </>
                                        }
                                    </Row>

                                    <Form onSubmit={handleSubmit(onCreateData)} className="form" style={{
                                        border: '1px solid #dee2e6', padding: '10px 20px', borderRadius: '5px',
                                        marginBottom: '5px'
                                    }}>
                                        <Row form>
                                            <Col md={3}>
                                                <FormGroup>
                                                    <input
                                                        type="text"
                                                        maxLength={50}
                                                        autoComplete="off"
                                                        className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                        name="code"
                                                        ref={(e) => {
                                                            register(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
                                                            codeRef.current = e;
                                                        }}
                                                        placeholder="Código de producto"
                                                    />
                                                    {errors.code && <div className="invalid-feedback d-block">{errors.code.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Controller
                                                        name="kg"
                                                        control={control}
                                                        rules={{
                                                            min: {
                                                                value: 0.001,
                                                                message: "El peso es requerido"
                                                            },
                                                            setValueAs: (value) => {

                                                                return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                            },
                                                            required: "El peso es requerido",
                                                        }}
                                                        as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                    />
                                                    {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={3} sm={6}>
                                                <FormGroup>
                                                    <Button color="primary" className="btn-round btn-icon" style={{ marginTop: 0 }}>
                                                        <i className="fa fa-plus"></i>
                                                    </Button>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                    </Form>
                                    <Table striped responsive className={darkMode ? 'dark-mode' : ''}>
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>kg/unidades</th>
                                                <th>Sub total</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableDeparture && tableDeparture.map((product, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{product.name}</td>
                                                        <td>
                                                            <NumberFormat 
                                                                displayType={'text'} 
                                                                value={product.kg} 
                                                                thousandSeparator={true}
                                                                decimalScale={product.kg % 1 !== 0 ? 3 : 0}
                                                                fixedDecimalScale={product.kg % 1 !== 0}
                                                            />
                                                        </td>
                                                        <td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                                                        <td>
                                                            <Button className="btn-link" color="primary" style={{ margin: 0, padding: 0 }}
                                                                onClick={e => {
                                                                    e.preventDefault();
                                                                    removeItem(product);
                                                                }
                                                                }>
                                                                <i className="fa fa-times-circle"></i>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                            }
                                        </tbody>
                                    </Table>
                                    <Row xs="12">
                                        <Col><div className="pull-right" style={{ fontSize: 16, padding: 6, border: '1px solid #BE1F1F' }}><b>Total: <NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b> </div></Col>
                                    </Row>
                                    <Form onSubmit={handleSubmitDeparture(onRegisterSale)}>
                                        <div className="d-flex justify-content-between">
                                            <Button color="primary" disabled={registering}>
                                                {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Registrar
                                            </Button>
                                            <Button onClick={e => { e.preventDefault(); history.goBack() }}>Cancelar</Button>
                                        </div>
                                    </Form>
                                </Col>
                            </Row>
                            <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="examplemodalMsgLabel">
                                        Salidas
                                    </h5>
                                    <button
                                        aria-label="Close"
                                        className="close"
                                        type="button"
                                        onClick={() => { setModalVisible(false); setModalMsg('') }}
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
                                        onClick={() => { setModalVisible(false); setModalMsg('') }}
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            </Modal>
                        </Container>
                    </div>

                </div>
            </div>
        </>
    );
}

export default DeparturePage;