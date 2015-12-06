import assign from 'lodash.assign';
import isFunction from 'lodash.isfunction';
import isUndefined from 'lodash.isundefined';
import reduce from 'lodash.reduce';

const defaultReducerTreeFilterFn = () => false;
const defaultActionHandler = (path, action, state, xform) => {
  return isUndefined(state)
    ? state
    : action.type !== path.join('.')
      ? state
      : xform(state, action.payload);
};

const createReducerTree = (
  tree,
  reducerTreeFilterFn = defaultReducerTreeFilterFn,
  actionHandler = defaultActionHandler,
  path = []
) => reduce(tree, (memo, node, key) => {
  const currentPath = path.concat(key);
  return reducerTreeFilterFn(node) ? memo : assign({}, memo, {
    [key]: !isFunction(node)
      ? createReducerTree(node, reducerTreeFilterFn, actionHandler, currentPath)
      : (state, action) => actionHandler(currentPath, action, state, node)
  });
}, {});

const recursiveCombineReducers = tree => (state, action) => {
  return reduce(tree, (memo = {}, node, key) => assign({}, memo, isFunction(node) ? node(memo, action) : {
    [key]: recursiveCombineReducers(node)(memo[key], action)
  }), state);
};

const createReducer = (tree, reducerTreeFilterFn, actionHandler) => {
  const reducerTree = createReducerTree(tree, reducerTreeFilterFn, actionHandler);
  return recursiveCombineReducers(reducerTree);
}

export {
  createReducer,
  createReducerTree,
  recursiveCombineReducers
};
