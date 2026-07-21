const dataUrl = "../data/panels-facades.json";

const storageKeys = {
  items: "woodstockSpecificationItems",
  editItem: "woodstockEditItem",
  editIndex: "woodstockEditIndex"
};

const params = new URLSearchParams(window.location.search);
const productType =
  params.get("type") ||
  sessionStorage.getItem("woodstockProductType") ||
  "panels";

const productLabels = {
  panels: {
    title: "Интерьерные панели",
    lead: "Расчёт стоимости по основе, размеру, шпону, кромке, шлифовке, финишу и дополнительным операциям.",
    spec: "Интерьерные панели"
  },
  facades: {
    title: "Мебельные фасады",
    lead: "Расчёт стоимости по основе, размеру, шпону, кромке, шлифовке, финишу, присадке и ручкам.",
    spec: "Мебельные фасады"
  }
};

const form = {
  baseSelect: document.querySelector("#baseSelect"),
  thicknessSelect: document.querySelector("#thicknessSelect"),
  baseNote: document.querySelector("#baseNote"),

  standardSizeValues: document.querySelector("#standardSizeValues"),
  standardSizeNote: document.querySelector("#standardSizeNote"),

  sizeRows: document.querySelector("#sizeRows"),
  addSizeRowBtn: document.querySelector("#addSizeRowBtn"),

  veneeredSidesSelect: document.querySelector("#veneeredSidesSelect"),
  veneerASelect: document.querySelector("#veneerASelect"),
  veneerACombobox: document.querySelector("#veneerACombobox"),
  veneerASearch: document.querySelector("#veneerASearch"),
  sideBModeField: document.querySelector("#sideBModeField"),
  sideBModeSelect: document.querySelector("#sideBModeSelect"),
  reverseSideField: document.querySelector("#reverseSideField"),
  reverseSideSelect: document.querySelector("#reverseSideSelect"),
  veneerBField: document.querySelector("#veneerBField"),
  veneerBSelect: document.querySelector("#veneerBSelect"),
  veneerBCombobox: document.querySelector("#veneerBCombobox"),
  veneerBSearch: document.querySelector("#veneerBSearch"),
  fiberDirectionSelect: document.querySelector("#fiberDirectionSelect"),
  veneerLayoutSelect: document.querySelector("#veneerLayoutSelect"),
  textureTransitionSelect: document.querySelector("#textureTransitionSelect"),

  cuttingModeSelect: document.querySelector("#cuttingModeSelect"),

  edgeNeededSelect: document.querySelector("#edgeNeededSelect"),
  edgeFields: document.querySelector("#edgeFields"),
  edgeSidesSelect: document.querySelector("#edgeSidesSelect"),
  edgeThicknessSelect: document.querySelector("#edgeThicknessSelect"),

  sandingNeededSelect: document.querySelector("#sandingNeededSelect"),
  sandingField: document.querySelector("#sandingField"),
  sandingSelect: document.querySelector("#sandingSelect"),

  finishTypeSelect: document.querySelector("#finishTypeSelect"),
  finishFields: document.querySelector("#finishFields"),
  lacquerFields: document.querySelector("#lacquerFields"),
  lacquerTypeSelect: document.querySelector("#lacquerTypeSelect"),
  lacquerGlossSelect: document.querySelector("#lacquerGlossSelect"),
  finishSidesSelect: document.querySelector("#finishSidesSelect"),
  isolatorField: document.querySelector("#isolatorField"),
  isolatorSelect: document.querySelector("#isolatorSelect"),
  gloss100Field: document.querySelector("#gloss100Field"),
  gloss100Select: document.querySelector("#gloss100Select"),
  enamelField: document.querySelector("#enamelField"),
  enamelSelect: document.querySelector("#enamelSelect"),
  finishCommentInput: document.querySelector("#finishCommentInput"),

  panelExtrasBlock: document.querySelector("#panelExtrasBlock"),
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

  orderCommentInput: document.querySelector("#orderCommentInput"),
  orderFilesInput: document.querySelector("#orderFilesInput"),
  selectedOrderFiles: document.querySelector("#selectedOrderFiles"),
  discountInput: document.querySelector("#discountInput"),

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
let activeSizeRow = null;
let existingUploadedFiles = [];

let veneerAComboboxController = null;
let veneerBComboboxController = null;

function normalizeSearchValue(value) {
  return String(value || "")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .trim();
}

function createSearchableSelect({
  root,
  nativeSelect,
  input,
  items,
  placeholder,
  maxVisibleItems = 40
}) {
  if (!root || !nativeSelect || !input) {
    return null;
  }

  const dropdown = root.querySelector(
    ".searchable-select__dropdown"
  );
  const toggle = root.querySelector(
    ".searchable-select__toggle"
  );

  let filteredItems = [...items];
  let highlightedIndex = -1;
  let isOpen = false;

  function getSelectedItem() {
    return (
      items.find(
        (item) => item.id === nativeSelect.value
      ) || null
    );
  }

  function setExpanded(expanded) {
    isOpen = expanded;
    root.classList.toggle("is-open", expanded);
    dropdown.classList.toggle("is-hidden", !expanded);
    input.setAttribute(
      "aria-expanded",
      String(expanded)
    );
  }

  function renderOptions() {
    dropdown.innerHTML = "";

    const visibleItems = filteredItems.slice(
      0,
      maxVisibleItems
    );

    if (!visibleItems.length) {
      const empty = document.createElement("div");
      empty.className =
        "searchable-select__empty";
      empty.textContent = "Ничего не найдено";
      dropdown.appendChild(empty);
      highlightedIndex = -1;
      return;
    }

    visibleItems.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className =
        "searchable-select__option";
      option.dataset.value = item.id;
      option.setAttribute("role", "option");
      option.setAttribute(
        "aria-selected",
        String(item.id === nativeSelect.value)
      );

      if (index === highlightedIndex) {
        option.classList.add("is-highlighted");
      }

      const name = document.createElement("span");
      name.className =
        "searchable-select__option-name";
      name.textContent = item.name;

      const price = document.createElement("span");
      price.className =
        "searchable-select__option-meta";
      price.textContent = `${formatMoney(
        item.pricePerM2
      )} / м²`;

      option.append(name, price);
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        selectItem(item);
      });

      dropdown.appendChild(option);
    });

    if (filteredItems.length > maxVisibleItems) {
      const note = document.createElement("div");
      note.className =
        "searchable-select__more";
      note.textContent = `Показаны первые ${maxVisibleItems} из ${filteredItems.length}. Уточните название.`;
      dropdown.appendChild(note);
    }
  }

  function filterItems(query) {
    const normalizedQuery =
      normalizeSearchValue(query);

    filteredItems = normalizedQuery
      ? items.filter((item) =>
          normalizeSearchValue(item.name).includes(
            normalizedQuery
          )
        )
      : [...items];

    highlightedIndex = filteredItems.length
      ? 0
      : -1;

    renderOptions();
  }

  function openDropdown() {
    filterItems(input.value);
    setExpanded(true);
  }

  function closeDropdown({ restore = false } = {}) {
    setExpanded(false);
    highlightedIndex = -1;

    if (restore) {
      syncFromNative();
    }
  }

  function selectItem(item) {
    nativeSelect.value = item.id;
    input.value = item.name;
    input.setCustomValidity("");
    closeDropdown();

    nativeSelect.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }

  function clearSelection() {
    if (!nativeSelect.value) {
      return;
    }

    nativeSelect.value = "";
    nativeSelect.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  }

  function syncFromNative() {
    const selectedItem = getSelectedItem();
    input.value = selectedItem
      ? selectedItem.name
      : "";
    input.placeholder = placeholder;
    input.setCustomValidity("");
  }

  function moveHighlight(step) {
    const visibleCount = Math.min(
      filteredItems.length,
      maxVisibleItems
    );

    if (!visibleCount) {
      return;
    }

    highlightedIndex =
      (highlightedIndex + step + visibleCount) %
      visibleCount;

    renderOptions();

    dropdown
      .querySelector(".is-highlighted")
      ?.scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("focus", openDropdown);
  input.addEventListener("click", openDropdown);

  input.addEventListener("input", () => {
    clearSelection();
    filterItems(input.value);
    setExpanded(true);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else {
        moveHighlight(1);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else {
        moveHighlight(-1);
      }
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      const item = filteredItems[highlightedIndex];
      if (item) {
        selectItem(item);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown({ restore: true });
      input.blur();
    }
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (!root.contains(document.activeElement)) {
        const exactMatch = items.find(
          (item) =>
            normalizeSearchValue(item.name) ===
            normalizeSearchValue(input.value)
        );

        if (exactMatch) {
          selectItem(exactMatch);
          return;
        }

        if (!nativeSelect.value && input.value.trim()) {
          input.setCustomValidity(
            "Выберите шпон из списка"
          );
        }

        closeDropdown({ restore: true });
      }
    }, 0);
  });

  toggle.addEventListener("click", () => {
    if (isOpen) {
      closeDropdown({ restore: true });
      return;
    }

    input.focus();
    openDropdown();
  });

  nativeSelect.addEventListener(
    "change",
    syncFromNative
  );

  document.addEventListener("mousedown", (event) => {
    if (!root.contains(event.target)) {
      closeDropdown({ restore: true });
    }
  });

  syncFromNative();

  return {
    syncFromNative,
    openDropdown,
    closeDropdown
  };
}

