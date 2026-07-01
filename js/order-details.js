const storageKeys = {
  items: "woodstockSpecificationItems",
  orderMeta: "woodstockOrderMeta",
  orderOptions: "woodstockOrderOptions",
  orderDetails: "woodstockOrderDetails"
};

const VAT_RATE = 0.22;

const branchLabels = {
  moscow: "Москва",
  spb: "Санкт-Петербург",
  krasnodar: "Краснодар",
  other: "Другой филиал"
};

const clientTypeLabels = {
  individual: "Физлицо",
  company: "Юрлицо"
};

const elements = {
  orderNumberTitle: document.querySelector("#orderNumberTitle"),
  orderStatusTitle: document.querySelector("#orderStatusTitle"),
  orderDateMeta: document.querySelector("#orderDateMeta"),
  itemsCountMeta: document.querySelector("#itemsCountMeta"),
  finalTotalMeta: document.querySelector("#finalTotalMeta"),
  finalVatMeta: document.querySelector("#finalVatMeta"),

  managerNameInput: document.querySelector("#managerNameInput"),
  branchSelect: document.querySelector("#branchSelect"),
  orderStatusSelect: document.querySelector("#orderStatusSelect"),

  clientNameInput: document.querySelector("#clientNameInput"),
  clientPhoneInput: document.querySelector("#clientPhoneInput"),
  clientEmailInput: document.querySelector("#clientEmailInput"),
  clientTypeSelect: document.querySelector("#clientTypeSelect"),
  companyNameField: document.querySelector("#companyNameField"),
  companyNameInput: document.querySelector("#companyNameInput"),
  innField: document.querySelector("#innField"),
  clientInnInput: document.querySelector("#clientInnInput"),

  filesInput: document.querySelector("#filesInput"),
  uploadedFilesList: document.querySelector("#uploadedFilesList"),
  orderRequirementsInput: document.querySelector("#orderRequirementsInput"),
  managerCommentInput: document.querySelector("#managerCommentInput"),

  sideOrderNumber: document.querySelector("#sideOrderNumber"),
  sideOrderStatus: document.querySelector("#sideOrderStatus"),
  sideManager: document.querySelector("#sideManager"),
  sideBranch: document.querySelector("#sideBranch"),
  sideClient: document.querySelector("#sideClient"),
  sideContacts: document.querySelector("#sideContacts"),
  sideFiles: document.querySelector("#sideFiles"),
  sideItemsTotal: document.querySelector("#sideItemsTotal"),
  sideOptionsTotal: document.querySelector("#sideOptionsTotal"),
  sideFinalTotal: document.querySelector("#sideFinalTotal"),
  sideFinalVat: document.querySelector("#sideFinalVat"),

  finishOrderBtn: document.querySelector("#finishOrderBtn"),
  detailsNote: document.querySelector("#detailsNote")
};

