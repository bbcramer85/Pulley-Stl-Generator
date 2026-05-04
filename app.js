const projectConfigs = {
  flatBeltPulley: {
    label: "Flat Belt Pulley",
    defaults: pulleyDefaults,
    controlGroups: pulleyControlGroups,
    validate: validatePulley,
    generate: generatePulleyMesh,
    metrics: pulleyMetricRows,
    filePrefix: "flatbelt-pulley",
    stlName: "flatbelt_pulley",
    fileDimensionKey: "diameter",
  },
  vBeltPulley: {
    label: "V-Belt Pulley",
    defaults: vBeltPulleyDefaults,
    controlGroups: vBeltPulleyControlGroups,
    validate: validateVBeltPulley,
    generate: generateVBeltPulleyMesh,
    metrics: vBeltPulleyMetricRows,
    filePrefix: "vbelt-pulley",
    stlName: "vbelt_pulley",
    fileDimensionKey: "vOuterDiameter",
  },
  sprocket: {
    label: "Sprocket",
    defaults: sprocketDefaults,
    controlGroups: sprocketControlGroups,
    validate: validateSprocket,
    generate: generateSprocketMesh,
    metrics: sprocketMetricRows,
    filePrefix: "sprocket",
    stlName: "sprocket",
    fileDimensionKey: "sprocketToothCount",
  },
  straightCutGear: {
    label: "Straight Cut Gear",
    defaults: straightCutGearDefaults,
    controlGroups: straightCutGearControlGroups,
    validate: validateStraightCutGear,
    generate: generateStraightCutGearMesh,
    metrics: straightCutGearMetricRows,
    filePrefix: "straight-cut-gear",
    stlName: "straight_cut_gear",
    fileDimensionKey: "gearToothCount",
  },
  bevelGear: {
    label: "Bevel Gear",
    defaults: bevelGearDefaults,
    controlGroups: bevelGearControlGroups,
    validate: validateBevelGear,
    generate: generateBevelGearMesh,
    metrics: bevelGearMetricRows,
    filePrefix: "bevel-gear",
    stlName: "bevel_gear",
    fileDimensionKey: "bevelToothCount",
  },
  shaftSpacer: {
    label: "Shaft Spacer",
    defaults: shaftSpacerDefaults,
    controlGroups: shaftSpacerControlGroups,
    validate: validateShaftSpacer,
    generate: generateShaftSpacerMesh,
    metrics: shaftSpacerMetricRows,
    filePrefix: "shaft-spacer",
    stlName: "shaft_spacer",
    fileDimensionKey: "spacerOuterDiameter",
  },
  headGasket: {
    label: "Head Gasket",
    defaults: headGasketDefaults,
    controlGroups: headGasketControlGroups,
    validate: validateHeadGasket,
    generate: generateHeadGasketDxf,
    metrics: headGasketMetricRows,
    filePrefix: "head-gasket",
    stlName: "head_gasket",
    fileDimensionKey: "gasketOuterDiameter",
    exportType: "dxf",
    downloadLabel: "Download DXF",
    previewTitle: "2D DXF View",
  },
  ignitorGasket: {
    label: "Ignitor Gasket",
    defaults: ignitorGasketDefaults,
    controlGroups: ignitorGasketControlGroups,
    validate: validateIgnitorGasket,
    generate: generateIgnitorGasketDxf,
    metrics: ignitorGasketMetricRows,
    filePrefix: "ignitor-gasket",
    stlName: "ignitor_gasket",
    fileDimensionKey: "ignitorCenterCircleDiameter",
    exportType: "dxf",
    downloadLabel: "Download DXF",
    previewTitle: "2D DXF View",
  },
  dripOilerGasket: {
    label: "Drip Oiler Gasket",
    defaults: dripOilerGasketDefaults,
    controlGroups: dripOilerGasketControlGroups,
    validate: validateDripOilerGasket,
    generate: generateDripOilerGasketDxf,
    metrics: dripOilerGasketMetricRows,
    filePrefix: "drip-oiler-gasket",
    stlName: "drip_oiler_gasket",
    fileDimensionKey: "dripOilerOuterDiameter",
    exportType: "dxf",
    downloadLabel: "Download DXF",
    previewTitle: "2D DXF View",
  },
};

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function buildFieldMap(groups) {
  return new Map(groups.flatMap((group) => group.fields).map((field) => [field.key, field]));
}

let activeProjectKey = "flatBeltPulley";
let activeProject = projectConfigs[activeProjectKey];
let defaults = activeProject.defaults;
let controlGroups = activeProject.controlGroups;
let fieldMap = buildFieldMap(controlGroups);

const state = {
  project: "flatBeltPulley",
  unit: "in",
  mesh: null,
  derived: null,
  warnings: [],
  view: {
    rotX: -0.58,
    rotZ: 0.72,
    zoom: 1,
    showDxfDimensions: false,
    dragging: false,
    dragMoved: false,
    lastX: 0,
    lastY: 0,
  },
  headGasket: {
    deletedBoltIndices: new Set(),
    deletedSlotIndices: new Set(),
  },
};

const controls = document.querySelector("#controls");
const canvas = document.querySelector("#previewCanvas");
const ctx = canvas.getContext("2d");
const metrics = document.querySelector("#metrics");
const statusEl = document.querySelector("#status");
const projectTitle = document.querySelector("#projectTitle");
const previewHeading = document.querySelector("#previewHeading");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");
const zoomOutButton = document.querySelector("#zoomOutButton");
const resetViewButton = document.querySelector("#resetViewButton");
const zoomInButton = document.querySelector("#zoomInButton");
const primaryAffiliateCard = document.querySelector("#primaryAffiliateCard");
const primaryAffiliateImage = document.querySelector("#primaryAffiliateImage");
const primaryAffiliateText = document.querySelector("#primaryAffiliateText");
const secondaryAffiliateCard = document.querySelector("#secondaryAffiliateCard");
const secondaryAffiliateImage = document.querySelector("#secondaryAffiliateImage");
const secondaryAffiliateText = document.querySelector("#secondaryAffiliateText");
const projectButtons = document.querySelectorAll(".project-button");
let activeDimensionLabelBoxes = [];

const affiliateCardsByExportType = {
  stl: [
    {
      href: "https://amzn.to/3OBLLUC",
      image: "belt lacing.png",
      alt: "Belt lacing",
      text: "Belt fasteners",
      aria: "Open belt fastener product link",
    },
    {
      href: "https://amzn.to/4tJgLkM",
      image: "2 inch wide flat belt.png",
      alt: "2 inch wide flat belt",
      text: "2 inch wide flat belt",
      aria: "Open 2 inch wide flat belt product link",
    },
  ],
  dxf: [
    {
      href: "https://amzn.to/4tbXhEj",
      image: "laser.jpg",
      alt: "Laser cutter",
      text: "Laser cutting tool",
      aria: "Open laser product link",
    },
    {
      href: "https://amzn.to/3QB0waS",
      image: "gasket.jpg",
      alt: "Gasket material",
      text: "Gasket material",
      aria: "Open gasket material product link",
    },
  ],
};