function initVeneerComboboxes() {
  veneerAComboboxController =
    createSearchableSelect({
      root: form.veneerACombobox,
      nativeSelect: form.veneerASelect,
      input: form.veneerASearch,
      items: calcData.veneers,
      placeholder: "Выберите шпон"
    });

  veneerBComboboxController =
    createSearchableSelect({
      root: form.veneerBCombobox,
      nativeSelect: form.veneerBSelect,
      input: form.veneerBSearch,
      items: calcData.veneers,
      placeholder: "Выберите шпон стороны Б"
    });
}

function syncVeneerComboboxes() {
  veneerAComboboxController?.syncFromNative();
  veneerBComboboxController?.syncFromNative();
}

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

  return (
    Math.round((Number(value) + Number.EPSILON) * factor) / factor
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectNumberValueOnFocus(input) {
  if (!input) {
    return;
  }

  input.addEventListener(
    "focus",
    () => {
      window.setTimeout(() => {
        input.select();
      }, 0);
    }
  );

  input.addEventListener(
    "mouseup",
    (event) => {
      event.preventDefault();
    }
  );
}

function getDiscountPercent() {
  const value =
    Number(form.discountInput?.value) || 0;

  return Math.min(
    Math.max(value, 0),
    100
  );
}

function getUploadedFiles() {
  const selectedFiles = Array.from(
    form.orderFilesInput?.files || []
  ).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  }));

  return selectedFiles.length
    ? selectedFiles
    : existingUploadedFiles;
}

function renderSelectedOrderFiles() {
  if (!form.selectedOrderFiles) {
    return;
  }

  const files = getUploadedFiles();
  form.selectedOrderFiles.innerHTML = "";

  if (!files.length) {
    form.selectedOrderFiles.textContent = "Файлы не выбраны";
    return;
  }

  files.forEach((file) => {
    const item = document.createElement("span");
    item.textContent = file.name;
    form.selectedOrderFiles.append(item);
  });
}

function resetSelect(select, placeholder, disabled = false) {
  if (!select) {
    return;
  }

  select.innerHTML = "";

  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;

  select.appendChild(option);
  select.disabled = disabled;
}

function addOption(select, value, label) {
  if (!select) {
    return;
  }

  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;

  select.appendChild(option);
}

function fillSelect(select, items, getLabel) {
  if (!select || !items) {
    return;
  }

  items.forEach((item) => {
    addOption(select, item.id, getLabel(item));
  });
}

function getSelectedBase() {
  return calcData.bases.find(
    (item) => item.id === form.baseSelect.value
  );
}

function getSelectedThickness() {
  const base = getSelectedBase();

  if (!base || !base.thicknesses) {
    return null;
  }

  return (
    base.thicknesses.find(
      (item) =>
        String(item.value) === form.thicknessSelect.value
    ) || null
  );
}

function getSelectedVeneerA() {
  return (
    calcData.veneers.find(
      (item) => item.id === form.veneerASelect.value
    ) || null
  );
}

function getSelectedVeneerB() {
  return (
    calcData.veneers.find(
      (item) => item.id === form.veneerBSelect.value
    ) || null
  );
}

function getSelectedReverseSide() {
  return (
    calcData.reverseSides.find(
      (item) => item.id === form.reverseSideSelect.value
    ) || null
  );
}

function getSelectedEdgeThickness() {
  return (
    calcData.edge.thicknesses.find(
      (item) =>
        String(item.value) ===
        form.edgeThicknessSelect.value
    ) || null
  );
}

function getSelectedSanding() {
  return (
    calcData.sanding.find(
      (item) => item.id === form.sandingSelect.value
    ) || null
  );
}

function getSelectedFinishType() {
  return (
    calcData.finish.types.find(
      (item) => item.id === form.finishTypeSelect.value
    ) || null
  );
}

function getSelectedLacquerType() {
  return (
    calcData.finish.lacquers.find(
      (item) => item.id === form.lacquerTypeSelect.value
    ) || null
  );
}

function getSelectedLacquerGloss() {
  const lacquer = getSelectedLacquerType();

  if (!lacquer) {
    return null;
  }

  return (
    lacquer.gloss.find(
      (item) => item.id === form.lacquerGlossSelect.value
    ) || null
  );
}

function normalizeSizePair(length, width) {
  return [Number(length), Number(width)].sort(
    (a, b) => a - b
  );
}

function getAvailableStandardSizes() {
  const base = getSelectedBase();

  if (!base) {
    return [];
  }

  return calcData.standardSizesByBase?.[base.id] || [];
}

function getMatchedStandardSize(length, width) {
  if (!length || !width) {
    return null;
  }

  const current = normalizeSizePair(length, width);

  return (
    getAvailableStandardSizes().find((item) => {
      const standard = normalizeSizePair(
        item.length,
        item.width
      );

      return (
        standard[0] === current[0] &&
        standard[1] === current[1]
      );
    }) || null
  );
}

function isStandardSize(length, width) {
  return Boolean(getMatchedStandardSize(length, width));
}

function getSizeTypeLabel(length, width) {
  if (!length || !width) {
    return "—";
  }

  const standardSize = getMatchedStandardSize(
    length,
    width
  );

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

function getSizeKey(length, width) {
  const standardSize = getMatchedStandardSize(
    length,
    width
  );

  if (standardSize) {
    return `${standardSize.length}x${standardSize.width}`;
  }

  return `${Number(length)}x${Number(width)}`;
}

function getArea(length, width, quantity) {
  return roundTo(
    (length * width * quantity) / 1000000,
    3
  );
}

function getCuttingMeters(length, width, quantity) {
  return roundTo(
    ((length + width) / 1000) * 2 * quantity,
    2
  );
}

function getStandardPanelUnitPrice(
  baseId,
  thicknessValue,
  sides,
  length,
  width
) {
  const pricesByBase =
    calcData.standardPanelPrices?.[baseId];

  if (!pricesByBase) {
    return null;
  }

  const row = pricesByBase.find(
    (item) =>
      String(item.thickness) ===
      String(thicknessValue)
  );

  if (!row) {
    return null;
  }

  const sideKey =
    String(sides) === "2" ? "two" : "one";

  const sizeKey = getSizeKey(length, width);
  const price = row[sideKey]?.[sizeKey];

  return Number.isFinite(Number(price))
    ? Number(price)
    : null;
}

function renderStandardSizes() {
  const base = getSelectedBase();
  const sizes = getAvailableStandardSizes();

  if (!base) {
    form.standardSizeValues.innerHTML =
      "<span>Выберите основу</span>";

    form.standardSizeNote.textContent =
      "Сначала выберите основу. Стандартные размеры зависят от материала.";

    return;
  }

  if (!sizes.length) {
    form.standardSizeValues.innerHTML =
      "<span>Для выбранной основы стандартные размеры не заведены</span>";

    form.standardSizeNote.textContent =
      `${base.name}: стандартные размеры не найдены в справочнике прототипа.`;

    return;
  }

  form.standardSizeValues.innerHTML = sizes
    .map(
      (item) => `
        <span
          role="button"
          tabindex="0"
          data-standard-size
          data-length="${item.length}"
          data-width="${item.width}"
          aria-label="Подставить стандартный размер ${escapeHtml(
            item.name
          )}"
        >
          ${escapeHtml(item.name)}
        </span>
      `
    )
    .join("");

  form.standardSizeNote.textContent =
`${base.name}: нажмите на стандартный формат, чтобы автоматически подставить длину и ширину. ` + `Для стандартного размера система берёт цену из таблицы стандартных панелей. ` + `Если размер отличается, добавляется раскрой по периметру.`;
}

function createSizeRow(values = {}) {
  const row = document.createElement("div");

  row.className = "size-row";
  row.dataset.sizeRow = "";

  row.innerHTML = `
    <div class="field-grid field-grid--size-row">
      <label class="field">
        <span class="field__label">Длина, мм</span>
        <input
          data-size-length
          type="number"
          min="1"
          step="1"
          placeholder="Например, 2440"
          value="${values.length || ""}"
        />
      </label>

      <label class="field">
        <span class="field__label">Ширина, мм</span>
        <input
          data-size-width
          type="number"
          min="1"
          step="1"
          placeholder="Например, 1220"
          value="${values.width || ""}"
        />
      </label>

      <label class="field">
        <span class="field__label">Количество, шт.</span>
        <input
          data-size-quantity
          type="number"
          min="1"
          step="1"
          placeholder="Например, 2"
          value="${values.quantity || ""}"
        />
      </label>

      <div class="size-row__actions">
        <button
          class="size-row__remove"
          data-remove-size-row
          type="button"
          aria-label="Удалить размер"
        >
          Удалить
        </button>
      </div>
    </div>

    <div
      class="field-status is-hidden"
      data-size-status
    ></div>
  `;

  return row;
}
function getSizeRows() {
  return Array.from(
    form.sizeRows.querySelectorAll("[data-size-row]")
  );
}

function setActiveSizeRow(row) {
  if (!row || !form.sizeRows.contains(row)) {
    return;
  }

  getSizeRows().forEach((item) => {
    item.classList.toggle(
      "is-active",
      item === row
    );
  });

  activeSizeRow = row;
}

function getActiveSizeRow() {
  if (
    activeSizeRow &&
    form.sizeRows.contains(activeSizeRow)
  ) {
    return activeSizeRow;
  }

  const firstRow = getSizeRows()[0] || null;

  if (firstRow) {
    setActiveSizeRow(firstRow);
  }

  return firstRow;
}

function applyStandardSize(length, width) {
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(width)
  ) {
    return;
  }

  const targetRow = getActiveSizeRow();

  if (!targetRow) {
    return;
  }

  const lengthInput = targetRow.querySelector(
    "[data-size-length]"
  );

  const widthInput = targetRow.querySelector(
    "[data-size-width]"
  );

  const quantityInput = targetRow.querySelector(
    "[data-size-quantity]"
  );

  lengthInput.value = length;
  widthInput.value = width;

  renderSpecification();
  quantityInput.focus();
}

