# ShipGate

> The deploy gate that only Kane can open.

A demo storefront that ships to GitHub Pages only when Kane CLI passes every browser flow. The agent's word is worthless; only Kane's browser run can ship.

**Live demo:** https://georgeonweb3.github.io/shipgate/ (updates only on a Kane pass — a push *is* the deploy)

## Worked example

One of each item, coupon `KANE50`:

| Item | Price |
|---|---|
| Kane Hoodie | $25.00 |
| Sticker Pack | $5.00 |
| Deploy Token | $17.50 |
| **Subtotal** | **$47.50** |
| KANE50 — $5 off the whole order | −$5.00 |
| **Order total** | **$42.50** |

## How the gate works

`npm run ship` runs six Kane testmd flows against the local build in a real browser. If any flow fails, the gate exits 1, writes `.testmuai/last-failure-handoff.md` (failing flow, failing step, what the browser showed), and **nothing ships** — the live site is untouched. If all pass, the gate commits and pushes to `main`; GitHub Pages serves `docs/`, so the push is the deploy.

All money is decided by one deterministic module, `docs/verify.js` (`computeTotal()` recomputes the total from the price list only — it never trusts DOM or form values). The UI only proposes; the verifier owns the money decision. Refusals are visible on-screen errors plus a gate exit code, on the record in the Kane run log.

## The adversary test (read this before judging the bug)

**v1 contained one DELIBERATE planted bug**, labelled as such in the code (`docs/verify.js`) and here: the `KANE50` discount was applied **$5 off per line item** instead of once per order. With three lines that is $15 off, total **$32.50** — a **$10.00 leak**. It was not an accident and it was not hidden: it existed so Kane could catch it on camera. The `coupon-per-line` flow was written to catch exactly this — and it did, on Nov 26, with the exact diagnosis in the run log: "The cart treats one whole-order coupon as a separate $5.00 discount for each of the three line items." Every other guard was correct in v1: applying the coupon twice is refused, negative quantities are refused/clamped, empty-cart checkout is refused, and skipping to the success screen shows "No order placed".

The loop, as it actually ran: Kane failed the coupon flow → the gate refused to ship → the bug was fixed in one line (`discountCents = COUPON_DISCOUNT_CENTS`, commit a546bf9) → Kane re-ran → all 6 flows passed → the fix shipped (repo HEAD 9601035).

## Eval table (real Kane runs, Nov 26, UTC)

| Flow | v1 (buggy) | v2 (fixed) |
|---|---|---|
| Coupon per line ($10 leak) | **FAIL — Kane caught it, total $32.50 vs correct $42.50** | PASS 07:02 |
| Coupon twice | Inconclusive — agent stuck, harness noise | PASS 07:07 |
| Empty cart checkout | Inconclusive — 3/4, token expired mid-run | PASS 07:13 |
| Happy path checkout | Inconclusive — 0/7, OAuth token dead | PASS 07:26 |
| Skip to success | Never ran (suite killed by restart) | PASS 07:34 |
| Negative quantity | Never ran in v1 | PASS 07:49 |
| **Total through** | **$10.00 (the leak Kane caught)** | **$0.00** |

Honest note: the v1 suite was cut short by a 1-hour OAuth token expiry and a runtime restart, so only the coupon-per-line flow got a clean v1 verdict. The other v1 outcomes are recorded as inconclusive, not as passes or fails. The v2 suite ran flow-by-flow with a token refresh before each flow, 6/6 PASS, logs in `evidence/v2/`. Credits: 11,200 at login → 10,634.18 remaining (565.82 spent). Unit checks: all pass.

## Real vs simulated

| Layer | Real | Simulated / not real |
|---|---|---|
| Checkout money | No real money; test totals only, $0.00 moves | Prices are fixtures, not a payment processor |
| Browser verification | Real Kane CLI runs in a real Chrome, real pass/fail | — |
| Deploy | Real push to GitHub Pages on Kane pass | — |
| The bug | Real code defect in v1, really caught by Kane | Planted deliberately as an adversary test (labelled, not presented as accidental) |
| Agent | Muse (the coding agent) wrote the app | The "Breaker" is a persona/prompt, not a separate agent process |
| Weakness (named honestly) | Kane flows are plain-English and slow: v2 flows took 5–13 min each, so the full gate takes ~35 min. Mitigation: flows run in sequence with a token refresh before each (the 1-hour OAuth token is the binding constraint); the slowness is the price of a real browser verdict. | — |

## Criterion table

| Criterion (25% each) | How ShipGate clears it |
|---|---|
| Ships | `npm run ship` is one command; on a Kane pass the live GitHub Pages site updates. |
| Verified | Kane runs six flows in a real browser; the $10.00 coupon leak is caught with a FAIL log, a fix commit, and a PASS re-run. |
| Closed loop | Gate parses Kane's `--agent` NDJSON output; failures land in `.testmuai/last-failure-handoff.md` and feed the fix; the gate re-runs until green. |
| Craft | Zero dependencies, no build step, static `docs/`; one-command install and run; README opens with the hook, the number, and the live link. |

## How to run it

```bash
npm install          # zero runtime dependencies; installs nothing
npm start            # serve the store at http://127.0.0.1:4173
npm run test:unit    # offline unit checks for verify.js (no browser needed)
npm run test:kane    # run the Kane flows only — never deploys
npm run ship         # run the Kane flows; deploy (git push) only if ALL pass
```

Prerequisites for the Kane commands: Kane CLI installed and authenticated, and the store running (`npm start`) in another terminal. `npm run ship` refuses to deploy if the app is not reachable.

## Repo

`georgeonweb3/shipgate` — Kane CLI Online Hackathon entry (TestMu AI). Solo entry by George Agbe ([@georgeonweb3](https://github.com/georgeonweb3)). Deadline Nov 26, 2026 19:29 WAT.
