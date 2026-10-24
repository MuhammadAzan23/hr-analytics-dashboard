// Chart colors per mode. Recharts needs real color values (SVG attributes can't use CSS variables).
export const CHART_THEME = {
  light: {
    series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    muted: "#898781",
    text: "#52514e",
    surface: "#fcfcfb",
  },
  dark: {
    series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
    grid: "#2c2c2a",
    axis: "#383835",
    muted: "#898781",
    text: "#c3c2b7",
    surface: "#1a1a19",
  },
};
