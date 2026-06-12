import { legacy } from "./legacy.js";

export const projectOrder = [
  "flatBeltPulley",
  "vBeltPulley",
  "sprocket",
  "straightCutGear",
  "bevelGear",
  "shaftSpacer",
  "lineshaftHanger",
  "speedReductionBracket",
  "headGasket",
  "roundIgnitorGasket",
  "squareIgnitorGasket",
  "dripOilerGasket",
];

export const projectKeysByCategory = {
  models: [
    "flatBeltPulley",
    "vBeltPulley",
    "sprocket",
    "straightCutGear",
    "bevelGear",
    "shaftSpacer",
    "lineshaftHanger",
    "speedReductionBracket",
  ],
  gaskets: ["headGasket", "roundIgnitorGasket", "squareIgnitorGasket", "dripOilerGasket"],
};

export function projectCategoryForKey(projectKey) {
  return Object.entries(projectKeysByCategory).find(([, keys]) => keys.includes(projectKey))?.[0] || "models";
}

export function createProjectConfigs() {
  const engine = legacy();
  const roundIgnitorDefaults = {
    ...engine.ignitorGasketDefaults,
    ignitorStyle: "round",
  };
  const squareIgnitorDefaults = {
    ...engine.ignitorGasketDefaults,
    ignitorStyle: "square",
  };
  const roundIgnitorControlGroups = ignitorControlGroupsForStyle(engine.ignitorGasketControlGroups, "round");
  const squareIgnitorControlGroups = ignitorControlGroupsForStyle(engine.ignitorGasketControlGroups, "square");

  return {
    flatBeltPulley: {
      label: "Flat Belt Pulley",
      defaults: engine.pulleyDefaults,
      controlGroups: engine.pulleyControlGroups,
      validate: engine.validatePulley,
      generate: engine.generatePulleyMesh,
      metrics: engine.pulleyMetricRows,
      filePrefix: "flatbelt-pulley",
      stlName: "flatbelt_pulley",
      fileDimensionKey: "diameter",
      onePieceStl: true,
    },
    vBeltPulley: {
      label: "V-Belt Pulley",
      defaults: engine.vBeltPulleyDefaults,
      controlGroups: engine.vBeltPulleyControlGroups,
      validate: engine.validateVBeltPulley,
      generate: engine.generateVBeltPulleyMesh,
      metrics: engine.vBeltPulleyMetricRows,
      filePrefix: "vbelt-pulley",
      stlName: "vbelt_pulley",
      fileDimensionKey: "vOuterDiameter",
      onePieceStl: true,
    },
    sprocket: {
      label: "Sprocket",
      defaults: engine.sprocketDefaults,
      controlGroups: engine.sprocketControlGroups,
      validate: engine.validateSprocket,
      generate: engine.generateSprocketMesh,
      metrics: engine.sprocketMetricRows,
      filePrefix: "sprocket",
      stlName: "sprocket",
      fileDimensionKey: "sprocketToothCount",
      onePieceStl: true,
    },
    straightCutGear: {
      label: "Straight Cut Gear",
      defaults: engine.straightCutGearDefaults,
      controlGroups: engine.straightCutGearControlGroups,
      validate: engine.validateStraightCutGear,
      generate: engine.generateStraightCutGearMesh,
      metrics: engine.straightCutGearMetricRows,
      filePrefix: "straight-cut-gear",
      stlName: "straight_cut_gear",
      fileDimensionKey: "gearToothCount",
      onePieceStl: true,
    },
    bevelGear: {
      label: "Bevel Gear",
      defaults: engine.bevelGearDefaults,
      controlGroups: engine.bevelGearControlGroups,
      validate: engine.validateBevelGear,
      generate: engine.generateBevelGearMesh,
      metrics: engine.bevelGearMetricRows,
      filePrefix: "bevel-gear",
      stlName: "bevel_gear",
      fileDimensionKey: "bevelToothCount",
      onePieceStl: true,
    },
    shaftSpacer: {
      label: "Shaft Spacer",
      defaults: engine.shaftSpacerDefaults,
      controlGroups: engine.shaftSpacerControlGroups,
      validate: engine.validateShaftSpacer,
      generate: engine.generateShaftSpacerMesh,
      metrics: engine.shaftSpacerMetricRows,
      filePrefix: "shaft-spacer",
      stlName: "shaft_spacer",
      fileDimensionKey: "spacerOuterDiameter",
    },
    lineshaftHanger: {
      label: "Lineshaft Hanger",
      defaults: engine.lineshaftHangerDefaults,
      controlGroups: engine.lineshaftHangerControlGroups,
      validate: engine.validateLineshaftHanger,
      generate: engine.generateLineshaftHangerMesh,
      metrics: engine.lineshaftHangerMetricRows,
      filePrefix: "lineshaft-hanger",
      stlName: "lineshaft_hanger",
      fileDimensionKey: "hangerBoreDiameter",
      onePieceStl: true,
    },
    speedReductionBracket: {
      label: "Speed Reduction Bracket",
      defaults: engine.speedReductionBracketDefaults,
      controlGroups: engine.speedReductionBracketControlGroups,
      validate: engine.validateSpeedReductionBracket,
      generate: engine.generateSpeedReductionBracketMesh,
      metrics: engine.speedReductionBracketMetricRows,
      filePrefix: "speed-reduction-bracket",
      stlName: "speed_reduction_bracket",
      fileDimensionKey: "reducerBoreDiameter",
      onePieceStl: true,
    },
    headGasket: {
      label: "Head Gasket",
      defaults: engine.headGasketDefaults,
      controlGroups: engine.headGasketControlGroups,
      validate: engine.validateHeadGasket,
      generate: engine.generateHeadGasketDxf,
      metrics: engine.headGasketMetricRows,
      filePrefix: "head-gasket",
      stlName: "head_gasket",
      fileDimensionKey: "gasketOuterDiameter",
      exportType: "dxf",
      downloadLabel: "Download DXF",
      previewTitle: "2D DXF View",
    },
    roundIgnitorGasket: {
      label: "Round Ignitor Gasket",
      defaults: roundIgnitorDefaults,
      controlGroups: roundIgnitorControlGroups,
      validate: (raw) => engine.validateIgnitorGasket({ ...raw, ignitorStyle: "round" }),
      generate: (params) => engine.generateIgnitorGasketDxf({ ...params, ignitorStyle: "round" }),
      metrics: engine.ignitorGasketMetricRows,
      filePrefix: "round-ignitor-gasket",
      stlName: "round_ignitor_gasket",
      fileDimensionKey: "ignitorCenterCircleDiameter",
      exportType: "dxf",
      downloadLabel: "Download DXF",
      previewTitle: "2D DXF View",
    },
    squareIgnitorGasket: {
      label: "Square Ignitor Gasket",
      defaults: squareIgnitorDefaults,
      controlGroups: squareIgnitorControlGroups,
      validate: (raw) => engine.validateIgnitorGasket({ ...raw, ignitorStyle: "square" }),
      generate: (params) => engine.generateIgnitorGasketDxf({ ...params, ignitorStyle: "square" }),
      metrics: engine.ignitorGasketMetricRows,
      filePrefix: "square-ignitor-gasket",
      stlName: "square_ignitor_gasket",
      fileDimensionKey: "ignitorCenterSquareWidth",
      exportType: "dxf",
      downloadLabel: "Download DXF",
      previewTitle: "2D DXF View",
    },
    dripOilerGasket: {
      label: "Drip Oiler Gasket",
      defaults: engine.dripOilerGasketDefaults,
      controlGroups: engine.dripOilerGasketControlGroups,
      validate: engine.validateDripOilerGasket,
      generate: engine.generateDripOilerGasketDxf,
      metrics: engine.dripOilerGasketMetricRows,
      filePrefix: "drip-oiler-gasket",
      stlName: "drip_oiler_gasket",
      fileDimensionKey: "dripOilerOuterDiameter",
      exportType: "dxf",
      downloadLabel: "Download DXF",
      previewTitle: "2D DXF View",
    },
  };
}

function ignitorControlGroupsForStyle(groups, style) {
  return groups
    .filter((group) => group.title !== "Style")
    .map((group) => ({
      ...group,
      fields: group.fields.filter(
        (field) => field.showWhen?.key !== "ignitorStyle" || field.showWhen.value === style,
      ),
    }))
    .filter((group) => group.fields.length > 0);
}

export function cloneDefaults(project) {
  return structuredClone(project.defaults);
}

export function buildFieldMap(groups) {
  return new Map(groups.flatMap((group) => group.fields).map((field) => [field.key, field]));
}
