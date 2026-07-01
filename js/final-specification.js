const storageKeys = {
  items: "woodstockSpecificationItems",
  orderMeta: "woodstockOrderMeta",
  orderOptions: "woodstockOrderOptions",
  orderDetails: "woodstockOrderDetails"
};

const VAT_RATE = 0.22;
const PACKAGING_WEIGHT_PER_M2 = 1.5;

const densityByBase = [
  { includes: "МДФ", density: 800 },
  { includes: "ДСП", density: 650 },
  { includes: "ГСП", density: 1250 },
  { includes: "Столярная", density: 520 },
  { includes: "Фанера облегч", density: 450 },
  { includes: "Фанера", density: 650 }
];

const elements = {
  orderNumber: document.querySelector("#orderNumber"),
  orderStatus: document.querySelector("#orderStatus"),

  metaOrderNumber: document.querySelector("#metaOrderNumber"),
  metaOrderDate: document.querySelector("#metaOrderDate"),
  metaOrderStatus: document.querySelector("#metaOrderStatus"),
  metaItemsCount: document.querySelector("#metaItemsCount"),

  managerName: document.querySelector("#managerName"),
  managerBranch: document.querySelector("#managerBranch"),

  clientName: document.querySelector("#clientName"),
  clientType: document.querySelector("#clientType"),
  clientPhone: document.querySelector("#clientPhone"),
  clientEmail: document.querySelector("#clientEmail"),
  companyRow: document.querySelector("#companyRow"),
  innRow: document.querySelector("#innRow"),
  clientCompany: document.querySelector("#clientCompany"),
  clientInn: document.querySelector("#clientInn"),

  itemsTableBody: document.querySelector("#itemsTableBody"),

  technicalArea: document.querySelector("#technicalArea"),
  technicalVolume: document.querySelector("#technicalVolume"),
  technicalNetWeight: document.querySelector("#technicalNetWeight"),
  technicalGrossWeight: document.querySelector("#technicalGrossWeight"),
  technicalProductionTerm: document.querySelector("#technicalProductionTerm"),

  packagingName: document.querySelector("#packagingName"),
  packagingArea: document.querySelector("#packagingArea"),
  packagingRate: document.querySelector("#packagingRate"),
  packagingMultiplier: document.querySelector("#packagingMultiplier"),
  packagingTotal: document.querySelector("#packagingTotal"),
  packagingNote: document.querySelector("#packagingNote"),

  servicesList: document.querySelector("#servicesList"),
  servicesComment: document.querySelector("#servicesComment"),

  filesList: document.querySelector("#filesList"),
  orderRequirements: document.querySelector("#orderRequirements"),
  managerComment: document.querySelector("#managerComment"),

  itemsTotal: document.querySelector("#itemsTotal"),
  summaryPackagingTotal: document.querySelector("#summaryPackagingTotal"),
  summaryServicesTotal: document.querySelector("#summaryServicesTotal"),
  finalTotal: document.querySelector("#finalTotal"),
  finalVat: document.querySelector("#finalVat"),

  printBtn: document.querySelector("#printBtn"),
  newOrderBtn: document.querySelector("#newOrderBtn")
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
    date: "—",
    status: "Черновик"
  });
}

function getOrderOptions() {
  return readJsonFromStorage(storageKeys.orderOptions, null);
}

function getOrderDetails() {
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
  return items.reduce((sum, item) => {
    return sum + (Number(item.total) || 0);
  }, 0);
}

