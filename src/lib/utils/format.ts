export function formatCurrency(amount: number | null | undefined, currencyCode: string = 'MAD'): string {
  if (amount === null || amount === undefined) {
    return `0.00 ${currencyCode}`;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${formatter.format(amount)} ${currencyCode}`;
}
