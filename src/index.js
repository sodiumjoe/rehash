import { default as _assign } from 'lodash.assign';
import compose from 'lodash.compose';
import reduce from 'lodash.reduce';
import isFunction from 'lodash.isfunction';
import isPlainObject from 'lodash.isplainobject';
import isEmpty from 'lodash.isempty';
import isUndefined from 'lodash.isundefined';

export const assign = (...args) => _assign({}, ...args);

export const createReducer = compose(recursiveCombineReducers, createReducerTree);

export function separateStateAndXforms(tree) {
	return reduce(tree, (memo, val, key) => {
		if (isFunction(val)) {
			memo.xforms[key] = val;
			return memo;
		}
		if (isPlainObject(val)) {
			let { state, xforms } = separateStateAndXforms(val);
			memo.state[key] = state;
			if (!isEmpty(xforms)) {
				memo.xforms[key] = xforms;
			}
			return memo;
		}
		memo.state[key] = val;
		return memo;
	}, {
		state: {},
		xforms: {}
	});
}

export function createActionCreatorTree(tree, path = []) {
	return reduce(tree, (memo, val, key) => {
		memo[key] = isFunction(val) ? (payload) => {
			return {
				type: path.concat(key).join('.'),
				payload
			};
		} : createActionCreatorTree(val, path.concat(key));
		return memo;
	}, {});
}

export function bindActionCreatorTree(tree, dispatch, path = []) {
  return reduce(tree, (memo, val, key) => {
    memo[key] = isFunction(val) ?
      payload => dispatch(tree[key](payload)) :
      bindActionCreatorTree(val, dispatch, path.concat(key));
    return memo;
  }, {});
}

export default function (tree) {
	const { state, xforms } = separateStateAndXforms(tree);
  const actionCreatorTree = createActionCreatorTree(xforms);
  const dispatchTree = bindActionCreatorTree(actionCreatorTree);
	return {
		state,
		reducer: createReducer(xforms),
		actionCreatorTree,
    dispatchTree
	};
}

function createReducerTree(tree, path = []) {
	return reduce(tree, (memo, val, key) => {
		let currentPath = path.concat(key);
		memo[key] = isFunction(val) ? (state, {type, payload}) => {
			if (type === currentPath.join('.') && !isUndefined(state)) {
				return val(state, payload);
			}
			return state;
		} : createReducerTree(val, currentPath);
		return memo;
	}, {});
}

function recursiveCombineReducers(tree) {
	return (state, action) => {
		return reduce(tree, (memo, val, key) => {
      return assign(memo, isFunction(val) ? val(memo, action) : {
        [key]: recursiveCombineReducers(val)(memo[key], action)
      });

		}, state);
	};
}
