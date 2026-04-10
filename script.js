const meterLine = document.getElementById("meterLine");
const windowTag = document.getElementById("windowTag");
const flexValue = document.getElementById("flexValue");
const valueRange = document.getElementById("valueRange");
const year = document.getElementById("year");

const states = [
  { width: 34, tag: "Low", flex: "1.9 MW", range: "£90k–£220k" },
  { width: 51, tag: "Moderate", flex: "2.4 MW", range: "£120k–£310k" },
  { width: 68, tag: "High", flex: "3.1 MW", range: "£170k–£420k" }
];

let idx = 1;

function updateSignal() {
  const state = states[idx % states.length];
  if (meterLine) meterLine.style.width = `${state.width}%`;
  if (windowTag) windowTag.textContent = state.tag;
  if (flexValue) flexValue.textContent = state.flex;
  if (valueRange) valueRange.textContent = state.range;
  idx += 1;
}

if (year) {
  year.textContent = String(new Date().getFullYear());
}

setInterval(updateSignal, 2600);