function getSizeRowValues(row) {
  const length =
    Number(
      row.querySelector("[data-size-length]").value
    ) || 0;

  const width =
    Number(
      row.querySelector("[data-size-width]").value
    ) || 0;

  const quantity =
    Number(
      row.querySelector("[data-size-quantity]").value
    ) || 0;

  return {
    row,
    length,
    width,
    quantity,
    area: getArea(length, width, quantity),
    isComplete:
      length > 0 &&
      width > 0 &&
      quantity > 0
  };
}

function getAllSizeValues() {
  return getSizeRows().map(getSizeRowValues);
}

function getCompleteSizeValues() {
  return getAllSizeValues().filter(
    (item) => item.isComplete
  );
}

function isFinishSelected() {
  return (
    form.finishTypeSelect.value &&
    form.finishTypeSelect.value !== "none"
  );
}

function getSizeLimitWarnings(sizeItem) {
  const thickness = getSelectedThickness();

  const numericThickness =
    Number(thickness?.numericThickness) || 0;

  if (
    !sizeItem.isComplete ||
    !numericThickness
  ) {
    return {
      warnings: [],
      blocked: false
    };
  }

  const biggerSide = Math.max(
    sizeItem.length,
    sizeItem.width
  );

  const smallerSide = Math.min(
    sizeItem.length,
    sizeItem.width
  );

  const isStandard = isStandardSize(
    sizeItem.length,
    sizeItem.width
  );

  const hasSanding =
    form.sandingNeededSelect.value === "yes";

  const hasFinish = isFinishSelected();

  const hasEdge =
    form.edgeNeededSelect.value === "yes";

  const warnings = [];
  let blocked = false;

  if (
    !isStandard &&
    hasSanding &&
    hasFinish &&
    hasEdge &&
    numericThickness >= 8 &&
    numericThickness <= 19
  ) {
    if (
      biggerSide > 2780 ||
      smallerSide > 2050
    ) {
      blocked = true;

      warnings.push(
        "Ограничение: нестандартные панели со шлифованием, финишем и кромкой при толщине 8–19 мм — максимум 2780 × 2050 мм."
      );
    }
  }

  if (
    !isStandard &&
    hasSanding &&
    hasFinish &&
    hasEdge &&
    numericThickness > 19 &&
    numericThickness <= 50
  ) {
    if (
      biggerSide > 2780 ||
      smallerSide > 1280
    ) {
      blocked = true;

      warnings.push(
        "Ограничение: нестандартные панели со шлифованием, финишем и кромкой при толщине 19–50 мм — максимум 2780 × 1280 мм."
      );
    }
  }

  if (
    isStandard &&
    hasSanding &&
    !hasFinish &&
    !hasEdge
  ) {
    if (
      biggerSide > 2800 ||
      smallerSide > 2070
    ) {
      blocked = true;

      warnings.push(
        "Ограничение: стандартные панели со шлифованием без финиша и кромки — максимум 2800 × 2070 мм."
      );
    }
  }

  return {
    warnings,
    blocked
  };
}

function renderSizeRowsStatus() {
  getAllSizeValues().forEach((item) => {
    const status = item.row.querySelector(
      "[data-size-status]"
    );

    status.classList.remove(
      "field-status--ok",
      "field-status--warning"
    );

    if (
      !item.length &&
      !item.width &&
      !item.quantity
    ) {
      status.classList.add("is-hidden");
      status.textContent = "";

      return;
    }

    if (
      !item.length ||
      !item.width ||
      !item.quantity
    ) {
      status.classList.remove("is-hidden");
      status.classList.add(
        "field-status--warning"
      );

      status.textContent =
        "Заполните длину, ширину и количество для расчёта этой строки.";

      return;
    }

    const standardSize =
      getMatchedStandardSize(
        item.length,
        item.width
      );

    const limits = getSizeLimitWarnings(item);

    status.classList.remove("is-hidden");

    if (standardSize) {
      status.classList.add(
        limits.blocked
          ? "field-status--warning"
          : "field-status--ok"
      );

      status.textContent = [
        `Стандартный размер: ${standardSize.name}. Цена берётся из таблицы стандартных панелей.`,
        ...limits.warnings
      ].join(" ");

      return;
    }

    status.classList.add(
      "field-status--warning"
    );

    status.textContent = [
      `Нестандартный размер. Раскрой добавлен автоматически: ${formatNumber(
        getCuttingMeters(
          item.length,
          item.width,
          item.quantity
        ),
        2
      )} пог. м.`,
      ...limits.warnings
    ].join(" ");
  });

  updateRemoveButtonsState();
}

function updateRemoveButtonsState() {
  const rows = getSizeRows();

  rows.forEach((row) => {
    const button = row.querySelector(
      "[data-remove-size-row]"
    );

    button.disabled = rows.length === 1;
  });
}

function addSizeRow(values = {}) {
  const row = createSizeRow(values);

  form.sizeRows.appendChild(row);
  setActiveSizeRow(row);
  updateRemoveButtonsState();
  renderSpecification();

  row
    .querySelector("[data-size-length]")
    .focus();
}

function removeSizeRow(row) {
  const rows = getSizeRows();

  if (rows.length === 1) {
    return;
  }

  const rowIndex = rows.indexOf(row);
  const wasActive = row === activeSizeRow;

  const nextActiveRow =
    rows[rowIndex + 1] ||
    rows[rowIndex - 1] ||
    null;

  row.remove();

  if (wasActive && nextActiveRow) {
    setActiveSizeRow(nextActiveRow);
  }

  updateRemoveButtonsState();
  renderSpecification();
}

function getLookupRate(items, value, rateKey) {
  if (!items || !items.length) {
    return 0;
  }

  const sortedItems = [...items].sort(
    (a, b) =>
      a.maxThickness - b.maxThickness
  );

  const exactOrHigher = sortedItems.find(
    (item) => value <= item.maxThickness
  );

  if (exactOrHigher) {
    return exactOrHigher[rateKey] || 0;
  }

  return (
    sortedItems[sortedItems.length - 1][rateKey] ||
    0
  );
}

function getCuttingRate(thickness) {
  const mode =
    form.cuttingModeSelect.value ||
    calcData.meta.defaultCuttingMode ||
    "machine";

  const rateKey =
    mode === "manual"
      ? "manualRatePerMeter"
      : "machineRatePerMeter";

  return getLookupRate(
    calcData.cuttingRates,
    thickness,
    rateKey
  );
}

function getCuttingModeLabel() {
  const selected =
    calcData.cuttingModes?.find(
      (item) =>
        item.id ===
        form.cuttingModeSelect.value
    );

  return selected?.name || "На станке";
}

function getEdgeMeters(
  length,
  width,
  quantity
) {
  const edgeMode =
    form.edgeSidesSelect.value;

  const values = {
    perimeter: 2 * length + 2 * width,
    one_length: length,
    two_lengths: 2 * length,
    one_width: width,
    two_widths: 2 * width,
    one_length_one_width:
      length + width,
    two_lengths_one_width:
      2 * length + width,
    one_length_two_widths:
      length + 2 * width
  };

  const selectedLengthMm =
    values[edgeMode] || 0;

  return roundTo(
    (selectedLengthMm * quantity) /
      1000 *
      calcData.meta.edgeWasteCoefficient,
    2
  );
}

function getEdgeRate(
  baseThickness,
  edgeType,
  edgeMeters
) {
  const rates =
    calcData.edge.rates[edgeType] || [];

  const threshold =
    calcData.meta.edgeThresholdMeters || 35;

  const rateKey =
    edgeMeters > threshold
      ? "rateAfterThreshold"
      : "rateBeforeThreshold";

  return getLookupRate(
    rates,
    baseThickness,
    rateKey
  );
}

