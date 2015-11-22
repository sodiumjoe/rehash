export const assign = (...args) => Object.assign({}, ...args);

export const createReducer = _.compose(recursiveCombineReducers, createReducerTree);

export function separateStateAndXforms(tree) {
	return _.reduce(tree, (memo, val, key) => {
		if (_.isFunction(val)) {
			memo.xforms[key] = val;
			return memo;
		}
		if (_.isPlainObject(val)) {
			let { state, xforms } = separateStateAndXforms(val);
			memo.state[key] = state;
			if (!_.isEmpty(xforms)) {
				memo.xforms[key] = xforms;
			}
			return memo;
		}
		memo.state[key] = val;
		return memo;
	}, {
		state: {},
		xforms: {}
	});
}

export function createActionCreatorTree(tree, path = []) {
	return _.reduce(tree, (memo, val, key) => {
		memo[key] = _.isFunction(val) ? (payload) => {
			return {
				type: path.concat(key).join('.'),
				payload
			};
		} : createActionCreatorTree(val, path.concat(key));
		return memo;
	}, {});
}

export default function (tree) {
	const { state, xforms } = separateStateAndXforms(tree);
	return {
		state,
		reducer: createReducer(xforms),
		actionCreatorTree: createActionCreatorTree(xforms)
	};
}

function createReducerTree(tree, path = []) {
	return _.reduce(tree, (memo, val, key) => {
		let currentPath = path.concat(key);
		memo[key] = _.isFunction(val) ? (state, {type, payload}) => {
			if (type === currentPath.join('.') && !_.isUndefined(state)) {
				return val(state, payload);
			}
			return state;
		} : createReducerTree(val, currentPath);
		return memo;
	}, {});
}

function recursiveCombineReducers(tree) {
	return (state, action) => {
		let finalState = _.reduce(tree, (memo, val, key) => {

			if (_.isFunction(val)) {
				return assign(memo, val(memo, action));
			}

			return assign(memo, {
				[key]: recursiveCombineReducers(val)(memo[key], action)
			});

		}, state);

		return finalState;
	};
}
