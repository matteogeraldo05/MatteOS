/** Format cents as a currency string, e.g. 1999 → "$19.99" */
export function centsToDisplay(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

/** Parse a dollar string like "$19.99" or "19.99" to cents */
export function displayToCents(value: string): number {
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''))
  return Math.round(numeric * 100)
}
