import assign from 'lodash.assign';
import isEmpty from 'lodash.isempty';
import isFunction from 'lodash.isfunction';
import isPlainObject from 'lodash.isplainobject';
import reduce from 'lodash.reduce';
import { async, createDispatchTree, isThunk, thunkCreateActionCreator } from './dispatchTree';
import { createReducer } from './reducer';

const _assign = (...args) => assign({}, ...args);

const separateStateAndXforms = tree => reduce(tree, (memo, node, key) => {
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

const rehash = (tree, opts = {}) => {
  const {
    actionHandler,
    createActionCreator,
    reducerTreeFilterFn,
    rootPath
  } = opts;
  const { state, xforms } = separateStateAndXforms(tree);
  const reducer = createReducer(xforms, reducerTreeFilterFn, actionHandler, rootPath);
  const getDispatchTree = createDispatchTree(xforms, createActionCreator, rootPath);
  return { state, reducer, getDispatchTree };
};

export {
  async,
  _assign as assign,
  createReducer,
  isThunk,
  rehash,
  separateStateAndXforms,
  thunkCreateActionCreator
};

export default rehash;
