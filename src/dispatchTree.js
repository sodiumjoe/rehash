import assign from 'lodash.assign';
import isFunction from 'lodash.isfunction';
import reduce from 'lodash.reduce';

const async = fn => assign(fn, { type: 'thunk' });

const isThunk = fn => fn.type === 'thunk';

const defaultCreateActionCreator = path => payload => ({ type: path.join('.'), payload });

const thunkCreateActionCreator = (path, fn, dispatchTree) =>
  isThunk(fn)
    ? payload => (dispatch, getState) => fn(payload)(dispatchTree, getState)
    : defaultCreateActionCreator(path);

const bindActionCreatorTree = (tree, dispatch, path = []) => reduce(tree, (memo, node, key) => assign(memo, {
  [key]: isFunction(node)
    ? (...args) => dispatch(tree[key](...args))
    : bindActionCreatorTree(node, dispatch, path.concat(key))
}), {});

const createDispatchTree = (tree, createActionCreator = defaultCreateActionCreator) => dispatch => {
  let dispatchTree = {};
  const createActionCreatorTree = (tree, path = []) => reduce(tree, (memo, node, key) => {
    const currentPath = path.concat(key);
    return assign(memo, {
      [key]: isFunction(node)
        ? createActionCreator(currentPath, node, dispatchTree)
        : createActionCreatorTree(node, currentPath)
    });
  }, {});
  return assign(dispatchTree, bindActionCreatorTree(createActionCreatorTree(tree), dispatch));
};

export {
  async,
  isThunk,
  createDispatchTree,
  defaultCreateActionCreator,
  thunkCreateActionCreator
};
