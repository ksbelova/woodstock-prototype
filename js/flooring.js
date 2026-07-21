const dataUrl = "../data/flooring.json";

const storageKeys = {
  items: "woodstockSpecificationItems",
  editItem: "woodstockEditItem",
  editIndex: "woodstockEditIndex"
};

const formElements = {
  materialTypeSelect: document.querySelector("#materialTypeSelect"),
  speciesSelect: document.querySelector("#speciesSelect"),
  topLayerSelect: document.querySelector("#topLayerSelect"),
  patternSelect: document.querySelector("#patternSelect"),
  roomAreaInput: document.querySelector("#roomAreaInput"),
  wasteInput: document.querySelector("#wasteInput"),
  lengthInput: document.querySelector("#lengthInput"),
  widthInput: document.querySelector("#widthInput"),
  thicknessInput: document.querySelector("#thicknessInput"),
  coatingSelect: document.querySelector("#coatingSelect"),
  commentInput: document.querySelector("#commentInput"),
  filesInput: document.querySelector("#filesInput"),
  selectedFiles: document.querySelector("#selectedFiles"),
  discountInput: document.querySelector("#discountInput"),
  widthWarning: document.querySelector("#widthWarning"),
  addToSpecBtn: document.querySelector("#addToSpecBtn")
};

const specElements = {
  emptySpec: document.querySelector("#emptySpec"),
  specContent: document.querySelector("#specContent"),
  materialType: document.querySelector("#specMaterialType"),
  species: document.querySelector("#specSpecies"),
  topLayer: document.querySelector("#specTopLayer"),
  price: document.querySelector("#specPrice"),
  pattern: document.querySelector("#specPattern"),
  roomArea: document.querySelector("#specRoomArea"),
  waste: document.querySelector("#specWaste"),
  areaWithWaste: document.querySelector("#specAreaWithWaste"),
  paidArea: document.querySelector("#specPaidArea"),
  boardParams: document.querySelector("#specBoardParams"),
  coating: document.querySelector("#specCoating"),
  formula: document.querySelector("#specFormula"),
  breakdown: document.querySelector("#specBreakdown"),
  total: document.querySelector("#specTotal"),
  vat: document.querySelector("#specVat"),
  minAreaNote: document.querySelector("#minAreaNote")
};

let flooringData = null;
let latestCalculation = null;
let editMode = false;
let editIndex = null;
let existingUploadedFiles = [];

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function roundTo(value, digits = 2) {
  const factor = Math.pow(10, digits);

  return (
    Math.round(
      (value + Number.EPSILON) * factor
    ) / factor
  );
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
    Number(formElements.discountInput?.value) || 0;

  return Math.min(
    Math.max(value, 0),
    100
  );
}

