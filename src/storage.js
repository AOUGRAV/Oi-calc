(function (root) {
  const STORAGE_KEY = "oi-shipping-calculator-settings";
  const { cloneDefaults } = root.OiDefaults;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadSettings() {
    const fallback = cloneDefaults();
    const raw = root.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }

    try {
      return mergeSettings(fallback, JSON.parse(raw));
    } catch (error) {
      console.warn("Unable to parse saved settings", error);
      return fallback;
    }
  }

  function mergeSettings(defaults, saved) {
    return {
      ...defaults,
      ...saved,
      roroBillDelivery: {
        ...defaults.roroBillDelivery,
        ...(saved.roroBillDelivery || {})
      },
      roroProfit: {
        ...defaults.roroProfit,
        ...(saved.roroProfit || {})
      },
      containerProfit: {
        ...defaults.containerProfit,
        ...(saved.containerProfit || {})
      },
      roroFees: Array.isArray(saved.roroFees) ? saved.roroFees : defaults.roroFees,
      containerFees: Array.isArray(saved.containerFees) ? saved.containerFees : defaults.containerFees
    };
  }

  function saveSettings(settings) {
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  function resetSettings() {
    const settings = cloneDefaults();
    saveSettings(settings);
    return clone(settings);
  }

  root.OiStorage = {
    loadSettings,
    saveSettings,
    resetSettings,
    clone
  };
})(window);
