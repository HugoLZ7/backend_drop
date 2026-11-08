export const COD_COMMISSION_RATE = 0.01;
export const COD_COMMISSION_CAP = 25;

type SettlementOrder = {
  isCod: boolean;
  status: string;
  shippingCost: number;
  collectedAmount: number | null;
};

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateCommission(collectedAmount: number) {
  return roundMoney(
    Math.min(collectedAmount * COD_COMMISSION_RATE, COD_COMMISSION_CAP),
  );
}

export function calculateSettlement(order: SettlementOrder) {
  const isPaid =
    order.isCod &&
    order.status === 'DELIVERED' &&
    order.collectedAmount !== null;

  if (!isPaid) {
    return roundMoney(-order.shippingCost);
  }

  const collected = order.collectedAmount as number;
  return roundMoney(
    collected - order.shippingCost - calculateCommission(collected),
  );
}
