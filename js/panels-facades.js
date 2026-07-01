const dataUrl = "../data/panels-facades.json";

const storageKeys = {
  items: "woodstockSpecificationItems",
  editItem: "woodstockEditItem",
  editIndex: "woodstockEditIndex"
};

const params = new URLSearchParams(window.location.search);
const productType = params.get("type") || sessionStorage.getItem("woodstockProductType") || "panels";

const productLabels = {
  panels: {
    title: "Интерьерные панели",
    lead: "Расчёт стоимости по основе, размеру, шпону, кромке, шлифовке, лаку, КМ1 и дополнительным операциям.",
    spec: "Интерьерные панели"
  },
  facades: {
    title: "Мебельные фасады",
    lead: "Расчёт стоимости по основе, размеру, шпону, кромке, шлифовке, лаку, присадке и ручкам.",
    spec: "Мебельные фасады"
  }
};

const form = {
  baseSelect: document.querySelector("#baseSelect"),
  thicknessSelect: document.querySelector("#thicknessSelect"),
  baseNote: document.querySelector("#baseNote"),

  sizeRows: document.querySelector("#sizeRows"),
  addSizeRowBtn: document.querySelector("#addSizeRowBtn"),

  veneeredSidesSelect: document.querySelector("#veneeredSidesSelect"),
  veneerASelect: document.querySelector("#veneerASelect"),
  sideBModeSelect: document.querySelector("#sideBModeSelect"),
  reverseSideField: document.querySelector("#reverseSideField"),
  reverseSideSelect: document.querySelector("#reverseSideSelect"),
  veneerBField: document.querySelector("#veneerBField"),
  veneerBSelect: document.querySelector("#veneerBSelect"),
  fiberDirectionSelect: document.querySelector("#fiberDirectionSelect"),
  veneerLayoutSelect: document.querySelector("#veneerLayoutSelect"),
  textureTransitionSelect: document.querySelector("#textureTransitionSelect"),

  edgeNeededSelect: document.querySelector("#edgeNeededSelect"),
  edgeFields: document.querySelector("#edgeFields"),
  edgeSidesSelect: document.querySelector("#edgeSidesSelect"),
  edgeThicknessSelect: document.querySelector("#edgeThicknessSelect"),

  sandingNeededSelect: document.querySelector("#sandingNeededSelect"),
  sandingField: document.querySelector("#sandingField"),
  sandingSelect: document.querySelector("#sandingSelect"),

  lacquerNeededSelect: document.querySelector("#lacquerNeededSelect"),
  lacquerFields: document.querySelector("#lacquerFields"),
  lacquerTypeSelect: document.querySelector("#lacquerTypeSelect"),
  glossSelect: document.querySelector("#glossSelect"),
  lacquerSidesSelect: document.querySelector("#lacquerSidesSelect"),
  finishCommentInput: document.querySelector("#finishCommentInput"),

  panelExtrasBlock: document.querySelector("#panelExtrasBlock"),
  km1Select: document.querySelector("#km1Select"),
  radiusPanelSelect: document.querySelector("#radiusPanelSelect"),
  panelOperationsInput: document.querySelector("#panelOperationsInput"),

  facadeExtrasBlock: document.querySelector("#facadeExtrasBlock"),
  hingesSelect: document.querySelector("#hingesSelect"),
  hingesCommentField: document.querySelector("#hingesCommentField"),
  hingesCommentInput: document.querySelector("#hingesCommentInput"),
  handleTypeSelect: document.querySelector("#handleTypeSelect"),
  handleCommentField: document.querySelector("#handleCommentField"),
  handleCommentInput: document.querySelector("#handleCommentInput"),
  facadeOperationsInput: document.querySelector("#facadeOperationsInput"),

  addToSpecBtn: document.querySelector("#addToSpecBtn")
};

const spec = {
  emptySpec: document.querySelector("#emptySpec"),
  specContent: document.querySelector("#specContent"),
  title: document.querySelector("#specTitle"),
  productType: document.querySelector("#specProductType"),
  base: document.querySelector("#specBase"),
  size: document.querySelector("#specSize"),
  sizeType: document.querySelector("#specSizeType"),
  cutting: document.querySelector("#specCutting"),
  quantity: document.querySelector("#specQuantity"),
  area: document.querySelector("#specArea"),
  veneerA: document.querySelector("#specVeneerA"),
  sideB: document.querySelector("#specSideB"),
  edge: document.querySelector("#specEdge"),
  sanding: document.querySelector("#specSanding"),
  lacquer: document.querySelector("#specLacquer"),
  extras: document.querySelector("#specExtras"),
  formula: document.querySelector("#specFormula"),
  total: document.querySelector("#specTotal"),
  vat: document.querySelector("#specVat"),
  breakdown: document.querySelector("#specBreakdown"),
  warnings: document.querySelector("#specWarnings")
};

let calcData = null;
let latestCalculations = [];
let latestSummary = null;
let editMode = false;
let editIndex = null;

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

function roundTo(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function resetSelect(select, placeholder, disabled = false) {
  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;

  select.appendChild(option);
  select.disabled = disabled;
}

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.appendChild(option);
}

function fillSelect(select, items, getLabel) {
  items.forEach((item) => {
    addOption(select, item.id, getLabel(item));
  });
}

function getSelectedBase() {
  return calcData.bases.find((item) => item.id === form.baseSelect.value);
}

function getSelectedThickness() {
  const base = getSelectedBase();

  if (!base || !base.thicknesses) {
    return null;
  }

  return base.thicknesses.find((item) => String(item.value) === form.thicknessSelect.value);
}

