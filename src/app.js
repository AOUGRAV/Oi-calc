(function () {
  const { calculateROROTotal, calculateContainerTotal } = window.OiCalculations;
  const storage = window.OiStorage;

  let settings = storage.loadSettings();
  let draftSettings = storage.clone(settings);
  let pendingConfirm = null;
  let lastSubmitMode = "details";

  const elements = {
    navButtons: document.querySelectorAll(".nav-button"),
    views: {
      roro: document.getElementById("roroView"),
      container: document.getElementById("containerView"),
      settings: document.getElementById("settingsView")
    },
    exchangeRateLabels: document.querySelectorAll("[data-exchange-rate]"),
    roroForm: document.getElementById("roroForm"),
    roroError: document.getElementById("roroError"),
    roroResult: document.getElementById("roroResult"),
    containerForm: document.getElementById("containerForm"),
    containerError: document.getElementById("containerError"),
    containerResult: document.getElementById("containerResult"),
    settingsForm: document.getElementById("settingsForm"),
    settingsError: document.getElementById("settingsError"),
    roroFeesEditor: document.getElementById("roroFeesEditor"),
    containerFeesEditor: document.getElementById("containerFeesEditor"),
    toast: document.getElementById("toast"),
    feeDialog: document.getElementById("feeDialog"),
    feeDialogForm: document.getElementById("feeDialogForm"),
    confirmDialog: document.getElementById("confirmDialog"),
    confirmDialogForm: document.getElementById("confirmDialogForm")
  };

  const inputs = {
    roroLength: document.getElementById("roroLength"),
    roroWidth: document.getElementById("roroWidth"),
    roroHeight: document.getElementById("roroHeight"),
    roroCbmRate: document.getElementById("roroCbmRate"),
    roroLmRate: document.getElementById("roroLmRate"),
    roroInsurance: document.getElementById("roroInsurance"),
    overrideBillDelivery: document.getElementById("overrideBillDelivery"),
    billDeliveryOverrideWrap: document.getElementById("billDeliveryOverrideWrap"),
    roroBillDelivery: document.getElementById("roroBillDelivery"),
    containerOceanFreight: document.getElementById("containerOceanFreight"),
    containerOceanCurrency: document.getElementById("containerOceanCurrency"),
    exchangeRateInput: document.getElementById("exchangeRateInput"),
    roroBillDefaultAmount: document.getElementById("roroBillDefaultAmount"),
    roroBillDefaultCurrency: document.getElementById("roroBillDefaultCurrency"),
    roroProfitType: document.getElementById("roroProfitType"),
    roroProfitAmount: document.getElementById("roroProfitAmount"),
    roroProfitCurrency: document.getElementById("roroProfitCurrency"),
    containerProfitType: document.getElementById("containerProfitType"),
    containerProfitAmount: document.getElementById("containerProfitAmount"),
    containerProfitCurrency: document.getElementById("containerProfitCurrency")
  };

  init();

  function init() {
    bindNavigation();
    bindForms();
    renderSettings();
    syncSettingsSummary();
  }

  function bindNavigation() {
    elements.navButtons.forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.view));
    });
  }

  function bindForms() {
    document.addEventListener("click", (event) => {
      const resultButton = event.target.closest("[data-result-mode]");
      if (resultButton) {
        lastSubmitMode = resultButton.dataset.resultMode;
      }

      const addButton = event.target.closest("[data-add-fee]");
      if (addButton) {
        openFeeDialog({ scope: addButton.dataset.addFee });
      }

      const editButton = event.target.closest("[data-edit-fee]");
      if (editButton) {
        openFeeDialog({
          scope: editButton.dataset.scope,
          feeId: editButton.dataset.editFee
        });
      }

      const deleteButton = event.target.closest("[data-delete-fee]");
      if (deleteButton) {
        confirmAction({
          title: "حذف الرسوم",
          message: "هل أنت متأكد من حذف هذه الرسوم؟",
          actionLabel: "حذف",
          onConfirm: () => {
            removeFee(deleteButton.dataset.scope, deleteButton.dataset.deleteFee);
          }
        });
      }

      if (event.target.matches("[data-close-dialog]")) {
        elements.feeDialog.close();
      }

      if (event.target.matches("[data-cancel-confirm]")) {
        elements.confirmDialog.close();
      }
    });

    inputs.overrideBillDelivery.addEventListener("change", () => {
      const checked = inputs.overrideBillDelivery.checked;
      inputs.billDeliveryOverrideWrap.hidden = !checked;
      if (checked && !inputs.roroBillDelivery.value) {
        inputs.roroBillDelivery.value = settings.roroBillDelivery.amount;
      }
    });

    elements.roroForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleRoroSubmit(lastSubmitMode);
    });

    elements.containerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleContainerSubmit(lastSubmitMode);
    });

    elements.settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveSettingsFromForm();
    });

    elements.feeDialogForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveFeeFromDialog();
    });

    elements.confirmDialogForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (pendingConfirm) {
        pendingConfirm();
      }
      pendingConfirm = null;
      elements.confirmDialog.close();
    });

    document.getElementById("resetSettingsButton").addEventListener("click", () => {
      confirmAction({
        title: "إعادة ضبط الإعدادات",
        message: "سيتم إعادة جميع الأسعار إلى القيم الافتراضية. هل أنت متأكد؟",
        actionLabel: "إعادة ضبط",
        onConfirm: () => {
          settings = storage.resetSettings();
          draftSettings = storage.clone(settings);
          renderSettings();
          syncSettingsSummary();
          showToast("تمت إعادة ضبط الإعدادات");
        }
      });
    });
  }

  function switchView(viewName) {
    elements.navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === viewName);
    });
    Object.entries(elements.views).forEach(([key, view]) => {
      view.classList.toggle("is-active", key === viewName);
    });
  }

  function renderSettings() {
    inputs.exchangeRateInput.value = draftSettings.exchangeRate;
    inputs.roroBillDefaultAmount.value = draftSettings.roroBillDelivery.amount;
    inputs.roroBillDefaultCurrency.value = draftSettings.roroBillDelivery.currency;
    inputs.roroProfitType.value = draftSettings.roroProfit.type;
    inputs.roroProfitAmount.value = draftSettings.roroProfit.amount;
    inputs.roroProfitCurrency.value = draftSettings.roroProfit.currency;
    inputs.containerProfitType.value = draftSettings.containerProfit.type;
    inputs.containerProfitAmount.value = draftSettings.containerProfit.amount;
    inputs.containerProfitCurrency.value = draftSettings.containerProfit.currency;
    document.querySelector("[data-bill-currency]").textContent = draftSettings.roroBillDelivery.currency;
    renderFeesEditor("roro", draftSettings.roroFees, elements.roroFeesEditor);
    renderFeesEditor("container", draftSettings.containerFees, elements.containerFeesEditor);
  }

  function renderFeesEditor(scope, fees, target) {
    target.innerHTML = fees.map((fee) => `
      <div class="fee-row" data-fee-id="${escapeHtml(fee.id)}">
        <span class="fee-name">${escapeHtml(fee.name)}</span>
        <span class="fee-amount">${formatPlainNumber(fee.amount)}</span>
        <span class="fee-currency">${fee.currency}</span>
        <label class="fee-enabled" title="تفعيل الرسوم">
          <input type="checkbox" ${fee.enabled !== false ? "checked" : ""} data-toggle-fee="${escapeHtml(fee.id)}" data-scope="${scope}" />
        </label>
        <span>
          <button class="icon-button" type="button" title="تعديل" aria-label="تعديل ${escapeHtml(fee.name)}" data-edit-fee="${escapeHtml(fee.id)}" data-scope="${scope}">✎</button>
          <button class="icon-button" type="button" title="حذف" aria-label="حذف ${escapeHtml(fee.name)}" data-delete-fee="${escapeHtml(fee.id)}" data-scope="${scope}">×</button>
        </span>
      </div>
    `).join("");

    target.querySelectorAll("[data-toggle-fee]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const list = getFeeList(checkbox.dataset.scope);
        const fee = list.find((item) => item.id === checkbox.dataset.toggleFee);
        if (fee) {
          fee.enabled = checkbox.checked;
        }
      });
    });
  }

  function handleRoroSubmit(mode) {
    hideError(elements.roroError);
    const parsed = {
      length: parseField(inputs.roroLength),
      width: parseField(inputs.roroWidth),
      height: parseField(inputs.roroHeight),
      cbmRateUsd: parseField(inputs.roroCbmRate),
      lmRateUsd: parseField(inputs.roroLmRate),
      insurancePercent: parseField(inputs.roroInsurance, { allowZero: true })
    };

    const validationError = validateRoro(parsed);
    if (validationError) {
      showError(elements.roroError, validationError);
      elements.roroResult.innerHTML = "";
      return;
    }

    if (inputs.overrideBillDelivery.checked) {
      const billValue = parseField(inputs.roroBillDelivery, { allowZero: true });
      if (!Number.isFinite(billValue) || billValue < 0) {
        showError(elements.roroError, "قيمة تسليم البوليصة يجب ألا تكون سالبة");
        return;
      }
      parsed.billDelivery = {
        amount: billValue,
        currency: settings.roroBillDelivery.currency
      };
    }

    const result = calculateROROTotal(parsed, settings);
    elements.roroResult.innerHTML = mode === "total" ? renderTotalCard(result, "إجمالي تكلفة شحن RORO") : renderRoroQuote(result);
  }

  function handleContainerSubmit(mode) {
    hideError(elements.containerError);
    const parsed = {
      oceanFreight: parseField(inputs.containerOceanFreight),
      currency: inputs.containerOceanCurrency.value
    };

    if (!Number.isFinite(parsed.oceanFreight)) {
      showError(elements.containerError, "يرجى إدخال سعر الخط الملاحي للحاوية");
      elements.containerResult.innerHTML = "";
      return;
    }
    if (parsed.oceanFreight <= 0) {
      showError(elements.containerError, "القيمة يجب أن تكون أكبر من صفر");
      elements.containerResult.innerHTML = "";
      return;
    }

    const result = calculateContainerTotal(parsed, settings);
    elements.containerResult.innerHTML = mode === "total" ? renderTotalCard(result, "إجمالي تكلفة الحاوية") : renderContainerQuote(result);
  }

  function validateRoro(parsed) {
    if (!Number.isFinite(parsed.length) || !Number.isFinite(parsed.width) || !Number.isFinite(parsed.height)) {
      return "يرجى إدخال جميع أبعاد السيارة";
    }
    if (parsed.length <= 0 || parsed.width <= 0 || parsed.height <= 0) {
      return "أبعاد السيارة يجب أن تكون أكبر من صفر";
    }
    if (!Number.isFinite(parsed.cbmRateUsd)) {
      return "يرجى إدخال سعر CBM";
    }
    if (!Number.isFinite(parsed.lmRateUsd)) {
      return "يرجى إدخال سعر LM";
    }
    if (parsed.cbmRateUsd <= 0 || parsed.lmRateUsd <= 0) {
      return "أسعار الشحن يجب أن تكون أكبر من صفر";
    }
    if (!Number.isFinite(parsed.insurancePercent)) {
      return "يرجى إدخال نسبة التأمين";
    }
    if (parsed.insurancePercent < 0) {
      return "نسبة التأمين يجب ألا تكون سالبة";
    }
    return "";
  }

  function saveSettingsFromForm() {
    hideError(elements.settingsError);
    const exchangeRate = parseField(inputs.exchangeRateInput);
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      showError(elements.settingsError, "يرجى إدخال سعر صرف صحيح أكبر من صفر");
      return;
    }

    const roroBillAmount = parseField(inputs.roroBillDefaultAmount, { allowZero: true });
    if (!Number.isFinite(roroBillAmount) || roroBillAmount < 0) {
      showError(elements.settingsError, "رسوم تسليم البوليصة يجب ألا تكون سالبة");
      return;
    }

    const nextSettings = storage.clone(draftSettings);
    nextSettings.exchangeRate = exchangeRate;
    nextSettings.roroBillDelivery = {
      amount: roroBillAmount,
      currency: inputs.roroBillDefaultCurrency.value
    };
    nextSettings.roroProfit = collectProfit("roro");
    nextSettings.containerProfit = collectProfit("container");

    const profitError = validateProfit(nextSettings.roroProfit) || validateProfit(nextSettings.containerProfit);
    if (profitError) {
      showError(elements.settingsError, profitError);
      return;
    }

    settings = storage.clone(nextSettings);
    draftSettings = storage.clone(nextSettings);
    storage.saveSettings(settings);
    renderSettings();
    syncSettingsSummary();
    showToast("تم حفظ الإعدادات بنجاح");
  }

  function collectProfit(scope) {
    const prefix = scope === "roro" ? "roro" : "container";
    return {
      type: inputs[`${prefix}ProfitType`].value,
      amount: parseField(inputs[`${prefix}ProfitAmount`], { allowZero: true }),
      currency: inputs[`${prefix}ProfitCurrency`].value
    };
  }

  function validateProfit(profit) {
    if (!Number.isFinite(profit.amount) || profit.amount < 0) {
      return "هامش الربح يجب ألا يكون سالبًا";
    }
    return "";
  }

  function openFeeDialog({ scope, feeId }) {
    const fee = feeId ? getFeeList(scope).find((item) => item.id === feeId) : null;
    document.getElementById("feeDialogTitle").textContent = fee ? "تعديل الرسوم" : "إضافة رسوم";
    document.getElementById("feeDialogScope").value = scope;
    document.getElementById("feeDialogId").value = fee ? fee.id : "";
    document.getElementById("feeDialogName").value = fee ? fee.name : "";
    document.getElementById("feeDialogAmount").value = fee ? fee.amount : "";
    document.getElementById("feeDialogCurrency").value = fee ? fee.currency : "SAR";
    elements.feeDialog.showModal();
  }

  function saveFeeFromDialog() {
    const scope = document.getElementById("feeDialogScope").value;
    const feeId = document.getElementById("feeDialogId").value;
    const name = document.getElementById("feeDialogName").value.trim();
    const amount = Number(document.getElementById("feeDialogAmount").value);
    const currency = document.getElementById("feeDialogCurrency").value;

    if (!name || !Number.isFinite(amount) || amount < 0) {
      showToast("يرجى إدخال اسم وقيمة صحيحة للرسوم");
      return;
    }

    const list = getFeeList(scope);
    if (feeId) {
      const fee = list.find((item) => item.id === feeId);
      if (fee) {
        fee.name = name;
        fee.amount = amount;
        fee.currency = currency;
      }
    } else {
      list.push({
        id: `${scope}-${Date.now()}`,
        name,
        amount,
        currency,
        enabled: true
      });
    }

    renderSettings();
    elements.feeDialog.close();
    showToast("تم تحديث الرسوم، اضغط حفظ التغييرات لتثبيتها");
  }

  function removeFee(scope, feeId) {
    const key = scope === "roro" ? "roroFees" : "containerFees";
    draftSettings[key] = draftSettings[key].filter((fee) => fee.id !== feeId);
    renderSettings();
    showToast("تم حذف الرسوم، اضغط حفظ التغييرات لتثبيت الحذف");
  }

  function getFeeList(scope) {
    return scope === "roro" ? draftSettings.roroFees : draftSettings.containerFees;
  }

  function syncSettingsSummary() {
    elements.exchangeRateLabels.forEach((label) => {
      label.textContent = formatPlainNumber(settings.exchangeRate);
    });
    document.querySelector("[data-bill-currency]").textContent = settings.roroBillDelivery.currency;
  }

  function renderTotalCard(result, title) {
    return `
      <div class="total-card">
        <div>
          <p>${title}</p>
          <strong>${formatMoney(result.finalSar, "SAR")}</strong>
          <span>${formatMoney(result.finalUsd, "USD")}</span>
        </div>
      </div>
    `;
  }

  function renderRoroQuote(result) {
    return `
      <article class="quote">
        ${renderQuoteHeader("عرض سعر شحن", "RORO", result.exchangeRate)}
        <section class="quote-section">
          <h3>أبعاد السيارة</h3>
          <div class="metrics-grid">
            <div class="metric"><span>الطول</span><strong>${formatDimension(result.dimensions.length)} m</strong></div>
            <div class="metric"><span>العرض</span><strong>${formatDimension(result.dimensions.width)} m</strong></div>
            <div class="metric"><span>الارتفاع</span><strong>${formatDimension(result.dimensions.height)} m</strong></div>
          </div>
        </section>
        <section class="quote-section">
          <h3>القياسات</h3>
          <div class="metrics-grid">
            <div class="metric"><span>CBM</span><strong>${formatCbm(result.cbm)} CBM</strong></div>
            <div class="metric"><span>LM</span><strong>${formatCbm(result.lm)} LM</strong></div>
            <div class="metric"><span>أجور الشحن</span><strong>${formatMoney(result.shippingSubtotalSar, "SAR")}</strong></div>
          </div>
        </section>
        <section class="quote-section">
          <h3>أجور الشحن</h3>
          ${renderItemsTable(result.shippingItems, { includeUsd: true })}
        </section>
        <section class="quote-section">
          <h3>الرسوم الإضافية</h3>
          ${renderItemsTable([...result.fixedFees, result.profit], { includeUsd: true })}
        </section>
        ${renderGrandTotal(result)}
      </article>
    `;
  }

  function renderContainerQuote(result) {
    return `
      <article class="quote">
        ${renderQuoteHeader("عرض سعر شحن", "Container", result.exchangeRate)}
        <section class="quote-section">
          <h3>سعر الخط الملاحي</h3>
          ${renderItemsTable([result.oceanFreight], { includeUsd: true })}
        </section>
        <section class="quote-section">
          <h3>الرسوم الإضافية</h3>
          ${renderItemsTable([...result.fixedFees, result.profit], { includeUsd: true })}
        </section>
        ${renderGrandTotal(result)}
      </article>
    `;
  }

  function renderQuoteHeader(title, type, exchangeRate) {
    return `
      <div class="quote-header">
        <div>
          <h2>${title}</h2>
          <p>نوع الشحن: ${type}</p>
        </div>
        <div>
          <p>سعر الصرف</p>
          <strong>1 USD = ${formatPlainNumber(exchangeRate)} SAR</strong>
        </div>
      </div>
    `;
  }

  function renderItemsTable(items, options = {}) {
    const rows = items
      .filter((item) => Number(item.amountSar) > 0)
      .map((item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${renderAmount(item, options)}</td>
        </tr>
      `)
      .join("");

    return `
      <table class="quote-table">
        <thead>
          <tr>
            <th>البند</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="2">لا توجد رسوم مستخدمة</td></tr>`}</tbody>
      </table>
    `;
  }

  function renderAmount(item, options) {
    const original = item.currency === "%"
      ? `${formatPlainNumber(item.amount)}%`
      : formatMoney(item.amount, item.currency);
    const sar = formatMoney(item.amountSar, "SAR");
    const usd = formatMoney(item.amountUsd, "USD");
    const secondary = item.currency === "USD" ? original : `${original} / ${usd}`;

    if (!options.includeUsd) {
      return `<strong>${sar}</strong>`;
    }

    return `
      <span class="amount-dual">
        <strong>${sar}</strong>
        <span>${secondary}</span>
      </span>
    `;
  }

  function renderGrandTotal(result) {
    return `
      <div class="grand-total">
        <div>
          <span>الإجمالي النهائي بالريال</span>
          <strong>${formatMoney(result.finalSar, "SAR")}</strong>
        </div>
        <div>
          <span>الإجمالي النهائي بالدولار</span>
          <strong>${formatMoney(result.finalUsd, "USD")}</strong>
        </div>
      </div>
    `;
  }

  function parseField(input, options = {}) {
    if (input.value.trim() === "") {
      return Number.NaN;
    }
    const value = Number(input.value);
    if (!options.allowZero && value === 0) {
      return 0;
    }
    return value;
  }

  function formatMoney(value, currency) {
    const amount = Number(value) || 0;
    return `${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency}`;
  }

  function formatCbm(value) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  }

  function formatDimension(value) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
  }

  function formatPlainNumber(value) {
    return Number(value || 0).toLocaleString("en-US", {
      maximumFractionDigits: 4
    });
  }

  function showError(target, message) {
    target.textContent = message;
    target.hidden = false;
  }

  function hideError(target) {
    target.textContent = "";
    target.hidden = true;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      elements.toast.hidden = true;
    }, 2800);
  }

  function confirmAction({ title, message, actionLabel, onConfirm }) {
    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;
    document.getElementById("confirmActionButton").textContent = actionLabel;
    pendingConfirm = onConfirm;
    elements.confirmDialog.showModal();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
