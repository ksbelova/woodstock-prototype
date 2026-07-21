const storageKeys = {
  items: "woodstockSpecificationItems",
  orderMeta: "woodstockOrderMeta",
  orderOptions: "woodstockOrderOptions",
  orderDetails: "woodstockOrderDetails"
};

const VAT_RATE = 0.22;
const PACKAGING_WEIGHT_PER_M2 = 1.5;

const densityByBase = [
  {
    includes: "МДФ",
    density: 800
  },
  {
    includes: "ДСП",
    density: 650
  },
  {
    includes: "ГСП",
    density: 1250
  },
  {
    includes: "Столярная",
    density: 520
  },
  {
    includes: "Фанера облегч",
    density: 450
  },
  {
    includes: "Фанера",
    density: 650
  }
];

const elements = {
  orderNumber:
    document.querySelector(
      "#orderNumber"
    ),

  orderStatus:
    document.querySelector(
      "#orderStatus"
    ),

  metaOrderNumber:
    document.querySelector(
      "#metaOrderNumber"
    ),

  metaOrderDate:
    document.querySelector(
      "#metaOrderDate"
    ),

  metaOrderStatus:
    document.querySelector(
      "#metaOrderStatus"
    ),

  metaItemsCount:
    document.querySelector(
      "#metaItemsCount"
    ),

  managerName:
    document.querySelector(
      "#managerName"
    ),

  managerBranch:
    document.querySelector(
      "#managerBranch"
    ),

  clientName:
    document.querySelector(
      "#clientName"
    ),

  clientType:
    document.querySelector(
      "#clientType"
    ),

  clientPhone:
    document.querySelector(
      "#clientPhone"
    ),

  clientEmail:
    document.querySelector(
      "#clientEmail"
    ),

  companyRow:
    document.querySelector(
      "#companyRow"
    ),

  innRow:
    document.querySelector(
      "#innRow"
    ),

  clientCompany:
    document.querySelector(
      "#clientCompany"
    ),

  clientInn:
    document.querySelector(
      "#clientInn"
    ),

  itemsTableBody:
    document.querySelector(
      "#itemsTableBody"
    ),

  technicalArea:
    document.querySelector(
      "#technicalArea"
    ),

  technicalVolume:
    document.querySelector(
      "#technicalVolume"
    ),

  technicalNetWeight:
    document.querySelector(
      "#technicalNetWeight"
    ),

  technicalGrossWeight:
    document.querySelector(
      "#technicalGrossWeight"
    ),

  technicalProductionTerm:
    document.querySelector(
      "#technicalProductionTerm"
    ),

  packagingName:
    document.querySelector(
      "#packagingName"
    ),

  packagingArea:
    document.querySelector(
      "#packagingArea"
    ),

  packagingRate:
    document.querySelector(
      "#packagingRate"
    ),

  packagingMultiplier:
    document.querySelector(
      "#packagingMultiplier"
    ),

  packagingTotal:
    document.querySelector(
      "#packagingTotal"
    ),

  packagingNote:
    document.querySelector(
      "#packagingNote"
    ),

  servicesList:
    document.querySelector(
      "#servicesList"
    ),

  servicesComment:
    document.querySelector(
      "#servicesComment"
    ),

  itemFilesList:
    document.querySelector(
      "#itemFilesList"
    ),

  filesList:
    document.querySelector(
      "#filesList"
    ),

  itemCommentsList:
    document.querySelector(
      "#itemCommentsList"
    ),

  orderRequirements:
    document.querySelector(
      "#orderRequirements"
    ),

  managerComment:
    document.querySelector(
      "#managerComment"
    ),

  averageUnitPrice:
    document.querySelector(
      "#averageUnitPrice"
    ),

  averageM2Price:
    document.querySelector(
      "#averageM2Price"
    ),

  itemsTotalBeforeDiscount:
    document.querySelector(
      "#itemsTotalBeforeDiscount"
    ),

  itemsDiscountTotal:
    document.querySelector(
      "#itemsDiscountTotal"
    ),

  itemsTotal:
    document.querySelector(
      "#itemsTotal"
    ),

  summaryPackagingTotal:
    document.querySelector(
      "#summaryPackagingTotal"
    ),

  summaryServicesTotal:
    document.querySelector(
      "#summaryServicesTotal"
    ),

  finalTotal:
    document.querySelector(
      "#finalTotal"
    ),

  finalVat:
    document.querySelector(
      "#finalVat"
    ),

  printBtn:
    document.querySelector(
      "#printBtn"
    ),

  newOrderBtn:
    document.querySelector(
      "#newOrderBtn"
    )
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
    .filter(
      (item) =>
        item !== undefined &&
        item !== null &&
        String(item).trim() !== ""
    )
    .map((item) =>
      escapeHtml(item)
    )
    .join("<br>");
}

