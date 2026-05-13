/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { userActions } from '../../actions';
// reactstrap components
import { Col, Row, Button, Form, FormGroup, Label, Container, NavItem, NavLink, Nav, Card, CardHeader, CardBody, TabContent, TabPane, Alert } from 'reactstrap';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { useForm  } from "react-hook-form";

function ProfilePage() {
    const authUser = useSelector(state => state.authentication.user);
    const [user, setUser] = useState(authUser);

    //State de actualizacion
    const updating = useSelector(state => state.users.updating);
    const users = useSelector(state => state.users);

    //Alertas
    const alert = useSelector(state => state.alert);
    const dispatch = useDispatch();

    const location = useLocation();
    const [plainTabs, setPlainTabs] = useState(location.state?.tab === 'datos' ? '1' : '1');

    React.useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    //Mostrar alertas
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);
    
    useEffect(() => {
        if(alert.message){
            setVisible(true); 
            window.setTimeout(()=>{setVisible(false)},5000);   
        }
    },[alert]);

    //Tras guardar: usar el usuario de Redux (authUser) que ya tiene la agencia preservada
    useEffect(() => {
        if (users.success && users.userUpdated) {
            const agency = authUser?.agency ?? users.userUpdated?.agency;
            setUser({ ...users.userUpdated, ...(agency != null && { agency }) });
            resetPass();
        }
    }, [users.success]); // authUser del render actual (con merge aplicado) se usa en el closure

    //Form Data
    const { handleSubmit, register, errors, reset } = useForm();

    //Form Password
    const { handleSubmit: handleSubmitPass, register: registerPass, errors: errorsPass, reset: resetPass, watch } = useForm();
    let pwd = watch("password");

    const onUpdateData = (data, e) => {
        const agency = user?.agency ?? authUser?.agency;
        const payload = {
            ...data,
            ...(agency != null && { agency: agency?.id ?? agency }),
        };
        dispatch(userActions.update(user.id, payload));
    };

    //Actualizar data contraseña
    const onUpdatePassword = (data, e) => {
        dispatch(userActions.update(user.id, data ));
    };

    return (
        <>
            <div className="d-flex" id="wrapper">
            <SideBar/>
                <div id="page-content-wrapper">
                    <AdminNavbar/>
                    <div className="container-fluid">
                        <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <Card className="card-nav-tabs card-plain">
                                    <CardHeader className="card-header-danger">
                                        <div className="nav-tabs-navigation">
                                            <div className="nav-tabs-wrapper">
                                            <Nav data-tabs="tabs" tabs>
                                                <NavItem>
                                                <NavLink
                                                    className={plainTabs === "1" ? "active" : ""}
                                                    href="#"
                                                    onClick={e => {
                                                        reset();
                                                        resetPass();
                                                        setVisible(false);
                                                        e.preventDefault();
                                                        setPlainTabs("1");
                                                    }}
                                                >
                                                    Datos
                                                </NavLink>
                                                </NavItem>
                                                <NavItem>
                                                <NavLink
                                                    className={plainTabs === "2" ? "active" : ""}
                                                    href="#"
                                                    onClick={e => {
                                                        reset();
                                                        resetPass();
                                                        setVisible(false);
                                                        e.preventDefault();
                                                        setPlainTabs("2");
                                                    }}
                                                >
                                                    Acceso
                                                </NavLink>
                                                </NavItem>
                                            </Nav>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        <TabContent
                                            activeTab={"plainTabs" + plainTabs}
                                        >
                                            <TabPane tabId="plainTabs1">
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
                                                <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                                    <Row form>
                                                        <Col md={6}>  
                                                            <FormGroup>
                                                                <Label for="username">Nombre de usuario</Label>
                                                                <input
                                                                    className="form-control-plaintext"
                                                                    defaultValue={user.username}
                                                                    id="staticusername"
                                                                    readOnly={true  }
                                                                    type="text"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Row form>
                                                        <Col md={6}>
                                                        <FormGroup>
                                                            <Label for="firstName">Nombres</Label>
                                                            <input
                                                                maxLength="100"
                                                                autoComplete="off"
                                                                className={'form-control' + (errors.firstName ? ' is-invalid' : '')}
                                                                name="firstName"
                                                                ref={register({
                                                                    required: "El nombre es requerido",
                                                                })}
                                                                defaultValue={user.firstName}
                                                            />
                                                            {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
                                                        </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                        <FormGroup>
                                                            <Label for="lastName">Apellidos</Label>
                                                            <input
                                                                maxLength="100"
                                                                autoComplete="off"
                                                                className={'form-control' + (errors.lastName ? ' is-invalid' : '')}
                                                                name="lastName"
                                                                ref={register({
                                                                    required: "El apellido es requerido",
                                                                })}
                                                                defaultValue={user.lastName}
                                                            />
                                                            {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
                                                        </FormGroup>
                                                        </Col>
                                                    </Row>
                                                    <Button color="primary" disabled={updating}>
                                                        {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                        Actualizar
                                                    </Button>
                                                </Form>
                                            </TabPane>
                                            <TabPane tabId="plainTabs2">
                                                {alert.message &&
                                                    <Alert color={`alert ${alert.type}`} isOpen={visible} fade={true}>
                                                        <div className="container">
                                                            {alert.message}
                                                            <button type="button" className="close" aria-label="Close" onClick={onDismiss}>
                                                                <span aria-hidden="true">
                                                                    <i className="now-ui-icons ui-1_simple-remove"></i>
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </Alert>
                                                }
                                                <Form onSubmit={handleSubmitPass(onUpdatePassword)} className="form">
                                                    <FormGroup>
                                                        <label htmlFor="password">Contraseña</label>
                                                        <input
                                                            maxLength="20"
                                                            className={'form-control' + (errorsPass.password ? ' is-invalid' : '')}
                                                            name="password"
                                                            type="password"
                                                            ref={registerPass({
                                                                required: "La contraseña es requerida",
                                                                minLength:{ value:6, message: "La contraseña debe contener mínimo 6 caracteres"}
                                                            })}
                                                        />
                                                        {errorsPass.password && <div className="invalid-feedback">{errorsPass.password.message}</div>}
                                                    </FormGroup>
                                                    <FormGroup>
                                                        <label htmlFor="confirm_password">Confirmar contraseña</label>
                                                        <input
                                                            maxLength="20"
                                                            className={'form-control' + (errorsPass.confirm_password ? ' is-invalid' : '')}
                                                            name="confirm_password"
                                                            type="password"
                                                            ref={registerPass({
                                                                required: "La confirmación de contraseña es requerida",
                                                                validate: value => value === pwd || "Las contraseñas no coinciden"
                                                            })}
                                                        />
                                                        {errorsPass.confirm_password && <div className="invalid-feedback">{errorsPass.confirm_password.message}</div>}
                                                    </FormGroup>
                                                    <Button color="primary" disabled={updating}>
                                                        {updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                        Actualizar
                                                    </Button>
                                                </Form>
                                            </TabPane>
                                        </TabContent>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                            </Container>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProfilePage;