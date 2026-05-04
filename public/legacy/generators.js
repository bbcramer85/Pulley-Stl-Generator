function generatePulleyMesh(params) {
  const mesh = new MeshBuilder();
  const sides = 112;
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const baseR = params.diameter / 2;
  const rimInnerR = computeRimInnerRadius(params, hubR, baseR);
  const profile = buildRimProfile(params, baseR);
  const spokeHeight = computeSpokeHeight(params);
  const setScrewCut = params.setScrewEnabled ? computeSetScrewCut(params) : null;

  addRim(mesh, profile, rimInnerR, sides, clampRimRadius(params.rimRadius, params, rimInnerR, baseR));
  addKeyedHub(
    mesh,
    hubR,
    boreR,
    params.keySlotWidth,
    params.hubWidth,
    sides + 24,
    clampHubRadius(params.hubRadius, params, hubR, boreR),
    clampShaftRadius(params.shaftRadius, params, hubR, boreR),
    setScrewCut
  );

  if (params.setScrewEnabled) {
    addSetScrewFeature(mesh, params, hubR, boreR);
  }

  if (params.spokeCount === 0) {
    addAnnularCylinder(mesh, computeSpokeInnerRadius(params, hubR, boreR), rimInnerR * 1.04, spokeHeight, sides, params.spokeRadius);
  } else {
    addSpokes(mesh, params, hubR, boreR, rimInnerR, spokeHeight, clampSpokeRadius(params.spokeRadius, params), setScrewCut);
  }

  const repairCaps = closeBoundaryLoops(mesh, setScrewCut);

  return {
    triangles: mesh.triangles,
    derived: {
      boreDiameter: boreR * 2,
      hubDiameter: hubR * 2,
      rimThickness: baseR - rimInnerR,
      rimInnerDiameter: rimInnerR * 2,
      spokeHeight,
      setScrew: params.setScrewEnabled ? params.setScrewThread : "",
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function generateVBeltPulleyMesh(params) {
  const mesh = new MeshBuilder();
  const sides = 128;
  const boreR = params.shaftDiameter / 2;
  const hubR = boreR + params.hubThickness;
  const outerR = params.vOuterDiameter / 2;
  const groove = computeVBeltGrooveGeometry(params, outerR);
  const rimInnerR = computeVBeltRimInnerRadius(params, hubR, groove.rootR);
  const profile = buildVBeltRimProfile(params, outerR, groove);
  const spokeHeight = computeSpokeHeight(params);
  const setScrewCut = params.setScrewEnabled ? computeSetScrewCut(params) : null;

  addRim(mesh, profile, rimInnerR, sides, clampVBeltRimRadius(params.rimRadius, params, rimInnerR, groove.rootR));
  addKeyedHub(
    mesh,
    hubR,
    boreR,
    params.keySlotWidth,
    params.hubWidth,
    sides + 16,
    clampHubRadius(params.hubRadius, params, hubR, boreR),
    clampShaftRadius(params.shaftRadius, params, hubR, boreR),
    setScrewCut,
    params.keySlotDepth,
    computeHubZOffset(params, params.vOverallWidth)
  );

  if (params.setScrewEnabled) {
    addSetScrewFeature(mesh, params, hubR, boreR);
  }

  if (params.spokeCount === 0) {
    addAnnularCylinder(mesh, computeSpokeInnerRadius(params, hubR, boreR), rimInnerR * 1.04, spokeHeight, sides, params.spokeRadius);
  } else {
    addSpokes(mesh, params, hubR, boreR, rimInnerR, spokeHeight, clampSpokeRadius(params.spokeRadius, params), setScrewCut);
  }

  const repairCaps = closeBoundaryLoops(mesh, setScrewCut);

  return {
    triangles: mesh.triangles,
    derived: {
      outerDiameter: outerR * 2,
      boreDiameter: boreR * 2,
      hubDiameter: hubR * 2,
      rimInnerDiameter: rimInnerR * 2,
      rimThickness: groove.rootR - rimInnerR,
      grooveTopWidth: groove.topWidth,
      grooveDepth: groove.depth,
      grooveAngle: groove.effectiveAngle,
      grooveRootWidth: groove.rootWidth,
      spokeHeight,
      setScrew: params.setScrewEnabled ? params.setScrewThread : "",
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

function generateShaftSpacerMesh(params) {
  const mesh = new MeshBuilder();
  const sides = 128;
  const outerR = params.spacerOuterDiameter / 2;
  const boreR = params.spacerBore / 2;
  const z0 = -params.spacerLength / 2;
  const z1 = params.spacerLength / 2;

  if (params.spacerOpenSlot) {
    const openPath = buildOpenShaftSpacerPath(outerR, boreR, params.spacerKeySlotWidth, sides);
    addExtrudedPolygon(mesh, openPath, z0, z1);
  } else {
    const borePath = buildKeyedHolePath(boreR, params.spacerKeySlotWidth, params.spacerKeySlotDepth, sides);
    const angles = borePath.map(pointAngle);

    addCylinderSideWithAngles(mesh, outerR, z0, z1, angles, false);
    addKeyedPathSide(mesh, borePath, z0, z1);
    addKeyedCap(mesh, outerR, borePath, z0, -1);
    addKeyedCap(mesh, outerR, borePath, z1, 1);
  }

  const repairCaps = closeBoundaryLoops(mesh);

  return {
    triangles: mesh.triangles,
    derived: {
      boreDiameter: boreR * 2,
      outerDiameter: outerR * 2,
      length: params.spacerLength,
      keySlotWidth: params.spacerKeySlotWidth,
      keySlotDepth: params.spacerKeySlotDepth,
      openSlot: params.spacerOpenSlot,
      repairCaps,
      triangleCount: mesh.triangles.length,
    },
  };
}

