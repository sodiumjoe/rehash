import { render } from 'react-dom';
import React, { createClass } from 'react';
import { connect, Provider } from 'react-redux';
import { Link, Route, IndexRoute } from 'react-router';
import { ReduxRouter, routerStateReducer, reduxReactRouter } from 'redux-router';
import rehash, { assign, bindActionCreatorTree } from './index.js';
import _ from 'lodash';
import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

/* Containers */

const App = createClass({
  render() {
    return <div>{this.props.children}</div>;
  }
});

const Welcome = connect(state => state.root)(createClass({
  render() {
    return (
      <div>
        welcome
        {JSON.stringify(this.props.items)}
        <Link to='/goodbye'>Another route</Link>
      </div>
    );
  }
}));

const Goodbye = connect(state => state.root)(createClass({
  render() {
    return (
      <div>
        goodbye
        {JSON.stringify(this.props.pagination)}
      </div>
    );
  }
}));

/* Routes */

const routes = (
  <Route path="/" component={App}>
    <IndexRoute component={Welcome} />
    <Route path="goodbye" component={Goodbye} />
  </Route>
);

/* Reducer */

const rehashDef = {

  items: ['foo'],

  addItem(state, item) {
    return assign(state, {
      items: state.items ? state.items.concat(item) : [item]
    });
  },

  pagination: {

    currentPageIndex: 0,
    totalPages: 5,

    onPageSelect(state, pageNum) {
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

const {
  actionCreatorTree,
  reducer: rootReducer,
  state
} = rehash(rehashDef);

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
window.actionCreatorTree = actionCreatorTree;
window.dispatchTree = bindActionCreatorTree(actionCreatorTree, store.dispatch);

/* Render */

render(
  <Provider store={store}>
    <ReduxRouter />
  </Provider>,
  document.getElementById('app')
);
