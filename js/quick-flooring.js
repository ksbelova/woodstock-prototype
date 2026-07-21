const dataUrl = "../data/flooring.json";

const FIXED_COATING_NAME =
  "Паркетный лак, блеск 10%";

const SPECIES_SEPARATOR = "::";

const elements = {
  speciesSelect:
    document.querySelector("#speciesSelect"),

  speciesCombobox:
    document.querySelector("#speciesCombobox"),

  speciesSearch:
    document.querySelector("#speciesSearch"),

  speciesDropdown:
    document.querySelector("#speciesDropdown"),

  topLayerSelect:
    document.querySelector("#topLayerSelect"),

  patternSelect:
    document.querySelector("#patternSelect"),

  roomAreaInput:
    document.querySelector("#roomAreaInput"),

  areaInfoText:
    document.querySelector("#areaInfoText"),

  nameInput:
    document.querySelector("#nameInput"),

  phoneInput:
    document.querySelector("#phoneInput"),

  managerContactInput:
    document.querySelector(
      "#managerContactInput"
    ),

  commentInput:
    document.querySelector("#commentInput"),

  filesInput:
    document.querySelector("#filesInput"),

  selectedFiles:
    document.querySelector("#selectedFiles"),

  privacyInput:
    document.querySelector("#privacyInput"),

  emptySpec:
    document.querySelector("#emptySpec"),

  specContent:
    document.querySelector("#specContent"),

  specMaterialType:
    document.querySelector(
      "#specMaterialType"
    ),

  specSpecies:
    document.querySelector("#specSpecies"),

  specTopLayer:
    document.querySelector("#specTopLayer"),

  specPrice:
    document.querySelector("#specPrice"),

  specPattern:
    document.querySelector("#specPattern"),

  specRoomArea:
    document.querySelector("#specRoomArea"),

  specWaste:
    document.querySelector("#specWaste"),

  specAreaWithWaste:
    document.querySelector(
      "#specAreaWithWaste"
    ),

  specPaidArea:
    document.querySelector("#specPaidArea"),

  specTotal:
    document.querySelector("#specTotal"),

  specVat:
    document.querySelector("#specVat"),

  minAreaNote:
    document.querySelector("#minAreaNote"),

  downloadSpecBtn:
    document.querySelector(
      "#downloadSpecBtn"
    ),

  anotherProductBtn:
    document.querySelector(
      "#anotherProductBtn"
    )
};

let flooringData = null;
let latestCalculation = null;
let speciesComboboxController = null;

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
  const factor = 10 ** digits;

  return (
    Math.round(
      (Number(value) + Number.EPSILON) *
        factor
    ) / factor
  );
}

function normalizeSearchValue(value) {
  return String(value || "")
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .trim();
}

function resetSelect(
  select,
  placeholder,
  disabled = false
) {
  select.innerHTML = "";

  const option =
    document.createElement("option");

  option.value = "";
  option.textContent = placeholder;

  select.append(option);
  select.disabled = disabled;
}

function appendOption(
  select,
  value,
  label
) {
  const option =
    document.createElement("option");

  option.value = value;
  option.textContent = label;

  select.append(option);
}

function createSpeciesKey(
  materialType,
  species
) {
  return [
    String(materialType || ""),
    String(species || "")
  ].join(SPECIES_SEPARATOR);
}

function parseSpeciesKey(value) {
  const [
    materialType = "",
    ...speciesParts
  ] = String(value || "").split(
    SPECIES_SEPARATOR
  );

  return {
    materialType,
    species:
      speciesParts.join(
        SPECIES_SEPARATOR
      )
  };
}

function getMaterialTypeLabel(item) {
  if (item?.materialTypeName) {
    return item.materialTypeName;
  }

  const labels = {
    veneer: "Натуральный шпон",
    natural_veneer: "Натуральный шпон",
    multiveneer: "Мультишпон",
    multi_veneer: "Мультишпон",
    design_veneer: "Дизайн-шпон",
    design: "Дизайн-шпон",
    solid: "Массив",
    wood: "Массив"
  };

  return (
    labels[item?.materialType] ||
    item?.materialType ||
    "Материал"
  );
}

