import _ from 'lodash';
import { expect } from 'chai';
import { separateStateAndXforms } from '../index';

describe('separateStateAndXforms', () => {

  const stateAndFunctions = {
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
  };

  const { state, xforms } = separateStateAndXforms(stateAndFunctions);

  describe('state', () => {

    it('should contain only the values of the tree', () => {
      expect(state).to.deep.equal({
        array: [],
        object: {
          value: 0
        },
        foo: {
          array: [],
          bar: {
            object: {}
          }
        }
      });
    });

  });

  describe('xforms', () => {
    it('should contain only the xforms of the tree', () => {
      expect(xforms).to.deep.equal({
        arrayMutation: _.noop,
        objectMutation: _.noop,
        foo: {
          fooArrayMutation: _.noop,
          bar: {
            barMutation: _.noop
          }
        }
      });
    });
  });

});