const primaryAffiliateByProject = {
  vBeltPulley: {
    href: "https://amzn.to/4t7NhMc",
    image: "linkbelt.jpg",
    alt: "Link belt",
    text: "V-belt link belt",
    aria: "Open V-belt link belt product link",
  },
  sprocket: {
    href: "https://amzn.to/4n4oUNW",
    image: "chain.jpg",
    alt: "Roller chain",
    text: "Roller chain",
    aria: "Open roller chain product link",
  },
  straightCutGear: {
    href: "https://amzn.to/4emyzxl",
    image: "bearing.jpg",
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
  bevelGear: {
    href: "https://amzn.to/4emyzxl",
    image: "bearing.jpg",
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
  shaftSpacer: {
    href: "https://amzn.to/4emyzxl",
    image: "bearing.jpg",
    alt: "Bearing",
    text: "Bearings",
    aria: "Open bearing product link",
  },
};

const secondaryAffiliateByProject = {
  sprocket: {
    href: "https://amzn.to/4w4FJfP",
    image: "conveyorchain.jpg",
    alt: "Conveyor chain",
    text: "Conveyor chain",
    aria: "Open conveyor chain product link",
  },
  straightCutGear: {
    href: "https://amzn.to/3QWyJBG",
    image: "shaft.jpg",
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
  bevelGear: {
    href: "https://amzn.to/3QWyJBG",
    image: "shaft.jpg",
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
  shaftSpacer: {
    href: "https://amzn.to/3QWyJBG",
    image: "shaft.jpg",
    alt: "Shaft stock",
    text: "Shaft stock",
    aria: "Open shaft stock product link",
  },
};

function buildControls() {
  controls.innerHTML = "";

  const units = document.createElement("fieldset");
  units.innerHTML = `
    <legend>Units</legend>
    <div class="field">
      <span class="field-label">
        <span>Dimension units</span>
        <span class="hint">display units for editable dimensions</span>
      </span>
      <span class="segmented" role="radiogroup" aria-label="Dimension units">
        <input id="unitIn" name="unit" type="radio" value="in" ${state.unit === "in" ? "checked" : ""}>
        <label for="unitIn">Inch</label>
        <input id="unitMm" name="unit" type="radio" value="mm" ${state.unit === "mm" ? "checked" : ""}>
        <label for="unitMm">Metric</label>
      </span>
    </div>`;
  controls.appendChild(units);

  units.appendChild(buildDxfDimensionsToggleRow("dxfDimensionToggleRow", "dxfDimensionsToggle"));

  controlGroups.forEach((group) => {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = group.title;
    fieldset.appendChild(legend);

    group.fields.forEach((field) => {
      const row = document.createElement("label");
      row.className = "field";
      if (field.type === "select") {
        row.classList.add("field-select");
      }
      row.htmlFor = field.key;
      row.dataset.fieldKey = field.key;
      if (field.showWhen) {
        row.dataset.showWhenKey = field.showWhen.key;
        row.dataset.showWhenValue = field.showWhen.value;
      }

      const labelWrap = document.createElement("span");
      labelWrap.className = "field-label";
      labelWrap.innerHTML = `<span>${field.label}</span><span class="hint">${field.hint}</span>`;

      const inputWrap = buildInputControl(field);
      row.append(labelWrap, inputWrap);
      fieldset.appendChild(row);
    });

    if (group.title === "Spokes") {
      const styleRow = document.createElement("div");
      styleRow.className = "field";
      styleRow.innerHTML = `
        <span class="field-label">
          <span>Spoke style</span>
          <span class="hint">straight or swept between hub and rim</span>
        </span>
        <span class="segmented" role="radiogroup" aria-label="Spoke style">
          <input id="styleStraight" name="spokeStyle" type="radio" value="straight" ${defaults.spokeStyle === "straight" ? "checked" : ""}>
          <label for="styleStraight">Straight</label>
          <input id="styleCurved" name="spokeStyle" type="radio" value="curved" ${defaults.spokeStyle === "curved" ? "checked" : ""}>
          <label for="styleCurved">Curved</label>
        </span>`;
      fieldset.appendChild(styleRow);
    }

    controls.appendChild(fieldset);
  });

  controls.appendChild(buildDxfDimensionsToggleRow("dxfDimensionToggleRowBottom", "dxfDimensionsToggleBottom"));
  updateConditionalFields();
}

function buildDxfDimensionsToggleRow(rowId, inputId) {
  const row = document.createElement("label");
  row.id = rowId;
  row.className = "field";
  row.htmlFor = inputId;
  row.innerHTML = `
    <span class="field-label">
      <span>DXF dimensions</span>
      <span class="hint">show dimension callouts in preview</span>
    </span>
    <span class="checkbox-wrap">
      <input id="${inputId}" name="${inputId}" type="checkbox" data-dxf-dimensions-toggle="true" ${state.view.showDxfDimensions ? "checked" : ""}>
      <span>Show</span>
    </span>`;
  return row;
}

function buildInputControl(field) {
  if (field.type === "toggle") {
    const inputWrap = document.createElement("span");
    inputWrap.className = "checkbox-wrap";

    const input = document.createElement("input");
    input.id = field.key;
    input.name = field.key;
    input.type = "checkbox";
    input.checked = Boolean(defaults[field.key]);

    const text = document.createElement("span");
    text.textContent = "Enable";

    inputWrap.append(input, text);
    return inputWrap;
  }

  if (field.type === "select") {
    const inputWrap = document.createElement("span");
    inputWrap.className = "select-wrap";

    const select = document.createElement("select");
    select.id = field.key;
    select.name = field.key;
    field.options.forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = getSelectOptionLabel(field, optionValue);
      select.appendChild(option);
    });
    select.value = defaults[field.key];

    inputWrap.append(select);
    return inputWrap;
  }

  const inputWrap = document.createElement("span");
  inputWrap.className = "number-wrap";

  const input = document.createElement("input");
  input.id = field.key;
  input.name = field.key;
  input.type = "number";
  input.inputMode = "decimal";
  configureFieldForUnit(input, field);
  input.value = formatControlValue(defaults[field.key], field);

  const unit = document.createElement("span");
  unit.className = "unit";
  unit.dataset.unitFor = field.key;
  unit.textContent = field.unit ?? unitOptions[state.unit].label;

  inputWrap.append(input, unit);
  return inputWrap;
}

function getSelectOptionLabel(field, optionValue) {
  if (Object.prototype.hasOwnProperty.call(field.optionLabels || {}, optionValue)) {
    return field.optionLabels[optionValue];
  }

  if (field.key === "setScrewThread") return threadOptions[optionValue]?.label || optionValue;
  if (field.key === "hubPosition") return hubPositionOptions[optionValue]?.label || optionValue;
  if (field.key === "sprocketChainKey") return sprocketChainPresets[optionValue]?.label || optionValue;
  if (field.key === "ignitorStyle") return ignitorStyleOptions[optionValue]?.label || optionValue;
  if (field.key === "gearToothCount" || field.key === "bevelToothCount" || field.key === "bevelMatingToothCount") {
    return gearToothOptions[optionValue]?.label || optionValue;
  }
  if (field.key === "gearDiametralPitch" || field.key === "bevelDiametralPitch") {
    return gearDiametralPitchOptions[optionValue]?.label || optionValue;
  }
  if (field.key === "gearPressureAngle" || field.key === "bevelPressureAngle") {
    return gearPressureAngleOptions[optionValue]?.label || optionValue;
  }

  return optionValue;
}

function configureFieldForUnit(input, field) {
  if (field.type === "toggle" || field.type === "select") return;

  const isLength = field.unit === undefined;
  const factor = isLength ? unitOptions[state.unit].factorFromInch : 1;
  input.min = String(roundForUnit(field.min * factor, field));
  input.max = String(roundForUnit(field.max * factor, field));
  input.step = String(isLength ? roundForUnit(field.step * factor, field) : field.step);
}

function roundForUnit(value, field) {
  if (field.unit !== undefined) return value;
  return Number(value.toFixed(state.unit === "in" ? 4 : 3));
}

function formatControlValue(value, field) {
  if (field.type === "toggle" || field.type === "select") return String(value);
  if (field.key === "spokeCount") return String(Math.round(value));
  if (field.unit === "deg") return String(Math.round(value));
  return String(roundForUnit(value * unitOptions[state.unit].factorFromInch, field));
}

function readParams() {
  const params = {};
  Object.keys(defaults).forEach((key) => {
    if (key === "spokeStyle") {
      params[key] = controls.querySelector("input[name='spokeStyle']:checked")?.value || defaults.spokeStyle;
      return;
    }

    const input = controls.elements[key];
    const field = fieldMap.get(key);
    if (field?.type === "toggle") {
      params[key] = Boolean(input.checked);
      return;
    }

    if (field?.type === "select") {
      params[key] = input.value;
      return;
    }

    const value = Number.parseFloat(input.value);
    params[key] = Number.isFinite(value) ? value : Number(formatControlValue(defaults[key], field));
  });

  if ("spokeCount" in params) {
    params.spokeCount = Math.max(0, Math.round(params.spokeCount));
  }
  if ("sprocketToothCount" in params) {
    params.sprocketToothCount = Math.max(0, Math.round(params.sprocketToothCount));
  }
  if ("gearToothCount" in params) {
    params.gearToothCount = String(Math.max(0, Math.round(Number(params.gearToothCount))));
  }
  if ("gasketBoltCount" in params) {
    params.gasketBoltCount = Math.max(0, Math.round(params.gasketBoltCount));
  }
  if ("gasketSlotCount" in params) {
    params.gasketSlotCount = Math.max(0, Math.round(params.gasketSlotCount));
  }
  if (state.project === "headGasket") {
    params.deletedBoltIndices = [...state.headGasket.deletedBoltIndices];
    params.deletedSlotIndices = [...state.headGasket.deletedSlotIndices];
  }
  params.unitFactor = unitOptions[state.unit].factorFromInch;
  return params;
}

function resetControls() {
  setUnit("in", false);
  resetHeadGasketDeletedFeatures();
  Object.entries(defaults).forEach(([key, value]) => {
    if (key === "spokeStyle") {
      const radio = controls.querySelector(`input[name='spokeStyle'][value='${value}']`);
      if (radio) radio.checked = true;
      return;
    }

    const field = fieldMap.get(key);
    if (field?.type === "toggle") {
      controls.elements[key].checked = Boolean(value);
    } else {
      controls.elements[key].value = formatControlValue(value, field);
    }
  });
  updateConditionalFields();
  updateModel();
}

function updateConditionalFields() {
  controls.querySelectorAll("[data-show-when-key]").forEach((row) => {
    const controller = controls.elements[row.dataset.showWhenKey];
    const isActive = !controller || controller.value === row.dataset.showWhenValue;
    row.hidden = false;
    row.classList.toggle("field-inactive", !isActive);
    row.setAttribute("aria-disabled", String(!isActive));
    row.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !isActive;
    });
  });
}

