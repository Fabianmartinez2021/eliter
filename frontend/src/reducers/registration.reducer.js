import { userConstants } from '../constants';

export default function registration(state = {}, action) {
  switch (action.type) {
    case userConstants.REGISTER_REQUEST:
      return { registering: true };
    case userConstants.REGISTER_SUCCESS:
      return {
        success: true
      };
    case userConstants.REGISTER_FAILURE:
      return {};
    default:
      return state
  }
}