let selectedFiles = [];

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function readJsonFromStorage(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function saveJsonToStorage(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function getItems() {
  const items = readJsonFromStorage(storageKeys.items, []);
  return Array.isArray(items) ? items : [];
}

function getOrderMeta() {
  return readJsonFromStorage(storageKeys.orderMeta, {
    number: "—",
    date: "—",
    status: "Черновик"
  });
}

function getOrderOptions() {
  return readJsonFromStorage(storageKeys.orderOptions, null);
}

function getSavedDetails() {
  return readJsonFromStorage(storageKeys.orderDetails, null);
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

function getOptionsTotal(options) {
  if (!options) {
    return 0;
  }

  return Number(options.optionsTotal) || 0;
}

function getFinalTotal(items, options) {
  if (options?.finalTotal) {
    return Number(options.finalTotal) || 0;
  }

  return getItemsTotal(items);
}

function getFinalVat(finalTotal, options) {
  if (options?.vat) {
    return Number(options.vat) || 0;
  }

  return Math.round(finalTotal * VAT_RATE / (1 + VAT_RATE));
}

function getCurrentDetails() {
  const files = selectedFiles.map((file) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type
    };
  });

  return {
    manager: {
      name: elements.managerNameInput.value.trim(),
      branch: elements.branchSelect.value,
      branchName: branchLabels[elements.branchSelect.value] || ""
    },
    order: {
      status: elements.orderStatusSelect.value,
      requirements: elements.orderRequirementsInput.value.trim(),
      managerComment: elements.managerCommentInput.value.trim()
    },
    client: {
      name: elements.clientNameInput.value.trim(),
      phone: elements.clientPhoneInput.value.trim(),
      email: elements.clientEmailInput.value.trim(),
      type: elements.clientTypeSelect.value,
      typeName: clientTypeLabels[elements.clientTypeSelect.value],
      companyName: elements.companyNameInput.value.trim(),
      inn: elements.clientInnInput.value.trim()
    },
    files,
    savedAt: new Date().toISOString()
  };
}

function updateOrderMetaStatus(status) {
  const meta = getOrderMeta();

  meta.status = status;
  saveJsonToStorage(storageKeys.orderMeta, meta);
}

function saveDetails() {
  const details = getCurrentDetails();

  saveJsonToStorage(storageKeys.orderDetails, details);
  updateOrderMetaStatus(details.order.status);

  return details;
}

function applySavedDetails() {
  const details = getSavedDetails();

  if (!details) {
    return;
  }

  elements.managerNameInput.value = details.manager?.name || "";
  elements.branchSelect.value = details.manager?.branch || "";
  elements.orderStatusSelect.value = details.order?.status || "Черновик";

  elements.clientNameInput.value = details.client?.name || "";
  elements.clientPhoneInput.value = details.client?.phone || "";
  elements.clientEmailInput.value = details.client?.email || "";
  elements.clientTypeSelect.value = details.client?.type || "individual";
  elements.companyNameInput.value = details.client?.companyName || "";
  elements.clientInnInput.value = details.client?.inn || "";

  elements.orderRequirementsInput.value = details.order?.requirements || "";
  elements.managerCommentInput.value = details.order?.managerComment || "";

  selectedFiles = details.files || [];
}

function renderFiles() {
  if (!selectedFiles.length) {
    elements.uploadedFilesList.textContent = "Файлы не выбраны.";
    return;
  }

  elements.uploadedFilesList.innerHTML = selectedFiles
    .map((file) => `<span>${file.name}</span>`)
    .join("");
}

function renderCompanyFields() {
  const isCompany = elements.clientTypeSelect.value === "company";

  elements.companyNameField.classList.toggle("is-hidden", !isCompany);
  elements.innField.classList.toggle("is-hidden", !isCompany);
}

function renderHeader(meta, items, options) {
  const finalTotal = getFinalTotal(items, options);
  const finalVat = getFinalVat(finalTotal, options);

  const itemLabel = getPluralLabel(items.length, "позиция", "позиции", "позиций");

  elements.orderNumberTitle.textContent = meta.number;
  elements.orderStatusTitle.textContent = elements.orderStatusSelect.value;
  elements.orderDateMeta.textContent = meta.date || "—";
  elements.itemsCountMeta.textContent = `${items.length} ${itemLabel}`;
  elements.finalTotalMeta.textContent = formatMoney(finalTotal);
  elements.finalVatMeta.textContent = formatMoney(finalVat);
}

function renderSidePanel(meta, items, options) {
  const details = getCurrentDetails();

  const itemsTotal = getItemsTotal(items);
  const optionsTotal = getOptionsTotal(options);
  const finalTotal = getFinalTotal(items, options);
  const finalVat = getFinalVat(finalTotal, options);

  elements.sideOrderNumber.textContent = meta.number;
  elements.sideOrderStatus.textContent = details.order.status || "Черновик";
  elements.sideManager.textContent = details.manager.name || "—";
  elements.sideBranch.textContent = details.manager.branchName || "—";

  const clientParts = [
    details.client.name || "—",
    details.client.typeName ? `Тип: ${details.client.typeName}` : "",
    details.client.type === "company" && details.client.companyName
      ? `Компания: ${details.client.companyName}`
      : "",
    details.client.type === "company" && details.client.inn
      ? `ИНН: ${details.client.inn}`
      : ""
  ].filter(Boolean);

  elements.sideClient.textContent = clientParts.join(" / ");

  const contacts = [
    details.client.phone,
    details.client.email
  ].filter(Boolean);

  elements.sideContacts.textContent = contacts.length ? contacts.join(" / ") : "—";
  elements.sideFiles.textContent = selectedFiles.length ? `${selectedFiles.length} файл(ов)` : "—";

  elements.sideItemsTotal.textContent = formatMoney(itemsTotal);
  elements.sideOptionsTotal.textContent = formatMoney(optionsTotal);
  elements.sideFinalTotal.textContent = formatMoney(finalTotal);
  elements.sideFinalVat.textContent = `В том числе НДС: ${formatMoney(finalVat)}`;
}

function renderPage() {
  const meta = getOrderMeta();
  const items = getItems();
  const options = getOrderOptions();

  renderCompanyFields();
  renderFiles();
  renderHeader(meta, items, options);
  renderSidePanel(meta, items, options);

  saveDetails();
}

function handleFilesChange() {
  selectedFiles = Array.from(elements.filesInput.files).map((file) => {
    return {
      name: file.name,
      size: file.size,
      type: file.type
    };
  });

  renderPage();
}

function validateBeforeFinish() {
  const missing = [];

  if (!elements.managerNameInput.value.trim()) {
    missing.push("менеджер");
  }

  if (!elements.branchSelect.value) {
    missing.push("филиал");
  }

  if (!elements.clientNameInput.value.trim()) {
    missing.push("имя / контактное лицо клиента");
  }

  if (!elements.clientPhoneInput.value.trim()) {
    missing.push("телефон клиента");
  }

  if (!elements.clientEmailInput.value.trim()) {
    missing.push("email клиента");
  }

  if (elements.clientTypeSelect.value === "company") {
    if (!elements.companyNameInput.value.trim()) {
      missing.push("компания");
    }

    if (!elements.clientInnInput.value.trim()) {
      missing.push("ИНН");
    }
  }

  return missing;
}

function finishOrder() {
  const missing = validateBeforeFinish();

  if (missing.length) {
    alert(`Заполните обязательные поля: ${missing.join(", ")}.`);
    return;
  }

  elements.orderStatusSelect.value = "Готов к отправке клиенту";

  const details = saveDetails();
  updateOrderMetaStatus(details.order.status);

  elements.finishOrderBtn.textContent = "Заявка сформирована";
  elements.detailsNote.textContent = "Данные заявки сохранены. Следующий шаг — финальная спецификация / КП.";

  renderPage();

  setTimeout(() => {
    window.location.href = "final-specification.html";
  }, 700);
}

function initEvents() {
  [
    elements.managerNameInput,
    elements.branchSelect,
    elements.orderStatusSelect,
    elements.clientNameInput,
    elements.clientPhoneInput,
    elements.clientEmailInput,
    elements.clientTypeSelect,
    elements.companyNameInput,
    elements.clientInnInput,
    elements.orderRequirementsInput,
    elements.managerCommentInput
  ].forEach((element) => {
    element.addEventListener("input", renderPage);
    element.addEventListener("change", renderPage);
  });

  elements.filesInput.addEventListener("change", handleFilesChange);
  elements.finishOrderBtn.addEventListener("click", finishOrder);
}

applySavedDetails();
initEvents();
renderPage();