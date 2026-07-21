const dataUrl = "../data/panels-facades.json";

const FALLBACK_HARDWARE_PRICE = 1000;

const params = new URLSearchParams(
  window.location.search
);

const productType =
  params.get("type") === "facades"
    ? "facades"
    : "panels";

const elements = {
  pageTitle: document.querySelector("#pageTitle"),
  pageLead: document.querySelector("#pageLead"),

  baseInputs: document.querySelectorAll(
    'input[name="base"]'
  ),

  thicknessSelect: document.querySelector(
    "#thicknessSelect"
  ),

  baseNote: document.querySelector("#baseNote"),

  standardSizeValues: document.querySelector(
    "#standardSizeValues"
  ),

  standardSizeNote: document.querySelector(
    "#standardSizeNote"
  ),

  sizeRows: document.querySelector("#sizeRows"),

  addSizeRowBtn: document.querySelector(
    "#addSizeRowBtn"
  ),

  veneerSelect: document.querySelector(
    "#veneerSelect"
  ),

  veneerCombobox: document.querySelector(
    "#veneerCombobox"
  ),

  veneerSearch: document.querySelector(
    "#veneerSearch"
  ),

  fiberDirectionSelect: document.querySelector(
    "#fiberDirectionSelect"
  ),

  veneerLayoutSelect: document.querySelector(
    "#veneerLayoutSelect"
  ),

  textureTransitionSelect: document.querySelector(
    "#textureTransitionSelect"
  ),

  facadeOptionsBlock: document.querySelector(
    "#facadeOptionsBlock"
  ),

  hardwarePreparationInput: document.querySelector(
    "#hardwarePreparationInput"
  ),

  nameInput: document.querySelector("#nameInput"),

  phoneInput: document.querySelector("#phoneInput"),

  managerContactInput: document.querySelector(
    "#managerContactInput"
  ),

  commentInput: document.querySelector(
    "#commentInput"
  ),

  filesInput: document.querySelector(
    "#filesInput"
  ),

  selectedFiles: document.querySelector(
    "#selectedFiles"
  ),

  privacyInput: document.querySelector(
    "#privacyInput"
  ),

  specTitle: document.querySelector("#specTitle"),

  emptySpec: document.querySelector("#emptySpec"),

  specContent: document.querySelector(
    "#specContent"
  ),

  specProduct: document.querySelector(
    "#specProduct"
  ),

  specBase: document.querySelector("#specBase"),

  specSizes: document.querySelector("#specSizes"),

  specQuantity: document.querySelector(
    "#specQuantity"
  ),

  specArea: document.querySelector("#specArea"),

  specVeneer: document.querySelector(
    "#specVeneer"
  ),

  specDirection: document.querySelector(
    "#specDirection"
  ),

  specLayout: document.querySelector(
    "#specLayout"
  ),

  specTransition: document.querySelector(
    "#specTransition"
  ),

  specHardwareRow: document.querySelector(
    "#specHardwareRow"
  ),

  specHardware: document.querySelector(
    "#specHardware"
  ),

  specBreakdown: document.querySelector(
    "#specBreakdown"
  ),

  specTotal: document.querySelector("#specTotal"),

  specVat: document.querySelector("#specVat"),

  downloadSpecBtn: document.querySelector(
    "#downloadSpecBtn"
  ),

  anotherProductBtn: document.querySelector(
    "#anotherProductBtn"
  )
};

let calcData = null;
let lastCalculation = null;
let activeSizeRow = null;
let veneerComboboxController = null;

