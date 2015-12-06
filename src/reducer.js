import assign from 'lodash.assign';
import isFunction from 'lodash.isfunction';
import isUndefined from 'lodash.isundefined';
import reduce from 'lodash.reduce';

const defaultReducerTreeFilterFn = () => false;

const createReducerTree = (tree, reducerTreeFilterFn = defaultReducerTreeFilterFn, path = []) => reduce(tree, (memo, node, key) => {
  const currentPath = path.concat(key);
  const actionType = currentPath.join('.');
  return reducerTreeFilterFn(node) ? memo : assign({}, memo, {
    [key]: !isFunction(node)
      ? createReducerTree(node, reducerTreeFilterFn, currentPath)
      : (state, { type, payload }) => (isUndefined(state) || type !== actionType) ? state : node(state, payload)
  });
}, {});

const recursiveCombineReducers = tree => (state, action) => {
  return reduce(tree, (memo = {}, node, key) => assign({}, memo, isFunction(node) ? node(memo, action) : {
    [key]: recursiveCombineReducers(node)(memo[key], action)
  }), state);
};

const createReducer = (tree, reducerTreeFilterFn) => {
  const reducerTree = createReducerTree(tree, reducerTreeFilterFn);
  return recursiveCombineReducers(reducerTree);
}

export {
  createReducer,
  createReducerTree,
  recursiveCombineReducers
};
