const USD_TO_LKR_RATE = 309.56;

const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatLkrFromUsd(amount) {
  const numericAmount = Number(amount || 0);
  return lkrFormatter.format(numericAmount * USD_TO_LKR_RATE);
}

export function convertLkrToUsd(amount) {
  const numericAmount = Number(amount || 0);
  return numericAmount / USD_TO_LKR_RATE;
}

export const currencyMeta = {
  code: 'LKR',
  rateSourceBase: 'USD',
  rate: USD_TO_LKR_RATE,
};
