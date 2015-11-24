import rehash, { assign, bindActionCreatorTree } from './index.js';
import _ from 'lodash';
import { createStore } from 'redux';

const {
	actionCreatorTree,
	reducer,
	state: initialState
}	= rehash({

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

});

const store = createStore(reducer, initialState);

store.subscribe(() => console.log(store.getState()));
window.store = store;
window.actionCreatorTree = actionCreatorTree;
window.dispatchTree = bindActionCreatorTree(actionCreatorTree, store.dispatch);