function roundTo(value, digits = 2) {
  const factor = 10 ** digits;

  return (
    Math.round(
      (Number(value) + Number.EPSILON) *
        factor
    ) / factor
  );
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
    maximumFractionDigits: digits
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createOption(value, label) {
  const option = document.createElement("option");

  option.value = value;
  option.textContent = label;

  return option;
}

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

    root.classList.toggle(
      "is-open",
      expanded
    );

    dropdown.classList.toggle(
      "is-hidden",
      !expanded
    );

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
        option.classList.add(
          "is-highlighted"
        );
      }

      const name = document.createElement("span");

      name.className =
        "searchable-select__option-name";

      name.textContent = item.name;

      const price = document.createElement("span");

      price.className =
        "searchable-select__option-meta";

      price.textContent =
        `${formatMoney(item.pricePerM2)} / м²`;

      option.append(name, price);

      option.addEventListener(
        "mousedown",
        (event) => {
          event.preventDefault();
          selectItem(item);
        }
      );

      dropdown.appendChild(option);
    });

    if (
      filteredItems.length >
      maxVisibleItems
    ) {
      const note = document.createElement("div");

      note.className =
        "searchable-select__more";

      note.textContent =
        `Показаны первые ${maxVisibleItems} из ${filteredItems.length}. Уточните название.`;

      dropdown.appendChild(note);
    }
  }

  function filterItems(query) {
    const normalizedQuery =
      normalizeSearchValue(query);

    filteredItems = normalizedQuery
      ? items.filter((item) =>
          normalizeSearchValue(
            item.name
          ).includes(normalizedQuery)
        )
      : [...items];

    highlightedIndex =
      filteredItems.length ? 0 : -1;

    renderOptions();
  }

  function openDropdown() {
    filterItems(input.value);
    setExpanded(true);
  }

  function closeDropdown({
    restore = false
  } = {}) {
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
      new Event("change", {
        bubbles: true
      })
    );
  }

  function clearSelection() {
    if (!nativeSelect.value) {
      return;
    }

    nativeSelect.value = "";

    nativeSelect.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
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
      (
        highlightedIndex +
        step +
        visibleCount
      ) % visibleCount;

    renderOptions();

    dropdown
      .querySelector(".is-highlighted")
      ?.scrollIntoView({
        block: "nearest"
      });
  }

  input.addEventListener(
    "focus",
    openDropdown
  );

  input.addEventListener(
    "click",
    openDropdown
  );

  input.addEventListener(
    "input",
    () => {
      clearSelection();
      filterItems(input.value);
      setExpanded(true);
    }
  );

  input.addEventListener(
    "keydown",
    (event) => {
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

      if (
        event.key === "Enter" &&
        isOpen
      ) {
        event.preventDefault();

        const item =
          filteredItems[highlightedIndex];

        if (item) {
          selectItem(item);
        }

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();

        closeDropdown({
          restore: true
        });

        input.blur();
      }
    }
  );

  input.addEventListener(
    "blur",
    () => {
      window.setTimeout(() => {
        if (
          root.contains(
            document.activeElement
          )
        ) {
          return;
        }

        const exactMatch = items.find(
          (item) =>
            normalizeSearchValue(
              item.name
            ) ===
            normalizeSearchValue(
              input.value
            )
        );

        if (exactMatch) {
          selectItem(exactMatch);
          return;
        }

        if (
          !nativeSelect.value &&
          input.value.trim()
        ) {
          input.setCustomValidity(
            "Выберите шпон из списка"
          );
        }

        closeDropdown({
          restore: true
        });
      }, 0);
    }
  );

  toggle.addEventListener(
    "click",
    () => {
      if (isOpen) {
        closeDropdown({
          restore: true
        });

        return;
      }

      input.focus();
      openDropdown();
    }
  );

  nativeSelect.addEventListener(
    "change",
    syncFromNative
  );

  document.addEventListener(
    "mousedown",
    (event) => {
      if (!root.contains(event.target)) {
        closeDropdown({
          restore: true
        });
      }
    }
  );

  syncFromNative();

  return {
    syncFromNative,
    openDropdown,
    closeDropdown
  };
}

function getProductName() {
  return productType === "facades"
    ? "Мебельные фасады"
    : "Интерьерные панели";
}

function setProductMode() {
  const productName = getProductName();

  elements.pageTitle.textContent =
    productName;

  elements.specTitle.textContent =
    productName;

  elements.pageLead.textContent =
    productType === "facades"
      ? "Предварительный расчёт фасадов по основе, размерам, шпону, кромке, финишу и подготовке под фурнитуру."
      : "Предварительный расчёт панелей по основе, размерам, шпону, кромке и финишу.";

  elements.facadeOptionsBlock.classList.toggle(
    "is-hidden",
    productType !== "facades"
  );

  elements.specHardwareRow.classList.toggle(
    "is-hidden",
    productType !== "facades"
  );

  sessionStorage.setItem(
    "woodstockCalcMode",
    "quick"
  );

  sessionStorage.setItem(
    "woodstockProductType",
    productType
  );
}

function getSelectedBaseId() {
  return (
    document.querySelector(
      'input[name="base"]:checked'
    )?.value || "mdf"
  );
}

function getSelectedBase() {
  const baseId = getSelectedBaseId();

  return (
    calcData?.bases.find(
      (base) => base.id === baseId
    ) || null
  );
}

function getSelectedThickness() {
  const base = getSelectedBase();

  if (!base) {
    return null;
  }

  return (
    base.thicknesses.find(
      (item) =>
        String(item.value) ===
        String(
          elements.thicknessSelect.value
        )
    ) || null
  );
}

function getSelectedVeneer() {
  return (
    calcData?.veneers.find(
      (item) =>
        item.id ===
        elements.veneerSelect.value
    ) || null
  );
}

