const HALF_HOUR_HOURS = 0.5;
const INTERVALS_PER_DAY = 48;
const YEAR = 2025;

const regionSelect = document.getElementById("regionSelect");
const sizeSlider = document.getElementById("sizeSlider");
const sizeValue = document.getElementById("sizeValue");
const useVoltPilot = document.getElementById("useVoltPilot");
const batteryHours = document.getElementById("batteryHours");
const runModelButton = document.getElementById("runModel");
const regionInfo = document.getElementById("regionInfo");
const modeTag = document.getElementById("modeTag");

const baselineCostEl = document.getElementById("baselineCost");
const vpCostEl = document.getElementById("vpCost");
const costSavingEl = document.getElementById("costSaving");
const flexRevenueEl = document.getElementById("flexRevenue");
const netBenefitEl = document.getElementById("netBenefit");
const avgBmPriceEl = document.getElementById("avgBmPrice");
const baseEnergyEl = document.getElementById("baseEnergy");
const vpEnergyEl = document.getElementById("vpEnergy");
const energyReductionEl = document.getElementById("energyReduction");
const emissionReductionEl = document.getElementById("emissionReduction");

const tableBaseCostEl = document.getElementById("tableBaseCost");
const tableBaseEnergyEl = document.getElementById("tableBaseEnergy");
const tableBaseEmissionsEl = document.getElementById("tableBaseEmissions");
const tableVpCostEl = document.getElementById("tableVpCost");
const tableVpRevenueEl = document.getElementById("tableVpRevenue");
const tableVpEnergyEl = document.getElementById("tableVpEnergy");
const tableVpEmissionsEl = document.getElementById("tableVpEmissions");

const gridDrawChart = document.getElementById("gridDrawChart");
const marketChart = document.getElementById("marketChart");

const appState = {
  yearSeries: [],
  dailyThresholds: [],
  regions: []
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
});

const mwhFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function noise(seed) {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

function gaussian(x, center, width) {
  const diff = (x - center) / width;
  return Math.exp(-0.5 * diff * diff);
}

function buildSyntheticYear(year) {
  const start = Date.UTC(year, 0, 1, 0, 0, 0);
  const totalIntervals = 365 * INTERVALS_PER_DAY;
  const series = [];

  for (let index = 0; index < totalIntervals; index += 1) {
    const dayIndex = Math.floor(index / INTERVALS_PER_DAY);
    const slot = index % INTERVALS_PER_DAY;
    const hour = slot / 2;

    const timestamp = new Date(start + index * 30 * 60 * 1000);

    const winterShape = 0.5 + 0.5 * Math.cos((2 * Math.PI * (dayIndex - 15)) / 365);
    const solarShape = Math.max(0, Math.sin((Math.PI * (hour - 6)) / 12));
    const morningPeak = gaussian(hour, 8.25, 2.05);
    const eveningPeak = gaussian(hour, 18.2, 2.35);
    const demandPressure = 0.36 * morningPeak + 0.56 * eveningPeak + 0.12 * gaussian(hour, 13, 3.2);

    const renewableShare = clamp(
      0.21 + 0.34 * solarShape + 0.26 * (1 - winterShape) + 0.16 * (noise(index * 0.37) - 0.5),
      0.09,
      0.88
    );

    const wholesalePrice = clamp(
      47 + 30 * winterShape + 30 * demandPressure - 22 * renewableShare + 9 * (noise(index * 0.17) - 0.5),
      18,
      240
    );

    const carbonIntensity = clamp(
      405 - 270 * renewableShare + 42 * winterShape + 24 * demandPressure + 14 * (noise(index * 0.29) - 0.5),
      70,
      510
    );

    const nationalConstraint = clamp(
      0.2 + 0.41 * demandPressure + 0.25 * winterShape + 0.1 * (noise(index * 0.43) - 0.5),
      0.01,
      1
    );

    const loadShape = clamp(0.7 + 0.22 * morningPeak + 0.32 * eveningPeak + 0.08 * noise(index * 0.31), 0.6, 1.2);

    series.push({
      timestamp,
      dayIndex,
      slot,
      hour,
      wholesalePrice,
      carbonIntensity,
      renewableShare,
      nationalConstraint,
      loadShape
    });
  }

  return series;
}

function buildDailyThresholds(series) {
  const buckets = Array.from({ length: 365 }, () => []);

  series.forEach((point) => {
    buckets[point.dayIndex].push(point.wholesalePrice);
  });

  return buckets.map((prices) => {
    const sorted = [...prices].sort((a, b) => a - b);
    const lowIndex = Math.floor(sorted.length * 0.3);
    const highIndex = Math.floor(sorted.length * 0.75);

    return {
      low: sorted[lowIndex],
      high: sorted[highIndex]
    };
  });
}

function getRegionConstraint(point, region, index) {
  return clamp(
    region.baseConstraint + point.nationalConstraint * region.constraintMultiplier + 0.1 * (noise(index * region.seed) - 0.5),
    0.02,
    1.3
  );
}

function getBmPrice(point, regionConstraint, region) {
  const scarcityAdder = Math.max(0, point.wholesalePrice - 60) / 210;
  return region.bmBasePrice * (1 + 0.92 * regionConstraint) * (1 + scarcityAdder);
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatMWh(value) {
  return `${mwhFormatter.format(value)} MWh`;
}

function formatTonnes(value) {
  return `${mwhFormatter.format(value)} tCO₂`;
}

function computeSimulation({ sizeMw, region, batteryDurationHours }) {
  const batteryCapacityMwh = sizeMw * batteryDurationHours;
  const batteryPowerMw = sizeMw;
  const chargeEfficiency = 0.96;
  const dischargeEfficiency = 0.96;

  let baselineCost = 0;
  let baselineEnergy = 0;
  let baselineGridEnergy = 0;
  let baselineEmissions = 0;

  let vpCost = 0;
  let vpEnergy = 0;
  let vpGridEnergy = 0;
  let vpEmissions = 0;
  let vpRevenue = 0;
  let bmAccumulator = 0;

  let soc = batteryCapacityMwh * 0.5;

  const baselineDrawSnapshot = [];
  const vpDrawSnapshot = [];
  const priceSnapshot = [];
  const bmSnapshot = [];
  const snapshotStart = 34 * INTERVALS_PER_DAY;
  const snapshotEnd = snapshotStart + 96;

  appState.yearSeries.forEach((point, index) => {
    const regionConstraint = getRegionConstraint(point, region, index);
    const bmPrice = getBmPrice(point, regionConstraint, region);
    bmAccumulator += bmPrice;

    const baseLoadMw =
      sizeMw *
      clamp(0.81 + 0.2 * point.loadShape + 0.04 * (noise(index * 0.61 + sizeMw * 0.13) - 0.5), 0.67, 1.18);

    const baselineGridMw = baseLoadMw;
    const baselineIntervalEnergy = baselineGridMw * HALF_HOUR_HOURS;
    const carbonFactor = point.carbonIntensity * region.zoneCarbonMultiplier;

    baselineCost += baselineIntervalEnergy * point.wholesalePrice;
    baselineEnergy += baseLoadMw * HALF_HOUR_HOURS;
    baselineGridEnergy += baselineIntervalEnergy;
    baselineEmissions += (baselineIntervalEnergy * carbonFactor) / 1000;

    const optimisationFactor = 0.018 + 0.04 * regionConstraint;
    const optimisedLoadMw = baseLoadMw * (1 - optimisationFactor);

    const thresholds = appState.dailyThresholds[point.dayIndex];
    let chargeMw = 0;
    let dischargeMw = 0;

    const shouldCharge = point.wholesalePrice <= thresholds.low && soc < batteryCapacityMwh * 0.97;
    const shouldDischarge =
      (point.wholesalePrice >= thresholds.high || regionConstraint >= 0.72) && soc > batteryCapacityMwh * 0.04;

    if (shouldCharge) {
      const availableStorageMwh = batteryCapacityMwh - soc;
      chargeMw = Math.min(batteryPowerMw, availableStorageMwh / (HALF_HOUR_HOURS * chargeEfficiency));
      soc += chargeMw * HALF_HOUR_HOURS * chargeEfficiency;
    }

    if (shouldDischarge) {
      const deliverableMw = (soc * dischargeEfficiency) / HALF_HOUR_HOURS;
      dischargeMw = Math.min(batteryPowerMw, optimisedLoadMw, deliverableMw);
      soc -= (dischargeMw * HALF_HOUR_HOURS) / dischargeEfficiency;
    }

    const vpGridMw = Math.max(0, optimisedLoadMw + chargeMw - dischargeMw);
    const vpIntervalGridEnergy = vpGridMw * HALF_HOUR_HOURS;
    const dischargedMwh = dischargeMw * HALF_HOUR_HOURS;

    vpCost += vpIntervalGridEnergy * point.wholesalePrice;
    vpEnergy += optimisedLoadMw * HALF_HOUR_HOURS;
    vpGridEnergy += vpIntervalGridEnergy;
    vpEmissions += (vpIntervalGridEnergy * carbonFactor) / 1000;
    vpRevenue += dischargedMwh * bmPrice;

    if (index >= snapshotStart && index < snapshotEnd) {
      baselineDrawSnapshot.push(baselineGridMw);
      vpDrawSnapshot.push(vpGridMw);
      priceSnapshot.push(point.wholesalePrice);
      bmSnapshot.push(bmPrice);
    }
  });

  return {
    baselineCost,
    vpCost,
    vpRevenue,
    netBenefit: baselineCost - vpCost + vpRevenue,
    baselineEnergy,
    vpEnergy,
    baselineGridEnergy,
    vpGridEnergy,
    baselineEmissions,
    vpEmissions,
    bmAverage: bmAccumulator / appState.yearSeries.length,
    snapshots: {
      baselineDrawSnapshot,
      vpDrawSnapshot,
      priceSnapshot,
      bmSnapshot
    }
  };
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(360, Math.floor(rect.width));
  const height = canvas.height || 240;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  return { ctx, width, height };
}

function drawMultiLineChart(canvas, seriesConfigs, xLabelStep = 12) {
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 16, right: 16, bottom: 30, left: 16 };
  const left = padding.left;
  const right = width - padding.right;
  const top = padding.top;
  const bottom = height - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const allValues = seriesConfigs.flatMap((config) => config.values);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const yRange = maxValue - minValue || 1;

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i += 1) {
    const y = top + ((bottom - top) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const length = seriesConfigs[0].values.length;

  for (let i = 0; i < length; i += 1) {
    if (i % xLabelStep !== 0 && i !== length - 1) {
      continue;
    }

    const x = left + (i / (length - 1)) * (right - left);
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(210,223,245,0.72)";
    ctx.font = "11px Arial, sans-serif";
    ctx.textAlign = "center";
    const hour = Math.floor((i / 2) % 24);
    ctx.fillText(`${String(hour).padStart(2, "0")}:00`, x, height - 10);
  }

  seriesConfigs.forEach((config) => {
    ctx.strokeStyle = config.color;
    ctx.globalAlpha = config.opacity ?? 1;
    ctx.lineWidth = config.width ?? 2;
    ctx.beginPath();

    config.values.forEach((value, index) => {
      const x = left + (index / (length - 1)) * (right - left);
      const yNorm = (value - minValue) / yRange;
      const y = bottom - yNorm * (bottom - top);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function updateRegionInfo(region) {
  regionInfo.innerHTML = `
    <strong>${region.label}</strong><br />
    DNO: ${region.dno}<br />
    TSO: ${region.tso}<br />
    Regional balancing intensity: ${region.constraintMultiplier.toFixed(2)}x
  `;
}

function renderResults(simulation) {
  const useVp = useVoltPilot.checked;

  const annualSaving = simulation.baselineCost - simulation.vpCost;
  const energySaved = simulation.baselineEnergy - simulation.vpEnergy;
  const emissionsAvoided = simulation.baselineEmissions - simulation.vpEmissions;

  baselineCostEl.textContent = formatCurrency(simulation.baselineCost);
  vpCostEl.textContent = formatCurrency(simulation.vpCost);
  costSavingEl.textContent = formatCurrency(annualSaving);
  flexRevenueEl.textContent = formatCurrency(simulation.vpRevenue);
  netBenefitEl.textContent = formatCurrency(simulation.netBenefit);
  avgBmPriceEl.textContent = `${currencyFormatter.format(simulation.bmAverage)}/MWh`;
  baseEnergyEl.textContent = formatMWh(simulation.baselineEnergy);
  vpEnergyEl.textContent = formatMWh(simulation.vpEnergy);
  energyReductionEl.textContent = formatMWh(energySaved);
  emissionReductionEl.textContent = formatTonnes(emissionsAvoided);

  tableBaseCostEl.textContent = formatCurrency(simulation.baselineCost);
  tableBaseEnergyEl.textContent = formatMWh(simulation.baselineGridEnergy);
  tableBaseEmissionsEl.textContent = formatTonnes(simulation.baselineEmissions);
  tableVpCostEl.textContent = formatCurrency(simulation.vpCost);
  tableVpRevenueEl.textContent = formatCurrency(simulation.vpRevenue);
  tableVpEnergyEl.textContent = formatMWh(simulation.vpGridEnergy);
  tableVpEmissionsEl.textContent = formatTonnes(simulation.vpEmissions);

  modeTag.textContent = useVp ? "Mode: VoltPilot enabled" : "Mode: VoltPilot disabled";

  drawMultiLineChart(gridDrawChart, [
    {
      values: simulation.snapshots.baselineDrawSnapshot,
      color: "#91a9c9",
      width: useVp ? 2 : 3,
      opacity: useVp ? 0.6 : 1
    },
    {
      values: simulation.snapshots.vpDrawSnapshot,
      color: "#00D4FF",
      width: useVp ? 3 : 2,
      opacity: useVp ? 1 : 0.6
    }
  ]);

  drawMultiLineChart(marketChart, [
    {
      values: simulation.snapshots.priceSnapshot,
      color: "#4cc8ff",
      width: 2.5,
      opacity: 0.95
    },
    {
      values: simulation.snapshots.bmSnapshot,
      color: "#4FFFB0",
      width: 2.2,
      opacity: 0.95
    }
  ]);
}

function runSimulation() {
  const selectedRegion = appState.regions.find((region) => region.id === regionSelect.value);
  const sizeMw = Number(sizeSlider.value);
  const batteryDurationHours = Number(batteryHours.value);

  updateRegionInfo(selectedRegion);

  const simulation = computeSimulation({
    sizeMw,
    region: selectedRegion,
    batteryDurationHours
  });

  renderResults(simulation);
}

async function loadRegions() {
  try {
    const response = await fetch("./data/regions.json");
    if (!response.ok) {
      throw new Error("Cannot load region metadata");
    }

    return await response.json();
  } catch (error) {
    return [
      {
        id: "fallback",
        label: "UK (fallback)",
        dno: "Mixed DNO",
        tso: "National Energy System Operator",
        constraintMultiplier: 1,
        baseConstraint: 0.2,
        bmBasePrice: 60,
        zoneCarbonMultiplier: 1,
        seed: 1.1
      }
    ];
  }
}

function populateRegionSelect(regions) {
  regionSelect.innerHTML = "";

  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.id;
    option.textContent = `${region.label} — ${region.dno}`;
    regionSelect.appendChild(option);
  });
}

function bindEvents() {
  sizeSlider.addEventListener("input", () => {
    sizeValue.textContent = `${sizeSlider.value} MW`;
  });

  runModelButton.addEventListener("click", runSimulation);
  regionSelect.addEventListener("change", runSimulation);
  batteryHours.addEventListener("change", runSimulation);
  useVoltPilot.addEventListener("change", runSimulation);

  window.addEventListener("resize", runSimulation);
}

async function initDemo() {
  appState.regions = await loadRegions();
  populateRegionSelect(appState.regions);

  appState.yearSeries = buildSyntheticYear(YEAR);
  appState.dailyThresholds = buildDailyThresholds(appState.yearSeries);

  bindEvents();
  runSimulation();
}

initDemo();