function setUnit(nextUnit, convertExisting = true) {
  if (!unitOptions[nextUnit] || nextUnit === state.unit) return;

  const previousUnit = state.unit;
  state.unit = nextUnit;

  const unitRadio = controls.querySelector(`input[name='unit'][value='${nextUnit}']`);
  if (unitRadio) unitRadio.checked = true;

  controlGroups.flatMap((group) => group.fields).forEach((field) => {
    const input = controls.elements[field.key];
    if (!input) return;
    if (field.type === "toggle" || field.type === "select") return;

    if (field.unit === undefined && convertExisting) {
      const currentValue = Number.parseFloat(input.value);
      if (Number.isFinite(currentValue)) {
        const inches = currentValue / unitOptions[previousUnit].factorFromInch;
        input.value = formatControlValue(inches, field);
      }
    }

    configureFieldForUnit(input, field);
  });

  controls.querySelectorAll("[data-unit-for]").forEach((unitEl) => {
    const field = fieldMap.get(unitEl.dataset.unitFor);
    unitEl.textContent = field.unit ?? unitOptions[state.unit].label;
  });
}

function applySprocketChainPreset(chainKey) {
  const preset = sprocketChainPresets[chainKey];
  if (!preset) return;

  const linkedFields = {
    sprocketPitch: preset.pitch,
    sprocketRollerDiameter: preset.rollerDiameter,
    sprocketFaceWidth: preset.faceWidth,
    sprocketToothHeight: preset.toothHeight,
    sprocketRootClearance: preset.rootClearance,
  };

  Object.entries(linkedFields).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    const input = controls.elements[key];
    if (field && input) {
      input.value = formatControlValue(value, field);
    }
  });
}

function applyGearDiametralPitchPreset(diametralPitch) {
  const dp = Number(diametralPitch);
  if (!Number.isFinite(dp) || dp <= 0) return;

  const linkedFields = {
    gearAddendum: 1 / dp,
    gearDedendum: 1.25 / dp,
  };

  Object.entries(linkedFields).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    const input = controls.elements[key];
    if (field && input) {
      input.value = formatControlValue(value, field);
    }
  });
}

