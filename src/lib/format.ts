/** French decimal: 4.5 → "4,5" */
export const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
