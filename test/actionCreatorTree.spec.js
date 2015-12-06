import _ from 'lodash';
import { expect } from 'chai';

import {
  async,
  createActionCreatorTree,
  defaultCreateActionCreator,
  thunkCreateActionCreator
} from '../src/actionCreatorTree';

const xforms = {
  arrayMutation: _.noop,
  objectMutation: _.noop,
  foo: {
    fooArrayMutation: _.noop,
    bar: {
      barMutation: _.noop
    }
  }
};

const xformsWithThunks = _.assign({}, xforms, {
  thunkXform: async(payload => (dispatch, getState, actionCreatorTree) => [payload, dispatch, getState, actionCreatorTree]),
  thunk: {
    nestedThunkXform: async(payload => (dispatch, getState, actionCreatorTree) => [payload, dispatch, getState, actionCreatorTree])
  }
});

describe('createActionCreatorTree', () => {

  describe('defaultCreateActionCreator', () => {

    const actionCreatorTree = createActionCreatorTree(xforms, defaultCreateActionCreator);

    it('should return the correct actions', () => {

      _.each([
        'arrayMutation',
        'objectMutation',
        'foo.fooArrayMutation',
        'foo.bar.barMutation'
      ], path => {
        expect(_.get(actionCreatorTree, path)('foo')).to.deep.equal({
          type: path,
          payload: 'foo'
        });
      });

    });

  });

  describe('custom createActionCreator', () => {

    describe('custom sync createActionCreator', () => {

      const actionCreatorTree = createActionCreatorTree(xforms, (fn, path) => payload => ({ type: path.join('-'), stuff: payload }));

      it('should return the correct actions', () => {

        _.each([
          'arrayMutation',
          'objectMutation',
          'foo.fooArrayMutation',
          'foo.bar.barMutation'
        ], path => {
          expect(_.get(actionCreatorTree, path)('foo')).to.deep.equal({
            type: path.replace(/\./g, '-'),
            stuff: 'foo'
          });
        });

      });

    });

    describe('thunk createActionCreator', () => {

      const actionCreatorTree = createActionCreatorTree(xformsWithThunks, thunkCreateActionCreator);
      const mockDispatch = {};
      const mockGetState = {};

      it('should return a thunk', () => {

        let [payload, dispatch, getState, actionCreatorTree2] = actionCreatorTree.thunkXform('foo')(mockDispatch, mockGetState);

        expect(payload).to.equal('foo');
        expect(dispatch).to.equal(mockDispatch);
        expect(getState).to.equal(mockGetState);
        expect(actionCreatorTree2).to.equal(actionCreatorTree);

      });

      it('should return a thunk', () => {

        let [payload, dispatch, getState, actionCreatorTree2] = actionCreatorTree.thunk.nestedThunkXform('bar')(mockDispatch, mockGetState);

        expect(payload).to.equal('bar');
        expect(dispatch).to.equal(mockDispatch);
        expect(getState).to.equal(mockGetState);
        expect(actionCreatorTree2).to.equal(actionCreatorTree);

      });

    });

  });

});
