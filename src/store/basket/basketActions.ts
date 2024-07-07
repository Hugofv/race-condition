// Externals
import { Action, Dispatch } from 'redux';
import axios from 'axios';

import BasketItem from '../../models/BasketItem';
import { IState } from '../rootReducer';

let timerId: number = 0;

function throttle(func: () => void, delay = 0) {
  if (timerId) {
    return;
  }

  timerId = setTimeout(function () {
    func();

    timerId = 0;
  }, delay);
}

function calculateBasket() {
  return (dispatch: Dispatch<Action>, getState: () => IState) => {
    const state: IState = getState();

    const newTotal = state.basket.items.reduce(
      (previousValue: number, currentValue) => {
        const basketItemTotal = currentValue.itemPrice * currentValue.quantity;

        return previousValue + basketItemTotal;
      },
      0
    );

    // Simulate a real validate basket
    axios
      .get('https://2486713dae314753ae6b0ff127002d12.api.mockbin.io/')
      .then(function () {
        dispatch({
          type: 'update-basket-totals',
          payload: newTotal,
        });
      })
      .finally(() => {
        dispatch({
          type: 'calculating_basket',
          payload: false,
        });
      });
  };
}

export function incrementItem(basketItem: BasketItem) {
  return (dispatch: Dispatch<Action>, getState: () => IState) => {
    const state: IState = getState();

    dispatch({
      type: 'calculating_basket',
      payload: true,
    });

    const basketItems = state.basket.items.map((item) => {
      if (item.id === basketItem.id) {
        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }
      return item;
    });

    dispatch({
      type: 'update-basket',
      payload: basketItems,
    });

    throttle(() => calculateBasket()(dispatch, getState), 3000);
  };
}

export function decrementItem(basketItem: BasketItem) {
  return (dispatch: Dispatch<Action>, getState: () => IState) => {
    const state: IState = getState();

    const foundItem = state.basket.items.find((item) => {
      return item.id === basketItem.id;
    });

    // Disabling 0 quantity
    if (foundItem?.quantity === 1) {
      return;
    }

    dispatch({
      type: 'calculating_basket',
      payload: true,
    });

    const basketItems = state.basket.items.map((item) => {
      if (item.id === basketItem.id) {
        return {
          ...item,
          quantity: item.quantity - 1,
        };
      }

      return item;
    });

    dispatch({
      type: 'update-basket',
      payload: basketItems,
    });

    throttle(() => calculateBasket()(dispatch, getState), 3000);
  };
}
