const pulleyDefaults = {
  diameter: 7,
  rimThickness: 0.25,
  overallWidth: 2,
  shaftDiameter: 1.25,
  hubThickness: 0.4,
  hubWidth: 1.5,
  keySlotWidth: 0.25,
  setScrewEnabled: false,
  setScrewThread: "1/4-20",
  setScrewBossHeight: 0.35,
  setScrewBossWidth: 0.5,
  setScrewBossOffset: 0,
  setScrewAngle: 315,
  setScrewIntersectAngle: 0,
  crown: 0.05,
  rimRadius: 0.066,
  hubRadius: 0.055,
  shaftRadius: 0.015,
  spokeRadius: 0.5,
  spokeCount: 6,
  spokeWidth: 0.5,
  spokeHeight: 0.5,
  spokeInnerWidth: 1,
  spokeOuterWidth: 0.385,
  spokeStyle: "curved",
  curvedAngle: 41,
};

const unitOptions = {
  in: {
    label: "in",
    factorFromInch: 1,
    decimals: 3,
  },
  mm: {
    label: "mm",
    factorFromInch: 25.4,
    decimals: 1,
  },
};

const threadOptions = {
  "1/4-20": { label: "1/4-20", major: 0.25, minor: 0.201, pitch: 1 / 20 },
  "5/16-18": { label: "5/16-18", major: 0.3125, minor: 0.257, pitch: 1 / 18 },
  "3/8-16": { label: "3/8-16", major: 0.375, minor: 0.3125, pitch: 1 / 16 },
};

const hubPositionOptions = {
  backFlush: { label: "Back face flush" },
  centered: { label: "Centered" },
  frontFlush: { label: "Front face flush" },
};

const sprocketChainPresets = {
  roller25: { label: "Roller #25", family: "Roller", pitch: 0.25, rollerDiameter: 0.13, faceWidth: 0.11, toothHeight: 0.058, rootClearance: 0.012 },
  roller35: { label: "Roller #35", family: "Roller", pitch: 0.375, rollerDiameter: 0.2, faceWidth: 0.168, toothHeight: 0.088, rootClearance: 0.018 },
  roller40: { label: "Roller #40", family: "Roller", pitch: 0.5, rollerDiameter: 0.312, faceWidth: 0.284, toothHeight: 0.118, rootClearance: 0.025 },
  roller41: { label: "Roller #41", family: "Roller", pitch: 0.5, rollerDiameter: 0.306, faceWidth: 0.227, toothHeight: 0.118, rootClearance: 0.025 },
  roller50: { label: "Roller #50", family: "Roller", pitch: 0.625, rollerDiameter: 0.4, faceWidth: 0.343, toothHeight: 0.148, rootClearance: 0.031 },
  roller60: { label: "Roller #60", family: "Roller", pitch: 0.75, rollerDiameter: 0.469, faceWidth: 0.459, toothHeight: 0.178, rootClearance: 0.038 },
  roller80: { label: "Roller #80", family: "Roller", pitch: 1, rollerDiameter: 0.625, faceWidth: 0.575, toothHeight: 0.236, rootClearance: 0.05 },
  agCA550: { label: "Ag CA550", family: "Ag", pitch: 1.63, rollerDiameter: 0.656, faceWidth: 0.72, toothHeight: 0.38, rootClearance: 0.065 },
  agCA555: { label: "Ag CA555", family: "Ag", pitch: 1.63, rollerDiameter: 0.656, faceWidth: 0.82, toothHeight: 0.38, rootClearance: 0.065 },
  agCA557: { label: "Ag CA557", family: "Ag", pitch: 1.63, rollerDiameter: 0.656, faceWidth: 0.92, toothHeight: 0.38, rootClearance: 0.065 },
  agCA620: { label: "Ag CA620", family: "Ag", pitch: 1.654, rollerDiameter: 0.656, faceWidth: 0.72, toothHeight: 0.39, rootClearance: 0.066 },
  agCA627: { label: "Ag CA627", family: "Ag", pitch: 1.654, rollerDiameter: 0.656, faceWidth: 0.9, toothHeight: 0.39, rootClearance: 0.066 },
};

const gearToothOptions = {
  "12": { label: "12 teeth" },
  "14": { label: "14 teeth" },
  "16": { label: "16 teeth" },
  "18": { label: "18 teeth" },
  "20": { label: "20 teeth" },
  "24": { label: "24 teeth" },
  "30": { label: "30 teeth" },
  "36": { label: "36 teeth" },
  "40": { label: "40 teeth" },
  "48": { label: "48 teeth" },
  "60": { label: "60 teeth" },
  "72": { label: "72 teeth" },
  "84": { label: "84 teeth" },
  "96": { label: "96 teeth" },
  "120": { label: "120 teeth" },
};

const gearDiametralPitchOptions = {
  "4": { label: "4 DP" },
  "5": { label: "5 DP" },
  "6": { label: "6 DP" },
  "8": { label: "8 DP" },
  "10": { label: "10 DP" },
  "12": { label: "12 DP" },
  "16": { label: "16 DP" },
  "20": { label: "20 DP" },
  "24": { label: "24 DP" },
  "32": { label: "32 DP" },
};

const gearPressureAngleOptions = {
  "14.5": { label: "14.5 deg" },
  "20": { label: "20 deg" },
  "25": { label: "25 deg" },
};