function getSelectedVeneerA() {
  return calcData.veneers.find((item) => item.id === form.veneerASelect.value);
}

function getSelectedVeneerB() {
  return calcData.veneers.find((item) => item.id === form.veneerBSelect.value);
}

function getSelectedReverseSide() {
  return calcData.reverseSides.find((item) => item.id === form.reverseSideSelect.value);
}

function getSelectedEdgeThickness() {
  return calcData.edge.thicknesses.find((item) => String(item.value) === form.edgeThicknessSelect.value);
}

function getSelectedSanding() {
  return calcData.sanding.find((item) => item.id === form.sandingSelect.value);
}

function getSelectedLacquerType() {
  return calcData.lacquer.types.find((item) => item.id === form.lacquerTypeSelect.value);
}

function getSelectedGloss() {
  return calcData.lacquer.gloss.find((item) => item.id === form.glossSelect.value);
}

function normalizeSizePair(length, width) {
  return [Number(length), Number(width)].sort((a, b) => a - b);
}

function getMatchedStandardSize(length, width) {
  if (!length || !width || !calcData.standardSizes) {
    return null;
  }

  const current = normalizeSizePair(length, width);

  return calcData.standardSizes.find((item) => {
    const standard = normalizeSizePair(item.length, item.width);
    return standard[0] === current[0] && standard[1] === current[1];
  }) || null;
}

function isStandardSize(length, width) {
  return Boolean(getMatchedStandardSize(length, width));
}

function getSizeTypeLabel(length, width) {
  if (!length || !width) {
    return "—";
  }

  const standardSize = getMatchedStandardSize(length, width);

  if (standardSize) {
    return `Стандартный размер: ${standardSize.name}`;
  }

  return "Нестандартный размер";
}

function shouldAddCutting(length, width) {
  if (!length || !width) {
    return false;
  }

  return !isStandardSize(length, width);
}

function getArea(length, width, quantity) {
  return roundTo(length * width * quantity / 1000000, 3);
}

function getCuttingMeters(length, width, quantity) {
  return roundTo((length + width) / 1000 * 2 * quantity, 2);
}

function createSizeRow(values = {}) {
  const row = document.createElement("div");
  row.className = "size-row";
  row.dataset.sizeRow = "";

  row.innerHTML = `
    <div class="field-grid field-grid--size-row">
      <label class="field">
        <span class="field__label">Длина, мм</span>
        <input data-size-length type="number" min="1" step="1" placeholder="Например, 2440" value="${values.length || ""}" />
      </label>

      <label class="field">
        <span class="field__label">Ширина, мм</span>
        <input data-size-width type="number" min="1" step="1" placeholder="Например, 1220" value="${values.width || ""}" />
      </label>

      <label class="field">
        <span class="field__label">Количество, шт.</span>
        <input data-size-quantity type="number" min="1" step="1" placeholder="Например, 2" value="${values.quantity || ""}" />
      </label>

      <div class="size-row__actions">
        <button class="size-row__remove" data-remove-size-row type="button" aria-label="Удалить размер">
          Удалить
        </button>
      </div>
    </div>

    <div class="field-status is-hidden" data-size-status></div>
  `;

  return row;
}

function getSizeRows() {
  return Array.from(form.sizeRows.querySelectorAll("[data-size-row]"));
}

function getSizeRowValues(row) {
  const length = Number(row.querySelector("[data-size-length]").value) || 0;
  const width = Number(row.querySelector("[data-size-width]").value) || 0;
  const quantity = Number(row.querySelector("[data-size-quantity]").value) || 0;

  return {
    row,
    length,
    width,
    quantity,
    area: getArea(length, width, quantity),
    isComplete: length > 0 && width > 0 && quantity > 0
  };
}

function getAllSizeValues() {
  return getSizeRows().map(getSizeRowValues);
}

function getCompleteSizeValues() {
  return getAllSizeValues().filter((item) => item.isComplete);
}

function renderSizeRowsStatus() {
  getAllSizeValues().forEach((item) => {
    const status = item.row.querySelector("[data-size-status]");
    status.classList.remove("field-status--ok", "field-status--warning");

    if (!item.length && !item.width && !item.quantity) {
      status.classList.add("is-hidden");
      status.textContent = "";
      return;
    }

    if (!item.length || !item.width || !item.quantity) {
      status.classList.remove("is-hidden");
      status.classList.add("field-status--warning");
      status.textContent = "Заполните длину, ширину и количество для расчёта этой строки.";
      return;
    }

    const standardSize = getMatchedStandardSize(item.length, item.width);

    status.classList.remove("is-hidden");

    if (standardSize) {
      status.classList.add("field-status--ok");
      status.textContent = `Стандартный размер: ${standardSize.name}. Раскрой не добавляется.`;
      return;
    }

    status.classList.add("field-status--warning");
    status.textContent = `Нестандартный размер. Раскрой добавлен автоматически: ${formatNumber(getCuttingMeters(item.length, item.width, item.quantity), 2)} пог. м.`;
  });

  updateRemoveButtonsState();
}

function updateRemoveButtonsState() {
  const rows = getSizeRows();
  rows.forEach((row) => {
    const button = row.querySelector("[data-remove-size-row]");
    button.disabled = rows.length === 1;
  });
}

function addSizeRow(values = {}) {
  form.sizeRows.appendChild(createSizeRow(values));
  updateRemoveButtonsState();
  renderSpecification();

  const rows = getSizeRows();
  const lastRow = rows[rows.length - 1];

  if (lastRow) {
    lastRow.querySelector("[data-size-length]").focus();
  }
}

