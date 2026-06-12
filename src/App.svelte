<script>
  import { onMount } from "svelte";
  import ControlPanel from "./lib/components/ControlPanel.svelte";
  import MetricPills from "./lib/components/MetricPills.svelte";
  import PreviewCanvas from "./lib/components/PreviewCanvas.svelte";
  import ProjectTabs from "./lib/components/ProjectTabs.svelte";
  import SpeedCalculatorPage from "./lib/components/SpeedCalculatorPage.svelte";
  import { downloadModel, isBlockingWarning } from "./lib/download.js";
  import { legacy } from "./lib/legacy.js";
  import { cloneDefaults, createProjectConfigs, projectKeysByCategory, projectOrder } from "./lib/projects.js";
  import { applyLinkedPreset, normalizeParams } from "./lib/state/control-utils.js";

  const engine = legacy();
  const projectConfigs = createProjectConfigs();
  const initialParams = Object.fromEntries(projectOrder.map((key) => [key, cloneDefaults(projectConfigs[key])]));
  const defaultMeshView = {
    rotX: -0.58,
    rotZ: 0.72,
    zoom: 1,
  };
  const projectPreviewViews = {
    speedReductionBracket: {
      rotX: 0,
      rotZ: 0,
      zoom: 1,
    },
  };

  let projectKey = "flatBeltPulley";
  let workspace = "models";
  let unit = "in";
  let paramsByProject = initialParams;
  let deletedFeatures = {
    deletedBoltIndices: new Set(),
    deletedSlotIndices: new Set(),
  };
  let mesh = null;
  let derived = null;
  let warnings = [];
  let statusOverride = "";
  let statusOverrideVariant = "";
  let isExporting = false;
  let view = {
    ...defaultMeshView,
    showDxfDimensions: false,
  };

  $: activeProject = projectConfigs[projectKey];
  $: activeParams = paramsByProject[projectKey];
  $: engine.setUnit(unit);
  $: metricRows = derived && unit ? activeProject.metrics(derived) : [];
  $: blockingWarnings = warnings.filter(isBlockingWarning);
  $: canDownload = Boolean(mesh) && blockingWarnings.length === 0 && !isExporting;
  $: statusVariant =
    statusOverrideVariant || (blockingWarnings.length > 0 ? "warning" : warnings.length > 0 ? "recommendation" : "");
  $: statusText = statusOverride || (warnings.length > 0 ? warnings.join(" ") : "Ready to export.");
  $: previewContext = {
    projectKey,
    params: activeParams,
    derived,
    formatDimension,
  };
  $: visibleProjectKeys = projectKeysByCategory[workspace] || projectKeysByCategory.models;

  function alignProjectToWorkspace(nextWorkspace = workspace) {
    const projectKeys = projectKeysByCategory[nextWorkspace];
    if (!projectKeys || projectKeys.includes(projectKey)) return false;
    projectKey = projectKeys[0];
    return true;
  }

  function rebuild(nextParams = activeParams, options = {}) {
    const key = options.projectKey || projectKey;
    const project = projectConfigs[key];
    if (!project) return;
    if (options.clearStatus !== false) {
      statusOverride = "";
      statusOverrideVariant = "";
    }

    try {
      engine.setUnit(unit);
      const raw = normalizeParams(key, nextParams, unit, deletedFeatures);
      const validated = project.validate(raw);
      warnings = validated.warnings;
      mesh = project.generate(validated.params);
      derived = mesh.derived;
    } catch (error) {
      console.error(error);
      warnings = [
        project.exportType === "dxf"
          ? "Unable to generate this drawing. Try reducing hole, slot, or bore sizes."
          : "Unable to generate this geometry. Try reducing spoke curve, spoke width, or radius.",
      ];
      mesh = null;
      derived = null;
    }
  }

  function formatDimension(value) {
    const option = engine.unitOptions[unit] || engine.unitOptions.in;
    return `${(value * option.factorFromInch).toFixed(option.decimals)} ${option.label}`;
  }

  function defaultPreviewViewFor(key = projectKey) {
    return projectPreviewViews[key] || defaultMeshView;
  }

  function applyDefaultPreviewView(key = projectKey) {
    view = {
      ...view,
      ...defaultPreviewViewFor(key),
    };
  }

  function handleProjectChange(nextProjectKey) {
    if (!projectConfigs[nextProjectKey] || nextProjectKey === projectKey) {
      rebuild();
      fitDxfPreviewAfterLayout(activeProject);
      return;
    }
    const nextProject = projectConfigs[nextProjectKey];
    projectKey = nextProjectKey;
    applyDefaultPreviewView(nextProjectKey);
    rebuild(paramsByProject[nextProjectKey], { projectKey: nextProjectKey });
    fitDxfPreviewAfterLayout(nextProject);
  }

  function handleFieldChange(fieldKey, value) {
    let nextParams = {
      ...activeParams,
      [fieldKey]: value,
    };
    nextParams = applyLinkedPreset(fieldKey, value, nextParams, engine);
    clearHeadGasketDeletedForField(fieldKey);
    paramsByProject = {
      ...paramsByProject,
      [projectKey]: nextParams,
    };
    rebuild(nextParams);
    fitDxfPreviewAfterLayout(activeProject);
  }

  function handleUnitChange(nextUnit) {
    if (!engine.unitOptions[nextUnit] || nextUnit === unit) return;
    unit = nextUnit;
    rebuild(activeParams);
    fitDxfPreviewAfterLayout(activeProject);
  }

  function handleReset() {
    const nextParams = cloneDefaults(activeProject);
    unit = "in";
    deletedFeatures = {
      deletedBoltIndices: new Set(),
      deletedSlotIndices: new Set(),
    };
    paramsByProject = {
      ...paramsByProject,
      [projectKey]: nextParams,
    };
    view = {
      ...view,
      ...defaultPreviewViewFor(projectKey),
      showDxfDimensions: false,
    };
    rebuild(nextParams);
    fitDxfPreviewAfterLayout(activeProject);
  }

  async function handleDownload() {
    if (!canDownload) return;
    isExporting = true;
    statusOverrideVariant = "";
    if (activeProject.onePieceStl) {
      statusOverride = "Preparing one-piece STL...";
    }

    try {
      const exportResult = await downloadModel({
        engine,
        project: activeProject,
        params: activeParams,
        mesh,
        unit,
      });
      statusOverride = exportResult
        ? `One-piece STL ready. Joined ${exportResult.sourceComponentCount} shells into ${exportResult.unionedComponentCount} closed mesh.`
        : "Download started.";
    } catch (error) {
      console.error(error);
      statusOverride = error?.message || "Unable to prepare this download.";
      statusOverrideVariant = "warning";
    } finally {
      isExporting = false;
    }
  }

  function clearHeadGasketDeletedForField(fieldKey) {
    if (projectKey !== "headGasket") return;
    if (fieldKey === "gasketBoltCount") {
      deletedFeatures = {
        ...deletedFeatures,
        deletedBoltIndices: new Set(),
      };
    }
    if (fieldKey === "gasketSlotCount") {
      deletedFeatures = {
        ...deletedFeatures,
        deletedSlotIndices: new Set(),
      };
    }
  }

  function handleHeadGasketDelete(target) {
    if (target.type === "bolt") {
      deletedFeatures = {
        ...deletedFeatures,
        deletedBoltIndices: new Set([...deletedFeatures.deletedBoltIndices, target.index]),
      };
    } else if (target.type === "slot") {
      deletedFeatures = {
        ...deletedFeatures,
        deletedSlotIndices: new Set([...deletedFeatures.deletedSlotIndices, target.index]),
      };
    } else {
      return;
    }

    rebuild(activeParams, { clearStatus: false });
    fitDxfPreviewAfterLayout(activeProject);
    statusOverrideVariant = "";
    statusOverride = `${target.type === "bolt" ? "Bolt hole" : "Slot"} removed from this gasket pattern. Reset restores removed gasket features.`;
  }

  function fitDxfPreviewAfterLayout(project = activeProject) {
    if (project?.exportType !== "dxf") return;
    view = {
      ...view,
      zoom: 1,
    };
    requestAnimationFrame(() => {
      view = {
        ...view,
        zoom: 1,
      };
    });
  }

  function setPreviewZoom(zoom) {
    view = {
      ...view,
      zoom: Math.min(5.5, Math.max(0.35, zoom)),
    };
  }

  function resetPreviewView() {
    view = {
      ...view,
      ...defaultPreviewViewFor(projectKey),
    };
  }

  function syncWorkspaceFromHash() {
    const previousProjectKey = projectKey;
    if (["#calculator", "#rpm-calculator"].includes(window.location.hash)) {
      workspace = "speed";
      return;
    }
    if (window.location.hash === "#tractor") {
      workspace = "tractor";
      return;
    }

    workspace = window.location.hash === "#gaskets" ? "gaskets" : "models";
    if (alignProjectToWorkspace()) {
      applyDefaultPreviewView(projectKey);
    }
    if (projectKey !== previousProjectKey && mesh) {
      rebuild(paramsByProject[projectKey], { projectKey });
      fitDxfPreviewAfterLayout(projectConfigs[projectKey]);
    }
  }

  function setWorkspace(nextWorkspace) {
    const previousProjectKey = projectKey;
    workspace = nextWorkspace;
    alignProjectToWorkspace(nextWorkspace);
    const nextHash =
      nextWorkspace === "speed"
        ? "#rpm-calculator"
        : nextWorkspace === "tractor"
          ? "#tractor"
          : nextWorkspace === "gaskets"
            ? "#gaskets"
            : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
    if (projectKey !== previousProjectKey) {
      applyDefaultPreviewView(projectKey);
      rebuild(paramsByProject[projectKey], { projectKey });
      fitDxfPreviewAfterLayout(projectConfigs[projectKey]);
    }
  }

  onMount(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    syncWorkspaceFromHash();
    window.addEventListener("hashchange", syncWorkspaceFromHash);
    rebuild(paramsByProject[projectKey], { projectKey });
    fitDxfPreviewAfterLayout(projectConfigs[projectKey]);

    return () => {
      window.removeEventListener("hashchange", syncWorkspaceFromHash);
    };
  });