function formatMoney(value) {
  return new Intl.NumberFormat(
    "ru-RU",
    {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0
    }
  ).format(Number(value) || 0);
}

function formatNumber(
  value,
  digits = 2
) {
  return new Intl.NumberFormat(
    "ru-RU",
    {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }
  ).format(Number(value) || 0);
}

function formatFileSize(size) {
  const bytes =
    Number(size) || 0;

  if (bytes <= 0) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} Б`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${formatNumber(
      bytes / 1024,
      1
    )} КБ`;
  }

  return `${formatNumber(
    bytes /
      (1024 * 1024),
    1
  )} МБ`;
}

function readJsonFromStorage(
  key,
  fallback
) {
  try {
    return JSON.parse(
      sessionStorage.getItem(key) ||
        JSON.stringify(fallback)
    );
  } catch (error) {
    return fallback;
  }
}

function getItems() {
  const items =
    readJsonFromStorage(
      storageKeys.items,
      []
    );

  return Array.isArray(items)
    ? items
    : [];
}

function getOrderMeta() {
  return readJsonFromStorage(
    storageKeys.orderMeta,
    {
      number: "—",
      date: "—",
      status: "Черновик"
    }
  );
}

function getOrderOptions() {
  return readJsonFromStorage(
    storageKeys.orderOptions,
    null
  );
}

function getOrderDetails() {
  return readJsonFromStorage(
    storageKeys.orderDetails,
    null
  );
}

function getPluralLabel(
  count,
  one,
  few,
  many
) {
  const abs =
    Math.abs(count);

  const lastDigit =
    abs % 10;

  const lastTwoDigits =
    abs % 100;

  if (
    lastTwoDigits >= 11 &&
    lastTwoDigits <= 14
  ) {
    return many;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4
  ) {
    return few;
  }

  return many;
}

function getItemTotal(item) {
  return Number(item.total) || 0;
}

function getItemTotalBeforeDiscount(
  item
) {
  const value =
    Number(
      item.totalBeforeDiscount
    );

  if (
    Number.isFinite(value) &&
    value >= 0
  ) {
    return value;
  }

  return getItemTotal(item);
}

function getItemDiscountPercent(
  item
) {
  const value =
    Number(
      item.discountPercent
    ) || 0;

  return Math.min(
    Math.max(value, 0),
    100
  );
}

function getItemDiscountAmount(item) {
  const savedValue =
    Number(
      item.discountAmount
    );

  if (
    Number.isFinite(savedValue) &&
    savedValue >= 0
  ) {
    return savedValue;
  }

  return Math.round(
    getItemTotalBeforeDiscount(item) *
      getItemDiscountPercent(item) /
      100
  );
}

function getItemsTotals(items) {
  return items.reduce(
    (acc, item) => {
      acc.totalBeforeDiscount +=
        getItemTotalBeforeDiscount(
          item
        );

      acc.discountAmount +=
        getItemDiscountAmount(
          item
        );

      acc.total +=
        getItemTotal(item);

      acc.vat +=
        getItemVat(item);

      return acc;
    },
    {
      totalBeforeDiscount: 0,
      discountAmount: 0,
      total: 0,
      vat: 0
    }
  );
}

function getItemsTotal(items) {
  return getItemsTotals(
    items
  ).total;
}

function getItemVat(item) {
  return Number(item.vat) || 0;
}

function getProductName(item) {
  if (item.productName) {
    return item.productName;
  }

  if (
    item.productType === "flooring"
  ) {
    return "Инженерная доска";
  }

  if (
    item.productType === "facades"
  ) {
    return "Мебельные фасады";
  }

  if (
    item.productType === "panels"
  ) {
    return "Интерьерные панели";
  }

  return "Изделие";
}