const pulleyControlGroups = [
  {
    title: "Rim",
    fields: [
      { key: "diameter", label: "Diameter", hint: "belt face edge diameter", min: 0.75, max: 32, step: 0.001 },
      { key: "rimThickness", label: "Rim / brim thickness", hint: "radial wall shown in red", min: 0.04, max: 8, step: 0.001 },
      { key: "overallWidth", label: "Overall width", hint: "pulley width through the rim", min: 0.125, max: 16, step: 0.001 },
      { key: "crown", label: "Pulley crown", hint: "center rise over belt face", min: 0, max: 1, step: 0.001 },
    ],
  },
  {
    title: "Hub and keyway",
    fields: [
      { key: "shaftDiameter", label: "Shaft diameter", hint: "fixed bore; hub grows around it", min: 0.0625, max: 6, step: 0.001 },
      { key: "hubThickness", label: "Hub thickness", hint: "radial wall added around shaft", min: 0.03, max: 6, step: 0.001 },
      { key: "hubWidth", label: "Hub width", hint: "boss length centered on shaft", min: 0.125, max: 18, step: 0.001 },
      { key: "keySlotWidth", label: "Key slot width", hint: "keyway depth is half width", min: 0, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Set screw",
    fields: [
      { key: "setScrewEnabled", label: "Set screw boss", hint: "radial threaded boss on hub", type: "toggle" },
      {
        key: "setScrewThread",
        label: "Thread size",
        hint: "modeled set screw thread",
        type: "select",
        options: Object.keys(threadOptions),
        unit: "",
      },
      { key: "setScrewBossHeight", label: "Boss height", hint: "radial protrusion from hub", min: 0.05, max: 3, step: 0.001 },
      { key: "setScrewBossWidth", label: "Boss width", hint: "diameter of set screw pad", min: 0.1, max: 3, step: 0.001 },
      { key: "setScrewBossOffset", label: "Boss vertical offset", hint: "moves boss up or down on hub", min: -4, max: 4, step: 0.001 },
      { key: "setScrewAngle", label: "Set screw angle", hint: "position around hub", min: 0, max: 359, step: 1, unit: "deg" },
      { key: "setScrewIntersectAngle", label: "Intersect angle", hint: "tilts hole along the bore axis", min: -60, max: 60, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Radii",
    fields: [
      { key: "rimRadius", label: "Brim radius", hint: "inside rim edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "hubRadius", label: "Hub radius", hint: "outside hub edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "shaftRadius", label: "Shaft / keyway radius", hint: "bore and keyway mouth roundover", min: 0, max: 0.5, step: 0.001 },
      { key: "spokeRadius", label: "Spoke radius", hint: "spoke edge roundover", min: 0, max: 0.5, step: 0.001 },
    ],
  },
  {
    title: "Spokes",
    fields: [
      { key: "spokeCount", label: "Spoke count", hint: "use 0 for a solid web", min: 0, max: 24, step: 1, unit: "" },
      { key: "spokeWidth", label: "Spoke width", hint: "middle width of each spoke", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeHeight", label: "Spoke height", hint: "axial thickness through each spoke", min: 0.04, max: 8, step: 0.001 },
      { key: "spokeInnerWidth", label: "Inner end width", hint: "width where spoke meets hub", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeOuterWidth", label: "Outer end width", hint: "width where spoke meets rim", min: 0.04, max: 5, step: 0.001 },
      { key: "curvedAngle", label: "Curved spoke angle", hint: "used when curved is selected", min: -85, max: 85, step: 1, unit: "deg" },
    ],
  },
];

const vBeltPulleyDefaults = {
  vOuterDiameter: 6,
  vOverallWidth: 0.875,
  vGrooveTopWidth: 0.5,
  vGrooveDepth: 0.22,
  vGrooveAngle: 40,
  vRimThickness: 0.3,
  shaftDiameter: 0.75,
  hubThickness: 0.35,
  hubWidth: 1.25,
  hubPosition: "backFlush",
  keySlotWidth: 0.1875,
  keySlotDepth: 0.09375,
  setScrewEnabled: false,
  setScrewThread: "1/4-20",
  setScrewBossHeight: 0.3,
  setScrewBossWidth: 0.5,
  setScrewBossOffset: 0,
  setScrewAngle: 315,
  setScrewIntersectAngle: 0,
  rimRadius: 0.035,
  hubRadius: 0.04,
  shaftRadius: 0.01,
  spokeRadius: 0.06,
  spokeCount: 6,
  spokeWidth: 0.35,
  spokeHeight: 0.35,
  spokeInnerWidth: 0.5,
  spokeOuterWidth: 0.35,
  spokeStyle: "straight",
  curvedAngle: 0,
};

const vBeltPulleyControlGroups = [
  {
    title: "V groove rim",
    fields: [
      { key: "vOuterDiameter", label: "Outer diameter", hint: "outside pulley diameter", min: 0.75, max: 32, step: 0.001 },
      { key: "vOverallWidth", label: "Overall width", hint: "pulley width through the rim", min: 0.125, max: 16, step: 0.001 },
      { key: "vGrooveTopWidth", label: "Groove top width", hint: "belt groove mouth width", min: 0.02, max: 8, step: 0.001 },
      { key: "vGrooveDepth", label: "Groove depth", hint: "radial depth from OD to groove root", min: 0.01, max: 4, step: 0.001 },
      { key: "vGrooveAngle", label: "Groove angle", hint: "included V angle", min: 20, max: 60, step: 1, unit: "deg" },
      { key: "vRimThickness", label: "Rim wall thickness", hint: "wall below the groove root", min: 0.04, max: 8, step: 0.001 },
    ],
  },
  {
    title: "Hub and keyway",
    fields: [
      { key: "shaftDiameter", label: "Shaft diameter", hint: "fixed bore; hub grows around it", min: 0.0625, max: 6, step: 0.001 },
      { key: "hubThickness", label: "Hub thickness", hint: "radial wall added around shaft", min: 0.03, max: 6, step: 0.001 },
      { key: "hubWidth", label: "Hub width", hint: "boss length centered on shaft", min: 0.125, max: 18, step: 0.001 },
      {
        key: "hubPosition",
        label: "Hub position",
        hint: "sets one hub face level with the pulley face",
        type: "select",
        options: Object.keys(hubPositionOptions),
        unit: "",
      },
      { key: "keySlotWidth", label: "Key slot width", hint: "straight keyway width", min: 0, max: 2, step: 0.001 },
      { key: "keySlotDepth", label: "Key slot depth", hint: "depth above bore diameter", min: 0, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Set screw",
    fields: [
      { key: "setScrewEnabled", label: "Set screw boss", hint: "radial threaded boss on hub", type: "toggle" },
      {
        key: "setScrewThread",
        label: "Thread size",
        hint: "modeled set screw thread",
        type: "select",
        options: Object.keys(threadOptions),
        unit: "",
      },
      { key: "setScrewBossHeight", label: "Boss height", hint: "radial protrusion from hub", min: 0.05, max: 3, step: 0.001 },
      { key: "setScrewBossWidth", label: "Boss width", hint: "diameter of set screw pad", min: 0.1, max: 3, step: 0.001 },
      { key: "setScrewBossOffset", label: "Boss vertical offset", hint: "moves boss up or down on hub", min: -4, max: 4, step: 0.001 },
      { key: "setScrewAngle", label: "Set screw angle", hint: "position around hub", min: 0, max: 359, step: 1, unit: "deg" },
      { key: "setScrewIntersectAngle", label: "Intersect angle", hint: "tilts hole along the bore axis", min: -60, max: 60, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Radii",
    fields: [
      { key: "rimRadius", label: "Rim inner radius", hint: "inside rim edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "hubRadius", label: "Hub radius", hint: "outside hub edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "shaftRadius", label: "Shaft / keyway radius", hint: "bore and keyway mouth roundover", min: 0, max: 0.5, step: 0.001 },
      { key: "spokeRadius", label: "Spoke radius", hint: "spoke edge roundover", min: 0, max: 0.5, step: 0.001 },
    ],
  },
  {
    title: "Spokes",
    fields: [
      { key: "spokeCount", label: "Spoke count", hint: "use 0 for a solid web", min: 0, max: 24, step: 1, unit: "" },
      { key: "spokeWidth", label: "Spoke width", hint: "middle width of each spoke", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeHeight", label: "Spoke height", hint: "axial thickness through each spoke", min: 0.04, max: 8, step: 0.001 },
      { key: "spokeInnerWidth", label: "Inner end width", hint: "width where spoke meets hub", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeOuterWidth", label: "Outer end width", hint: "width where spoke meets rim", min: 0.04, max: 5, step: 0.001 },
      { key: "curvedAngle", label: "Curved spoke angle", hint: "used when curved is selected", min: -85, max: 85, step: 1, unit: "deg" },
    ],
  },
];

const sprocketDefaults = {
  sprocketChainKey: "roller40",
  sprocketToothCount: 12,
  sprocketPitch: sprocketChainPresets.roller40.pitch,
  sprocketRollerDiameter: sprocketChainPresets.roller40.rollerDiameter,
  sprocketFaceWidth: sprocketChainPresets.roller40.faceWidth,
  sprocketToothHeight: sprocketChainPresets.roller40.toothHeight,
  sprocketRootClearance: sprocketChainPresets.roller40.rootClearance,
  shaftDiameter: 0.75,
  hubThickness: 0.25,
  hubWidth: 0.6,
  hubPosition: "backFlush",
  keySlotWidth: 0.1875,
  keySlotDepth: 0.09375,
  setScrewEnabled: false,
  setScrewThread: "1/4-20",
  setScrewBossHeight: 0.3,
  setScrewBossWidth: 0.5,
  setScrewBossOffset: 0,
  setScrewAngle: 315,
  setScrewIntersectAngle: 0,
  hubRadius: 0.04,
  shaftRadius: 0.01,
};

const sprocketControlGroups = [
  {
    title: "Chain and teeth",
    fields: [
      {
        key: "sprocketChainKey",
        label: "Chain type",
        hint: "sets the sprocket tooth presets",
        type: "select",
        options: Object.keys(sprocketChainPresets),
        unit: "",
      },
      { key: "sprocketToothCount", label: "Tooth count", hint: "number of sprocket teeth", min: 6, max: 96, step: 1, unit: "" },
      { key: "sprocketPitch", label: "Chain pitch", hint: "center distance between rollers", min: 0.1, max: 4, step: 0.001 },
      { key: "sprocketRollerDiameter", label: "Roller diameter", hint: "roller or barrel diameter", min: 0.05, max: 2, step: 0.001 },
      { key: "sprocketFaceWidth", label: "Face width", hint: "axial tooth thickness", min: 0.03, max: 3, step: 0.001 },
      { key: "sprocketToothHeight", label: "Tooth height", hint: "radial height above pitch circle", min: 0.01, max: 2, step: 0.001 },
      { key: "sprocketRootClearance", label: "Root clearance", hint: "extra relief below roller pocket", min: 0, max: 1, step: 0.001 },
    ],
  },
  {
    title: "Hub and keyway",
    fields: [
      { key: "shaftDiameter", label: "Shaft diameter", hint: "fixed bore; hub grows around it", min: 0.0625, max: 6, step: 0.001 },
      { key: "hubThickness", label: "Hub thickness", hint: "radial wall added around shaft", min: 0.03, max: 6, step: 0.001 },
      { key: "hubWidth", label: "Hub width", hint: "boss length centered on shaft", min: 0.125, max: 18, step: 0.001 },
      {
        key: "hubPosition",
        label: "Hub position",
        hint: "sets one hub face level with the sprocket face",
        type: "select",
        options: Object.keys(hubPositionOptions),
        unit: "",
      },
      { key: "keySlotWidth", label: "Key slot width", hint: "straight keyway width", min: 0, max: 2, step: 0.001 },
      { key: "keySlotDepth", label: "Key slot depth", hint: "depth above bore diameter", min: 0, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Set screw",
    fields: [
      { key: "setScrewEnabled", label: "Set screw boss", hint: "radial threaded boss on hub", type: "toggle" },
      {
        key: "setScrewThread",
        label: "Thread size",
        hint: "modeled set screw thread",
        type: "select",
        options: Object.keys(threadOptions),
        unit: "",
      },
      { key: "setScrewBossHeight", label: "Boss height", hint: "radial protrusion from hub", min: 0.05, max: 3, step: 0.001 },
      { key: "setScrewBossWidth", label: "Boss width", hint: "diameter of set screw pad", min: 0.1, max: 3, step: 0.001 },
      { key: "setScrewBossOffset", label: "Boss vertical offset", hint: "moves boss up or down on hub", min: -4, max: 4, step: 0.001 },
      { key: "setScrewAngle", label: "Set screw angle", hint: "position around hub", min: 0, max: 359, step: 1, unit: "deg" },
      { key: "setScrewIntersectAngle", label: "Intersect angle", hint: "tilts hole along the bore axis", min: -60, max: 60, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Radii",
    fields: [
      { key: "hubRadius", label: "Hub radius", hint: "outside hub edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "shaftRadius", label: "Shaft / keyway radius", hint: "bore and keyway mouth roundover", min: 0, max: 0.5, step: 0.001 },
    ],
  },
];

const straightCutGearDefaults = {
  gearToothCount: "60",
  gearDiametralPitch: "10",
  gearPressureAngle: "20",
  gearFaceWidth: 0.5,
  gearAddendum: 0.1,
  gearDedendum: 0.125,
  gearRimThickness: 0.35,
  shaftDiameter: 0.75,
  hubThickness: 0.35,
  hubWidth: 1,
  hubPosition: "backFlush",
  keySlotWidth: 0.1875,
  keySlotDepth: 0.09375,
  setScrewEnabled: false,
  setScrewThread: "1/4-20",
  setScrewBossHeight: 0.3,
  setScrewBossWidth: 0.5,
  setScrewBossOffset: 0,
  setScrewAngle: 315,
  setScrewIntersectAngle: 0,
  hubRadius: 0.04,
  shaftRadius: 0.01,
  spokeRadius: 0.08,
  spokeCount: 6,
  spokeWidth: 0.35,
  spokeHeight: 0.35,
  spokeInnerWidth: 0.5,
  spokeOuterWidth: 0.45,
  spokeStyle: "straight",
  curvedAngle: 0,
};

const straightCutGearControlGroups = [
  {
    title: "Gear teeth",
    fields: [
      {
        key: "gearToothCount",
        label: "Tooth count",
        hint: "select the number of gear teeth",
        type: "select",
        options: Object.keys(gearToothOptions),
        unit: "",
      },
      {
        key: "gearDiametralPitch",
        label: "Diametral pitch",
        hint: "teeth per inch of pitch diameter",
        type: "select",
        options: Object.keys(gearDiametralPitchOptions),
        unit: "",
      },
      {
        key: "gearPressureAngle",
        label: "Pressure angle",
        hint: "tooth flank angle",
        type: "select",
        options: Object.keys(gearPressureAngleOptions),
        unit: "",
      },
      { key: "gearFaceWidth", label: "Face width", hint: "axial gear tooth width", min: 0.04, max: 8, step: 0.001 },
      { key: "gearAddendum", label: "Addendum", hint: "tooth height above pitch circle", min: 0.005, max: 2, step: 0.001 },
      { key: "gearDedendum", label: "Dedendum", hint: "tooth depth below pitch circle", min: 0.005, max: 2, step: 0.001 },
      { key: "gearRimThickness", label: "Rim thickness", hint: "radial gear rim below tooth root", min: 0.04, max: 8, step: 0.001 },
    ],
  },
  {
    title: "Hub and keyway",
    fields: [
      { key: "shaftDiameter", label: "Shaft diameter", hint: "fixed bore; hub grows around it", min: 0.0625, max: 6, step: 0.001 },
      { key: "hubThickness", label: "Hub thickness", hint: "radial wall added around shaft", min: 0.03, max: 6, step: 0.001 },
      { key: "hubWidth", label: "Hub width", hint: "boss length centered on shaft", min: 0.125, max: 18, step: 0.001 },
      {
        key: "hubPosition",
        label: "Hub position",
        hint: "sets one hub face level with the gear face",
        type: "select",
        options: Object.keys(hubPositionOptions),
        unit: "",
      },
      { key: "keySlotWidth", label: "Key slot width", hint: "straight keyway width", min: 0, max: 2, step: 0.001 },
      { key: "keySlotDepth", label: "Key slot depth", hint: "depth above bore diameter", min: 0, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Set screw",
    fields: [
      { key: "setScrewEnabled", label: "Set screw boss", hint: "radial threaded boss on hub", type: "toggle" },
      {
        key: "setScrewThread",
        label: "Thread size",
        hint: "modeled set screw thread",
        type: "select",
        options: Object.keys(threadOptions),
        unit: "",
      },
      { key: "setScrewBossHeight", label: "Boss height", hint: "radial protrusion from hub", min: 0.05, max: 3, step: 0.001 },
      { key: "setScrewBossWidth", label: "Boss width", hint: "diameter of set screw pad", min: 0.1, max: 3, step: 0.001 },
      { key: "setScrewBossOffset", label: "Boss vertical offset", hint: "moves boss up or down on hub", min: -4, max: 4, step: 0.001 },
      { key: "setScrewAngle", label: "Set screw angle", hint: "position around hub", min: 0, max: 359, step: 1, unit: "deg" },
      { key: "setScrewIntersectAngle", label: "Intersect angle", hint: "tilts hole along the bore axis", min: -60, max: 60, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Radii",
    fields: [
      { key: "hubRadius", label: "Hub radius", hint: "outside hub edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "shaftRadius", label: "Shaft / keyway radius", hint: "bore and keyway mouth roundover", min: 0, max: 0.5, step: 0.001 },
      { key: "spokeRadius", label: "Spoke radius", hint: "spoke edge roundover", min: 0, max: 0.5, step: 0.001 },
    ],
  },
  {
    title: "Spokes",
    fields: [
      { key: "spokeCount", label: "Spoke count", hint: "use 0 for a solid web", min: 0, max: 24, step: 1, unit: "" },
      { key: "spokeWidth", label: "Spoke width", hint: "middle width of each spoke", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeHeight", label: "Spoke height", hint: "axial thickness through each spoke", min: 0.04, max: 8, step: 0.001 },
      { key: "spokeInnerWidth", label: "Inner end width", hint: "width where spoke meets hub", min: 0.04, max: 5, step: 0.001 },
      { key: "spokeOuterWidth", label: "Outer end width", hint: "width where spoke meets rim", min: 0.04, max: 5, step: 0.001 },
      { key: "curvedAngle", label: "Curved spoke angle", hint: "used when curved is selected", min: -85, max: 85, step: 1, unit: "deg" },
    ],
  },
];

const bevelGearDefaults = {
  bevelToothCount: "24",
  bevelMatingToothCount: "24",
  bevelDiametralPitch: "8",
  bevelPressureAngle: "20",
  bevelFaceWidth: 0.45,
  bevelAddendum: 0.125,
  bevelDedendum: 0.15625,
  shaftDiameter: 0.75,
  hubThickness: 0.35,
  hubWidth: 1,
  hubPosition: "backFlush",
  keySlotWidth: 0.1875,
  keySlotDepth: 0.09375,
  setScrewEnabled: false,
  setScrewThread: "1/4-20",
  setScrewBossHeight: 0.3,
  setScrewBossWidth: 0.5,
  setScrewBossOffset: 0,
  setScrewAngle: 315,
  setScrewIntersectAngle: 0,
  hubRadius: 0.04,
  shaftRadius: 0.01,
};

const bevelGearControlGroups = [
  {
    title: "Bevel teeth",
    fields: [
      {
        key: "bevelToothCount",
        label: "Tooth count",
        hint: "select the number of gear teeth",
        type: "select",
        options: Object.keys(gearToothOptions),
        unit: "",
      },
      {
        key: "bevelMatingToothCount",
        label: "Mating teeth",
        hint: "sets the pitch cone angle",
        type: "select",
        options: Object.keys(gearToothOptions),
        unit: "",
      },
      {
        key: "bevelDiametralPitch",
        label: "Diametral pitch",
        hint: "teeth per inch of pitch diameter",
        type: "select",
        options: Object.keys(gearDiametralPitchOptions),
        unit: "",
      },
      {
        key: "bevelPressureAngle",
        label: "Pressure angle",
        hint: "tooth flank angle",
        type: "select",
        options: Object.keys(gearPressureAngleOptions),
        unit: "",
      },
      { key: "bevelFaceWidth", label: "Face width", hint: "tooth length along the cone", min: 0.04, max: 8, step: 0.001 },
      { key: "bevelAddendum", label: "Addendum", hint: "tooth height above pitch cone", min: 0.005, max: 2, step: 0.001 },
      { key: "bevelDedendum", label: "Dedendum", hint: "tooth depth below pitch cone", min: 0.005, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Hub and keyway",
    fields: [
      { key: "shaftDiameter", label: "Shaft diameter", hint: "fixed bore; hub grows around it", min: 0.0625, max: 6, step: 0.001 },
      { key: "hubThickness", label: "Hub thickness", hint: "radial wall added around shaft", min: 0.03, max: 6, step: 0.001 },
      { key: "hubWidth", label: "Hub width", hint: "boss length along shaft", min: 0.125, max: 18, step: 0.001 },
      {
        key: "hubPosition",
        label: "Hub position",
        hint: "sets one hub face level with the gear face",
        type: "select",
        options: Object.keys(hubPositionOptions),
        unit: "",
      },
      { key: "keySlotWidth", label: "Key slot width", hint: "straight keyway width", min: 0, max: 2, step: 0.001 },
      { key: "keySlotDepth", label: "Key slot depth", hint: "depth above bore diameter", min: 0, max: 2, step: 0.001 },
    ],
  },
  {
    title: "Set screw",
    fields: [
      { key: "setScrewEnabled", label: "Set screw boss", hint: "radial threaded boss on hub", type: "toggle" },
      {
        key: "setScrewThread",
        label: "Thread size",
        hint: "modeled set screw thread",
        type: "select",
        options: Object.keys(threadOptions),
        unit: "",
      },
      { key: "setScrewBossHeight", label: "Boss height", hint: "radial protrusion from hub", min: 0.05, max: 3, step: 0.001 },
      { key: "setScrewBossWidth", label: "Boss width", hint: "diameter of set screw pad", min: 0.1, max: 3, step: 0.001 },
      { key: "setScrewBossOffset", label: "Boss vertical offset", hint: "moves boss up or down on hub", min: -4, max: 4, step: 0.001 },
      { key: "setScrewAngle", label: "Set screw angle", hint: "position around hub", min: 0, max: 359, step: 1, unit: "deg" },
      { key: "setScrewIntersectAngle", label: "Intersect angle", hint: "tilts hole along the bore axis", min: -60, max: 60, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Radii",
    fields: [
      { key: "hubRadius", label: "Hub radius", hint: "outside hub edge roundover", min: 0, max: 1, step: 0.001 },
      { key: "shaftRadius", label: "Shaft / keyway radius", hint: "bore and keyway mouth roundover", min: 0, max: 0.5, step: 0.001 },
    ],
  },
];

const shaftSpacerDefaults = {
  spacerOuterDiameter: 2,
  spacerBore: 1,
  spacerLength: 1.5,
  spacerKeySlotWidth: 0.25,
  spacerKeySlotDepth: 0.125,
  spacerOpenSlot: false,
};

const shaftSpacerControlGroups = [
  {
    title: "Shaft spacer",
    fields: [
      { key: "spacerOuterDiameter", label: "Outer diameter", hint: "outside sleeve diameter", min: 0.125, max: 18, step: 0.001 },
      { key: "spacerBore", label: "Bore", hint: "shaft hole diameter", min: 0.0625, max: 16, step: 0.001 },
      { key: "spacerLength", label: "Length", hint: "spacer length along shaft", min: 0.0625, max: 24, step: 0.001 },
      { key: "spacerKeySlotWidth", label: "Key slot width", hint: "straight keyway width", min: 0, max: 4, step: 0.001 },
      { key: "spacerKeySlotDepth", label: "Key slot depth", hint: "ignored when open slot is selected", min: 0, max: 4, step: 0.001 },
      { key: "spacerOpenSlot", label: "Open C slot", hint: "opens keyway through the outside", type: "toggle" },
    ],
  },
];

const lineshaftHangerDefaults = {
  hangerFrameStyle: "aFrame",
  hangerBoreDiameter: 0.3545,
  hangerHousingOuterDiameter: 0.75,
  hangerHousingWidth: 0.5,
  hangerCenterHeight: 3,
  hangerFrameDepth: 0.5,
  hangerLegThickness: 0.125,
  hangerLegFootInset: 0.288,
  hangerFootSpacing: 2.65,
  hangerFootPadDiameter: 0.82,
  hangerBoltHoleDiameter: 0.22,
  hangerBaseDepth: 0.5,
  hangerBaseThickness: 0.22,
};

const lineshaftHangerControlGroups = [
  {
    title: "Bearing housing",
    fields: [
      { key: "hangerBoreDiameter", label: "Bushing hole", hint: "through hole for bearing or bushing", min: 0.0625, max: 6, step: 0.001 },
      { key: "hangerHousingOuterDiameter", label: "Housing OD", hint: "outside diameter around the bore", min: 0.125, max: 12, step: 0.001 },
      { key: "hangerHousingWidth", label: "Housing width", hint: "depth through the hanger body", min: 0.125, max: 8, step: 0.001 },
      { key: "hangerCenterHeight", label: "Shaft center height", hint: "base bottom to bore center", min: 0.25, max: 24, step: 0.001 },
    ],
  },
  {
    title: "Frame",
    fields: [
      {
        key: "hangerFrameStyle",
        label: "Frame style",
        hint: "choose two legs or one center post",
        type: "select",
        options: ["aFrame", "centerPost"],
        optionLabels: { aFrame: "A frame", centerPost: "Center post" },
        unit: "",
      },
      { key: "hangerFrameDepth", label: "Frame depth", hint: "front-to-back leg thickness", min: 0.0625, max: 8, step: 0.001 },
      { key: "hangerLegThickness", label: "Leg thickness", hint: "side frame bar width", min: 0.04, max: 4, step: 0.001 },
      { key: "hangerLegFootInset", label: "A-frame foot inset", hint: "moves leg feet inward from bolt holes", min: 0, max: 8, step: 0.001, showWhen: { key: "hangerFrameStyle", value: "aFrame" } },
      { key: "hangerFootSpacing", label: "Foot spacing", hint: "mounting hole center distance", min: 0.25, max: 24, step: 0.001 },
    ],
  },
  {
    title: "Mounting feet",
    fields: [
      { key: "hangerFootPadDiameter", label: "Foot pad OD", hint: "round mounting pad outside size", min: 0.125, max: 8, step: 0.001 },
      { key: "hangerBoltHoleDiameter", label: "Bolt hole", hint: "through mounting hole diameter", min: 0.01, max: 4, step: 0.001 },
      { key: "hangerBaseDepth", label: "Base slab depth", hint: "solid bridge between round feet", min: 0.125, max: 12, step: 0.001 },
      { key: "hangerBaseThickness", label: "Base thickness", hint: "mounting pad thickness", min: 0.03, max: 4, step: 0.001 },
    ],
  },
];

const speedReductionBracketDefaults = {
  reducerShaftCount: "2",
  reducerSupportStyle: "straight",
  reducerSupportCurve: 0.18,
  reducerSupportCurve1: 0.18,
  reducerSupportCurve2: -0.18,
  reducerSupportCurve3: 0,
  reducerTopSupportCurve1: 0,
  reducerTopSupportCurve2: 0,
  reducerRightAngleOutput: false,
  reducerBoreDiameter: 0.3545,
  reducerHousingOuterDiameter: 0.75,
  reducerHousingWidth: 0.5,
  reducerPulley1Diameter: 2.5,
  reducerPulley2Diameter: 4.5,
  reducerPulley3Diameter: 2.25,
  reducerStage1Auto: true,
  reducerStage2Auto: true,
  reducerManualCenterDistance: 3.3823069050575527,
  reducerManualCenterDistance2: 3.252787266330216,
  reducerShaft1Height: 1.35,
  reducerShaft2Height: 2.25,
  reducerShaft3Height: 1.35,
  reducerTopSupportEnabled: true,
  reducerFrameDepth: 0.5,
  reducerArmThickness: 0.16,
  reducerPostWidth: 0.28,
  reducerBaseMargin: 0.45,
  reducerFootPadDiameter: 0.82,
  reducerBoltHoleDiameter: 0.22,
  reducerBaseDepth: 0.5,
  reducerBaseThickness: 0.22,
};

const speedReductionBracketControlGroups = [
  {
    title: "Shaft housings",
    fields: [
      {
        key: "reducerShaftCount",
        label: "Shaft count",
        hint: "two or three shaft supports",
        type: "select",
        options: ["2", "3"],
        optionLabels: { "2": "Two shafts", "3": "Three shafts" },
        unit: "",
      },
      { key: "reducerBoreDiameter", label: "Bushing hole", hint: "through hole for bearing or bushing", min: 0.0625, max: 6, step: 0.001 },
      { key: "reducerHousingOuterDiameter", label: "Housing OD", hint: "outside diameter around each shaft", min: 0.125, max: 12, step: 0.001 },
      { key: "reducerHousingWidth", label: "Housing width", hint: "depth through each shaft carrier", min: 0.125, max: 8, step: 0.001 },
      { key: "reducerRightAngleOutput", label: "90 degree output", hint: "adds a cross-bore housing for bevel gears", type: "toggle" },
    ],
  },
  {
    title: "Spacing",
    fields: [
      { key: "reducerPulley1Diameter", label: "Shaft 1 pulley OD", hint: "construction circle for pulley or gear size", min: 0.125, max: 48, step: 0.001 },
      { key: "reducerPulley2Diameter", label: "Shaft 2 pulley OD", hint: "construction circle for pulley or gear size", min: 0.125, max: 48, step: 0.001 },
      { key: "reducerPulley3Diameter", label: "Shaft 3 pulley OD", hint: "diameter on the third shaft", min: 0.125, max: 48, step: 0.001, showWhen: { key: "reducerShaftCount", value: "3" } },
      { key: "reducerStage1Auto", label: "Auto stage 1", hint: "snap shaft 1 to shaft 2 circles tangent", type: "toggle" },
      { key: "reducerManualCenterDistance", label: "Stage 1 X offset", hint: "left-right offset; editing turns auto stage 1 off", min: -48, max: 48, step: 0.001 },
      { key: "reducerStage2Auto", label: "Auto stage 2", hint: "snap shaft 2 to shaft 3 circles tangent", type: "toggle", showWhen: { key: "reducerShaftCount", value: "3" } },
      { key: "reducerManualCenterDistance2", label: "Stage 2 X offset", hint: "left-right offset; editing turns auto stage 2 off", min: -48, max: 48, step: 0.001, showWhen: { key: "reducerShaftCount", value: "3" } },
      { key: "reducerShaft1Height", label: "Shaft 1 height", hint: "base top to shaft 1 center", min: 0.25, max: 24, step: 0.001 },
      { key: "reducerShaft2Height", label: "Shaft 2 height", hint: "base top to shaft 2 center", min: 0.25, max: 24, step: 0.001 },
      { key: "reducerShaft3Height", label: "Shaft 3 height", hint: "base top to shaft 3 center", min: 0.25, max: 24, step: 0.001, showWhen: { key: "reducerShaftCount", value: "3" } },
    ],
  },
  {
    title: "Frame",
    fields: [
      {
        key: "reducerSupportStyle",
        label: "Support style",
        hint: "straight cast posts or cosmetically curved posts",
        type: "select",
        options: ["straight", "curved"],
        optionLabels: { straight: "Straight supports", curved: "Curved supports" },
        unit: "",
      },
      { key: "reducerTopSupportEnabled", label: "Top cross bar", hint: "solid upper support between shaft housings", type: "toggle" },
      { key: "reducerSupportCurve1", label: "Shaft 1 post curve", hint: "positive bows right; negative bows left", min: -4, max: 4, step: 0.001, showWhen: { key: "reducerSupportStyle", value: "curved" } },
      { key: "reducerSupportCurve2", label: "Shaft 2 post curve", hint: "positive bows right; negative bows left", min: -4, max: 4, step: 0.001, showWhen: { key: "reducerSupportStyle", value: "curved" } },
      { key: "reducerSupportCurve3", label: "Shaft 3 post curve", hint: "positive bows right; negative bows left", min: -4, max: 4, step: 0.001, showWhenAll: [{ key: "reducerSupportStyle", value: "curved" }, { key: "reducerShaftCount", value: "3" }] },
      { key: "reducerTopSupportCurve1", label: "Top rail 1 curve", hint: "positive bows above the rail; negative bows below", min: -4, max: 4, step: 0.001, showWhenAll: [{ key: "reducerSupportStyle", value: "curved" }, { key: "reducerTopSupportEnabled", value: true }] },
      { key: "reducerTopSupportCurve2", label: "Top rail 2 curve", hint: "positive bows above the rail; negative bows below", min: -4, max: 4, step: 0.001, showWhenAll: [{ key: "reducerSupportStyle", value: "curved" }, { key: "reducerShaftCount", value: "3" }, { key: "reducerTopSupportEnabled", value: true }] },
      { key: "reducerFrameDepth", label: "Frame depth", hint: "front-to-back bracket thickness", min: 0.0625, max: 8, step: 0.001 },
      { key: "reducerArmThickness", label: "Rail thickness", hint: "old-style connecting rib width", min: 0.04, max: 4, step: 0.001 },
      { key: "reducerPostWidth", label: "Post width", hint: "upright support width below housings", min: 0.04, max: 6, step: 0.001 },
      { key: "reducerBaseMargin", label: "Base margin", hint: "extra base beyond outer shaft centers", min: 0, max: 12, step: 0.001 },
    ],
  },
  {
    title: "Mounting feet",
    fields: [
      { key: "reducerFootPadDiameter", label: "Foot pad OD", hint: "round mounting pad outside size", min: 0.125, max: 8, step: 0.001 },
      { key: "reducerBoltHoleDiameter", label: "Bolt hole", hint: "through mounting hole diameter", min: 0.01, max: 4, step: 0.001 },
      { key: "reducerBaseDepth", label: "Base slab depth", hint: "solid bridge between round feet", min: 0.125, max: 12, step: 0.001 },
      { key: "reducerBaseThickness", label: "Base thickness", hint: "mounting pad thickness", min: 0.03, max: 4, step: 0.001 },
    ],
  },
];

const headGasketDefaults = {
  gasketOuterDiameter: 4.5,
  gasketBoreDiameter: 3,
  gasketBoltCount: 5,
  gasketBoltCircleOffset: 0.38,
  gasketBoltHoleDiameter: 0.4,
  gasketBoltStartAngle: 90,
  gasketSlotCount: 5,
  gasketSlotCircleOffset: 0.337,
  gasketSlotLength: 0.78,
  gasketSlotWidth: 0.3,
  gasketSlotStartAngle: 55,
};

const headGasketControlGroups = [
  {
    title: "Gasket outline",
    fields: [
      { key: "gasketOuterDiameter", label: "Outer diameter", hint: "outside cut diameter", min: 0.25, max: 48, step: 0.001 },
      { key: "gasketBoreDiameter", label: "Bore diameter", hint: "center cylinder opening", min: 0.0625, max: 40, step: 0.001 },
    ],
  },
  {
    title: "Bolt holes",
    fields: [
      { key: "gasketBoltCount", label: "Hole count", hint: "number of round bolt holes", min: 0, max: 36, step: 1, unit: "" },
      { key: "gasketBoltCircleOffset", label: "Bolt circle offset", hint: "from bore edge to hole centers", min: 0, max: 24, step: 0.001 },
      { key: "gasketBoltHoleDiameter", label: "Hole diameter", hint: "round bolt hole cut size", min: 0.01, max: 4, step: 0.001 },
      { key: "gasketBoltStartAngle", label: "Start angle", hint: "angle of first bolt hole", min: -360, max: 360, step: 1, unit: "deg" },
    ],
  },
  {
    title: "Water slots",
    fields: [
      {
        key: "gasketSlotCount",
        label: "Slot count",
        hint: "add or remove curved water slots",
        type: "select",
        options: ["0", "1", "2", "3", "4", "5", "6"],
        optionLabels: { "0": "None" },
        unit: "",
      },
      { key: "gasketSlotCircleOffset", label: "Slot circle offset", hint: "from bore edge to slot centerline", min: 0, max: 24, step: 0.001 },
      { key: "gasketSlotLength", label: "Slot arc length", hint: "length along the gasket curve", min: 0.01, max: 12, step: 0.001 },
      { key: "gasketSlotWidth", label: "Slot width", hint: "radial distance between slot arcs", min: 0.01, max: 4, step: 0.001 },
      { key: "gasketSlotStartAngle", label: "Start angle", hint: "angle of first slot", min: -360, max: 360, step: 1, unit: "deg" },
    ],
  },
];

const ignitorGasketDefaults = {
  ignitorStyle: "square",
  ignitorCenterCircleDiameter: 1,
  ignitorCenterSquareWidth: 0.684,
  ignitorCenterSquareHeight: 1.035,
  ignitorCenterSquareRadius: 0.08,
  ignitorRoundBodyMargin: 0.18,
  ignitorRoundBoltPadRadius: 0.22,
  ignitorOuterSideMargin: 0.62,
  ignitorOuterTopMargin: 0.1,
  ignitorOuterBottomMargin: 0.5,
  ignitorOuterCornerRadius: 0.42,
  ignitorBoltHoleDiameter: 0.25,
  ignitorBoltOffset: 0.36,
  ignitorBoltVerticalOffset: 0,
};

const ignitorStyleOptions = {
  round: { label: "Round center" },
  square: { label: "Square center" },
};

const ignitorGasketControlGroups = [
  {
    title: "Style",
    fields: [
      {
        key: "ignitorStyle",
        label: "Gasket style",
        hint: "renders one ignitor gasket style",
        type: "select",
        options: Object.keys(ignitorStyleOptions),
        unit: "",
      },
    ],
  },
  {
    title: "Center opening",
    fields: [
      { key: "ignitorCenterCircleDiameter", label: "Circle diameter", hint: "round-center opening diameter", min: 0.05, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "round" } },
      { key: "ignitorCenterSquareWidth", label: "Square width", hint: "square-center opening width", min: 0.05, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
      { key: "ignitorCenterSquareHeight", label: "Square height", hint: "square-center opening height", min: 0.05, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
      { key: "ignitorCenterSquareRadius", label: "Square corner radius", hint: "inside corner roundover", min: 0, max: 2, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
    ],
  },
  {
    title: "Outer gasket",
    fields: [
      { key: "ignitorRoundBodyMargin", label: "Body margin", hint: "round opening edge to outer curve", min: 0.01, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "round" } },
      { key: "ignitorRoundBoltPadRadius", label: "Bolt pad radius", hint: "outside radius around each bolt hole", min: 0.01, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "round" } },
      { key: "ignitorOuterSideMargin", label: "Side margin", hint: "square opening side to outside", min: 0.01, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
      { key: "ignitorOuterTopMargin", label: "Top margin", hint: "square opening top to outside", min: 0.01, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
      { key: "ignitorOuterBottomMargin", label: "Bottom margin", hint: "square opening bottom to outside", min: 0.01, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
      { key: "ignitorOuterCornerRadius", label: "Outer corner radius", hint: "reserved for rounded outside styles", min: 0, max: 12, step: 0.001, showWhen: { key: "ignitorStyle", value: "square" } },
    ],
  },
  {
    title: "Bolt holes",
    fields: [
      { key: "ignitorBoltHoleDiameter", label: "Hole diameter", hint: "round mounting holes", min: 0.01, max: 4, step: 0.001 },
      { key: "ignitorBoltOffset", label: "Hole offset", hint: "center opening side to hole centers", min: 0, max: 12, step: 0.001 },
      { key: "ignitorBoltVerticalOffset", label: "Hole vertical offset", hint: "moves both holes above or below opening", min: -12, max: 12, step: 0.001 },
    ],
  },
];

const dripOilerGasketDefaults = {
  dripOilerOuterDiameter: 1,
  dripOilerInnerDiameter: 0.85,
};

const dripOilerGasketControlGroups = [
  {
    title: "Drip oiler gasket",
    fields: [
      { key: "dripOilerOuterDiameter", label: "OD", hint: "outside cut diameter", min: 0.05, max: 24, step: 0.001 },
      { key: "dripOilerInnerDiameter", label: "ID", hint: "inside hole diameter", min: 0.01, max: 24, step: 0.001 },
    ],
  },
];