function removeSizeRow(row) {
  const rows = getSizeRows();

  if (rows.length === 1) {
    return;
  }

  row.remove();
  updateRemoveButtonsState();
  renderSpecification();
}

function getLookupRate(items, thickness, rateKey) {
  if (!items || !items.length) {
    return 0;
  }

  const sortedItems = [...items].sort((a, b) => a.maxThickness - b.maxThickness);
  const exactOrHigher = sortedItems.find((item) => thickness <= item.maxThickness);

  if (exactOrHigher) {
    return exactOrHigher[rateKey] || 0;
  }

  return sortedItems[sortedItems.length - 1][rateKey] || 0;
}

function getCuttingRate(thickness) {
  return getLookupRate(calcData.cuttingRates, thickness, "ratePerMeter");
}

function getEdgeMeters(length, width, quantity) {
  const edgeMode = form.edgeSidesSelect.value;

  const values = {
    perimeter: 2 * length + 2 * width,
    one_length: length,
    two_lengths: 2 * length,
    one_width: width,
    two_widths: 2 * width,
    one_length_one_width: length + width,
    two_lengths_one_width: 2 * length + width,
    one_length_two_widths: length + 2 * width
  };

  const selectedLengthMm = values[edgeMode] || 0;
  return roundTo(selectedLengthMm * quantity / 1000 * calcData.meta.edgeWasteCoefficient, 2);
}

function getEdgeRate(baseThickness, edgeType, edgeMeters) {
  const rates = calcData.edge.rates[edgeType] || [];
  const rateKey = edgeMeters > calcData.meta.cuttingThresholdMeters
    ? "rateAfter40"
    : "rateBefore40";

  return getLookupRate(rates, baseThickness, rateKey);
}

function getBaseRate(thickness) {
  const sides = form.veneeredSidesSelect.value;

  if (!thickness) {
    return null;
  }

  if (sides === "2") {
    return thickness.twoSideRate ?? null;
  }

  return thickness.oneSideRate ?? null;
}

function getSelectedVeneerPrices() {
  const prices = [];
  const veneerA = getSelectedVeneerA();

  if (veneerA) {
    prices.push(veneerA.pricePerM2);
  }

  if (form.veneeredSidesSelect.value === "2") {
    if (form.sideBModeSelect.value === "same" && veneerA) {
      prices.push(veneerA.pricePerM2);
    }

    if (form.sideBModeSelect.value === "other") {
      const veneerB = getSelectedVeneerB();

      if (veneerB) {
        prices.push(veneerB.pricePerM2);
      }
    }
  }

  return prices;
}

function hasPremiumVeneer() {
  const prices = getSelectedVeneerPrices();
  const threshold = calcData.meta.premiumVeneerThreshold;

  return prices.some((price) => price > threshold);
}

function getVeneerWorkMultiplier() {
  return hasPremiumVeneer()
    ? calcData.meta.premiumVeneerWorkMultiplier
    : 1;
}

function getSideBPrice() {
  const sideBMode = form.sideBModeSelect.value;
  const veneerA = getSelectedVeneerA();
  const veneerB = getSelectedVeneerB();

  if (form.veneeredSidesSelect.value === "1") {
    return getSelectedReverseSide()?.pricePerM2 || 0;
  }

  if (sideBMode === "same") {
    return veneerA?.pricePerM2 || 0;
  }

  if (sideBMode === "other") {
    return veneerB?.pricePerM2 || 0;
  }

  return 0;
}

function getSideBLabel() {
  const sideBMode = form.sideBModeSelect.value;
  const veneerA = getSelectedVeneerA();
  const veneerB = getSelectedVeneerB();
  const reverseSide = getSelectedReverseSide();

  if (form.veneeredSidesSelect.value === "1") {
    return reverseSide?.name || "—";
  }

  if (sideBMode === "same") {
    return veneerA ? `Как сторона А: ${veneerA.name}` : "Как сторона А";
  }

  if (sideBMode === "other") {
    return veneerB?.name || "Другой шпон";
  }

  return "—";
}

function getVeneerCost(area) {
  const veneerA = getSelectedVeneerA();
  const sideBMode = form.sideBModeSelect.value;
  const reserve = calcData.meta.veneerReserveMultiplier;

  if (!veneerA) {
    return {
      veneerCost: 0,
      veneerArea: 0
    };
  }

  let veneerArea = area * reserve;
  let veneerCost = veneerA.pricePerM2 * area * reserve;

  if (form.veneeredSidesSelect.value === "2") {
    let veneerBPrice = 0;

    if (sideBMode === "same") {
      veneerBPrice = veneerA.pricePerM2;
    }

    if (sideBMode === "other") {
      veneerBPrice = getSelectedVeneerB()?.pricePerM2 || 0;
    }

    veneerArea += area * reserve;
    veneerCost += veneerBPrice * area * reserve;
  }

  return {
    veneerCost: Math.round(veneerCost),
    veneerArea: roundTo(veneerArea, 2)
  };
}

function getReverseSideWorkRate() {
  if (form.veneeredSidesSelect.value === "2") {
    return 0;
  }

  return getSelectedReverseSide()?.pricePerM2 || 0;
}

function getAreaSurchargeRate(area) {
  const rates = calcData.areaSurchargeRates || [];
  return getLookupRate(rates, area, "ratePerM2");
}

function getGlossRate() {
  const gloss = getSelectedGloss();

  if (!gloss) {
    return 0;
  }

  const sides = form.lacquerSidesSelect.value;
  return gloss.rates?.[sides] || 0;
}

