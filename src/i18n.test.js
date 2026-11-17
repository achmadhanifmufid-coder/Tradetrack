import { describe, expect, it } from 'vitest';
import { dict, translate } from './i18n';
import { isHttpUrl } from './ui';

describe('i18n', () => {
  it('id and en have the same keys', () => {
    expect(Object.keys(dict.en).sort()).toEqual(Object.keys(dict.id).sort());
  });
  it('fills variables and falls back to the key', () => {
    expect(translate('en', 'form.required', { label: 'Date' })).toBe('Date is required.');
    expect(translate('id', 'tradeCount', { n: 3 })).toBe('3 trade');
    expect(translate('en', 'Network down')).toBe('Network down');
  });
});

describe('isHttpUrl', () => {
  it('accepts http(s) links only', () => {
    expect(isHttpUrl('https://www.tradingview.com/x/abc123/')).toBe(true);
    expect(isHttpUrl('http://example.com')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('tradingview.com/x/abc')).toBe(false);
    expect(isHttpUrl('https://')).toBe(false);
    expect(isHttpUrl(null)).toBe(false);
  });
});
