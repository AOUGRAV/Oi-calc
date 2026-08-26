(function (root, factory) {
  const defaults = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = defaults;
  } else {
    root.OiDefaults = defaults;
  }
})(typeof self !== "undefined" ? self : this, function () {
  const DEFAULT_SETTINGS = {
    version: 1,
    exchangeRate: 3.75,
    roroBillDelivery: {
      amount: 50,
      currency: "USD"
    },
    roroProfit: {
      type: "fixed",
      amount: 600,
      currency: "USD"
    },
    containerProfit: {
      type: "fixed",
      amount: 500,
      currency: "SAR"
    },
    roroFees: [
      { id: "roro-clearance-jeddah", name: "تخليص جدة", amount: 250, currency: "SAR", enabled: true },
      { id: "roro-port-jeddah", name: "أجور موانئ جدة", amount: 115, currency: "SAR", enabled: true },
      { id: "roro-clearance-turkey", name: "تخليص تركيا", amount: 375, currency: "SAR", enabled: true },
      { id: "roro-car-insurance", name: "تأمين السيارة", amount: 750, currency: "SAR", enabled: true },
      { id: "roro-shipping-line", name: "رسوم الخط الملاحي", amount: 600, currency: "SAR", enabled: true },
      { id: "roro-port-turkey", name: "أجور موانئ تركيا", amount: 1031.25, currency: "SAR", enabled: true },
      { id: "roro-storage", name: "أجور التخزين", amount: 432.25, currency: "SAR", enabled: true }
    ],
    containerFees: [
      { id: "container-clearance-jeddah", name: "تخليص جدة", amount: 500, currency: "SAR", enabled: true },
      { id: "container-empty-return", name: "نقل وإرجاع الفارغ", amount: 400, currency: "SAR", enabled: true },
      { id: "container-unloading", name: "تفريغ الحاوية", amount: 300, currency: "SAR", enabled: true },
      { id: "container-appointment", name: "رسوم الموعد", amount: 50, currency: "SAR", enabled: true },
      { id: "container-delivery-order", name: "إذن التسليم", amount: 100, currency: "SAR", enabled: true },
      { id: "container-yard-unloading", name: "التفريغ في الساحة", amount: 300, currency: "SAR", enabled: true },
      { id: "container-ports", name: "أجور الموانئ", amount: 500, currency: "SAR", enabled: true },
      { id: "container-clearance-turkey", name: "تخليص تركيا", amount: 700, currency: "SAR", enabled: true },
      { id: "container-lashing", name: "تربيط السيارة", amount: 150, currency: "SAR", enabled: true }
    ]
  };

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  return {
    DEFAULT_SETTINGS,
    cloneDefaults
  };
});
