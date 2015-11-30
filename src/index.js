import { default as _assign } from 'lodash.assign';
import compose from 'lodash.compose';
import reduce from 'lodash.reduce';
import isFunction from 'lodash.isfunction';
import isPlainObject from 'lodash.isplainobject';
import isEmpty from 'lodash.isempty';
import isUndefined from 'lodash.isundefined';

export const assign = (...args) => _assign({}, ...args);

export const separateStateAndXforms = tree => reduce(tree, (memo, val, key) => {
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

export const createActionCreatorTree = (tree, path = []) => reduce(tree, (memo, val, key) => _assign(memo, {
  [key]: isFunction(val) ? payload => ({
    type: path.concat(key).join('.'),
    payload
  }) : createActionCreatorTree(val, path.concat(key))
}), {});

export const bindActionCreatorTree = (tree, dispatch, path = []) => reduce(tree, (memo, val, key) => _assign(memo, {
  [key]: isFunction(val)
    ? payload => dispatch(tree[key](payload))
    : bindActionCreatorTree(val, dispatch, path.concat(key))
}), {});

const createReducerTree = (tree, path = []) => reduce(tree, (memo, val, key) => {
  const currentPath = path.concat(key);
  const actionType = currentPath.join('.');
  return _assign(memo, {
    [key]: isFunction(val) ? (state, {type, payload}) => {
      if (type !== actionType) {
        return state;
      }
      if(isUndefined(state)) {
        return state;
      }
      return val(state, payload);
    } : createReducerTree(val, currentPath)
  });
}, {});

const recursiveCombineReducers = tree => (state, action) => {
  return reduce(tree, (memo = {}, val, key) => _assign(memo, isFunction(val) ? val(memo, action) : {
    [key]: recursiveCombineReducers(val)(memo[key], action)
  }), state);
};

export const createReducer = compose(recursiveCombineReducers, createReducerTree);

export const rehash = tree => {
	const { state, xforms } = separateStateAndXforms(tree);
  const actionCreatorTree = createActionCreatorTree(xforms);
	return {
		state,
		reducer: createReducer(xforms),
		actionCreatorTree
	};
}

export default rehash;
