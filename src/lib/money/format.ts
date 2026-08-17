export function formatMoney(
  value: string | bigint | null | undefined,
  currency = "IDR",
) {
  if (value == null) return "Belum ditentukan";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(BigInt(value));
}