function getBaseRate(thickness) {
  const sides =
    form.veneeredSidesSelect.value;

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

  if (
    form.veneeredSidesSelect.value === "2"
  ) {
    if (
      form.sideBModeSelect.value === "same" &&
      veneerA
    ) {
      prices.push(veneerA.pricePerM2);
    }

    if (
      form.sideBModeSelect.value === "other"
    ) {
      const veneerB =
        getSelectedVeneerB();

      if (veneerB) {
        prices.push(veneerB.pricePerM2);
      }
    }
  }

  return prices;
}

function hasPremiumVeneer() {
  const prices = getSelectedVeneerPrices();

  const threshold =
    calcData.meta.premiumVeneerThreshold;

  return prices.some(
    (price) => price > threshold
  );
}

function getVeneerWorkMultiplier() {
  return hasPremiumVeneer()
    ? calcData.meta
        .premiumVeneerWorkMultiplier
    : 1;
}

function getSideBPrice() {
  const sideBMode =
    form.sideBModeSelect.value;

  const veneerA = getSelectedVeneerA();
  const veneerB = getSelectedVeneerB();

  if (
    form.veneeredSidesSelect.value === "1"
  ) {
    return (
      getSelectedReverseSide()
        ?.pricePerM2 || 0
    );
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
  const sideBMode =
    form.sideBModeSelect.value;

  const veneerA = getSelectedVeneerA();
  const veneerB = getSelectedVeneerB();
  const reverseSide =
    getSelectedReverseSide();

  if (
    form.veneeredSidesSelect.value === "1"
  ) {
    return reverseSide?.name || "—";
  }

  if (sideBMode === "same") {
    return veneerA
      ? `Как сторона А: ${veneerA.name}`
      : "Как сторона А";
  }

  if (sideBMode === "other") {
    return veneerB?.name || "Другой шпон";
  }

  return "—";
}

function getVeneerCost(area) {
  const veneerA = getSelectedVeneerA();

  const sideBMode =
    form.sideBModeSelect.value;

  const reserve =
    calcData.meta.veneerReserveMultiplier;

  if (!veneerA) {
    return {
      veneerCost: 0,
      veneerArea: 0
    };
  }

  let veneerArea = area * reserve;

  let veneerCost =
    veneerA.pricePerM2 *
    area *
    reserve;

  if (
    form.veneeredSidesSelect.value === "2"
  ) {
    let veneerBPrice = 0;

    if (sideBMode === "same") {
      veneerBPrice =
        veneerA.pricePerM2;
    }

    if (sideBMode === "other") {
      veneerBPrice =
        getSelectedVeneerB()
          ?.pricePerM2 || 0;
    }

    veneerArea += area * reserve;

    veneerCost +=
      veneerBPrice *
      area *
      reserve;
  }

  return {
    veneerCost: Math.round(veneerCost),
    veneerArea: roundTo(
      veneerArea,
      2
    )
  };
}

function getReverseSideWorkRate() {
  if (
    form.veneeredSidesSelect.value === "2"
  ) {
    return 0;
  }

  return (
    getSelectedReverseSide()
      ?.pricePerM2 || 0
  );
}

function getFinishTypeLabel() {
  return (
    getSelectedFinishType()?.name ||
    "Нет"
  );
}

function getFinishSidesRate(rates) {
  const sides =
    form.finishSidesSelect.value;

  return rates?.[sides] || 0;
}

function getIsolatorCost(area) {
  if (
    form.isolatorSelect.value !== "yes"
  ) {
    return 0;
  }

  const rate = getFinishSidesRate(
    calcData.finish.isolatorRates
  );

  return Math.round(area * rate);
}

function getFinishCost(area) {
  const finishType =
    form.finishTypeSelect.value;

  if (
    !finishType ||
    finishType === "none"
  ) {
    return {
      rate: 0,
      cost: 0,
      isolatorCost: 0
    };
  }

  if (finishType === "lacquer") {
    const lacquer =
      getSelectedLacquerType();

    const rate = getFinishSidesRate(
      lacquer?.rates || {}
    );

    const isolatorCost =
      getIsolatorCost(area);

    return {
      rate,
      cost:
        Math.round(area * rate) +
        isolatorCost,
      isolatorCost
    };
  }

  if (finishType === "gloss_100") {
    const glossRate =
      calcData.finish.gloss100Rates?.[
        form.gloss100Select.value
      ] || 0;

    return {
      rate: glossRate,
      cost: Math.round(
        area * glossRate
      ),
      isolatorCost: 0
    };
  }

  if (finishType === "enamel") {
    const enamelRate =
      calcData.finish.enamelRates?.[
        form.enamelSelect.value
      ] || 0;

    const isolatorCost =
      getIsolatorCost(area);

    return {
      rate: enamelRate,
      cost:
        Math.round(
          area * enamelRate
        ) + isolatorCost,
      isolatorCost
    };
  }

  if (finishType === "toning") {
    const rate = getFinishSidesRate(
      calcData.finish.toningRates ||
        {}
    );

    const isolatorCost =
      getIsolatorCost(area);

    return {
      rate,
      cost:
        Math.round(area * rate) +
        isolatorCost,
      isolatorCost
    };
  }

  return {
    rate: 0,
    cost: 0,
    isolatorCost: 0
  };
}

function getFinishLabel() {
  const finishType =
    form.finishTypeSelect.value;

  if (
    !finishType ||
    finishType === "none"
  ) {
    return "Нет";
  }

  if (finishType === "lacquer") {
    const lacquer =
      getSelectedLacquerType()
        ?.name || "Лак";

    const gloss =
      getSelectedLacquerGloss()
        ?.name ||
      "блеск не выбран";

    const sides =
      form.finishSidesSelect.options[
        form.finishSidesSelect
          .selectedIndex
      ]?.textContent || "";

    const isolator =
      form.isolatorSelect.value ===
      "yes"
        ? ", изолятор"
        : "";

    return `${lacquer}, ${gloss}, ${sides}${isolator}`;
  }

  if (finishType === "gloss_100") {
    const glossOption =
      form.gloss100Select.options[
        form.gloss100Select
          .selectedIndex
      ]?.textContent ||
      "Глянец 100%";

    return `Глянец 100%: ${glossOption}`;
  }

  if (finishType === "enamel") {
    const enamelOption =
      form.enamelSelect.options[
        form.enamelSelect
          .selectedIndex
      ]?.textContent ||
      "Эмаль";

    const isolator =
      form.isolatorSelect.value ===
      "yes"
        ? ", изолятор"
        : "";

    return `${enamelOption}${isolator}`;
  }

  if (finishType === "toning") {
    const sides =
      form.finishSidesSelect.options[
        form.finishSidesSelect
          .selectedIndex
      ]?.textContent || "";

    const isolator =
      form.isolatorSelect.value ===
      "yes"
        ? ", изолятор"
        : "";

    return `Тонировка, ${sides}${isolator}`;
  }

  return "По ТЗ";
}

function getExtrasText() {
  const items = [];

  if (productType === "panels") {
    if (
      form.radiusPanelSelect.value ===
      "yes"
    ) {
      items.push("Радиусная панель");
    }

    if (
      form.panelOperationsInput.value.trim()
    ) {
      items.push("Операции по ТЗ");
    }
  }

  if (productType === "facades") {
    if (
      form.hingesSelect.value ===
      "yes"
    ) {
      items.push(
        "Присадка под петли"
      );
    }

    if (
      form.handleTypeSelect.value !==
      "none"
    ) {
      items.push(
        form.handleTypeSelect.options[
          form.handleTypeSelect
            .selectedIndex
        ].textContent
      );
    }

    if (
      form.facadeOperationsInput.value.trim()
    ) {
      items.push("Операции по ТЗ");
    }
  }

  return items.length
    ? items.join(", ")
    : "Нет";
}

function getNotes() {
  const notes = [];

  if (
    form.textureTransitionSelect.value ===
    "yes"
  ) {
    notes.push(
      "Есть переход текстуры."
    );
  }

  if (
    form.fiberDirectionSelect.value ===
    "custom"
  ) {
    notes.push(
      "Направление волокон по ТЗ."
    );
  }

  if (
    form.veneerLayoutSelect.value ===
    "custom"
  ) {
    notes.push(
      "Раскладка шпона по ТЗ."
    );
  }

  if (
    form.finishCommentInput.value.trim()
  ) {
    notes.push(
      `Финиш: ${form.finishCommentInput.value.trim()}`
    );
  }

  return notes;
}

function isReadyForCommonCalculation() {
  const base = getSelectedBase();
  const thickness =
    getSelectedThickness();
  const veneerA =
    getSelectedVeneerA();
  const baseRate =
    getBaseRate(thickness);

  if (!base || base.manualPrice) {
    return false;
  }

  return Boolean(
    thickness &&
      baseRate !== null &&
      veneerA
  );
}

function isReadyForCalculation() {
  return (
    isReadyForCommonCalculation() &&
    getCompleteSizeValues().length > 0
  );
}

function getProductionTermForItem(
  sizeItem,
  finishCost,
  extrasWarnings
) {
  const isStandard = isStandardSize(
    sizeItem.length,
    sizeItem.width
  );

  const hasFinish =
    finishCost > 0 ||
    isFinishSelected();

  const hasOperations =
    extrasWarnings.length > 0;

  if (hasOperations) {
    return "от 25 раб. дней";
  }

  if (hasFinish) {
    return "от 20 раб. дней";
  }

  if (isStandard) {
    return "7–9 раб. дней";
  }

  return "12–15 раб. дней";
}

function calculateSizeItem(sizeItem) {
  const meta = calcData.meta;

  const base = getSelectedBase();
  const thickness =
    getSelectedThickness();
  const veneerA =
    getSelectedVeneerA();

  const area = sizeItem.area;

  const baseRate =
    getBaseRate(thickness);

  const reverseSideWorkRate =
    getReverseSideWorkRate();

  const standardSize =
    getMatchedStandardSize(
      sizeItem.length,
      sizeItem.width
    );

  const isStandard =
    Boolean(standardSize);

  const sides =
    form.veneeredSidesSelect.value;

  const standardUnitPrice =
    isStandard
      ? getStandardPanelUnitPrice(
          base.id,
          thickness.value,
          sides,
          sizeItem.length,
          sizeItem.width
        )
      : null;

  const standardPanelCost =
    standardUnitPrice !== null
      ? Math.round(
          standardUnitPrice *
            sizeItem.quantity
        )
      : 0;

  const coefficient =
    form.textureTransitionSelect
      .value === "yes"
      ? meta.textureTransitionCoefficient
      : meta.baseCoefficient;

  const premiumVeneerApplied =
    hasPremiumVeneer();

  const veneerWorkMultiplier =
    getVeneerWorkMultiplier();

  const panelWorkRate =
    (baseRate +
      reverseSideWorkRate) *
    coefficient *
    veneerWorkMultiplier;

  const panelWorkCost =
    Math.round(area * panelWorkRate);

  let cuttingCost = 0;
  let cuttingMeters = 0;
  let cuttingRate = 0;
  let cuttingAdded = false;

  if (
    shouldAddCutting(
      sizeItem.length,
      sizeItem.width
    )
  ) {
    cuttingAdded = true;

    cuttingMeters = getCuttingMeters(
      sizeItem.length,
      sizeItem.width,
      sizeItem.quantity
    );

    cuttingRate = getCuttingRate(
      thickness.numericThickness
    );

    cuttingCost = Math.round(
      cuttingMeters * cuttingRate
    );
  }

  let edgeCost = 0;
  let edgeMeters = 0;
  let edgeRate = 0;

  if (
    form.edgeNeededSelect.value ===
    "yes"
  ) {
    const edgeThickness =
      getSelectedEdgeThickness();

    if (edgeThickness) {
      edgeMeters = getEdgeMeters(
        sizeItem.length,
        sizeItem.width,
        sizeItem.quantity
      );

      edgeRate = getEdgeRate(
        thickness.numericThickness,
        edgeThickness.type,
        edgeMeters
      );

      edgeCost = Math.round(
        edgeMeters * edgeRate
      );
    }
  }

  let sandingCost = 0;
  let sandingRate = 0;

  if (
    form.sandingNeededSelect.value ===
    "yes"
  ) {
    const sanding =
      getSelectedSanding();

    sandingRate =
      sanding?.ratePerM2 || 0;

    sandingCost = Math.round(
      area * sandingRate
    );
  }

  const finish =
    getFinishCost(area);

  const finishCost = finish.cost;
  const finishRate = finish.rate;

  const workSubtotal =
    panelWorkCost +
    cuttingCost +
    edgeCost +
    sandingCost +
    finishCost;

  const nonstandardWorkTotal =
    Math.round(
      workSubtotal *
        meta.productionMultiplier
    );

  const standardExtraOperations =
    edgeCost +
    sandingCost +
    finishCost;

  const standardWorkTotal =
    standardUnitPrice !== null
      ? standardPanelCost +
        Math.round(
          standardExtraOperations *
            meta.productionMultiplier
        )
      : nonstandardWorkTotal;

  const workTotal = isStandard
    ? standardWorkTotal
    : nonstandardWorkTotal;

  const veneer =
    getVeneerCost(area);

  const totalBeforeDiscount =
    workTotal + veneer.veneerCost;

  const discountPercent =
    getDiscountPercent();

  const discountAmount =
    Math.round(
      totalBeforeDiscount *
        discountPercent /
        100
    );

  const total =
    Math.max(
      totalBeforeDiscount -
        discountAmount,
      0
    );

  const vat = meta.vatIncluded
    ? Math.round(
        (total * meta.vatRate) /
          (1 + meta.vatRate)
      )
    : Math.round(
        total * meta.vatRate
      );

  const extrasWarnings = [];

    if (
    isStandard &&
    standardUnitPrice === null
  ) {
    extrasWarnings.push(
      "Стандартный размер найден, но цена для этой основы, толщины и размера не заведена. Применена формула нестандартного расчёта."
    );
  }

  if (
    form.finishTypeSelect.value ===
    "custom"
  ) {
    extrasWarnings.push(
      "Финиш по ТЗ — тариф не найден, требуется проверка менеджером."
    );
  }

  if (productType === "panels") {
    if (
      form.radiusPanelSelect.value ===
      "yes"
    ) {
      extrasWarnings.push(
        "Радиусная панель — расчёт по ТЗ."
      );
    }

    if (
      form.panelOperationsInput.value.trim()
    ) {
      extrasWarnings.push(
        "Есть операции по ТЗ."
      );
    }
  }

  if (productType === "facades") {
    if (
      form.hingesSelect.value ===
      "yes"
    ) {
      extrasWarnings.push(
        "Присадка под петли — параметры по ТЗ."
      );
    }

    if (
      form.handleTypeSelect.value !==
      "none"
    ) {
      extrasWarnings.push(
        "Ручки или открывание — параметры по ТЗ."
      );
    }

    if (
      form.facadeOperationsInput.value.trim()
    ) {
      extrasWarnings.push(
        "Есть операции по ТЗ."
      );
    }
  }

  const limitResult =
    getSizeLimitWarnings(sizeItem);

  extrasWarnings.push(
    ...limitResult.warnings
  );

  const productionTerm =
    getProductionTermForItem(
      sizeItem,
      finishCost,
      extrasWarnings
    );

  const unitPrice =
    sizeItem.quantity
      ? Math.round(
          total / sizeItem.quantity
        )
      : total;

  const pricePerM2 = area
    ? Math.round(total / area)
    : 0;

  return {
    productType,
    productName:
      productLabels[productType].spec,

    base: base.name,
    baseId: base.id,

    thickness: thickness.label,
    thicknessValue:
      thickness.value,
    numericThickness:
      thickness.numericThickness,

    length: sizeItem.length,
    width: sizeItem.width,
    quantity: sizeItem.quantity,
    area,

    sizeType: isStandard
      ? "standard"
      : "custom",

    sizeTypeLabel:
      getSizeTypeLabel(
        sizeItem.length,
        sizeItem.width
      ),

    matchedStandardSize:
      standardSize,

    standardUnitPrice,
    standardPanelCost,

    standardPriceApplied:
      isStandard &&
      standardUnitPrice !== null,

    veneeredSides:
      form.veneeredSidesSelect.value,

    veneerA,
    veneerAId:
      veneerA?.id || null,

    sideB: getSideBLabel(),

    sideBMode:
      form.sideBModeSelect.value,

    sideBPrice:
      getSideBPrice(),

    veneerBId:
      getSelectedVeneerB()?.id ||
      null,

    reverseSideId:
      getSelectedReverseSide()?.id ||
      null,

    fiberDirection:
      form.fiberDirectionSelect.value,

    veneerLayout:
      form.veneerLayoutSelect.value,

    textureTransition:
      form.textureTransitionSelect.value,

    veneerArea:
      veneer.veneerArea,

    veneerCost:
      veneer.veneerCost,

    coefficient,
    premiumVeneerApplied,
    veneerWorkMultiplier,

    productionMultiplier:
      meta.productionMultiplier,

    baseRate,
    reverseSideWorkRate,
    panelWorkRate,
    panelWorkCost,

    cuttingMode:
      form.cuttingModeSelect.value,

    cuttingModeLabel:
      getCuttingModeLabel(),

    cuttingAdded,
    cuttingMeters,
    cuttingRate,
    cuttingCost,

    edgeNeeded:
      form.edgeNeededSelect.value,

    edgeSides:
      form.edgeSidesSelect.value,

    edgeThicknessValue:
      form.edgeThicknessSelect.value,

    edgeMeters,
    edgeRate,
    edgeCost,

    sandingNeeded:
      form.sandingNeededSelect.value,

    sandingId:
      form.sandingSelect.value,

    sandingRate,
    sandingCost,

    finishType:
      form.finishTypeSelect.value,

    finishTypeLabel:
      getFinishTypeLabel(),

    finishLabel:
      getFinishLabel(),

    finishSides:
      form.finishSidesSelect.value,

    lacquerTypeId:
      form.lacquerTypeSelect.value,

    lacquerGlossId:
      form.lacquerGlossSelect.value,

    isolator:
      form.isolatorSelect.value,

    gloss100Mode:
      form.gloss100Select.value,

    enamelMode:
      form.enamelSelect.value,

    finishComment:
      form.finishCommentInput.value.trim(),

    finishRate,
    finishCost,
    lacquerCost: finishCost,

    radiusPanel:
      form.radiusPanelSelect.value,

    panelOperations:
      form.panelOperationsInput.value.trim(),

    hinges:
      form.hingesSelect.value,

    hingesComment:
      form.hingesCommentInput.value.trim(),

    handleType:
      form.handleTypeSelect.value,

    handleComment:
      form.handleCommentInput.value.trim(),

    facadeOperations:
      form.facadeOperationsInput.value.trim(),

    orderComment:
      form.orderCommentInput.value.trim(),

    attachedFiles:
      getUploadedFiles(),

    discountPercent,
    discountAmount,
    totalBeforeDiscount,

    workSubtotal,
    workTotal,
    total,
    vat,
    unitPrice,
    pricePerM2,
    detailsTotal: total,

    productionTerm,

    sizeLimitBlocked:
      limitResult.blocked,

    extrasWarnings,
    notes: getNotes()
  };
}

function calculateAll() {
  const items =
    getCompleteSizeValues().map(
      calculateSizeItem
    );

  const summary = items.reduce(
    (acc, item) => {
      acc.totalBeforeDiscount +=
        item.totalBeforeDiscount;

      acc.discountAmount +=
        item.discountAmount;

      acc.total += item.total;
      acc.vat += item.vat;
      acc.area += item.area;
      acc.quantity += item.quantity;
      acc.cuttingMeters +=
        item.cuttingMeters;
      acc.cuttingCost +=
        item.cuttingCost;
      acc.edgeMeters +=
        item.edgeMeters;
      acc.edgeCost +=
        item.edgeCost;
      acc.panelWorkCost +=
        item.panelWorkCost;
      acc.veneerCost +=
        item.veneerCost;
      acc.sandingCost +=
        item.sandingCost;
      acc.finishCost +=
        item.finishCost;
      acc.standardPanelCost +=
        item.standardPanelCost;
      acc.workTotal +=
        item.workTotal;

      return acc;
    },
    {
      totalBeforeDiscount: 0,
      discountAmount: 0,
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
      finishCost: 0,
      standardPanelCost: 0,
      workTotal: 0
    }
  );

  summary.discountPercent =
    getDiscountPercent();

  summary.orderComment =
    form.orderCommentInput.value.trim();

  summary.attachedFiles =
    getUploadedFiles();

  summary.area = roundTo(
    summary.area,
    3
  );

  summary.cuttingMeters = roundTo(
    summary.cuttingMeters,
    2
  );

  summary.edgeMeters = roundTo(
    summary.edgeMeters,
    2
  );

  return {
    items,
    summary
  };
}

function showEmptySpec() {
  latestCalculations = [];
  latestSummary = null;

  spec.emptySpec.classList.remove(
    "is-hidden"
  );

  spec.specContent.classList.add(
    "is-hidden"
  );
}

function showSpecContent() {
  spec.emptySpec.classList.add(
    "is-hidden"
  );

  spec.specContent.classList.remove(
    "is-hidden"
  );
}

function renderPartialSpec() {
  const base = getSelectedBase();
  const thickness =
    getSelectedThickness();
  const veneerA =
    getSelectedVeneerA();
  const sizes =
    getCompleteSizeValues();

  const hasAnyData = Boolean(
    form.baseSelect.value ||
      form.thicknessSelect.value ||
      sizes.length > 0 ||
      form.veneerASelect.value ||
      form.edgeNeededSelect.value ===
        "yes" ||
      form.sandingNeededSelect.value ===
        "yes" ||
      isFinishSelected()
  );

  if (!hasAnyData) {
    showEmptySpec();
    return;
  }

  showSpecContent();

  spec.title.textContent =
    productLabels[productType].spec;

  spec.productType.textContent =
    productLabels[productType].spec;

  spec.base.textContent = base
    ? `${base.name}${
        thickness
          ? `, ${thickness.label}`
          : ""
      }`
    : "—";

  spec.size.textContent = sizes.length
    ? sizes
        .map(
          (item) =>
            `${item.length} × ${item.width} мм, ${item.quantity} шт.`
        )
        .join("; ")
    : "—";

  if (sizes.length) {
    const standardCount =
      sizes.filter((item) =>
        isStandardSize(
          item.length,
          item.width
        )
      ).length;

    const customCount =
      sizes.length - standardCount;

    spec.sizeType.textContent = [
      standardCount
        ? `стандартных: ${standardCount}`
        : "",
      customCount
        ? `нестандартных: ${customCount}`
        : ""
    ]
      .filter(Boolean)
      .join(", ");
  } else {
    spec.sizeType.textContent = "—";
  }

    const cuttingRows = sizes.filter(
    (item) =>
      shouldAddCutting(
        item.length,
        item.width
      )
  );

  spec.cutting.textContent =
    cuttingRows.length
      ? `Добавлен для ${cuttingRows.length} размер(ов), ${getCuttingModeLabel()}`
      : sizes.length
        ? "Не добавлен"
        : "—";

  spec.quantity.textContent =
    sizes.length
      ? `${sizes.reduce(
          (sum, item) =>
            sum + item.quantity,
          0
        )} шт.`
      : "—";

  spec.area.textContent =
    sizes.length
      ? `${formatNumber(
          sizes.reduce(
            (sum, item) =>
              sum + item.area,
            0
          ),
          3
        )} м²`
      : "—";

  spec.veneerA.textContent =
    veneerA?.name || "—";

  spec.sideB.textContent =
    getSideBLabel();

  spec.edge.textContent =
    form.edgeNeededSelect.value ===
    "yes"
      ? `${
          form.edgeSidesSelect.options[
            form.edgeSidesSelect
              .selectedIndex
          ].textContent
        }, ${
          form.edgeThicknessSelect
            .value || "—"
        } мм`
      : "Нет";

  spec.sanding.textContent =
    form.sandingNeededSelect.value ===
    "yes"
      ? getSelectedSanding()?.name ||
        "Да"
      : "Нет";

  spec.lacquer.textContent =
    getFinishLabel();

  spec.extras.textContent =
    getExtrasText();

  spec.total.textContent = "—";

  spec.vat.textContent =
    "В том числе НДС: —";

  spec.breakdown.innerHTML = "";

  spec.formula.textContent =
    "Стандартные размеры считаются по таблице стандартных цен; нестандартные — по формуле нестандартного расчёта.";

  spec.warnings.textContent =
    "Цена появится после выбора основы, толщины, шпона и хотя бы одного полного размера.";
}

function renderBreakdown(summary) {
  const rows = [
    [
      "Стандартная цена по таблице",
      summary.standardPanelCost
    ],
    [
      "Работы по основе / фанерованию",
      summary.panelWorkCost
    ],
    ["Шпон", summary.veneerCost],
    ["Раскрой", summary.cuttingCost],
    ["Кромка", summary.edgeCost],
    [
      "Шлифовка",
      summary.sandingCost
    ],
    ["Финиш", summary.finishCost],
    [
      "Работы с производственным коэффициентом",
      summary.workTotal
    ],
    [
      "Стоимость до скидки",
      summary.totalBeforeDiscount
    ],
    [
      "Скидка",
      -summary.discountAmount
    ]
  ];

  spec.breakdown.innerHTML = rows
    .filter((row) => row[1] !== 0)
    .map(
      (row) => `
        <div class="breakdown-row">
          <span>${row[0]}</span>
          <strong>
            ${row[1] < 0 ? "−" : ""}
            ${formatMoney(
              Math.abs(row[1])
            )}
          </strong>
        </div>
      `
    )
    .join("");
}

function renderSpecification() {
  renderStandardSizes();
  renderSizeRowsStatus();
  renderPartialSpec();

  if (!isReadyForCalculation()) {
    latestCalculations = [];
    latestSummary = null;

    form.addToSpecBtn.disabled = true;

    const base = getSelectedBase();
    const thickness =
      getSelectedThickness();

    const baseRate =
      getBaseRate(thickness);

    if (base?.manualPrice) {
      spec.warnings.textContent =
        `${base.name}: стандартные размеры заведены, но тарифы автоматического расчёта не найдены. Позицию нужно считать вручную или добавить тарифы в справочник.`;
    } else if (
      thickness &&
      baseRate === null
    ) {
      spec.warnings.textContent =
        `Для ${base.name}, ${thickness.label}, ${form.veneeredSidesSelect.value} сторона(ы) тариф не найден.`;
    }

    return;
  }

  const result = calculateAll();

  latestCalculations =
    result.items;

  latestSummary =
    result.summary;

  spec.total.textContent =
    formatMoney(result.summary.total);

  spec.vat.textContent =
    `В том числе НДС: ${formatMoney(
      result.summary.vat
    )}`;

  spec.formula.textContent =
    `Будет создано позиций: ${result.items.length}. Стандартные размеры считаются по таблице стандартных панелей. Нестандартные размеры считаются по формуле: шпон + ((работы по основе / фанерованию + раскрой + кромка + шлифовка + финиш) × производственный коэффициент). Скидка ${formatNumber(
      result.summary.discountPercent,
      1
    )}% применяется к итоговой стоимости рассчитанных позиций. Упаковка считается отдельно на следующем шаге.`;

  renderBreakdown(result.summary);

  const warnings = [];

  if (
    result.items.some(
      (item) =>
        item.sizeType === "custom"
    )
  ) {
    warnings.push(
      "Есть нестандартные размеры — раскрой добавлен автоматически для соответствующих строк."
    );
  }

  if (
    result.items.some(
      (item) =>
        item.standardPriceApplied
    )
  ) {
    warnings.push(
      "Есть стандартные размеры — для них применена таблица стандартных цен."
    );
  }

  if (
    result.items.some(
      (item) =>
        item.premiumVeneerApplied
    )
  ) {
    warnings.push(
      "Шпон дороже 1 000 ₽/м² — применён коэффициент ×2 к работе со шпоном."
    );
  }

  if (
    result.items.some(
      (item) =>
        item.finishType === "custom"
    )
  ) {
    warnings.push(
      "Есть финиш по ТЗ — тариф нужно уточнить вручную."
    );
  }

  result.items.forEach((item) => {
    warnings.push(
      ...item.extrasWarnings
    );
  });

  const hasBlockedSize =
    result.items.some(
      (item) =>
        item.sizeLimitBlocked
    );

  form.addToSpecBtn.disabled =
    hasBlockedSize;

  spec.warnings.textContent =
    warnings.length
      ? [...new Set(warnings)].join(
          " "
        )
      : "Цена предварительная. Окончательная стоимость подтверждается менеджером.";

  sessionStorage.setItem(
    "woodstockPanelsFacadesCalculation",
    JSON.stringify(result)
  );
}

function getItemsFromStorage() {
  try {
    const items = JSON.parse(
      sessionStorage.getItem(
        storageKeys.items
      ) || "[]"
    );

    return Array.isArray(items)
      ? items
      : [];
  } catch (error) {
    return [];
  }
}

function saveItemsToStorage(items) {
  sessionStorage.setItem(
    storageKeys.items,
    JSON.stringify(items)
  );
}

function handleAddToSpec() {
  if (!latestCalculations.length) {
    return;
  }

  if (
    latestCalculations.some(
      (item) =>
        item.sizeLimitBlocked
    )
  ) {
    window.alert(
      "Есть размеры, которые превышают технологические ограничения. Исправьте размеры или снимите операции, из-за которых применяется ограничение."
    );

    return;
  }

  const items =
    getItemsFromStorage();

  if (
    editMode &&
    editIndex !== null
  ) {
    items.splice(
      editIndex,
      1,
      ...latestCalculations
    );
  } else {
    items.push(
      ...latestCalculations
    );
  }

  saveItemsToStorage(items);
  clearEditState();

  window.location.href =
    "specification.html";
}

function renderConditionalFields() {
  const twoSides =
    form.veneeredSidesSelect.value ===
    "2";

  const reverseModeOption =
    form.sideBModeSelect.querySelector(
      'option[value="reverse"]'
    );

  form.sideBModeField.classList.toggle(
    "is-hidden",
    !twoSides
  );

  if (reverseModeOption) {
    reverseModeOption.disabled = twoSides;
    reverseModeOption.hidden = twoSides;
  }

  if (twoSides) {
    if (
      form.sideBModeSelect.value ===
      "reverse"
    ) {
      form.sideBModeSelect.value =
        "same";
    }
  } else {
    form.sideBModeSelect.value =
      "reverse";
    form.veneerBSelect.value = "";
    veneerBComboboxController?.syncFromNative();
  }

  form.reverseSideField.classList.toggle(
    "is-hidden",
    twoSides
  );

  form.veneerBField.classList.toggle(
    "is-hidden",
    !twoSides ||
      form.sideBModeSelect.value !==
        "other"
  );

  form.edgeFields.classList.toggle(
    "is-hidden",
    form.edgeNeededSelect.value !==
      "yes"
  );

  form.sandingField.classList.toggle(
    "is-hidden",
    form.sandingNeededSelect.value !==
      "yes"
  );

  const finishType =
    form.finishTypeSelect.value;

  const hasFinish =
    finishType &&
    finishType !== "none";

  form.finishFields.classList.toggle(
    "is-hidden",
    !hasFinish
  );

  form.lacquerFields.classList.toggle(
    "is-hidden",
    finishType !== "lacquer" &&
      finishType !== "toning"
  );

  form.isolatorField.classList.toggle(
    "is-hidden",
    ![
      "lacquer",
      "enamel",
      "toning"
    ].includes(finishType)
  );

  form.gloss100Field.classList.toggle(
    "is-hidden",
    finishType !== "gloss_100"
  );

  form.enamelField.classList.toggle(
    "is-hidden",
    finishType !== "enamel"
  );

  form.hingesCommentField.classList.toggle(
    "is-hidden",
    form.hingesSelect.value !==
      "yes"
  );

  form.handleCommentField.classList.toggle(
    "is-hidden",
    form.handleTypeSelect.value ===
      "none"
  );
}

function fillBaseSelect() {
  resetSelect(
    form.baseSelect,
    "Выберите основу"
  );

  fillSelect(
    form.baseSelect,
    calcData.bases,
    (item) => item.name
  );
}

function fillThicknessSelect() {
  const base = getSelectedBase();

  resetSelect(
    form.thicknessSelect,
    "Выберите толщину",
    !base || base.manualPrice
  );

  if (!base) {
    form.baseNote.textContent =
      "Система подгружает доступные толщины выбранной основы.";

    return;
  }

  form.baseNote.textContent =
    base.note ||
    "Толщины подгружены из справочника.";

  if (base.manualPrice) {
    resetSelect(
      form.thicknessSelect,
      "Тарифы не заведены",
      true
    );

    return;
  }

  base.thicknesses.forEach(
    (item) => {
      addOption(
        form.thicknessSelect,
        item.value,
        item.label
      );
    }
  );

  form.thicknessSelect.disabled =
    false;
}

function fillVeneerSelects() {
  resetSelect(
    form.veneerASelect,
    "Выберите шпон"
  );

  resetSelect(
    form.veneerBSelect,
    "Выберите шпон стороны Б"
  );

  calcData.veneers.forEach(
    (item) => {
      const label =
        `${item.name} — ${formatMoney(
          item.pricePerM2
        )} / м²`;

      addOption(
        form.veneerASelect,
        item.id,
        label
      );

      addOption(
        form.veneerBSelect,
        item.id,
        label
      );
    }
  );
}

function fillReverseSideSelect() {
  form.reverseSideSelect.innerHTML =
    "";

  calcData.reverseSides.forEach(
    (item) => {
      addOption(
        form.reverseSideSelect,
        item.id,
        `${item.name} — ${formatMoney(
          item.pricePerM2
        )} / м²`
      );
    }
  );
}

function fillEdgeThicknessSelect() {
  form.edgeThicknessSelect.innerHTML =
    "";

  calcData.edge.thicknesses.forEach(
    (item) => {
      addOption(
        form.edgeThicknessSelect,
        item.value,
        item.name
      );
    }
  );
}

function fillSandingSelect() {
  form.sandingSelect.innerHTML = "";

  calcData.sanding.forEach(
    (item) => {
      addOption(
        form.sandingSelect,
        item.id,
        `${item.name} — ${formatMoney(
          item.ratePerM2
        )} / м²`
      );
    }
  );
}

function fillFinishSelects() {
  form.lacquerTypeSelect.innerHTML =
    "";

  calcData.finish.lacquers.forEach(
    (item) => {
      addOption(
        form.lacquerTypeSelect,
        item.id,
        item.name
      );
    }
  );

  fillLacquerGlossSelect();
}

function fillLacquerGlossSelect() {
  const lacquer =
    getSelectedLacquerType();

  form.lacquerGlossSelect.innerHTML =
    "";

  if (!lacquer) {
    addOption(
      form.lacquerGlossSelect,
      "",
      "Сначала выберите лак"
    );

    return;
  }

  lacquer.gloss.forEach((item) => {
    addOption(
      form.lacquerGlossSelect,
      item.id,
      item.name
    );
  });
}

function setProductContent() {
  const labels =
    productLabels[productType] ||
    productLabels.panels;

  document.querySelector(
    "#pageTitle"
  ).textContent = labels.title;

  document.querySelector(
    "#pageLead"
  ).textContent = labels.lead;

  spec.title.textContent =
    labels.spec;

  form.panelExtrasBlock.classList.toggle(
    "is-hidden",
    productType !== "panels"
  );

  form.facadeExtrasBlock.classList.toggle(
    "is-hidden",
    productType !== "facades"
  );

  sessionStorage.setItem(
    "woodstockProductType",
    productType
  );
}

function getEditItem() {
  try {
    return JSON.parse(
      sessionStorage.getItem(
        storageKeys.editItem
      ) || "null"
    );
  } catch (error) {
    return null;
  }
}

function getEditIndex() {
  const savedIndex =
    sessionStorage.getItem(
      storageKeys.editIndex
    );

  if (
    savedIndex === null ||
    savedIndex === ""
  ) {
    return null;
  }

  const index = Number(savedIndex);

  return (
    Number.isInteger(index) &&
    index >= 0
      ? index
      : null
  );
}

function clearEditState() {
  sessionStorage.removeItem(
    storageKeys.editItem
  );

  sessionStorage.removeItem(
    storageKeys.editIndex
  );
}

function clearSizeRows() {
  form.sizeRows.innerHTML = "";
  activeSizeRow = null;
}

function applyEditMode() {
  const item = getEditItem();
  const index = getEditIndex();

  if (
    !item ||
    item.productType !==
      productType ||
    index === null
  ) {
    clearEditState();
    return;
  }

  editMode = true;
  editIndex = index;

  form.addToSpecBtn.textContent =
    "Сохранить изменения";

  form.baseSelect.value =
    item.baseId || "";

  fillThicknessSelect();

  form.thicknessSelect.value =
    item.thicknessValue || "";

  form.veneeredSidesSelect.value =
    item.veneeredSides || "1";

  form.veneerASelect.value =
    item.veneerAId || "";

  form.sideBModeSelect.value =
    item.sideBMode || "reverse";

  form.reverseSideSelect.value =
    item.reverseSideId || "none";

  form.veneerBSelect.value =
    item.veneerBId || "";

  form.fiberDirectionSelect.value =
    item.fiberDirection || "length";

  form.veneerLayoutSelect.value =
    item.veneerLayout || "not_set";

  form.textureTransitionSelect.value =
    item.textureTransition || "no";

  form.cuttingModeSelect.value =
    item.cuttingMode || "machine";

  form.edgeNeededSelect.value =
    item.edgeNeeded || "no";

  form.edgeSidesSelect.value =
    item.edgeSides || "perimeter";

  form.edgeThicknessSelect.value =
    item.edgeThicknessValue || "0.5";

  form.sandingNeededSelect.value =
    item.sandingNeeded || "no";

  form.sandingSelect.value =
    item.sandingId || "one";

  form.finishTypeSelect.value =
    item.finishType ||
    (item.lacquerNeeded === "yes"
      ? "lacquer"
      : "none");

  form.finishSidesSelect.value =
    item.finishSides ||
    item.lacquerSides ||
    "one";

  form.lacquerTypeSelect.value =
    item.lacquerTypeId || "acrylic";

  fillLacquerGlossSelect();

  form.lacquerGlossSelect.value =
    item.lacquerGlossId ||
    item.glossId ||
    form.lacquerGlossSelect.value;

  form.isolatorSelect.value =
    item.isolator || "no";

  form.gloss100Select.value =
    item.gloss100Mode || "one";

  form.enamelSelect.value =
    item.enamelMode ||
    "ground_enamel_one";

  form.finishCommentInput.value =
    item.finishComment || "";

  form.radiusPanelSelect.value =
    item.radiusPanel || "no";

  form.panelOperationsInput.value =
    item.panelOperations || "";

  form.hingesSelect.value =
    item.hinges || "no";

  form.hingesCommentInput.value =
    item.hingesComment || "";

  form.handleTypeSelect.value =
    item.handleType || "none";

  form.handleCommentInput.value =
    item.handleComment || "";

  form.facadeOperationsInput.value =
    item.facadeOperations || "";

  form.orderCommentInput.value =
    item.orderComment || "";

  form.discountInput.value =
    item.discountPercent ?? 0;

  existingUploadedFiles =
    Array.isArray(item.attachedFiles)
      ? item.attachedFiles
      : [];

  form.orderFilesInput.value = "";
  renderSelectedOrderFiles();

  clearSizeRows();

  addSizeRow({
    length: item.length,
    width: item.width,
    quantity: item.quantity
  });

  renderConditionalFields();
  renderSpecification();
}

function handleBaseChange() {
  fillThicknessSelect();
  renderSpecification();
}

function handleLacquerTypeChange() {
  fillLacquerGlossSelect();
  renderSpecification();
}

function initEvents() {
  selectNumberValueOnFocus(
  form.discountInput
  );

  form.baseSelect.addEventListener(
    "change",
    handleBaseChange
  );

  form.thicknessSelect.addEventListener(
    "change",
    renderSpecification
  );

  form.addSizeRowBtn.addEventListener(
    "click",
    () => addSizeRow()
  );

  form.standardSizeValues.addEventListener(
    "click",
    (event) => {
      const sizeButton =
        event.target.closest(
          "[data-standard-size]"
        );

      if (!sizeButton) {
        return;
      }

      applyStandardSize(
        Number(
          sizeButton.dataset.length
        ),
        Number(
          sizeButton.dataset.width
        )
      );
    }
  );

  form.standardSizeValues.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      const sizeButton =
        event.target.closest(
          "[data-standard-size]"
        );

      if (!sizeButton) {
        return;
      }

      event.preventDefault();

      applyStandardSize(
        Number(
          sizeButton.dataset.length
        ),
        Number(
          sizeButton.dataset.width
        )
      );
    }
  );

  form.sizeRows.addEventListener(
    "pointerdown",
    (event) => {
      const row =
        event.target.closest(
          "[data-size-row]"
        );

      if (row) {
        setActiveSizeRow(row);
      }
    }
  );

  form.sizeRows.addEventListener(
    "focusin",
    (event) => {
      const row =
        event.target.closest(
          "[data-size-row]"
        );

      if (row) {
        setActiveSizeRow(row);
      }
    }
  );

  form.sizeRows.addEventListener(
    "input",
    (event) => {
      if (
        event.target.matches(
          "[data-size-length]"
        ) ||
        event.target.matches(
          "[data-size-width]"
        ) ||
        event.target.matches(
          "[data-size-quantity]"
        )
      ) {
        renderSpecification();
      }
    }
  );

  form.sizeRows.addEventListener(
    "click",
    (event) => {
      const button =
        event.target.closest(
          "[data-remove-size-row]"
        );

      if (!button) {
        return;
      }

      removeSizeRow(
        button.closest(
          "[data-size-row]"
        )
      );
    }
  );

  [
    form.veneeredSidesSelect,
    form.veneerASelect,
    form.sideBModeSelect,
    form.reverseSideSelect,
    form.veneerBSelect,
    form.fiberDirectionSelect,
    form.veneerLayoutSelect,
    form.textureTransitionSelect,
    form.cuttingModeSelect,
    form.edgeNeededSelect,
    form.edgeSidesSelect,
    form.edgeThicknessSelect,
    form.sandingNeededSelect,
    form.sandingSelect,
    form.finishTypeSelect,
    form.finishSidesSelect,
    form.isolatorSelect,
    form.gloss100Select,
    form.enamelSelect,
    form.radiusPanelSelect,
    form.hingesSelect,
    form.handleTypeSelect
  ].forEach((element) => {
    element.addEventListener(
      "change",
      () => {
        renderConditionalFields();
        renderSpecification();
      }
    );
  });

  form.lacquerTypeSelect.addEventListener(
    "change",
    handleLacquerTypeChange
  );

  form.lacquerGlossSelect.addEventListener(
    "change",
    renderSpecification
  );

  [
    form.finishCommentInput,
    form.panelOperationsInput,
    form.hingesCommentInput,
    form.handleCommentInput,
    form.facadeOperationsInput,
    form.orderCommentInput,
    form.discountInput
  ].forEach((element) => {
    element.addEventListener(
      "input",
      renderSpecification
    );
  });

  form.orderFilesInput.addEventListener(
    "change",
    () => {
      existingUploadedFiles = [];
      renderSelectedOrderFiles();
      renderSpecification();
    }
  );

  form.addToSpecBtn.addEventListener(
    "click",
    handleAddToSpec
  );
}

async function init() {
  const response = await fetch(dataUrl);

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить данные калькулятора: ${response.status}`
    );
  }

  calcData = await response.json();

  setProductContent();
  fillBaseSelect();
  fillThicknessSelect();
  fillVeneerSelects();
  initVeneerComboboxes();
  fillReverseSideSelect();
  fillEdgeThicknessSelect();
  fillSandingSelect();
  fillFinishSelects();
  renderConditionalFields();
  updateRemoveButtonsState();
  setActiveSizeRow(getSizeRows()[0]);
  applyEditMode();
  renderSelectedOrderFiles();
  syncVeneerComboboxes();
  renderSpecification();
  initEvents();
}

init().catch((error) => {
  console.error(error);

  spec.emptySpec.textContent =
    "Не удалось загрузить данные калькулятора. Обновите страницу или обратитесь к разработчику.";
});