import _ from 'lodash';
import { expect } from 'chai';
import { assign } from '../src/index';
import { async, isThunk } from '../src/actionCreatorTree';
import { createReducerTree, recursiveCombineReducers } from '../src/reducer';

const pureXforms = {
  arrayMutation: (state, item) => assign(state, { array: state.array.concat(item) }),
  objectMutation: (state, payload) => assign(state, { object: assign(state.object, payload) }),
  foo: {
    fooArrayMutation: (state, item) => assign(state, { array: state.array.concat(item) }),
    bar: {
      barMutation: (state, payload) => assign(state, { object: assign(state.object, payload) })
    }
  }
};

const xformsWithThunks = _.assign({}, pureXforms, {
  thunkXform: async(payload => (dispatch, getState, actionCreatorTree) => [payload, dispatch, getState, actionCreatorTree]),
  thunk: {
    nestedThunkXform: async(payload => (dispatch, getState, actionCreatorTree) => [payload, dispatch, getState, actionCreatorTree])
  }
});

describe('createReducerTree', () => {

  _.each([pureXforms, xformsWithThunks], xforms => {

    describe('pureXforms', () => {

      const reducerTree = createReducerTree(xforms);

      describe('arrayMutation', () => {
        it('should return the correct values', () => {
          const initialState = { array: [] };
          const action = { type: 'arrayMutation', payload: 'foo' };
          const expectedState = { array: ['foo'] };
          expect(reducerTree.arrayMutation(initialState, action)).to.deep.equal(expectedState);
        });
      });

      describe('objectMutation', () => {
        it('should return the correct values', () => {
          const initialState = { object: {} };
          const action = { type: 'objectMutation', payload: { foo: 'bar' } }
          const expectedState = { object: { foo: 'bar' } };
          expect(reducerTree.objectMutation(initialState, action)).to.deep.equal(expectedState);
        });
      });

      describe('foo.fooArrayMutation', () => {
        it('should return the correct values', () => {
          const initialState = { array: [] };
          const action = { type: 'foo.fooArrayMutation', payload: 'bar' };
          const expectedState = { array: ['bar'] };
          expect(reducerTree.foo.fooArrayMutation(initialState, action)).to.deep.equal(expectedState);
        });
      });

      describe('foo.bar.barMutation', () => {
        it('should return the correct values', () => {
          const initialState = { object: {} };
          const action = { type: 'foo.bar.barMutation', payload: { foo: 'baz' } }
          const expectedState = { object: { foo: 'baz' } };
          expect(reducerTree.foo.bar.barMutation(initialState, action)).to.deep.equal(expectedState);
        });
      });

    });

  });

  describe('custom reducerTreeFilterFn', () => {

    const reducerTree = createReducerTree(xformsWithThunks, isThunk);

    describe('thunkXform', () => {
      it('should be undefined in the reducer tree', () => {
        expect(reducerTree.thunkXform).to.be.undefined;
      });
    });

    describe('thunkXform', () => {
      it('should be undefined in the reducer tree', () => {
        expect(reducerTree.thunk.nestedThunkXform).to.be.undefined;
      });
    });

  });

});

describe('recursiveCombineReducers', () => {

  const initialState = {
    array: [],
    object: {},
    foo: {
      array: [],
      bar: {
        object: {}
      }
    }
  };

  const reducer = recursiveCombineReducers(createReducerTree(pureXforms));

  describe('arrayMutation', () => {
    it('should mutate the state correctly', () => {
      const action = { type: 'arrayMutation', payload: 'foo' };
      const expectedState = {
        array: ['foo'],
        object: {},
        foo: {
          array: [],
          bar: {
            object: {}
          }
        }
      };
      expect(reducer(initialState, action)).to.deep.equal(expectedState);
    });
  });

  describe('objectMutation', () => {
    it('should mutate the state correctly', () => {
      const action = { type: 'objectMutation', payload: { foo: 'bar' } };
      const expectedState = {
        array: [],
        object: { foo: 'bar' },
        foo: {
          array: [],
          bar: {
            object: {}
          }
        }
      };
      expect(reducer(initialState, action)).to.deep.equal(expectedState);
    });
  });

  describe('foo.fooArrayMutation', () => {
    it('should mutate the state correctly', () => {
      const action = { type: 'foo.fooArrayMutation', payload: 'bar' };
      const expectedState = {
        array: [],
        object: {},
        foo: {
          array: ['bar'],
          bar: {
            object: {}
          }
        }
      };
      expect(reducer(initialState, action)).to.deep.equal(expectedState);
    });
  });

  describe('bar.barMutation', () => {
    it('should mutate the state correctly', () => {
      const action = { type: 'foo.bar.barMutation', payload: { baz: 'qux' } };
      const expectedState = {
        array: [],
        object: {},
        foo: {
          array: [],
          bar: {
            object: { baz: 'qux' }
          }
        }
      };
      expect(reducer(initialState, action)).to.deep.equal(expectedState);
    });
  });

});