function getSpeciesOptions() {
  if (!flooringData?.items) {
    return [];
  }

  const uniqueItems = new Map();

  flooringData.items.forEach((item) => {
    const key = createSpeciesKey(
      item.materialType,
      item.species
    );

    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, {
        id: key,
        name: item.species,
        meta: getMaterialTypeLabel(item),
        materialType:
          item.materialType,
        materialTypeName:
          getMaterialTypeLabel(item),
        species: item.species
      });
    }
  });

  return Array.from(
    uniqueItems.values()
  ).sort((first, second) => {
    const speciesComparison =
      String(first.name).localeCompare(
        String(second.name),
        "ru"
      );

    if (speciesComparison !== 0) {
      return speciesComparison;
    }

    return String(first.meta).localeCompare(
      String(second.meta),
      "ru"
    );
  });
}

function createSearchableSelect({
  root,
  nativeSelect,
  input,
  items,
  placeholder,
  maxVisibleItems = 40
}) {
  if (
    !root ||
    !nativeSelect ||
    !input
  ) {
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
        (item) =>
          item.id === nativeSelect.value
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

    const visibleItems =
      filteredItems.slice(
        0,
        maxVisibleItems
      );

    if (!visibleItems.length) {
      const empty =
        document.createElement("div");

      empty.className =
        "searchable-select__empty";

      empty.textContent =
        "Ничего не найдено";

      dropdown.append(empty);

      highlightedIndex = -1;

      return;
    }

    visibleItems.forEach(
      (item, index) => {
        const option =
          document.createElement("button");

        option.type = "button";

        option.className =
          "searchable-select__option";

        option.dataset.value = item.id;

        option.setAttribute(
          "role",
          "option"
        );

        option.setAttribute(
          "aria-selected",
          String(
            item.id === nativeSelect.value
          )
        );

        if (
          index === highlightedIndex
        ) {
          option.classList.add(
            "is-highlighted"
          );
        }

        const name =
          document.createElement("span");

        name.className =
          "searchable-select__option-name";

        name.textContent = item.name;

        const meta =
          document.createElement("span");

        meta.className =
          "searchable-select__option-meta";

        meta.textContent =
          item.meta || "";

        option.append(name, meta);

        option.addEventListener(
          "mousedown",
          (event) => {
            event.preventDefault();
            selectItem(item);
          }
        );

        dropdown.append(option);
      }
    );

    if (
      filteredItems.length >
      maxVisibleItems
    ) {
      const note =
        document.createElement("div");

      note.className =
        "searchable-select__more";

      note.textContent =
        `Показаны первые ${maxVisibleItems} из ${filteredItems.length}. Уточните название.`;

      dropdown.append(note);
    }
  }

  function filterItems(query) {
    const normalizedQuery =
      normalizeSearchValue(query);

    filteredItems = normalizedQuery
      ? items.filter((item) => {
          const searchText = [
            item.name,
            item.meta
          ].join(" ");

          return normalizeSearchValue(
            searchText
          ).includes(normalizedQuery);
        })
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
    const selectedItem =
      getSelectedItem();

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

        const selectedItem =
          filteredItems[
            highlightedIndex
          ];

        if (selectedItem) {
          selectItem(selectedItem);
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

        const exactMatches =
          items.filter(
            (item) =>
              normalizeSearchValue(
                item.name
              ) ===
              normalizeSearchValue(
                input.value
              )
          );

        if (exactMatches.length === 1) {
          selectItem(exactMatches[0]);
          return;
        }

        if (
          !nativeSelect.value &&
          input.value.trim()
        ) {
          input.setCustomValidity(
            "Выберите породу или шпон из списка"
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

function populateSpecies() {
  resetSelect(
    elements.speciesSelect,
    "Выберите породу / шпон"
  );

  const speciesOptions =
    getSpeciesOptions();

  speciesOptions.forEach((item) => {
    appendOption(
      elements.speciesSelect,
      item.id,
      `${item.name} — ${item.meta}`
    );
  });

  speciesComboboxController =
    createSearchableSelect({
      root: elements.speciesCombobox,
      nativeSelect:
        elements.speciesSelect,
      input: elements.speciesSearch,
      items: speciesOptions,
      placeholder:
        "Выберите породу / шпон"
    });
}

function getSelectedSpeciesData() {
  const value =
    elements.speciesSelect.value;

  if (!value) {
    return null;
  }

  const parsed =
    parseSpeciesKey(value);

  return {
    key: value,
    materialType:
      parsed.materialType,
    species:
      parsed.species
  };
}

function getItemsBySelectedSpecies() {
  const selected =
    getSelectedSpeciesData();

  if (!selected) {
    return [];
  }

  return flooringData.items.filter(
    (item) =>
      String(item.materialType) ===
        String(selected.materialType) &&
      String(item.species) ===
        String(selected.species)
  );
}

function getSelectedItem() {
  const selectedItems =
    getItemsBySelectedSpecies();

  return (
    selectedItems.find(
      (item) =>
        String(item.topLayer) ===
        String(
          elements.topLayerSelect.value
        )
    ) || null
  );
}

function populateTopLayers() {
  resetSelect(
    elements.topLayerSelect,
    "Выберите толщину верхнего слоя",
    true
  );

  const items =
    getItemsBySelectedSpecies();

  if (!items.length) {
    resetSelect(
      elements.topLayerSelect,
      "Сначала выберите породу / шпон",
      true
    );

    return;
  }

  const sortedItems = [...items].sort(
    (first, second) =>
      Number.parseFloat(first.topLayer) -
      Number.parseFloat(second.topLayer)
  );

  sortedItems.forEach((item) => {
    appendOption(
      elements.topLayerSelect,
      item.topLayer,
      `${item.topLayer} — ${formatMoney(
        item.pricePerM2
      )} / м²`
    );
  });

  elements.topLayerSelect.disabled = false;

  if (sortedItems.length === 1) {
    elements.topLayerSelect.value =
      sortedItems[0].topLayer;
  }
}

function populatePatterns() {
  resetSelect(
    elements.patternSelect,
    "Выберите тип раскладки"
  );

  flooringData.patterns.forEach(
    (pattern) => {
      appendOption(
        elements.patternSelect,
        pattern.id,
        `${pattern.name} — ${formatNumber(
          pattern.wastePercent,
          0
        )}% запаса`
      );
    }
  );
}

function getSelectedPattern() {
  return (
    flooringData.patterns.find(
      (pattern) =>
        pattern.id ===
        elements.patternSelect.value
    ) || null
  );
}

function getFiles() {
  return Array.from(
    elements.filesInput?.files || []
  );
}

function renderSelectedFiles() {
  const files = getFiles();

  elements.selectedFiles.innerHTML = "";

  if (!files.length) {
    elements.selectedFiles.textContent =
      "Файлы не выбраны";

    return;
  }

  files.forEach((file) => {
    const item =
      document.createElement("span");

    item.textContent = file.name;

    elements.selectedFiles.append(item);
  });
}

function isCalculationReady() {
  return Boolean(
    getSelectedItem() &&
    getSelectedPattern() &&
    Number(elements.roomAreaInput.value) > 0
  );
}

function calculate() {
  if (!isCalculationReady()) {
    latestCalculation = null;
    return null;
  }

  const selectedItem =
    getSelectedItem();

  const selectedPattern =
    getSelectedPattern();

  const roomArea =
    Number(elements.roomAreaInput.value);

  const wastePercent =
    Number(
      selectedPattern.wastePercent
    ) || 0;

  const areaWithWaste = roundTo(
    roomArea *
      (1 + wastePercent / 100),
    2
  );

  const minArea =
    Number(
      flooringData.meta?.minArea
    ) || 20;

  const paidArea = roundTo(
    Math.max(
      areaWithWaste,
      minArea
    ),
    2
  );

  const total = Math.round(
    paidArea *
      Number(selectedItem.pricePerM2)
  );

  const vatRate =
    Number(
      flooringData.meta?.vatRate
    ) || 0;

  const vat =
    flooringData.meta?.vatIncluded
      ? Math.round(
          total *
            vatRate /
            (1 + vatRate)
        )
      : Math.round(
          total * vatRate
        );

  latestCalculation = {
    productType: "flooring",
    productName:
      "Инженерная доска",

    materialType:
      selectedItem.materialTypeName ||
      getMaterialTypeLabel(
        selectedItem
      ),

    materialTypeId:
      selectedItem.materialType,

    species:
      selectedItem.species,

    topLayer:
      selectedItem.topLayer,

    itemId:
      selectedItem.id,

    pricePerM2:
      Number(selectedItem.pricePerM2),

    patternId:
      selectedPattern.id,

    patternName:
      selectedPattern.name,

    wastePercent,
    roomArea,
    areaWithWaste,
    paidArea,

    minArea,

    minAreaApplied:
      areaWithWaste < minArea,

    coating:
      FIXED_COATING_NAME,

    total,
    vat,

    name:
      elements.nameInput.value.trim(),

    phone:
      elements.phoneInput.value.trim(),

    managerContact:
      elements.managerContactInput.checked,

    comment:
      elements.commentInput.value.trim(),

    privacyAccepted:
      elements.privacyInput.checked,

    attachedFiles:
      getFiles().map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified:
          file.lastModified
      }))
  };

  return latestCalculation;
}

function renderAreaInfo(
  result = null
) {
  const pattern =
    getSelectedPattern();

  const roomArea =
    Number(
      elements.roomAreaInput.value
    );

  if (
    !pattern ||
    roomArea <= 0
  ) {
    elements.areaInfoText.textContent =
      "После выбора раскладки и ввода площади здесь появится площадь с запасом.";

    return;
  }

  const calculation =
    result || calculate();

  if (!calculation) {
    const wastePercent =
      Number(pattern.wastePercent) || 0;

    const areaWithWaste = roundTo(
      roomArea *
        (1 + wastePercent / 100),
      2
    );

    elements.areaInfoText.textContent =
      `Запас для раскладки «${pattern.name}» — ` +
      `${formatNumber(
        wastePercent,
        0
      )}%. ` +
      `Площадь с запасом — ` +
      `${formatNumber(
        areaWithWaste
      )} м².`;

    return;
  }

  elements.areaInfoText.textContent =
    `Запас для раскладки «${calculation.patternName}» — ` +
    `${formatNumber(
      calculation.wastePercent,
      0
    )}%. ` +
    `Площадь с запасом — ` +
    `${formatNumber(
      calculation.areaWithWaste
    )} м².`;
}

function showEmptySpecification() {
  elements.emptySpec.classList.remove(
    "is-hidden"
  );

  elements.specContent.classList.add(
    "is-hidden"
  );
}

function showSpecification() {
  elements.emptySpec.classList.add(
    "is-hidden"
  );

  elements.specContent.classList.remove(
    "is-hidden"
  );
}

function renderSpecification() {
  const result = calculate();

  renderAreaInfo(result);

  if (!result) {
    showEmptySpecification();
    return;
  }

  showSpecification();

  elements.specMaterialType.textContent =
    result.materialType || "—";

  elements.specSpecies.textContent =
    result.species || "—";

  elements.specTopLayer.textContent =
    result.topLayer || "—";

  elements.specPrice.textContent =
    `${formatMoney(
      result.pricePerM2
    )} / м²`;

  elements.specPattern.textContent =
    result.patternName;

  elements.specRoomArea.textContent =
    `${formatNumber(
      result.roomArea
    )} м²`;

  elements.specWaste.textContent =
    `${formatNumber(
      result.wastePercent,
      0
    )}%`;

  elements.specAreaWithWaste.textContent =
    `${formatNumber(
      result.areaWithWaste
    )} м²`;

  elements.specPaidArea.textContent =
    result.minAreaApplied
      ? `${formatNumber(
          result.paidArea
        )} м², применён минимум`
      : `${formatNumber(
          result.paidArea
        )} м²`;

  elements.specTotal.textContent =
    formatMoney(result.total);

  elements.specVat.textContent =
    `В том числе НДС: ${formatMoney(
      result.vat
    )}`;

  elements.minAreaNote.textContent =
    result.minAreaApplied
      ? `Площадь с запасом меньше ${formatNumber(
          result.minArea,
          0
        )} м², поэтому применена минимальная партия ${formatNumber(
          result.minArea,
          0
        )} м².`
      : `Минимальная партия ${formatNumber(
          result.minArea,
          0
        )} м² не применяется.`;
}

function createPdfDocument() {
  const result =
    latestCalculation;

  const files =
    getFiles();

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
        margin: [0, 4, 0, 5]
      },

      subtitle: {
        fontSize: 10,
        color: "#666666",
        margin: [0, 0, 0, 20]
      },

      sectionTitle: {
        fontSize: 12,
        bold: true,
        margin: [0, 18, 0, 8]
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
        margin: [0, 14, 0, 0]
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

        margin: [42, 10, 42, 0],

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
          "Краткий расчёт инженерной доски",
        style: "subtitle"
      },

      {
        text:
          "Параметры изделия",
        style: "sectionTitle"
      },

      {
        table: {
          widths: [155, "*"],

          body: [
            [
              "Изделие",
              "Инженерная доска"
            ],

            [
              "Тип материала",
              result.materialType
            ],

            [
              "Порода / шпон",
              result.species
            ],

            [
              "Верхний слой",
              result.topLayer
            ],

            [
              "Цена за м²",
              `${formatMoney(
                result.pricePerM2
              )} / м²`
            ],

            [
              "Тип раскладки",
              result.patternName
            ],

            [
              "Площадь помещения",
              `${formatNumber(
                result.roomArea
              )} м²`
            ],

            [
              "Технологический запас",
              `${formatNumber(
                result.wastePercent,
                0
              )}%`
            ],

            [
              "Площадь с запасом",
              `${formatNumber(
                result.areaWithWaste
              )} м²`
            ],

            [
              "Площадь к оплате",
              `${formatNumber(
                result.paidArea
              )} м²`
            ],

            [
              "Покрытие",
              result.coating
            ]
          ]
        },

        layout: {
          fillColor(rowIndex) {
            return rowIndex % 2 === 0
              ? "#F5F5F3"
              : null;
          },

          hLineColor:
            "#DDDDDA",

          vLineColor:
            "#DDDDDA",

          paddingLeft:
            () => 8,

          paddingRight:
            () => 8,

          paddingTop:
            () => 7,

          paddingBottom:
            () => 7
        }
      },

      {
        columns: [
          {
            width: "*",

            stack: [
              {
                text:
                  `Расчётная площадь: ${formatNumber(
                    result.areaWithWaste
                  )} м²`
              },

              {
                text:
                  `Площадь к оплате: ${formatNumber(
                    result.paidArea
                  )} м²`,

                margin: [0, 4, 0, 0]
              }
            ],

            margin: [0, 20, 0, 0]
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
                    result.total
                  ),

                style: "totalValue",
                alignment: "right",

                margin: [0, 4, 0, 0]
              },

              {
                text:
                  `В том числе НДС: ${formatMoney(
                    result.vat
                  )}`,

                alignment: "right",
                fontSize: 8,
                color: "#666666",

                margin: [0, 4, 0, 0]
              }
            ],

            margin: [0, 20, 0, 0]
          }
        ]
      },

      {
        text:
          "Данные клиента",

        style: "sectionTitle"
      },

      {
        table: {
          widths: [155, "*"],

          body: [
            [
              "Имя",
              result.name ||
                "Не указано"
            ],

            [
              "Телефон",
              result.phone ||
                "Не указан"
            ],

            [
              "Связаться с менеджером",
              result.managerContact
                ? "Да"
                : "Нет"
            ],

            [
              "Комментарий",
              result.comment ||
                "Нет"
            ],

            [
              "Приложенные файлы",
              files.length
                ? files
                    .map(
                      (file) =>
                        file.name
                    )
                    .join(", ")
                : "Нет"
            ],

            [
              "Согласие на обработку данных",
              result.privacyAccepted
                ? "Подтверждено"
                : "Не подтверждено"
            ]
          ]
        },

        layout: {
          fillColor(rowIndex) {
            return rowIndex % 2 === 0
              ? "#F5F5F3"
              : null;
          },

          hLineColor:
            "#DDDDDA",

          vLineColor:
            "#DDDDDA",

          paddingLeft:
            () => 8,

          paddingRight:
            () => 8,

          paddingTop:
            () => 7,

          paddingBottom:
            () => 7
        }
      },

      {
        text:
          "Стоимость является предварительной. Окончательные параметры, наличие материала и стоимость подтверждаются менеджером Woodstock.",

        style: "note"
      }
    ]
  };
}