function getItemParamsText(item) {
  if (
    item.productType === "flooring"
  ) {
    const parts = [];

    if (
      item.selectedPattern?.name
    ) {
      parts.push(
        item.selectedPattern.name
      );
    }

    if (item.topLayer) {
      parts.push(
        `верхний слой ${item.topLayer}`
      );
    }

    if (item.thickness) {
      parts.push(
        `толщина ${item.thickness} мм`
      );
    }

    return parts.length
      ? joinLines(parts)
      : "—";
  }

  const parts = [];

  if (item.base) {
    parts.push(item.base);
  }

  if (item.thickness) {
    parts.push(
      item.thickness
    );
  }

  if (item.veneeredSides) {
    parts.push(
      `${item.veneeredSides} сторон(а) фанеровки`
    );
  }

  if (
    item.sizeType === "standard" &&
    item.standardPriceApplied
  ) {
    parts.push(
      "стандартная цена по таблице"
    );
  }

  if (
    item.sizeType === "custom"
  ) {
    parts.push(
      "нестандартный расчёт"
    );
  }

  if (
    item.textureTransition === "yes"
  ) {
    parts.push(
      "переход текстуры"
    );
  }

  return parts.length
    ? joinLines(parts)
    : "—";
}

function getItemSizeText(item) {
  if (
    item.productType === "flooring"
  ) {
    const parts = [];

    if (item.roomArea) {
      parts.push(
        `помещение ${formatNumber(
          item.roomArea
        )} м²`
      );
    }

    if (item.paidArea) {
      parts.push(
        `к оплате ${formatNumber(
          item.paidArea
        )} м²`
      );
    }

    if (
      item.length ||
      item.width ||
      item.thickness
    ) {
      const length =
        item.length || "—";

      const width =
        item.width || "—";

      const thickness =
        item.thickness || "—";

      parts.push(
        `${length} × ${width} × ${thickness} мм`
      );
    }

    return parts.length
      ? joinLines(parts)
      : "—";
  }

  const parts = [];

  if (
    item.length &&
    item.width
  ) {
    parts.push(
      `${item.length} × ${item.width} мм`
    );
  }

  if (item.quantity) {
    parts.push(
      `${item.quantity} шт.`
    );
  }

  if (item.area) {
    parts.push(
      `${formatNumber(
        item.area,
        3
      )} м²`
    );
  }

  if (item.sizeTypeLabel) {
    parts.push(
      item.sizeTypeLabel
    );
  }

  return parts.length
    ? joinLines(parts)
    : "—";
}

function getItemMaterialText(item) {
  if (
    item.productType === "flooring"
  ) {
    const parts = [];

    if (item.materialType) {
      parts.push(
        item.materialType
      );
    }

    if (item.species) {
      parts.push(
        item.species
      );
    }

    if (item.pricePerM2) {
      parts.push(
        `${formatMoney(
          item.pricePerM2
        )} / м²`
      );
    }

    if (
      item.selectedCoating?.name
    ) {
      parts.push(
        item.selectedCoating.name
      );
    }

    return parts.length
      ? joinLines(parts)
      : "—";
  }

  const parts = [];

  if (item.veneerA?.name) {
    parts.push(
      `А: ${item.veneerA.name}`
    );
  }

  if (item.sideB) {
    parts.push(
      `Б: ${item.sideB}`
    );
  }

  if (item.fiberDirection) {
    parts.push(
      `волокна: ${getFiberDirectionLabel(
        item.fiberDirection
      )}`
    );
  }

  if (item.veneerLayout) {
    parts.push(
      `раскладка: ${getVeneerLayoutLabel(
        item.veneerLayout
      )}`
    );
  }

  if (
    item.premiumVeneerApplied
  ) {
    parts.push(
      "шпон > 1 000 ₽/м², коэффициент ×2"
    );
  }

  return parts.length
    ? joinLines(parts)
    : "—";
}

function getFiberDirectionLabel(
  value
) {
  const labels = {
    length: "по длине",
    width: "по ширине",
    custom: "по ТЗ"
  };

  return labels[value] || value;
}

