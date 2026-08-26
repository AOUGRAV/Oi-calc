const test = require("node:test");
const assert = require("node:assert/strict");
const calculations = require("../src/calculations.js");
const { cloneDefaults } = require("../src/defaults.js");

test("RORO example matches the requested calculation method", () => {
  const settings = cloneDefaults();
  const result = calculations.calculateROROTotal(
    {
      length: 5.025,
      width: 1.98,
      height: 1.992,
      cbmRateUsd: 90,
      lmRateUsd: 60,
      insurancePercent: 29.2
    },
    settings
  );

  assert.equal(calculations.roundTo(result.cbm, 4), 19.8194);
  assert.equal(calculations.roundTo(result.shippingItems[0].amount, 3), 1783.746);
  assert.equal(calculations.roundTo(result.shippingItems[1].amount, 2), 596.97);
  assert.equal(calculations.roundTo(result.shippingItems[2].amount, 4), 520.8538);
  assert.equal(calculations.roundTo(result.shippingItems[3].amount, 2), 50);
  assert.equal(calculations.roundTo(result.shippingSubtotalUsd, 4), 2951.5698);
  assert.equal(calculations.roundTo(result.shippingSubtotalSar, 2), 11068.39);
  assert.equal(calculations.roundTo(result.fixedFeesSar, 2), 3553.5);
  assert.equal(calculations.roundTo(result.profit.amountSar, 2), 2250);
  assert.equal(calculations.roundTo(result.finalSar, 2), 16871.89);
  assert.equal(calculations.roundTo(result.finalUsd, 2), 4499.17);
});

test("insurance is calculated from CBM freight only", () => {
  assert.equal(calculations.calculateInsurance(1783.746, 29.2), 520.853832);
});

test("container total adds ocean freight, enabled fees, and profit", () => {
  const settings = cloneDefaults();
  const result = calculations.calculateContainerTotal(
    {
      oceanFreight: 2500,
      currency: "SAR"
    },
    settings
  );

  const fees = settings.containerFees.reduce((sum, fee) => sum + fee.amount, 0);
  assert.equal(calculations.roundTo(result.finalSar, 2), 2500 + fees + settings.containerProfit.amount);
});

test("USD fees and USD profit are converted with exchangeRate", () => {
  const settings = cloneDefaults();
  settings.containerFees = [{ id: "x", name: "رسوم دولار", amount: 100, currency: "USD", enabled: true }];
  settings.containerProfit = { type: "fixed", amount: 50, currency: "USD" };

  const result = calculations.calculateContainerTotal(
    {
      oceanFreight: 1000,
      currency: "SAR"
    },
    settings
  );

  assert.equal(calculations.roundTo(result.finalSar, 2), 1562.5);
});
