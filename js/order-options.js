const storageKeys = {
  items: "woodstockSpecificationItems",
  orderMeta: "woodstockOrderMeta",
  orderOptions: "woodstockOrderOptions"
};

const VAT_RATE = 0.22;
const DEMO_SERVICE_RATE = 1000;

const packagingRates = [
  { maxArea: 3, ratePerM2: 335 },
  { maxArea: 10, ratePerM2: 200 },
  { maxArea: 20, ratePerM2: 150 },
  { maxArea: 30, ratePerM2: 135 },
  { maxArea: 40, ratePerM2: 150 },
  { maxArea: 60, ratePerM2: 120 },
  { maxArea: 80, ratePerM2: 125 },
  { maxArea: Infinity, ratePerM2: 125 }
];

const packagingLabels = {
  no: "Не нужна",
  stretch: "Стрейч",
  light: "Лёгкая",
  hard: "Жёсткая",
  closed: "Глухая"
};

const serviceLabels = {
  delivery: "Доставка",
  installation: "Монтаж",
  measurement: "Замер",
  design: "Конструкторские услуги",
  other: "Другое"
};

const elements = {
  packagingSelect: document.querySelector("#packagingSelect"),
  packagingCoefficientRow: document.querySelector("#packagingCoefficientRow"),
  packagingCoefficientInput: document.querySelector("#packagingCoefficientInput"),
  packagingArea: document.querySelector("#packagingArea"),
  packagingRate: document.querySelector("#packagingRate"),
  packagingMultiplier: document.querySelector("#packagingMultiplier"),
  packagingTotal: document.querySelector("#packagingTotal"),

  serviceCheckboxes: Array.from(document.querySelectorAll("[data-service-checkbox]")),
  servicesCommentInput: document.querySelector("#servicesCommentInput"),

  sideOrderNumber: document.querySelector("#sideOrderNumber"),
  sideItemsCount: document.querySelector("#sideItemsCount"),
  sideArea: document.querySelector("#sideArea"),

  itemsTotal: document.querySelector("#itemsTotal"),
  summaryPackagingTotal: document.querySelector("#summaryPackagingTotal"),
  summaryServicesTotal: document.querySelector("#summaryServicesTotal"),
  finalTotal: document.querySelector("#finalTotal"),
  finalVat: document.querySelector("#finalVat"),

  saveOptionsBtn: document.querySelector("#saveOptionsBtn"),
  nextStepLink: document.querySelector("#nextStepLink")
};

let currentCalculation = null;

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value) || 0);
}

function readJsonFromStorage(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function getItems() {
  const items = readJsonFromStorage(storageKeys.items, []);
  return Array.isArray(items) ? items : [];
}

function getOrderMeta() {
  return readJsonFromStorage(storageKeys.orderMeta, {
    number: "—",
    date: "",
    status: "Черновик"
  });
}

function getSavedOptions() {
  return readJsonFromStorage(storageKeys.orderOptions, null);
}

function saveOptions(options) {
  sessionStorage.setItem(storageKeys.orderOptions, JSON.stringify(options));
}

function getPluralLabel(count, one, few, many) {
  const abs = Math.abs(count);
  const lastDigit = abs % 10;
  const lastTwoDigits = abs % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return many;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }

  return many;
}

function getItemsTotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
}

function getItemsArea(items) {
  return items.reduce((sum, item) => {
    if (item.productType === "flooring") {
      return sum + (Number(item.paidArea) || Number(item.area) || 0);
    }

    return sum + (Number(item.area) || 0);
  }, 0);
}

function getPackagingRate(area) {
  const matchedRate = packagingRates.find((item) => area <= item.maxArea);
  return matchedRate ? matchedRate.ratePerM2 : 0;
}

function getPackagingCoefficient(type) {
  if (type === "no") {
    return 0;
  }

  const rawValue = elements.packagingCoefficientInput.value;
  const value = Number(rawValue);

  if (rawValue === "" || !Number.isFinite(value) || value < 0) {
    return 1;
  }

  return value;
}

function calculatePackaging(area) {
  const type = elements.packagingSelect.value;
  const enabled = type !== "no";

  const rate = enabled ? getPackagingRate(area) : 0;
  const multiplier = getPackagingCoefficient(type);
  const total = Math.round(area * rate * multiplier);

  let note = "Упаковка не выбрана.";

  if (enabled) {
    note = "Стоимость упаковки рассчитана по формуле: общая площадь заказа × тариф диапазона площади × коэффициент упаковки. Коэффициент указывается менеджером, если для выбранного типа упаковки есть отдельный подтверждённый коэффициент.";
  }

  return {
    enabled,
    type,
    name: packagingLabels[type] || "Не нужна",
    area,
    rate,
    multiplier,
    total,
    needsManagerCheck: enabled && type !== "hard",
    note
  };
}