</script>

<div class="workspace">
  <nav class="workspace-nav" aria-label="Application workspace">
    <div class="workspace-brand">
      <span>Build Your Own Engine Display</span>
      <small>Free DXF/STL files for makers, collectors, and old iron fans</small>
    </div>

    <div class="workspace-switcher">
      <button
        type="button"
        class:active={workspace === "models"}
        aria-current={workspace === "models" ? "page" : undefined}
        on:click={() => setWorkspace("models")}
      >
        3D Models
      </button>
      <button
        type="button"
        class:active={workspace === "gaskets"}
        aria-current={workspace === "gaskets" ? "page" : undefined}
        on:click={() => setWorkspace("gaskets")}
      >
        Gaskets
      </button>
      <button
        type="button"
        class:active={workspace === "speed"}
        aria-current={workspace === "speed" ? "page" : undefined}
        on:click={() => setWorkspace("speed")}
      >
        Ice Cream
      </button>
      <button
        type="button"
        class:active={workspace === "tractor"}
        aria-current={workspace === "tractor" ? "page" : undefined}
        on:click={() => setWorkspace("tractor")}
      >
        Tractor
      </button>
    </div>
  </nav>

  {#if workspace === "models" || workspace === "gaskets"}
    <div class="app-shell" class:dxf-workspace={activeProject.exportType === "dxf"}>
      <ControlPanel
        project={activeProject}
        {projectKey}
        params={activeParams}
        {unit}
        {engine}
        showDxfDimensions={view.showDxfDimensions}
        {statusText}
        {statusVariant}
        {canDownload}
        onUnitChange={handleUnitChange}
        onFieldChange={handleFieldChange}
        onDxfDimensionsChange={(showDxfDimensions) => {
          view = { ...view, showDxfDimensions, zoom: 1 };
          fitDxfPreviewAfterLayout(activeProject);
        }}
        onDownload={handleDownload}
        onReset={handleReset}
      />

      <section class="preview-panel">
        <div class="preview-toolbar">
          <div>
            <p class="eyebrow">Preview</p>
            <h2>{activeProject.previewTitle || "Mesh View"}</h2>
          </div>

          <ProjectTabs
            projects={projectConfigs}
            activeKey={projectKey}
            projectKeys={visibleProjectKeys}
            onProjectChange={handleProjectChange}
          />

          <div class="preview-info">
            <MetricPills rows={metricRows} />
            <div class="view-controls" aria-label="Preview controls">
              <button
                class="zoom-control"
                type="button"
                aria-label="Zoom out"
                disabled={!mesh}
                on:click={() => setPreviewZoom(view.zoom / 1.18)}
              >
                -
              </button>
              <button type="button" class:active={view.zoom === 1} disabled={!mesh} on:click={resetPreviewView}>Fit</button>
              <button
                class="zoom-control"
                type="button"
                aria-label="Zoom in"
                disabled={!mesh}
                on:click={() => setPreviewZoom(view.zoom * 1.18)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <PreviewCanvas
          {mesh}
          {view}
          context={previewContext}
          {projectKey}
          onViewChange={(nextView) => {
            view = nextView;
          }}
          onZoomChange={setPreviewZoom}
          onHeadGasketDelete={handleHeadGasketDelete}
        />
      </section>
    </div>
  {/if}

  <div class="calculator-shell" hidden={workspace !== "speed"}>
    <SpeedCalculatorPage mode="speed" />
  </div>

  <div class="calculator-shell" hidden={workspace !== "tractor"}>
    <SpeedCalculatorPage mode="tractor" />
  </div>
</div>
