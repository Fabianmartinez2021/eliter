/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, userActions, pendingPaymentsActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Collapse, InputGroup, Input, InputGroupAddon, Spinner, Badge } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import DataTable from 'react-data-table-component';
import '../../assets/css/table.css';
import '../../assets/css/options.css';
import useDebounce from '../../components/Debounce';
import moment from 'moment';
import { WeightProduct } from '../../helpers/weight'
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
  return <InputGroup style={{ "width": "200px" }}>
    <Input autoComplete="off" style={{ "height": "38px", "marginTop": "10px" }} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
    <InputGroupAddon addonType="append">
      <Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
    </InputGroupAddon>
  </InputGroup>
}

import { Typeahead, withAsync } from 'react-bootstrap-typeahead';
import { useLocation } from 'react-router-dom';

const AsyncTypeahead = withAsync(Typeahead);

function WholesaleClientUpdatePage() {

  //Modo oscuro 
  const { darkMode} = useDarkMode();
  
  const location = useLocation();
  const userState = useSelector(state => state.users.user);
  const searching = useSelector(state => state.users.searching);
  const users = useSelector(state => state.users);
  //obtener id del location state
  useEffect(() => {
      if(location.state === undefined){
          history.goBack();
      }else{
          dispatch(userActions.getWholesaleClient( location.state.id ));
      }
  }, [location]);

  useEffect(() => {
      if(users.searched){
          //  Datos del cliente

        setValue('clientCode', userState.clientCode);
        setValue('documentType', userState.documentType);
        setValue('document', userState.document);
        setValue('names', userState.names);
        setValue('businessName', userState.businessName);
        setValue('clientType', userState.clientType);
        setValue('taxpayer', userState.taxpayer);
        setValue('phone', userState.phone);
        setValue('address', userState.address);
        setValue('isSolvent', userState.isSolvent);

        
        //  Datos de la venta pendiente en caso de que sea o no solvente

        if (!userState.isSolvent){

          setTableSale(userState.pendingPayment.products);
          setTotal(userState.pendingPayment.pending);
          setTotalCreditAmmount(userState.pendingPayment.total);        
        }
        else{
          setTableSale([]);
          setTotal(0);
          setTotalCreditAmmount(0);
        }
      }
      
  },[users.searched]);

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

  //Obtener toda la data necesaria para ventas
  const sales = useSelector(state => state.sales);            //  Informacion de las ventas al Detal

  //Form resgistrar venta
  const { handleSubmit: handleSubmitSale, register: registerSale, errors: errorsSale, reset: resetSale, trigger, control: controlSale, watch, setValue, clearErrors } = useForm();

  //State de guardado
  const registering = useSelector(state => state.sales.registering);

  //Tabla de productos añadidos
  const [tableSale, setTableSale] = useState([]);
  //  Deuda pendiente
  const [total, setTotal] = useState(0);
  //  Monto total del credito 
  const [totalCreditAmmount, setTotalCreditAmmount] = useState(0);

  //Registrar venta
  const onRegisterSale = async (data, e) => {

    const validation = await trigger();

    if (!validation)
      return;
    
    dispatch(userActions.updateWholesaleClient( location.state.id, data ));

  };

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
                  <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Actualizar datos de cliente al Mayor</h3>
                  </div>
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
                  <Col md={2}>
                      <FormGroup>
                        <Label for="clientCode">Código</Label>
                        <input
                          type= "number"
                          maxLength="100"
                          autoComplete="off"
                          className={'form-control' + (errorsSale.clientCode ? ' is-invalid' : '')}
                          name="clientCode"
                          ref={(e) => {
                            //clientNamesRef.current = e;
                            registerSale(e, { required: "El código es requerido" })
                          }}
                        />
                        {errorsSale.clientCode && <div className="invalid-feedback d-block">{errorsSale.clientCode.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={1.5}>
                      <FormGroup>
                        <Label for="documentType"></Label>
                        <select
                          name="documentType"
                          className={'form-control' + (errorsSale.documentType ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
                          <option name="V" value="V">V</option>
                          <option name="J" value="J">J</option>
                          <option name="E" value="E">E</option>
                          <option name="G" value="G">G</option>
                          <option name="P" value="P">P</option>
                          <option name="R" value="R">R</option>
                        </select>
                        {errorsSale.documentType && <div className="invalid-feedback d-block">{errorsSale.documentType.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={3.5}>
                      <FormGroup>
                        <Label for="document">Documento </Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          className={'form-control' + (errorsSale.document ? ' is-invalid' : '')}
                          name="document"
                          ref={(e) => {
                            registerSale(e, { required: "El documento es requerido" })
                          }}
                        />
                        {errorsSale.document && <div className="invalid-feedback d-block">{errorsSale.document.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="names">Cliente</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          className={'form-control' + (errorsSale.names ? ' is-invalid' : '')}
                          name="names"
                          ref={(e) => {
                            //clientNamesRef.current = e;
                            registerSale(e, { required: "El cliente es requerido" })
                          }}
                        />

                        {errorsSale.names && <div className="invalid-feedback d-block">{errorsSale.names.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="businessName">Razon social</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          className={'form-control' + (errorsSale.businessName ? ' is-invalid' : '')}
                          name="businessName"
                          ref={(e) => {
                            //clientNamesRef.current = e;
                            registerSale(e, { required: "El nombre del negocio es requerido" })
                          }}
                        />
                        {errorsSale.businessName && <div className="invalid-feedback d-block">{errorsSale.businessName.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="clientType">Tipo de cliente</Label>
                        <select
                          name="clientType"
                          className={'form-control' + (errorsSale.clientType ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
                          <option name="Revendedor independiente" value="Revendedor independiente">Revendedor independiente</option>
                          <option name="Restaurante" value="Restaurante">Restaurante</option>
                          <option name="Restobar" value="Restobar">Restobar</option>
                          <option name="Comida rapida" value="Comida rapida">Comida rapida</option>
                          <option name="Charcuteria" value="Charcuteria">Charcuteria</option>
                          <option name="Abasto" value="Abasto">Abasto</option>
                          <option name="Supermercado" value="Supermercado">Supermercado</option>
                          <option name="Panaderia" value="Panaderia">Panaderia</option>
                          <option name="Pizzeria" value="Pizzeria">Pizzeria</option>
                          <option name="Delicateses" value="Delicateses">Delicateses</option>

                        </select>
                        {errorsSale.clientType && <div className="invalid-feedback d-block">{errorsSale.clientType.message}</div>}

                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="taxpayer">Contribuyente</Label>
                        <select
                          name="taxpayer"
                          className={'form-control' + (errorsSale.taxpayer ? ' is-invalid' : '')}
                          ref={registerSale({ required: true })}
                        >
                          <option name="" value=""></option>
                          <option name="Especial" value="Especial">Especial</option>
                          <option name="Ordinario" value="Ordinario">Ordinario</option>

                        </select>
                        {errorsSale.taxpayer && <div className="invalid-feedback d-block">{errorsSale.taxpayer.message}</div>}

                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="phone">Telefono</Label>
                        <input
                          maxLength="1000000"
                          autoComplete="off"
                          ref={registerSale({ required: "El teléfono es requerido" })}
                          className={'form-control' + (errorsSale.phone ? ' is-invalid' : '')}
                          name="phone"
                        />
                        {errorsSale.phone && <div className="invalid-feedback d-block">{errorsSale.phone.message}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={3}>
                      <FormGroup>
                        <Label for="isSolvent"></Label>
                          <Controller
                            name="isSolvent"
                            control={controlSale}
                            as={<Badge 
                              color={watch('isSolvent') === undefined ? 'secondary' : watch('isSolvent') === true ? "success" : "danger"}  
                              pill className="h6 p-2 mt-4">
                                  {
                                    watch('isSolvent') === undefined ? '' : watch('isSolvent') === true ? "SOLVENTE" : "PENDIENTE"
                                  }
                            </Badge> }
                          />
                          
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <FormGroup>
                        <Label for="address">Direccion</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          ref={registerSale({ required: "La direccion es requerida" })}
                          className={'form-control' + (errorsSale.address ? ' is-invalid' : '')}
                          name="address"
                        />
                        {errorsSale.address && <div className="invalid-feedback d-block">{errorsSale.address.message}</div>}
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <FormGroup>
                        <Label for="comment">Comentarios</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          ref={registerSale()}
                          className={'form-control' + (errorsSale.comment ? ' is-invalid' : '')}
                          name="comment"
                        />
                        {errorsSale.comment && <div className="invalid-feedback d-block">{errorsSale.comment.message}</div>}
                      </FormGroup>
                    </Col>
                  </Row>
                  <Table striped responsive>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>kg/unidades</th>
                        <th>Sub total $</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableSale && tableSale.map((product, index) => {
                        return (
                          <tr key={index}>
                            <td>{product.name}</td>
                            <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                            <td><NumberFormat value={product.totalDollars.toFixed(2)} displayType={'text'} thousandSeparator={true} /></td>
                          </tr>
                        )
                      })
                      }
                    </tbody>
                  </Table>
                  <Row>
                    <Col className="text-right" style={{ margin: 0 }}>
                      <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginRight: 10, marginLeft: 10 }}>Total: {' '}$<NumberFormat value={totalCreditAmmount.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                        <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                          <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>Pendiente: {' '}$<NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} /></b>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                   
                    <Row>
                      <Col>
                        <Button color="primary" disabled={watch('isSolvent') === false}>
                          {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                          Guardar
                        </Button>{' '}
                      </Col>
                      <Col>
                        <div className="pull-right">
                          <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
                        </div>
                      </Col>
                    </Row>
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

export default WholesaleClientUpdatePage;