function applyBevelDiametralPitchPreset(diametralPitch) {
  const dp = Number(diametralPitch);
  if (!Number.isFinite(dp) || dp <= 0) return;

  const linkedFields = {
    bevelAddendum: 1 / dp,
    bevelDedendum: 1.25 / dp,
  };

  Object.entries(linkedFields).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    const input = controls.elements[key];
    if (field && input) {
      input.value = formatControlValue(value, field);
    }
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDimension(value) {
  const unit = unitOptions[state.unit];
  return `${value.toFixed(unit.decimals)} ${unit.label}`;
}

function updateModel() {
  try {
    pinDesktopViewport();
    const raw = readParams();
    const validated = activeProject.validate(raw);
    state.warnings = validated.warnings;
    state.mesh = activeProject.generate(validated.params);
    state.derived = state.mesh.derived;
    updateUiText();
    requestRender();
  } catch (error) {
    console.error(error);
    state.warnings = [
      activeProject.exportType === "dxf"
        ? "Unable to generate this drawing. Try reducing hole, slot, or bore sizes."
        : "Unable to generate this geometry. Try reducing spoke curve, spoke width, or radius.",
    ];
    statusEl.className = "status warning";
    statusEl.textContent = state.warnings[0];
    downloadButton.disabled = true;
  }
}

function pinDesktopViewport() {
  if (window.matchMedia("(min-width: 901px)").matches && (window.scrollX !== 0 || window.scrollY !== 0)) {
    window.scrollTo(0, 0);
  }
}

function updateUiText() {
  const d = state.derived;
  const blockingWarnings = state.warnings.filter(isBlockingWarning);
  downloadButton.textContent = activeProject.downloadLabel || "Download STL";
  updateDimensionToggleUi();
  updatePrimaryAffiliateCard();
  metrics.innerHTML = activeProject.metrics(d)
    .map(([label, value]) => `<span>${label}: ${value}</span>`)
    .join("");

  if (state.warnings.length > 0) {
    statusEl.className = blockingWarnings.length > 0 ? "status warning" : "status recommendation";
    statusEl.textContent = state.warnings.join(" ");
    downloadButton.disabled = blockingWarnings.length > 0;
    return;
  }

  statusEl.className = "status";
  statusEl.textContent = "Ready to export.";
  downloadButton.disabled = false;
}

function updatePrimaryAffiliateCard() {
  const cards = activeProject.exportType === "dxf" ? affiliateCardsByExportType.dxf : affiliateCardsByExportType.stl;
  const primaryCard = primaryAffiliateByProject[state.project] || cards[0];
  const secondaryCard = secondaryAffiliateByProject[state.project] || cards[1];
  updateAffiliateCard(primaryAffiliateCard, primaryAffiliateImage, primaryAffiliateText, primaryCard);
  updateAffiliateCard(secondaryAffiliateCard, secondaryAffiliateImage, secondaryAffiliateText, secondaryCard);
}

function updateAffiliateCard(link, image, text, card) {
  if (!link || !image || !text || !card) return;

  link.href = card.href;
  link.setAttribute("aria-label", card.aria);
  image.src = card.image;
  image.alt = card.alt;
  text.textContent = card.text;
}

function updateDimensionToggleUi() {
  const isDxf = activeProject.exportType === "dxf";
  const rows = controls.querySelectorAll("#dxfDimensionToggleRow, #dxfDimensionToggleRowBottom");
  const inputs = controls.querySelectorAll("[data-dxf-dimensions-toggle]");

  rows.forEach((row) => {
    row.hidden = !isDxf;
    row.classList.toggle("field-inactive", !isDxf);
    row.setAttribute("aria-disabled", String(!isDxf));
  });

  inputs.forEach((input) => {
    input.disabled = !isDxf;
    input.checked = state.view.showDxfDimensions;
  });
}

function isBlockingWarning(message) {
  return !message.startsWith("Recommended change:");
}

function downloadStl() {
  if (!state.mesh || state.warnings.some(isBlockingWarning)) return;

  const params = readParams();
  const fileDimension = params[activeProject.fileDimensionKey] ?? activeProject.label;
  const cleanDimension = String(fileDimension).replace(/[^0-9.]+/g, "-");

  if (activeProject.exportType === "dxf") {
    const fileName = `${activeProject.filePrefix}-${cleanDimension}${state.unit}.dxf`;
    const blob = new Blob([dxfToString(state.mesh, activeProject.stlName, state.unit)], {
      type: "application/dxf;charset=utf-8",
    });
    triggerDownload(blob, fileName);
    return;
  }

  const fileName = `${activeProject.filePrefix}-${cleanDimension}${state.unit}.stl`;
  const stlScale = state.unit === "in" ? 25.4 : 1;
  const blob = new Blob([meshToAsciiStl(state.mesh, activeProject.stlName, stlScale)], {
    type: "model/stl;charset=utf-8",
  });
  triggerDownload(blob, fileName);
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 300);
}

