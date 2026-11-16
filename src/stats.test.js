import { describe, it, expect } from 'vitest';
import {
  localDate, sortTrades, balance, rMultiple, winRate, profitFactor, avgR,
  equityCurve, dailyLossRemaining, maxLossFloor, healthTone, netResult,
} from './stats';

const acc = { id: 'a1', size: 5000, dailyLossLimit: 250, maxLossLimit: 300, drawdownType: 'static' };
const t = (date, pnl, extra = {}) => ({ date, pnl, accountId: 'a1', createdAt: 0, ...extra });

describe('localDate', () => {
  it('formats local date as YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });
});

describe('sortTrades', () => {
  it('sorts by date then createdAt without mutating', () => {
    const input = [t('2026-11-02', 1, { createdAt: 2 }), t('2026-11-01', 2), t('2026-11-02', 3, { createdAt: 1 })];
    expect(sortTrades(input).map(x => x.pnl)).toEqual([2, 3, 1]);
    expect(input[0].pnl).toBe(1);
  });
});

describe('balance', () => {
  it('adds only this account pnl to size', () => {
    const trades = [t('2026-11-01', 100), t('2026-11-01', -30), t('2026-11-01', 999, { accountId: 'other' })];
    expect(balance(acc, trades)).toBe(5070);
  });
});

describe('rMultiple', () => {
  it('buy winner', () => expect(rMultiple({ entry: 100, exit: 110, stopLoss: 95 })).toBe(2));
  it('sell winner', () => expect(rMultiple({ entry: 100, exit: 90, stopLoss: 105 })).toBe(2));
  it('sell loser', () => expect(rMultiple({ entry: 100, exit: 105, stopLoss: 110 })).toBe(-0.5));
  it('null without stop loss or when stop equals entry', () => {
    expect(rMultiple({ entry: 100, exit: 110, stopLoss: null })).toBeNull();
    expect(rMultiple({ entry: 100, exit: 110, stopLoss: 100 })).toBeNull();
  });
});

describe('winRate', () => {
  it('counts breakeven as a trade but not a win', () => {
    expect(winRate([t('d', 100), t('d', -50), t('d', 0)])).toBeCloseTo(1 / 3);
  });
  it('null with no trades', () => expect(winRate([])).toBeNull());
});

describe('profitFactor', () => {
  it('gross win / gross loss', () => expect(profitFactor([t('d', 100), t('d', 50), t('d', -50)])).toBe(3));
  it('Infinity with wins and no losses', () => expect(profitFactor([t('d', 100)])).toBe(Infinity));
  it('null with no wins and no losses', () => {
    expect(profitFactor([])).toBeNull();
    expect(profitFactor([t('d', 0)])).toBeNull();
  });
});

describe('avgR', () => {
  it('averages only trades with an R', () => {
    const trades = [
      { entry: 100, exit: 110, stopLoss: 95 },
      { entry: 100, exit: 95, stopLoss: 95 },
      { entry: 1, exit: 2, stopLoss: null },
    ];
    expect(avgR(trades)).toBe(0.5);
  });
  it('null when no trade has an R', () => expect(avgR([])).toBeNull());
});

describe('equityCurve', () => {
  it('cumulative pnl in date order', () => {
    expect(equityCurve([t('2026-11-02', 50), t('2026-11-01', 100)])).toEqual([
      { date: '2026-11-01', value: 100 },
      { date: '2026-11-02', value: 150 },
    ]);
  });
});

describe('dailyLossRemaining', () => {
  it('limit plus today pnl of this account', () => {
    const trades = [t('2026-11-16', -100), t('2026-11-16', 30), t('2026-11-15', -500), t('2026-11-16', -999, { accountId: 'x' })];
    expect(dailyLossRemaining(acc, trades, '2026-11-16')).toBe(180);
  });
  it('null without a daily limit', () => {
    expect(dailyLossRemaining({ ...acc, dailyLossLimit: null }, [], '2026-11-16')).toBeNull();
  });
});

describe('maxLossFloor', () => {
  it('static: size minus limit', () => expect(maxLossFloor(acc, [t('d', 900)])).toBe(4700));
  it('missing drawdownType behaves as static', () => {
    expect(maxLossFloor({ ...acc, drawdownType: null }, [t('d', 900)])).toBe(4700);
  });
  it('trailing follows the peak balance', () => {
    const a = { ...acc, drawdownType: 'trailing' };
    expect(maxLossFloor(a, [t('2026-11-01', 200), t('2026-11-02', -100)])).toBe(4900);
  });
  it('trailing locks at account size', () => {
    const a = { ...acc, drawdownType: 'trailing' };
    expect(maxLossFloor(a, [t('2026-11-01', 500)])).toBe(5000);
  });
  it('trailing with no trades equals static', () => {
    expect(maxLossFloor({ ...acc, drawdownType: 'trailing' }, [])).toBe(4700);
  });
  it('null without a max loss limit', () => {
    expect(maxLossFloor({ ...acc, maxLossLimit: null }, [])).toBeNull();
  });
});

describe('healthTone', () => {
  it('green under 50%, yellow 50-80%, red above 80%', () => {
    expect(healthTone(40, 100)).toBe('success');
    expect(healthTone(50, 100)).toBe('warning');
    expect(healthTone(80, 100)).toBe('warning');
    expect(healthTone(81, 100)).toBe('error');
  });
});

describe('netResult', () => {
  it('payouts minus costs and ROI', () => {
    const r = netResult([
      { type: 'payout', amount: 500 },
      { type: 'cost', amount: 100 },
      { type: 'cost', amount: 50 },
    ]);
    expect(r).toEqual({ payouts: 500, costs: 150, net: 350, roi: 350 / 150 });
  });
  it('roi null without costs', () => {
    expect(netResult([{ type: 'payout', amount: 500 }]).roi).toBeNull();
  });
});
