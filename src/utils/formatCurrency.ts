/**
 * Format currency with K/M/B/T abbreviations for large numbers
 * @param amount - The amount to format (in base currency units, not cents)
 * @param currency - Currency code (e.g., 'PKR', 'USD')
 * @param useAbbreviation - Whether to use K/M/B/T abbreviations (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PKR',
  useAbbreviation: boolean = true
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  // Format with abbreviations for large numbers
  if (useAbbreviation) {
    const absAmount = Math.abs(amount);
    let formatted: string;
    let suffix = '';

    if (absAmount >= 1_000_000_000_000) {
      formatted = (amount / 1_000_000_000_000).toFixed(1);
      suffix = 'T';
    } else if (absAmount >= 1_000_000_000) {
      formatted = (amount / 1_000_000_000).toFixed(1);
      suffix = 'B';
    } else if (absAmount >= 1_000_000) {
      formatted = (amount / 1_000_000).toFixed(1);
      suffix = 'M';
    } else if (absAmount >= 1_000) {
      formatted = (amount / 1_000).toFixed(1);
      suffix = 'K';
    } else {
      formatted = amount.toFixed(2);
    }

    // Remove trailing zeros after decimal point
    formatted = formatted.replace(/\.0+$/, '');

    // Try to format with currency symbol, fallback to simple format
    try {
      const currencySymbol = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).formatToParts(0).find(part => part.type === 'currency')?.value || currency;

      return `${currencySymbol}${formatted}${suffix}`;
    } catch {
      return `${currency} ${formatted}${suffix}`;
    }
  }

  // Standard currency formatting without abbreviations
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Format currency from cents to display format with K/M/B/T abbreviations
 * @param amountCents - The amount in cents
 * @param currency - Currency code
 * @param useAbbreviation - Whether to use K/M/B/T abbreviations (default: true)
 * @returns Formatted currency string
 */
export function formatCurrencyCents(
  amountCents: number,
  currency: string = 'PKR',
  useAbbreviation: boolean = true
): string {
  const amount = amountCents / 100;
  return formatCurrency(amount, currency, useAbbreviation);
}

/**
 * Format currency to full amount (for tooltips)
 * @param amount - The amount to format (in base currency units, not cents)
 * @param currency - Currency code (e.g., 'PKR', 'USD')
 * @returns Formatted full currency string with commas
 */
export function formatCurrencyFull(
  amount: number,
  currency: string = 'PKR'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
}

/**
 * Format currency from cents to full amount (for tooltips)
 * @param amountCents - The amount in cents
 * @param currency - Currency code
 * @returns Formatted full currency string with commas
 */
export function formatCurrencyCentsFull(
  amountCents: number,
  currency: string = 'PKR'
): string {
  const amount = amountCents / 100;
  return formatCurrencyFull(amount, currency);
}