function calculateServices() {
  const selectedServices = elements.serviceCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => {
      return {
        id: checkbox.value,
        name: serviceLabels[checkbox.value] || checkbox.value,
        enabled: true,
        rate: DEMO_SERVICE_RATE,
        total: DEMO_SERVICE_RATE,
        isDemoRate: true,
        note: "Демонстрационный тариф прототипа. Требуется замена на реальный тариф Woodstock."
      };
    });

  const total = selectedServices.reduce((sum, service) => sum + service.total, 0);

  return {
    items: selectedServices,
    total,
    comment: elements.servicesCommentInput.value.trim()
  };
}

function calculateOrderOptions() {
  const items = getItems();
  const orderMeta = getOrderMeta();

  const itemsTotal = getItemsTotal(items);
  const itemsArea = Number(formatNumber(getItemsArea(items), 3).replace(",", "."));

  const packaging = calculatePackaging(itemsArea);
  const services = calculateServices();

  const optionsTotal = packaging.total + services.total;
  const finalTotal = itemsTotal + optionsTotal;
  const vat = Math.round(finalTotal * VAT_RATE / (1 + VAT_RATE));

  return {
    orderNumber: orderMeta.number,
    itemsCount: items.length,
    itemsArea,
    itemsTotal,
    packaging,
    services,
    optionsTotal,
    finalTotal,
    vat,
    vatRate: VAT_RATE,
    notes: [
      "Упаковка считается только на странице параметров заказа и не входит в стоимость отдельных позиций.",
      "Стоимость упаковки = общая площадь заказа × тариф диапазона площади × коэффициент упаковки.",
      "Коэффициент упаковки задаётся менеджером вручную, если для выбранного типа упаковки есть отдельный подтверждённый коэффициент.",
      "Коэффициент усиленной упаковки 1,3 из старой версии не переносится автоматически на новые типы упаковки.",
      "Сервисные услуги рассчитаны по демонстрационному тарифу 1 000 ₽ за выбранную услугу."
    ]
  };
}

function renderPackaging(calculation) {
  const packaging = calculation.packaging;

  elements.packagingCoefficientRow.classList.toggle("is-hidden", !packaging.enabled);

  elements.packagingArea.textContent = `${formatNumber(packaging.area, 3)} м²`;

  elements.packagingRate.textContent = packaging.enabled
    ? `${formatMoney(packaging.rate)} / м²`
    : "—";

  elements.packagingMultiplier.textContent = packaging.enabled
    ? `× ${formatNumber(packaging.multiplier, 2)}`
    : "—";

  elements.packagingTotal.textContent = formatMoney(packaging.total);
}

function renderSummary(calculation) {
  const itemLabel = getPluralLabel(
    calculation.itemsCount,
    "позиция",
    "позиции",
    "позиций"
  );

  elements.sideOrderNumber.textContent = calculation.orderNumber;
  elements.sideItemsCount.textContent = `${calculation.itemsCount} ${itemLabel}`;
  elements.sideArea.textContent = `${formatNumber(calculation.itemsArea, 3)} м²`;

  elements.itemsTotal.textContent = formatMoney(calculation.itemsTotal);
  elements.summaryPackagingTotal.textContent = formatMoney(calculation.packaging.total);
  elements.summaryServicesTotal.textContent = formatMoney(calculation.services.total);

  elements.finalTotal.textContent = formatMoney(calculation.finalTotal);
  elements.finalVat.textContent = `В том числе НДС: ${formatMoney(calculation.vat)}`;
}

function renderPage() {
  currentCalculation = calculateOrderOptions();
  renderPackaging(currentCalculation);
  renderSummary(currentCalculation);
  saveOptions(currentCalculation);
}

function applySavedOptions() {
  const savedOptions = getSavedOptions();

  if (!savedOptions) {
    return;
  }

  if (savedOptions.packaging?.type) {
    elements.packagingSelect.value = savedOptions.packaging.type;
  }

  if (
    savedOptions.packaging?.enabled &&
    savedOptions.packaging?.multiplier !== undefined &&
    savedOptions.packaging?.multiplier !== null
  ) {
    elements.packagingCoefficientInput.value = savedOptions.packaging.multiplier;
  } else {
    elements.packagingCoefficientInput.value = 1;
  }

  if (savedOptions.services?.items?.length) {
    const selectedIds = savedOptions.services.items.map((item) => item.id);

    elements.serviceCheckboxes.forEach((checkbox) => {
      checkbox.checked = selectedIds.includes(checkbox.value);
    });
  }

  elements.servicesCommentInput.value = savedOptions.services?.comment || "";
}

function handleSaveOptions() {
  saveOptions(currentCalculation);
  elements.nextStepLink.classList.remove("is-disabled");
}

function initEvents() {
  elements.packagingSelect.addEventListener("change", renderPage);
  elements.packagingCoefficientInput.addEventListener("input", renderPage);
  elements.servicesCommentInput.addEventListener("input", renderPage);

  elements.serviceCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", renderPage);
  });

  elements.saveOptionsBtn.addEventListener("click", handleSaveOptions);
}

applySavedOptions();
initEvents();
renderPage();