function getLacquerRate() {
  const lacquerType = getSelectedLacquerType();

  if (!lacquerType) {
    return 0;
  }

  const sides = form.lacquerSidesSelect.value;
  return lacquerType.rates?.[sides] || 0;
}

function getExtrasText() {
  const items = [];

  if (productType === "panels") {
    if (form.km1Select.value === "yes") items.push("КМ1");
    if (form.radiusPanelSelect.value === "yes") items.push("Радиусная панель");
    if (form.panelOperationsInput.value.trim()) items.push("Операции по ТЗ");
  }

  if (productType === "facades") {
    if (form.hingesSelect.value === "yes") items.push("Присадка под петли");

    if (form.handleTypeSelect.value !== "none") {
      items.push(form.handleTypeSelect.options[form.handleTypeSelect.selectedIndex].textContent);
    }

    if (form.facadeOperationsInput.value.trim()) items.push("Операции по ТЗ");
  }

  return items.length ? items.join(", ") : "Нет";
}

function getNotes() {
  const notes = [];

  if (form.textureTransitionSelect.value === "yes") {
    notes.push("Есть переход текстуры.");
  }

  if (form.fiberDirectionSelect.value === "custom") {
    notes.push("Направление волокон по ТЗ.");
  }

  if (form.veneerLayoutSelect.value === "custom") {
    notes.push("Набор / рубашка по ТЗ.");
  }

  if (form.finishCommentInput.value.trim()) {
    notes.push(`Финиш: ${form.finishCommentInput.value.trim()}`);
  }

  return notes;
}

function isReadyForCommonCalculation() {
  const base = getSelectedBase();
  const thickness = getSelectedThickness();
  const veneerA = getSelectedVeneerA();
  const baseRate = getBaseRate(thickness);

  if (!base || base.manualPrice) {
    return false;
  }

  return Boolean(thickness && baseRate !== null && veneerA);
}

function isReadyForCalculation() {
  return isReadyForCommonCalculation() && getCompleteSizeValues().length > 0;
}

