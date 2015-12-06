import assign from 'lodash.assign';
import isEmpty from 'lodash.isempty';
import isFunction from 'lodash.isfunction';
import isPlainObject from 'lodash.isplainobject';
import reduce from 'lodash.reduce';
import { async, bindActionCreatorTree, createActionCreatorTree, isThunk, thunkCreateActionCreator } from './actionCreatorTree';
import { createReducer } from './reducer';

export const _assign = (...args) => assign({}, ...args);

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

export const rehash = (tree, opts = {}) => {
  const { state, xforms } = separateStateAndXforms(tree);
  const actionCreatorTree = createActionCreatorTree(xforms, opts.createActionCreator);
  const reducer = createReducer(xforms, opts.reducerTreeFilterFn);
  return { state, reducer, actionCreatorTree };
};

export {
  async,
  _assign as assign,
  bindActionCreatorTree,
  createActionCreatorTree,
  createReducer,
  isThunk,
  thunkCreateActionCreator
};

export default rehash;