function downloadSpecification() {
  const result = calculate();

  if (!result) {
    window.alert(
      "Выберите породу или шпон, толщину верхнего слоя, раскладку и укажите площадь."
    );

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

  window.pdfMake
    .createPdf(
      createPdfDocument()
    )
    .download(
      "woodstock-flooring-specification.pdf"
    );

  elements.anotherProductBtn.classList.remove(
    "is-hidden"
  );
}

function handleSpeciesChange() {
  populateTopLayers();
  renderSpecification();
}

function bindEvents() {
  elements.speciesSelect.addEventListener(
    "change",
    handleSpeciesChange
  );

  elements.topLayerSelect.addEventListener(
    "change",
    renderSpecification
  );

  elements.patternSelect.addEventListener(
    "change",
    renderSpecification
  );

  elements.roomAreaInput.addEventListener(
    "input",
    renderSpecification
  );

  elements.roomAreaInput.addEventListener(
    "change",
    renderSpecification
  );

  elements.filesInput.addEventListener(
    "change",
    () => {
      renderSelectedFiles();
      renderSpecification();
    }
  );

  [
    elements.nameInput,
    elements.phoneInput,
    elements.commentInput
  ].forEach((element) => {
    element.addEventListener(
      "input",
      renderSpecification
    );
  });

  [
    elements.managerContactInput,
    elements.privacyInput
  ].forEach((element) => {
    element.addEventListener(
      "change",
      renderSpecification
    );
  });

  elements.downloadSpecBtn.addEventListener(
    "click",
    downloadSpecification
  );
}

async function init() {
  sessionStorage.setItem(
    "woodstockCalcMode",
    "quick"
  );

  sessionStorage.setItem(
    "woodstockProductType",
    "flooring"
  );

  try {
    const response =
      await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить данные: ${response.status}`
      );
    }

    flooringData =
      await response.json();

    if (
      !Array.isArray(
        flooringData.items
      )
    ) {
      throw new Error(
        "В flooring.json отсутствует массив items."
      );
    }

    if (
      !Array.isArray(
        flooringData.patterns
      )
    ) {
      throw new Error(
        "В flooring.json отсутствует массив patterns."
      );
    }

    populateSpecies();
    populatePatterns();
    bindEvents();
    renderSelectedFiles();
    renderSpecification();
  } catch (error) {
    console.error(error);

    elements.emptySpec.textContent =
      "Не удалось загрузить данные инженерной доски. Проверьте файл flooring.json и запуск проекта через локальный сервер.";
  }
}

init();