function calculateSizeItem(sizeItem) {
  const meta = calcData.meta;

  const base = getSelectedBase();
  const thickness = getSelectedThickness();
  const veneerA = getSelectedVeneerA();

  const area = sizeItem.area;
  const baseRate = getBaseRate(thickness);
  const reverseSideWorkRate = getReverseSideWorkRate();

  const coefficient = form.textureTransitionSelect.value === "yes"
    ? meta.textureTransitionCoefficient
    : meta.baseCoefficient;

  const premiumVeneerApplied = hasPremiumVeneer();
  const veneerWorkMultiplier = getVeneerWorkMultiplier();

  const panelWorkRate =
    (baseRate + reverseSideWorkRate) *
    coefficient *
    veneerWorkMultiplier;

  const panelWorkCost = Math.round(area * panelWorkRate);

  let cuttingCost = 0;
  let cuttingMeters = 0;
  let cuttingRate = 0;
  let cuttingAdded = false;

  if (shouldAddCutting(sizeItem.length, sizeItem.width)) {
    cuttingAdded = true;
    cuttingMeters = getCuttingMeters(sizeItem.length, sizeItem.width, sizeItem.quantity);
    cuttingRate = getCuttingRate(thickness.numericThickness);
    cuttingCost = Math.round(cuttingMeters * cuttingRate);
  }

  let edgeCost = 0;
  let edgeMeters = 0;
  let edgeRate = 0;

  if (form.edgeNeededSelect.value === "yes") {
    const edgeThickness = getSelectedEdgeThickness();

    if (edgeThickness) {
      edgeMeters = getEdgeMeters(sizeItem.length, sizeItem.width, sizeItem.quantity);
      edgeRate = getEdgeRate(thickness.numericThickness, edgeThickness.type, edgeMeters);
      edgeCost = Math.round(edgeMeters * edgeRate);
    }
  }

  let sandingCost = 0;
  let sandingRate = 0;

  if (form.sandingNeededSelect.value === "yes") {
    const sanding = getSelectedSanding();
    sandingRate = sanding?.ratePerM2 || 0;
    sandingCost = Math.round(area * sandingRate);
  }

  let lacquerCost = 0;
  let lacquerRate = 0;
  let glossRate = 0;

  if (form.lacquerNeededSelect.value === "yes") {
    lacquerRate = getLacquerRate();
    glossRate = getGlossRate();
    lacquerCost = Math.round(area * (lacquerRate + glossRate));
  }

  const areaSurchargeRate = getAreaSurchargeRate(area);
  const areaSurchargeCost = Math.round(area * areaSurchargeRate);

  const workSubtotal =
    panelWorkCost +
    cuttingCost +
    edgeCost +
    sandingCost +
    lacquerCost;

  const workTotal = Math.round((workSubtotal + areaSurchargeCost) * meta.productionMultiplier);

  const veneer = getVeneerCost(area);
  const total = workTotal + veneer.veneerCost;

  const vat = meta.vatIncluded
    ? Math.round(total * meta.vatRate / (1 + meta.vatRate))
    : Math.round(total * meta.vatRate);

  const extrasWarnings = [];

  if (productType === "panels") {
    if (form.km1Select.value === "yes") {
      extrasWarnings.push("КМ1 выбран — влияет на цену, но тариф не найден в предоставленном Excel.");
    }

    if (form.radiusPanelSelect.value === "yes") {
      extrasWarnings.push("Радиусная панель — расчёт по ТЗ.");
    }

    if (form.panelOperationsInput.value.trim()) {
      extrasWarnings.push("Есть операции по ТЗ.");
    }
  }

  if (productType === "facades") {
    if (form.hingesSelect.value === "yes") {
      extrasWarnings.push("Присадка под петли — параметры по ТЗ.");
    }

    if (form.handleTypeSelect.value !== "none") {
      extrasWarnings.push("Ручки / открывание — параметры по ТЗ.");
    }

    if (form.facadeOperationsInput.value.trim()) {
      extrasWarnings.push("Есть операции по ТЗ.");
    }
  }

  return {
    productType,
    productName: productLabels[productType].spec,

    base: base.name,
    baseId: base.id,

    thickness: thickness.label,
    thicknessValue: thickness.value,
    numericThickness: thickness.numericThickness,

    length: sizeItem.length,
    width: sizeItem.width,
    quantity: sizeItem.quantity,
    area,

    sizeType: isStandardSize(sizeItem.length, sizeItem.width) ? "standard" : "custom",
    sizeTypeLabel: getSizeTypeLabel(sizeItem.length, sizeItem.width),

    veneeredSides: form.veneeredSidesSelect.value,
    veneerA,
    veneerAId: veneerA?.id || null,

    sideB: getSideBLabel(),
    sideBMode: form.sideBModeSelect.value,
    sideBPrice: getSideBPrice(),
    veneerBId: getSelectedVeneerB()?.id || null,
    reverseSideId: getSelectedReverseSide()?.id || null,

    fiberDirection: form.fiberDirectionSelect.value,
    veneerLayout: form.veneerLayoutSelect.value,
    textureTransition: form.textureTransitionSelect.value,

    veneerArea: veneer.veneerArea,
    veneerCost: veneer.veneerCost,

    coefficient,
    premiumVeneerApplied,
    veneerWorkMultiplier,
    productionMultiplier: meta.productionMultiplier,

    baseRate,
    reverseSideWorkRate,
    panelWorkRate,
    panelWorkCost,

    cuttingAdded,
    cuttingMeters,
    cuttingRate,
    cuttingCost,

    edgeNeeded: form.edgeNeededSelect.value,
    edgeSides: form.edgeSidesSelect.value,
    edgeThicknessValue: form.edgeThicknessSelect.value,
    edgeMeters,
    edgeRate,
    edgeCost,

    sandingNeeded: form.sandingNeededSelect.value,
    sandingId: form.sandingSelect.value,
    sandingRate,
    sandingCost,

    lacquerNeeded: form.lacquerNeededSelect.value,
    lacquerTypeId: form.lacquerTypeSelect.value,
    glossId: form.glossSelect.value,
    lacquerSides: form.lacquerSidesSelect.value,
    finishComment: form.finishCommentInput.value.trim(),
    lacquerRate,
    glossRate,
    lacquerCost,

    km1: form.km1Select.value,
    radiusPanel: form.radiusPanelSelect.value,
    panelOperations: form.panelOperationsInput.value.trim(),

    hinges: form.hingesSelect.value,
    hingesComment: form.hingesCommentInput.value.trim(),
    handleType: form.handleTypeSelect.value,
    handleComment: form.handleCommentInput.value.trim(),
    facadeOperations: form.facadeOperationsInput.value.trim(),

    areaSurchargeRate,
    areaSurchargeCost,

    workSubtotal,
    workTotal,
    total,
    vat,

    extrasWarnings,
    notes: getNotes()
  };
}

function calculateAll() {
  const items = getCompleteSizeValues().map(calculateSizeItem);

  const summary = items.reduce(
    (acc, item) => {
      acc.total += item.total;
      acc.vat += item.vat;
      acc.area += item.area;
      acc.quantity += item.quantity;
      acc.cuttingMeters += item.cuttingMeters;
      acc.cuttingCost += item.cuttingCost;
      acc.edgeMeters += item.edgeMeters;
      acc.edgeCost += item.edgeCost;
      acc.panelWorkCost += item.panelWorkCost;
      acc.veneerCost += item.veneerCost;
      acc.sandingCost += item.sandingCost;
      acc.lacquerCost += item.lacquerCost;
      acc.areaSurchargeCost += item.areaSurchargeCost;
      acc.workTotal += item.workTotal;
      return acc;
    },
    {
      total: 0,
      vat: 0,
      area: 0,
      quantity: 0,
      cuttingMeters: 0,
      cuttingCost: 0,
      edgeMeters: 0,
      edgeCost: 0,
      panelWorkCost: 0,
      veneerCost: 0,
      sandingCost: 0,
      lacquerCost: 0,
      areaSurchargeCost: 0,
      workTotal: 0
    }
  );

  summary.area = roundTo(summary.area, 3);
  summary.cuttingMeters = roundTo(summary.cuttingMeters, 2);
  summary.edgeMeters = roundTo(summary.edgeMeters, 2);

  return {
    items,
    summary
  };
}

function showEmptySpec() {
  latestCalculations = [];
  latestSummary = null;
  spec.emptySpec.classList.remove("is-hidden");
  spec.specContent.classList.add("is-hidden");
}

function showSpecContent() {
  spec.emptySpec.classList.add("is-hidden");
  spec.specContent.classList.remove("is-hidden");
}

