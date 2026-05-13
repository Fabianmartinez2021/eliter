/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { offerActions, productActions, agencyActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

function OfferCreatePage() {

  	useEffect(() => {
		document.body.classList.add("landing-page");
		document.body.classList.add("sidebar-collapse");
		document.documentElement.classList.remove("nav-open");
		return function cleanup() {
			document.body.classList.remove("landing-page");
			document.body.classList.remove("sidebar-collapse");
		};
    });

    // Modo oscuro 
    const { darkMode } = useDarkMode();
      
	//usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);
    
    useEffect(() => {
        if(alert.message){
            setModalQuestion(false);
            setOfferData(null);
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);

    //Form Data
    const { handleSubmit, register, errors, reset, setValue, watch } = useForm();

    //Registrar oferta
    const onCreateOffer = (data, e) => {
        if(tableProduct.length == 0){
            setModalVisible(true);
            setModalMsg('Debe ingresar un producto para la oferta');
            return;
        }
        data.user = user.id;
        data.product = tableProduct[0].id;
        data.price = tableProduct[0].offer;
        data.regularPrice = tableProduct[0].price;

        if(data.price > data.regularPrice){
            setModalVisible(true);
            setModalMsg('El precio de oferta no puede ser superior al precio actual');
            return;
        }

        if(user.role == 3){
           data.agency = user.agency.id;
        }

        setOfferData(data);
        setModalQuestion(true);
    };

    const [offerData, setOfferData] = useState(null); 

    const saveOffer = () => {
        if(offerData){
            dispatch(offerActions.createOffer( offerData ));
        } 
    } 

    //State de guardado
    const registering = useSelector(state => state.offer.registering);

    //obtener productos para select
    const getting = useSelector(state => state.products.getting);
    const products = useSelector(state => state.products);

    useEffect(() => {
        dispatch(productActions.listProducts());
    },[]);

    const [listProducts, setListProducts] = useState(null);

    useEffect(() => {
        if(products.obtained){
            setListProducts(products.list);
        }
    },[products.obtained]);

    const statusRegister = useSelector(state => state.offer);
    //Verificar si guardo y limpiar form
    useEffect(() => {
        if(statusRegister.success){
            setModalQuestion(false);
            setTableProduct([]);
            reset({
                agency:'',
                comment:''
            });
            setOfferData(null);
        }
    },[statusRegister.success]);

    //obtener sucursales para select
    const gettingAgency = useSelector(state => state.agencies.getting);
    const agencies = useSelector(state => state.agencies);
    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    },[]);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if(agencies.obtained){
            setListAgencies(agencies.list);
        }
    },[agencies.obtained]);

    const agencyWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyWatch);

    //Form resgistrar venta
    const { handleSubmit:handleSubmitProduct, register: registerProduct , errors: errorsProduct, reset:resetProduct, control:controlProduct, setValue:setValueProduct  } = useForm();
    //Tabla de productos añadidos
    const [tableProduct, setTableProduct] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalQuestion, setModalQuestion] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    //Añadir producto a tabla
    const onCreateDataProduct = (data, e) => {

        //buscar codigo de producto para añadir
        let productFilter = listProducts.filter(item => item.code === data.code);

        if(productFilter.length == 0){
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        }else{

            data.offer = data.offer.replace(/,/g, '');
            const target = {...productFilter[0]};
            const source = { offer: parseFloat(data.offer) };

             //Añadir al array de productos
            let products = tableProduct;
            products.unshift(Object.assign(target, source));
            setTableProduct(products);
            
            //focus en el codigo nuevamente
            codeRef.current.focus();
            //resetear form
            resetProduct({
                code:'',
                offer:''
            });
        }
        
    };

    //Quitar producto de lista
    const removeItem = (product) => {

        let products = tableProduct;
        const index = products.indexOf(product);
        if (index !== -1) {
            products.splice(index, 1);
            setTableProduct([...products])  
        }

    }

    const codeRef = useRef();

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
                                <h3 style={{ fontWeight:'bold',fontStyle: 'italic'}}>Crear oferta</h3>
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
                                <Form onSubmit={handleSubmitProduct(onCreateDataProduct)} className="form">
                                    <Row form>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="product">Código</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <input
                                                    disabled={tableProduct && tableProduct.length > 0 ? true: false}
                                                    type="text"
                                                    maxLength={50}
                                                    autoComplete="off"
                                                    className={'form-control' + (errorsProduct.code ? ' is-invalid' : '')}
                                                    name="code"
                                                    ref={(e) => {
                                                        registerProduct(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
                                                        codeRef.current = e;
                                                    }}
                                                />
                                                {errorsProduct.code && <div className="invalid-feedback d-block">{errorsProduct.code.message}</div>}
                                            </FormGroup>
                                           
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup>
                                                <Label for="offer">Precio de oferta</Label>
                                                <Controller
                                                disabled={tableProduct && tableProduct.length > 0 ? true: false}
                                                    name="offer"
                                                    control={controlProduct}
                                                    rules={{
                                                        validate: (value) => {
                                                            if(parseInt(value) <= 0){
                                                                return "El precio es requerido";
                                                            }
                                                        },
                                                        required: "El precio es requerido",
                                                    }}
                                                    as={<NumberFormat  className={'form-control' + (errorsProduct.offer ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsProduct.offer && <div className="invalid-feedback">{errorsProduct.offer.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={tableProduct && tableProduct.length > 0 ? true: false}>
                                            <i className="fa fa-plus-circle" aria-hidden="true"></i> Añadir
                                        </Button>
                                    </div>
                                </Form>
                                <Table striped responsive>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Precio Actual</th>
                                            <th>Precio de Oferta</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {tableProduct && tableProduct.map((product, index) => {
                                        return (
                                                <tr key={index}>
                                                    <td>{product.name}</td>
                                                    <td><NumberFormat displayType={'text'} value={product.price.toFixed(2)} thousandSeparator={true} /></td>
                                                    <td><NumberFormat displayType={'text'} value={product.offer.toFixed(2)} thousandSeparator={true} /></td>
                                                    <td>
                                                        <Button className="btn-link" color="primary" style={{margin:0, padding:0}}
                                                            onClick={e => 
                                                                {
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
                                <Form onSubmit={handleSubmit(onCreateOffer)} className="form">
                                    {/* Solo role admin y supervisor */}
                                    {(user.role == 1 || user.role == 2) && <>
                                        <FormGroup>
                                            <Label for="agency">Sucursal</Label>{' '}
                                            {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            <select className={'form-control' + (errors.agency ? ' is-invalid' : '')} name="agency"
                                                ref={register({ 
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
                                    }
                                    <Row form>
                                        <Col md={12}>  
                                            <FormGroup>
                                                <Label for="comment">Comentario</Label>
                                                <input
                                                    maxLength="150"
                                                    autoComplete="off"
                                                    className={'form-control'}
                                                    name="comment"
                                                    ref={register}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="primary" disabled={registering}>
                                            {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Guardar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => {setModalVisible(false); setModalMsg('')}} isOpen={modalVisible}>
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ofertas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
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
                                onClick={() =>  {setModalVisible(false); setModalMsg('')}}
                            >
                                Cerrar
                            </Button>
                            </div>
                        </Modal>
                        <Modal toggle={() => {setModalQuestion(false);setOfferData(null);}} isOpen={modalQuestion} backdrop="static">
                            <div className="modal-header">
                            <h5 className="modal-title" id="examplemodalMsgLabel">
                                Ofertas
                            </h5>
                            <button
                                aria-label="Close"
                                className="close"
                                type="button"
                                onClick={() =>  {setModalQuestion(false);setOfferData(null);}}
                            >
                                <span aria-hidden={true}>×</span>
                            </button>
                            </div>
                            <div className="modal-body">
                                <p>¿Seguro que desea guardar la oferta?, esta acción afectará de forma inmediata los datos financieros.</p>
                            </div>
                            <div className="modal-footer">
							<Button color="primary" disabled={registering} onClick={()=>saveOffer()}>
								{registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
								Guardar
							</Button>
							<Button color="secondary" type="button" onClick={() => {setModalQuestion(false);setOfferData(null);}} disabled={registering}>
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

export default OfferCreatePage;