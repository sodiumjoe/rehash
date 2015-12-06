import assign from 'lodash.assign';
import isFunction from 'lodash.isfunction';
import reduce from 'lodash.reduce';

const async = fn => assign(fn, { type: 'thunk' });

const isThunk = fn => fn.type === 'thunk';

const defaultCreateActionCreator = (fn, path, actionCreatorTree) => payload => ({ type: path.join('.'), payload });

const thunkCreateActionCreator = (fn, path, actionCreatorTree) =>
  isThunk(fn)
    ? payload => (dispatch, getState) => fn(payload)(dispatch, getState, actionCreatorTree)
    : defaultCreateActionCreator(fn, path, actionCreatorTree);

const createActionCreatorTree = (tree, createActionCreator = defaultCreateActionCreator) => {
  let ref = {};
  const walkTree = (tree, ref, path = []) => reduce(tree, (memo, node, key) => {
    const currentPath = path.concat(key);
    return assign(memo, {
      [key]: isFunction(node)
        ? createActionCreator(node, currentPath, ref)
        : walkTree(node, ref, currentPath)
    });
  }, {});
  return assign(ref, walkTree(tree, ref));
};

const bindActionCreatorTree = (tree, dispatch, path = []) => reduce(tree, (memo, node, key) => assign(memo, {
  [key]: isFunction(node)
    ? (...args) => dispatch(tree[key](...args))
    : bindActionCreatorTree(node, dispatch, path.concat(key))
}), {});

export {
  async,
  isThunk,
  defaultCreateActionCreator,
  thunkCreateActionCreator,
  createActionCreatorTree,
  bindActionCreatorTree
};
