<script>
  import { onMount } from "svelte";
  import CreatorCard from "./CreatorCard.svelte";
  import { driveSupplyAffiliateCards } from "../affiliates.js";

  export let mode = "speed";

  let n1 = 300;
  let targetMin = 40;
  let targetMax = 60;
  let useDrive = true;
  let showAnimation = true;
  let driveDia = 24;
  let driveUnit = "in";
  let showBeltTrain = true;
  let showGearTrain = true;
  let showIceCreamDisplay = true;
  let nextStageId = 3;
  let belts = [
    { id: "belt-1", driver: 5, driven: 12, twisted: false },
    { id: "belt-2", driver: 6, driven: 16, twisted: false },
  ];
  let shaftSpacings = [170, 170];
  let straights = [];
  let stageOrder = [
    { type: "belt", id: "belt-1" },
    { type: "belt", id: "belt-2" },
  ];
  const visibleAffiliateCount = 3;
  const affiliateRotationMs = 9000;
  let rotatingAffiliateCards = driveSupplyAffiliateCards.slice(0, visibleAffiliateCount);
  let lastAffiliateSignature = rotatingAffiliateCards.map((card) => card.href).join("|");
  let compactAnimationLayout = false;

  function shuffledAffiliateCards() {
    const cards = [...driveSupplyAffiliateCards];

    for (let index = cards.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
    }

    return cards;
  }

  function rotateAffiliateCards() {
    if (driveSupplyAffiliateCards.length <= visibleAffiliateCount) {
      rotatingAffiliateCards = driveSupplyAffiliateCards;
      return;
    }

    let nextCards = shuffledAffiliateCards().slice(0, visibleAffiliateCount);
    const nextSignature = nextCards.map((card) => card.href).join("|");

    if (nextSignature === lastAffiliateSignature) {
      nextCards = [...nextCards.slice(1), nextCards[0]];
    }

    lastAffiliateSignature = nextCards.map((card) => card.href).join("|");
    rotatingAffiliateCards = nextCards;
  }

  onMount(() => {
    rotateAffiliateCards();
    const affiliateTimer = window.setInterval(rotateAffiliateCards, affiliateRotationMs);
    const compactQuery = window.matchMedia("(max-width: 900px)");
    const updateCompactLayout = () => {
      compactAnimationLayout = compactQuery.matches;
    };

    updateCompactLayout();
    compactQuery.addEventListener("change", updateCompactLayout);

    return () => {
      window.clearInterval(affiliateTimer);
      compactQuery.removeEventListener("change", updateCompactLayout);
    };
  });

  const safe = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  const fmt = (value, digits = 2) => (Number.isFinite(value) ? value.toFixed(digits) : "-");
  const period = (rpm) => (Number.isFinite(rpm) && rpm > 0 ? Math.max(0.16, Math.min(6, 60 / rpm)) : 2);
  const leaderName = "LEADER";
  const leaderStartRpm = 625;
  const leaderEndRpm = 975;

  function leaderLetters(rpm) {
    if (!Number.isFinite(rpm) || rpm < leaderStartRpm) return "";
    const step = (leaderEndRpm - leaderStartRpm) / (leaderName.length - 1);
    const count = Math.min(leaderName.length, Math.floor((rpm - leaderStartRpm) / step) + 1);
    return leaderName.slice(0, count);
  }

  function engineShakeLevel(rpm) {
    if (!Number.isFinite(rpm) || rpm < 750 || rpm >= 1000) return 0;
    return Math.min(1, Math.max(0.18, (rpm - 750) / 249));
  }

  function steamLevel(rpm) {
    if (!Number.isFinite(rpm) || rpm < 400) return 0;
    if (rpm >= 600) return 1;
    return Math.max(0.15, (rpm - 400) / 200);
  }

  function rpmStopped(rpm) {
    return !Number.isFinite(rpm) || rpm <= 0;
  }

  function iceCreamMakerState(rpm) {
    if (!Number.isFinite(rpm)) {
      return { tone: "slow", label: "Check RPM", text: "Use a valid final RPM." };
    }
    if (rpm < 40) {
      return { tone: "slow", label: "Too Slow", text: "Below 40 rpm." };
    }
    if (rpm <= 60) {
      return { tone: "sweet", label: "Sweet Spot", text: "40-60 rpm churn range." };
    }
    return { tone: "fast", label: "Too Fast", text: "Over 60 rpm." };
  }

  function pulleyRadiusFromDiameter(value, scale = 2.1, minRadius = 10, maxRadius = 62) {
    if (!safe(value)) return minRadius;
    const scaledRadius = Number(value) * scale;
    if (scaledRadius <= maxRadius) {
      return Math.max(minRadius, scaledRadius);
    }

    const extraRadius = Math.sqrt(scaledRadius - maxRadius) * 3.2;
    return Math.max(minRadius, Math.min(maxRadius * 1.65, maxRadius + extraRadius));
  }

  function wheelRadius(value, maxValue, maxRadius = 58) {
    if (!safe(value)) return 18;
    return pulleyRadiusFromDiameter(value, 2.1, 13, maxRadius);
  }

  function gearRadius(value, maxValue, maxRadius = 31) {
    if (!safe(value) || !safe(maxValue)) return 14;
    return Math.max(14, Math.min(maxRadius, (Number(value) / Number(maxValue)) * maxRadius));
  }

  function crossedBeltTangents(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    const radiusSum = r1 + r2;

    if (distSq <= radiusSum * radiusSum) {
      return [
        { x1: x1 + r1, y1: y1 - r1 * 0.32, x2: x2 - r2, y2: y2 + r2 * 0.32 },
        { x1: x1 + r1, y1: y1 + r1 * 0.32, x2: x2 - r2, y2: y2 - r2 * 0.32 },
      ];
    }

    const c = radiusSum / distSq;
    const h = Math.sqrt(distSq - radiusSum * radiusSum) / distSq;
    return [1, -1].map((side) => {
      const nx = dx * c - side * dy * h;
      const ny = dy * c + side * dx * h;
      return {
        x1: x1 + nx * r1,
        y1: y1 + ny * r1,
        x2: x2 - nx * r2,
        y2: y2 - ny * r2,
      };
    });
  }

  function gearPath(cx, cy, r, teeth = 18) {
    const toothCount = Math.max(8, Math.min(48, Math.round(teeth)));
    const inner = r * 0.78;
    const step = (Math.PI * 2) / (toothCount * 2);
    let path = "";
    for (let i = 0; i < toothCount * 2; i += 1) {
      const angle = i * step - Math.PI / 2;
      const radius = i % 2 === 0 ? r : inner;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      path += `${i === 0 ? "M" : "L"} ${x} ${y} `;
    }
    return `${path}Z`;
  }

  function shaftX(index) {
    return 150 + shaftSpacings.slice(0, index).reduce((sum, spacing) => sum + Number(spacing || 170), 0);
  }

  function inlineGearLayout(stages, startX, startY = 118, endY = 118) {
    let driverX = startX;
    let driverY = startY;

    return stages.map((stage, index) => {
      const maxSize = Math.max(stage.driver, stage.driven);
      const driverRadius = gearRadius(stage.driver, maxSize);
      const drivenRadius = gearRadius(stage.driven, maxSize);
      const drivenY = startY + ((endY - startY) * (index + 1)) / stages.length;
      const gearDistance = driverRadius + drivenRadius + 3;
      const dy = drivenY - driverY;
      const drivenX = driverX + Math.sqrt(Math.max(18 * 18, gearDistance * gearDistance - dy * dy));
      const layout = {
        ...stage,
        driverX,
        driverY,
        drivenX,
        drivenY,
        driverRadius,
        drivenRadius,
        labelX: driverX + (drivenX - driverX) / 2,
        labelY: Math.max(24, Math.min(driverY - driverRadius, drivenY - drivenRadius) - 10),
      };
      driverX = drivenX;
      driverY = drivenY;
      return layout;
    });
  }

  function orderedStageDefinitions() {
    const beltById = new Map(belts.map((stage, index) => [stage.id, { stage, sourceIndex: index }]));
    const gearById = new Map(straights.map((stage, index) => [stage.id, { stage, sourceIndex: index }]));
    const used = new Set();
    const ordered = [];

    stageOrder.forEach((entry) => {
      const source = entry.type === "belt" ? beltById.get(entry.id) : gearById.get(entry.id);
      if (!source) return;
      used.add(`${entry.type}:${entry.id}`);
      ordered.push({ type: entry.type, id: entry.id, sourceIndex: source.sourceIndex, stage: source.stage });
    });

    belts.forEach((stage, sourceIndex) => {
      if (!used.has(`belt:${stage.id}`)) {
        ordered.push({ type: "belt", id: stage.id, sourceIndex, stage });
      }
    });

    straights.forEach((stage, sourceIndex) => {
      if (!used.has(`gear:${stage.id}`)) {
        ordered.push({ type: "gear", id: stage.id, sourceIndex, stage });
      }
    });

    return ordered;
  }

  function chainStageLayout(stages, startX, startY, endY, showMixer, enginePulleyRadius, minimumSpacing = 95) {
    let currentX = startX;
    let currentY = startY;

    return stages.map((stage, index) => {
      const targetY = showMixer ? startY + ((endY - startY) * (index + 1)) / stages.length : startY;
      const maxSize = Math.max(stage.driver, stage.driven);

      if (stage.type === "belt") {
        const driverRadius = index === 0 ? enginePulleyRadius : wheelRadius(stage.driver, maxSize, 58);
        const drivenRadius = wheelRadius(stage.driven, maxSize, 58);
        const spacing = Math.max(minimumSpacing, Number(stage.spacing || 170));
        const drivenX = currentX + spacing;
        const labelY = Math.max(24, Math.min(currentY - driverRadius, targetY - drivenRadius) - 12);
        const layout = {
          ...stage,
          driverX: currentX,
          driverY: currentY,
          drivenX,
          drivenY: targetY,
          driverRadius,
          drivenRadius,
          labelX: currentX + (drivenX - currentX) / 2,
          labelY,
        };
        currentX = drivenX;
        currentY = targetY;
        return layout;
      }

      const driverRadius = gearRadius(stage.driver, maxSize);
      const drivenRadius = gearRadius(stage.driven, maxSize);
      const gearDistance = driverRadius + drivenRadius + 3;
      const dy = targetY - currentY;
      const drivenX = currentX + Math.sqrt(Math.max(18 * 18, gearDistance * gearDistance - dy * dy));
      const layout = {
        ...stage,
        driverX: currentX,
        driverY: currentY,
        drivenX,
        drivenY: targetY,
        driverRadius,
        drivenRadius,
        labelX: currentX + (drivenX - currentX) / 2,
        labelY: Math.max(24, Math.min(currentY - driverRadius, targetY - drivenRadius) - 10),
      };
      currentX = drivenX;
      currentY = targetY;
      return layout;
    });
  }

  function tractorStageLayout(stages, startX, startY, endX, endY, enginePulleyRadius) {
    const count = stages.length;
    if (count === 0) return [];

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / distance;
    const uy = dy / distance;

    const metrics = stages.map((stage, index) => {
      const maxSize = Math.max(stage.driver, stage.driven);
      const driverRadius = stage.type === "belt"
        ? index === 0 ? enginePulleyRadius : wheelRadius(stage.driver, maxSize, 58)
        : gearRadius(stage.driver, maxSize);
      const drivenRadius = stage.type === "belt"
        ? wheelRadius(stage.driven, maxSize, 58)
        : gearRadius(stage.driven, maxSize);

      return {
        driverRadius,
        drivenRadius,
        length: stage.type === "gear"
          ? driverRadius + drivenRadius + 3
          : Math.max(95, Number(stage.spacing || 170)),
      };
    });

    const beltCount = stages.filter((stage) => stage.type === "belt").length;
    const fixedGearLength = metrics.reduce((sum, metric, index) => (
      stages[index].type === "gear" ? sum + metric.length : sum
    ), 0);
    const baseBeltLength = metrics.reduce((sum, metric, index) => (
      stages[index].type === "belt" ? sum + metric.length : sum
    ), 0);
    const beltExtra = beltCount > 0 ? (distance - fixedGearLength - baseBeltLength) / beltCount : 0;
    const lengths = metrics.map((metric, index) => (
      stages[index].type === "belt" ? Math.max(45, metric.length + beltExtra) : metric.length
    ));

    const points = Array.from({ length: count + 1 }, () => ({ x: startX, y: startY }));

    if (beltCount === 0) {
      let cursor = distance;
      points[count] = { x: endX, y: endY };
      for (let index = count - 1; index >= 0; index -= 1) {
        cursor -= lengths[index];
        points[index] = {
          x: startX + ux * cursor,
          y: startY + uy * cursor,
        };
      }
    } else {
      let cursor = 0;
      points[0] = { x: startX, y: startY };
      lengths.forEach((length, index) => {
        cursor += length;
        points[index + 1] = {
          x: startX + ux * cursor,
          y: startY + uy * cursor,
        };
      });
      points[count] = { x: endX, y: endY };
    }

    return stages.map((stage, index) => {
      const driver = points[index];
      const driven = points[index + 1];
      const { driverRadius, drivenRadius } = metrics[index];

      const layout = {
        ...stage,
        driverX: driver.x,
        driverY: driver.y,
        drivenX: driven.x,
        drivenY: driven.y,
        driverRadius,
        drivenRadius,
        labelX: driver.x + (driven.x - driver.x) / 2,
        labelY: Math.max(24, Math.min(driver.y - driverRadius, driven.y - drivenRadius) - 10),
      };

      return layout;
    });
  }

  function calculate() {
    const inputRpm = Number(n1);
    const minTarget = Math.min(Number(targetMin), Number(targetMax));
    const maxTarget = Math.max(Number(targetMin), Number(targetMax));
    let rpm = inputRpm;
    let direction = 1;
    let valid = safe(inputRpm);
    let beltProduct = 1;
    let gearProduct = 1;
    let afterBelts = inputRpm;
    let beltLabelIndex = 0;
    let gearLabelIndex = 0;
    const beltStages = [];
    const straightStages = [];
    const orderedStages = [];

    orderedStageDefinitions().forEach((entry, orderIndex) => {
      const driver = Number(entry.stage.driver);
      const driven = Number(entry.stage.driven);
      valid = valid && safe(driver) && safe(driven);
      const inRpm = rpm;
      const inDirection = direction;
      rpm = valid ? rpm * (driver / driven) : NaN;
      const stageRatio = safe(driver) && safe(driven) ? driver / driven : 1;

      if (entry.type === "belt") {
        beltProduct *= stageRatio;
        direction = entry.stage.twisted ? -direction : direction;
        afterBelts = rpm;
        beltLabelIndex += 1;
        const computed = {
          ...entry.stage,
          type: "belt",
          orderIndex,
          sourceIndex: entry.sourceIndex,
          labelIndex: beltLabelIndex,
          spacing: shaftSpacings[entry.sourceIndex] ?? 170,
          driver,
          driven,
          inRpm,
          outRpm: rpm,
          inDirection,
          outDirection: direction,
        };
        beltStages.push(computed);
        orderedStages.push(computed);
        return;
      }

      gearProduct *= stageRatio;
      direction = -direction;
      gearLabelIndex += 1;
      const computed = {
        ...entry.stage,
        type: "gear",
        orderIndex,
        sourceIndex: entry.sourceIndex,
        labelIndex: gearLabelIndex,
        driver,
        driven,
        inRpm,
        outRpm: rpm,
        inDirection,
        outDirection: direction,
      };
      straightStages.push(computed);
      orderedStages.push(computed);
    });

    const finalRpm = rpm;
    const overall = beltProduct * gearProduct;
    const targetValid = Number.isFinite(minTarget) && Number.isFinite(maxTarget) && minTarget >= 0 && maxTarget >= 0;
    const wheelDiaIn = driveUnit === "mm" ? Number(driveDia) / 25.4 : Number(driveDia);
    const travelMph = useDrive && safe(wheelDiaIn) && Number.isFinite(finalRpm)
      ? finalRpm * Math.PI * wheelDiaIn * 60 / 63360
      : NaN;
    const status = !valid
      ? { label: "Check Inputs", tone: "danger", text: "Use positive RPM and diameter values." }
      : !targetValid
        ? { label: "Set Range", tone: "warning", text: "Use non-negative target min and max RPM." }
        : finalRpm < minTarget
          ? { label: "Low", tone: "warning", text: `${fmt(minTarget - finalRpm)} rpm below target.` }
          : finalRpm > maxTarget
            ? { label: "High", tone: "danger", text: `${fmt(finalRpm - maxTarget)} rpm above target.` }
            : { label: "In Range", tone: "good", text: `Inside ${fmt(minTarget)}-${fmt(maxTarget)} rpm target.` };

    return {
      valid,
      beltStages,
      straightStages,
      orderedStages,
      afterBelts,
      finalRpm,
      beltProduct,
      gearProduct,
      overall,
      torqueRatio: overall > 0 ? 1 / overall : NaN,
      targetMin: minTarget,
      targetMax: maxTarget,
      status,
      wheelDiaIn,
      travelMph,
      finalDirection: direction,
      twistCount: belts.filter((stage) => stage.twisted).length,
    };
  }

  let calc = calculate();
  $: {
    n1;
    targetMin;
    targetMax;
    useDrive;
    driveDia;
    driveUnit;
    belts;
    straights;
    stageOrder;
    calc = calculate();
  }
  $: ratioLabel = !Number.isFinite(calc.overall)
    ? "-"
    : Math.abs(calc.overall - 1) < 1e-12
      ? `${fmt(calc.overall)}:1 direct`
      : calc.overall < 1
        ? `${fmt(1 / calc.overall)}:1 reduction`
        : `${fmt(calc.overall)}:1 step-up`;
  $: engineSliderMax = Math.max(1000, Math.ceil((Number(n1) || 0) / 100) * 100);
  $: renderLayers = [
    { id: "belts", label: "Belts", active: showBeltTrain },
    ...(straights.length > 0 ? [{ id: "gears", label: "Gears", active: showGearTrain }] : []),
    { id: "iceCream", label: "Ice Cream", active: showIceCreamDisplay },
  ];
  $: hasVisibleRenderLayer =
    (showAnimation && showBeltTrain && calc.beltStages.length > 0) ||
    (showAnimation && showGearTrain && calc.straightStages.length > 0) ||
    showIceCreamDisplay;
  $: visibleRenderStages = calc.orderedStages.filter(
    (stage) => (stage.type === "belt" && showBeltTrain) || (stage.type === "gear" && showGearTrain)
  );
  $: iceCreamMaker = iceCreamMakerState(calc.finalRpm);
  $: if (shaftSpacings.length !== belts.length) {
    shaftSpacings = belts.map((_, index) => shaftSpacings[index] ?? 170);
  }
  function updateBelt(index, key, value) {
    belts = belts.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, [key]: key === "twisted" ? value : Number(value) } : stage
    );
  }

  function toggleBeltTwist(index) {
    updateBelt(index, "twisted", !belts[index]?.twisted);
  }

  function twistTargetKeydown(event, index) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleBeltTwist(index);
    }
  }

  function updateStraight(index, key, value) {
    straights = straights.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, [key]: Number(value) } : stage
    );
  }

  function addBelt() {
    const id = `belt-${nextStageId}`;
    nextStageId += 1;
    belts = [...belts, { id, driver: 5, driven: 12, twisted: false }];
    stageOrder = [...stageOrder, { type: "belt", id }];
    shaftSpacings = [...shaftSpacings, 170];
  }

  function addStraight() {
    const id = `gear-${nextStageId}`;
    nextStageId += 1;
    straights = [...straights, { id, driver: 3, driven: 6 }];
    stageOrder = [...stageOrder, { type: "gear", id }];
  }

  function removeBelt(index) {
    const id = belts[index]?.id;
    belts = belts.filter((_, stageIndex) => stageIndex !== index);
    shaftSpacings = shaftSpacings.filter((_, stageIndex) => stageIndex !== index);
    stageOrder = stageOrder.filter((stage) => !(stage.type === "belt" && stage.id === id));
  }

  function removeStraight(index) {
    const id = straights[index]?.id;
    straights = straights.filter((_, stageIndex) => stageIndex !== index);
    stageOrder = stageOrder.filter((stage) => !(stage.type === "gear" && stage.id === id));
  }

  function toggleRenderLayer(layer) {
    if (layer === "belts") showBeltTrain = !showBeltTrain;
    if (layer === "gears") showGearTrain = !showGearTrain;
    if (layer === "iceCream") showIceCreamDisplay = !showIceCreamDisplay;
  }