function populateThicknesses() {
  const base = getSelectedBase();

  elements.thicknessSelect.innerHTML = "";

  if (
    !base ||
    !Array.isArray(base.thicknesses) ||
    !base.thicknesses.length
  ) {
    elements.thicknessSelect.append(
      createOption(
        "",
        "Толщины не найдены"
      )
    );

    return;
  }

  base.thicknesses.forEach((item) => {
    elements.thicknessSelect.append(
      createOption(
        item.value,
        item.label
      )
    );
  });

  if (base.id === "mdf") {
    const preferred =
      base.thicknesses.find(
        (item) =>
          String(item.value) === "18"
      );

    elements.thicknessSelect.value =
      preferred?.value ??
      base.thicknesses[0].value;
  } else {
    elements.thicknessSelect.value =
      base.thicknesses[0].value;
  }

  elements.baseNote.textContent =
    base.note ||
    "Доступные значения зависят от выбранной основы.";

  renderStandardSizes();
  calculate();
}

function populateVeneers() {
  elements.veneerSelect.innerHTML = "";

  elements.veneerSelect.append(
    createOption(
      "",
      "Выберите шпон"
    )
  );

  calcData.veneers.forEach((veneer) => {
    elements.veneerSelect.append(
      createOption(
        veneer.id,
        `${veneer.name} — ${formatMoney(
          veneer.pricePerM2
        )} / м²`
      )
    );
  });

  veneerComboboxController =
    createSearchableSelect({
      root: elements.veneerCombobox,
      nativeSelect:
        elements.veneerSelect,
      input: elements.veneerSearch,
      items: calcData.veneers,
      placeholder: "Выберите шпон"
    });
}

function getStandardSizes() {
  return (
    calcData.standardSizesByBase?.[
      getSelectedBaseId()
    ] || []
  );
}

function normalizeSizePair(length, width) {
  return [
    Number(length),
    Number(width)
  ].sort((a, b) => a - b);
}

