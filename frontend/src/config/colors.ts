import { HUMAN_DISPLAY_LABEL } from "./humans";

export const TEAM_COLORS: Record<string, string> = {
  "Solo Model": "#14B8A6",
  "Solo Models": "#14B8A6",
  "1 Agent": "#14B8A6",
  "2-Agent Team": "#22C55E",
  "2-Agent Teams": "#22C55E",
  "2 Agents": "#22C55E",
  "3-Agent Team": "#6366F1",
  "3-Agent Teams": "#6366F1",
  "3 Agents": "#6366F1",
  Human: "#F59E0B",
  [HUMAN_DISPLAY_LABEL]: "#F59E0B",
  default: "#0F172A"
};

export const CONDITION_COLORS: Record<string, string> = {
  Control: "#4C1D95",
  Human: "#4C1D95",
  [HUMAN_DISPLAY_LABEL]: "#4C1D95",
  Advisor: "#3D4BF2",
  AdvisorMax: "#18218c",
  AdvisorAll: "#666771",
  "Advisor + Guardian": "#0369A1",
  "Advisor + Steward": "#38BDF8",
  "Advisor + Guardian + Guardian": "#166534",
  "Advisor + Guardian + Steward": "#22C55E"
};
