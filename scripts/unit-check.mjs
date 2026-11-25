// unit-check.mjs — offline unit checks for docs/verify.js.
// No browser, no Kane, no network. Run: node scripts/unit-check.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require('../docs/verify.js');

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
  if (!ok) failures += 1;
}

const CART_3 = { hoodie: 1, sticker: 1, token: 1 };

// 1. The correct total, computed independently from the price list:
//    25.00 + 5.00 + 17.50 = 47.50 subtotal; one $5 coupon = $42.50.
check('independent correct total (47.50 - 5.00)', 47.5 - 5.0, 42.5);

// 2. The buggy v1 total: the planted per-line bug gives $15 off, $32.50.
const buggy = V.computeTotal(CART_3, 'KANE50');
check('v1 computeTotal subtotal', buggy.subtotal, 47.5);
check('v1 computeTotal discount (per-line bug: 3 x $5)', buggy.discount, 15.0);
check('v1 computeTotal total (buggy)', buggy.total, 32.5);
check('v1 leak vs correct total', +(42.5 - buggy.total).toFixed(2), 10.0);

// 3. No coupon: full subtotal, no discount.
check('no-coupon total', V.computeTotal(CART_3, null), { subtotal: 47.5, discount: 0, total: 47.5 });

// 4. Coupon twice: first apply ok, second refused, coupon unchanged.
const first = V.applyCoupon(null, 'KANE50');
check('first coupon apply ok', first.ok, true);
const second = V.applyCoupon(first.coupon, 'KANE50');
check('second coupon apply refused', second.ok, false);
check('coupon unchanged after refused re-apply', second.coupon, 'KANE50');
check('invalid coupon refused', V.applyCoupon(null, 'NOPE').ok, false);

// 5. Negative quantity: total never drops (clamped to 1 per line).
const neg = V.computeTotal({ hoodie: -1, sticker: 0, token: 0 }, null);
check('negative qty clamped, total stays $25.00', neg.total, 25.0);
const zero = V.computeTotal({ hoodie: 0, sticker: 1, token: 0 }, null);
check('zero qty line contributes $0 (sticker only)', zero.total, 5.0);

// 6. Empty cart checkout refused.
check('empty cart refused', V.validateCheckout({ hoodie: 0, sticker: 0, token: 0 }, { name: 'A', email: 'a@b.co', card: '4242424242424242' }).ok, false);

// 7. Negative-quantity checkout refused.
check('negative qty checkout refused', V.validateCheckout({ hoodie: -1, sticker: 0, token: 0 }, { name: 'A', email: 'a@b.co', card: '4242424242424242' }).ok, false);

// 8. Valid checkout passes.
const valid = V.validateCheckout(CART_3, { name: 'George Agbe', email: 'george@example.com', card: '4242 4242 4242 4242' });
check('valid checkout passes', valid, { ok: true, reason: '' });

// 9. Bad form fields refused.
check('missing name refused', V.validateCheckout(CART_3, { name: '', email: 'a@b.co', card: '4242424242424242' }).ok, false);
check('bad email refused', V.validateCheckout(CART_3, { name: 'A', email: 'not-an-email', card: '4242424242424242' }).ok, false);
check('short card refused', V.validateCheckout(CART_3, { name: 'A', email: 'a@b.co', card: '1234' }).ok, false);

console.log(failures === 0 ? '\nAll unit checks passed.' : `\n${failures} unit check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
