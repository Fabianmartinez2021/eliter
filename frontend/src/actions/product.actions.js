/* eslint-disable */
import { productConstants } from '../constants';
import { productService } from '../services';
import { alertActions, salesActions } from './';

export const productActions = {

    dataTable() {
        return dispatch => {
            dispatch(request());

            productService.productTable()
                .then(
                    products => {
                        dispatch(success(products))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_TABLE_REQUEST } }
        function success(products) { return { type: productConstants.PRODUCT_TABLE_SUCCESS, products } }
        function failure(error) { return { type: productConstants.PRODUCT_TABLE_FAILURE, error } }
    },

    dataTableHistory(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            productService.productTableHistory(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    products => {
                        dispatch(success(products))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_TABLE_REQUEST } }
        function success(products) { return { type: productConstants.PRODUCT_TABLE_SUCCESS, products } }
        function failure(error) { return { type: productConstants.PRODUCT_TABLE_FAILURE, error } }
    },

    //Registrar producto
    createProduct(product, user) {
        return dispatch => {
            dispatch(request(product));

            productService.productCreate(product)
                .then(
                    product => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado la producto correctamente!'));

                        //Actualizar en el storage venta, monedas, productos y terminales de la sucursal 
                        dispatch(salesActions.salesDataFormUpdate(user.agency.id));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(product) { return { type: productConstants.PRODUCT_CREATE_REQUEST, product } }
        function success(product) { return { type: productConstants.PRODUCT_CREATE_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_CREATE_FAILURE, error } }
    },

    //Obtenr información producto
    getProduct(id) {
        return dispatch => {
            dispatch(request(id));

            productService.productGet(id)
                .then(
                    product => {
                        dispatch(success(product));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: productConstants.PRODUCT_GET_REQUEST, id } }
        function success(product) { return { type: productConstants.PRODUCT_GET_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_GET_FAILURE, error } }
    },

    //Actualizar información producto
    updateProduct(id, product, user) {
        return dispatch => {
            dispatch(request(product));

            productService.productUpdate(id, product)
                .then(
                    product => {
                        dispatch(success(product));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));

                        //Actualizar en el storage venta, monedas, productos y terminales de la sucursal 
                        dispatch(salesActions.salesDataFormUpdate(user.agency.id));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: productConstants.PRODUCT_UPDATE_REQUEST, id } }
        function success(product) { return { type: productConstants.PRODUCT_UPDATE_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_UPDATE_FAILURE, error } }
    },

    //Obtener listado de productos
    listProducts() {
        return dispatch => {
            dispatch(request());

            productService.productList()
                .then(
                    list => {
                        dispatch(success(list));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_SELECT_REQUEST } }
        function success(list) { return { type: productConstants.PRODUCT_SELECT_SUCCESS, list } }
        function failure(error) { return { type: productConstants.PRODUCT_SELECT_FAILURE, error } }
    },

    //Obtener listado de productos y ofertas
    listProductsOffers(idAgency) {
        return dispatch => {
            dispatch(request());

            productService.productOfferList(idAgency)
                .then(
                    list => {
                        dispatch(success(list));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_OFFER_REQUEST } }
        function success(list) { return { type: productConstants.PRODUCT_OFFER_SUCCESS, list } }
        function failure(error) { return { type: productConstants.PRODUCT_OFFER_FAILURE, error } }
    },


    /*  Sección de los combos  */

    combosGetAll() {
        return dispatch => {
            dispatch(request());

            /** Texto legible del rechazo (producción: a veces objeto, Axios, etc. — "[object Object]" rompía el regex). */
            const errorToMessage = (err) => {
                if (err == null) return '';
                if (typeof err === 'string') return err.trim();
                if (typeof err.message === 'string' && err.message) return err.message.trim();
                if (typeof err.response?.data?.message === 'string') return err.response.data.message.trim();
                if (typeof err.response?.data === 'string') return err.response.data.trim();
                try {
                    const s = JSON.stringify(err);
                    if (s && s !== '{}') return s;
                } catch (e) { /* noop */ }
                return String(err);
            };

            /** Backend indica “no hay combos” / solo mayor / temporal — no es fallo operativo: catálogo vacío sin alerta. */
            const isBenignNoCombosMessage = (msg) => {
                const m = (msg || '').toLowerCase();
                if (!m) return false;
                if (/no existen combos/.test(m)) return true;
                if (/por los momentos/.test(m) && /combo/.test(m)) return true;
                if (/combos al mayor/.test(m) && (/no hay|no existen|ningún|ningun/i.test(m))) return true;
                return false;
            };

            productService.combosGetAll()
                .then(
                    products => {
                        dispatch(success(products))
                    },
                    error => {
                        const msg = errorToMessage(error);
                        if (isBenignNoCombosMessage(msg)) {
                            dispatch(success([]));
                            return;
                        }
                        dispatch(failure(msg));
                        dispatch(alertActions.error(msg));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_TABLE_REQUEST } }
        function success(products) { return { type: productConstants.PRODUCT_TABLE_SUCCESS, products } }
        function failure(error) { return { type: productConstants.PRODUCT_TABLE_FAILURE, error } }
    },

    //Crear un combo
    createCombo(product) {
        return dispatch => {
            dispatch(request(product));

            productService.combosCreate(product)
                .then(
                    product => {
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado la producto correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(product) { return { type: productConstants.PRODUCT_CREATE_REQUEST, product } }
        function success(product) { return { type: productConstants.PRODUCT_CREATE_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_CREATE_FAILURE, error } }
    },

    //Obtenr información producto
    getCombo(id) {
        return dispatch => {
            dispatch(request(id));

            productService.combosGet(id)
                .then(
                    product => {
                        dispatch(success(product));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: productConstants.PRODUCT_GET_REQUEST, id } }
        function success(product) { return { type: productConstants.PRODUCT_GET_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_GET_FAILURE, error } }
    },

    deleteCombo(id) {
        return dispatch => {
            dispatch(request(id));

            productService.combosDelete(id)
                .then(
                    product => {
                        dispatch(success(product));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: productConstants.PRODUCT_GET_REQUEST, id } }
        function success(product) { return { type: productConstants.PRODUCT_GET_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_GET_FAILURE, error } }
    },

    //Actualizar información del combo
    updateCombo(id, product) {
        return dispatch => {
            dispatch(request(product));

            productService.combosUpdate(id, product)
                .then(
                    product => {
                        dispatch(success(product));
                        dispatch(alertActions.success('Los datos han sido actualizados correctamente'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(id) { return { type: productConstants.PRODUCT_UPDATE_REQUEST, id } }
        function success(product) { return { type: productConstants.PRODUCT_UPDATE_SUCCESS, product } }
        function failure(error) { return { type: productConstants.PRODUCT_UPDATE_FAILURE, error } }
    },

    //Obtener listado de productos
    listCombos(data) {
        return dispatch => {
            dispatch(request());

            productService.combosList(data)
                .then(
                    list => {
                        dispatch(success(list));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_SELECT_REQUEST } }
        function success(list) { return { type: productConstants.PRODUCT_SELECT_SUCCESS, list } }
        function failure(error) { return { type: productConstants.PRODUCT_SELECT_FAILURE, error } }
    },

    dataTableCombosHistory(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            productService.dataTableCombosHistory(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    combos => {
                        dispatch(success(combos))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_TABLE_REQUEST } }
        function success(combos) { return { type: productConstants.PRODUCT_TABLE_SUCCESS, products: combos } }
        function failure(error) { return { type: productConstants.PRODUCT_TABLE_FAILURE, error } }
    },

    //Actualizar precios del día siguiente
    updateProductsPrices(rate, products, user) {
        return dispatch => {
            dispatch(request());

            productService.updateProductsPrices(rate, products)
                .then(
                    result => {
                        dispatch(success(result));
                        dispatch(alertActions.success('¡Los precios del día siguiente se han actualizado correctamente!'));

                        //Actualizar en el storage venta, monedas, productos y terminales de la sucursal 
                        dispatch(salesActions.salesDataFormUpdate(user.agency.id));
                        //Recargar la tabla de productos
                        dispatch(productActions.dataTable());
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: productConstants.PRODUCT_UPDATE_PRICES_REQUEST } }
        function success(result) { return { type: productConstants.PRODUCT_UPDATE_PRICES_SUCCESS, result } }
        function failure(error) { return { type: productConstants.PRODUCT_UPDATE_PRICES_FAILURE, error } }
    },

};
