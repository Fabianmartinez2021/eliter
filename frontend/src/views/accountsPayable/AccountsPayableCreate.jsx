/* eslint-disable */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { productActions, agencyActions, accountsPayableActions } from '../../actions';
import { productService } from '../../services';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar"
import { Col, Row, Button, Form, FormGroup, Label, Container, Alert, Table, Modal, Input } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { useSyncFirstAgencyFormField } from '../../hooks/useSyncFirstAgency';
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { getCatalogUnitPriceBsUsd } from '../../helpers/catalogPriceDisplay';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import '../../assets/css/table.css';

function AccountsPayableCreatePage() {

    useEffect(() => {
        document.body.classList.add("landing-page");
        document.body.classList.add("sidebar-collapse");
        document.documentElement.classList.remove("nav-open");
        return function cleanup() {
            document.body.classList.remove("landing-page");
            document.body.classList.remove("sidebar-collapse");
        };
    });

    const { darkMode } = useDarkMode();
    const user = useSelector(state => state.authentication.user);
    const dispatch = useDispatch();

    const alert = useSelector(state => state.alert);
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (!alert.message) return;
        setVisible(true);
        const id = window.setTimeout(() => { setVisible(false); }, 5000);
        return () => clearTimeout(id);
    }, [alert]);

    const { handleSubmit, register, errors, reset, control, setValue, watch } = useForm();

    const onCreateData = (data) => {
        if (tableProduct.length === 0) {
            setModalVisible(true);
            setModalMsg('Debe ingresar al menos un producto');
            return;
        }
        const supplierName = (data.supplierName || '').trim();
        const payload = {
            user: user.id,
            typeIn: 'externProvider',
            supplierName,
            products: tableProduct,
            note: data.note,
            comment: data.comment || '',
            amount: data.amount != null && data.amount !== '' ? parseFloat(String(data.amount).replace(/,/g, '')) : undefined,
            dueDate: data.dueDate || null,
            invoiceRef: data.invoiceRef || '',
        };

        if (user.role === 3) {
            payload.agency = user.agency.id;
        } else if (data.agency) {
            // Los IDs de MongoDB son hex de 24 caracteres; parseInt trunca y rompe el match con la sucursal.
            payload.agency = data.agency;
        }

        dispatch(accountsPayableActions.createAccountsPayable(payload));
    };

    const registering = useSelector(state => state.accountsPayable.registering);
    const getting = useSelector(state => state.products.getting);
    const products = useSelector(state => state.products);

    useEffect(() => {
        dispatch(productActions.listProducts());
    }, [dispatch]);

    const [listProducts, setListProducts] = useState(null);

    useEffect(() => {
        if (products.obtained) {
            setListProducts(products.list);
        }
    }, [products.obtained]);

    const [catalogModalOpen, setCatalogModalOpen] = useState(false);
    const [catalogFilterText, setCatalogFilterText] = useState('');
    const [catalogType, setCatalogType] = useState('products');
    const [catalogCombos, setCatalogCombos] = useState([]);
    const focusKgAfterCatalogCloseRef = useRef(false);
    const kgInputRef = useRef();

    useEffect(() => {
        productService.combosGetAll()
            .then((res) => {
                const arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
                setCatalogCombos(arr);
            })
            .catch(() => setCatalogCombos([]));
    }, []);

    const catalogRowsFiltered = useMemo(() => {
        const list = Array.isArray(listProducts) ? listProducts : [];
        const q = (catalogFilterText || '').trim().toLowerCase();
        const comboCodeSet = new Set((catalogCombos || []).map((c) => String(c?.code ?? '').trim()).filter(Boolean));
        const comboNameSet = new Set((catalogCombos || []).map((c) => String(c?.name ?? '').trim()).filter(Boolean));

        const isComboByCatalog = (p) => {
            const code = String(p?.code ?? '').trim();
            const name = String(p?.name ?? '').trim();
            return (code && comboCodeSet.has(code)) || (name && comboNameSet.has(name));
        };

        const byType = catalogType === 'combos' ? list.filter(isComboByCatalog) : list.filter((p) => !isComboByCatalog(p));

        if (!q) return byType;
        return byType.filter((p) => {
            const codeStr = String(p.code ?? '').toLowerCase();
            const nameStr = p.name ? String(p.name).toLowerCase() : '';
            return codeStr.includes(q) || nameStr.includes(q);
        });
    }, [listProducts, catalogFilterText, catalogType, catalogCombos]);

    const statusRegister = useSelector(state => state.accountsPayable);
    useEffect(() => {
        if (statusRegister.success) {
            setTableProduct([]);
            reset({
                supplierName: '',
                agency: '',
                note: '',
                comment: '',
                amount: '',
                dueDate: '',
                invoiceRef: '',
            });
        }
    }, [statusRegister.success, reset]);

    const gettingAgency = useSelector(state => state.agencies.getting);
    const agencies = useSelector(state => state.agencies);
    useEffect(() => {
        dispatch(agencyActions.listAgencies());
    }, [dispatch]);

    const [listAgencies, setListAgencies] = useState(null);

    useEffect(() => {
        if (agencies.obtained) {
            setListAgencies(agencies.list);
        }
    }, [agencies.obtained]);

    const agencyWatch = watch('agency');
    useSyncFirstAgencyFormField(listAgencies, setValue, agencyWatch);

    const { handleSubmit: handleSubmitProduct, register: registerProduct, errors: errorsProduct, reset: resetProduct, control: controlProduct, setValue: setValueProduct, clearErrors: clearProductLineErrors } = useForm();
    const [tableProduct, setTableProduct] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');

    const selectProductFromCatalog = (product) => {
        setValueProduct('code', String(product.code ?? ''));
        clearProductLineErrors('code');
        focusKgAfterCatalogCloseRef.current = true;
        setCatalogModalOpen(false);
        setCatalogFilterText('');
    };

    const onCatalogModalClosed = () => {
        if (!focusKgAfterCatalogCloseRef.current) return;
        focusKgAfterCatalogCloseRef.current = false;
        requestAnimationFrame(() => {
            const el = kgInputRef.current;
            if (el) {
                el.focus();
                try { el.select(); } catch (e) { /* noop */ }
            }
        });
    };

    const onCreateDataProduct = (pdata) => {
        const codeInput = String(pdata.code ?? '').trim();
        let productFilter = listProducts.filter(item => String(item.code ?? '').trim() === codeInput);

        if (productFilter.length === 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
        } else {
            const first = productFilter[0];
            if (first.presentation === 'Unidades' && pdata.kg != Math.round(pdata.kg)) {
                setModalVisible(true);
                setModalMsg(first.name + ' se registra por unidades; ingrese solo números enteros.');
                return;
            }
            const target = { ...first };
            const source = { kg: parseFloat(pdata.kg) };
            let productsArr = tableProduct;
            productsArr.unshift(Object.assign(target, source));
            setTableProduct([...productsArr]);
            if (codeRef.current) codeRef.current.focus();
            resetProduct({
                code: '',
                kg: ''
            });
        }
    };

    const removeItem = (product) => {
        let productsArr = tableProduct;
        const index = productsArr.indexOf(product);
        if (index !== -1) {
            productsArr.splice(index, 1);
            setTableProduct([...productsArr])
        }
    }

    const codeRef = useRef();

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
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Registrar cuenta por pagar </h3>
                                    <p className="text-muted small">Registra la compra a proveedor: ingresa inventario y genera la obligación por pagar.</p>
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
                                    <Form onSubmit={handleSubmitProduct(onCreateDataProduct)} className="form" style={{
                                        border: '1px solid #dee2e6', padding: '10px 20px', borderRadius: '5px',
                                        marginBottom: '5px'
                                    }}>
                                        <Row form style={{ marginTop: '8px', alignItems: 'flex-end' }}>
                                            <Col xs="12" sm="auto">
                                                <FormGroup className="mb-2 mb-sm-0">
                                                    <Button
                                                        type="button"
                                                        color="primary"
                                                        outline
                                                        className="btn-round"
                                                        style={{ marginTop: 0, height: '38px' }}
                                                        title="Ver catálogo y elegir producto o combo"
                                                        disabled={!listProducts || listProducts.length === 0}
                                                        onClick={() => {
                                                            setCatalogFilterText('');
                                                            setCatalogType('products');
                                                            setCatalogModalOpen(true);
                                                        }}
                                                    >
                                                        <i className="fa fa-th-list mr-1" aria-hidden="true" />
                                                        <span className="d-none d-sm-inline">Catálogo</span>
                                                    </Button>
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup className="mb-2 mb-md-0">
                                                    <Label for="product">Código</Label>{' '}
                                                    {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                    <input
                                                        type="text"
                                                        maxLength={50}
                                                        autoComplete="off"
                                                        className={'form-control' + (errorsProduct.code ? ' is-invalid' : '')}
                                                        name="code"
                                                        placeholder="Código de producto"
                                                        ref={(e) => {
                                                            registerProduct(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
                                                            codeRef.current = e;
                                                        }}
                                                    />
                                                    {errorsProduct.code && <div className="invalid-feedback d-block">{errorsProduct.code.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={4}>
                                                <FormGroup className="mb-2 mb-md-0">
                                                    <Label for="kg">Kg/Unidades</Label>
                                                    <Controller
                                                        name="kg"
                                                        control={controlProduct}
                                                        rules={{
                                                            pattern: {
                                                                value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                                message: "Ingresa un peso válido"
                                                            },
                                                            setValueAs: (value) => {
                                                                return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                            },
                                                            required: "El peso es requerido",
                                                        }}
                                                        as={<NumberFormat placeholder="Cantidad" className={'form-control' + (errorsProduct.kg ? ' is-invalid' : '')} thousandSeparator={true} getInputRef={(el) => { kgInputRef.current = el; }} />}
                                                    />
                                                    {errorsProduct.kg && <div className="invalid-feedback">{errorsProduct.kg.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col xs="12" sm="auto">
                                                <FormGroup className="mb-0">
                                                    <Label className="d-none d-sm-block" style={{ visibility: 'hidden' }}>Añadir</Label>
                                                    <Button color="primary" className="btn-round btn-icon" style={{ marginTop: 0 }}>
                                                        <i className="fa fa-plus"></i>
                                                    </Button>
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                    </Form>
                                    <Modal
                                        toggle={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}
                                        isOpen={catalogModalOpen}
                                        onClosed={onCatalogModalClosed}
                                        className={`modal-lg ${darkMode ? 'dark-mode' : ''}`}
                                        backdrop="static"
                                    >
                                        <div className={`modal-header ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
                                            <h5 className="modal-title">Catálogo de productos</h5>
                                            <button
                                                aria-label="Close"
                                                className="close"
                                                type="button"
                                                onClick={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}
                                            >
                                                <span aria-hidden={true}>×</span>
                                            </button>
                                        </div>
                                        <div className={`modal-body ${darkMode ? 'bg-dark text-white' : ''}`}>
                                            <p className={`small mb-2 ${darkMode ? 'text-light' : 'text-muted'}`}>
                                                Busque por código o nombre, pulse <strong>Seleccionar</strong> y luego indique la cantidad para añadir.
                                            </p>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    color="primary"
                                                    outline={catalogType !== 'products'}
                                                    className="btn-round"
                                                    onClick={() => setCatalogType('products')}
                                                >
                                                    Productos
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    color="primary"
                                                    outline={catalogType !== 'combos'}
                                                    className="btn-round"
                                                    onClick={() => setCatalogType('combos')}
                                                >
                                                    Combos
                                                </Button>
                                            </div>
                                            <Input
                                                type="text"
                                                autoComplete="off"
                                                placeholder="Buscar por código o nombre…"
                                                value={catalogFilterText}
                                                onChange={(e) => setCatalogFilterText(e.target.value)}
                                                className="mb-3"
                                            />
                                            <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                                                <Table size="sm" striped responsive className={(darkMode ? 'dark-mode ' : '') + 'catalog-modal-table'}>
                                                    <thead>
                                                        <tr>
                                                            <th>Código</th>
                                                            <th>Producto</th>
                                                            <th className="d-none d-md-table-cell text-nowrap">Bs</th>
                                                            <th className="d-none d-md-table-cell text-nowrap">$</th>
                                                            <th className="d-md-none">Precio</th>
                                                            <th style={{ width: 120 }} />
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {catalogRowsFiltered.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="text-center py-3">
                                                                    {listProducts && listProducts.length ? 'Sin coincidencias' : 'Cargando catálogo…'}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            catalogRowsFiltered.map((p, idx) => {
                                                                const { bs, usd } = getCatalogUnitPriceBsUsd(p, 0, null);
                                                                return (
                                                                <tr key={p._id || p.id || `${String(p.code)}-${idx}`}>
                                                                    <td className="text-nowrap">{p.code}</td>
                                                                    <td>{p.name}</td>
                                                                    <td className="d-none d-md-table-cell text-nowrap">
                                                                        {bs != null ? (
                                                                            <NumberFormat value={bs.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} />
                                                                        ) : (
                                                                            <span className="text-muted">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="d-none d-md-table-cell text-nowrap">
                                                                        {usd != null ? (
                                                                            <NumberFormat value={usd.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} />
                                                                        ) : (
                                                                            <span className="text-muted">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="d-md-none align-middle catalog-modal-price-stack">
                                                                        <div>{usd != null ? (
                                                                            <NumberFormat value={usd.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} />
                                                                        ) : (
                                                                            <span className="text-muted">—</span>
                                                                        )}</div>
                                                                        <div>{bs != null ? (
                                                                            <NumberFormat value={bs.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} />
                                                                        ) : (
                                                                            <span className="text-muted">—</span>
                                                                        )}</div>
                                                                    </td>
                                                                    <td>
                                                                        <Button color="primary" size="sm" type="button" onClick={() => selectProductFromCatalog(p)}>
                                                                            Seleccionar
                                                                        </Button>
                                                                    </td>
                                                                </tr>
                                                                );
                                                            })
                                                        )}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div>
                                        <div className={`modal-footer ${darkMode ? 'bg-dark border-secondary' : ''}`}>
                                            <Button color="secondary" type="button" onClick={() => { setCatalogModalOpen(false); setCatalogFilterText(''); setCatalogType('products'); }}>
                                                Cerrar
                                            </Button>
                                        </div>
                                    </Modal>
                                    <Table striped responsive className={darkMode ? 'dark-mode' : ''}>
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th>Kg/Unidades</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableProduct && tableProduct.map((product, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{product.name}</td>
                                                        <td><NumberFormat displayType={'text'} value={product.kg.toFixed(3)} thousandSeparator={true} /></td>
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
                                    <Form onSubmit={handleSubmit(onCreateData)} className="form">
                                        <FormGroup>
                                            <Label for="supplierName">Proveedor</Label>
                                            <Input
                                                name="supplierName"
                                                id="supplierName"
                                                autoComplete="off"
                                                placeholder="Nombre o razón social del proveedor"
                                                maxLength={200}
                                                innerRef={register({
                                                    required: "Ingrese el proveedor",
                                                    validate: (v) => (v && String(v).trim().length > 0) || "Ingrese el proveedor",
                                                })}
                                                className={errors.supplierName ? 'is-invalid' : ''}
                                            />
                                            {errors.supplierName && <div className="invalid-feedback d-block">{errors.supplierName.message}</div>}
                                        </FormGroup>
                                        {(user.role === 1 || user.role === 2) && <>
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
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="invoiceRef">Referencia factura / documento</Label>
                                                    <Input
                                                        maxLength="80"
                                                        autoComplete="off"
                                                        name="invoiceRef"
                                                        innerRef={register}
                                                    />
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="dueDate">Fecha de vencimiento (opcional)</Label>
                                                    <Input type="date" name="dueDate" innerRef={register} />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row form>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="amount">Monto total ($) <span className="text-muted small">(opcional si el backend lo calcula)</span></Label>
                                                    <Controller
                                                        name="amount"
                                                        control={control}
                                                        rules={{
                                                            setValueAs: (value) => value ? parseFloat(String(value).replace(/,/g, '')) : ''
                                                        }}
                                                        as={<NumberFormat className="form-control" thousandSeparator={true} allowNegative={false} />}
                                                    />
                                                </FormGroup>
                                            </Col>
                                        </Row>
                                        <Row form>
                                            <Col md={6}>
                                                <FormGroup>
                                                    <Label for="note">Nota</Label>
                                                    <input
                                                        maxLength="100"
                                                        autoComplete="off"
                                                        className={'form-control' + (errors.note ? ' is-invalid' : '')}
                                                        name="note"
                                                        ref={register({
                                                            required: "La nota es requerida",
                                                        })}
                                                    />
                                                    {errors.note && <div className="invalid-feedback">{errors.note.message}</div>}
                                                </FormGroup>
                                            </Col>
                                            <Col md={6}>
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
                                            <Button onClick={e => { e.preventDefault(); history.goBack(); }}>Cancelar</Button>
                                        </div>
                                    </Form>
                                </Col>
                            </Row>
                            <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible}>
                                <div className="modal-header">
                                    <h5 className="modal-title">Cuenta por pagar</h5>
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

export default AccountsPayableCreatePage;
