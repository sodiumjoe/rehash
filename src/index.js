import { default as _assign } from 'lodash.assign';
import compose from 'lodash.compose';
import isEmpty from 'lodash.isempty';
import isFunction from 'lodash.isfunction';
import isPlainObject from 'lodash.isplainobject';
import isUndefined from 'lodash.isundefined';
import reduce from 'lodash.reduce';

export const assign = (...args) => _assign({}, ...args);

export const separateStateAndXforms = tree => reduce(tree, (memo, node, key) => {
  if (isFunction(node)) {
    memo.xforms[key] = node;
    return memo;
  }
  if (isPlainObject(node)) {
    let { state, xforms } = separateStateAndXforms(node);
    memo.state[key] = state;
    if (!isEmpty(xforms)) {
      memo.xforms[key] = xforms;
    }
    return memo;
  }
  memo.state[key] = node;
  return memo;
}, {
  state: {},
  xforms: {}
});

const isThunk = node => {
  let isThunk = false;
  try {
    isThunk = typeof node() === 'function';
  } finally {
    return isThunk;
  }
}

const createActionCreatorFn = (fn, path, actionCreatorTree) =>
  isThunk(fn)
  ? payload => (dispatch, getState) => fn(payload)(dispatch, getState, actionCreatorTree)
  : payload => ({ type: path.join('.'), payload });

export const createActionCreatorTree = (tree, path = []) => {
  let ref = {};
  const walkTree = (tree, path, ref) => reduce(tree, (memo, node, key) => {
    const currentPath = path.concat(key);
    return _assign(memo, {
      [key]: isFunction(node)
        ? createActionCreatorFn(node, currentPath, ref)
        : walkTree(node, currentPath, ref)
    });
  }, {});
  return _assign(ref, walkTree(tree, path, ref));
};

export const bindActionCreatorTree = (tree, dispatch, path = []) => reduce(tree, (memo, node, key) => _assign(memo, {
  [key]: isFunction(node)
    ? payload => dispatch(tree[key](payload))
    : bindActionCreatorTree(node, dispatch, path.concat(key))
}), {});

const createReducerTree = (tree, path = []) => reduce(tree, (memo, node, key) => {
  const currentPath = path.concat(key);
  const actionType = currentPath.join('.');
  return isThunk(node) ? memo : _assign({}, memo, {
    [key]: !isFunction(node)
      ? createReducerTree(node, currentPath)
      : (state, { type, payload }) => (isUndefined(state) || type !== actionType) ? state : node(state, payload)
  });
}, {});

const recursiveCombineReducers = tree => (state, action) => {
  return reduce(tree, (memo = {}, node, key) => _assign({}, memo, isFunction(node) ? node(memo, action) : {
    [key]: recursiveCombineReducers(node)(memo[key], action)
  }), state);
};

export const createReducer = compose(recursiveCombineReducers, createReducerTree);

export const rehash = (tree, actionCreatorFn) => {
	const { state, xforms } = separateStateAndXforms(tree);
  const actionCreatorTree = createActionCreatorTree(xforms);
  const reducer = createReducer(xforms);
	return { state, reducer, actionCreatorTree };
}

export default rehash;