let renderQueued = false;

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPreview();
  });
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width * dpr));
  const height = Math.max(260, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function rotatePoint(p, rotX, rotZ) {
  const cz = Math.cos(rotZ);
  const sz = Math.sin(rotZ);
  const cx = Math.cos(rotX);
  const sx = Math.sin(rotX);

  const xz = p[0] * cz - p[1] * sz;
  const yz = p[0] * sz + p[1] * cz;
  const zz = p[2];

  return [xz, yz * cx - zz * sx, yz * sx + zz * cx];
}

function rotateNormal(n, rotX, rotZ) {
  return rotatePoint(n, rotX, rotZ);
}

function renderPreview() {
  if (!state.mesh) return;
  if (state.mesh.kind === "dxf") {
    renderDxfPreview();
    return;
  }

  resizeCanvas();

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const triangles = state.mesh.triangles;
  const rotX = state.view.rotX;
  const rotZ = state.view.rotZ;
  const transformed = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  triangles.forEach((tri) => {
    const a = rotatePoint(tri.a, rotX, rotZ);
    const b = rotatePoint(tri.b, rotX, rotZ);
    const c = rotatePoint(tri.c, rotX, rotZ);
    minX = Math.min(minX, a[0], b[0], c[0]);
    minY = Math.min(minY, a[1], b[1], c[1]);
    maxX = Math.max(maxX, a[0], b[0], c[0]);
    maxY = Math.max(maxY, a[1], b[1], c[1]);
    transformed.push({
      a,
      b,
      c,
      normal: rotateNormal(tri.normal, rotX, rotZ),
      depth: (a[2] + b[2] + c[2]) / 3,
    });
  });

  const modelW = Math.max(1, maxX - minX);
  const modelH = Math.max(1, maxY - minY);
  const scale = Math.min((width * 0.82) / modelW, (height * 0.82) / modelH) * state.view.zoom;
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = height / 2 + ((minY + maxY) / 2) * scale;
  const light = [-0.35, -0.25, 0.9];
  const lightLen = Math.hypot(...light);
  const lightUnit = light.map((v) => v / lightLen);

  transformed.sort((a, b) => a.depth - b.depth);

  transformed.forEach((tri) => {
    const shade = clamp(
      tri.normal[0] * lightUnit[0] + tri.normal[1] * lightUnit[1] + tri.normal[2] * lightUnit[2],
      -0.55,
      1
    );
    const intensity = Math.round(154 + shade * 70);
    const edge = Math.round(96 + shade * 36);

    ctx.beginPath();
    ctx.moveTo(tri.a[0] * scale + offsetX, -tri.a[1] * scale + offsetY);
    ctx.lineTo(tri.b[0] * scale + offsetX, -tri.b[1] * scale + offsetY);
    ctx.lineTo(tri.c[0] * scale + offsetX, -tri.c[1] * scale + offsetY);
    ctx.closePath();
    ctx.fillStyle = `rgb(${Math.max(80, intensity - 24)}, ${Math.max(92, intensity)}, ${Math.max(90, intensity - 4)})`;
    ctx.strokeStyle = `rgba(${edge - 38}, ${edge}, ${edge - 6}, 0.28)`;
    ctx.lineWidth = Math.max(0.35, window.devicePixelRatio * 0.35);
    ctx.fill();
    ctx.stroke();
  });
}

function renderDxfPreview() {
  resizeCanvas();

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const { scale, offsetX, offsetY } = getDxfPreviewTransform();
  const toScreen = (x, y) => [x * scale + offsetX, -y * scale + offsetY];

  drawDxfAxes(toScreen, scale);

  ctx.lineWidth = Math.max(1.2, window.devicePixelRatio * 1.3);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  state.mesh.entities.forEach((entity) => {
    ctx.strokeStyle = entity.layer === "CENTER" ? "rgba(183, 121, 31, 0.9)" : "#0c5f58";
    ctx.setLineDash(entity.layer === "CENTER" ? [8, 7] : []);
    ctx.beginPath();
    if (entity.type === "circle") {
      const center = toScreen(entity.x, entity.y);
      ctx.arc(center[0], center[1], entity.radius * scale, 0, Math.PI * 2);
    } else if (entity.type === "line") {
      const a = toScreen(entity.x1, entity.y1);
      const b = toScreen(entity.x2, entity.y2);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    } else if (entity.type === "arc") {
      drawDxfArc(entity, toScreen);
    }
    ctx.stroke();
  });
  ctx.setLineDash([]);

  activeDimensionLabelBoxes = [];
  if (state.view.showDxfDimensions) {
    drawDxfDimensions(toScreen, scale);
  }
}

function getDxfPreviewTransform() {
  const { width, height } = canvas;
  const bounds = state.mesh.bounds;
  const paddingRatio = state.mesh.kind === "dxf" ? 0.16 : 0.08;
  const padding = Math.max(0.15, Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * paddingRatio);
  const minX = bounds.minX - padding;
  const maxX = bounds.maxX + padding;
  const minY = bounds.minY - padding;
  const maxY = bounds.maxY + padding;
  const modelW = Math.max(0.001, maxX - minX);
  const modelH = Math.max(0.001, maxY - minY);
  const scale = Math.min((width * 0.82) / modelW, (height * 0.82) / modelH) * state.view.zoom;
  const offsetX = width / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = height / 2 + ((minY + maxY) / 2) * scale;
  return { scale, offsetX, offsetY };
}

function drawDxfArc(entity, toScreen) {
  let start = entity.startAngle;
  let end = entity.endAngle;
  if (end <= start) end += 360;
  const segments = Math.max(12, Math.ceil((end - start) / 8));
  for (let i = 0; i <= segments; i += 1) {
    const angle = ((start + ((end - start) * i) / segments) * Math.PI) / 180;
    const point = toScreen(entity.x + Math.cos(angle) * entity.radius, entity.y + Math.sin(angle) * entity.radius);
    if (i === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  }
}

function drawDxfAxes(toScreen, scale) {
  const axis = Math.max(0.08, 28 / Math.max(scale, 1));
  const origin = toScreen(0, 0);
  const xEnd = toScreen(axis, 0);
  const yEnd = toScreen(0, axis);

  ctx.save();
  ctx.strokeStyle = "rgba(23, 32, 31, 0.28)";
  ctx.lineWidth = Math.max(0.8, window.devicePixelRatio * 0.8);
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(origin[0] - 5, origin[1]);
  ctx.lineTo(xEnd[0], xEnd[1]);
  ctx.moveTo(origin[0], origin[1] + 5);
  ctx.lineTo(yEnd[0], yEnd[1]);
  ctx.stroke();
  ctx.restore();
}

function drawDxfDimensions(toScreen, scale) {
  const specs = getDxfDimensionSpecs();
  if (specs.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.strokeStyle = "rgba(183, 121, 31, 0.95)";
  ctx.fillStyle = "#7a4b10";
  ctx.lineWidth = Math.max(1, 1.1 * dpr);
  ctx.setLineDash([]);
  ctx.font = `${Math.max(11, 11.5 * dpr)}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  specs.forEach((spec) => {
    if (spec.type === "h") {
      drawHorizontalDimension(toScreen, spec, dpr);
    } else if (spec.type === "v") {
      drawVerticalDimension(toScreen, spec, dpr);
    } else if (spec.type === "radial") {
      drawRadialDimension(toScreen, spec, dpr);
    } else if (spec.type === "line") {
      const a = toScreen(spec.x1, spec.y1);
      const b = toScreen(spec.x2, spec.y2);
      drawDimensionSegment(a, b, spec.label, spec.labelDx ?? 0, spec.labelDy ?? 0, dpr);
    } else if (spec.type === "leader") {
      drawDimensionLeader(toScreen, spec, dpr);
    }
  });

  ctx.restore();
}

function getDxfDimensionSpecs() {
  if (!state.mesh || state.mesh.kind !== "dxf") return [];

  const params = readParams();
  if (state.project === "headGasket") return getHeadGasketDimensionSpecs(params);
  if (state.project === "ignitorGasket") return getIgnitorGasketDimensionSpecs(params);
  if (state.project === "dripOilerGasket") return getDripOilerDimensionSpecs(params);
  return [];
}

function getHeadGasketDimensionSpecs(params) {
  const d = state.derived;
  const specs = [];
  const outerR = d.outerDiameter / 2;
  const boreR = d.boreDiameter / 2;
  const pad = Math.max(d.outerDiameter * 0.1, 0.18);

  specs.push({ type: "h", x1: -outerR, x2: outerR, yObject: -outerR, yDim: -outerR - pad, label: `OD ${formatDimension(d.outerDiameter)}` });
  specs.push({ type: "line", x1: -boreR, y1: 0, x2: boreR, y2: 0, label: `Bore ${formatDimension(d.boreDiameter)}`, labelDy: -14 });

  const bolts = state.mesh.hitTargets?.filter((target) => target.type === "bolt") || [];
  const slots = state.mesh.hitTargets?.filter((target) => target.type === "slot") || [];

  if (bolts.length > 0) {
    const bolt = bolts.reduce((best, target) => (target.x > best.x ? target : best), bolts[0]);
    const angle = Math.atan2(bolt.y, bolt.x);
    specs.push({ type: "radial", r1: boreR, r2: Math.hypot(bolt.x, bolt.y), angle, label: `Bolt offset ${formatDimension(d.boltCircleOffset)}` });
    specs.push({
      type: "leader",
      x1: bolt.x + bolt.radius * 0.7,
      y1: bolt.y + bolt.radius * 0.7,
      x2: bolt.x + bolt.radius + pad * 0.45,
      y2: bolt.y + bolt.radius + pad * 0.25,
      label: `Hole ${formatDimension(params.gasketBoltHoleDiameter)}`,
    });
  }

  if (slots.length > 0) {
    const slot = slots.reduce((best, target) => {
      const targetY = Math.sin(target.centerAngle) * target.centerRadius;
      const bestY = Math.sin(best.centerAngle) * best.centerRadius;
      return targetY < bestY ? target : best;
    }, slots[0]);
    specs.push({ type: "radial", r1: boreR, r2: slot.centerRadius, angle: slot.centerAngle, label: `Slot offset ${formatDimension(d.slotCircleOffset)}`, labelDy: 14 });
    specs.push({
      type: "radial",
      r1: slot.centerRadius - slot.width / 2,
      r2: slot.centerRadius + slot.width / 2,
      angle: slot.centerAngle,
      label: `Slot W ${formatDimension(slot.width)}`,
      labelDx: 16,
      labelDy: 10,
    });
    specs.push({
      type: "leader",
      x1: Math.cos(slot.centerAngle) * slot.centerRadius,
      y1: Math.sin(slot.centerAngle) * slot.centerRadius,
      x2: Math.cos(slot.centerAngle) * (slot.centerRadius + slot.width * 1.9),
      y2: Math.sin(slot.centerAngle) * (slot.centerRadius + slot.width * 1.9),
      label: `Slot arc ${formatDimension(params.gasketSlotLength)}`,
    });
  }

  return specs;
}

function getIgnitorGasketDimensionSpecs(params) {
  const specs = [];
  const bounds = state.mesh.bounds;
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const pad = Math.max(Math.max(width, height) * 0.11, 0.12);
  const opening = getIgnitorOpeningExtents(params);
  const boltX = opening.halfWidth + params.ignitorBoltOffset;
  const boltY = params.ignitorBoltVerticalOffset;
  const boltR = params.ignitorBoltHoleDiameter / 2;

  specs.push({ type: "h", x1: bounds.minX, x2: bounds.maxX, yObject: bounds.minY, yDim: bounds.minY - pad, label: `OD W ${formatDimension(width)}` });
  specs.push({ type: "v", y1: bounds.minY, y2: bounds.maxY, xObject: bounds.maxX, xDim: bounds.maxX + pad, label: `OD H ${formatDimension(height)}` });

  if (params.ignitorStyle === "round") {
    const circleR = params.ignitorCenterCircleDiameter / 2;
    specs.push({ type: "line", x1: -circleR, y1: 0, x2: circleR, y2: 0, label: `Opening ${formatDimension(params.ignitorCenterCircleDiameter)}`, labelDy: -13 });
    specs.push({ type: "radial", r1: circleR, r2: circleR + params.ignitorRoundBodyMargin, angle: Math.PI / 2, label: `Body ${formatDimension(params.ignitorRoundBodyMargin)}` });
    specs.push({
      type: "leader",
      x1: boltX + boltR * 0.7,
      y1: boltY + boltR * 0.7,
      x2: boltX + boltR + pad * 0.45,
      y2: boltY + boltR + pad * 0.35,
      label: `Hole ${formatDimension(params.ignitorBoltHoleDiameter)}`,
    });
    specs.push({
      type: "line",
      x1: opening.halfWidth,
      y1: boltY - boltR - pad * 0.2,
      x2: boltX,
      y2: boltY - boltR - pad * 0.2,
      label: `Hole offset ${formatDimension(params.ignitorBoltOffset)}`,
      labelDy: 13,
    });
    specs.push({ type: "line", x1: boltX, y1: boltY + boltR + pad * 0.2, x2: boltX + params.ignitorRoundBoltPadRadius, y2: boltY + boltR + pad * 0.2, label: `Pad R ${formatDimension(params.ignitorRoundBoltPadRadius)}`, labelDy: -12 });
  } else {
    const halfW = params.ignitorCenterSquareWidth / 2;
    const halfH = params.ignitorCenterSquareHeight / 2;
    specs.push({ type: "h", x1: -halfW, x2: halfW, yObject: -halfH, yDim: -halfH - pad * 0.35, label: `Opening W ${formatDimension(params.ignitorCenterSquareWidth)}` });
    specs.push({ type: "v", y1: -halfH, y2: halfH, xObject: -halfW, xDim: -halfW - pad * 0.45, label: `Opening H ${formatDimension(params.ignitorCenterSquareHeight)}`, labelDx: -24 });
    specs.push({
      type: "leader",
      x1: boltX + boltR * 0.7,
      y1: boltY + boltR * 0.7,
      x2: boltX + boltR + pad * 0.45,
      y2: boltY + boltR + pad * 0.35,
      label: `Hole ${formatDimension(params.ignitorBoltHoleDiameter)}`,
    });
    specs.push({
      type: "line",
      x1: opening.halfWidth,
      y1: boltY - boltR - pad * 0.2,
      x2: boltX,
      y2: boltY - boltR - pad * 0.2,
      label: `Hole offset ${formatDimension(params.ignitorBoltOffset)}`,
      labelDy: 13,
    });
  }

  return specs;
}

function getDripOilerDimensionSpecs(params) {
  const outerR = params.dripOilerOuterDiameter / 2;
  const innerR = params.dripOilerInnerDiameter / 2;
  const pad = Math.max(params.dripOilerOuterDiameter * 0.18, 0.14);

  return [
    { type: "h", x1: -outerR, x2: outerR, yObject: -outerR, yDim: -outerR - pad, label: `OD ${formatDimension(params.dripOilerOuterDiameter)}` },
    { type: "line", x1: -innerR, y1: 0, x2: innerR, y2: 0, label: `ID ${formatDimension(params.dripOilerInnerDiameter)}`, labelDy: -13 },
    { type: "radial", r1: innerR, r2: outerR, angle: Math.PI / 4, label: `Width ${formatDimension((params.dripOilerOuterDiameter - params.dripOilerInnerDiameter) / 2)}` },
  ];
}

function drawHorizontalDimension(toScreen, spec, dpr) {
  const objectA = toScreen(spec.x1, spec.yObject);
  const objectB = toScreen(spec.x2, spec.yObject);
  const dimA = toScreen(spec.x1, spec.yDim);
  const dimB = toScreen(spec.x2, spec.yDim);
  drawExtensionLine(objectA, dimA, dpr);
  drawExtensionLine(objectB, dimB, dpr);
  drawDimensionSegment(dimA, dimB, spec.label, spec.labelDx ?? 0, spec.labelDy ?? -12, dpr);
}

function drawVerticalDimension(toScreen, spec, dpr) {
  const objectA = toScreen(spec.xObject, spec.y1);
  const objectB = toScreen(spec.xObject, spec.y2);
  const dimA = toScreen(spec.xDim, spec.y1);
  const dimB = toScreen(spec.xDim, spec.y2);
  drawExtensionLine(objectA, dimA, dpr);
  drawExtensionLine(objectB, dimB, dpr);
  drawDimensionSegment(dimA, dimB, spec.label, spec.labelDx ?? 18, spec.labelDy ?? 0, dpr);
}

function drawRadialDimension(toScreen, spec, dpr) {
  const x1 = Math.cos(spec.angle) * spec.r1;
  const y1 = Math.sin(spec.angle) * spec.r1;
  const x2 = Math.cos(spec.angle) * spec.r2;
  const y2 = Math.sin(spec.angle) * spec.r2;
  const a = toScreen(x1, y1);
  const b = toScreen(x2, y2);
  drawDimensionSegment(a, b, spec.label, spec.labelDx ?? 14, spec.labelDy ?? -10, dpr);
}

function drawDimensionLeader(toScreen, spec, dpr) {
  const a = toScreen(spec.x1, spec.y1);
  const b = toScreen(spec.x2, spec.y2);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const defaultLabelDx = dx < 0 ? -24 : 24;
  const defaultLabelDy = dy > 0 ? 10 : -10;
  drawExtensionLine(a, b, dpr);
  drawDimensionLabel(spec.label, b[0] + (spec.labelDx ?? defaultLabelDx) * dpr, b[1] + (spec.labelDy ?? defaultLabelDy) * dpr, dpr);
}

function drawExtensionLine(a, b, dpr) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();

  const r = 2.5 * dpr;
  ctx.beginPath();
  ctx.arc(b[0], b[1], r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDimensionSegment(a, b, label, labelDx, labelDy, dpr) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();

  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy);
  if (length > 0.0001) {
    const nx = (-dy / length) * 6 * dpr;
    const ny = (dx / length) * 6 * dpr;
    drawDimensionTick(a[0], a[1], nx, ny);
    drawDimensionTick(b[0], b[1], nx, ny);
  }

  drawDimensionLabel(label, (a[0] + b[0]) / 2 + labelDx * dpr, (a[1] + b[1]) / 2 + labelDy * dpr, dpr);
}

function drawDimensionTick(x, y, nx, ny) {
  ctx.beginPath();
  ctx.moveTo(x - nx, y - ny);
  ctx.lineTo(x + nx, y + ny);
  ctx.stroke();
}

function drawDimensionLabel(label, x, y, dpr) {
  const originalX = x;
  const originalY = y;
  const paddingX = 5 * dpr;
  const paddingY = 3 * dpr;
  const metricsText = ctx.measureText(label);
  const width = metricsText.width + paddingX * 2;
  const height = 17 * dpr;
  const labelPosition = findDimensionLabelPosition(x, y, width, height, dpr);
  x = labelPosition.x;
  y = labelPosition.y;

  if (Math.hypot(x - originalX, y - originalY) > 12 * dpr) {
    ctx.save();
    ctx.strokeStyle = "rgba(183, 121, 31, 0.4)";
    ctx.lineWidth = Math.max(0.75, 0.75 * dpr);
    ctx.beginPath();
    ctx.moveTo(originalX, originalY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 240, 0.94)";
  ctx.strokeStyle = "rgba(183, 121, 31, 0.55)";
  ctx.lineWidth = Math.max(0.8, 0.8 * dpr);
  ctx.beginPath();
  ctx.rect(x - width / 2, y - height / 2, width, height + paddingY * 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#7a4b10";
  ctx.fillText(label, x, y);
  ctx.restore();
  activeDimensionLabelBoxes.push(labelPosition.box);
}

function findDimensionLabelPosition(x, y, width, height, dpr) {
  const xStep = Math.max(22 * dpr, Math.min(width * 0.42, 54 * dpr));
  const yStep = height + 5 * dpr;
  const attempts = getDimensionLabelCandidateOffsets(xStep, yStep);
  let fallback = null;

  for (const attempt of attempts) {
    const candidateX = x + attempt.x;
    const candidateY = y + attempt.y;
    const box = getDimensionLabelBox(x, candidateY, width, height, dpr);
    box.minX += attempt.x;
    box.maxX += attempt.x;
    const overlapArea = activeDimensionLabelBoxes.reduce((total, existing) => total + dimensionBoxOverlapArea(box, existing), 0);
    const overlapCount = activeDimensionLabelBoxes.filter((existing) => dimensionBoxesOverlap(box, existing)).length;
    const overflow = getDimensionLabelOverflow(box);
    const distance = Math.hypot(attempt.x, attempt.y);
    const score = overlapCount * 100000 + overlapArea * 20 + overflow * 80 + distance * 0.25;

    if (!fallback || score < fallback.score) {
      fallback = { x: candidateX, y: candidateY, box, score };
    }

    if (overlapCount === 0 && overlapArea === 0 && overflow === 0) {
      return fallback;
    }
  }

  return fallback || { x, y, box: getDimensionLabelBox(x, y, width, height, dpr) };
}

function getDimensionLabelCandidateOffsets(xStep, yStep) {
  const offsets = [{ x: 0, y: 0 }];
  const rings = [
    [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ],
    [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0],
      [2, -1],
      [2, 1],
      [-2, 1],
      [-2, -1],
      [1, -2],
      [1, 2],
      [-1, 2],
      [-1, -2],
    ],
    [
      [0, -3],
      [3, 0],
      [0, 3],
      [-3, 0],
      [2, -2],
      [2, 2],
      [-2, 2],
      [-2, -2],
    ],
  ];

  rings.forEach((ring) => {
    ring.forEach(([x, y]) => offsets.push({ x: x * xStep, y: y * yStep }));
  });
  return offsets;
}

function getDimensionLabelBox(x, y, width, height, dpr) {
  const margin = 2 * dpr;
  return {
    minX: x - width / 2 - margin,
    minY: y - height / 2 - margin,
    maxX: x + width / 2 + margin,
    maxY: y + height / 2 + margin,
  };
}

function dimensionBoxesOverlap(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY;
}

function getDimensionLabelOverflow(box) {
  const gutter = 6 * (window.devicePixelRatio || 1);
  return (
    Math.max(0, gutter - box.minX) +
    Math.max(0, gutter - box.minY) +
    Math.max(0, box.maxX - (canvas.width - gutter)) +
    Math.max(0, box.maxY - (canvas.height - gutter))
  );
}

function dimensionBoxOverlapArea(a, b) {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const height = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  return width * height;
}

function canvasEventToDxfPoint(event) {
  if (!state.mesh || state.mesh.kind !== "dxf") return null;

  resizeCanvas();
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const { scale, offsetX, offsetY } = getDxfPreviewTransform();
  const screenX = (event.clientX - rect.left) * (canvas.width / rect.width);
  const screenY = (event.clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (screenX - offsetX) / scale,
    y: -(screenY - offsetY) / scale,
    tolerance: Math.max(0.015, 9 / Math.max(scale, 1)),
  };
}

function findHeadGasketHitTarget(point) {
  if (state.project !== "headGasket" || !state.mesh?.hitTargets) return null;

  let best = null;
  state.mesh.hitTargets.forEach((target) => {
    const distance = distanceToGasketTarget(target, point);
    if (distance <= point.tolerance && (!best || distance < best.distance)) {
      best = { target, distance };
    }
  });

  return best?.target || null;
}

function distanceToGasketTarget(target, point) {
  if (target.type === "bolt") {
    return Math.max(0, Math.hypot(point.x - target.x, point.y - target.y) - target.radius);
  }

  if (target.type === "slot") {
    const capR = target.width / 2;
    const angle = Math.atan2(point.y, point.x);
    const radius = Math.hypot(point.x, point.y);
    const span = target.arcLength / Math.max(target.centerRadius, 0.001);
    const angleDelta = Math.abs(shortestAngleDelta(angle, target.centerAngle));

    if (angleDelta <= span / 2) {
      return Math.max(0, Math.abs(radius - target.centerRadius) - capR);
    }

    const start = target.centerAngle - span / 2;
    const end = target.centerAngle + span / 2;
    const startX = Math.cos(start) * target.centerRadius;
    const startY = Math.sin(start) * target.centerRadius;
    const endX = Math.cos(end) * target.centerRadius;
    const endY = Math.sin(end) * target.centerRadius;
    const startDistance = Math.hypot(point.x - startX, point.y - startY);
    const endDistance = Math.hypot(point.x - endX, point.y - endY);
    return Math.max(0, Math.min(startDistance, endDistance) - capR);
  }

  return Infinity;
}

function shortestAngleDelta(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function deleteHeadGasketTarget(target) {
  if (target.type === "bolt") {
    state.headGasket.deletedBoltIndices.add(target.index);
  } else if (target.type === "slot") {
    state.headGasket.deletedSlotIndices.add(target.index);
  } else {
    return;
  }

  updateModel();
  statusEl.className = "status recommendation";
  statusEl.textContent = `${target.type === "bolt" ? "Bolt hole" : "Slot"} removed from this gasket pattern. Reset restores removed gasket features.`;
}

function resetHeadGasketDeletedFeatures() {
  state.headGasket.deletedBoltIndices.clear();
  state.headGasket.deletedSlotIndices.clear();
}

function clearHeadGasketDeletedForField(fieldName) {
  if (state.project !== "headGasket") return;
  if (fieldName === "gasketBoltCount") state.headGasket.deletedBoltIndices.clear();
  if (fieldName === "gasketSlotCount") state.headGasket.deletedSlotIndices.clear();
}

function attachEvents() {
  controls.addEventListener("input", (event) => {
    if (event.target?.name === "unit") return;
    if (event.target?.type === "radio" || event.target?.type === "checkbox" || event.target?.tagName === "SELECT") return;
    clearHeadGasketDeletedForField(event.target?.name);
    updateModel();
  });
  controls.addEventListener("change", (event) => {
    if (event.target?.dataset?.dxfDimensionsToggle === "true") {
      state.view.showDxfDimensions = event.target.checked;
      updateDimensionToggleUi();
      requestRender();
      return;
    }
    if (event.target?.name === "unit") {
      setUnit(event.target.value, true);
    }
    if (event.target?.name === "sprocketChainKey") {
      applySprocketChainPreset(event.target.value);
    }
    if (event.target?.name === "gearDiametralPitch") {
      applyGearDiametralPitchPreset(event.target.value);
    }
    if (event.target?.name === "bevelDiametralPitch") {
      applyBevelDiametralPitchPreset(event.target.value);
    }
    clearHeadGasketDeletedForField(event.target?.name);
    updateConditionalFields();
    updateModel();
  });
  downloadButton.addEventListener("click", downloadStl);
  resetButton.addEventListener("click", resetControls);
  zoomOutButton.addEventListener("click", () => setPreviewZoom(state.view.zoom / 1.18));
  zoomInButton.addEventListener("click", () => setPreviewZoom(state.view.zoom * 1.18));
  resetViewButton.addEventListener("click", resetPreviewView);
  projectButtons.forEach((button) => {
    button.addEventListener("click", () => handleProjectButton(button));
  });
  window.addEventListener("resize", requestRender);

  canvas.addEventListener("pointerdown", (event) => {
    state.view.dragging = true;
    state.view.dragMoved = false;
    state.view.lastX = event.clientX;
    state.view.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.view.dragging) return;
    const dx = event.clientX - state.view.lastX;
    const dy = event.clientY - state.view.lastY;
    if (Math.hypot(dx, dy) > 3) {
      state.view.dragMoved = true;
    }
    state.view.lastX = event.clientX;
    state.view.lastY = event.clientY;
    state.view.rotZ += dx * 0.01;
    state.view.rotX += dy * 0.008;
    requestRender();
  });

  canvas.addEventListener("pointerup", (event) => {
    state.view.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", () => {
    state.view.dragging = false;
  });

  canvas.addEventListener("click", (event) => {
    if (state.view.dragMoved) {
      state.view.dragMoved = false;
      return;
    }

    const point = canvasEventToDxfPoint(event);
    const target = point ? findHeadGasketHitTarget(point) : null;
    if (target) {
      deleteHeadGasketTarget(target);
    }
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      setPreviewZoom(state.view.zoom * Math.exp(-event.deltaY * 0.0012));
    },
    { passive: false }
  );
}

function handleProjectButton(button) {
  const key = button.dataset.projectKey;
  if (!projectConfigs[key]) {
    statusEl.className = "status recommendation";
    statusEl.textContent = `${button.dataset.project} generator is coming soon.`;
    return;
  }

  if (key === state.project) {
    updateUiText();
    return;
  }

  setActiveProject(key);
}

function setActiveProject(key) {
  activeProjectKey = key;
  activeProject = projectConfigs[activeProjectKey];
  defaults = activeProject.defaults;
  controlGroups = activeProject.controlGroups;
  fieldMap = buildFieldMap(controlGroups);
  state.project = key;

  projectButtons.forEach((button) => {
    const isActive = button.dataset.projectKey === key;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (projectTitle) {
    projectTitle.textContent = activeProject.label;
  }
  if (previewHeading) {
    previewHeading.textContent = activeProject.previewTitle || "Mesh View";
  }

  buildControls();
  updateModel();
}

function setPreviewZoom(zoom) {
  state.view.zoom = clamp(zoom, 0.35, 5.5);
  requestRender();
}

function resetPreviewView() {
  state.view.rotX = -0.58;
  state.view.rotZ = 0.72;
  state.view.zoom = 1;
  requestRender();
}

buildControls();
attachEvents();
updateModel();