function getItemVat(item) {
  return Number(item.vat) || 0;
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

    if (item.selectedCoating?.name) {
      parts.push(item.selectedCoating.name);
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

function getItemArea(item) {
  if (item.productType === "flooring") {
    return Number(item.paidArea) || Number(item.areaWithWaste) || Number(item.area) || 0;
  }

  return Number(item.area) || 0;
}

function getItemThickness(item) {
  if (item.productType === "flooring") {
    return Number(item.thickness) || 14;
  }

  if (item.numericThickness) {
    return Number(item.numericThickness);
  }

  if (item.thicknessValue) {
    const parsed = parseFloat(String(item.thicknessValue).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (item.thickness) {
    const parsed = parseFloat(String(item.thickness).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getItemVolume(item) {
  const area = getItemArea(item);
  const thickness = getItemThickness(item);

  return area && thickness ? area * thickness / 1000 : 0;
}

function getItemDensity(item) {
  if (item.productType === "flooring") {
    return 650;
  }

  const base = String(item.base || "");
  const matched = densityByBase.find((entry) => base.includes(entry.includes));

  return matched?.density || 800;
}

function getPackagingWeightMultiplier(options) {
  const packaging = options?.packaging;

  if (!packaging?.enabled) {
    return 0;
  }

  return Number(packaging.multiplier) || 1;
}

function getItemNetWeight(item) {
  const volume = getItemVolume(item);
  const density = getItemDensity(item);

  return volume * density;
}

function getItemGrossWeight(item, options) {
  const netWeight = getItemNetWeight(item);
  const area = getItemArea(item);
  const packagingMultiplier = getPackagingWeightMultiplier(options);

  return netWeight + area * PACKAGING_WEIGHT_PER_M2 * packagingMultiplier;
}

function getItemProductionTerm(item) {
  if (item.productType === "flooring") {
    return "1,5 месяца";
  }

  if (item.lacquerCost > 0 || item.lacquerNeeded === "yes") {
    return "25–28 раб. дней";
  }

  if (item.sizeType === "custom") {
    return "20 раб. дней";
  }

  return "11–15 раб. дней";
}

function getProductionTermRank(term) {
  if (term.includes("1,5 месяца")) return 4;
  if (term.includes("25–28")) return 3;
  if (term.includes("20")) return 2;
  if (term.includes("11–15")) return 1;
  return 0;
}

function getOrderProductionTerm(items) {
  const terms = [...new Set(items.map(getItemProductionTerm))];

  if (!terms.length) {
    return "—";
  }

  return terms
    .sort((a, b) => getProductionTermRank(b) - getProductionTermRank(a))
    .join("; ");
}

function getTechnicalTotals(items, options) {
  return items.reduce(
    (acc, item) => {
      acc.area += getItemArea(item);
      acc.volume += getItemVolume(item);
      acc.netWeight += getItemNetWeight(item);
      acc.grossWeight += getItemGrossWeight(item, options);
      return acc;
    },
    {
      area: 0,
      volume: 0,
      netWeight: 0,
      grossWeight: 0,
      productionTerm: getOrderProductionTerm(items)
    }
  );
}

function getFinalTotals(items, options) {
  const itemsTotal = getItemsTotal(items);
  const packagingTotal = Number(options?.packaging?.total) || 0;
  const servicesTotal = Number(options?.services?.total) || 0;
  const optionsTotal = packagingTotal + servicesTotal;
  const finalTotal = Number(options?.finalTotal) || itemsTotal + optionsTotal;
  const vat = Number(options?.vat) || Math.round(finalTotal * VAT_RATE / (1 + VAT_RATE));

  return {
    itemsTotal,
    packagingTotal,
    servicesTotal,
    optionsTotal,
    finalTotal,
    vat
  };
}

function renderHeader(meta, items) {
  const itemLabel = getPluralLabel(items.length, "позиция", "позиции", "позиций");

  elements.orderNumber.textContent = meta.number || "—";
  elements.orderStatus.textContent = meta.status || "Черновик";

  elements.metaOrderNumber.textContent = meta.number || "—";
  elements.metaOrderDate.textContent = meta.date || "—";
  elements.metaOrderStatus.textContent = meta.status || "Черновик";
  elements.metaItemsCount.textContent = `${items.length} ${itemLabel}`;
}

function renderManager(details) {
  elements.managerName.textContent = details?.manager?.name || "—";
  elements.managerBranch.textContent = details?.manager?.branchName || "—";
}

function renderClient(details) {
  const client = details?.client || {};

  elements.clientName.textContent = client.name || "—";
  elements.clientType.textContent = client.typeName || "—";
  elements.clientPhone.textContent = client.phone || "—";
  elements.clientEmail.textContent = client.email || "—";

  const isCompany = client.type === "company";

  elements.companyRow.classList.toggle("is-hidden", !isCompany);
  elements.innRow.classList.toggle("is-hidden", !isCompany);

  elements.clientCompany.textContent = client.companyName || "—";
  elements.clientInn.textContent = client.inn || "—";
}

function renderItems(items, options) {
  if (!items.length) {
    elements.itemsTableBody.innerHTML = `
      <tr>
        <td colspan="11">Позиции заказа не найдены.</td>
      </tr>
    `;
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
          <td>${formatNumber(getItemArea(item), 3)} м²</td>
          <td>${formatNumber(getItemVolume(item), 3)} м³</td>
          <td>
            <strong>${formatNumber(getItemNetWeight(item), 2)} кг</strong>
            <small>брутто: ${formatNumber(getItemGrossWeight(item, options), 2)} кг</small>
          </td>
          <td>${escapeHtml(getItemProductionTerm(item))}</td>
          <td>
            <strong>${formatMoney(item.total)}</strong>
            <small>НДС: ${formatMoney(getItemVat(item))}</small>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderTechnicalTotals(items, options) {
  const totals = getTechnicalTotals(items, options);

  elements.technicalArea.textContent = `${formatNumber(totals.area, 3)} м²`;
  elements.technicalVolume.textContent = `${formatNumber(totals.volume, 3)} м³`;
  elements.technicalNetWeight.textContent = `${formatNumber(totals.netWeight, 2)} кг`;
  elements.technicalGrossWeight.textContent = `${formatNumber(totals.grossWeight, 2)} кг`;
  elements.technicalProductionTerm.textContent = totals.productionTerm;
}

function renderPackaging(options) {
  const packaging = options?.packaging;

  if (!packaging || !packaging.enabled) {
    elements.packagingName.textContent = "Не выбрана";
    elements.packagingArea.textContent = "—";
    elements.packagingRate.textContent = "—";
    elements.packagingMultiplier.textContent = "—";
    elements.packagingTotal.textContent = formatMoney(0);
    elements.packagingNote.textContent = "Упаковка не добавлена к заказу.";
    return;
  }

  elements.packagingName.textContent = packaging.name || "Упаковка";
  elements.packagingArea.textContent = `${formatNumber(packaging.area, 3)} м²`;
  elements.packagingRate.textContent = `${formatMoney(packaging.rate)} / м²`;
  elements.packagingMultiplier.textContent = `× ${formatNumber(packaging.multiplier, 1)}`;
  elements.packagingTotal.textContent = formatMoney(packaging.total);
  elements.packagingNote.textContent = packaging.note || "Тариф упаковки взят из расчётной таблицы.";
}

function renderServices(options) {
  const services = options?.services?.items || [];
  const comment = options?.services?.comment || "";

  if (!services.length) {
    elements.servicesList.textContent = "Услуги не выбраны.";
  } else {
    elements.servicesList.innerHTML = services
      .map((service) => {
        return `
          <div class="final-service-row">
            <span>${escapeHtml(service.name)}</span>
            <strong>${formatMoney(service.total)}</strong>
            ${service.isDemoRate ? "<small>Демонстрационный тариф прототипа</small>" : ""}
          </div>
        `;
      })
      .join("");
  }

  elements.servicesComment.textContent = comment
    ? `Комментарий: ${comment}`
    : "Комментарий к услугам не указан.";
}

function renderFilesAndComments(details) {
  const files = details?.files || [];

  if (!files.length) {
    elements.filesList.textContent = "—";
  } else {
    elements.filesList.innerHTML = files
      .map((file) => escapeHtml(file.name))
      .join("<br>");
  }

  elements.orderRequirements.textContent = details?.order?.requirements || "—";
  elements.managerComment.textContent = details?.order?.managerComment || "—";
}

function renderTotals(items, options) {
  const totals = getFinalTotals(items, options);

  elements.itemsTotal.textContent = formatMoney(totals.itemsTotal);
  elements.summaryPackagingTotal.textContent = formatMoney(totals.packagingTotal);
  elements.summaryServicesTotal.textContent = formatMoney(totals.servicesTotal);
  elements.finalTotal.textContent = formatMoney(totals.finalTotal);
  elements.finalVat.textContent = formatMoney(totals.vat);
}

function printPage() {
  window.print();
}

function startNewOrder() {
  const confirmed = window.confirm("Начать новый расчёт? Текущие данные будут очищены.");

  if (!confirmed) {
    return;
  }

  sessionStorage.removeItem(storageKeys.items);
  sessionStorage.removeItem(storageKeys.orderMeta);
  sessionStorage.removeItem(storageKeys.orderOptions);
  sessionStorage.removeItem(storageKeys.orderDetails);
  sessionStorage.removeItem("woodstockPanelsFacadesCalculation");
  sessionStorage.removeItem("woodstockFlooringCalculation");
  sessionStorage.removeItem("woodstockEditItem");
  sessionStorage.removeItem("woodstockEditIndex");

  window.location.href = "../index.html";
}

function renderPage() {
  const meta = getOrderMeta();
  const items = getItems();
  const options = getOrderOptions();
  const details = getOrderDetails();

  renderHeader(meta, items);
  renderManager(details);
  renderClient(details);
  renderItems(items, options);
  renderTechnicalTotals(items, options);
  renderPackaging(options);
  renderServices(options);
  renderFilesAndComments(details);
  renderTotals(items, options);
}

function initEvents() {
  elements.printBtn.addEventListener("click", printPage);
  elements.newOrderBtn.addEventListener("click", startNewOrder);
}

initEvents();
renderPage();