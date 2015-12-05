import _ from 'lodash';
import { expect } from 'chai';
import {
  async,
  separateStateAndXforms
} from '../src/index';

const recursiveEvery = (test, tree) => _.reduce(tree, (memo, node) => {
  return memo &&
    _.isPlainObject(node)
      ? memo && recursiveEvery(test, node)
      : test(node);
}, true);

const storeDefs = [{
  object: {
    nestedObject: {
      nestedXform: x => x
    }
  },
  value: 'foo'
},
{
  array: [],
  object: {
    value: 0
  },
  arrayMutation: _.noop,
  objectMutation: _.noop,
  foo: {
    array: [],
    fooArrayMutation: _.noop,
    bar: {
      object: {},
      barMutation: _.noop
    }
  }
},
{
  array: [],
  object: {
    value: 0
  },
  arrayMutation: async(_.noop),
  objectMutation: async(_.noop),
  foo: {
    array: [],
    fooArrayMutation: async(_.noop),
    bar: {
      object: {},
      barMutation: async(_.noop)
    }
  }
}];

describe('separateStateAndXforms', () => {

  _.each(storeDefs, (storeDef, i) => {

    const { state, xforms } = separateStateAndXforms(storeDef);

    describe(`state ${i}`, () => {

      it('should contain only the values of the tree', () => {
        expect(recursiveEvery(_.negate(_.isFunction), state)).to.be.true;
      });

    });

    describe('xforms', () => {
      it('should contain only the xforms of the tree', () => {
        expect(recursiveEvery(_.isFunction, xforms)).to.be.true;
      });
    });

  });

});
