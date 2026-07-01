const storageKeys = {
  items: "woodstockSpecificationItems",
  orderMeta: "woodstockOrderMeta",
  editItem: "woodstockEditItem",
  editIndex: "woodstockEditIndex"
};

const elements = {
  orderNumber: document.querySelector("#orderNumber"),
  orderDate: document.querySelector("#orderDate"),
  orderStatus: document.querySelector("#orderStatus"),
  itemsCount: document.querySelector("#itemsCount"),
  summaryTotal: document.querySelector("#summaryTotal"),
  summaryVat: document.querySelector("#summaryVat"),

  emptySummary: document.querySelector("#emptySummary"),
  summaryTableWrap: document.querySelector("#summaryTableWrap"),
  itemsTableBody: document.querySelector("#itemsTableBody"),
  clearOrderBtn: document.querySelector("#clearOrderBtn"),

  sideOrderNumber: document.querySelector("#sideOrderNumber"),
  sideOrderStatus: document.querySelector("#sideOrderStatus"),
  sideItemsCount: document.querySelector("#sideItemsCount"),
  sideTotal: document.querySelector("#sideTotal"),
  sideVat: document.querySelector("#sideVat"),
  summaryNote: document.querySelector("#summaryNote"),
  nextStepLink: document.querySelector("#nextStepLink")
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function joinLines(parts) {
  return parts
    .filter((item) => item !== undefined && item !== null && String(item).trim() !== "")
    .map((item) => escapeHtml(item))
    .join("<br>");
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

function getTodayString() {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date());
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

function generateOrderNumber() {
  const now = new Date();

  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0")
  ].join("");

  const randomPart = Math.floor(Math.random() * 900 + 100);

  return `WS-${datePart}-${timePart}-${randomPart}`;
}

function readJsonFromStorage(key, fallback) {
  try {
    return JSON.parse(sessionStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function getOrderMeta() {
  const savedMeta = readJsonFromStorage(storageKeys.orderMeta, null);

  if (savedMeta) {
    return savedMeta;
  }

  const meta = {
    number: generateOrderNumber(),
    date: getTodayString(),
    status: "Черновик"
  };

  sessionStorage.setItem(storageKeys.orderMeta, JSON.stringify(meta));

  return meta;
}

function getItems() {
  const items = readJsonFromStorage(storageKeys.items, []);

  return Array.isArray(items) ? items : [];
}

function saveItems(items) {
  sessionStorage.setItem(storageKeys.items, JSON.stringify(items));
}

function getItemTotal(item) {
  return Number(item.total) || 0;
}

function getItemVat(item) {
  return Number(item.vat) || 0;
}

function getOrderTotals(items) {
  return items.reduce(
    (acc, item) => {
      acc.total += getItemTotal(item);
      acc.vat += getItemVat(item);
      return acc;
    },
    {
      total: 0,
      vat: 0
    }
  );
}

function getProductName(item) {
  if (item.productName) {
    return item.productName;
  }

  if (item.productType === "flooring") {
    return "Инженерная доска";
  }

  if (item.productType === "facades") {
    return "Мебельные фасады";
  }

  if (item.productType === "panels") {
    return "Интерьерные панели";
  }

  return "Изделие";
}

function getItemParamsText(item) {
  if (item.productType === "flooring") {
    const parts = [];

    if (item.selectedPattern?.name) {
      parts.push(item.selectedPattern.name);
    }

    if (item.topLayer) {
      parts.push(`верхний слой ${item.topLayer}`);
    }

    if (item.thickness) {
      parts.push(`толщина ${item.thickness} мм`);
    }

    return parts.length ? joinLines(parts) : "—";
  }

  const parts = [];

  if (item.base) {
    parts.push(item.base);
  }

  if (item.thickness) {
    parts.push(item.thickness);
  }

  if (item.veneeredSides) {
    parts.push(`${item.veneeredSides} сторон(а) фанеровки`);
  }

  if (item.textureTransition === "yes") {
    parts.push("переход текстуры");
  }

  return parts.length ? joinLines(parts) : "—";
}

function getItemSizeText(item) {
  if (item.productType === "flooring") {
    const parts = [];

    if (item.roomArea) {
      parts.push(`помещение ${formatNumber(item.roomArea)} м²`);
    }

    if (item.paidArea) {
      parts.push(`к оплате ${formatNumber(item.paidArea)} м²`);
    }

    if (item.length || item.width || item.thickness) {
      const length = item.length || "—";
      const width = item.width || "—";
      const thickness = item.thickness || "—";
      parts.push(`${length} × ${width} × ${thickness} мм`);
    }

    return parts.length ? joinLines(parts) : "—";
  }

  const parts = [];

  if (item.length && item.width) {
    parts.push(`${item.length} × ${item.width} мм`);
  }

  if (item.quantity) {
    parts.push(`${item.quantity} шт.`);
  }

  if (item.area) {
    parts.push(`${formatNumber(item.area, 3)} м²`);
  }

  if (item.sizeTypeLabel) {
    parts.push(item.sizeTypeLabel);
  }

  return parts.length ? joinLines(parts) : "—";
}

function getItemMaterialText(item) {
  if (item.productType === "flooring") {
    const parts = [];

    if (item.materialType) {
      parts.push(item.materialType);
    }

    if (item.species) {
      parts.push(item.species);
    }

    if (item.pricePerM2) {
      parts.push(`${formatMoney(item.pricePerM2)} / м²`);
    }

    return parts.length ? joinLines(parts) : "—";
  }

  const parts = [];

  if (item.veneerA?.name) {
    parts.push(`А: ${item.veneerA.name}`);
  }

  if (item.sideB) {
    parts.push(`Б: ${item.sideB}`);
  }

  if (item.premiumVeneerApplied) {
    parts.push("Шпон > 1000 ₽/м², коэффициент ×2");
  }

  return parts.length ? joinLines(parts) : "—";
}

function getItemExtrasText(item) {
  if (item.productType === "flooring") {
    const parts = [];

    if (item.selectedCoating?.name) {
      parts.push(item.selectedCoating.name);
    }

    if (item.wastePercent !== undefined && item.wastePercent !== null) {
      parts.push(`отходы ${formatNumber(item.wastePercent, 1)}%`);
    }

    if (item.comment) {
      parts.push(`Комментарий: ${item.comment}`);
    }

    return parts.length ? joinLines(parts) : "—";
  }

  const parts = [];

  if (item.cuttingAdded) {
    parts.push(`Раскрой: ${formatNumber(item.cuttingMeters)} пог. м`);
  }

  if (item.edgeCost > 0) {
    parts.push(`Кромка: ${formatNumber(item.edgeMeters)} пог. м`);
  }

  if (item.sandingCost > 0) {
    parts.push("Шлифовка");
  }

  if (item.lacquerCost > 0) {
    parts.push("Лак / финиш");
  }

  if (item.extrasWarnings?.length) {
    parts.push(...item.extrasWarnings);
  }

  if (item.notes?.length) {
    parts.push(...item.notes);
  }

  return parts.length ? joinLines(parts) : "—";
}

function getEditUrl(item) {
  if (item.productType === "flooring") {
    return "flooring.html";
  }

  if (item.productType === "facades") {
    return "panels-facades.html?type=facades";
  }

  return "panels-facades.html?type=panels";
}

function renderOrderMeta(meta, items, totals) {
  const itemLabel = getPluralLabel(items.length, "позиция", "позиции", "позиций");
  const itemsText = `${items.length} ${itemLabel}`;

  elements.orderNumber.textContent = meta.number;
  elements.sideOrderNumber.textContent = meta.number;

  elements.orderDate.textContent = meta.date;

  elements.orderStatus.textContent = meta.status;
  elements.sideOrderStatus.textContent = meta.status;

  elements.itemsCount.textContent = itemsText;
  elements.sideItemsCount.textContent = itemsText;

  elements.summaryTotal.textContent = formatMoney(totals.total);
  elements.sideTotal.textContent = formatMoney(totals.total);

  elements.summaryVat.textContent = formatMoney(totals.vat);
  elements.sideVat.textContent = `В том числе НДС: ${formatMoney(totals.vat)}`;
}

function renderEmptyState(items) {
  const isEmpty = items.length === 0;

  elements.emptySummary.hidden = !isEmpty;
  elements.summaryTableWrap.hidden = isEmpty;

  elements.clearOrderBtn.disabled = isEmpty;
  elements.nextStepLink.classList.toggle("is-disabled", isEmpty);

  if (isEmpty) {
    elements.summaryNote.textContent = "Добавьте хотя бы одну позицию, чтобы перейти к параметрам заказа.";
  } else {
    elements.summaryNote.textContent = "На следующем шаге можно добавить упаковку и сервисные услуги.";
  }
}

function renderItemsTable(items) {
  if (!items.length) {
    elements.itemsTableBody.innerHTML = "";
    return;
  }

  elements.itemsTableBody.innerHTML = items
    .map((item, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapeHtml(getProductName(item))}</strong>
          </td>
          <td>${getItemParamsText(item)}</td>
          <td>${getItemSizeText(item)}</td>
          <td>${getItemMaterialText(item)}</td>
          <td>${getItemExtrasText(item)}</td>
          <td>
            <strong>${formatMoney(getItemTotal(item))}</strong>
            <small>НДС: ${formatMoney(getItemVat(item))}</small>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" data-action="edit" data-index="${index}">
                Редактировать
              </button>
              <button type="button" data-action="duplicate" data-index="${index}">
                Дублировать
              </button>
              <button type="button" data-action="delete" data-index="${index}">
                Удалить
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderPage() {
  const meta = getOrderMeta();
  const items = getItems();
  const totals = getOrderTotals(items);

  renderOrderMeta(meta, items, totals);
  renderEmptyState(items);
  renderItemsTable(items);
}

function deleteItem(index) {
  const items = getItems();

  items.splice(index, 1);
  saveItems(items);

  renderPage();
}

function duplicateItem(index) {
  const items = getItems();
  const sourceItem = items[index];

  if (!sourceItem) {
    return;
  }

  const copy = JSON.parse(JSON.stringify(sourceItem));

  copy.duplicatedFrom = index + 1;
  copy.createdAt = new Date().toISOString();

  items.splice(index + 1, 0, copy);
  saveItems(items);

  renderPage();
}

function editItem(index) {
  const items = getItems();
  const item = items[index];

  if (!item) {
    return;
  }

  sessionStorage.setItem(storageKeys.editItem, JSON.stringify(item));
  sessionStorage.setItem(storageKeys.editIndex, String(index));

  window.location.href = getEditUrl(item);
}

function clearOrder() {
  const confirmed = window.confirm("Удалить все позиции из заказа?");

  if (!confirmed) {
    return;
  }

  sessionStorage.removeItem(storageKeys.items);
  sessionStorage.removeItem(storageKeys.orderMeta);
  sessionStorage.removeItem(storageKeys.editItem);
  sessionStorage.removeItem(storageKeys.editIndex);

  renderPage();
}

function handleTableClick(event) {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const index = Number(button.dataset.index);

  if (action === "delete") {
    deleteItem(index);
  }

  if (action === "duplicate") {
    duplicateItem(index);
  }

  if (action === "edit") {
    editItem(index);
  }
}

function handleNextStepClick(event) {
  const items = getItems();

  if (!items.length) {
    event.preventDefault();
    alert("Добавьте хотя бы одну позицию в заказ.");
  }
}

elements.itemsTableBody.addEventListener("click", handleTableClick);
elements.clearOrderBtn.addEventListener("click", clearOrder);
elements.nextStepLink.addEventListener("click", handleNextStepClick);

renderPage();