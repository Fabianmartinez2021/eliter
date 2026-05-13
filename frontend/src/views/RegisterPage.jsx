/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userActions } from '../actions';
// reactstrap components
import {
    Button,
    Form,
    Container,
    Col,
    Row,
    Alert
} from "reactstrap";
// core components
import ExamplesNavbar from "../components/Navbars/ExamplesNavbar";
import TransparentFooter from "../components/Footers/TransparentFooter";

function RegisterPage() {
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        username: '',
        password: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const registering = useSelector(state => state.registration.registering);
    const alert = useSelector(state => state.alert);
    const dispatch = useDispatch();

    // reset login status
    useEffect(() => {
        dispatch(userActions.logout());
    }, []);

    const [visible, setVisible] = useState(true);

    const onDismiss = () => setVisible(false);
    
    useEffect(() => {
        if(alert.message){
			setVisible(true);
		}
    },[alert]);

    function handleChange(e) {
        const { name, value } = e.target;
        setUser(user => ({ ...user, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();

        setSubmitted(true);
        if (user.firstName && user.lastName && user.username && user.password) {
            dispatch(userActions.register(user));
        }
    }

    React.useEffect(() => {
        document.body.classList.add("signup-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    return (
        <>
		<ExamplesNavbar />
        <div className="page-header header-filter" filter-color="black">
            <div
                className="page-header-image"
                style={{
                    backgroundImage: "url(../src/assets/img/bg18.jpg)"
                }}
            ></div>
            <div className="content">
                <Container>
                    <Row>
                        <div className="ml-auto mr-auto col-md-6 col-lg-4">
                            <div className="info info-horizontal">
                                <div className="icon icon-info">
                                    <i className="now-ui-icons media-2_sound-wave"></i>
                                </div>
                                <div className="description"><h5 className="info-title">Marketing</h5>
                                <p className="description">We've created the marketing campaign of the website. It was a very interesting collaboration.</p>
                                </div>
                            </div>
                            <div className="info info-horizontal">
                                <div className="icon icon-info">
                                    <i className="now-ui-icons media-1_button-pause"></i>
                                </div>
                                <div className="description">
                                    <h5 className="info-title">Fully Coded in React 16</h5>
                                    <p className="description">We've developed the website with React 16 and CSS3. The client has access to the code using GitHub.</p>
                                </div>
                            </div>
                            <div className="info info-horizontal">
                                <div className="icon icon-info">
                                    <i className="now-ui-icons users_single-02"></i>
                                </div>
                                <div className="description">
                                    <h5 className="info-title">Built Audience</h5>
                                    <p className="description">There is also a Fully Customizable CMS Admin Dashboard for this product.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mr-auto col-md-6 col-lg-4">
                            <div className="card-signup card">
                                <div className="card-body">
                                    {alert.message &&
                                        <Alert color={`alert ${alert.type}`} isOpen={visible} toggle={onDismiss} fade={false}>
                                            {alert.message}
                                        </Alert>
                                    }
                                    <h4 className="text-center card-title">Registro</h4>
                                    <Form name="form" onSubmit={handleSubmit} className="form">
                                        <div className="form-group text-justify">
                                            <label>Nombres</label>
                                            <input type="text" name="firstName" value={user.firstName} onChange={handleChange} className={'form-control' + (submitted && !user.firstName ? ' is-invalid' : '')} />
                                            {submitted && !user.firstName &&
                                                <div className="invalid-feedback">El nombre es requerido</div>
                                            }
                                        </div>
                                        <div className="form-group text-justify">
                                            <label className="">Apellidos</label>
                                            <input type="text" name="lastName" value={user.lastName} onChange={handleChange} className={'form-control' + (submitted && !user.lastName ? ' is-invalid' : '')} />
                                            {submitted && !user.lastName &&
                                                <div className="invalid-feedback">El apellido es requerido</div>
                                            }
                                        </div>
                                        <div className="form-group text-justify">
                                            <label>Nombre de usuario</label>
                                            <input type="text" name="username" autoComplete="off" value={user.username} onChange={handleChange} className={'form-control' + (submitted && !user.username ? ' is-invalid' : '')} />
                                            {submitted && !user.username &&
                                                <div className="invalid-feedback">Nombre de usuario requerido</div>
                                            }
                                        </div>
                                        <div className="form-group text-justify">
                                            <label>Contraseña</label>
                                            <input type="password" name="password" value={user.password} onChange={handleChange} className={'form-control' + (submitted && !user.password ? ' is-invalid' : '')} />
                                            {submitted && !user.password &&
                                                <div className="invalid-feedback">Contraseña requerida</div>
                                            }
                                        </div>
                                        <div className="send-button">
                                        <Button
                                            className="btn-round"
                                            color="info"
                                            size="lg"
                                        >
                                            {registering && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                            Registarse
                                        </Button>
                                        </div>
                                        <Link to="/login" className="btn btn-link">Cancelar</Link>
                                    </Form>
                                </div>
                            </div>
                        </div>
                    </Row>
                </Container>
            </div>
            <TransparentFooter />
        </div>
		</>
    );
}

export { RegisterPage };