/* eslint-disable */
import { offerConstants } from '../constants';
import { offerService } from '../services';
import { alertActions } from './';

export const offerActions = {

    //Registrar oferta  
    createOffer(offer) {
        return dispatch => {
            dispatch(request(offer));

            offerService.offerCreate(offer)
                .then(
                    () => { 
                        dispatch(success());
                        dispatch(alertActions.success('¡Se ha registrado la oferta correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request(offer) { return { type: offerConstants.OFFER_CREATE_REQUEST, offer } }
        function success(offer) { return { type: offerConstants.OFFER_CREATE_SUCCESS, offer } }
        function failure(error) { return { type: offerConstants.OFFER_CREATE_FAILURE, error } }
    },

    dataTable(user) {
        return dispatch => {
            dispatch(request());

            offerService.offerTable(user)
                .then(
                    offers => {
                        dispatch(success(offers))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: offerConstants.OFFER_TABLE_REQUEST } }
        function success(offers) { return { type: offerConstants.OFFER_TABLE_SUCCESS, offers } }
        function failure(error) { return { type: offerConstants.OFFER_TABLE_FAILURE, error } }
    },

    dataOfferReport(user, pageIndex, pageSize, sortBy, filters) {
        return dispatch => {
            dispatch(request());

            offerService.reportOffer(user, pageIndex, pageSize, sortBy, filters)
                .then(
                    offers => {
                        dispatch(success(offers))
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };

        function request() { return { type: offerConstants.OFFER_TABLE_REQUEST } }
        function success(offers) { return { type: offerConstants.OFFER_TABLE_SUCCESS, offers } }
        function failure(error) { return { type: offerConstants.OFFER_TABLE_FAILURE, error } }
    },

    //eliminar oferta
    removeOffer(id, user) {
        return dispatch => {
            dispatch(request(id));
    
            offerService.removeOffer(id, user)
                .then(
                    offers => {
                        dispatch(success(offers));
                        dispatch(alertActions.success('¡Se ha eliminado la oferta correctamente!'));
                    },
                    error => {
                        dispatch(failure(error.toString()));
                        dispatch(alertActions.error(error.toString()));
                    }
                );
        };
    
        function request(id) { return { type: offerConstants.OFFER_DELETE_REQUEST, id } }
        function success(offers) { return { type: offerConstants.OFFER_DELETE_SUCCESS, offers } }
        function failure(error) { return { type: offerConstants.OFFER_DELETE_FAILURE, error } }
    },



};
