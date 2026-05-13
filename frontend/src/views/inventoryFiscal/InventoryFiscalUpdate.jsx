/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from "react-router-dom";
import { productActions, agencyActions } from '../../actions';
import { inventoryFiscalActions } from '../../actions/inventoryFiscal.actions';
import { invoiceActions } from '../../actions/invoice.actions'; 
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Input  } from 'reactstrap';
import { useForm, Controller  } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import moment from 'moment';
import "../../assets/css/darkMode.css";

function InventoryFiscalUpdate() {

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

    const location = useLocation();
    const dataInvoice = useSelector((state) => state.invoice.invoice);
    const [tableProduct, setTableProduct] = useState([]);


    //usuario
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    //Alertas
    const alert = useSelector(state => state.alert);
    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    //obtener sede del state
    const [invoice, setInvoice] = useState(null);

    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        }else{
            dispatch(invoiceActions.getInvoiceById( location.state.id ));
            
        }
    }, [location]);

    useEffect(() => {
        setInvoice(dataInvoice); 
    },[dataInvoice]);

    useEffect(() => {
      if (invoice?.products) {
        const loaded = invoice.products.map((product) => ({
          applyWholesaleDiscount: product.applyWholesaleDiscount ?? false,
          code: product.code ?? '',
          createdDate: product.createdDate ?? null,
          decrease: product.decrease ?? false,
          exempt: product.exempt ?? false,
          id: product.id ?? '',
          image: product.image ?? null,
          kg: product.kg ?? 0,
          lastPrice: product.lastPrice ?? 0,
          lastWholesalePrice: product.lastWholesalePrice ?? 0,
          minWeight: product.minWeight ?? 0,
          minWeightWholesaleDiscount: product.minWeightWholesaleDiscount ?? 0,
          mincemeat: product.mincemeat ?? false,
          name: product.name ?? '',
          presentation: product.presentation ?? '',
          price: product.price ?? 0,
          reweigh: product.reweigh ?? false,
          taxed: product.taxed ?? false,
          updateDate: product.updateDate ?? null,
          wholesaleDiscountPrice: product.wholesaleDiscountPrice ?? 0,
          wholesalePrice: product.wholesalePrice ?? 0,
          _id: product._id ?? '',
          unitPrice: product.taxed
            ? ((product.price / 1.16) / 1.3).toFixed(2)
            : (product.price / 1.3).toFixed(2),
        }));
    
        setTableProduct(loaded);
        const total = loaded.reduce((sum, item) => sum + parseFloat(item.kg || 0), 0);
        setTotalKg(total);
      }
    }, [invoice]);

    
    useEffect(() => {
        if(alert.message){
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);

    //Form Data
    const { handleSubmit, register, errors, reset, control, setValue: setHeadFormValue, watch: watchHeadForm } = useForm({});
    
    //Form resgistrar venta
    const { handleSubmit:handleSubmitSale, register: registerSale , errors: errorsSale, reset:resetSale, control:controlSale, watch, setValue, clearErrors  } = useForm();
    const { handleSubmit:handleSubmitChange, register: registerChange , errors: errorsChange, reset:resetChange, control:controlChange, watch:watchChange  } = useForm();
    
    const statusRegister = useSelector(state => state.inventoriesFiscal);
     
    //State de guardado
    const registering = useSelector(state => state.inventoriesFiscal.registering);

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

    const agencyWatch = watchHeadForm('agency');
    useSyncFirstAgencyFormField(listAgencies, setHeadFormValue, agencyWatch);

    //Form resgistrar venta
    const { handleSubmit:handleSubmitProduct, register: registerProduct , errors: errorsProduct, reset:resetProduct, control:controlProduct, setValue:setValueProduct  } = useForm();
    //Tabla de productos añadidos
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    const [totalKg, setTotalKg] = useState(0);

   
    const formattedDate = moment(invoice?.date).format('DD/MM/YYYY');

    //Registrar data
    const onUpdateData = (data, e) => {
        dispatch(invoiceActions.updateInvoice( location.state.id, data, user ));
    };

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
                        <h3 style={{ fontWeight:'bold', fontStyle: 'italic' }}>Editar factura de compra</h3>
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
                                <Col>
                                    <FormGroup className="mr-3">
                                        <Label for="controlNumber">Numero de factura</Label>
                                        <input 
                                            type="controlNumber"
                                            name="controlNumber"
                                            id="controlNumber"
                                            className='form-control'
                                            placeholder="Ingrese el numero de factura"
                                            style={{width: '60%'}}
                                            ref={(e) => register(e, { required: 'El numero de control es requerido' })}
                                            defaultValue={invoice?.controlNumber}
                                        />
                                        {errors.controlNumber && (
                                        <div className="invalid-feedback d-block">
                                            {errors.controlNumber.message}
                                        </div>)}
                                    </FormGroup>
                                </Col>
                                <Col>
                                    <FormGroup className="mr-3">
                                    <Label 
                                    for="date"
                                    style={{ marginLeft:'190px'}}
                                        >Fecha de emisión</Label>
                                    <input
                                        name="date"
                                        id="date"
                                        className='form-control'
                                        style={{width:'50%', marginLeft:'190px'}}
                                        ref={(e) => register(e, { required: 'La fecha es requerida' })}
                                        defaultValue={formattedDate}
                                        disabled={true} 
                                    />
                                    {errors.date && (
                                        <div 
                                          style={{width:'50%', marginLeft:'190px'}}
                                          className="invalid-feedback d-block">
                                            {errors.date.message}
                                        </div>)}
                                    </FormGroup>
                                </Col>
                            </Row>
                          <Row form>
                          <Col md={1.5}>
                                <FormGroup>
                                  <Label for="documentType">V, J, E...</Label>
                                  <select
                                    name="documentType"
                                    className='form-control'
                                      ref={register({ required: true })}
                                      defaultValue={invoice?.documentType}
                                  >
                                    <option name="J" value="J">J</option>
                                    <option name="V" value="V">V</option>
                                    <option name="E" value="E">E</option>
                                    <option name="G" value="G">G</option>
                                    <option name="P" value="P">P</option>
                                    <option name="R" value="R">R</option>
                                  </select>
                                  {errors.documentType && <div className="invalid-feedback d-block">{errors.documentType.message}</div>}
                                </FormGroup>
                              </Col>
                            <Col md={4}>
                            <FormGroup>
                                <Label for="document">Documento</Label>
                                <input
                                    type="number" // Puedes cambiar a "text" si es necesario
                                    name="document"
                                    id="document"
                                    className='form-control'
                                    placeholder="Ingrese el documento"
                                    ref={(e) => register(e, { required: "El documento  es requerido" })}
                                    defaultValue={invoice?.document}
                                />
                                {errors.document && (
                                    <div className="invalid-feedback d-block">
                                    {errors.document.message || "El documento es requerido"}
                                    </div>
                                )}
                            </FormGroup>
                              </Col>
                              <Col md={6}>
                                <FormGroup>
                                    <Label for="names"
                                    style={{marginLeft:'45px'}}
                                        >Nombre o Razon social</Label>
                                    <input
                                      maxLength="100"
                                      autoComplete="off"
                                      placeholder="Ingrese el nombre o razon social"
                                      className={'form-control' + (errors.names ? ' is-invalid' : '')}
                                      style={{marginLeft:'45px'}}
                                      name="names"
                                      ref={(e) => {
                                          //clientNamesRef.current = e;
                                          register(e, { required: "El cliente es requerido" })
                                      }}
                                      defaultValue={invoice?.names}
                                    />

                                    {errors.names && <div  
                                    style={{marginLeft:'45px'}}
                                    
                                    className="invalid-feedback d-block">{errors.names.message}</div>}
                                </FormGroup>
                            </Col>
                                
                            </Row>
                            <Row form>
                              <Col>
                                <FormGroup>
                                  <Label for="address">Dirección</Label>
                                  <input
                                    placeholder="Ingrese la direccion"
                                    maxLength="100"
                                    autoComplete="off"
                                    ref={register({ required: "La direccion es requerida" })}
                                    className={'form-control'}
                                    name="address"
                                    defaultValue={invoice?.address}
                                  />
                                  {errors.address && <div className="invalid-feedback d-block">{errors.address.message}</div>} 
                                </FormGroup>
                              </Col>
                            </Row>
                                {/* <Form onSubmit={handleSubmitProduct(onCreateDataProduct)} className="form">
                                    
                                    <Row form>
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="product">Código</Label>{' '}
                                                {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                <input
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
                                        <Col md={4}>
                                            <FormGroup>
                                                <Label for="kg">Kg/Unidades</Label>
                                                <Controller
                                                    name="kg"
                                                    control={controlProduct}
                                                    rules={{
                                                        min: {
                                                            value: 0.000,
                                                            message: "El peso es requerido"
                                                        },
                                                        pattern: {
                                                            value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                            message: "Ingresa un peso válido"
                                                        },
                                                        setValueAs: (value) => {

                                                            return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                        },
                                                        // required: "El peso es requerido",
                                                    }}
                                                    as={<NumberFormat  className={'form-control' + (errorsProduct.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                />
                                                {errorsProduct.kg && <div className="invalid-feedback">{errorsProduct.kg.message}</div>}
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <div className="d-flex justify-content-between">
                                        <Button color="info">
                                            <i className="fa fa-plus-circle" aria-hidden="true"></i> Añadir
                                        </Button>
                                    </div>

                                </Form> */}

                                

                                <Table striped responsive bordered hover className={`mb-4 ${darkMode ? 'dark-mode' : ''}`}>
                                  <thead className=" text-end">
                                    <tr>
                                      <th>Kg/Unidades</th>
                                      <th>Producto</th>
                                      <th>Precio unitario</th>
                                      <th>Sub-total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tableProduct &&
                                      tableProduct.map((product, index) => {
                                        const status = product.exempt
                                          ? "E"
                                          : product.taxed
                                          ? "G"
                                          : "-";

                                          const unitPrice = product.unitPrice || 0
                                        return (
                                          <tr key={index}>
                                            <td>
                                              <NumberFormat
                                                displayType={"text"}
                                                value={product.kg.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                thousandSeparator={true}
                                              />
                                            </td>
                                            <td>{product.name} ({status})</td>
                                            <td>
                                              {unitPrice.toLocaleString("en-US", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}
                                            </td>
                                            <td>{(product.kg * unitPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            {/* <td>
                                              <Button
                                                className="btn-link"
                                                color="primary" 
                                                style={{margin:0, padding:0}}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  removeItem(product);
                                                }}
                                              >
                                                <i className="fa fa-times-circle"></i>
                                              </Button>
                                            </td> */}
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </Table>

                                {invoice?.totals && (
                                  <div className="d-flex justify-content-end mt-3">
                                    <Table bordered className={`w-50 ${darkMode ? 'dark-mode' : ''}`}>
                                      <tbody>
                                        <tr>
                                          <th className="text-end">Exento</th>
                                          <td className="text-end">
                                            {invoice?.totals.exempt.toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th className="text-end">Base imponible</th>
                                          <td className="text-end">
                                            {invoice?.totals.taxableBase.toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th className="text-end">IVA 16%</th>
                                          <td className="text-end">
                                            {invoice?.totals.iva.toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th className="text-end">Monto total</th>
                                          <td className="text-end">
                                            {invoice?.totals.totalAmount.toLocaleString("en-US", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </Table>
                                  </div>
                                )}


                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                    {/* Solo role admin y supervisor */}
                                    {(user.role == 1 || user.role == 2 || user.role == 9) && <>
                                      <FormGroup>
                                          <Label for="agency">Sucursal</Label>{' '}
                                          {gettingAgency && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                          {/* <select
                                              className={'form-control' + (errors.agency ? ' is-invalid' : '')}
                                              name="agency"
                                              ref={register({
                                                  required: "La sucursal es requerida"
                                              })}
                                              defaultValue={invoice?.agency?.id || ''}
                                          >
                                              <option key="" name="" value="">Seleccione una sucursal</option>
                                              {listAgencies && listAgencies.map(list =>
                                                  <option
                                                      key={list.id}
                                                      name={list.id}
                                                      value={list.id}
                                                  >
                                                      {list.name}
                                                  </option>
                                              )}
                                          </select> */}
                                             <input
                                                placeholder="Ingrese la sucursal"
                                                maxLength="100"
                                                autoComplete="off"
                                                ref={register({ required: "La sucursal es requerida" })}
                                                className={'form-control'}
                                                name="agency"
                                                defaultValue={invoice?.agency?.name}
                                                disabled={true}
                                              />
                                          {errors.agency && <div className="invalid-feedback d-block">{errors.agency.message}</div>}
                                      </FormGroup>

                                    </>
                                    }
                                    <div className="d-flex justify-content-end mt-3 align-items-center">
                                      <strong className="h5 mr-3">Total:</strong>
                                      <span className="h5">{totalKg.toFixed(2)} kg</span>
                                    </div>

                                    <div className="d-flex justify-content-between">
                                        <Button color="info" disabled={registering} >
                                            {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Actualizar
                                        </Button>
                                        <Button onClick={e =>{e.preventDefault(); history.goBack();} }>Cancelar</Button>
                                    </div>
                                </Form>
                            </Col>
                        </Row>
                        </Container>

                    </div>

                </div>
            </div>
        </>
    );
}

export default InventoryFiscalUpdate;