function renderPartialSpec() {
  const base = getSelectedBase();
  const thickness = getSelectedThickness();
  const veneerA = getSelectedVeneerA();
  const sizes = getCompleteSizeValues();

  const hasAnyData = Boolean(
    form.baseSelect.value ||
    form.thicknessSelect.value ||
    sizes.length > 0 ||
    form.veneerASelect.value ||
    form.edgeNeededSelect.value === "yes" ||
    form.sandingNeededSelect.value === "yes" ||
    form.lacquerNeededSelect.value === "yes"
  );

  if (!hasAnyData) {
    showEmptySpec();
    return;
  }

  showSpecContent();

  spec.productType.textContent = productLabels[productType].spec;

  spec.base.textContent = base
    ? `${base.name}${thickness ? `, ${thickness.label}` : ""}`
    : "—";

  if (sizes.length) {
    spec.size.textContent = sizes
      .map((item) => `${item.length} × ${item.width} мм, ${item.quantity} шт.`)
      .join("; ");
  } else {
    spec.size.textContent = "—";
  }

  if (sizes.length) {
    const standardCount = sizes.filter((item) => isStandardSize(item.length, item.width)).length;
    const customCount = sizes.length - standardCount;

    spec.sizeType.textContent = [
      standardCount ? `стандартных: ${standardCount}` : "",
      customCount ? `нестандартных: ${customCount}` : ""
    ].filter(Boolean).join(", ");
  } else {
    spec.sizeType.textContent = "—";
  }

  const cuttingRows = sizes.filter((item) => shouldAddCutting(item.length, item.width));

  spec.cutting.textContent = cuttingRows.length
    ? `Добавлен для ${cuttingRows.length} размер(ов)`
    : sizes.length
      ? "Не добавлен"
      : "—";

  spec.quantity.textContent = sizes.length
    ? `${sizes.reduce((sum, item) => sum + item.quantity, 0)} шт.`
    : "—";

  spec.area.textContent = sizes.length
    ? `${formatNumber(sizes.reduce((sum, item) => sum + item.area, 0), 3)} м²`
    : "—";

  spec.veneerA.textContent = veneerA?.name || "—";
  spec.sideB.textContent = getSideBLabel();

  spec.edge.textContent = form.edgeNeededSelect.value === "yes"
    ? `${form.edgeSidesSelect.options[form.edgeSidesSelect.selectedIndex].textContent}, ${form.edgeThicknessSelect.value || "—"} мм`
    : "Нет";

  spec.sanding.textContent = form.sandingNeededSelect.value === "yes"
    ? getSelectedSanding()?.name || "Да"
    : "Нет";

  spec.lacquer.textContent = form.lacquerNeededSelect.value === "yes"
    ? `${getSelectedLacquerType()?.name || "—"}, ${getSelectedGloss()?.name || "—"}, ${form.lacquerSidesSelect.options[form.lacquerSidesSelect.selectedIndex].textContent}`
    : "Нет";

  spec.extras.textContent = getExtrasText();

  spec.total.textContent = "—";
  spec.vat.textContent = "В том числе НДС: —";
  spec.breakdown.innerHTML = "";
  spec.formula.textContent = "Каждый размер считается как отдельная позиция.";
  spec.warnings.textContent = "Цена появится после выбора основы, толщины, шпона и хотя бы одного полного размера.";
}

function renderBreakdown(summary) {
  const rows = [
    ["Работы по основе / фанерованию", summary.panelWorkCost],
    ["Шпон", summary.veneerCost],
    ["Раскрой", summary.cuttingCost],
    ["Кромка", summary.edgeCost],
    ["Шлифовка", summary.sandingCost],
    ["Лак / финиш", summary.lacquerCost],
    ["Надбавка по объёму", summary.areaSurchargeCost],
    ["Работы с производственным коэффициентом", summary.workTotal]
  ];

  spec.breakdown.innerHTML = rows
    .filter((row) => row[1] > 0)
    .map((row) => `
      <div class="breakdown-row">
        <span>${row[0]}</span>
        <strong>${formatMoney(row[1])}</strong>
      </div>
    `)
    .join("");
}

function renderSpecification() {
  renderSizeRowsStatus();
  renderPartialSpec();

  if (!isReadyForCalculation()) {
    latestCalculations = [];
    latestSummary = null;

    const base = getSelectedBase();
    const thickness = getSelectedThickness();
    const baseRate = getBaseRate(thickness);

    if (base?.manualPrice) {
      spec.warnings.textContent = `${base.name}: тарифы не заведены в JSON. Нужно добавить данные из справочника.`;
    } else if (thickness && baseRate === null) {
      spec.warnings.textContent = `Для ${base.name}, ${thickness.label}, ${form.veneeredSidesSelect.value} сторона(ы) тариф не найден.`;
    }

    return;
  }

  const result = calculateAll();

  latestCalculations = result.items;
  latestSummary = result.summary;

  spec.total.textContent = formatMoney(result.summary.total);
  spec.vat.textContent = `В том числе НДС: ${formatMoney(result.summary.vat)}`;

  spec.formula.textContent =
    `Будет создано позиций: ${result.items.length}. Каждый размер считается отдельно: шпон + ((работы по основе / фанерованию + раскрой + кромка + шлифовка + лак + надбавка по объёму) × производственный коэффициент).`;

  renderBreakdown(result.summary);

  const warnings = [];

  if (result.items.some((item) => item.sizeType === "custom")) {
    warnings.push("Есть нестандартные размеры — раскрой добавлен автоматически для соответствующих строк.");
  }

  if (result.items.some((item) => item.premiumVeneerApplied)) {
    warnings.push("Шпон дороже 1000 ₽/м² — применён коэффициент ×2 к работе со шпоном.");
  }

  if (result.items.some((item) => item.glossRate === 0) && form.glossSelect.value === "custom") {
    warnings.push("Выбран другой процент глянца — тариф нужно уточнить вручную.");
  }

  result.items.forEach((item) => {
    warnings.push(...item.extrasWarnings);
  });

  spec.warnings.textContent = warnings.length
    ? [...new Set(warnings)].join(" ")
    : "Цена предварительная. Окончательная стоимость подтверждается менеджером.";

  sessionStorage.setItem("woodstockPanelsFacadesCalculation", JSON.stringify(result));
}