function getVeneerLayoutLabel(
  value
) {
  const labels = {
    not_set: "не задана",
    book: "книжка",
    straight: "прямая",
    straight_shifted:
      "прямая с перекладкой",
    mixed: "смешанная / микс",
    custom: "по ТЗ",
    radial: "радиал",
    tangent: "тангенс",
    mixmatch: "MixMatch",
    bookmatch: "BookMatch"
  };

  return labels[value] || value;
}

function getItemExtrasText(item) {
  if (
    item.productType === "flooring"
  ) {
    const parts = [];

    if (
      item.wastePercent !==
        undefined &&
      item.wastePercent !== null
    ) {
      parts.push(
        `отходы ${formatNumber(
          item.wastePercent,
          1
        )}%`
      );
    }

    return parts.length
      ? joinLines(parts)
      : "—";
  }

  const parts = [];

  if (item.cuttingAdded) {
    const cuttingMode =
      item.cuttingModeLabel
        ? `, ${item.cuttingModeLabel}`
        : "";

    parts.push(
      `Раскрой: ${formatNumber(
        item.cuttingMeters
      )} пог. м${cuttingMode}`
    );
  }

  if (item.edgeCost > 0) {
    parts.push(
      `Кромка: ${formatNumber(
        item.edgeMeters
      )} пог. м`
    );
  }

  if (item.sandingCost > 0) {
    parts.push(
      "Шлифовка"
    );
  }

  if (
    item.finishCost > 0 ||
    item.lacquerCost > 0 ||
    (
      item.finishType &&
      item.finishType !== "none"
    )
  ) {
    parts.push(
      item.finishLabel ||
      "Финиш"
    );
  }

  if (
    item.extrasWarnings?.length
  ) {
    parts.push(
      ...item.extrasWarnings
    );
  }

  if (item.notes?.length) {
    parts.push(
      ...item.notes
    );
  }

  return parts.length
    ? joinLines(parts)
    : "—";
}

function getItemArea(item) {
  if (
    item.productType === "flooring"
  ) {
    return (
      Number(item.paidArea) ||
      Number(item.areaWithWaste) ||
      Number(item.area) ||
      0
    );
  }

  return Number(item.area) || 0;
}

function getItemQuantity(item) {
  if (
    item.productType === "flooring"
  ) {
    return 1;
  }

  return (
    Number(item.quantity) || 1
  );
}

function getItemUnitPrice(item) {
  if (item.unitPrice) {
    return (
      Number(item.unitPrice) || 0
    );
  }

  const quantity =
    getItemQuantity(item);

  return quantity
    ? Math.round(
        getItemTotal(item) /
          quantity
      )
    : getItemTotal(item);
}

function getItemPricePerM2(item) {
  if (item.pricePerM2) {
    return (
      Number(item.pricePerM2) || 0
    );
  }

  const area =
    getItemArea(item);

  return area
    ? Math.round(
        getItemTotal(item) /
          area
      )
    : 0;
}

function getItemDetailsTotal(item) {
  return (
    Number(item.detailsTotal) ||
    getItemTotal(item)
  );
}

