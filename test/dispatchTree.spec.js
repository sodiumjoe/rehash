import _ from 'lodash';
import { expect } from 'chai';

import {
  async,
  createDispatchTree,
  defaultCreateActionCreator,
  thunkCreateActionCreator
} from '../src/dispatchTree';

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
  thunkXform: async(payload => (dispatchTree, getState) => [payload, dispatchTree, getState]),
  thunk: {
    nestedThunkXform: async(payload => (dispatchTree, getState) => [payload, dispatchTree, getState])
  }
});

describe('createDispatchTree', () => {

  describe('defaultCreateActionCreator', () => {

    const dispatchSpy = sinon.spy();
    const dispatchTree = createDispatchTree(xforms, defaultCreateActionCreator)(dispatchSpy);

    beforeEach(() => dispatchSpy.reset());

    _.each([
      'arrayMutation',
      'objectMutation',
      'foo.fooArrayMutation',
      'foo.bar.barMutation'
    ], path => {

      describe(path, () => {
        it('should call dispatch with the correct actions', () => {
          _.get(dispatchTree, path)('foo');
          const { args: [action] } = dispatchSpy.getCall(0);
          expect(action).to.deep.equal({ type: path, payload: 'foo' });
        });

      });

    });

  });

  describe('custom createActionCreator', () => {

    describe('custom sync createActionCreator', () => {

      const dispatchSpy = sinon.spy();
      const customCreateActionCreator = (path, fn) => payload => ({ type: path.join('-'), stuff: payload });
      const dispatchTree = createDispatchTree(xforms, customCreateActionCreator)(dispatchSpy);

      beforeEach(() => dispatchSpy.reset());

      _.each([
        'arrayMutation',
        'objectMutation',
        'foo.fooArrayMutation',
        'foo.bar.barMutation'
      ], path => {

        describe(path, () => {
          it('should call dispatch with the correct actions', () => {
            _.get(dispatchTree, path)('foo');
            const { args: [action] } = dispatchSpy.getCall(0);
            expect(action).to.deep.equal({
              type: path.replace(/\./g, '-'),
              stuff: 'foo'
            });
          });
        });

      });

    });

    describe('thunk createActionCreator', () => {

      const dispatchSpy = sinon.spy();
      const dispatchTree = createDispatchTree(xformsWithThunks, thunkCreateActionCreator)(dispatchSpy);
      const mockGetState = {};

      beforeEach(() => dispatchSpy.reset());

      it('should call dispatch with a thunk', () => {
        dispatchTree.thunkXform('foo');
        const thunk = dispatchSpy.getCall(0).args[0];
        expect(thunk(dispatchTree, mockGetState)).to.deep.equal([
          'foo',
          dispatchTree,
          mockGetState
        ]);
      });

      it('should call dispatch a thunk', () => {
        dispatchTree.thunk.nestedThunkXform('bar');
        const thunk = dispatchSpy.getCall(0).args[0];
        expect(thunk(dispatchTree, mockGetState)).to.deep.equal([
          'bar',
          dispatchTree,
          mockGetState
        ]);
      });

    });

  });

});