function handleBaseChange() {
  const base = getSelectedBase();

  resetSelect(form.thicknessSelect, "Сначала выберите основу", true);

  if (!base) {
    form.baseNote.textContent = "Система подгружает доступные толщины выбранной основы.";
    renderSpecification();
    return;
  }

  form.baseNote.textContent = base.note || "Толщина зависит от выбранной основы.";

  if (base.manualPrice || !base.thicknesses.length) {
    resetSelect(form.thicknessSelect, "Тарифы нужно добавить в справочник", true);
    renderSpecification();
    return;
  }

  resetSelect(form.thicknessSelect, "Выберите толщину основы", false);

  base.thicknesses.forEach((item) => {
    addOption(form.thicknessSelect, item.value, item.label);
  });

  renderSpecification();
}

function handleVeneeredSidesChange() {
  if (form.veneeredSidesSelect.value === "1") {
    form.sideBModeSelect.value = "reverse";
    form.sideBModeSelect.disabled = true;
    form.reverseSideField.classList.remove("is-hidden");
    form.veneerBField.classList.add("is-hidden");
  } else {
    form.sideBModeSelect.disabled = false;

    if (form.sideBModeSelect.value === "reverse") {
      form.sideBModeSelect.value = "same";
    }
  }

  handleSideBModeChange();
}

function handleSideBModeChange() {
  const mode = form.sideBModeSelect.value;

  form.reverseSideField.classList.toggle("is-hidden", mode !== "reverse");
  form.veneerBField.classList.toggle("is-hidden", mode !== "other");

  renderSpecification();
}

function handleConditionalBlocks() {
  const edgeNeeded = form.edgeNeededSelect.value === "yes";
  const sandingNeeded = form.sandingNeededSelect.value === "yes";
  const lacquerNeeded = form.lacquerNeededSelect.value === "yes";
  const hingesNeeded = form.hingesSelect.value === "yes";
  const handleNeeded = form.handleTypeSelect.value !== "none";

  form.edgeFields.classList.toggle("is-hidden", !edgeNeeded);
  form.sandingField.classList.toggle("is-hidden", !sandingNeeded);
  form.lacquerFields.classList.toggle("is-hidden", !lacquerNeeded);

  form.hingesCommentField.classList.toggle("is-hidden", !hingesNeeded);
  form.handleCommentField.classList.toggle("is-hidden", !handleNeeded);

  renderSpecification();
}

function getEditItem() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKeys.editItem) || "null");
  } catch (error) {
    return null;
  }
}

function getEditIndex() {
  const savedIndex = sessionStorage.getItem(storageKeys.editIndex);

  if (savedIndex === null || savedIndex === "") {
    return null;
  }

  const index = Number(savedIndex);

  return Number.isInteger(index) && index >= 0 ? index : null;
}

function clearEditState() {
  sessionStorage.removeItem(storageKeys.editItem);
  sessionStorage.removeItem(storageKeys.editIndex);
}

function clearSizeRows() {
  form.sizeRows.innerHTML = "";
}

function applyEditMode() {
  const item = getEditItem();
  const index = getEditIndex();

  if (!item || item.productType !== productType || index === null) {
    return;
  }

  editMode = true;
  editIndex = index;

  form.addToSpecBtn.textContent = "Сохранить изменения";

  form.baseSelect.value = item.baseId || "";
  handleBaseChange();

  form.thicknessSelect.value = item.thicknessValue || "";

  clearSizeRows();
  form.sizeRows.appendChild(createSizeRow({
    length: item.length,
    width: item.width,
    quantity: item.quantity
  }));

  form.veneeredSidesSelect.value = item.veneeredSides || "1";
  form.veneerASelect.value = item.veneerAId || item.veneerA?.id || "";
  form.sideBModeSelect.value = item.sideBMode || "reverse";
  form.reverseSideSelect.value = item.reverseSideId || "";
  form.veneerBSelect.value = item.veneerBId || "";

  form.fiberDirectionSelect.value = item.fiberDirection || "length";
  form.veneerLayoutSelect.value = item.veneerLayout || "not_set";
  form.textureTransitionSelect.value = item.textureTransition || "no";

  form.edgeNeededSelect.value = item.edgeNeeded || (item.edgeCost > 0 ? "yes" : "no");
  form.edgeSidesSelect.value = item.edgeSides || "perimeter";
  form.edgeThicknessSelect.value = item.edgeThicknessValue || "";

  form.sandingNeededSelect.value = item.sandingNeeded || (item.sandingCost > 0 ? "yes" : "no");
  form.sandingSelect.value = item.sandingId || "";

  form.lacquerNeededSelect.value = item.lacquerNeeded || (item.lacquerCost > 0 ? "yes" : "no");
  form.lacquerTypeSelect.value = item.lacquerTypeId || "";
  form.glossSelect.value = item.glossId || "";
  form.lacquerSidesSelect.value = item.lacquerSides || "one";
  form.finishCommentInput.value = item.finishComment || "";

  form.km1Select.value = item.km1 || "no";
  form.radiusPanelSelect.value = item.radiusPanel || "no";
  form.panelOperationsInput.value = item.panelOperations || "";

  form.hingesSelect.value = item.hinges || "no";
  form.hingesCommentInput.value = item.hingesComment || "";
  form.handleTypeSelect.value = item.handleType || "none";
  form.handleCommentInput.value = item.handleComment || "";
  form.facadeOperationsInput.value = item.facadeOperations || "";

  handleVeneeredSidesChange();
  handleConditionalBlocks();
  renderSpecification();
}