function getItemThickness(item) {
  if (
    item.productType === "flooring"
  ) {
    return (
      Number(item.thickness) || 14
    );
  }

  if (item.numericThickness) {
    return Number(
      item.numericThickness
    );
  }

  if (item.thicknessValue) {
    const parsed = parseFloat(
      String(
        item.thicknessValue
      ).replace(",", ".")
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  if (item.thickness) {
    const parsed = parseFloat(
      String(
        item.thickness
      ).replace(",", ".")
    );

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function getItemVolume(item) {
  const area =
    getItemArea(item);

  const thickness =
    getItemThickness(item);

  return area && thickness
    ? area * thickness / 1000
    : 0;
}

function getItemDensity(item) {
  if (
    item.productType === "flooring"
  ) {
    return 650;
  }

  const base =
    String(item.base || "");

  const matched =
    densityByBase.find(
      (entry) =>
        base.includes(
          entry.includes
        )
    );

  return matched?.density || 800;
}

function getPackagingWeightMultiplier(
  options
) {
  const packaging =
    options?.packaging;

  if (!packaging?.enabled) {
    return 0;
  }

  if (
    packaging.type === "hard"
  ) {
    return 1;
  }

  return 0;
}

function getItemNetWeight(item) {
  const volume =
    getItemVolume(item);

  const density =
    getItemDensity(item);

  return volume * density;
}

function getItemGrossWeight(
  item,
  options
) {
  const netWeight =
    getItemNetWeight(item);

  const area =
    getItemArea(item);

  const packagingMultiplier =
    getPackagingWeightMultiplier(
      options
    );

  return (
    netWeight +
    area *
      PACKAGING_WEIGHT_PER_M2 *
      packagingMultiplier
  );
}

function itemHasFinish(item) {
  return Boolean(
    item.productType !== "flooring" &&
    (
      (
        item.finishType &&
        item.finishType !== "none"
      ) ||
      item.finishCost > 0 ||
      item.lacquerCost > 0 ||
      item.lacquerNeeded === "yes"
    )
  );
}

function itemHasAdditionalOperations(
  item
) {
  if (
    item.productType === "flooring"
  ) {
    return false;
  }

  return Boolean(
    item.radiusPanel === "yes" ||
    item.panelOperations ||
    item.hinges === "yes" ||
    (
      item.handleType &&
      item.handleType !== "none"
    ) ||
    item.facadeOperations
  );
}

function getItemProductionTerm(
  item
) {
  if (item.productionTerm) {
    return item.productionTerm;
  }

  if (
    item.productType === "flooring"
  ) {
    return "1,5 месяца";
  }

  if (
    itemHasAdditionalOperations(
      item
    )
  ) {
    return "от 25 раб. дней";
  }

  if (itemHasFinish(item)) {
    return "от 20 раб. дней";
  }

  if (
    item.sizeType === "custom"
  ) {
    return "12–15 раб. дней";
  }

  return "7–9 раб. дней";
}

function getProductionTermRank(
  term
) {
  if (
    term.includes("1,5 месяца")
  ) {
    return 5;
  }

  if (term.includes("от 25")) {
    return 4;
  }

  if (term.includes("от 20")) {
    return 3;
  }

  if (term.includes("12–15")) {
    return 2;
  }

  if (term.includes("7–9")) {
    return 1;
  }

  return 0;
}

function getOrderProductionTerm(
  items
) {
  const terms = [
    ...new Set(
      items.map(
        getItemProductionTerm
      )
    )
  ];

  if (!terms.length) {
    return "—";
  }

  return terms
    .sort(
      (a, b) =>
        getProductionTermRank(b) -
        getProductionTermRank(a)
    )
    .join("; ");
}

function getTechnicalTotals(
  items,
  options
) {
  return items.reduce(
    (acc, item) => {
      acc.area +=
        getItemArea(item);

      acc.volume +=
        getItemVolume(item);

      acc.netWeight +=
        getItemNetWeight(item);

      acc.grossWeight +=
        getItemGrossWeight(
          item,
          options
        );

      acc.quantity +=
        getItemQuantity(item);

      return acc;
    },
    {
      area: 0,
      volume: 0,
      netWeight: 0,
      grossWeight: 0,
      quantity: 0,
      productionTerm:
        getOrderProductionTerm(
          items
        )
    }
  );
}

function getFinalTotals(
  items,
  options
) {
  const itemTotals =
    getItemsTotals(items);

  const packagingTotal =
    Number(
      options?.packaging?.total
    ) || 0;

  const servicesTotal =
    Number(
      options?.services?.total
    ) || 0;

  const optionsTotal =
    packagingTotal +
    servicesTotal;

  const calculatedFinalTotal =
    itemTotals.total +
    optionsTotal;

  const savedFinalTotal =
    Number(
      options?.finalTotal
    );

  const savedItemsTotal =
    Number(
      options?.itemsTotal
    );

  const finalTotal =
    Number.isFinite(savedFinalTotal) &&
    (
      !Number.isFinite(
        savedItemsTotal
      ) ||
      savedItemsTotal ===
        itemTotals.total
    )
      ? savedFinalTotal
      : calculatedFinalTotal;

  const savedVat =
    Number(options?.vat);

  const vat =
    Number.isFinite(savedVat) &&
    finalTotal === savedFinalTotal
      ? savedVat
      : Math.round(
          finalTotal *
            VAT_RATE /
            (1 + VAT_RATE)
        );

  const totalArea =
    items.reduce(
      (sum, item) =>
        sum +
        getItemArea(item),
      0
    );

  const totalQuantity =
    items.reduce(
      (sum, item) =>
        sum +
        getItemQuantity(item),
      0
    );

  const averageUnitPrice =
    totalQuantity
      ? Math.round(
          itemTotals.total /
            totalQuantity
        )
      : 0;

  const averageM2Price =
    totalArea
      ? Math.round(
          itemTotals.total /
            totalArea
        )
      : 0;

  return {
    itemsTotalBeforeDiscount:
      itemTotals.totalBeforeDiscount,

    itemsDiscountTotal:
      itemTotals.discountAmount,

    itemsTotal:
      itemTotals.total,

    itemsVat:
      itemTotals.vat,

    packagingTotal,
    servicesTotal,
    optionsTotal,
    finalTotal,
    vat,
    totalArea,
    totalQuantity,
    averageUnitPrice,
    averageM2Price
  };
}

function getItemComment(item) {
  if (
    item.productType === "flooring"
  ) {
    return item.comment || "";
  }

  return item.orderComment || "";
}

function getItemFiles(item) {
  return Array.isArray(
    item.attachedFiles
  )
    ? item.attachedFiles
    : [];
}

function getItemFilesHtml(
  items
) {
  const rows = [];

  items.forEach(
    (item, itemIndex) => {
      const files =
        getItemFiles(item);

      files.forEach((file) => {
        const fileName =
          file?.name ||
          "Файл без названия";

        const fileSize =
          formatFileSize(
            file?.size
          );

        rows.push(`
          <div class="final-service-row">
            <span>
              Позиция ${itemIndex + 1},
              ${escapeHtml(
                getProductName(item)
              )}:
              ${escapeHtml(fileName)}
            </span>

            ${
              fileSize
                ? `<small>${escapeHtml(
                    fileSize
                  )}</small>`
                : ""
            }
          </div>
        `);
      });
    }
  );

  return rows.join("");
}

function getItemCommentsHtml(
  items
) {
  const rows = items
    .map((item, index) => {
      const comment =
        getItemComment(item);

      if (!comment) {
        return "";
      }

      return `
        <div class="final-service-row">
          <span>
            Позиция ${index + 1},
            ${escapeHtml(
              getProductName(item)
            )}
          </span>

          <strong>
            ${escapeHtml(comment)}
          </strong>
        </div>
      `;
    })
    .filter(Boolean);

  return rows.join("");
}

function renderHeader(
  meta,
  items
) {
  const itemLabel =
    getPluralLabel(
      items.length,
      "позиция",
      "позиции",
      "позиций"
    );

  elements.orderNumber.textContent =
    meta.number || "—";

  elements.orderStatus.textContent =
    meta.status || "Черновик";

  elements.metaOrderNumber.textContent =
    meta.number || "—";

  elements.metaOrderDate.textContent =
    meta.date || "—";

  elements.metaOrderStatus.textContent =
    meta.status || "Черновик";

  elements.metaItemsCount.textContent =
    `${items.length} ${itemLabel}`;
}

function renderManager(details) {
  elements.managerName.textContent =
    details?.manager?.name ||
    "—";

  elements.managerBranch.textContent =
    details?.manager?.branchName ||
    "—";
}

function renderClient(details) {
  const client =
    details?.client || {};

  elements.clientName.textContent =
    client.name || "—";

  elements.clientType.textContent =
    client.typeName || "—";

  elements.clientPhone.textContent =
    client.phone || "—";

  elements.clientEmail.textContent =
    client.email || "—";

  const isCompany =
    client.type === "company";

  elements.companyRow.classList.toggle(
    "is-hidden",
    !isCompany
  );

  elements.innRow.classList.toggle(
    "is-hidden",
    !isCompany
  );

  elements.clientCompany.textContent =
    client.companyName || "—";

  elements.clientInn.textContent =
    client.inn || "—";
}

function getItemDiscountHtml(item) {
  const discountPercent =
    getItemDiscountPercent(item);

  const discountAmount =
    getItemDiscountAmount(item);

  if (
    discountPercent <= 0 ||
    discountAmount <= 0
  ) {
    return "—";
  }

  return `
    <strong>
      ${formatNumber(
        discountPercent,
        1
      )}%
    </strong>

    <small>
      −${formatMoney(
        discountAmount
      )}
    </small>
  `;
}

function renderItems(
  items,
  options
) {
  if (!items.length) {
    elements.itemsTableBody.innerHTML = `
      <tr>
        <td colspan="16">
          Позиции заказа не найдены.
        </td>
      </tr>
    `;

    return;
  }

  elements.itemsTableBody.innerHTML =
    items
      .map((item, index) => {
        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              <strong>
                ${escapeHtml(
                  getProductName(item)
                )}
              </strong>
            </td>

            <td>
              ${getItemParamsText(item)}
            </td>

            <td>
              ${getItemSizeText(item)}
            </td>

            <td>
              ${getItemMaterialText(item)}
            </td>

            <td>
              ${getItemExtrasText(item)}
            </td>

            <td>
              ${formatNumber(
                getItemQuantity(item),
                0
              )} шт.
            </td>

            <td>
              ${formatNumber(
                getItemArea(item),
                3
              )} м²
            </td>

            <td>
              ${formatMoney(
                getItemUnitPrice(item)
              )}
            </td>

            <td>
              ${formatMoney(
                getItemPricePerM2(item)
              )}
            </td>

            <td>
              ${formatMoney(
                getItemTotalBeforeDiscount(
                  item
                )
              )}
            </td>

            <td>
              ${getItemDiscountHtml(
                item
              )}
            </td>

            <td>
              <strong>
                ${formatMoney(
                  getItemDetailsTotal(
                    item
                  )
                )}
              </strong>

              <small>
                НДС:
                ${formatMoney(
                  getItemVat(item)
                )}
              </small>
            </td>

            <td>
              ${formatNumber(
                getItemVolume(item),
                3
              )} м³
            </td>

            <td>
              <strong>
                ${formatNumber(
                  getItemNetWeight(item),
                  2
                )} кг
              </strong>

              <small>
                брутто:
                ${formatNumber(
                  getItemGrossWeight(
                    item,
                    options
                  ),
                  2
                )} кг
              </small>
            </td>

            <td>
              ${escapeHtml(
                getItemProductionTerm(
                  item
                )
              )}
            </td>
          </tr>
        `;
      })
      .join("");
}

function renderTechnicalTotals(
  items,
  options
) {
  const totals =
    getTechnicalTotals(
      items,
      options
    );

  elements.technicalArea.textContent =
    `${formatNumber(
      totals.area,
      3
    )} м²`;

  elements.technicalVolume.textContent =
    `${formatNumber(
      totals.volume,
      3
    )} м³`;

  elements.technicalNetWeight.textContent =
    `${formatNumber(
      totals.netWeight,
      2
    )} кг`;

  elements.technicalGrossWeight.textContent =
    `${formatNumber(
      totals.grossWeight,
      2
    )} кг`;

  elements.technicalProductionTerm.textContent =
    totals.productionTerm;
}

function renderPackaging(options) {
  const packaging =
    options?.packaging;

  if (
    !packaging ||
    !packaging.enabled
  ) {
    elements.packagingName.textContent =
      "Не выбрана";

    elements.packagingArea.textContent =
      "—";

    elements.packagingRate.textContent =
      "—";

    elements.packagingMultiplier.textContent =
      "—";

    elements.packagingTotal.textContent =
      formatMoney(0);

    elements.packagingNote.textContent =
      "Упаковка не добавлена к заказу.";

    return;
  }

  elements.packagingName.textContent =
    packaging.name ||
    "Упаковка";

  elements.packagingArea.textContent =
    `${formatNumber(
      packaging.area,
      3
    )} м²`;

  elements.packagingRate.textContent =
    packaging.rate
      ? `${formatMoney(
          packaging.rate
        )} / м²`
      : "—";

  elements.packagingMultiplier.textContent =
    packaging.multiplier
      ? `× ${formatNumber(
          packaging.multiplier,
          1
        )}`
      : "—";

  elements.packagingTotal.textContent =
    formatMoney(
      packaging.total
    );

  elements.packagingNote.textContent =
    packaging.note ||
    "Тариф упаковки требует проверки менеджером.";
}

function renderServices(options) {
  const services =
    options?.services?.items || [];

  const comment =
    options?.services?.comment || "";

  if (!services.length) {
    elements.servicesList.textContent =
      "Услуги не выбраны.";
  } else {
    elements.servicesList.innerHTML =
      services
        .map((service) => {
          return `
            <div class="final-service-row">
              <span>
                ${escapeHtml(
                  service.name
                )}
              </span>

              <strong>
                ${formatMoney(
                  service.total
                )}
              </strong>

              ${
                service.isDemoRate
                  ? "<small>Демонстрационный тариф прототипа</small>"
                  : ""
              }
            </div>
          `;
        })
        .join("");
  }

  elements.servicesComment.textContent =
    comment
      ? `Комментарий: ${comment}`
      : "Комментарий к услугам не указан.";
}

function renderFilesAndComments(
  items,
  details
) {
  const itemFilesHtml =
    getItemFilesHtml(items);

  elements.itemFilesList.innerHTML =
    itemFilesHtml ||
    "—";

  const orderFiles =
    details?.files || [];

  if (!orderFiles.length) {
    elements.filesList.textContent =
      "—";
  } else {
    elements.filesList.innerHTML =
      orderFiles
        .map((file) => {
          const fileName =
            file?.name ||
            "Файл без названия";

          const fileSize =
            formatFileSize(
              file?.size
            );

          return fileSize
            ? `${escapeHtml(
                fileName
              )} (${escapeHtml(
                fileSize
              )})`
            : escapeHtml(
                fileName
              );
        })
        .join("<br>");
  }

  const commentsHtml =
    getItemCommentsHtml(items);

  elements.itemCommentsList.innerHTML =
    commentsHtml ||
    "—";

  elements.orderRequirements.textContent =
    details?.order?.requirements ||
    "—";

  elements.managerComment.textContent =
    details?.order?.managerComment ||
    "—";
}

function renderTotals(
  items,
  options
) {
  const totals =
    getFinalTotals(
      items,
      options
    );

  elements.averageUnitPrice.textContent =
    formatMoney(
      totals.averageUnitPrice
    );

  elements.averageM2Price.textContent =
    formatMoney(
      totals.averageM2Price
    );

  elements.itemsTotalBeforeDiscount.textContent =
    formatMoney(
      totals.itemsTotalBeforeDiscount
    );

  elements.itemsDiscountTotal.textContent =
    totals.itemsDiscountTotal > 0
      ? `−${formatMoney(
          totals.itemsDiscountTotal
        )}`
      : formatMoney(0);

  elements.itemsTotal.textContent =
    formatMoney(
      totals.itemsTotal
    );

  elements.summaryPackagingTotal.textContent =
    formatMoney(
      totals.packagingTotal
    );

  elements.summaryServicesTotal.textContent =
    formatMoney(
      totals.servicesTotal
    );

  elements.finalTotal.textContent =
    formatMoney(
      totals.finalTotal
    );

  elements.finalVat.textContent =
    formatMoney(
      totals.vat
    );
}

function printPage() {
  window.print();
}

function startNewOrder() {
  const confirmed =
    window.confirm(
      "Начать новый расчёт? Текущие данные будут очищены."
    );

  if (!confirmed) {
    return;
  }

  sessionStorage.removeItem(
    storageKeys.items
  );

  sessionStorage.removeItem(
    storageKeys.orderMeta
  );

  sessionStorage.removeItem(
    storageKeys.orderOptions
  );

  sessionStorage.removeItem(
    storageKeys.orderDetails
  );

  sessionStorage.removeItem(
    "woodstockPanelsFacadesCalculation"
  );

  sessionStorage.removeItem(
    "woodstockFlooringCalculation"
  );

  sessionStorage.removeItem(
    "woodstockEditItem"
  );

  sessionStorage.removeItem(
    "woodstockEditIndex"
  );

  window.location.href =
    "../index.html";
}

function renderPage() {
  const meta =
    getOrderMeta();

  const items =
    getItems();

  const options =
    getOrderOptions();

  const details =
    getOrderDetails();

  renderHeader(
    meta,
    items
  );

  renderManager(details);
  renderClient(details);

  renderItems(
    items,
    options
  );

  renderTechnicalTotals(
    items,
    options
  );

  renderPackaging(options);
  renderServices(options);

  renderFilesAndComments(
    items,
    details
  );

  renderTotals(
    items,
    options
  );
}

function initEvents() {
  elements.printBtn.addEventListener(
    "click",
    printPage
  );

  elements.newOrderBtn.addEventListener(
    "click",
    startNewOrder
  );
}

initEvents();
renderPage();