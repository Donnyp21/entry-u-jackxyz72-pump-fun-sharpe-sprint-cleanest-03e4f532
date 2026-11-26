// FlowDip — sniper-first entries on the pump.fun replay, tuned for hourly Sharpe.
//
// The strategy lives in strategy.ts; this file only wires it to the harness.
// Run by the grader as `node /bot/main.ts`; the SDK shim is vendored in vendor/.

import { runBot } from './vendor/makefun-bot.ts';
import { createStrategy, DEFAULT_PARAMS } from './strategy.ts';

await runBot(createStrategy(DEFAULT_PARAMS));
