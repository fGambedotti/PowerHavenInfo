const baselineCanvas = document.getElementById("baselineChart");
const optimisedCanvas = document.getElementById("optimisedChart");
const baselineCostEl = document.getElementById("baselineCost");
const optimisedCostEl = document.getElementById("optimisedCost");
const savingsValueEl = document.getElementById("savingsValue");
const year = document.getElementById("year");

// Hourly shape: high daytime demand and high daytime power prices.
const price = [72, 68, 64, 60, 58, 60, 66, 76, 88, 102, 116, 122, 128, 124, 116, 108, 102, 98, 92, 86, 80, 76, 74, 72];
const baselineDemand = [14.4, 14.1, 13.8, 13.6, 13.9, 14.3, 15.0, 16.1, 17.5, 18.4, 19.1, 19.5, 19.8, 19.6, 19.2, 18.6, 18.0, 17.4, 16.8, 16.1, 15.6, 15.2, 14.9, 14.6];

// Positive values discharge battery to site (reduces grid draw), negatives charge from grid.
const batteryShift = [-2.1, -2.0, -1.9, -1.7, -1.5, -1.0, -0.4, 0, 0.8, 1.8, 2.2, 2.4, 2.6, 2.4, 2.0, 1.4, 0.6, 0.2, -0.3, -0.8, -1.1, -1.2, -1.0, -0.8];

const optimisedGridDemand = baselineDemand.map((value, index) => {
  const shifted = value - batteryShift[index];
  return Math.max(12.5, shifted);
});

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value);
}

function calculateDailyCost(demandSeries, priceSeries) {
  return demandSeries.reduce((sum, demandMw, idx) => sum + demandMw * priceSeries[idx], 0);
}

function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width));
  const height = canvas.height || 220;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  return { ctx, width, height };
}

function normaliseSeries(values, minTarget = 0, maxTarget = 1) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map((v) => minTarget + ((v - min) / range) * (maxTarget - minTarget));
}

function drawAxes(ctx, width, height, padding) {
  const left = padding.left;
  const right = width - padding.right;
  const top = padding.top;
  const bottom = height - padding.bottom;

  ctx.strokeStyle = "rgba(17,24,39,0.12)";
  ctx.lineWidth = 1;

  // Horizontal guide lines
  for (let i = 0; i <= 4; i += 1) {
    const y = top + ((bottom - top) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  // Vertical guides at key hours
  const guideHours = [0, 6, 12, 18, 23];
  guideHours.forEach((hour) => {
    const x = left + (hour / 23) * (right - left);
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();

    ctx.fillStyle = "rgba(17,24,39,0.52)";
    ctx.font = "12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${String(hour).padStart(2, "0")}:00`, x, height - 10);
  });
}

function drawLine(ctx, values, width, height, padding, colour, lineWidth = 2.5) {
  const left = padding.left;
  const right = width - padding.right;
  const top = padding.top;
  const bottom = height - padding.bottom;

  ctx.strokeStyle = colour;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();

  values.forEach((value, index) => {
    const x = left + (index / (values.length - 1)) * (right - left);
    const y = bottom - value * (bottom - top);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function drawBatteryBars(ctx, values, width, height, padding) {
  const left = padding.left;
  const right = width - padding.right;
  const top = padding.top;
  const bottom = height - padding.bottom;
  const mid = top + (bottom - top) * 0.55;
  const maxAbs = Math.max(...values.map((v) => Math.abs(v))) || 1;

  ctx.strokeStyle = "rgba(48, 209, 161, 0.4)";
  ctx.beginPath();
  ctx.moveTo(left, mid);
  ctx.lineTo(right, mid);
  ctx.stroke();

  values.forEach((value, index) => {
    const x = left + (index / (values.length - 1)) * (right - left);
    const halfBarWidth = 4;
    const scale = (Math.abs(value) / maxAbs) * (bottom - top) * 0.25;
    const yTop = value >= 0 ? mid - scale : mid;
    const yBottom = value >= 0 ? mid : mid + scale;

    ctx.fillStyle = "rgba(48, 209, 161, 0.35)";
    ctx.fillRect(x - halfBarWidth, yTop, halfBarWidth * 2, yBottom - yTop);
  });
}

function drawChart(canvas, primarySeries, secondarySeries, batterySeries = null) {
  if (!canvas) return;

  const { ctx, width, height } = setupCanvas(canvas);
  const padding = { top: 14, right: 16, bottom: 28, left: 16 };

  ctx.clearRect(0, 0, width, height);
  drawAxes(ctx, width, height, padding);

  const priceNormalised = normaliseSeries(secondarySeries, 0.15, 0.95);
  const demandNormalised = normaliseSeries(primarySeries, 0.08, 0.88);

  if (batterySeries) {
    drawBatteryBars(ctx, batterySeries, width, height, padding);
  }

  drawLine(ctx, demandNormalised, width, height, padding, "#0A84FF", 2.7);
  drawLine(ctx, priceNormalised, width, height, padding, "#111827", 2.2);
}

function updateCosts() {
  const baselineCost = calculateDailyCost(baselineDemand, price);
  const optimisedCost = calculateDailyCost(optimisedGridDemand, price);
  const savings = baselineCost - optimisedCost;

  if (baselineCostEl) baselineCostEl.textContent = formatCurrency(baselineCost);
  if (optimisedCostEl) optimisedCostEl.textContent = formatCurrency(optimisedCost);
  if (savingsValueEl) savingsValueEl.textContent = formatCurrency(Math.max(0, savings));
}

function renderAll() {
  drawChart(baselineCanvas, baselineDemand, price);
  drawChart(optimisedCanvas, optimisedGridDemand, price, batteryShift);
  updateCosts();
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

renderAll();
window.addEventListener("resize", renderAll);