function saveCurrentCalculationsToSpecification() {
  const savedItems = JSON.parse(sessionStorage.getItem(storageKeys.items) || "[]");

  if (editMode && editIndex !== null && savedItems[editIndex]) {
    if (latestCalculations.length === 1) {
      savedItems[editIndex] = latestCalculations[0];
    } else {
      savedItems.splice(editIndex, 1, ...latestCalculations);
    }
  } else {
    savedItems.push(...latestCalculations);
  }

  sessionStorage.setItem(storageKeys.items, JSON.stringify(savedItems));
}

function addToSpecification() {
  if (!latestCalculations.length) {
    alert("Для добавления в спецификацию выберите основу, толщину, шпон и укажите хотя бы один полный размер.");
    return;
  }

  saveCurrentCalculationsToSpecification();

  if (editMode) {
    clearEditState();
    window.location.href = "specification.html";
    return;
  }

  form.addToSpecBtn.textContent = `Добавлено позиций: ${latestCalculations.length}`;

  setTimeout(() => {
    form.addToSpecBtn.textContent = "Добавить в спецификацию";
  }, 1400);
}

function initPageContext() {
  const current = productLabels[productType] || productLabels.panels;

  document.querySelector("#pageTitle").textContent = current.title;
  document.querySelector("#pageLead").textContent = current.lead;

  spec.title.textContent = current.spec;
  spec.productType.textContent = current.spec;

  form.panelExtrasBlock.classList.toggle("is-hidden", productType !== "panels");
  form.facadeExtrasBlock.classList.toggle("is-hidden", productType !== "facades");
}

function initSelects() {
  calcData.bases.forEach((base) => {
    addOption(form.baseSelect, base.id, base.name);
  });

  fillSelect(
    form.veneerASelect,
    calcData.veneers,
    (item) => `${item.name} — ${formatMoney(item.pricePerM2)} / м²`
  );

  fillSelect(
    form.veneerBSelect,
    calcData.veneers,
    (item) => `${item.name} — ${formatMoney(item.pricePerM2)} / м²`
  );

  fillSelect(
    form.reverseSideSelect,
    calcData.reverseSides,
    (item) => `${item.name}${item.pricePerM2 ? ` — ${formatMoney(item.pricePerM2)} / м²` : ""}`
  );

  fillSelect(
    form.edgeThicknessSelect,
    calcData.edge.thicknesses,
    (item) => item.name
  );

  fillSelect(
    form.sandingSelect,
    calcData.sanding,
    (item) => `${item.name} — ${formatMoney(item.ratePerM2)} / м²`
  );

  fillSelect(
    form.lacquerTypeSelect,
    calcData.lacquer.types,
    (item) => item.name
  );

  fillSelect(
    form.glossSelect,
    calcData.lacquer.gloss,
    (item) => item.name
  );
}

function initEvents() {
  form.baseSelect.addEventListener("change", handleBaseChange);
  form.veneeredSidesSelect.addEventListener("change", handleVeneeredSidesChange);
  form.sideBModeSelect.addEventListener("change", handleSideBModeChange);

  [
    form.edgeNeededSelect,
    form.sandingNeededSelect,
    form.lacquerNeededSelect,
    form.hingesSelect,
    form.handleTypeSelect
  ].forEach((element) => {
    element.addEventListener("change", handleConditionalBlocks);
  });

  [
    form.thicknessSelect,
    form.veneerASelect,
    form.veneerBSelect,
    form.reverseSideSelect,
    form.fiberDirectionSelect,
    form.veneerLayoutSelect,
    form.textureTransitionSelect,
    form.edgeSidesSelect,
    form.edgeThicknessSelect,
    form.sandingSelect,
    form.lacquerTypeSelect,
    form.glossSelect,
    form.lacquerSidesSelect,
    form.finishCommentInput,
    form.km1Select,
    form.radiusPanelSelect,
    form.panelOperationsInput,
    form.hingesCommentInput,
    form.handleCommentInput,
    form.facadeOperationsInput
  ].forEach((element) => {
    if (!element) return;

    element.addEventListener("input", renderSpecification);
    element.addEventListener("change", renderSpecification);
  });

  form.sizeRows.addEventListener("input", renderSpecification);
  form.sizeRows.addEventListener("change", renderSpecification);

  form.sizeRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-size-row]");

    if (!button) {
      return;
    }

    removeSizeRow(button.closest("[data-size-row]"));
  });

  form.addSizeRowBtn.addEventListener("click", () => {
    addSizeRow();
  });

  form.addToSpecBtn.addEventListener("click", addToSpecification);
}

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Не удалось загрузить data/panels-facades.json.");
    }

    return response.json();
  })
  .then((data) => {
    calcData = data;

    initPageContext();
    initSelects();
    initEvents();

    handleVeneeredSidesChange();
    handleConditionalBlocks();
    updateRemoveButtonsState();
    showEmptySpec();
    applyEditMode();
  })
  .catch((error) => {
    console.error(error);
    alert("Не удалось загрузить data/panels-facades.json. Запустите проект через локальный сервер.");
  });