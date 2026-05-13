import { userConstants } from '../constants';
//const CryptoJS = require("crypto-js");
import CryptoJS from "crypto-js"
import { passphrase } from '../config/config';
import { history } from '../helpers';
let user = localStorage.getItem('user');

if(user){
	
	try{
		var bytes  = CryptoJS.AES.decrypt(user, passphrase);
		var originalData = bytes.toString(CryptoJS.enc.Utf8);
		user = JSON.parse(originalData);
	}catch(err){
		history.push('/login');
	}
}

const initialState = user ? { loggedIn: true, user } : {};

export default function authentication(state = initialState, action) {

	switch (action.type) {
	case userConstants.LOGIN_REQUEST:
		return {
			loggingIn: true,
			user: action.user
		};
	case userConstants.LOGIN_SUCCESS:
		return {
			loggedIn: true,
			user: action.user
		};
	case userConstants.UPDATE_CURRENT_USER: {
		const incoming = action.user;
		const merged = state.user ? { ...state.user, ...incoming } : incoming;
		const hasFullAgency = merged?.agency != null && typeof merged.agency === 'object' && merged.agency.id != null && merged.agency.name != null;
		const currentHasAgency = state.user?.agency != null && (typeof state.user.agency === 'object' ? state.user.agency.id : state.user.agency);
		if (!hasFullAgency && currentHasAgency) {
			merged.agency = state.user.agency;
		}
		return {
			...state,
			user: merged
		};
	}
	case userConstants.LOGIN_FAILURE:
		return {};
	case userConstants.LOGOUT:
		return {};
	default:
		return state
}
}