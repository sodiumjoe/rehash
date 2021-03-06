import { render } from 'react-dom';
import React, { createClass } from 'react';
import { connect, Provider } from 'react-redux';
import { Link, Route, IndexRoute } from 'react-router';
import { ReduxRouter, routerStateReducer, reduxReactRouter } from 'redux-router';
import rehash, { assign, async, isThunk, thunkCreateActionCreator } from './index.js';
import _ from 'lodash';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

/* Containers */

const App = props => <div>{props.children}</div>;

const Welcome = connect(state => state.root)(props => (
  <div>
    welcome
    {JSON.stringify(props.items)}
    <Link to='/goodbye'>Another route</Link>
  </div>
));

const Goodbye = connect(state => state.root)(props => (
  <div>
    goodbye
    {JSON.stringify(props.pagination)}
  </div>
));

/* Routes */

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Welcome} />
    <Route path="goodbye" component={Goodbye} />
  </Route>
);

/* Reducer */

const storeDef = {

  items: ['foo'],

  addItem: (state, item) => assign(state, {
    items: state.items.concat(item)
  }),

  pagination: {

    currentPageIndex: 0,
    totalPages: 5,

    onPageSelect: (state, pageNum) => {
      if (!pageNum) {
        return state;
      }
      let pageIndex = pageNum - 1;
      let maxPageIndex = state.totalPages - 1;
      if (state.currentPageIndex === pageIndex) {
        return state;
      }
      return assign(state, {
        currentPageIndex: pageIndex < 0 ? 0 : pageIndex > maxPageIndex ? maxPageIndex : pageIndex
      });
    },

    asyncPageSelect: async(payload => (dispatchTree, getState) => {
      dispatchTree.pagination.onPageSelect(payload);
      setTimeout(() => dispatchTree.pagination.onPageSelect(1), 1000);
    }),

    pageSizes: [ 50, 100, 250 ],
    selectedPageSize: 50,

    onPageSizeSelect(state, pageSize) {
      if (!_.includes(state.pageSizes, pageSize)) {
        return state;
      }
      return assign(state, {
        selectedPageSize: pageSize
      });
    }

  }

};

const opts = {
  createActionCreator: thunkCreateActionCreator,
  reducerTreeFilterFn: isThunk
};

const {
  getDispatchTree,
  reducer: rootReducer,
  state
} = rehash(storeDef, opts);

const initialState = { root: state };

const reducer = combineReducers({
  router: routerStateReducer,
  root: rootReducer
});

/* Store */

const store = compose(
  applyMiddleware(thunk),
  reduxReactRouter({ routes, createHistory })
)(createStore)(reducer, initialState);

store.subscribe(() => console.log(store.getState()));
window.store = store;
window.dispatchTree = getDispatchTree(store.dispatch);

/* Render */

render(
  <Provider store={store}>
    <ReduxRouter />
  </Provider>,
  document.getElementById('app')
);
