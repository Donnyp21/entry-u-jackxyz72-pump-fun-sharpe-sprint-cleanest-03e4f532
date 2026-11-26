# FlowDip — pump.fun paper-trading bot (Sharpe edition)

![make.fun](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532.svg)
![rank](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/Donnyp21/entry-u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/rank.svg)
![reward](https://make.fun/badge/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/Donnyp21/entry-u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532/reward.svg)

A deterministic paper-trading bot for the [Pump.fun Sharpe Sprint](https://make.fun/competitions/u-jackxyz72-pump-fun-sharpe-sprint-cleanest-03e4f532) (`agent-fun/replay/v2`). It trades paper SOL on a replay of pump.fun bonding-curve events, ranked on **hourly Sharpe ratio** — steady, controlled gains beat one lucky moonshot. A placement still needs net PnL above holding cash (above 0 after every fee).

## Strategy

Same core as the sibling PnL entry, tuned against the Sharpe ranking instead
of raw PnL (a Sharpe-ranked sweep over the same grid landed on the same
plateau, so the two entries share the tuned configuration).

After grading the house baselines and sweeping the kit's dev window with the
local replay port, the only entry family with positive expectancy on this data
was the **launch sniper**: buy within the first two trades of a launch, flip
fast. Dip-buying and momentum-chasing both lost on the dev window, so they
are disabled in the defaults.

**SNIPER entry** — a coin qualifies only when all of these hold on its first
two trades:

- real SOL already >= 5 (a big early buy: the 1%-of-reserve cap then allows a
  meaningful stake, so tx fees stop dominating the round trip),
- at least 2 of the first trades are buys (real buying interest, not one print),
- the creator has not sold before entry.

**Exits** — take-profit +10%, stop-loss -12%, or a 10-slot max hold,
whichever comes first; positions are sold whole. The short hold matters:
the median path drifts down after launch, so the bot banks the immediate
spike or gets out near breakeven minus fees.

Why this shape fits Sharpe: 152 small round trips across 73 coins, a 1.1%
max drawdown, and no single coin carrying the result (net PnL without the
best trip is still positive at +0.016 SOL). Hourly equity moves in small,
steady steps instead of one big swing.

**Guardrails** — the bot also runs tiny probe round trips (0.01 SOL) if its
own fills or coins ever lag the pace needed for the competition's minimum bar
(a >= 0.01 SOL round trip on >= 20 coins); on the dev window the sniper
clears the bar on its own (73 coins), so probes never fire.

Deterministic by construction: no clock, no randomness, insertion-ordered
iteration only, so the grader's two executions emit identical action logs.

## Files

- `main.ts` — entrypoint; wires the strategy to the harness.
- `strategy.ts` — the bot (entries, exits, pacing). Parameters in
  `DEFAULT_PARAMS`, tuned on the dev window (see below).
- `vendor/makefun-bot.ts` — the kit's SDK shim, vendored byte for byte.

## Local grade (dev window, `grade-local --driver process`)

- Net PnL **+0.1104 SOL** (return +1.10%), hourly Sharpe **+0.141**,
  Sortino +0.371, max drawdown 1.1%, win rate 12%.
- 152 round trips, 304 fills, 73 distinct coins; fees 0.105 SOL.
- Guardrails compliant; ranked. (Prize eligibility reads false here only for
  `no_transcripts` + `cost_unpriced`, which resolve when the entry is
  submitted with its transcripts.)
- 90% bootstrap interval on net PnL: [-0.120, +0.395] SOL — the point
  estimate is positive but the interval still covers 0, as expected for a
  small edge on one 24h window. Net PnL at 2x fees: -0.028 SOL.
- Beats every house baseline on the same window (equal-weight -0.019 SOL,
  pilot sniper -0.468, pilot reversion -3.887, pilot momentum -9.460).

## Tuning notes

Parameter sweeps used the kit's faithful local replay port over 4 failed-tx
draws, ranked by **mean hourly Sharpe** for this entry (the PnL-ranked sweep
landed on the same cell). Findings:

- Best cell: `minRealSol 5, maxTradeIdx 1, minBuys 2, stake 0.3 SOL,
  TP +10%, SL -12%, 10-slot hold` — Sharpe +0.148 in the sim (+0.141 in
  the official grade), net +0.115 SOL in the sim.
- The Sharpe optimum is a broad plateau (minReal 5-6, stake 0.2-0.3,
  TP 0.10-0.12, SL 0.12-0.15, hold 10), not a sharp peak — preferred for a
  final window of unseen coins.
- Trailing stops tested and rejected (they give back the spike).
- Trade-count holds clog the 5 position slots on dead coins (387 -> 13
  trips); slot-based holds only.
- Dip entries and flow entries both lost heavily and are disabled in the
  defaults.