function getUploadedFiles() {
  const selectedFiles = Array.from(
    formElements.filesInput?.files || []
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

function renderSelectedFiles() {
  if (!formElements.selectedFiles) {
    return;
  }

  const files = getUploadedFiles();
  formElements.selectedFiles.innerHTML = "";

  if (!files.length) {
    formElements.selectedFiles.textContent = "Файлы не выбраны";
    return;
  }

  files.forEach((file) => {
    const item = document.createElement("span");
    item.textContent = file.name;
    formElements.selectedFiles.append(item);
  });
}

function resetSelect(
  selectElement,
  placeholder,
  disabled = false
) {
  selectElement.innerHTML = "";

  const option =
    document.createElement("option");

  option.value = "";
  option.textContent = placeholder;

  selectElement.appendChild(option);
  selectElement.disabled = disabled;
}

function appendOption(
  selectElement,
  value,
  label
) {
  const option =
    document.createElement("option");

  option.value = value;
  option.textContent = label;

  selectElement.appendChild(option);
}

function getUniqueBy(items, key) {
  const map = new Map();

  items.forEach((item) => {
    if (!map.has(item[key])) {
      map.set(item[key], item);
    }
  });

  return Array.from(map.values());
}

function getItemsByMaterialType() {
  return flooringData.items.filter(
    (item) =>
      item.materialType ===
      formElements.materialTypeSelect.value
  );
}

function getItemsBySpecies() {
  return getItemsByMaterialType().filter(
    (item) =>
      item.species ===
      formElements.speciesSelect.value
  );
}

function getSelectedItem() {
  return getItemsBySpecies().find(
    (item) =>
      item.topLayer ===
      formElements.topLayerSelect.value
  );
}

function getSelectedPattern() {
  return flooringData.patterns.find(
    (pattern) =>
      pattern.id ===
      formElements.patternSelect.value
  );
}

function getSelectedCoating() {
  return flooringData.coatings.find(
    (coating) =>
      coating.id ===
      formElements.coatingSelect.value
  );
}

function isReadyForPriceCalculation() {
  return Boolean(
    getSelectedItem() &&
      formElements.patternSelect.value &&
      formElements.roomAreaInput.value &&
      formElements.wasteInput.value
  );
}

function getBoardParams() {
  const meta = flooringData.meta;

  return {
    length:
      Number(
        formElements.lengthInput.value
      ) || null,

    width:
      Number(
        formElements.widthInput.value
      ) || null,

    thickness: meta.thickness
  };
}

function calculateFlooring() {
  const meta = flooringData.meta;
  const selectedItem = getSelectedItem();
  const selectedPattern =
    getSelectedPattern();
  const selectedCoating =
    getSelectedCoating();
  const board = getBoardParams();

  const roomArea =
    Number(
      formElements.roomAreaInput.value
    ) || 0;

  const wastePercent =
    Number(
      formElements.wasteInput.value
    ) || 0;

  const areaWithWaste = roundTo(
    roomArea *
      (1 + wastePercent / 100),
    2
  );

  const paidArea = roundTo(
    Math.max(
      areaWithWaste,
      meta.minArea
    ),
    2
  );

  const totalBeforeDiscount =
    Math.round(
      paidArea *
        selectedItem.pricePerM2
    );

  const discountPercent =
    getDiscountPercent();

  const discountAmount =
    Math.round(
      totalBeforeDiscount *
        discountPercent /
        100
    );

  const total = Math.max(
    totalBeforeDiscount -
      discountAmount,
    0
  );

  const vat = meta.vatIncluded
    ? Math.round(
        total *
          meta.vatRate /
          (1 + meta.vatRate)
      )
    : Math.round(
        total * meta.vatRate
      );

  return {
    productType: "flooring",
    productName: "Инженерная доска",

    materialType:
      selectedItem.materialTypeName,

    materialTypeId:
      selectedItem.materialType,

    species: selectedItem.species,
    topLayer: selectedItem.topLayer,
    itemId: selectedItem.id,

    pricePerM2:
      selectedItem.pricePerM2,

    selectedItem,
    selectedPattern,

    selectedPatternId:
      selectedPattern?.id || null,

    selectedCoating,

    selectedCoatingId:
      selectedCoating?.id || null,

    roomArea,
    wastePercent,
    areaWithWaste,
    paidArea,

    length: board.length,
    width: board.width,
    thickness: board.thickness,

    totalBeforeDiscount,
    discountPercent,
    discountAmount,
    total,
    vat,

    minAreaApplied:
      areaWithWaste < meta.minArea,

    comment:
      formElements.commentInput.value.trim(),

    attachedFiles:
      getUploadedFiles()
  };
}

function validateBoardParams() {
  const meta = flooringData.meta;

  const length =
    Number(
      formElements.lengthInput.value
    ) || 0;

  const width =
    Number(
      formElements.widthInput.value
    ) || 0;

  if (length > meta.maxLength) {
    formElements.lengthInput.value =
      meta.maxLength;
  }

  if (width > meta.maxWidth) {
    formElements.widthInput.value =
      meta.maxWidth;
  }

  if (width > meta.widthWarning) {
    formElements.widthWarning.classList.remove(
      "is-hidden"
    );
  } else {
    formElements.widthWarning.classList.add(
      "is-hidden"
    );
  }
}

function fillMaterialTypeSelect() {
  resetSelect(
    formElements.materialTypeSelect,
    "Выберите тип материала"
  );

  const materialTypes = getUniqueBy(
    flooringData.items,
    "materialType"
  );

  materialTypes.forEach((item) => {
    appendOption(
      formElements.materialTypeSelect,
      item.materialType,
      item.materialTypeName
    );
  });
}

function fillSpeciesSelect() {
  resetSelect(
    formElements.speciesSelect,
    "Выберите породу / шпон"
  );

  const species = getUniqueBy(
    getItemsByMaterialType(),
    "species"
  );

  species.forEach((item) => {
    appendOption(
      formElements.speciesSelect,
      item.species,
      item.species
    );
  });

  formElements.speciesSelect.disabled =
    false;
}

function fillTopLayerSelect() {
  resetSelect(
    formElements.topLayerSelect,
    "Выберите верхний слой"
  );

  const items = getItemsBySpecies();

  items.forEach((item) => {
    appendOption(
      formElements.topLayerSelect,
      item.topLayer,
      `${item.topLayer} — ${formatMoney(
        item.pricePerM2
      )} / м²`
    );
  });

  formElements.topLayerSelect.disabled =
    false;
}

function fillPatternSelect() {
  resetSelect(
    formElements.patternSelect,
    "Выберите тип раскладки"
  );

  flooringData.patterns.forEach(
    (pattern) => {
      appendOption(
        formElements.patternSelect,
        pattern.id,
        `${pattern.name} — ${pattern.wastePercent}%`
      );
    }
  );
}

function fillCoatingSelect() {
  resetSelect(
    formElements.coatingSelect,
    "Выберите покрытие"
  );

  flooringData.coatings.forEach(
    (coating) => {
      appendOption(
        formElements.coatingSelect,
        coating.id,
        coating.name
      );
    }
  );
}

function showEmptySpec() {
  latestCalculation = null;

  specElements.emptySpec.classList.remove(
    "is-hidden"
  );

  specElements.specContent.classList.add(
    "is-hidden"
  );
}

function showSpecContent() {
  specElements.emptySpec.classList.add(
    "is-hidden"
  );

  specElements.specContent.classList.remove(
    "is-hidden"
  );
}

function clearPriceFields() {
  specElements.total.textContent = "—";

  specElements.vat.textContent =
    "В том числе НДС: —";

  specElements.areaWithWaste.textContent =
    "—";

  specElements.paidArea.textContent =
    "—";

  specElements.breakdown.innerHTML = "";

  specElements.formula.textContent =
    "Цена = площадь к оплате × цена выбранной позиции за м²";

  specElements.minAreaNote.textContent =
    "Минимальная партия — 20 м².";
}

function renderPartialSpecification() {
  const selectedItem = getSelectedItem();
  const selectedPattern =
    getSelectedPattern();
  const selectedCoating =
    getSelectedCoating();
  const board = getBoardParams();

  const hasAnySpecData = Boolean(
    formElements.materialTypeSelect.value ||
      formElements.speciesSelect.value ||
      formElements.topLayerSelect.value ||
      formElements.patternSelect.value ||
      formElements.roomAreaInput.value ||
      formElements.wasteInput.value ||
      formElements.lengthInput.value ||
      formElements.widthInput.value ||
      formElements.coatingSelect.value
  );

  if (!hasAnySpecData) {
    showEmptySpec();
    return;
  }

  showSpecContent();

  const itemsByMaterialType =
    getItemsByMaterialType();

  specElements.materialType.textContent =
    selectedItem?.materialTypeName ||
    itemsByMaterialType[0]
      ?.materialTypeName ||
    "—";

  specElements.species.textContent =
    formElements.speciesSelect.value ||
    "—";

  specElements.topLayer.textContent =
    formElements.topLayerSelect.value ||
    "—";

  specElements.price.textContent =
    selectedItem
      ? `${formatMoney(
          selectedItem.pricePerM2
        )} / м²`
      : "—";

  specElements.pattern.textContent =
    selectedPattern?.name || "—";

  specElements.roomArea.textContent =
    formElements.roomAreaInput.value
      ? `${formatNumber(
          Number(
            formElements.roomAreaInput
              .value
          )
        )} м²`
      : "—";

  specElements.waste.textContent =
    formElements.wasteInput.value
      ? `${formatNumber(
          Number(
            formElements.wasteInput.value
          ),
          1
        )}%`
      : "—";

  const lengthText = board.length
    ? board.length
    : "—";

  const widthText = board.width
    ? board.width
    : "—";

  specElements.boardParams.textContent =
    `${lengthText} × ${widthText} × ${board.thickness} мм`;

  specElements.coating.textContent =
    selectedCoating?.name || "—";

  clearPriceFields();
}

function renderBreakdown(result) {
  const rows = [
    [
      "Стоимость до скидки",
      result.totalBeforeDiscount
    ],
    [
      "Скидка",
      -result.discountAmount
    ]
  ];

  specElements.breakdown.innerHTML = rows
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
  validateBoardParams();
  renderPartialSpecification();

  if (!isReadyForPriceCalculation()) {
    latestCalculation = null;
    return;
  }

  const result = calculateFlooring();
  const meta = flooringData.meta;

  latestCalculation = result;

  renderBreakdown(result);

  specElements.formula.textContent =
    `Цена = площадь к оплате × цена выбранной позиции за м². Скидка ${formatNumber(
      result.discountPercent,
      1
    )}% применяется к рассчитанной стоимости.`;

  specElements.areaWithWaste.textContent =
    `${formatNumber(
      result.areaWithWaste
    )} м²`;

  specElements.paidArea.textContent =
    result.minAreaApplied
      ? `${formatNumber(
          result.paidArea
        )} м², применён минимум`
      : `${formatNumber(
          result.paidArea
        )} м²`;

  specElements.total.textContent =
    formatMoney(result.total);

  specElements.vat.textContent =
    `В том числе НДС: ${formatMoney(
      result.vat
    )}`;

  specElements.minAreaNote.textContent =
    result.minAreaApplied
      ? `Площадь с запасом меньше ${meta.minArea} м², поэтому к оплате применена минимальная партия ${meta.minArea} м².`
      : `Минимальная партия ${meta.minArea} м² не применяется, потому что расчётная площадь больше минимума.`;

  sessionStorage.setItem(
    "woodstockFlooringCalculation",
    JSON.stringify(result)
  );
}

function handleMaterialTypeChange() {
  resetSelect(
    formElements.speciesSelect,
    "Сначала выберите тип материала",
    true
  );

  resetSelect(
    formElements.topLayerSelect,
    "Сначала выберите породу",
    true
  );

  if (
    formElements.materialTypeSelect.value
  ) {
    fillSpeciesSelect();
  }

  renderSpecification();
}

function handleSpeciesChange() {
  resetSelect(
    formElements.topLayerSelect,
    "Сначала выберите породу",
    true
  );

  if (
    formElements.speciesSelect.value
  ) {
    fillTopLayerSelect();
  }

  renderSpecification();
}

function handlePatternChange() {
  const selectedPattern =
    getSelectedPattern();

  formElements.wasteInput.value =
    selectedPattern
      ? selectedPattern.wastePercent
      : "";

  renderSpecification();
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

function applyEditMode() {
  const item = getEditItem();
  const index = getEditIndex();

  if (
    !item ||
    item.productType !== "flooring" ||
    index === null
  ) {
    clearEditState();
    return;
  }

  editMode = true;
  editIndex = index;

  formElements.addToSpecBtn.textContent =
    "Сохранить изменения";

  formElements.materialTypeSelect.value =
    item.materialTypeId ||
    item.selectedItem?.materialType ||
    "";

  if (
    formElements.materialTypeSelect.value
  ) {
    fillSpeciesSelect();
  }

  formElements.speciesSelect.value =
    item.species || "";

  if (
    formElements.speciesSelect.value
  ) {
    fillTopLayerSelect();
  }

  formElements.topLayerSelect.value =
    item.topLayer ||
    item.selectedItem?.topLayer ||
    "";

  formElements.patternSelect.value =
    item.selectedPatternId ||
    item.selectedPattern?.id ||
    "";

  formElements.roomAreaInput.value =
    item.roomArea || "";

  formElements.wasteInput.value =
    item.wastePercent ?? "";

  formElements.lengthInput.value =
    item.length || "";

  formElements.widthInput.value =
    item.width || "";

  formElements.coatingSelect.value =
    item.selectedCoatingId ||
    item.selectedCoating?.id ||
    "";

  formElements.commentInput.value =
    item.comment || "";

  formElements.discountInput.value =
    item.discountPercent ?? 0;

  existingUploadedFiles =
    Array.isArray(item.attachedFiles)
      ? item.attachedFiles
      : [];

  formElements.filesInput.value = "";
  renderSelectedFiles();

  renderSpecification();
}

function addToSpecification() {
  if (!latestCalculation) {
    alert(
      "Для добавления в спецификацию выберите материал, раскладку и укажите площадь."
    );

    return;
  }

  let savedItems = [];

  try {
    savedItems = JSON.parse(
      sessionStorage.getItem(
        storageKeys.items
      ) || "[]"
    );
  } catch (error) {
    savedItems = [];
  }

  if (!Array.isArray(savedItems)) {
    savedItems = [];
  }

  if (
    editMode &&
    editIndex !== null &&
    savedItems[editIndex]
  ) {
    savedItems[editIndex] =
      latestCalculation;
  } else {
    savedItems.push(
      latestCalculation
    );
  }

  sessionStorage.setItem(
    storageKeys.items,
    JSON.stringify(savedItems)
  );

  clearEditState();

  window.location.href =
    "specification.html";
}

function initFlooringCalculator() {
  selectNumberValueOnFocus(
  formElements.discountInput
  ); 
  fillMaterialTypeSelect();
  fillPatternSelect();
  fillCoatingSelect();

  formElements.thicknessInput.value =
    flooringData.meta.thickness;

  formElements.materialTypeSelect.addEventListener(
    "change",
    handleMaterialTypeChange
  );

  formElements.speciesSelect.addEventListener(
    "change",
    handleSpeciesChange
  );

  formElements.topLayerSelect.addEventListener(
    "change",
    renderSpecification
  );

  formElements.patternSelect.addEventListener(
    "change",
    handlePatternChange
  );

  formElements.addToSpecBtn.addEventListener(
    "click",
    addToSpecification
  );

  [
    formElements.roomAreaInput,
    formElements.wasteInput,
    formElements.lengthInput,
    formElements.widthInput,
    formElements.coatingSelect,
    formElements.commentInput,
    formElements.discountInput
  ].forEach((element) => {
    element.addEventListener(
      "input",
      renderSpecification
    );

    element.addEventListener(
      "change",
      renderSpecification
    );
  });

  formElements.filesInput.addEventListener(
    "change",
    () => {
      existingUploadedFiles = [];
      renderSelectedFiles();
      renderSpecification();
    }
  );

  showEmptySpec();
  applyEditMode();
  renderSelectedFiles();
}

fetch(dataUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error(
        "Не удалось загрузить данные инженерной доски."
      );
    }

    return response.json();
  })
  .then((data) => {
    flooringData = data;
    initFlooringCalculator();
  })
  .catch((error) => {
    console.error(error);

    alert(
      "Не удалось загрузить data/flooring.json. Запустите проект через локальный сервер."
    );
  });