---
mode: testing
url: "{{app_url}}"
max_steps: 30
tags: [checkout, happy-path]
variables:
  app_url: http://127.0.0.1:4173
---

# Happy path checkout

## Open the ShipGate Store

Go to {{app_url}} and confirm the page shows the heading "ShipGate Store" and the products "Kane Hoodie", "Sticker Pack" and "Deploy Token".

## Add one of each item to the cart

Click the "Add to cart" button under "Kane Hoodie", then the "Add to cart" button under "Sticker Pack", then the "Add to cart" button under "Deploy Token". The cart should now list all three items.

## Apply the KANE50 coupon

Type KANE50 into the "Coupon code" field and click the "Apply" button. A message should confirm the coupon was applied.

## Check the order total is $42.50

Look at the "Order total" on the page. It must read exactly $42.50. The subtotal is $47.50 and the discount is $5.00.

## Fill in the checkout form

Type "George Agbe" into the "Name" field, "george@example.com" into the "Email" field, and "4242 4242 4242 4242" into the "Card number" field.

## Place the order

Click the "Place order" button.

## Confirm the success screen

The page should now show the heading "Order placed", an order number starting with "SG-", and an order total of $42.50.
