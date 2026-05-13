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
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; 

//Componente filtro
const FilterComponent = ({ filterText, onFilter, onClear }) => {
  return <InputGroup style={{ "width": "200px" }}>
    <Input autoComplete="off" style={{ "height": "38px", "marginTop": "10px" }} id="search" type="text" placeholder="Buscar" value={filterText} onChange={onFilter} />
    <InputGroupAddon addonType="append">
      <Button onClick={onClear} color="primary"><i className="fa fa-times" aria-hidden="true"></i></Button>
    </InputGroupAddon>
  </InputGroup>
}

function WholesaleClientRegisterPage() {
  
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
    if (alert.message) {
      setVisible(true);
      window.setTimeout(() => { setVisible(false) }, 5000);
    }
  }, [alert]);

  //Form resgistrar venta
  const { handleSubmit: handleSubmitSale, register: registerSale, errors: errorsSale, reset: resetSale, trigger, control: controlSale, watch, setValue, clearErrors } = useForm();

  //State de guardado
  const registering = useSelector(state => state.sales.registering);

  //Registrar venta
  const onRegisterSale = async (data, e) => {

    data.agency = user.agency.id;
    data.isSolvent = true;

    dispatch(userActions.createWholesaleClient( user.id, data ));
  };

  //Estado del registro
  const success = useSelector(state => state.users.success);

  useEffect(() => {
    if (success) {
      resetSale({ documentType: '', document: '', clientCode: '', names: '', businessName: '', clientType: '', taxpayer: '', phone: '', address: '', referenciePoint: '', comment: ''});
   }
  }, [success]);

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
                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Crear nuevo cliente al Mayor</h3>
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
                  {/* <Col md={2}>
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
                    </Col> */}
                    <Col md={1.5}>
                      <FormGroup>
                        <Label for="documentType">T Doc.</Label>
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
                        <Label for="referenciePoint">Punto de referencia</Label>
                        <input
                          maxLength="100"
                          autoComplete="off"
                          ref={registerSale({ required: "El punto de referencia es requerido" })}
                          className={'form-control' + (errorsSale.referenciePoint ? ' is-invalid' : '')}
                          name="referenciePoint"
                        />
                        {errorsSale.referenciePoint && <div className="invalid-feedback d-block">{errorsSale.referenciePoint.message}</div>}
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
                  <Form onSubmit={handleSubmitSale(onRegisterSale)}>
                    <Row>
                      <Col>
                        <Button color="primary" >
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

export default WholesaleClientRegisterPage;