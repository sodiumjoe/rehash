# rehash

A set of utilities to generate an initial state, a reducer, and an action
creator tree for use with redux.

## Usage

```bash
npm install rehash
```

```javascript
import { createStore } from 'redux';
import rehash from 'rehash';

const storeDef = {
  items: ['foo'],
  addItem: (state, item) => Object.assign({}, state, {
    items: state.items.concat(item)
  }),
  nested: {
    items: ['bar'],
    addItem: (state, item) => Object.assign({}, state, {
      items: state.items.concat(item)
    })
  }
};

const { state, reducer, getDispatchTree } = rehash(storeDef);
const store = createStore(reducer, state);
const dispatchTree = getDispatchTree(store.dispatch);

store.dispatch({
  type: 'nested.addItem',
  payload: 'baz'
});

console.log(store.getState().nested.items); // ['bar', 'baz']

dispatchTree.nested.addItem('qux');

console.log(store.getState().nested.items); // ['bar', 'baz', 'qux']
```

## Concepts

At its simplest, rehash is a utility to create a redux reducer from a rehash store definition that looks like this:

```javascript
const storeDef = {
  items: ['foo'],
  addItem: (state, item) => Object.assign({}, state, {
    items: state.items.concat(item)
  }),
  nested: {
    items: ['bar'],
    addItem: (state, item) => Object.assign({}, state, {
      items: state.items.concat(item)
    })
  }
};
```

Note: A store definition mixes both the initial state and the state mutation functions (or xforms) into a single object so you can easily see the shape of the state that each xform is operating on.

### Reducer

Rehash takes this store definition and returns an initial `state`, and a redux `reducer`.

```javascript
const { state, reducer } = rehash(storeDef);
```

These can be used like any other handwritten reducer in redux. The handwritten equivalent to the above would look like this:

```javascript
const reducer = (state, action) => {
  switch (action.type) {
    case 'addItem':
      return Object.assign({}, state, {
        items: state.items.concat(action.payload)
      });
    case 'nested.addItem':
      return Object.assign({}, state, {
        nested: Object.assign({}, state.nested, {
          items: state.items.concat(action.payload)
        })
      });
    default:
      return state;
  }
};
```

### Store/dispatch

Use `state` and `reducer` with redux:

```javascript
const store = createStore(reducer, state);
```

You can now dispatch actions with two properties, `type`, which is generated from the "path" to the xform in the store definition, and `payload`, which is given to the xform as the second argument.

```javascript
store.dispatch({
  type: 'nested.addItem',
  payload: 'foo'
});
```

### DispatchTree

Rehash also returns a function `getDispatchTree` which, after store creation, you can call with the `dispatch` function to get a `dispatchTree`.

```javascript
const { state, reducer, getDispatchTree } = rehash(storeDef);
const store = createStore(reducer, state);
const dispatchTree = getDispatchTree(store.dispatch);
```

This is a simple object that mirrors the shape of the xform tree to provide a little bit of sugar over calling `store.dispatch` directly. The following are equivalent:

```javascript
store.dispatch({
  type: 'nested.addItem',
  payload: 'foo'
});

dispatchTree.nested.addItem('foo');
```

### Thunks

Because rehash returns a simple reducer, integration with other redux libraries is seamless.

```javascript
import { applyMiddleware, createStore, compose } from 'redux';
import rehash from 'rehash';
import thunk from 'redux-thunk';

const storeDef = {...};

const { state, reducer, getDispatchTree } = rehash(storeDef);
const store = compose(
  applyMiddleware(thunk)
)(createStore)(reducer, state);
const dispatchTree = getDispatchTree(store.dispatch);

const thunkActionCreator = payload => (dispatch, getState) => {
  setTimeout(() => dispatch({
    type: 'nested.addItem',
    payload: 'foo'
  }), 1000);

  // OR

  setTimeout(() => dispatchTree.nested.addItem('foo'));
});
```

You can also use some utilities that rehash provides to include thunk action creators into your store definition:

```javascript
import rehash, { async, isThunk, thunkCreateActionCreator } from 'rehash';
import { applyMiddleware, createStore, compose } from 'redux';

const storeDef = {
  items: ['foo'],
  addItem: (state, item) => Object.assign({}, state, {
    items: state.items.concat(item)
  }),
  nested: {
    items: ['bar'],
    addItem: (state, item) => Object.assign({}, state, {
      items: state.items.concat(item)
    })
  },
  // wrap the thunk xform so rehash knows what to do with it
  thunkActionCreator: async(payload => (dispatchTree, getState, dispatch) => {
    setTimeout(dispatchTree.addItem(payload), 1000);
  })
};

const opts = {
  // a rehash-provided config function to interpret thunks in your store def
  createActionCreator: thunkCreateActionCreator,
  // tells rehash to reduce thunk xforms when creating the reducer
  reducerTreeFilterFn: isThunk
};

const { state, reducer, getDispatchTree } = rehash(storeDef, opts);
const store = compose(
  applyMiddleware(thunk)
)(createStore)(reducer, state);
const dispatchTree = getDispatchTree(store.dispatch);

// thunks can now be dispatched directly from the dispatchTree
dispatchTree.thunkActionCreator('bar');
```

To see a full example using `redux.combineReducers`, `redux-thunk`, and `redux-router` with `rehash`, check out `src/example.jsx`.

## Advanced

@todo: document custom createActionCreator, reducerTreeFilterFn, and actionHandler functions.
