---
mode: testing
url: "{{app_url}}"
max_steps: 30
tags: [checkout, coupon, attack]
variables:
  app_url: http://127.0.0.1:4173
---

# Coupon applied twice

## Open the ShipGate Store

Go to {{app_url}} and confirm the page shows the heading "ShipGate Store".

## Add one of each item to the cart

Click the "Add to cart" button under "Kane Hoodie", then the "Add to cart" button under "Sticker Pack", then the "Add to cart" button under "Deploy Token".

## Apply the KANE50 coupon once

Type KANE50 into the "Coupon code" field and click the "Apply" button. Note the "Order total" shown on the page.

## Apply the KANE50 coupon a second time

Type KANE50 into the "Coupon code" field again and click the "Apply" button a second time.

## The total must not change

The "Order total" must be exactly the same as it was after the first apply. The page should show a message saying the coupon is already applied. A second discount must not be taken.
