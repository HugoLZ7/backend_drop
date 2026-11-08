import { calculateCommission, calculateSettlement } from './settlement.js';

describe('calculateCommission', () => {
  it('cobra el 1% del monto recolectado', () => {
    expect(calculateCommission(30)).toBe(0.3);
  });

  it('no supera el tope de 25 USD', () => {
    expect(calculateCommission(5000)).toBe(25);
  });
});

describe('calculateSettlement', () => {
  it('una orden sin COD descuenta solo el costo de envío', () => {
    const order = {
      isCod: false,
      status: 'DELIVERED',
      shippingCost: 5,
      collectedAmount: null,
    };
    expect(calculateSettlement(order)).toBe(-5);
  });

  it('una orden COD pendiente descuenta solo el costo de envío', () => {
    const order = {
      isCod: true,
      status: 'PENDING',
      shippingCost: 5,
      collectedAmount: null,
    };
    expect(calculateSettlement(order)).toBe(-5);
  });

  it('una orden COD entregada descuenta envío y comisión del monto recolectado', () => {
    const order = {
      isCod: true,
      status: 'DELIVERED',
      shippingCost: 5,
      collectedAmount: 30,
    };
    expect(calculateSettlement(order)).toBe(24.7);
  });

  it('usa el monto recolectado aunque sea distinto al esperado', () => {
    const order = {
      isCod: true,
      status: 'DELIVERED',
      shippingCost: 5,
      collectedAmount: 35,
    };
    expect(calculateSettlement(order)).toBe(29.65);
  });

  it('aplica el tope de comisión en montos altos', () => {
    const order = {
      isCod: true,
      status: 'DELIVERED',
      shippingCost: 5,
      collectedAmount: 5000,
    };
    expect(calculateSettlement(order)).toBe(4970);
  });
});
