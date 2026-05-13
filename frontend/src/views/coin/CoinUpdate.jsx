import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { coinActions } from '../../actions';
// core components
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Spinner } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import { useLocation } from "react-router-dom";
import NumberFormat from 'react-number-format';
import { useDarkMode} from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css"; // Importa los estilos

function CoinUpdatePage() {

    //Modo oscuro 
    const { darkMode} = useDarkMode();
    
    const location = useLocation();

    const dispatch = useDispatch();
    const coinsState = useSelector(state => state.coin);
    const searching = useSelector(state => state.coins ? state.coins.searching : false);
    const [coin, setCoin] = useState(null);

    useEffect(() => {
        if(location.state === undefined){
            history.goBack();
        } else {
            dispatch(coinActions.getCoin(location.state.id));
        }
    }, [location, dispatch]);

    useEffect(() => {
        if (coinsState && coinsState.coin) {
            setCoin(coinsState.coin); // Establecer la moneda en el estado
        }
    }, [coinsState]);

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    const user = useSelector(state => state.authentication.user);
    const alert = useSelector(state => state.alert);
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);
    const { handleSubmit,  errors, control } = useForm();

    const onUpdateData = (data, e) => {
        data.user = user.id;
        data.username = user.username
        data.name = coin.name;  

        dispatch(coinActions.updateCoin(location.state.id, data, user));
    };

    const updating = useSelector(state => state.coins ? state.coins.updating : false);
    const coins = useSelector(state => state.coins);

    useEffect(() => {
        if(coins && coins.success){
            setCoin(coins.coinUpdated);
        }
    }, [coins]);

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
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Actualizar moneda</h3>
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
                                    {searching && <div className="d-flex justify-content-center"><Spinner color="primary" /></div>}
                                    {coin &&
                                        <Form onSubmit={handleSubmit(onUpdateData)} className="form">
                                            <Row form>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="name">Nombre</Label>
                                                        <input
                                                            maxLength="100"
                                                            autoComplete="off"
                                                            className="form-control-plaintext"
                                                            name="name"
                                                            defaultValue={coin.name} // Asegúrate de acceder a coin.name
                                                            readOnly
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                            <Row form>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label for="value">Valor</Label>
                                                        <Controller
                                                            name="value"
                                                            control={control}
                                                            defaultValue={coin ? coin.value : 0} // Asegúrate de que coin.value esté definido
                                                            rules={{
                                                                required: "El valor es requerido",
                                                                min: {
                                                                    value: 0,
                                                                    message: "El valor no puede ser negativo"
                                                                }
                                                            }}
                                                            as={<NumberFormat className={'form-control' + (errors.value ? ' is-invalid' : '')} thousandSeparator={true} />}
                                                        />
                                                        {errors.value && <div className="invalid-feedback">{errors.value.message}</div>}
                                                    </FormGroup>
                                                </Col>
                                            </Row>
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

export default CoinUpdatePage;
