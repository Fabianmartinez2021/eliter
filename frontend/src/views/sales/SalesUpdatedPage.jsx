/* eslint-disable */
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { salesActions, noteMarketActions } from '../../actions';
import AdminNavbar from "../../components/Navbars/AdminNavbar";
import SideBar from "../../components/SideBar/SideBar";
import { Col, Row, Button, Form, FormGroup, Label, Container, Table, Modal, Alert } from 'reactstrap';
import { useForm, Controller } from "react-hook-form";
import { history } from '../../helpers';
import NumberFormat from 'react-number-format';
import { WeightProduct } from '../../helpers/weight';
import { useDarkMode } from '../../helpers/darkModeContext';
import "../../assets/css/darkMode.css";
import Swal from 'sweetalert2';
import { SHOW_COUPONS_AND_PROMOTIONS_MODULE } from '../../config/config';

function SalesUpdatedPage() {
    const location = history.location;
    const noteId = location.state && location.state.id ? location.state.id : null;

    // Refs para controlar el comportamiento de las alertas
    const previousNoteIdRef = useRef(null);
    const isFirstRender = useRef(true);
    const hasUpdatedRef = useRef(false);
    const isProcessingRef = useRef(false); // Ref para evitar múltiples envíos simultáneos

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

    const getting = useSelector(state => state.sales.getting);
    const sales = useSelector(state => state.sales);
    const noteMarketState = useSelector(state => state.noteMarket);

    //Alertas
    const alert = useSelector(state => state.alert);
    const [visible, setVisible] = useState(true);
    const onDismiss = () => setVisible(false);

    useEffect(() => {
        if (alert.message) {
            setVisible(true);
            window.setTimeout(() => { setVisible(false) }, 5000);
        }
    }, [alert]);

    // Obtener productos, monedas, tiendas y choferes
    useEffect(() => {
        dispatch(salesActions.salesDataForm(user.agency.id));
    }, []);

    // Obtener la nota a editar
    useEffect(() => {
        if (!noteId) return;

        const noteIdChanged = noteId !== previousNoteIdRef.current;

        // Si cambió el noteId, resetear todo y limpiar la nota actual
        if (noteIdChanged) {
            previousNoteIdRef.current = noteId;
            hasUpdatedRef.current = false;
            isFirstRender.current = true;

            // Limpiar los estados locales
            setTableSale([]);
            setTotal(0);
            setTotalWeight(0);
            setNoteDetails({
                marketId: '',
                marketName: '',
                marketCompany: '',
                marketAttendant: '',
                marketAddress: '',
                driverId: '',
                driverName: '',
                status: ''
            });
            originalProductsRef.current = [];
            originalTotalsRef.current = { total: 0, totalWeight: 0 };
            originalNoteRef.current = null;

            // Hacer nueva petición para obtener la nueva nota
            dispatch(noteMarketActions.getNoteMarket(noteId));
        } else if (!noteMarketState.currentNote) {
            // Si es la primera vez y no hay currentNote, hacer la petición
            dispatch(noteMarketActions.getNoteMarket(noteId));
        }
    }, [noteId]);

    const [listCoin, setListCoin] = useState(null);
    const [listProducts, setListProducts] = useState(null);
    const [offerProducts, setOfferProducts] = useState(null);
    const [noteDetails, setNoteDetails] = useState({
        marketId: '',
        marketName: '',
        marketCompany: '',
        marketAttendant: '',
        marketAddress: '',
        driverId: '',
        driverName: '',
        status: ''
    });
    const [hasChanges, setHasChanges] = useState(false);
    const originalProductsRef = useRef([]);
    const originalTotalsRef = useRef({ total: 0, totalWeight: 0 });
    const originalNoteRef = useRef(null); // Guardar la nota original completa

    useEffect(() => {
        if (sales.obtained) {
            setListProducts(sales.data.products);
            setOfferProducts(sales.data.offers);
            setListCoin(sales.data.coins);
        }
    }, [sales.obtained]);

    // Cargar datos de la nota cuando se obtiene del backend
    useEffect(() => {
        if (noteMarketState.currentNote && noteId) {
            const note = noteMarketState.currentNote;
            // Verificar que la nota cargada corresponde al noteId actual
            const noteIdFromState = note.id || note._id;
            if (noteIdFromState !== noteId) {
                // Si no coincide, limpiar y esperar la correcta
                return;
            }

            const productsFromNote = (note.products || []).map(item => ({ ...item }));
            setTableSale(productsFromNote);
            setTotal(note.total || 0);
            setTotalWeight(note.totalWeight || 0);

            const marketIdSel = typeof note.marketId === 'object' ? (note.marketId._id || note.marketId.id) : (note.marketId || '');
            const driverIdSel = typeof note.driverId === 'object' ? (note.driverId._id || note.driverId.id) : (note.driverId || '');

            setNoteDetails({
                marketId: marketIdSel || '',
                marketName: note.marketName || '',
                marketCompany: note.marketCompany || '',
                marketAttendant: note.marketAttendant || '',
                marketAddress: note.marketAddress || '',
                driverId: driverIdSel || '',
                driverName: note.driverName || '',
                status: note.status || ''
            });
            originalProductsRef.current = productsFromNote.map(item => ({ ...item }));
            // Guardar también el total y totalWeight original
            originalTotalsRef.current = {
                total: note.total || 0,
                totalWeight: note.totalWeight || 0
            };
            // Guardar la nota original completa para enviarla al backend
            originalNoteRef.current = {
                ...note,
                products: productsFromNote.map(item => ({ ...item }))
            };
            setHasChanges(false);
        }
    }, [noteMarketState.currentNote, noteId]);

    // Resetear el flag de procesamiento cuando termine la actualización (éxito o error)
    useEffect(() => {
        if (!noteMarketState.updating && isProcessingRef.current) {
            // Si updating es false y estaba procesando, significa que terminó
            isProcessingRef.current = false;
        }
    }, [noteMarketState.updating]);

    // Manejar éxito de actualización
    useEffect(() => {
        // Evitar que se ejecute en el montaje inicial
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Solo redirigir si successUpdated es true, updating es false, y realmente se hizo una actualización
        if (noteMarketState.successUpdated && !noteMarketState.updating && hasUpdatedRef.current) {
            hasUpdatedRef.current = false;
            isProcessingRef.current = false; // Asegurar que se resetee
            // Pequeño delay para que se muestre la alerta de éxito
            setTimeout(() => {
                history.push('/sales-notes');
            }, 1500);
        }
    }, [noteMarketState.successUpdated, noteMarketState.updating]);

    const { handleSubmit, register, errors, reset, control } = useForm();
    const { handleSubmit: handleSubmitUpdate } = useForm();

    const [tableSale, setTableSale] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalWeight, setTotalWeight] = useState(0);
    console.log('totalWeight', totalWeight);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMsg, setModalMsg] = useState('');
    const [presentation, setPresentation] = useState('');
    const [errorU, setErrorU] = useState('');

    const codeRef = useRef();

    useEffect(() => {
        if (!noteMarketState.currentNote) return;
        const diff = computeModifiedProducts(tableSale);
        setHasChanges(diff.length > 0);
    }, [tableSale, noteMarketState.currentNote]);

    const getProductKey = (product) => {
        if (!product) return '';
        return (
            product.id ||
            product._id ||
            product.productId ||
            product.code ||
            (product.name ? `name-${product.name}` : '')
        ).toString();
    };

    const sanitizeProduct = (product = {}) => ({
        id: product.id ?? product._id ?? product.productId ?? null,
        code: product.code ?? '',
        name: product.name ?? '',
        kg: parseFloat(product.kg ?? 0),
        units: parseFloat(product.units ?? 0),
        price: parseFloat(product.price ?? 0),
        total: parseFloat(product.total ?? 0),
        regularPrice: parseFloat(product.regularPrice ?? 0),
        differential: parseFloat(product.differential ?? 0),
        isOffer: !!product.isOffer,
        presentation: product.presentation ?? '',
        wholesalePrice: parseFloat(product.wholesalePrice ?? 0),
        wholesaleDiscountPrice: parseFloat(product.wholesaleDiscountPrice ?? 0),
        applyWholesaleDiscount: !!product.applyWholesaleDiscount,
    });

    const buildEntries = (products = []) =>
        products.map((product, index) => ({
            raw: product,
            sanitized: sanitizeProduct(product),
            key: getProductKey(product) || `index-${index}`,
            matched: false,
        }));

    const computeModifiedProducts = (currentProducts = []) => {
        const currentEntries = buildEntries(currentProducts);
        const originalEntries = buildEntries(originalProductsRef.current || []);

        const changes = [];

        currentEntries.forEach((currentEntry) => {
            let matchIndex = originalEntries.findIndex((originalEntry) => {
                if (originalEntry.matched) return false;
                if (currentEntry.key && originalEntry.key && currentEntry.key === originalEntry.key) return true;
                if (
                    currentEntry.sanitized.code &&
                    originalEntry.sanitized.code &&
                    currentEntry.sanitized.code === originalEntry.sanitized.code
                ) return true;
                if (
                    currentEntry.sanitized.name &&
                    originalEntry.sanitized.name &&
                    currentEntry.sanitized.name === originalEntry.sanitized.name
                ) return true;
                return false;
            });

            if (matchIndex === -1) {
                changes.push({ type: 'added', product: currentEntry.raw });
            } else {
                const matchedEntry = originalEntries[matchIndex];
                matchedEntry.matched = true;
                if (JSON.stringify(matchedEntry.sanitized) !== JSON.stringify(currentEntry.sanitized)) {
                    changes.push({
                        type: 'updated',
                        before: matchedEntry.raw,
                        after: currentEntry.raw,
                    });
                }
            }
        });

        originalEntries
            .filter((entry) => !entry.matched)
            .forEach((entry) => {
                changes.push({ type: 'removed', product: entry.raw });
            });

        return changes;
    };

    // Añadir producto a tabla
    const onCreateData = (data, e) => {
        let productFilter = listProducts.filter(item => item.code === data.code);

        if (productFilter.length == 0) {
            setModalVisible(true);
            setModalMsg('No se encontró el producto');
            return;
        }

        var offer = null;
        if (SHOW_COUPONS_AND_PROMOTIONS_MODULE && offerProducts && offerProducts.length > 0) {
            offer = offerProducts.find(item => item.product.code === data.code);
        }

        if (productFilter[0].presentation === "Unidades") {
            if (data.kg != Math.round(data.kg)) {
                setModalVisible(true);
                setModalMsg(productFilter[0].name + ' se vende por unidades, por lo que sólo se debe ingresar numeros enteros');
                return;
            }
        }

        // Verificar si el producto ya está en la tabla
        const productExists = tableSale.some(item => {
            // Normalizar códigos: convertir a string, eliminar espacios y comparar
            const itemCode = String(item.code || '').trim();
            const dataCode = String(data.code || '').trim();
            return itemCode === dataCode;
        });
        if (productExists) {
            Swal.fire({
                icon: 'warning',
                text: 'El producto ya esta en la lista',
                confirmButtonText: 'Entendido',
                confirmButtonColor: 'red'
            });
            return;
        }

        const target = { ...productFilter[0] };
        const kg = parseFloat(data.kg) || 0;
        const valueDollar = listCoin && listCoin[0] && listCoin[0].value ? parseFloat(listCoin[0].value) : 1;
        const basePrice = offer ? parseFloat(offer.price || 0) : parseFloat(productFilter[0].price || 0);
        const price = Number.isNaN(basePrice) ? 0 : parseFloat(basePrice.toFixed(2) * valueDollar);
        const regularPrice = parseFloat(productFilter[0].price) || price;
        const differential = (regularPrice && price && kg) ? (regularPrice - price) * kg : 0;
        const priceDollar = valueDollar > 0 ? price / valueDollar : 0;

        // Validar piezas para productos con presentación kg/Unidades
        if (target.presentation === 'kg/Unidades') {
            const unitsValue = data.units ? parseFloat(data.units.toString().replace(/,/g, '')) : 0;
            if (!data.units || isNaN(unitsValue) || unitsValue < 1) {
                setErrorU("Debe ser al menos 1 Pieza");
                return;
            } else {
                setErrorU('');
            }
        }

        const source = {
            kg: kg,
            units: target.presentation === 'kg/Unidades'
                ? (data.units ? parseFloat(data.units.toString().replace(/,/g, '')) : 0)
                : 0,
            price: price,
            regularPrice: regularPrice,
            differential: isNaN(differential) ? 0 : differential,
            isWholesale: !!target.isWholesale,
            isOffer: !!offer,
            total: kg * price,
            totalDollars: kg * priceDollar,
            applyWholesaleDiscount: productFilter[0].applyWholesaleDiscount,
            wholesalePrice: parseFloat(productFilter[0].wholesalePrice) || 0,
            wholesaleDiscountPrice: parseFloat(productFilter[0].wholesaleDiscountPrice) || 0
        };
        setPresentation(target.presentation);

        let preSale = [...tableSale];
        preSale.unshift(Object.assign(target, source));
        setTableSale(preSale);
        setTotal(0);
        setTotalWeight(0);
        var sum = 0;
        var sumWeight = 0;
        preSale.forEach((product) => {
            sum += product.total || 0;
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if (getWeight) {
                sumWeight += product.kg * getWeight.weight;
            } else {
                sumWeight += product.kg;
            }
        });
        setTotal(sum);
        setTotalWeight(sumWeight);

        if (codeRef.current) codeRef.current.focus();
        setErrorU(''); // Limpiar error al agregar producto exitosamente
        reset({
            code: '',
            kg: '',
            units: ''
        });
    };

    const removeItem = (prod) => {
        let preSale = tableSale.filter(item => item !== prod);
        setTableSale(preSale);
        let sum = 0;
        var sumWeight = 0;
        preSale.forEach((product) => {
            sum += product.total || 0;
            const getWeight = WeightProduct.find(prod => prod.code == product.code);
            if (getWeight) {
                sumWeight += product.kg * getWeight.weight;
            } else {
                sumWeight += product.kg;
            }
        });
        setTotal(sum);
        setTotalWeight(sumWeight);
    };

    const onUpdateNote = (data, e) => {
        e.preventDefault();

        // Bloquear si ya se está procesando una actualización
        if (isProcessingRef.current || noteMarketState.updating) {
            return;
        }

        if (total == 0 || tableSale.length == 0) {
            setModalVisible(true);
            setModalMsg('Debe ingresar al menos un producto');
            return;
        }

        // Marcar como procesando
        isProcessingRef.current = true;

        // Normalizar productos actuales
        const normalizedItems = (Array.isArray(tableSale) ? tableSale : []).map(p => {
            const ref = (listProducts || []).find(lp => lp.id === p.id || lp.code === p.code || lp.name === p.name) || {};
            return {
                name: p.name,
                price: p.price || 0,
                regularPrice: p.regularPrice ?? 0,
                differential: p.differential ?? 0,
                isOffer: p.isOffer ?? false,
                kg: p.kg || 0,
                units: p.units ?? 0,
                total: p.total || 0,
                code: p.code || ref.code || '',
                id: p.id || ref.id || ref._id || null,
                presentation: p.presentation || ref.presentation,
                wholesalePrice: p.wholesalePrice ?? ref.wholesalePrice,
                wholesaleDiscountPrice: p.wholesaleDiscountPrice ?? ref.wholesaleDiscountPrice,
                applyWholesaleDiscount: p.applyWholesaleDiscount ?? ref.applyWholesaleDiscount,
            };
        });

        // Normalizar productos originales (similar a MiscellaneousInventoryUpdated)
        const originalProductsArray = Array.isArray(originalProductsRef.current) ? originalProductsRef.current : [];

        const normalizedOriginalItems = originalProductsArray.map(p => {
            const ref = (listProducts || []).find(lp => lp.id === p.id || lp.code === p.code || lp.name === p.name) || {};
            return {
                name: p.name,
                price: p.price || 0,
                regularPrice: p.regularPrice ?? 0,
                differential: p.differential ?? 0,
                isOffer: p.isOffer ?? false,
                kg: p.kg || 0,
                units: p.units ?? 0,
                total: p.total || 0,
                code: p.code || ref.code || '',
                id: p.id || ref.id || ref._id || null,
                presentation: p.presentation || ref.presentation,
                wholesalePrice: p.wholesalePrice ?? ref.wholesalePrice,
                wholesaleDiscountPrice: p.wholesaleDiscountPrice ?? ref.wholesaleDiscountPrice,
                applyWholesaleDiscount: p.applyWholesaleDiscount ?? ref.applyWholesaleDiscount,
            };
        });

        // Obtener total y totalWeight originales desde el ref
        const originalTotal = originalTotalsRef.current.total || normalizedOriginalItems.reduce((sum, p) => sum + (p.total || 0), 0);
        const originalTotalWeight = originalTotalsRef.current.totalWeight || normalizedOriginalItems.reduce((sum, p) => {
            const getWeight = WeightProduct.find(prod => prod.code === p.code);
            if (getWeight) {
                return sum + (p.kg || 0) * getWeight.weight;
            }
            return sum + (p.kg || 0);
        }, 0);

        const updateData = {
            // Productos modificados (la tabla actual después de modificar)
            items: normalizedItems,
            products: normalizedItems,
            total: total,
            totalWeight: totalWeight,
            marketId: noteDetails.marketId || null,
            marketName: noteDetails.marketName || '',
            marketCompany: noteDetails.marketCompany || '',
            marketAttendant: noteDetails.marketAttendant || '',
            marketAddress: noteDetails.marketAddress || '',
            driverId: noteDetails.driverId || null,
            driverName: noteDetails.driverName || '',
            // Nota original completa (todos los campos antes de modificar)
            originalData: originalNoteRef.current ? {
                // Productos originales
                products: normalizedOriginalItems,
                // Totales originales
                total: originalTotal,
                totalWeight: originalTotalWeight,
                // Información de la nota original
                marketId: originalNoteRef.current.marketId || null,
                marketName: originalNoteRef.current.marketName || '',
                marketCompany: originalNoteRef.current.marketCompany || '',
                marketAttendant: originalNoteRef.current.marketAttendant || '',
                marketAddress: originalNoteRef.current.marketAddress || '',
                driverId: originalNoteRef.current.driverId || null,
                driverName: originalNoteRef.current.driverName || '',
                order: originalNoteRef.current.order || null,
                valueDollar: originalNoteRef.current.valueDollar || null,
                totalDollar: originalNoteRef.current.totalDollar || null,
                status: originalNoteRef.current.status || '',
                // Cualquier otro campo de la nota original que pueda ser importante
                ...(originalNoteRef.current.createdDate && { createdDate: originalNoteRef.current.createdDate }),
                ...(originalNoteRef.current.userId && { userId: originalNoteRef.current.userId }),
                ...(originalNoteRef.current.userName && { userName: originalNoteRef.current.userName }),
                ...(originalNoteRef.current.agency && { agency: originalNoteRef.current.agency }),
            } : {
                // Fallback si no hay nota original guardada
                products: normalizedOriginalItems,
                total: originalTotal,
                totalWeight: originalTotalWeight,
            },
        };

        const noteDollarValue = listCoin && listCoin[0] && listCoin[0].value ? parseFloat(listCoin[0].value) : null;
        updateData.valueDollar = noteDollarValue !== null ? noteDollarValue.toFixed(2) : '0.00';
        updateData.totalDollar = noteDollarValue ? parseFloat((total / noteDollarValue).toFixed(2)) : 0;

        const changes = computeModifiedProducts(tableSale);

        if (changes.length > 0) {
            updateData.status = 'modified';
            // Obtener fecha actual en zona horaria de Venezuela (UTC-4)
            const now = new Date();
            // Obtener la fecha/hora en formato de Venezuela usando Intl
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Caracas',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(now);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;
            const second = parts.find(p => p.type === 'second').value;
            const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
            const currentUpdateDate = `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}-04:00`;
            updateData.modifiedProducts = changes.map((change) => {
                if (change.type === 'updated') {
                    return {
                        type: 'updated',
                        before: { ...change.before },
                        after: { 
                            ...change.after,
                            updateDate: currentUpdateDate // Sobrescribir con la fecha actual en hora de Venezuela
                        },
                    };
                }
                return {
                    type: change.type,
                    product: { 
                        ...change.product,
                        updateDate: currentUpdateDate // También para productos agregados
                    },
                };
            });
        } else {
            updateData.status = 'acept';
            updateData.modifiedProducts = [];
        }

        hasUpdatedRef.current = true;

        dispatch(noteMarketActions.updateNoteMarket(noteId, updateData));
    };

    if (!noteId) {
        return (
            <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
                <SideBar />
                <div id="page-content-wrapper">
                    <AdminNavbar />
                    <div className="container-fluid">
                        <Container>
                            <Row>
                                <Col>
                                    <p>No se proporcionó un ID de nota válido.</p>
                                    <Button onClick={() => history.push('/sales-notes')}>Volver</Button>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`d-flex ${darkMode ? "dark-mode" : ""}`} id="wrapper">
            <SideBar />
            <div id="page-content-wrapper">
                <AdminNavbar />
                <div className="container-fluid">
                    <Container>
                        <Row>
                            <Col sm="12" md={{ size: 8, offset: 2 }}>
                                <div style={{ marginBottom: 20 }}>
                                    {getting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                    {listCoin && listCoin.length > 0 && (
                                        <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                                            {listCoin[0] && (
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Dólar a {' '}
                                                    <b><NumberFormat value={listCoin[0].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                                </div>
                                            )}
                                            {listCoin[1] && (
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Euro a {' '}
                                                    <b><NumberFormat value={listCoin[1].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                                </div>
                                            )}
                                            {listCoin[2] && (
                                                <div style={{ fontSize: '0.9em' }}>
                                                    Pesos a {' '}
                                                    <b><NumberFormat value={listCoin[2].value.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} /></b>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex justify-content-between" style={{ marginBottom: 10 }}>
                                    <h3 style={{ fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0' }}>Editar nota de entrega a tienda</h3>
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
                                <Row form style={{ marginBottom: 15 }}>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketName">Tienda</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketName"
                                                value={noteDetails.marketName}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="driverName">Chofer</Label>
                                            <input
                                                className={'form-control'}
                                                name="driverName"
                                                value={noteDetails.driverName}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row form>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketCompany">Empresa</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketCompany"
                                                value={noteDetails.marketCompany}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label for="marketAttendant">Encargado</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketAttendant"
                                                value={noteDetails.marketAttendant}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label for="marketAddress">Dirección</Label>
                                            <input
                                                className={'form-control'}
                                                name="marketAddress"
                                                value={noteDetails.marketAddress}
                                                readOnly
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Form onSubmit={handleSubmit(onCreateData)} className="form" style={{ border: '1px solid #dee2e6', padding: '10px 20px', borderRadius: '5px', marginBottom: '5px' }}>
                                    <Row form style={{ marginTop: '12px' }}>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <input
                                                type="text"
                                                maxLength={50}
                                                autoComplete="off"
                                                className={'form-control' + (errors.code ? ' is-invalid' : '')}
                                                name="code"
                                                ref={(e) => {
                                                    codeRef.current = e;
                                                    register(e, { required: "El código es requerido", maxLength: { value: 50, message: "Máximo 50 caracteres" } })
                                                }}
                                                onChange={() => {
                                                    // Limpiar error de piezas cuando cambie el código
                                                    if (errorU) {
                                                        setErrorU('');
                                                    }
                                                }}
                                                placeholder="Código de producto"
                                            />
                                            {errors.code && <div className="invalid-feedback d-block">{errors.code.message}</div>}
                                        </FormGroup>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <Controller
                                                name="kg"
                                                control={control}
                                                rules={{
                                                    min: {
                                                        value: 0.040,
                                                        message: "El peso minimo es 40 gr"
                                                    },
                                                    pattern: {
                                                        value: /^(?=.*\d)\d*(\.\d+)?$/,
                                                        message: "Ingresa un peso válido"
                                                    },
                                                    required: "El peso es requerido",
                                                }}
                                                as={<NumberFormat placeholder="Cantidad de kg" className={'form-control' + (errors.kg ? ' is-invalid' : '')} thousandSeparator={true} />}
                                            />
                                            {errors.kg && <div className="invalid-feedback">{errors.kg.message}</div>}
                                        </FormGroup>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <Controller
                                                name="units"
                                                control={control}
                                                rules={{
                                                    min: { value: 1, message: "Debe ser al menos 1 Pieza" },
                                                    setValueAs: (value) => {
                                                        return value ? parseFloat(value.toString().replace(/,/g, '')) : value;
                                                    },
                                                }}
                                                render={({ onChange, value }) => (
                                                    <NumberFormat
                                                        placeholder="Cantidad de Piezas"
                                                        className={'form-control' + (errorU ? ' is-invalid' : '')}
                                                        thousandSeparator={true}
                                                        allowNegative={false}
                                                        value={value}
                                                        onValueChange={(values) => {
                                                            onChange(values.floatValue || '');
                                                            // Limpiar error cuando el usuario escriba
                                                            if (errorU) {
                                                                setErrorU('');
                                                            }
                                                        }}
                                                    />
                                                )}
                                            />
                                            {errorU && (
                                                <div className="invalid-feedback d-block" style={{ color: '#dc3545', display: 'block' }}>{errorU}</div>
                                            )}
                                        </FormGroup>
                                        <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                            <Button color="primary" className="btn-round btn-icon" style={{ marginTop: 0 }}>
                                                <i className="fa fa-plus"></i>
                                            </Button>
                                        </FormGroup>
                                    </Row>
                                </Form>
                                <Table striped responsive className={darkMode ? 'dark-mode' : ''}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>kg/unidades</th>
                                            <th>Cant. Piezas</th>
                                            <th>Costo unitario</th>
                                            <th>Sub (Bs)</th>
                                            <th>Sub ($)</th>
                                            <th>Sub (Cop)</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableSale && tableSale.map((product, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td>{product.name}</td>
                                                    <td><NumberFormat value={product.kg.toFixed(3)} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                                    <td><NumberFormat value={product.units} displayType={'text'} thousandSeparator={','} decimalSeparator={'.'} /></td>
                                                    <td><NumberFormat value={product.price.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs ' /></td>
                                                    <td><NumberFormat value={product.total.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Bs ' /></td>
                                                    <td><NumberFormat value={(product.total / (listCoin && listCoin[0] ? listCoin[0].value : 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='$ ' /></td>
                                                    <td><NumberFormat value={(product.total * (listCoin && listCoin[2] ? listCoin[2].value : 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix='Cop ' /></td>
                                                    <td>
                                                        <Button className="btn-link" color="primary" style={{ margin: 0, padding: 0 }}
                                                            onClick={e => { e.preventDefault(); removeItem(product) }}>
                                                            <i className="fa fa-times-circle"></i>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </Table>
                                <Row>
                                    <Col className="text-right" style={{ margin: 0 }}>
                                        {listCoin && listCoin.length >= 3 && (
                                            <div className="d-inline-flex" style={{ padding: '5px 0px 10px 0px' }}>
                                                <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', padding: 4 }}>
                                                    <b style={{ fontSize: 25, marginRight: 10, marginLeft: 10 }}>
                                                        <NumberFormat value={totalWeight.toFixed(3)} displayType={'text'} thousandSeparator={true} prefix={'kg '} />
                                                    </b>
                                                </div>
                                                <div className="text-center" style={{ border: '1px solid #00C853', borderRight: 0, padding: 4 }}>
                                                    <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                        <NumberFormat value={(total / (listCoin[0]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'$ '} />
                                                    </b>
                                                </div>
                                                <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: 4 }}>
                                                    <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                        <NumberFormat value={total.toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Bs '} />
                                                    </b>
                                                </div>
                                                <div className="text-center" style={{ border: '1px solid #00C853', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', padding: 4 }}>
                                                    <b style={{ fontSize: 25, marginLeft: 10, marginRight: 10 }}>
                                                        <NumberFormat value={(total * (listCoin[2]?.value || 1)).toFixed(2)} displayType={'text'} thousandSeparator={true} prefix={'Cop '} />
                                                    </b>
                                                </div>
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                                <Form onSubmit={handleSubmitUpdate(onUpdateNote)}>
                                    <Row>
                                        <Col>
                                            <Button 
                                                color="primary" 
                                                disabled={noteMarketState.updating || isProcessingRef.current}
                                                type="submit"
                                            >
                                                {noteMarketState.updating && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                                Guardar Cambios
                                            </Button>
                                        </Col>
                                        <Col>
                                            <div className="pull-right">
                                                <Button onClick={(e) => { e.preventDefault(); history.push('/sales-notes'); }}>Cancelar</Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </Form>
                            </Col>
                        </Row>
                        <Modal toggle={() => { setModalVisible(false); setModalMsg('') }} isOpen={modalVisible}>
                            <div className="modal-header">
                                <h5 className="modal-title" id="examplemodalMsgLabel">
                                    Mensaje
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
    );
}

export default SalesUpdatedPage;