</script>

{#if mode === "tractor"}
  {@const tractorStages = calc.orderedStages}
  {@const tractorShaftStart = 150}
  {@const tractorShaftY = 118}
  {@const tractorEngineDriverDiameter = tractorStages.find((stage) => stage.type === "belt")?.driver ?? tractorStages[0]?.driver ?? 5}
  {@const tractorEnginePulleyRadius = pulleyRadiusFromDiameter(tractorEngineDriverDiameter, 1.8, 8, 48)}
  {@const rearAxleX = 516}
  {@const rearAxleY = 202}
  {@const tractorScale = Math.max(0.26, Math.min(0.42, 0.42 - Math.max(0, tractorStages.length - 3) * 0.025))}
  {@const tractorOffsetX = 70}
  {@const tractorOffsetY = 84}
  {@const tractorLocalAxleX = (rearAxleX - tractorOffsetX) / tractorScale}
  {@const tractorLocalAxleY = (rearAxleY - tractorOffsetY) / tractorScale}
  {@const tractorLayouts = tractorStageLayout(tractorStages, tractorShaftStart, tractorShaftY, tractorLocalAxleX, tractorLocalAxleY, tractorEnginePulleyRadius)}
  {@const tractorRearRadius = pulleyRadiusFromDiameter(calc.wheelDiaIn, 3.08, 28, 96)}
  {@const tractorRearHubRadius = tractorRearRadius * 0.62}
  {@const tractorTreadWidth = Math.max(7, tractorRearRadius * 0.14)}
  {@const tractorTreadLength = Math.max(14, tractorRearRadius * 0.32)}
  {@const tractorWheelLabelY = Math.min(292, rearAxleY + tractorRearRadius + 13)}
  {@const tractorEngineRpm = Number(n1)}
  {@const tractorLeaderMark = leaderLetters(tractorEngineRpm)}
  {@const tractorEngineShake = engineShakeLevel(tractorEngineRpm)}
  {@const tractorEngineSteam = steamLevel(tractorEngineRpm)}
  {@const tractorEngineFailed = tractorEngineRpm >= 1000}
  {@const tractorViewBox = compactAnimationLayout ? "0 0 670 300" : "0 0 760 300"}
  {@const tractorSceneTransform = compactAnimationLayout ? "translate(-60 10) scale(1.18)" : ""}
  {@const tractorTitleX = compactAnimationLayout ? 70 : 24}
  {@const tractorSpeedLabelX = compactAnimationLayout ? 574 : 666}
  <section class="calculator-panel rpm-panel tractor-panel" aria-label="Tractor drive calculator">
    <div class="tractor-workspace">
      <section class="rpm-controls tractor-controls" aria-label="Tractor inputs">
        <CreatorCard />

        <div class="title-block">
          <h1>Tractor</h1>
        </div>

        <fieldset>
          <legend>Engine</legend>
          <label class="field" for="tractorN1">
            <span class="field-label">
              <span>Engine speed</span>
              <span class="hint">N1 input RPM</span>
            </span>
            <span class="number-wrap">
              <input id="tractorN1" type="number" min="0" step="0.01" bind:value={n1} />
              <span class="unit">rpm</span>
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Pulley Belt Stages</legend>
          <div class="rpm-stage-heading">
            <span class="hint">Use driver/driven pulley diameter for each belt ratio.</span>
            <button class="stage-add-button" type="button" on:click={addBelt} aria-label="Add pulley belt stage">
              <span class="stage-add-icon" aria-hidden="true">+</span>
              <span>Add pulley</span>
            </button>
          </div>

          {#each belts as belt, index}
            <div class="rpm-stage">
              <label for={`tractorBeltDriver${index}`}>
                <span>D driver</span>
                <input
                  id={`tractorBeltDriver${index}`}
                  type="number"
                  min="0.0001"
                  step="0.01"
                  value={belt.driver}
                  on:input={(event) => updateBelt(index, "driver", event.currentTarget.value)}
                />
              </label>
              <label for={`tractorBeltDriven${index}`}>
                <span>D driven</span>
                <input
                  id={`tractorBeltDriven${index}`}
                  type="number"
                  min="0.0001"
                  step="0.01"
                  value={belt.driven}
                  on:input={(event) => updateBelt(index, "driven", event.currentTarget.value)}
                />
              </label>
              <label class="rpm-stage-toggle" for={`tractorBeltTwist${index}`}>
                <input
                  id={`tractorBeltTwist${index}`}
                  type="checkbox"
                  checked={belt.twisted}
                  on:change={(event) => updateBelt(index, "twisted", event.currentTarget.checked)}
                />
                <span>Twist</span>
              </label>
              <button class="rpm-remove" type="button" on:click={() => removeBelt(index)}>Remove</button>
            </div>
          {/each}
        </fieldset>

        <fieldset>
          <legend>Straight-cut Gear Stages</legend>
          <div class="rpm-stage-heading">
            <span class="hint">Pitch diameters use the same units on both gears.</span>
            <button class="stage-add-button" type="button" on:click={addStraight} aria-label="Add straight-cut gear stage">
              <span class="stage-add-icon" aria-hidden="true">+</span>
              <span>Add gear</span>
            </button>
          </div>

          {#if straights.length === 0}
            <p class="rpm-empty-note">No gear stages added.</p>
          {/if}

          {#each straights as gear, index}
            <div class="rpm-stage">
              <label for={`tractorGearDriver${index}`}>
                <span>Driver pitch diameter</span>
                <input
                  id={`tractorGearDriver${index}`}
                  type="number"
                  min="0.0001"
                  step="0.01"
                  value={gear.driver}
                  on:input={(event) => updateStraight(index, "driver", event.currentTarget.value)}
                />
              </label>
              <label for={`tractorGearDriven${index}`}>
                <span>Driven pitch diameter</span>
                <input
                  id={`tractorGearDriven${index}`}
                  type="number"
                  min="0.0001"
                  step="0.01"
                  value={gear.driven}
                  on:input={(event) => updateStraight(index, "driven", event.currentTarget.value)}
                />
              </label>
              <button class="rpm-remove" type="button" on:click={() => removeStraight(index)}>Remove</button>
            </div>
          {/each}
        </fieldset>

        <fieldset>
          <legend>Drive Wheel</legend>
          <label class="field" for="tractorDriveDia">
            <span class="field-label">
              <span>Wheel diameter</span>
              <span class="hint">used to calculate ground speed</span>
            </span>
            <span class="number-wrap">
              <input id="tractorDriveDia" type="number" min="0.0001" step="0.01" bind:value={driveDia} />
              <span class="unit">{driveUnit}</span>
            </span>
          </label>

          <label class="field field-select" for="tractorDriveUnit">
            <span class="field-label">
              <span>Wheel units</span>
              <span class="hint">diameter input units</span>
            </span>
            <span class="select-wrap">
              <select id="tractorDriveUnit" bind:value={driveUnit}>
                <option value="in">Inch</option>
                <option value="mm">Metric</option>
              </select>
            </span>
          </label>
        </fieldset>

        <fieldset>
          <legend>Drive Output</legend>
          <div class="tractor-results-grid">
            <div class="rpm-card">
              <span class="rpm-card-label">Wheel RPM</span>
              <strong>{fmt(calc.finalRpm, 2)}</strong>
              <small>from current belt and gear chain</small>
            </div>
            <div class="rpm-card">
              <span class="rpm-card-label">Travel Speed</span>
              <strong>{fmt(calc.travelMph, 2)} mph</strong>
              <small>{fmt(calc.wheelDiaIn, 2)} in wheel diameter</small>
            </div>
          </div>
        </fieldset>
      </section>

      <section class="rpm-output tractor-output" aria-label="Tractor display">
        <div class="rpm-animation-panel rpm-live-display tractor-display">
          <div class="rpm-animation-header">
            <div>
              <p class="eyebrow">Live Display</p>
              <h3>Tractor Drive</h3>
            </div>
            <div class="rpm-display-tools">
              <div class="rpm-render-controls rpm-header-render-controls">
                <label class="rpm-range-control" for="tractorRenderEngineRpm">
                  <span>Engine RPM <strong>{fmt(Number(n1), 0)}</strong></span>
                  <input id="tractorRenderEngineRpm" type="range" min="0" max={engineSliderMax} step="1" bind:value={n1} />
                </label>
                <p class="rpm-toolbar-note">Click pulley to twist belt</p>
              </div>
            </div>
          </div>

          <div class="rpm-animation-stack rpm-sequence-view tractor-sequence">
            <svg
              class="rpm-stage-svg tractor-svg tractor-page-svg"
              class:drivetrain-blown={tractorEngineFailed}
              viewBox={tractorViewBox}
              role="img"
              aria-label="Tractor drive wheel speed"
            >
              <g transform={tractorSceneTransform}>
              <text x={tractorTitleX} y="34" class="rpm-svg-title">Drive Wheel Tractor</text>
              <path d="M112 116 H386 Q416 116 432 144 L452 197 H94 Q66 197 66 171 V143 Q66 116 112 116 Z" class="tractor-body" />
              <path d="M366 48 H574 L550 160 H338 Z" class="tractor-cab" />
              <rect x="408" y="74" width="54" height="58" class="tractor-window" />
              <path d="M478 74 H542 L530 132 H478 Z" class="tractor-window" />
              <path d="M84 214 H650" class="tractor-ground" />
              <circle cx="168" cy="216" r="42" class="tractor-front" />
              <circle cx="168" cy="216" r="19" class="tractor-hub" />
              <g class:rpm-spin-reverse={calc.finalDirection < 0} class:rpm-spin-paused={rpmStopped(calc.finalRpm)} class="rpm-spin" style={`animation-duration:${period(calc.finalRpm)}s`}>
                <circle cx={rearAxleX} cy={rearAxleY} r={tractorRearRadius} class="tractor-rear" />
                {#each Array(18) as _, i}
                  <rect
                    x={rearAxleX - tractorTreadWidth / 2}
                    y={rearAxleY - tractorRearRadius - 2}
                    width={tractorTreadWidth}
                    height={tractorTreadLength}
                    rx={Math.max(2, tractorTreadWidth * 0.32)}
                    class="tractor-tread"
                    transform={`rotate(${i * 20} ${rearAxleX} ${rearAxleY})`}
                  />
                {/each}
                <circle cx={rearAxleX} cy={rearAxleY} r={tractorRearHubRadius} class="tractor-hub" />
                <line x1={rearAxleX - tractorRearHubRadius} y1={rearAxleY} x2={rearAxleX + tractorRearHubRadius} y2={rearAxleY} class="tractor-spoke" />
                <line x1={rearAxleX} y1={rearAxleY - tractorRearHubRadius} x2={rearAxleX} y2={rearAxleY + tractorRearHubRadius} class="tractor-spoke" />
              </g>
              <g class="tractor-drivetrain" transform={`translate(${tractorOffsetX} ${tractorOffsetY}) scale(${tractorScale})`}>
                <g
                  class:engine-rattle={tractorEngineShake > 0}
                  class:engine-failed={tractorEngineFailed}
                  style={`--shake-x:${(tractorEngineShake * 3.8).toFixed(2)}px; --shake-neg-x:${(-tractorEngineShake * 3.8).toFixed(2)}px; --shake-y:${(tractorEngineShake * 2.2).toFixed(2)}px; --shake-neg-y:${(-tractorEngineShake * 2.2).toFixed(2)}px; --shake-rot:${(tractorEngineShake * 0.9).toFixed(2)}deg; --shake-neg-rot:${(-tractorEngineShake * 0.9).toFixed(2)}deg;`}
                >
                  <rect x="30" y="164" width="170" height="10" rx="3" class="engine-bed" />
                  <path d="M52 84 H128 Q140 84 140 96 V156 H52 Z" class="engine-tank" />
                  <rect x="24" y="124" width="34" height="42" rx="6" class="engine-cylinder" />
                  <path d="M75 64 H112 L106 84 H82 Z" class="engine-stack" />
                  {#if tractorEngineSteam > 0}
                    <g class="engine-steam" style={`--steam-level:${tractorEngineSteam.toFixed(2)};`} aria-hidden="true">
                      <path d="M88 62 C76 52, 96 45, 84 35 C75 27, 88 19, 101 24" />
                      <path d="M101 60 C91 50, 113 43, 101 32 C91 23, 104 11, 118 17" />
                      <path d="M112 63 C104 55, 121 48, 113 39 C106 31, 120 24, 131 30" />
                    </g>
                  {/if}
                  {#if tractorEngineFailed}
                    <g class="engine-piston-eject" aria-hidden="true">
                      <line x1="28" y1="145" x2="-32" y2="145" class="piston-rod" />
                      <rect x="-72" y="132" width="40" height="26" rx="5" class="piston-head" />
                      <line x1="-66" y1="137" x2="-66" y2="153" class="piston-ring" />
                      <line x1="-60" y1="137" x2="-60" y2="153" class="piston-ring" />
                      <circle cx="-45" cy="145" r="4" class="piston-pin" />
                      <path d="M22 133 L5 124 M22 157 L5 166 M17 145 H-4" class="piston-burst" />
                    </g>
                  {/if}
                  <g class:rpm-spin-reverse={false} class:rpm-spin-paused={rpmStopped(tractorEngineRpm)} class="rpm-spin" style={`animation-duration:${period(tractorEngineRpm)}s`}>
                    <circle cx={tractorShaftStart} cy={tractorShaftY} r="60" class="engine-flywheel" />
                    <circle cx={tractorShaftStart} cy={tractorShaftY} r="44" class="engine-flywheel-inner" />
                    <line x1={tractorShaftStart} y1={tractorShaftY - 50} x2={tractorShaftStart} y2={tractorShaftY + 50} class="engine-flywheel-spoke" />
                    <line x1={tractorShaftStart - 50} y1={tractorShaftY} x2={tractorShaftStart + 50} y2={tractorShaftY} class="engine-flywheel-spoke" />
                    <line x1={tractorShaftStart - 38} y1={tractorShaftY - 38} x2={tractorShaftStart + 38} y2={tractorShaftY + 38} class="engine-flywheel-spoke" />
                    <line x1={tractorShaftStart + 38} y1={tractorShaftY - 38} x2={tractorShaftStart - 38} y2={tractorShaftY + 38} class="engine-flywheel-spoke" />
                    <circle cx={tractorShaftStart} cy={tractorShaftY} r="15" class="engine-hub" />
                    <circle cx={tractorShaftStart} cy={tractorShaftY} r={tractorEnginePulleyRadius} class="engine-center-pulley" />
                    <line x1={tractorShaftStart - tractorEnginePulleyRadius * 0.72} y1={tractorShaftY} x2={tractorShaftStart + tractorEnginePulleyRadius * 0.72} y2={tractorShaftY} class="rpm-spoke" />
                    <line x1={tractorShaftStart} y1={tractorShaftY - tractorEnginePulleyRadius * 0.72} x2={tractorShaftStart} y2={tractorShaftY + tractorEnginePulleyRadius * 0.72} class="rpm-spoke" />
                  </g>
                  {#if tractorLeaderMark}
                    <text x="54" y="116" transform="rotate(-22 54 116)" class="engine-leader-text">{tractorLeaderMark}</text>
                  {/if}
                </g>

                {#each tractorLayouts as stage, index}
                  {#if stage.type === "belt"}
                    <line x1={stage.driverX} y1="64" x2={stage.driverX} y2="180" class="common-shaft tractor-mini-shaft" />
                    <line x1={stage.drivenX} y1="64" x2={stage.drivenX} y2="180" class="common-shaft tractor-mini-shaft" />
                    {#if stage.twisted}
                      {@const twistedRuns = crossedBeltTangents(stage.driverX, stage.driverY, stage.driverRadius, stage.drivenX, stage.drivenY, stage.drivenRadius)}
                      <path class="rpm-belt-run" d={`M ${twistedRuns[0].x1} ${twistedRuns[0].y1} L ${twistedRuns[0].x2} ${twistedRuns[0].y2}`} />
                      <path class="rpm-belt-run" d={`M ${twistedRuns[1].x1} ${twistedRuns[1].y1} L ${twistedRuns[1].x2} ${twistedRuns[1].y2}`} />
                    {:else}
                      <path class="rpm-belt-loop" d={`M ${stage.driverX} ${stage.driverY - stage.driverRadius} L ${stage.drivenX} ${stage.drivenY - stage.drivenRadius} A ${stage.drivenRadius} ${stage.drivenRadius} 0 0 1 ${stage.drivenX} ${stage.drivenY + stage.drivenRadius} L ${stage.driverX} ${stage.driverY + stage.driverRadius} A ${stage.driverRadius} ${stage.driverRadius} 0 0 1 ${stage.driverX} ${stage.driverY - stage.driverRadius} Z`} />
                    {/if}
                    {#if index > 0 || stage.driverX !== tractorShaftStart}
                      <g class:rpm-spin-reverse={stage.inDirection < 0} class:rpm-spin-paused={rpmStopped(stage.inRpm)} class="rpm-spin" style={`animation-duration:${period(stage.inRpm)}s`}>
                        <circle cx={stage.driverX} cy={stage.driverY} r={stage.driverRadius} class="rpm-pulley common-driver-pulley" />
                        <line x1={stage.driverX - stage.driverRadius * 0.72} y1={stage.driverY} x2={stage.driverX + stage.driverRadius * 0.72} y2={stage.driverY} class="rpm-spoke" />
                        <line x1={stage.driverX} y1={stage.driverY - stage.driverRadius * 0.72} x2={stage.driverX} y2={stage.driverY + stage.driverRadius * 0.72} class="rpm-spoke" />
                      </g>
                    {/if}
                    <g class:rpm-spin-reverse={stage.outDirection < 0} class:rpm-spin-paused={rpmStopped(stage.outRpm)} class="rpm-spin" style={`animation-duration:${period(stage.outRpm)}s`}>
                      <circle cx={stage.drivenX} cy={stage.drivenY} r={stage.drivenRadius} class="rpm-pulley" />
                      <line x1={stage.drivenX - stage.drivenRadius * 0.72} y1={stage.drivenY} x2={stage.drivenX + stage.drivenRadius * 0.72} y2={stage.drivenY} class="rpm-spoke" />
                      <line x1={stage.drivenX} y1={stage.drivenY - stage.drivenRadius * 0.72} x2={stage.drivenX} y2={stage.drivenY + stage.drivenRadius * 0.72} class="rpm-spoke" />
                    </g>
                    <circle cx={stage.drivenX} cy={stage.drivenY} r="5" class="common-shaft-hub" />
                    <circle
                      cx={stage.drivenX}
                      cy={stage.drivenY}
                      r={Math.max(stage.drivenRadius + 20, 36)}
                      class="belt-twist-target tractor-belt-twist-target"
                      role="button"
                      tabindex="0"
                      aria-pressed={stage.twisted}
                      aria-label={`Toggle twist for pulley belt ${stage.labelIndex}`}
                      on:click={() => toggleBeltTwist(stage.sourceIndex)}
                      on:keydown={(event) => twistTargetKeydown(event, stage.sourceIndex)}
                    />
                  {:else}
                    <line x1={stage.driverX} y1="64" x2={stage.driverX} y2="180" class="common-shaft tractor-mini-shaft" />
                    <line x1={stage.drivenX} y1="64" x2={stage.drivenX} y2="180" class="common-shaft tractor-mini-shaft" />
                    <g class:rpm-spin-reverse={stage.inDirection < 0} class:rpm-spin-paused={rpmStopped(stage.inRpm)} class="rpm-spin" style={`animation-duration:${period(stage.inRpm)}s`}>
                      <path d={gearPath(stage.driverX, stage.driverY, stage.driverRadius, Math.round(stage.driver * 6))} class="rpm-gear inline-gear" />
                      <circle cx={stage.driverX} cy={stage.driverY} r={Math.max(4, stage.driverRadius * 0.22)} class="inline-gear-hub" />
                    </g>
                    <g class:rpm-spin-reverse={stage.outDirection < 0} class:rpm-spin-paused={rpmStopped(stage.outRpm)} class="rpm-spin" style={`animation-duration:${period(stage.outRpm)}s`}>
                      <path d={gearPath(stage.drivenX, stage.drivenY, stage.drivenRadius, Math.round(stage.driven * 6))} class="rpm-gear inline-gear" />
                      <circle cx={stage.drivenX} cy={stage.drivenY} r={Math.max(4, stage.drivenRadius * 0.22)} class="inline-gear-hub" />
                    </g>
                    <circle cx={stage.drivenX} cy={stage.drivenY} r="5" class="common-shaft-hub" />
                  {/if}
                {/each}
              </g>
              <text x={rearAxleX} y={tractorWheelLabelY} text-anchor="middle" class="rpm-svg-note">{fmt(calc.finalRpm, 1)} rpm rear wheel</text>
              <text x={tractorSpeedLabelX} y="92" text-anchor="middle" class="tractor-speed-label">{fmt(calc.travelMph, 2)} mph</text>
              <text x={tractorSpeedLabelX} y="112" text-anchor="middle" class="rpm-svg-note">ground speed</text>
              </g>
            </svg>
          </div>

          <section class="rpm-affiliate-rotator" aria-label="Recommended tractor drive supplies">
            <div class="rpm-affiliate-grid">
              {#each rotatingAffiliateCards as card (card.href)}
                <a class="rpm-affiliate-card" href={card.href} target="_blank" rel="sponsored noopener noreferrer" aria-label={card.aria}>
                  <img src={card.image} alt={card.alt} />
                  <span class="rpm-affiliate-copy">
                    <span class="rpm-affiliate-category">{card.category}</span>
                    <strong>{card.text}</strong>
                  </span>
                </a>
              {/each}
            </div>
          </section>
        </div>
      </section>
    </div>
  </section>
{:else}
<section class="calculator-panel rpm-panel" aria-label="Pulley and gear speed calculator">
  <div class="rpm-workspace">
    <section class="rpm-controls" aria-label="Calculator inputs">
      <CreatorCard />

      <div class="title-block">
        <h1>Ice Cream</h1>
      </div>

      <fieldset>
        <legend>Belt Stages</legend>
        <div class="rpm-stage-heading">
          <span class="hint">Use driver/driven diameter for each belt ratio.</span>
          <button class="stage-add-button" type="button" on:click={addBelt} aria-label="Add belt stage">
            <span class="stage-add-icon" aria-hidden="true">+</span>
            <span>Add belt</span>
          </button>
        </div>

        {#each belts as belt, index}
          <div class="rpm-stage">
            <label for={`beltDriver${index}`}>
              <span>D driver</span>
              <input
                id={`beltDriver${index}`}
                type="number"
                min="0.0001"
                step="0.01"
                value={belt.driver}
                on:input={(event) => updateBelt(index, "driver", event.currentTarget.value)}
              />
            </label>
            <label for={`beltDriven${index}`}>
              <span>D driven</span>
              <input
                id={`beltDriven${index}`}
                type="number"
                min="0.0001"
                step="0.01"
                value={belt.driven}
                on:input={(event) => updateBelt(index, "driven", event.currentTarget.value)}
              />
            </label>
            <label class="rpm-stage-toggle" for={`beltTwist${index}`}>
              <input
                id={`beltTwist${index}`}
                type="checkbox"
                checked={belt.twisted}
                on:change={(event) => updateBelt(index, "twisted", event.currentTarget.checked)}
              />
              <span>Twist</span>
            </label>
            <button class="rpm-remove" type="button" on:click={() => removeBelt(index)}>Remove</button>
          </div>
        {/each}
      </fieldset>

      <fieldset>
        <legend>Straight-cut Gear Stages</legend>
        <div class="rpm-stage-heading">
          <span class="hint">Pitch diameters use the same units on both gears.</span>
          <button class="stage-add-button" type="button" on:click={addStraight} aria-label="Add straight-cut gear stage">
            <span class="stage-add-icon" aria-hidden="true">+</span>
            <span>Add gear</span>
          </button>
        </div>

        {#if straights.length === 0}
          <p class="rpm-empty-note">No gear stages added.</p>
        {/if}

        {#each straights as gear, index}
          <div class="rpm-stage">
            <label for={`gearDriver${index}`}>
              <span>Driver pitch diameter</span>
              <input
                id={`gearDriver${index}`}
                type="number"
                min="0.0001"
                step="0.01"
                value={gear.driver}
                on:input={(event) => updateStraight(index, "driver", event.currentTarget.value)}
              />
            </label>
            <label for={`gearDriven${index}`}>
              <span>Driven pitch diameter</span>
              <input
                id={`gearDriven${index}`}
                type="number"
                min="0.0001"
                step="0.01"
                value={gear.driven}
                on:input={(event) => updateStraight(index, "driven", event.currentTarget.value)}
              />
            </label>
            <button class="rpm-remove" type="button" on:click={() => removeStraight(index)}>Remove</button>
          </div>
        {/each}
      </fieldset>

      <fieldset>
        <legend>Setup</legend>
        <label class="field" for="rpmN1">
          <span class="field-label">
            <span>Engine speed</span>
            <span class="hint">N1 input RPM</span>
          </span>
          <span class="number-wrap">
            <input id="rpmN1" type="number" min="0" step="0.01" bind:value={n1} />
            <span class="unit">rpm</span>
          </span>
        </label>

        <label class="field" for="rpmTargetMin">
          <span class="field-label">
            <span>Target min RPM</span>
            <span class="hint">lower acceptable final speed</span>
          </span>
          <span class="number-wrap">
            <input id="rpmTargetMin" type="number" min="0" step="0.1" bind:value={targetMin} />
            <span class="unit">rpm</span>
          </span>
        </label>

        <label class="field" for="rpmTargetMax">
          <span class="field-label">
            <span>Target max RPM</span>
            <span class="hint">upper acceptable final speed</span>
          </span>
          <span class="number-wrap">
            <input id="rpmTargetMax" type="number" min="0" step="0.1" bind:value={targetMax} />
            <span class="unit">rpm</span>
          </span>
        </label>
      </fieldset>

    </section>

    <section class="rpm-output" aria-label="Calculator results">
      <div class="rpm-animation-panel rpm-live-display">
        <div class="rpm-animation-header">
          <div>
            <p class="eyebrow">Live Display</p>
            <h3>Mechanical Chain</h3>
          </div>
          <div class="rpm-display-tools">
            {#if showAnimation}
              <div class="rpm-render-controls rpm-header-render-controls">
                <label class="rpm-range-control" for="renderEngineRpm">
                  <span>Engine RPM <strong>{fmt(Number(n1), 0)}</strong></span>
                  <input id="renderEngineRpm" type="range" min="0" max={engineSliderMax} step="1" bind:value={n1} />
                </label>
                <p class="rpm-toolbar-note">Click pulley to twist belt</p>
              </div>
            {/if}
            <div class="rpm-display-tabs" role="group" aria-label="Live display layers">
              {#each renderLayers as layer}
                <button
                  type="button"
                  class:active={layer.active}
                  aria-pressed={layer.active}
                  on:click={() => toggleRenderLayer(layer.id)}
                >
                  {layer.label}
                </button>
              {/each}
            </div>

          </div>
        </div>

        <div class="rpm-animation-stack rpm-sequence-view">
          {#if showAnimation && visibleRenderStages.length > 0}
            {@const compactRender = compactAnimationLayout}
            {@const compactStages = compactRender
              ? visibleRenderStages.map((stage) => stage.type === "belt" ? { ...stage, spacing: Math.max(76, Number(stage.spacing || 170) * 0.54) } : stage)
              : visibleRenderStages}
            {@const shaftStart = compactRender ? 112 : 150}
            {@const shaftY = 118}
            {@const mixerY = showIceCreamDisplay ? (compactRender ? shaftY + 88 : shaftY - 30) : shaftY}
            {@const engineDriverDiameter = compactStages[0]?.type === "belt" ? compactStages[0].driver : calc.beltStages[0]?.driver ?? 5}
            {@const enginePulleyRadius = pulleyRadiusFromDiameter(engineDriverDiameter, 1.8, 8, 48)}
            {@const chainLayouts = chainStageLayout(compactStages, shaftStart, shaftY, mixerY, showIceCreamDisplay, enginePulleyRadius, compactRender ? 76 : 95)}
            {@const chainDisplayEndX = chainLayouts[chainLayouts.length - 1].drivenX}
            {@const beltChainWidth = compactRender
              ? Math.max(400, chainDisplayEndX + (showIceCreamDisplay ? 126 : 84))
              : Math.max(540, chainDisplayEndX + (showIceCreamDisplay ? 180 : 120))}
            {@const beltChainHeight = compactRender ? 290 : 220}
            {@const shaftLineBottom = compactRender ? 240 : 180}
            {@const statusBaseY = compactRender ? 248 : 185}
            {@const metricBaseY = compactRender ? 185 : 185}
            {@const hasDisplayedBelts = chainLayouts.some((stage) => stage.type === "belt")}
            {@const hasDisplayedGears = chainLayouts.some((stage) => stage.type === "gear")}
            {@const engineRpm = Number(n1)}
            {@const leaderMark = leaderLetters(engineRpm)}
            {@const engineShake = engineShakeLevel(engineRpm)}
            {@const engineFailed = engineRpm >= 1000}
            {@const engineSteam = steamLevel(engineRpm)}
            <svg
              class="rpm-stage-svg linked-belt-svg"
              class:drivetrain-blown={engineFailed}
              viewBox={`0 0 ${beltChainWidth} ${beltChainHeight}`}
              role="img"
              aria-label="Linked belt stage drivetrain"
            >
              <text x="18" y="26" class="rpm-svg-title">{hasDisplayedBelts && hasDisplayedGears ? "Linked Belt & Gear Train" : hasDisplayedGears ? "Linked Gear Train" : "Linked Belt Train"}</text>
              <g
                class:engine-rattle={engineShake > 0}
                class:engine-failed={engineFailed}
                style={`--shake-x:${(engineShake * 3.8).toFixed(2)}px; --shake-neg-x:${(-engineShake * 3.8).toFixed(2)}px; --shake-y:${(engineShake * 2.2).toFixed(2)}px; --shake-neg-y:${(-engineShake * 2.2).toFixed(2)}px; --shake-rot:${(engineShake * 0.9).toFixed(2)}deg; --shake-neg-rot:${(-engineShake * 0.9).toFixed(2)}deg;`}
              >
                <rect x="30" y="164" width="170" height="10" rx="3" class="engine-bed" />
                <path d="M52 84 H128 Q140 84 140 96 V156 H52 Z" class="engine-tank" />
                <rect x="24" y="124" width="34" height="42" rx="6" class="engine-cylinder" />
                <path d="M75 64 H112 L106 84 H82 Z" class="engine-stack" />
                {#if engineSteam > 0}
                  <g class="engine-steam" style={`--steam-level:${engineSteam.toFixed(2)};`} aria-hidden="true">
                    <path d="M88 62 C76 52, 96 45, 84 35 C75 27, 88 19, 101 24" />
                    <path d="M101 60 C91 50, 113 43, 101 32 C91 23, 104 11, 118 17" />
                    <path d="M112 63 C104 55, 121 48, 113 39 C106 31, 120 24, 131 30" />
                  </g>
                {/if}
                {#if engineFailed}
                  <g class="engine-piston-eject" aria-hidden="true">
                    <line x1="28" y1="145" x2="-32" y2="145" class="piston-rod" />
                    <rect x="-72" y="132" width="40" height="26" rx="5" class="piston-head" />
                    <line x1="-66" y1="137" x2="-66" y2="153" class="piston-ring" />
                    <line x1="-60" y1="137" x2="-60" y2="153" class="piston-ring" />
                    <circle cx="-45" cy="145" r="4" class="piston-pin" />
                    <path d="M22 133 L5 124 M22 157 L5 166 M17 145 H-4" class="piston-burst" />
                  </g>
                {/if}
                <g class:rpm-spin-paused={rpmStopped(engineRpm)} class="rpm-spin" style={`animation-duration:${period(engineRpm)}s`}>
                  <circle cx={shaftStart} cy={shaftY} r="54" class="engine-flywheel" />
                  <circle cx={shaftStart} cy={shaftY} r="44" class="engine-flywheel-inner" />
                  <line x1={shaftStart} y1={shaftY - 54} x2={shaftStart} y2={shaftY + 54} class="engine-flywheel-spoke" />
                  <line x1={shaftStart - 54} y1={shaftY} x2={shaftStart + 54} y2={shaftY} class="engine-flywheel-spoke" />
                  <line x1={shaftStart - 38} y1={shaftY - 38} x2={shaftStart + 38} y2={shaftY + 38} class="engine-flywheel-spoke" />
                  <line x1={shaftStart + 38} y1={shaftY - 38} x2={shaftStart - 38} y2={shaftY + 38} class="engine-flywheel-spoke" />
                  <circle cx={shaftStart} cy={shaftY} r="15" class="engine-hub" />
                  <circle cx={shaftStart} cy={shaftY} r={enginePulleyRadius} class="engine-center-pulley" />
                  <line x1={shaftStart - enginePulleyRadius * 0.72} y1={shaftY} x2={shaftStart + enginePulleyRadius * 0.72} y2={shaftY} class="rpm-spoke" />
                  <line x1={shaftStart} y1={shaftY - enginePulleyRadius * 0.72} x2={shaftStart} y2={shaftY + enginePulleyRadius * 0.72} class="rpm-spoke" />
                </g>
                {#if leaderMark}
                  <text x="54" y="116" transform="rotate(-22 54 116)" class="engine-leader-text">{leaderMark}</text>
                {/if}
              </g>

              {#if showIceCreamDisplay}
                {@const makerX = chainDisplayEndX}
                {@const makerBodyX = makerX + (compactRender ? 66 : 82)}
                {@const makerPulleyY = compactRender ? mixerY : shaftY - 30}
                {@const makerBodyY = compactRender ? 66 : -6}
                <g class={`icecream-maker ${iceCreamMaker.tone}`} aria-label={`Ice cream mixer ${iceCreamMaker.label}`}>
                  <path d={`M ${makerBodyX - 126} ${88 + makerBodyY} Q ${makerBodyX - 82} ${68 + makerBodyY} ${makerBodyX - 38} ${88 + makerBodyY} L ${makerBodyX - 48} ${176 + makerBodyY} Q ${makerBodyX - 82} ${190 + makerBodyY} ${makerBodyX - 116} ${176 + makerBodyY} Z`} class="maker-bucket" />
                  <ellipse cx={makerBodyX - 82} cy={88 + makerBodyY} rx="47" ry="15" class="maker-rim" />
                  <path d={`M ${makerBodyX - 118} ${101 + makerBodyY} Q ${makerBodyX - 82} ${114 + makerBodyY} ${makerBodyX - 46} ${101 + makerBodyY}`} class="maker-cream" />
                  <path d={`M ${makerBodyX - 115} ${106 + makerBodyY} L ${makerBodyX - 109} ${176 + makerBodyY} M ${makerBodyX - 88} ${101 + makerBodyY} L ${makerBodyX - 88} ${184 + makerBodyY} M ${makerBodyX - 61} ${106 + makerBodyY} L ${makerBodyX - 55} ${176 + makerBodyY}`} class="maker-staves" />
                  <circle cx={makerX} cy={makerPulleyY} r="10" class="maker-drive-gear" />
                  <path d={`M ${makerBodyX - 48} ${makerPulleyY - 6} L ${makerX} ${makerPulleyY} L ${makerBodyX - 48} ${makerPulleyY + 38}`} class="maker-drive-bracket" />
                  {#if iceCreamMaker.tone === "slow"}
                    <path d={`M ${makerBodyX - 105} ${121 + makerBodyY} Q ${makerBodyX - 88} ${135 + makerBodyY} ${makerBodyX - 65} ${122 + makerBodyY}`} class="maker-slow-swirl" />
                  {:else if iceCreamMaker.tone === "sweet"}
                    <path d={`M ${makerBodyX - 111} ${124 + makerBodyY} L ${makerBodyX - 95} ${139 + makerBodyY} L ${makerBodyX - 62} ${112 + makerBodyY}`} class="maker-sweet-check" />
                  {:else}
                    <path d={`M ${makerBodyX - 130} ${79 + makerBodyY} L ${makerBodyX - 146} ${67 + makerBodyY} M ${makerBodyX - 38} ${80 + makerBodyY} L ${makerBodyX - 20} ${67 + makerBodyY} M ${makerBodyX - 82} ${61 + makerBodyY} L ${makerBodyX - 82} ${43 + makerBodyY}`} class="maker-fast-burst" />
                  {/if}
                </g>
              {/if}

              {#each chainLayouts as stage, index}
                {#if stage.type === "belt"}
                  <text x={stage.labelX} y={stage.labelY} text-anchor="middle" class="linked-belt-label">Belt {stage.labelIndex}{stage.twisted ? " twisted" : ""}</text>
                  <line x1={stage.driverX} y1="64" x2={stage.driverX} y2={shaftLineBottom} class="common-shaft" />
                  <line x1={stage.drivenX} y1="64" x2={stage.drivenX} y2={shaftLineBottom} class="common-shaft" />
                  {#if stage.twisted}
                    {@const twistedRuns = crossedBeltTangents(stage.driverX, stage.driverY, stage.driverRadius, stage.drivenX, stage.drivenY, stage.drivenRadius)}
                    <path class="rpm-belt-run" d={`M ${twistedRuns[0].x1} ${twistedRuns[0].y1} L ${twistedRuns[0].x2} ${twistedRuns[0].y2}`} />
                    <path class="rpm-belt-run" d={`M ${twistedRuns[1].x1} ${twistedRuns[1].y1} L ${twistedRuns[1].x2} ${twistedRuns[1].y2}`} />
                  {:else}
                    <path class="rpm-belt-loop" d={`M ${stage.driverX} ${stage.driverY - stage.driverRadius} L ${stage.drivenX} ${stage.drivenY - stage.drivenRadius} A ${stage.drivenRadius} ${stage.drivenRadius} 0 0 1 ${stage.drivenX} ${stage.drivenY + stage.drivenRadius} L ${stage.driverX} ${stage.driverY + stage.driverRadius} A ${stage.driverRadius} ${stage.driverRadius} 0 0 1 ${stage.driverX} ${stage.driverY - stage.driverRadius} Z`} />
                  {/if}
                  {#if index > 0 || stage.driverX !== shaftStart}
                    <g class:rpm-spin-reverse={stage.inDirection < 0} class:rpm-spin-paused={rpmStopped(stage.inRpm)} class="rpm-spin" style={`animation-duration:${period(stage.inRpm)}s`}>
                      <circle cx={stage.driverX} cy={stage.driverY} r={stage.driverRadius} class="rpm-pulley common-driver-pulley" />
                      <line x1={stage.driverX - stage.driverRadius * 0.72} y1={stage.driverY} x2={stage.driverX + stage.driverRadius * 0.72} y2={stage.driverY} class="rpm-spoke" />
                      <line x1={stage.driverX} y1={stage.driverY - stage.driverRadius * 0.72} x2={stage.driverX} y2={stage.driverY + stage.driverRadius * 0.72} class="rpm-spoke" />
                    </g>
                  {/if}
                  <g class:rpm-spin-reverse={stage.outDirection < 0} class:rpm-spin-paused={rpmStopped(stage.outRpm)} class="rpm-spin" style={`animation-duration:${period(stage.outRpm)}s`}>
                    <circle cx={stage.drivenX} cy={stage.drivenY} r={stage.drivenRadius} class="rpm-pulley" />
                    <line x1={stage.drivenX - stage.drivenRadius * 0.72} y1={stage.drivenY} x2={stage.drivenX + stage.drivenRadius * 0.72} y2={stage.drivenY} class="rpm-spoke" />
                    <line x1={stage.drivenX} y1={stage.drivenY - stage.drivenRadius * 0.72} x2={stage.drivenX} y2={stage.drivenY + stage.drivenRadius * 0.72} class="rpm-spoke" />
                  </g>
                  <circle cx={stage.drivenX} cy={stage.drivenY} r="5" class="common-shaft-hub" />
                  {#if showIceCreamDisplay && index === chainLayouts.length - 1}
                    <rect x={stage.drivenX - 63} y={statusBaseY} width="126" height="27" rx="7" class="maker-status-bg" />
                    <text x={stage.drivenX} y={statusBaseY + 13} text-anchor="middle" class="maker-status-label">{iceCreamMaker.label}</text>
                    <text x={stage.drivenX} y={statusBaseY + 24} text-anchor="middle" class="maker-status-rpm">{fmt(stage.outRpm, 1)} rpm</text>
                  {:else}
                    <text x={stage.drivenX} y="202" text-anchor="middle" class="rpm-svg-note">{fmt(stage.outRpm, 1)} rpm</text>
                  {/if}
                  <circle
                    cx={stage.drivenX}
                    cy={stage.drivenY}
                    r={Math.max(stage.drivenRadius + 20, 36)}
                    class="belt-twist-target"
                    role="button"
                    tabindex="0"
                    aria-pressed={stage.twisted}
                    aria-label={`Toggle twist for belt ${stage.labelIndex}`}
                    on:click={() => toggleBeltTwist(stage.sourceIndex)}
                    on:keydown={(event) => twistTargetKeydown(event, stage.sourceIndex)}
                  />
                {:else}
                  <text x={stage.labelX} y={stage.labelY} text-anchor="middle" class="linked-gear-label">Gear {stage.labelIndex}</text>
                  <line x1={stage.driverX} y1="64" x2={stage.driverX} y2={shaftLineBottom} class="common-shaft" />
                  <line x1={stage.drivenX} y1="64" x2={stage.drivenX} y2={shaftLineBottom} class="common-shaft" />
                  <g class:rpm-spin-reverse={stage.inDirection < 0} class:rpm-spin-paused={rpmStopped(stage.inRpm)} class="rpm-spin" style={`animation-duration:${period(stage.inRpm)}s`}>
                    <path d={gearPath(stage.driverX, stage.driverY, stage.driverRadius, Math.round(stage.driver * 6))} class="rpm-gear inline-gear" />
                    <circle cx={stage.driverX} cy={stage.driverY} r={Math.max(4, stage.driverRadius * 0.22)} class="inline-gear-hub" />
                  </g>
                  <g class:rpm-spin-reverse={stage.outDirection < 0} class:rpm-spin-paused={rpmStopped(stage.outRpm)} class="rpm-spin" style={`animation-duration:${period(stage.outRpm)}s`}>
                    <path d={gearPath(stage.drivenX, stage.drivenY, stage.drivenRadius, Math.round(stage.driven * 6))} class="rpm-gear inline-gear" />
                    <circle cx={stage.drivenX} cy={stage.drivenY} r={Math.max(4, stage.drivenRadius * 0.22)} class="inline-gear-hub" />
                  </g>
                  <circle cx={stage.drivenX} cy={stage.drivenY} r="5" class="common-shaft-hub" />
                  {#if showIceCreamDisplay && index === chainLayouts.length - 1}
                    <rect x={stage.drivenX - 63} y={statusBaseY} width="126" height="27" rx="7" class="maker-status-bg" />
                    <text x={stage.drivenX} y={statusBaseY + 13} text-anchor="middle" class="maker-status-label">{iceCreamMaker.label}</text>
                    <text x={stage.drivenX} y={statusBaseY + 24} text-anchor="middle" class="maker-status-rpm">{fmt(stage.outRpm, 1)} rpm</text>
                  {:else}
                    <text x={stage.drivenX} y="202" text-anchor="middle" class="rpm-svg-note">{fmt(stage.outRpm, 1)} rpm</text>
                  {/if}
                {/if}
              {/each}
              <rect x={shaftStart - 57} y={metricBaseY} width="114" height="34" rx="7" class="engine-metric-bg" />
              <text x={shaftStart} y={metricBaseY + 14} text-anchor="middle" class="engine-metric-text">engine {fmt(engineRpm, 0)} rpm</text>
              <text x={shaftStart} y={metricBaseY + 28} text-anchor="middle" class="engine-metric-text">pulley D {fmt(engineDriverDiameter, 2)}</text>
            </svg>
          {/if}

          {#if showAnimation && calc.orderedStages.length === 0}
            {@const emptyShaftStart = 150}
            {@const emptyShaftY = 118}
            {@const emptyEnginePulleyRadius = pulleyRadiusFromDiameter(5, 1.8, 8, 48)}
            {@const emptyEngineRpm = Number(n1)}
            {@const emptyLeaderMark = leaderLetters(emptyEngineRpm)}
            {@const emptyEngineShake = engineShakeLevel(emptyEngineRpm)}
            {@const emptyEngineFailed = emptyEngineRpm >= 1000}
            {@const emptyEngineSteam = steamLevel(emptyEngineRpm)}
            <svg
              class="rpm-stage-svg linked-belt-svg icecream-empty-drive-svg"
              class:drivetrain-blown={emptyEngineFailed}
              viewBox="0 0 760 220"
              role="img"
              aria-label="Engine and ice cream mixer are not connected"
            >
              <text x="18" y="26" class="rpm-svg-title">No Drive Train</text>
              <g
                class:engine-rattle={emptyEngineShake > 0}
                class:engine-failed={emptyEngineFailed}
                style={`--shake-x:${(emptyEngineShake * 3.8).toFixed(2)}px; --shake-neg-x:${(-emptyEngineShake * 3.8).toFixed(2)}px; --shake-y:${(emptyEngineShake * 2.2).toFixed(2)}px; --shake-neg-y:${(-emptyEngineShake * 2.2).toFixed(2)}px; --shake-rot:${(emptyEngineShake * 0.9).toFixed(2)}deg; --shake-neg-rot:${(-emptyEngineShake * 0.9).toFixed(2)}deg;`}
              >
                <rect x="30" y="164" width="170" height="10" rx="3" class="engine-bed" />
                <path d="M52 84 H128 Q140 84 140 96 V156 H52 Z" class="engine-tank" />
                <rect x="24" y="124" width="34" height="42" rx="6" class="engine-cylinder" />
                <path d="M75 64 H112 L106 84 H82 Z" class="engine-stack" />
                {#if emptyEngineSteam > 0}
                  <g class="engine-steam" style={`--steam-level:${emptyEngineSteam.toFixed(2)};`} aria-hidden="true">
                    <path d="M88 62 C76 52, 96 45, 84 35 C75 27, 88 19, 101 24" />
                    <path d="M101 60 C91 50, 113 43, 101 32 C91 23, 104 11, 118 17" />
                    <path d="M112 63 C104 55, 121 48, 113 39 C106 31, 120 24, 131 30" />
                  </g>
                {/if}
                {#if emptyEngineFailed}
                  <g class="engine-piston-eject" aria-hidden="true">
                    <line x1="28" y1="145" x2="-32" y2="145" class="piston-rod" />
                    <rect x="-72" y="132" width="40" height="26" rx="5" class="piston-head" />
                    <line x1="-66" y1="137" x2="-66" y2="153" class="piston-ring" />
                    <line x1="-60" y1="137" x2="-60" y2="153" class="piston-ring" />
                    <circle cx="-45" cy="145" r="4" class="piston-pin" />
                    <path d="M22 133 L5 124 M22 157 L5 166 M17 145 H-4" class="piston-burst" />
                  </g>
                {/if}
                <g class:rpm-spin-paused={rpmStopped(emptyEngineRpm)} class="rpm-spin" style={`animation-duration:${period(emptyEngineRpm)}s`}>
                  <circle cx={emptyShaftStart} cy={emptyShaftY} r="54" class="engine-flywheel" />
                  <circle cx={emptyShaftStart} cy={emptyShaftY} r="44" class="engine-flywheel-inner" />
                  <line x1={emptyShaftStart} y1={emptyShaftY - 54} x2={emptyShaftStart} y2={emptyShaftY + 54} class="engine-flywheel-spoke" />
                  <line x1={emptyShaftStart - 54} y1={emptyShaftY} x2={emptyShaftStart + 54} y2={emptyShaftY} class="engine-flywheel-spoke" />
                  <line x1={emptyShaftStart - 38} y1={emptyShaftY - 38} x2={emptyShaftStart + 38} y2={emptyShaftY + 38} class="engine-flywheel-spoke" />
                  <line x1={emptyShaftStart + 38} y1={emptyShaftY - 38} x2={emptyShaftStart - 38} y2={emptyShaftY + 38} class="engine-flywheel-spoke" />
                  <circle cx={emptyShaftStart} cy={emptyShaftY} r="15" class="engine-hub" />
                  <circle cx={emptyShaftStart} cy={emptyShaftY} r={emptyEnginePulleyRadius} class="engine-center-pulley" />
                  <line x1={emptyShaftStart - emptyEnginePulleyRadius * 0.72} y1={emptyShaftY} x2={emptyShaftStart + emptyEnginePulleyRadius * 0.72} y2={emptyShaftY} class="rpm-spoke" />
                  <line x1={emptyShaftStart} y1={emptyShaftY - emptyEnginePulleyRadius * 0.72} x2={emptyShaftStart} y2={emptyShaftY + emptyEnginePulleyRadius * 0.72} class="rpm-spoke" />
                </g>
                {#if emptyLeaderMark}
                  <text x="54" y="116" transform="rotate(-22 54 116)" class="engine-leader-text">{emptyLeaderMark}</text>
                {/if}
              </g>

              <path d="M230 118 C280 98 340 98 390 118" class="empty-drive-gap" />
              <path d="M407 118 H437" class="empty-drive-gap" />
              <path d="M392 107 L416 130 M416 107 L392 130" class="empty-drive-break" />

              <g class="sad-kids" aria-hidden="true">
                <g class="sad-kid" transform="translate(286 150)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-4 4 Q0 1 4 4" class="sad-mouth" />
                  <path d="M0 8 V34 M-13 18 L0 16 L13 18 M0 34 L-10 49 M0 34 L10 49" />
                </g>
                <g class="sad-kid" transform="translate(332 157) scale(0.9)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-4 4 Q0 1 4 4" class="sad-mouth" />
                  <path d="M0 8 V34 M-13 18 L0 16 L13 18 M0 34 L-10 49 M0 34 L10 49" />
                </g>
                <g class="sad-kid" transform="translate(373 151)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-4 4 Q0 1 4 4" class="sad-mouth" />
                  <path d="M0 8 V34 M-13 18 L0 16 L13 18 M0 34 L-10 49 M0 34 L10 49" />
                </g>
                <g class="sad-kid" transform="translate(420 158) scale(0.86)">
                  <circle cx="0" cy="0" r="8" />
                  <path d="M-4 4 Q0 1 4 4" class="sad-mouth" />
                  <path d="M0 8 V34 M-13 18 L0 16 L13 18 M0 34 L-10 49 M0 34 L10 49" />
                </g>
              </g>

              <g class="icecream-maker slow" aria-label="Disconnected ice cream mixer">
                <path d="M494 66 Q546 42 598 66 L584 182 Q546 202 508 182 Z" class="maker-bucket" />
                <ellipse cx="546" cy="66" rx="55" ry="17" class="maker-rim" />
                <path d="M504 82 Q546 98 588 82" class="maker-cream" />
                <path d="M508 90 L516 180 M546 83 L546 192 M584 90 L576 180" class="maker-staves" />
                <circle cx="618" cy="118" r="9" class="maker-drive-gear" />
                <line x1="610" y1="118" x2="644" y2="118" class="maker-drive-shaft" />
                <g class="rpm-spin rpm-spin-paused" style="animation-duration:2s">
                  <circle cx="676" cy="118" r="42" class="maker-pulley" />
                  <circle cx="676" cy="118" r="7" class="maker-pulley-hub" />
                  <line x1="643" y1="118" x2="709" y2="118" class="maker-pulley-spoke" />
                  <line x1="676" y1="85" x2="676" y2="151" class="maker-pulley-spoke" />
                  <line x1="653" y1="95" x2="699" y2="141" class="maker-pulley-spoke" />
                  <line x1="699" y1="95" x2="653" y2="141" class="maker-pulley-spoke" />
                </g>
                <rect x="483" y="186" width="126" height="27" rx="7" class="maker-status-bg" />
                <text x="546" y="199" text-anchor="middle" class="maker-status-label">No Drive</text>
                <text x="546" y="209" text-anchor="middle" class="maker-status-rpm">0.0 rpm</text>
              </g>
            </svg>
          {/if}

          {#if showIceCreamDisplay && calc.orderedStages.length > 0 && !(showAnimation && visibleRenderStages.length > 0)}
            <svg class={`rpm-stage-svg icecream-maker-standalone ${iceCreamMaker.tone}`} viewBox="0 0 520 220" role="img" aria-label={`Ice cream mixer ${iceCreamMaker.label}`}>
              <text x="18" y="26" class="rpm-svg-title">Ice Cream Mixer</text>
              <g class={`icecream-maker ${iceCreamMaker.tone}`}>
                <path d="M186 66 Q 238 42 290 66 L276 182 Q238 202 200 182 Z" class="maker-bucket" />
                <ellipse cx="238" cy="66" rx="55" ry="17" class="maker-rim" />
                <path d="M196 82 Q238 98 280 82" class="maker-cream" />
                <path d="M200 90 L208 180 M238 83 L238 192 M276 90 L268 180" class="maker-staves" />
                <circle cx="310" cy="118" r="9" class="maker-drive-gear" />
                <line x1="302" y1="118" x2="336" y2="118" class="maker-drive-shaft" />
                <g class:rpm-spin-reverse={calc.finalDirection < 0} class:rpm-spin-paused={rpmStopped(calc.finalRpm)} class="rpm-spin" style={`animation-duration:${period(calc.finalRpm)}s`}>
                  <circle cx="368" cy="118" r="42" class="maker-pulley" />
                  <circle cx="368" cy="118" r="7" class="maker-pulley-hub" />
                  <line x1="335" y1="118" x2="401" y2="118" class="maker-pulley-spoke" />
                  <line x1="368" y1="85" x2="368" y2="151" class="maker-pulley-spoke" />
                  <line x1="345" y1="95" x2="391" y2="141" class="maker-pulley-spoke" />
                  <line x1="391" y1="95" x2="345" y2="141" class="maker-pulley-spoke" />
                </g>
                {#if iceCreamMaker.tone === "slow"}
                  <path d="M208 111 Q236 132 270 111" class="maker-slow-swirl" />
                {:else if iceCreamMaker.tone === "sweet"}
                  <path d="M205 116 L228 138 L272 101" class="maker-sweet-check" />
                {:else}
                  <path d="M176 55 L154 39 M300 55 L323 39 M238 38 L238 13" class="maker-fast-burst" />
                {/if}
                <rect x="177" y="186" width="126" height="27" rx="7" class="maker-status-bg" />
                <text x="240" y="199" text-anchor="middle" class="maker-status-label">{iceCreamMaker.label}</text>
                <text x="240" y="209" text-anchor="middle" class="maker-status-rpm">{fmt(calc.finalRpm, 1)} rpm</text>
              </g>
            </svg>
          {/if}

          {#if !hasVisibleRenderLayer}
            <div class="rpm-display-empty">Select a render layer</div>
          {/if}
        </div>

        <section class="rpm-affiliate-rotator" aria-label="Recommended drive supplies">
          <div class="rpm-affiliate-grid">
            {#each rotatingAffiliateCards as card (card.href)}
              <a class="rpm-affiliate-card" href={card.href} target="_blank" rel="sponsored noopener noreferrer" aria-label={card.aria}>
                <img src={card.image} alt={card.alt} />
                <span class="rpm-affiliate-copy">
                  <span class="rpm-affiliate-category">{card.category}</span>
                  <strong>{card.text}</strong>
                </span>
              </a>
            {/each}
          </div>
        </section>
      </div>

    </section>
  </div>
</section>
{/if}