function getMatchedStandardSize(
  length,
  width
) {
  if (!length || !width) {
    return null;
  }

  const current = normalizeSizePair(
    length,
    width
  );

  return (
    getStandardSizes().find((item) => {
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
  return Boolean(
    getMatchedStandardSize(
      length,
      width
    )
  );
}

function renderStandardSizes() {
  const base = getSelectedBase();
  const sizes = getStandardSizes();

  if (!base) {
    elements.standardSizeValues.innerHTML =
      "<span>Выберите основу</span>";

    elements.standardSizeNote.textContent =
      "Сначала выберите основу. Стандартные размеры зависят от материала.";

    return;
  }

  if (!sizes.length) {
    elements.standardSizeValues.innerHTML =
      "<span>Для выбранной основы стандартные размеры не заведены</span>";

    elements.standardSizeNote.textContent =
      `${base.name}: стандартные размеры не найдены в справочнике прототипа.`;

    return;
  }

  elements.standardSizeValues.innerHTML =
    sizes
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

  elements.standardSizeNote.textContent =
    `${base.name}: нажмите на стандартный формат, чтобы автоматически подставить длину и ширину. ` +
    "Для стандартного размера система берёт цену из таблицы стандартных панелей. " +
    "Если размер отличается, добавляется раскрой по периметру.";
}

function createSizeRow(values = {}) {
  const row = document.createElement("div");

  row.className = "size-row";
  row.dataset.sizeRow = "";

  row.innerHTML = `
    <div class="field-grid field-grid--size-row">
      <label class="field">
        <span class="field__label">
          Длина, мм
        </span>

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
        <span class="field__label">
          Ширина, мм
        </span>

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
        <span class="field__label">
          Количество, шт.
        </span>

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
    elements.sizeRows.querySelectorAll(
      "[data-size-row]"
    )
  );
}

function setActiveSizeRow(row) {
  if (
    !row ||
    !elements.sizeRows.contains(row)
  ) {
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
    elements.sizeRows.contains(
      activeSizeRow
    )
  ) {
    return activeSizeRow;
  }

  const firstRow =
    getSizeRows()[0] || null;

  if (firstRow) {
    setActiveSizeRow(firstRow);
  }

  return firstRow;
}

function applyStandardSize(
  length,
  width
) {
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

  const lengthInput =
    targetRow.querySelector(
      "[data-size-length]"
    );

  const widthInput =
    targetRow.querySelector(
      "[data-size-width]"
    );

  const quantityInput =
    targetRow.querySelector(
      "[data-size-quantity]"
    );

  lengthInput.value = length;
  widthInput.value = width;

  calculate();

  quantityInput.focus();
}

function updateRemoveButtonsState() {
  const rows = getSizeRows();

  rows.forEach((row) => {
    const button = row.querySelector(
      "[data-remove-size-row]"
    );

    button.disabled =
      rows.length === 1;
  });
}

function addSizeRow(values = {}) {
  const row = createSizeRow(values);

  elements.sizeRows.appendChild(row);

  setActiveSizeRow(row);
  updateRemoveButtonsState();
  calculate();

  row
    .querySelector(
      "[data-size-length]"
    )
    .focus();
}

function removeSizeRow(row) {
  const rows = getSizeRows();

  if (rows.length === 1) {
    return;
  }

  const rowIndex = rows.indexOf(row);
  const wasActive =
    row === activeSizeRow;

  const nextActiveRow =
    rows[rowIndex + 1] ||
    rows[rowIndex - 1] ||
    null;

  row.remove();

  if (
    wasActive &&
    nextActiveRow
  ) {
    setActiveSizeRow(nextActiveRow);
  }

  updateRemoveButtonsState();
  calculate();
}

function getSizeValues() {
  return getSizeRows()
    .map((row) => {
      const length = Number(
        row.querySelector(
          "[data-size-length]"
        ).value
      );

      const width = Number(
        row.querySelector(
          "[data-size-width]"
        ).value
      );

      const quantity = Number(
        row.querySelector(
          "[data-size-quantity]"
        ).value
      );

      return {
        row,
        length,
        width,
        quantity,
        isComplete:
          length > 0 &&
          width > 0 &&
          quantity > 0
      };
    })
    .filter((item) => item.isComplete);
}

function getArea(
  length,
  width,
  quantity
) {
  return roundTo(
    (
      Number(length) *
      Number(width) *
      Number(quantity)
    ) / 1_000_000,
    3
  );
}

function getCuttingMeters(
  length,
  width,
  quantity
) {
  return roundTo(
    (
      (
        Number(length) +
        Number(width)
      ) *
      2 *
      Number(quantity)
    ) / 1000,
    2
  );
}

function renderSizeRowsStatus() {
  getSizeRows().forEach((row) => {
    const length = Number(
      row.querySelector(
        "[data-size-length]"
      ).value
    );

    const width = Number(
      row.querySelector(
        "[data-size-width]"
      ).value
    );

    const quantity = Number(
      row.querySelector(
        "[data-size-quantity]"
      ).value
    );

    const status = row.querySelector(
      "[data-size-status]"
    );

    status.classList.remove(
      "field-status--ok",
      "field-status--warning"
    );

    if (
      !length &&
      !width &&
      !quantity
    ) {
      status.classList.add("is-hidden");
      status.textContent = "";

      return;
    }

    if (
      !length ||
      !width ||
      !quantity
    ) {
      status.classList.remove("is-hidden");

      status.classList.add(
        "field-status--warning"
      );

      status.textContent =
        "Заполните длину, ширину и количество для расчёта этой строки.";

      return;
    }

    const standard =
      getMatchedStandardSize(
        length,
        width
      );

    status.classList.remove("is-hidden");

    if (standard) {
      status.classList.add(
        "field-status--ok"
      );

      status.textContent =
        `Стандартный размер: ${standard.name}. Цена берётся из таблицы стандартных панелей.`;

      return;
    }

    status.classList.add(
      "field-status--warning"
    );

    status.textContent =
      `Нестандартный размер. Раскрой добавлен автоматически: ${formatNumber(
        getCuttingMeters(
          length,
          width,
          quantity
        ),
        2
      )} пог. м.`;
  });

  updateRemoveButtonsState();
}

function getSizeKey(length, width) {
  const standard =
    getMatchedStandardSize(
      length,
      width
    );

  if (standard) {
    return (
      `${standard.length}x` +
      `${standard.width}`
    );
  }

  return (
    `${Number(length)}x` +
    `${Number(width)}`
  );
}

function getStandardUnitPrice(
  baseId,
  thicknessValue,
  length,
  width
) {
  const prices =
    calcData.standardPanelPrices?.[
      baseId
    ];

  if (!prices) {
    return null;
  }

  const thicknessRow = prices.find(
    (item) =>
      String(item.thickness) ===
      String(thicknessValue)
  );

  if (!thicknessRow) {
    return null;
  }

  const price =
    thicknessRow.one?.[
      getSizeKey(length, width)
    ];

  return Number.isFinite(
    Number(price)
  )
    ? Number(price)
    : null;
}

function getLookupRate(
  items,
  thickness,
  rateKey
) {
  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return 0;
  }

  const numericThickness =
    Number(thickness) || 0;

  const sorted = [...items].sort(
    (a, b) =>
      a.maxThickness -
      b.maxThickness
  );

  const selected =
    sorted.find(
      (item) =>
        numericThickness <=
        item.maxThickness
    ) ||
    sorted[sorted.length - 1];

  return (
    Number(selected?.[rateKey]) ||
    0
  );
}

function getCuttingRate(thickness) {
  const mode =
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

function getEdgeRate(
  baseThickness,
  edgeMeters
) {
  const threshold =
    Number(
      calcData.meta
        .edgeThresholdMeters
    ) || 35;

  const rateKey =
    edgeMeters > threshold
      ? "rateAfterThreshold"
      : "rateBeforeThreshold";

  return getLookupRate(
    calcData.edge.rates.thin,
    baseThickness,
    rateKey
  );
}

function getFinishRate() {
  const acrylic =
    calcData.finish.lacquers.find(
      (item) =>
        item.id === "acrylic"
    );

  return (
    Number(
      acrylic?.rates?.one
    ) || 0
  );
}

function calculateSizeItem(sizeItem) {
  const base = getSelectedBase();
  const thickness =
    getSelectedThickness();
  const veneer =
    getSelectedVeneer();

  const area = getArea(
    sizeItem.length,
    sizeItem.width,
    sizeItem.quantity
  );

  const isStandard =
    isStandardSize(
      sizeItem.length,
      sizeItem.width
    );

  const standardUnitPrice =
    isStandard
      ? getStandardUnitPrice(
          base.id,
          thickness.value,
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
    elements
      .textureTransitionSelect
      .value === "yes"
      ? Number(
          calcData.meta
            .textureTransitionCoefficient
        )
      : Number(
          calcData.meta
            .baseCoefficient
        );

  const premiumVeneer =
    Number(veneer.pricePerM2) >
    Number(
      calcData.meta
        .premiumVeneerThreshold
    );

  const veneerWorkMultiplier =
    premiumVeneer
      ? Number(
          calcData.meta
            .premiumVeneerWorkMultiplier
        )
      : 1;

  const panelWorkRate =
    Number(
      thickness.oneSideRate
    ) *
    coefficient *
    veneerWorkMultiplier;

  const panelWorkCost =
    Math.round(
      area * panelWorkRate
    );

  let cuttingMeters = 0;
  let cuttingRate = 0;
  let cuttingCost = 0;

  if (!isStandard) {
    cuttingMeters =
      getCuttingMeters(
        sizeItem.length,
        sizeItem.width,
        sizeItem.quantity
      );

    cuttingRate =
      getCuttingRate(
        thickness.numericThickness
      );

    cuttingCost =
      Math.round(
        cuttingMeters *
        cuttingRate
      );
  }

  const edgeMeters = roundTo(
    (
      (
        sizeItem.length +
        sizeItem.width
      ) *
      2 *
      sizeItem.quantity
    ) /
      1000 *
      Number(
        calcData.meta
          .edgeWasteCoefficient
      ),
    2
  );

  const edgeRate = getEdgeRate(
    thickness.numericThickness,
    edgeMeters
  );

  const edgeCost =
    Math.round(
      edgeMeters *
      edgeRate
    );

  const finishRate =
    getFinishRate();

  const finishCost =
    Math.round(
      area *
      finishRate
    );

  const productionMultiplier =
    Number(
      calcData.meta
        .productionMultiplier
    );

  let productionCost;

  if (standardUnitPrice !== null) {
    productionCost =
      standardPanelCost +
      Math.round(
        (
          edgeCost +
          finishCost
        ) *
          productionMultiplier
      );
  } else {
    productionCost =
      Math.round(
        (
          panelWorkCost +
          cuttingCost +
          edgeCost +
          finishCost
        ) *
          productionMultiplier
      );
  }

  const veneerCost =
    Math.round(
      Number(
        veneer.pricePerM2
      ) *
        area *
        Number(
          calcData.meta
            .veneerReserveMultiplier
        )
    );

  const hardwareCost =
    productType === "facades" &&
    elements
      .hardwarePreparationInput
      .checked
      ? FALLBACK_HARDWARE_PRICE
      : 0;

  const total =
    productionCost +
    veneerCost +
    hardwareCost;

  return {
    ...sizeItem,

    area,
    isStandard,
    standardUnitPrice,

    standardPanelCost,

    panelWorkCost,

    cuttingMeters,
    cuttingRate,
    cuttingCost,

    edgeMeters,
    edgeRate,
    edgeCost,

    finishRate,
    finishCost,

    veneerCost,
    hardwareCost,

    productionCost,
    total
  };
}

function getDirectionLabel(value) {
  const labels = {
    length: "По длине",
    width: "По ширине"
  };

  return labels[value] || "—";
}

function getLayoutLabel(value) {
  const labels = {
    book: "Книжка",
    straight: "Прямая",
    straight_shifted:
      "Прямая с перекладкой",
    mixed: "Смешанная / микс"
  };

  return labels[value] || "—";
}

function calculate() {
  if (!calcData) {
    return;
  }

  renderSizeRowsStatus();

  const base = getSelectedBase();
  const thickness =
    getSelectedThickness();
  const veneer =
    getSelectedVeneer();
  const sizeItems =
    getSizeValues();

  if (
    !base ||
    !thickness ||
    !veneer ||
    !sizeItems.length
  ) {
    lastCalculation = null;

    elements.emptySpec.classList.remove(
      "is-hidden"
    );

    elements.specContent.classList.add(
      "is-hidden"
    );

    return;
  }

  const calculatedItems =
    sizeItems.map(
      calculateSizeItem
    );

  const summary =
    calculatedItems.reduce(
      (result, item) => {
        result.quantity +=
          item.quantity;

        result.area +=
          item.area;

        result.productionCost +=
          item.productionCost;

        result.veneerCost +=
          item.veneerCost;

        result.standardPanelCost +=
          item.standardPanelCost;

        result.panelWorkCost +=
          item.panelWorkCost;

        result.cuttingCost +=
          item.cuttingCost;

        result.edgeCost +=
          item.edgeCost;

        result.finishCost +=
          item.finishCost;

        result.hardwareCost +=
          item.hardwareCost;

        result.total +=
          item.total;

        return result;
      },
      {
        quantity: 0,
        area: 0,

        productionCost: 0,
        veneerCost: 0,

        standardPanelCost: 0,
        panelWorkCost: 0,
        cuttingCost: 0,
        edgeCost: 0,
        finishCost: 0,
        hardwareCost: 0,

        total: 0
      }
    );

  summary.area = roundTo(
    summary.area,
    3
  );

  const vatRate =
    Number(
      calcData.meta.vatRate
    ) || 0;

  summary.vat =
    calcData.meta.vatIncluded
      ? Math.round(
          summary.total *
            vatRate /
            (1 + vatRate)
        )
      : Math.round(
          summary.total *
          vatRate
        );

  lastCalculation = {
    productType,
    productName:
      getProductName(),

    base,
    thickness,
    veneer,

    direction:
      elements
        .fiberDirectionSelect
        .value,

    layout:
      elements
        .veneerLayoutSelect
        .value,

    transition:
      elements
        .textureTransitionSelect
        .value,

    hardwarePreparation:
      productType === "facades" &&
      elements
        .hardwarePreparationInput
        .checked,

    items: calculatedItems,
    summary
  };

  renderSpecification();
}

function renderBreakdown(calculation) {
  const rows = [];

  if (
    calculation.summary
      .standardPanelCost > 0
  ) {
    rows.push([
      "Стандартная цена по таблице",
      calculation.summary
        .standardPanelCost
    ]);
  }

  if (
    calculation.summary
      .panelWorkCost > 0
  ) {
    rows.push([
      "Работы по основе и фанерованию",
      calculation.summary
        .panelWorkCost
    ]);
  }

  rows.push([
    "Шпон с технологическим запасом",
    calculation.summary
      .veneerCost
  ]);

  if (
    calculation.summary
      .cuttingCost > 0
  ) {
    rows.push([
      "Раскрой",
      calculation.summary
        .cuttingCost
    ]);
  }

  rows.push([
    "Кромка",
    calculation.summary
      .edgeCost
  ]);

  rows.push([
    "Финиш",
    calculation.summary
      .finishCost
  ]);

  if (
    calculation.summary
      .hardwareCost > 0
  ) {
    rows.push([
      "Фрезеровка и присадка",
      calculation.summary
        .hardwareCost
    ]);
  }

  elements.specBreakdown.innerHTML = "";

  rows
    .filter(
      ([, value]) =>
        Number(value) !== 0
    )
    .forEach(([label, value]) => {
      const row =
        document.createElement("div");

      row.className =
        "breakdown-row";

      row.innerHTML = `
        <span>${escapeHtml(label)}</span>

        <strong>
          ${formatMoney(value)}
        </strong>
      `;

      elements.specBreakdown.append(row);
    });
}

function renderSpecification() {
  const calculation =
    lastCalculation;

  if (!calculation) {
    return;
  }

  elements.emptySpec.classList.add(
    "is-hidden"
  );

  elements.specContent.classList.remove(
    "is-hidden"
  );

  elements.specProduct.textContent =
    calculation.productName;

  elements.specBase.textContent =
    `${calculation.base.name}, ${calculation.thickness.label}`;

  elements.specSizes.innerHTML =
    calculation.items
      .map((item) => {
        const type =
          item.isStandard
            ? "стандартный"
            : "нестандартный";

        return (
          `${formatNumber(
            item.length,
            0
          )} × ` +
          `${formatNumber(
            item.width,
            0
          )} мм — ` +
          `${formatNumber(
            item.quantity,
            0
          )} шт. ` +
          `(${type})`
        );
      })
      .join("<br>");

  elements.specQuantity.textContent =
    `${formatNumber(
      calculation.summary.quantity,
      0
    )} шт.`;

  elements.specArea.textContent =
    `${formatNumber(
      calculation.summary.area,
      3
    )} м²`;

  elements.specVeneer.textContent =
    calculation.veneer.name;

  elements.specDirection.textContent =
    getDirectionLabel(
      calculation.direction
    );

  elements.specLayout.textContent =
    getLayoutLabel(
      calculation.layout
    );

  elements.specTransition.textContent =
    calculation.transition === "yes"
      ? "Да"
      : "Нет";

  if (productType === "facades") {
    elements.specHardware.textContent =
      calculation
        .hardwarePreparation
        ? "Фрезеровка и присадка включены"
        : "Не требуется";
  }

  renderBreakdown(calculation);

  elements.specTotal.textContent =
    formatMoney(
      calculation.summary.total
    );

  elements.specVat.textContent =
    `В том числе НДС: ${formatMoney(
      calculation.summary.vat
    )}`;
}

function renderSelectedFiles() {
  const files = Array.from(
    elements.filesInput.files
  );

  elements.selectedFiles.innerHTML = "";

  files.forEach((file) => {
    const item =
      document.createElement("span");

    item.textContent = file.name;

    elements.selectedFiles.append(item);
  });
}

function getPdfFileNames() {
  return Array.from(
    elements.filesInput.files
  ).map((file) => file.name);
}

function createPdfPositionRows() {
  if (!lastCalculation) {
    return [];
  }

  return lastCalculation.items.map(
    (item, index) => [
      String(index + 1),

      `${formatNumber(
        item.length,
        0
      )} × ${formatNumber(
        item.width,
        0
      )}`,

      formatNumber(
        item.quantity,
        0
      ),

      formatNumber(
        item.area,
        3
      ),

      item.isStandard
        ? "Стандартный"
        : "Нестандартный",

      formatMoney(item.total)
    ]
  );
}

function createPdfDocument() {
  const calculation =
    lastCalculation;

  const files =
    getPdfFileNames();

  const parameterRows = [
    [
      "Изделие",
      calculation.productName
    ],

    [
      "Основа",
      `${calculation.base.name}, ${calculation.thickness.label}`
    ],

    [
      "Шпон",
      calculation.veneer.name
    ],

    [
      "Направление волокон",
      getDirectionLabel(
        calculation.direction
      )
    ],

    [
      "Расклад шпона",
      getLayoutLabel(
        calculation.layout
      )
    ],

    [
      "Переход текстуры",
      calculation.transition === "yes"
        ? "Да"
        : "Нет"
    ],

    [
      "Кромка",
      "По всему периметру, 1 мм"
    ],

    [
      "Финиш",
      "Акриловый лак, блеск 10%, одна сторона"
    ]
  ];

  if (productType === "facades") {
    parameterRows.push([
      "Подготовка под фурнитуру",

      calculation
        .hardwarePreparation
        ? "Фрезеровка и присадка включены"
        : "Не требуется"
    ]);
  }

  return {
    pageSize: "A4",

    pageMargins: [
      42,
      42,
      42,
      50
    ],

    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: "#202020"
    },

    styles: {
      brand: {
        fontSize: 8,
        color: "#666666",
        characterSpacing: 2
      },

      title: {
        fontSize: 20,
        bold: true,
        margin: [
          0,
          4,
          0,
          5
        ]
      },

      subtitle: {
        fontSize: 10,
        color: "#666666",
        margin: [
          0,
          0,
          0,
          20
        ]
      },

      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [
          0,
          18,
          0,
          8
        ]
      },

      totalLabel: {
        fontSize: 10,
        color: "#666666"
      },

      totalValue: {
        fontSize: 17,
        bold: true
      },

      note: {
        fontSize: 8,
        color: "#666666",
        margin: [
          0,
          14,
          0,
          0
        ]
      }
    },

    footer(currentPage, pageCount) {
      return {
        columns: [
          {
            text:
              "Предварительная спецификация Woodstock",
            alignment: "left"
          },

          {
            text:
              `${currentPage} / ${pageCount}`,
            alignment: "right"
          }
        ],

        margin: [
          42,
          10,
          42,
          0
        ],

        fontSize: 8,
        color: "#777777"
      };
    },

    content: [
      {
        text: "WOODSTOCK",
        style: "brand"
      },

      {
        text:
          "Предварительная спецификация",
        style: "title"
      },

      {
        text:
          "Краткий расчёт стоимости изделия",
        style: "subtitle"
      },

      {
        text:
          "Параметры изделия",
        style: "sectionTitle"
      },

      {
        table: {
          widths: [
            145,
            "*"
          ],

          body: parameterRows
        },

        layout: {
          fillColor(rowIndex) {
            return rowIndex % 2 === 0
              ? "#F5F5F3"
              : null;
          },

          hLineColor: "#DDDDDA",
          vLineColor: "#DDDDDA",

          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 7,
          paddingBottom: () => 7
        }
      },

      {
        text: "Позиции",
        style: "sectionTitle"
      },

      {
        table: {
          headerRows: 1,

          widths: [
            22,
            88,
            42,
            50,
            "*",
            70
          ],

          body: [
            [
              {
                text: "№",
                bold: true
              },

              {
                text: "Размер, мм",
                bold: true
              },

              {
                text: "Кол-во",
                bold: true
              },

              {
                text: "Площадь, м²",
                bold: true
              },

              {
                text: "Тип размера",
                bold: true
              },

              {
                text: "Стоимость",
                bold: true
              }
            ],

            ...createPdfPositionRows()
          ]
        },

        layout: {
          fillColor(rowIndex) {
            if (rowIndex === 0) {
              return "#E9E9E6";
            }

            return rowIndex % 2 === 0
              ? "#F7F7F5"
              : null;
          },

          hLineColor: "#D8D8D5",
          vLineColor: "#D8D8D5",

          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 6,
          paddingBottom: () => 6
        }
      },

      {
        columns: [
          {
            width: "*",

            stack: [
              {
                text:
                  `Общее количество: ${formatNumber(
                    calculation.summary.quantity,
                    0
                  )} шт.`
              },

              {
                text:
                  `Общая площадь: ${formatNumber(
                    calculation.summary.area,
                    3
                  )} м²`,

                margin: [
                  0,
                  4,
                  0,
                  0
                ]
              }
            ],

            margin: [
              0,
              20,
              0,
              0
            ]
          },

          {
            width: 190,

            stack: [
              {
                text:
                  "Предварительная стоимость",
                style: "totalLabel",
                alignment: "right"
              },

              {
                text:
                  formatMoney(
                    calculation.summary.total
                  ),

                style: "totalValue",
                alignment: "right",

                margin: [
                  0,
                  4,
                  0,
                  0
                ]
              },

              {
                text:
                  `В том числе НДС: ${formatMoney(
                    calculation.summary.vat
                  )}`,

                alignment: "right",
                fontSize: 8,
                color: "#666666",

                margin: [
                  0,
                  4,
                  0,
                  0
                ]
              }
            ],

            margin: [
              0,
              20,
              0,
              0
            ]
          }
        ]
      },

      {
        text: "Данные клиента",
        style: "sectionTitle"
      },

      {
        table: {
          widths: [
            145,
            "*"
          ],

          body: [
            [
              "Имя",
              elements.nameInput.value.trim() ||
                "Не указано"
            ],

            [
              "Телефон",
              elements.phoneInput.value.trim() ||
                "Не указан"
            ],

            [
              "Связаться с менеджером",
              elements.managerContactInput.checked
                ? "Да"
                : "Нет"
            ],

            [
              "Согласие на обработку данных",
              elements.privacyInput.checked
                ? "Подтверждено"
                : "Не подтверждено"
            ],

            [
              "Комментарий",
              elements.commentInput.value.trim() ||
                "Нет"
            ],

            [
              "Приложенные файлы",
              files.length
                ? files.join(", ")
                : "Нет"
            ]
          ]
        },

        layout: {
          fillColor(rowIndex) {
            return rowIndex % 2 === 0
              ? "#F5F5F3"
              : null;
          },

          hLineColor: "#DDDDDA",
          vLineColor: "#DDDDDA",

          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 7,
          paddingBottom: () => 7
        }
      },

      {
        text:
          "Стоимость является предварительной. Окончательные параметры, наличие выбранного шпона и стоимость подтверждаются менеджером Woodstock.",
        style: "note"
      }
    ]
  };
}

function downloadSpecification() {
  if (!lastCalculation) {
    return;
  }

  if (
    typeof window.pdfMake ===
    "undefined"
  ) {
    window.alert(
      "Не удалось загрузить библиотеку PDF. Проверьте подключение к интернету и обновите страницу."
    );

    return;
  }

  const fileName =
    productType === "facades"
      ? "woodstock-facades-specification.pdf"
      : "woodstock-panels-specification.pdf";

  window.pdfMake
    .createPdf(
      createPdfDocument()
    )
    .download(fileName);

  elements.anotherProductBtn.classList.remove(
    "is-hidden"
  );
}

function bindEvents() {
  elements.baseInputs.forEach(
    (input) => {
      input.addEventListener(
        "change",
        populateThicknesses
      );
    }
  );

  [
    elements.thicknessSelect,
    elements.veneerSelect,
    elements.fiberDirectionSelect,
    elements.veneerLayoutSelect,
    elements.textureTransitionSelect,
    elements.hardwarePreparationInput
  ].forEach((element) => {
    element.addEventListener(
      "change",
      calculate
    );
  });

  elements.standardSizeValues.addEventListener(
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

  elements.standardSizeValues.addEventListener(
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

  elements.sizeRows.addEventListener(
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

  elements.sizeRows.addEventListener(
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

  elements.sizeRows.addEventListener(
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
        calculate();
      }
    }
  );

  elements.sizeRows.addEventListener(
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

  elements.addSizeRowBtn.addEventListener(
    "click",
    () => {
      addSizeRow();
    }
  );

  elements.filesInput.addEventListener(
    "change",
    renderSelectedFiles
  );

  elements.downloadSpecBtn.addEventListener(
    "click",
    downloadSpecification
  );
}

async function init() {
  setProductMode();

  try {
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить данные: ${response.status}`
      );
    }

    calcData = await response.json();

    populateVeneers();
    populateThicknesses();

    setActiveSizeRow(
      getSizeRows()[0]
    );

    updateRemoveButtonsState();
    bindEvents();
    calculate();
  } catch (error) {
    console.error(error);

    elements.emptySpec.textContent =
      "Не удалось загрузить данные расчёта. Проверьте файл panels-facades.json и запуск проекта через локальный сервер.";
  }
}

init();