// verify.js — the deterministic safety owner for ShipGate Store.
//
// EVERY money decision in this app goes through this module. The UI only
// proposes (cart contents, coupon code); this module recomputes the total
// from the PRICE LIST below and never trusts DOM or form values for money.
//
// Works in the browser (window.ShipGateVerify) and in Node (module.exports)
// so the same code can be unit-checked without a browser.

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ShipGateVerify = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Prices in cents (integer math — no float rounding on money).
  var PRICES_CENTS = {
    hoodie: 2500, // Kane Hoodie — $25.00
    sticker: 500, // Sticker Pack — $5.00
    token: 1750, // Deploy Token — $17.50
  };

  var COUPON_CODE = 'KANE50';
  var COUPON_DISCOUNT_CENTS = 500; // $5.00 off the whole order, once.

  function toDollars(cents) {
    return Math.round(cents) / 100;
  }

  // Count distinct product lines with a quantity of at least 1.
  function lineCount(cart) {
    var count = 0;
    Object.keys(PRICES_CENTS).forEach(function (id) {
      if (cart && cart[id] && Number(cart[id]) >= 1) count += 1;
    });
    return count;
  }

  // Clamp a quantity to a sane value: integer, never below 1.
  function sanitizeQty(qty) {
    var n = Math.floor(Number(qty));
    if (!isFinite(n) || n < 1) return 1;
    return n;
  }

  // Recompute the order total from the price list only.
  // cart: { hoodie: n, sticker: n, token: n } — quantities.
  // couponCode: string or null.
  // Returns { subtotal, discount, total } in dollars.
  function computeTotal(cart, couponCode) {
    var subtotalCents = 0;
    Object.keys(PRICES_CENTS).forEach(function (id) {
      var qty = cart && cart[id] ? sanitizeQty(cart[id]) : 0;
      subtotalCents += PRICES_CENTS[id] * qty;
    });

    var discountCents = 0;
    if (couponCode === COUPON_CODE) {
      // Fixed in v2: Kane caught the v1 bug live (coupon-per-line flow,
      // 2026-11-26) — the $5 discount was applied once PER LINE ITEM
      // ($15 off on 3 lines, total $32.50). Correct: once per order.
      discountCents = COUPON_DISCOUNT_CENTS;
    }

    if (discountCents > subtotalCents) discountCents = subtotalCents;
    return {
      subtotal: toDollars(subtotalCents),
      discount: toDollars(discountCents),
      total: toDollars(subtotalCents - discountCents),
    };
  }

  // Apply a coupon code. Refuses a second application: one coupon
  // per order, ever. Pure — no DOM, no hidden state.
  // currentCoupon: the coupon already applied (string or null).
  // Returns { ok, coupon, reason }.
  function applyCoupon(currentCoupon, code) {
    var clean = String(code || '').trim().toUpperCase();
    if (clean !== COUPON_CODE) {
      return { ok: false, coupon: currentCoupon || null, reason: 'Invalid coupon code.' };
    }
    if (currentCoupon) {
      return { ok: false, coupon: currentCoupon, reason: 'Coupon ' + COUPON_CODE + ' is already applied. Only one coupon per order.' };
    }
    return { ok: true, coupon: COUPON_CODE, reason: '' };
  }

  // Validate a checkout attempt. Returns { ok, reason }.
  // Refuses: empty cart, unknown product, quantity below 1 or not a
  // whole number, missing name, bad email, card number too short.
  function validateCheckout(cart, form) {
    var ids = Object.keys(PRICES_CENTS);
    var itemCount = 0;
    for (var i = 0; i < ids.length; i++) {
      var qty = cart ? cart[ids[i]] : 0;
      if (qty) {
        if (!Object.prototype.hasOwnProperty.call(PRICES_CENTS, ids[i])) {
          return { ok: false, reason: 'Unknown product in cart.' };
        }
        if (!Number.isInteger(Number(qty)) || Number(qty) < 1) {
          return { ok: false, reason: 'Quantity must be a whole number of at least 1.' };
        }
        itemCount += Number(qty);
      }
    }
    if (itemCount === 0) {
      return { ok: false, reason: 'Your cart is empty. Add an item before checking out.' };
    }
    form = form || {};
    if (!String(form.name || '').trim()) {
      return { ok: false, reason: 'Please enter your name.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || '').trim())) {
      return { ok: false, reason: 'Please enter a valid email address.' };
    }
    var cardDigits = String(form.card || '').replace(/\D/g, '');
    if (cardDigits.length < 12) {
      return { ok: false, reason: 'Please enter a valid card number (test data only).' };
    }
    return { ok: true, reason: '' };
  }

  return {
    PRICES_CENTS: PRICES_CENTS,
    COUPON_CODE: COUPON_CODE,
    COUPON_DISCOUNT_CENTS: COUPON_DISCOUNT_CENTS,
    computeTotal: computeTotal,
    applyCoupon: applyCoupon,
    validateCheckout: validateCheckout,
    sanitizeQty: sanitizeQty,
    lineCount: lineCount,
  };
});
