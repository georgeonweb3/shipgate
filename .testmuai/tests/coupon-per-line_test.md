---
mode: testing
url: "{{app_url}}"
max_steps: 30
tags: [checkout, coupon, attack, bug-catcher]
variables:
  app_url: http://127.0.0.1:4173
---

# Coupon discount must apply once per order, not once per line

## Open the ShipGate Store

Go to {{app_url}} and confirm the page shows the heading "ShipGate Store".

## Add one of each item to the cart

Click the "Add to cart" button under "Kane Hoodie", then the "Add to cart" button under "Sticker Pack", then the "Add to cart" button under "Deploy Token". The subtotal should read $47.50.

## Apply the KANE50 coupon

Type KANE50 into the "Coupon code" field and click the "Apply" button.

## Check the order total is exactly $42.50

Look at the "Order total" on the page. It must read exactly $42.50: a $47.50 subtotal minus one $5.00 discount for the whole order. The discount shown must be $5.00, not $15.00. If the total reads $32.50, the coupon was wrongly applied once per line item and this test FAILS.
