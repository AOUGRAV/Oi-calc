(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else {
    root.OiCalculations = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  function roundTo(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  }

  function calculateCBM(length, width, height) {
    return length * width * height;
  }

  function calculateLM(length, width) {
    return length * width;
  }

  function calculateInsurance(baseFreight, insurancePercent) {
    return baseFreight * (insurancePercent / 100);
  }

  function convertToSAR(amount, currency, exchangeRate) {
    return currency === "USD" ? amount * exchangeRate : amount;
  }

  function convertSARToUSD(amountSar, exchangeRate) {
    return amountSar / exchangeRate;
  }

  function normalizeFee(fee, exchangeRate) {
    const amount = Number(fee.amount) || 0;
    const currency = fee.currency === "USD" ? "USD" : "SAR";
    const amountSar = convertToSAR(amount, currency, exchangeRate);
    return {
      id: fee.id,
      name: fee.name,
      amount,
      currency,
      amountSar,
      amountUsd: convertSARToUSD(amountSar, exchangeRate)
    };
  }

  function calculateProfit(baseAmountSar, profit, exchangeRate) {
    const type = profit.type === "percentage" ? "percentage" : "fixed";
    const amount = Number(profit.amount) || 0;
    const currency = profit.currency === "USD" ? "USD" : "SAR";
    const amountSar = type === "percentage" ? baseAmountSar * (amount / 100) : convertToSAR(amount, currency, exchangeRate);

    return {
      name: "هامش الربح",
      type,
      amount,
      currency: type === "percentage" ? "%" : currency,
      amountSar,
      amountUsd: convertSARToUSD(amountSar, exchangeRate)
    };
  }

  function getEnabledFees(fees, exchangeRate) {
    return (fees || [])
      .filter((fee) => fee.enabled !== false && Number(fee.amount) > 0)
      .map((fee) => normalizeFee(fee, exchangeRate));
  }

  function sumSar(items) {
    return items.reduce((total, item) => total + item.amountSar, 0);
  }

  function calculateROROTotal(inputs, settings) {
    const exchangeRate = Number(settings.exchangeRate);
    const cbm = roundTo(calculateCBM(inputs.length, inputs.width, inputs.height), 4);
    const lm = roundTo(calculateLM(inputs.length, inputs.width), 4);
    const cbmFreightUsd = cbm * inputs.cbmRateUsd;
    const lmFreightUsd = lm * inputs.lmRateUsd;
    const insuranceUsd = calculateInsurance(cbmFreightUsd, inputs.insurancePercent);
    const billDelivery = inputs.billDelivery || settings.roroBillDelivery;
    const billDeliveryAmount = Number(billDelivery.amount) || 0;
    const billDeliveryCurrency = billDelivery.currency === "SAR" ? "SAR" : "USD";
    const billDeliverySar = convertToSAR(billDeliveryAmount, billDeliveryCurrency, exchangeRate);

    const shippingItems = [
      {
        key: "cbmFreight",
        name: `CBM × ${formatRate(inputs.cbmRateUsd)} USD`,
        amount: cbmFreightUsd,
        currency: "USD",
        amountSar: convertToSAR(cbmFreightUsd, "USD", exchangeRate),
        amountUsd: cbmFreightUsd
      },
      {
        key: "lmFreight",
        name: `LM × ${formatRate(inputs.lmRateUsd)} USD`,
        amount: lmFreightUsd,
        currency: "USD",
        amountSar: convertToSAR(lmFreightUsd, "USD", exchangeRate),
        amountUsd: lmFreightUsd
      },
      {
        key: "insurance",
        name: `التأمين ${formatRate(inputs.insurancePercent)}%`,
        amount: insuranceUsd,
        currency: "USD",
        amountSar: convertToSAR(insuranceUsd, "USD", exchangeRate),
        amountUsd: insuranceUsd
      },
      {
        key: "billDelivery",
        name: "تسليم البوليصة",
        amount: billDeliveryAmount,
        currency: billDeliveryCurrency,
        amountSar: billDeliverySar,
        amountUsd: convertSARToUSD(billDeliverySar, exchangeRate)
      }
    ].filter((item) => item.amountSar > 0);

    const shippingSubtotalSar = sumSar(shippingItems);
    const fixedFees = getEnabledFees(settings.roroFees, exchangeRate);
    const fixedFeesSar = sumSar(fixedFees);
    const beforeProfitSar = shippingSubtotalSar + fixedFeesSar;
    const profit = calculateProfit(beforeProfitSar, settings.roroProfit, exchangeRate);
    const finalSar = beforeProfitSar + profit.amountSar;

    return {
      type: "RORO",
      dimensions: {
        length: inputs.length,
        width: inputs.width,
        height: inputs.height
      },
      cbm,
      lm,
      shippingItems,
      shippingSubtotalSar,
      shippingSubtotalUsd: convertSARToUSD(shippingSubtotalSar, exchangeRate),
      fixedFees,
      fixedFeesSar,
      profit,
      finalSar,
      finalUsd: convertSARToUSD(finalSar, exchangeRate),
      exchangeRate
    };
  }

  function calculateContainerTotal(inputs, settings) {
    const exchangeRate = Number(settings.exchangeRate);
    const oceanAmount = Number(inputs.oceanFreight) || 0;
    const oceanCurrency = inputs.currency === "USD" ? "USD" : "SAR";
    const oceanSar = convertToSAR(oceanAmount, oceanCurrency, exchangeRate);
    const fixedFees = getEnabledFees(settings.containerFees, exchangeRate);
    const beforeProfitSar = oceanSar + sumSar(fixedFees);
    const profit = calculateProfit(beforeProfitSar, settings.containerProfit, exchangeRate);
    const finalSar = beforeProfitSar + profit.amountSar;

    return {
      type: "Container",
      oceanFreight: {
        name: "سعر الخط الملاحي للحاوية",
        amount: oceanAmount,
        currency: oceanCurrency,
        amountSar: oceanSar,
        amountUsd: convertSARToUSD(oceanSar, exchangeRate)
      },
      fixedFees,
      profit,
      finalSar,
      finalUsd: convertSARToUSD(finalSar, exchangeRate),
      exchangeRate
    };
  }

  function formatRate(value) {
    return Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 4
    });
  }

  return {
    roundTo,
    calculateCBM,
    calculateLM,
    calculateInsurance,
    calculateProfit,
    convertToSAR,
    convertSARToUSD,
    calculateROROTotal,
    calculateContainerTotal
  };
});
