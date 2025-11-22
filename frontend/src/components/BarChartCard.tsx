'use client';

import { TEAM_COLORS } from "@/config/colors";
import { HUMAN_DISPLAY_LABEL, isHumanLabel } from "@/config/humans";
import type { DataRow, MetricMetadata } from "@/types/dataset";
import {
  pickRowsForMetric,
  sortRowsForMetric,
  formatMetricValue,
  getCombinationBaseKeyFromId,
  getCombinationBaseKeyFromRow
} from "@/utils/data";
import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type {
  CSSProperties,
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent
} from "react";

const applyAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const clampAlpha = Math.min(Math.max(alpha, 0), 1);
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${clampAlpha})`;
  }
  if (normalized.length !== 6) {
    return hex;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampAlpha})`;
};

type Props = {
  rows: DataRow[];
  metricId: string;
  onMetricChange: (metricId: string) => void;
  onBarClick?: (row: DataRow) => void;
  onHighlightAssign?: (target: "primary" | "comparison", row: DataRow) => void;
  highlightedCombinationId?: string | null;
  comparisonCombinationId?: string | null;
  maxItems?: number;
  metrics: MetricMetadata[];
  metadataMap: Map<string, MetricMetadata>;
  conditionColorMap: Map<string, string>;
};

const PRIMARY_SELECTION_COLOR = "#0ea5e9";
const COMPARISON_SELECTION_COLOR = "#f97316";
const getTextColor = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155 ? '#111827' : '#f8fafc';
};

export function BarChartCard({
  rows,
  metricId,
  onMetricChange,
  onBarClick,
  onHighlightAssign,
  highlightedCombinationId,
  comparisonCombinationId,
  maxItems = 5,
  metrics,
  metadataMap,
  conditionColorMap
}: Props) {
  const [viewMode, setViewMode] = useState<"bestWorst" | "all">(
    "bestWorst"
  );
  const [showConfidence, setShowConfidence] = useState(true);
  const [modelFilter, setModelFilter] = useState("");
  const isAllView = viewMode === "all";
  const metricMeta = metadataMap.get(metricId);
  const metricDescription = metricMeta?.description ?? "";
  const isPercentMetric = metricMeta?.range === "percent";
  const higherIsBetter = metricMeta?.betterDirection !== "lower";
  const betterDirectionLabel = higherIsBetter
    ? "Higher is better"
    : "Lower is better";

  const dataForMetric = useMemo(() => {
    const normalizedFilter = modelFilter.trim().toLowerCase();
    const rowsMatchingFilter = normalizedFilter
      ? rows.filter((row) =>
          (row.model ?? "")
            .toString()
            .toLowerCase()
            .includes(normalizedFilter)
        )
      : rows;
    const filtered = pickRowsForMetric(rowsMatchingFilter, metricId);
    const sortedForBest = sortRowsForMetric(filtered, higherIsBetter);
    const perGroup = Math.max(1, maxItems);
    const top = sortedForBest.slice(0, perGroup);

    const sortedForWorst = sortRowsForMetric(filtered, !higherIsBetter);
    const bottom: DataRow[] = [];
    for (const candidate of sortedForWorst) {
      if (bottom.length >= perGroup) {
        break;
      }

      const candidateModel = candidate.model.trim();
      if (isHumanLabel(candidateModel)) {
        continue;
      }

      if (!top.some((row) => row.combinationId === candidate.combinationId)) {
        bottom.push(candidate);
      }
    }

    const bottomSorted = sortRowsForMetric(bottom, higherIsBetter);

    const bestOrder = new Map(
      sortedForBest.map((row, index) => [row.combinationId, index])
    );
    const worstOrder = new Map(
      sortedForWorst.map((row, index) => [row.combinationId, index])
    );

    const insertInOrder = (
      collection: DataRow[],
      row: DataRow,
      orderMap: Map<string, number>
    ): DataRow[] => {
      const targetIndex = orderMap.get(row.combinationId);
      if (targetIndex === undefined) {
        return collection;
      }

      const next = [...collection];
      let inserted = false;
      for (let index = 0; index < next.length; index += 1) {
        const existing = next[index];
        const existingOrder =
          orderMap.get(existing.combinationId) ?? Number.POSITIVE_INFINITY;
        if (existingOrder > targetIndex) {
          next.splice(index, 0, row);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        next.push(row);
      }
      return next;
    };

    const topWithSelections = [...top];
    const bottomWithSelections = [...bottomSorted];
    const selectedRows: DataRow[] = [];
    const topIds = new Set(topWithSelections.map((row) => row.combinationId));
    const bottomIds = new Set(
      bottomWithSelections.map((row) => row.combinationId)
    );
    const selectedIds = new Set<string>();

    const selectionTargets = [
      {
        combinationId: highlightedCombinationId ?? null,
        baseKey: getCombinationBaseKeyFromId(highlightedCombinationId)
      },
      {
        combinationId: comparisonCombinationId ?? null,
        baseKey: getCombinationBaseKeyFromId(comparisonCombinationId)
      }
    ].filter((target) => target.combinationId || target.baseKey);

    selectionTargets.forEach((target) => {
      const match = filtered.find((row) => {
        if (target.combinationId && row.combinationId === target.combinationId) {
          return true;
        }
        if (target.baseKey) {
          return getCombinationBaseKeyFromRow(row) === target.baseKey;
        }
        return false;
      });

      if (!match) {
        return;
      }

      if (
        !isHumanLabel(match.model) &&
        (topIds.has(match.combinationId) || bottomIds.has(match.combinationId))
      ) {
        return;
      }

      const bestRank = bestOrder.get(match.combinationId);
      const worstRank = worstOrder.get(match.combinationId);
      if (bestRank === undefined || worstRank === undefined) {
        return;
      }

      if (selectedIds.has(match.combinationId)) {
        return;
      }

      const targetCollection = insertInOrder(selectedRows, match, bestOrder);
      selectedRows.splice(0, selectedRows.length, ...targetCollection);
      selectedIds.add(match.combinationId);
    });

    const humanRow = filtered.find((row) => {
      const modelValue = (row.model ?? "").trim();
      return isHumanLabel(modelValue);
    });

    if (humanRow && !selectedIds.has(humanRow.combinationId)) {
      const bestRank = bestOrder.get(humanRow.combinationId);
      const targetCollection =
        bestRank === undefined
          ? [...selectedRows, humanRow]
          : insertInOrder(selectedRows, humanRow, bestOrder);
      selectedRows.splice(0, selectedRows.length, ...targetCollection);
      selectedIds.add(humanRow.combinationId);
    }

    const combinedDisplay = [
      ...topWithSelections,
      ...selectedRows,
      ...bottomWithSelections.filter(
        (row) =>
          !topIds.has(row.combinationId) && !selectedIds.has(row.combinationId)
      )
    ];

    return {
      topRows: topWithSelections,
      selectedRows,
      bottomRows: bottomWithSelections,
      displayRows: combinedDisplay,
      allRows: sortedForBest
    };
  }, [
    rows,
    metricId,
    maxItems,
    higherIsBetter,
    highlightedCombinationId,
    comparisonCombinationId,
    modelFilter
  ]);

  const { topRows, selectedRows, bottomRows, displayRows, allRows } =
    dataForMetric;

  const rowsForAxis = isAllView ? allRows : displayRows;

  type Snapshot = {
    metricId: string;
    viewMode: "bestWorst" | "all";
    topRows: DataRow[];
    selectedRows: DataRow[];
    bottomRows: DataRow[];
    displayRows: DataRow[];
    allRows: DataRow[];
    axisMin: number;
    axisMax: number;
  };

  const { axisMin, axisMax } = useMemo(() => {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;
    rowsForAxis.forEach((row) => {
      if (row.mean !== null && row.mean !== undefined) {
        minValue = Math.min(minValue, row.mean);
        maxValue = Math.max(maxValue, row.mean);
      }
    });

    if (minValue === Number.POSITIVE_INFINITY) {
      minValue = 0;
    }
    if (maxValue === Number.NEGATIVE_INFINITY) {
      maxValue = 0;
    }

    const defaultMin = isPercentMetric ? 0 : Math.min(0, minValue);
    const defaultMax = isPercentMetric ? 1 : Math.max(maxValue, 0);

    const resolvedMin =
      metricMeta?.axisMin !== null && metricMeta?.axisMin !== undefined
        ? metricMeta.axisMin
        : defaultMin;
    const resolvedMax =
      metricMeta?.axisMax !== null && metricMeta?.axisMax !== undefined
        ? metricMeta.axisMax
        : defaultMax;

    const fallbackMax =
      resolvedMin + Math.abs(resolvedMin || 1) * 0.1;
    const adjustedMax =
      resolvedMax > resolvedMin
        ? resolvedMax
        : fallbackMax !== resolvedMin
        ? fallbackMax
        : resolvedMin + 1;

    return {
      axisMin: resolvedMin,
      axisMax: adjustedMax
    };
  }, [rowsForAxis, metricMeta?.axisMin, metricMeta?.axisMax, isPercentMetric]);

  const snapshot = useMemo<Snapshot>(() => {
    return {
      metricId,
      viewMode,
      topRows,
      selectedRows,
      bottomRows,
      displayRows,
      allRows,
      axisMin,
      axisMax
    };
  }, [
    metricId,
    viewMode,
    topRows,
    selectedRows,
    bottomRows,
    displayRows,
    allRows,
    axisMin,
    axisMax
  ]);

  const encodeRowOrder = (rowsToEncode: DataRow[]) =>
    rowsToEncode.map((row) => row.combinationId).join("|");

  const snapshotKey = useMemo(() => {
    return [
      snapshot.metricId,
      snapshot.viewMode,
      encodeRowOrder(snapshot.displayRows),
      encodeRowOrder(snapshot.allRows),
      encodeRowOrder(snapshot.topRows),
      encodeRowOrder(snapshot.selectedRows),
      encodeRowOrder(snapshot.bottomRows),
      snapshot.axisMin.toPrecision(6),
      snapshot.axisMax.toPrecision(6)
    ].join("::");
  }, [snapshot]);

  const previousSnapshotRef = useRef<Snapshot>(snapshot);
  const previousKeyRef = useRef<string>(snapshotKey);
  const fadeTimeoutRef = useRef<number>();
  const [outgoingSnapshot, setOutgoingSnapshot] = useState<Snapshot | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "prepare" | "entering"
  >("idle");
  const [draggedHighlight, setDraggedHighlight] = useState<
    "primary" | "comparison" | null
  >(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [touchDragState, setTouchDragState] = useState<
    { pointerId: number; type: "primary" | "comparison" }
      | null
  >(null);
  const [showDragHint, setShowDragHint] = useState(true);
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const rowById = useMemo(() => {
    const map = new Map<string, DataRow>();
    rows.forEach((row) => {
      map.set(row.combinationId, row);
    });
    return map;
  }, [rows]);

  const rowElementsRef = useRef<Map<string, HTMLButtonElement>>(
    new Map()
  );
  const previousPositionsRef = useRef<Map<string, DOMRect>>(new Map());
  const activeAnimationsRef = useRef<Map<string, Animation>>(new Map());
  const hasMeasuredPositionsRef = useRef(false);
  const prefersReducedMotionRef = useRef(false);

  const registerRowElement = useCallback(
    (combinationId: string, element: HTMLButtonElement | null) => {
      const registry = rowElementsRef.current;
      if (!element) {
        registry.delete(combinationId);
        return;
      }
      registry.set(combinationId, element);
    },
    []
  );

  const ensureDragPreviewElement = useCallback(
    (
      rect: DOMRect,
      color: string,
      pointerPosition?: { x: number; y: number } | null
    ) => {
      if (typeof document === "undefined") {
        return null;
      }
      let preview = dragPreviewRef.current;
      if (!preview) {
        preview = document.createElement("div");
        preview.setAttribute("aria-hidden", "true");
        preview.style.pointerEvents = "none";
        preview.style.position = "absolute";
        preview.style.top = "-1000px";
        preview.style.left = "-1000px";
        preview.style.zIndex = "-1";
        dragPreviewRef.current = preview;
        document.body.appendChild(preview);
      }

      let inner = preview.firstChild as HTMLDivElement | null;
      if (!inner) {
        inner = document.createElement("div");
        inner.style.position = "absolute";
        inner.style.pointerEvents = "none";
        inner.style.borderRadius = "6px";
        preview.appendChild(inner);
      }

      const pointerX =
        pointerPosition && Number.isFinite(pointerPosition.x)
          ? pointerPosition.x
          : rect.left + rect.width / 2;
      const pointerY =
        pointerPosition && Number.isFinite(pointerPosition.y)
          ? pointerPosition.y
          : rect.top + rect.height / 2;

      const leftDelta = Math.max(0, rect.left - pointerX);
      const rightDelta = Math.max(0, pointerX - rect.right);
      const topDelta = Math.max(0, rect.top - pointerY);
      const bottomDelta = Math.max(0, pointerY - rect.bottom);

      const totalWidth = Math.max(rect.width + leftDelta + rightDelta, 24);
      const totalHeight = Math.max(rect.height + topDelta + bottomDelta, 12);

      preview.style.width = `${totalWidth}px`;
      preview.style.height = `${totalHeight}px`;
      preview.style.background = "transparent";
      preview.style.borderRadius = "0";
      preview.style.boxShadow = "none";

      inner.style.left = `${leftDelta}px`;
      inner.style.top = `${topDelta}px`;
      inner.style.width = `${Math.max(rect.width, 1)}px`;
      inner.style.height = `${Math.max(rect.height, 1)}px`;
      inner.style.borderRadius = "6px";
      inner.style.background = applyAlpha(color, 0.18);
      inner.style.boxShadow = `inset 0 0 0 2px ${color}40`;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

      const offsetX = clamp(
        pointerX + leftDelta - rect.left,
        0,
        totalWidth
      );
      const offsetY = clamp(
        pointerY + topDelta - rect.top,
        0,
        totalHeight
      );

      return { preview, offsetX, offsetY };
    },
    []
  );

  const handleHighlightDragStart = useCallback(
    (
      event: ReactDragEvent<HTMLElement>,
      type: "primary" | "comparison",
      color: string
    ) => {
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", type);
        const currentTarget = event.currentTarget as HTMLElement;
        const buttonElement = currentTarget.closest<HTMLButtonElement>(
          "button[data-combination-id]"
        );
        const referenceElement = buttonElement ?? currentTarget;
        const rect = referenceElement.getBoundingClientRect();
        const pointerPosition =
          Number.isFinite(event.clientX) && Number.isFinite(event.clientY)
            ? { x: event.clientX, y: event.clientY }
            : null;
        const previewInfo = ensureDragPreviewElement(
          rect,
          color,
          pointerPosition
        );
        if (previewInfo) {
          const { preview, offsetX, offsetY } = previewInfo;
          event.dataTransfer.setDragImage(preview, offsetX, offsetY);
        }
      }
      setDraggedHighlight(type);
      setShowDragHint(false);
    },
    [ensureDragPreviewElement]
  );

  const handleHighlightDragEnd = useCallback(() => {
    setDropTargetId(null);
    setDraggedHighlight(null);
    setTouchDragState(null);
  }, []);

  const handleHighlightPointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLElement>,
      type: "primary" | "comparison"
    ) => {
      event.stopPropagation();
      if (event.pointerType === "mouse") {
        return;
      }
      event.preventDefault();
      const { pointerId, currentTarget } = event;
      if (typeof currentTarget.setPointerCapture === "function") {
        try {
          currentTarget.setPointerCapture(pointerId);
        } catch {
          // Some browsers might throw if the pointer cannot be captured.
        }
      }
      setDraggedHighlight(type);
      setTouchDragState({ pointerId, type });
      setShowDragHint(false);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") {
        return;
      }
      const preview = dragPreviewRef.current;
      if (preview?.parentNode) {
        preview.parentNode.removeChild(preview);
        dragPreviewRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showDragHint || typeof window === "undefined") {
      return;
    }
    const timeout = window.setTimeout(() => setShowDragHint(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [showDragHint]);

  useEffect(() => {
    if (!touchDragState) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== touchDragState.pointerId) {
        return;
      }
      event.preventDefault();
      const targetElement = document.elementFromPoint(
        event.clientX,
        event.clientY
      );
      const button = targetElement?.closest<HTMLButtonElement>(
        "button[data-combination-id]"
      );
      const combinationId = button?.dataset.combinationId ?? null;
      setDropTargetId((current) =>
        current === combinationId ? current : combinationId
      );
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerId !== touchDragState.pointerId) {
        return;
      }
      event.preventDefault();
      const targetElement = document.elementFromPoint(
        event.clientX,
        event.clientY
      );
      const button = targetElement?.closest<HTMLButtonElement>(
        "button[data-combination-id]"
      );
      const combinationId = button?.dataset.combinationId ?? null;
      if (combinationId && onHighlightAssign) {
        const row = rowById.get(combinationId);
        if (row) {
          onHighlightAssign(touchDragState.type, row);
        }
      }
      handleHighlightDragEnd();
    };

    const handlePointerCancel = (event: PointerEvent) => {
      if (event.pointerId !== touchDragState.pointerId) {
        return;
      }
      event.preventDefault();
      handleHighlightDragEnd();
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: false
    });
    document.addEventListener("pointerup", handlePointerEnd, {
      passive: false
    });
    document.addEventListener("pointercancel", handlePointerCancel, {
      passive: false
    });

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerEnd);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [
    touchDragState,
    handleHighlightDragEnd,
    onHighlightAssign,
    rowById
  ]);

  useEffect(() => {
    if (transitionPhase !== "prepare") {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setTransitionPhase("entering");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [transitionPhase]);

  useEffect(() => {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      prefersReducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) {
        activeAnimationsRef.current.forEach((animation) => animation.cancel());
        activeAnimationsRef.current.clear();
      }
    };
    updatePreference();
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updatePreference);
      return () => mediaQuery.removeEventListener("change", updatePreference);
    }
    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const registry = rowElementsRef.current;
    if (!registry.size) {
      previousPositionsRef.current = new Map();
      return;
    }

    const nextPositions = new Map<string, DOMRect>();
    registry.forEach((element, key) => {
      nextPositions.set(key, element.getBoundingClientRect());
    });

    if (!hasMeasuredPositionsRef.current) {
      previousPositionsRef.current = nextPositions;
      hasMeasuredPositionsRef.current = true;
      return;
    }

    if (prefersReducedMotionRef.current) {
      previousPositionsRef.current = nextPositions;
      return;
    }

    const activeAnimations = activeAnimationsRef.current;

    nextPositions.forEach((rect, key) => {
      const element = registry.get(key);
      if (!element) {
        return;
      }

      const previousRect = previousPositionsRef.current.get(key);
      const existingAnimation = activeAnimations.get(key);
      existingAnimation?.cancel();

      if (!previousRect) {
        const animation = element.animate(
          [
            { transform: "translateY(16px)", opacity: 0 },
            { transform: "translateY(0px)", opacity: 1 }
          ],
          {
            duration: 600,
            easing: "cubic-bezier(0.33,1,0.68,1)",
            fill: "both"
          }
        );
        animation.onfinish = () => {
          if (activeAnimations.get(key) === animation) {
            activeAnimations.delete(key);
          }
        };
        animation.oncancel = () => {
          if (activeAnimations.get(key) === animation) {
            activeAnimations.delete(key);
          }
        };
        activeAnimations.set(key, animation);
        return;
      }

      const deltaX = previousRect.left - rect.left;
      const deltaY = previousRect.top - rect.top;

      if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) {
        activeAnimations.delete(key);
        return;
      }

      const animation = element.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px)`,
            opacity: 0.75
          },
          { transform: "translate(0px, 0px)", opacity: 1 }
        ],
        {
          duration: 700,
          easing: "cubic-bezier(0.22,1,0.36,1)",
          fill: "both"
        }
      );
      animation.onfinish = () => {
        if (activeAnimations.get(key) === animation) {
          activeAnimations.delete(key);
        }
      };
      animation.oncancel = () => {
        if (activeAnimations.get(key) === animation) {
          activeAnimations.delete(key);
        }
      };
      activeAnimations.set(key, animation);
    });

    activeAnimations.forEach((animation, key) => {
      if (!nextPositions.has(key)) {
        animation.cancel();
        activeAnimations.delete(key);
      }
    });

    previousPositionsRef.current = nextPositions;
  }, [snapshotKey]);

  useEffect(() => {
    const previousKey = previousKeyRef.current;
    if (previousKey && previousKey !== snapshotKey) {
      setOutgoingSnapshot(previousSnapshotRef.current);
      setIsFadingOut(true);
      setTransitionPhase("prepare");

      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = window.setTimeout(() => {
        setOutgoingSnapshot(null);
        setIsFadingOut(false);
        setTransitionPhase("idle");
        fadeTimeoutRef.current = undefined;
      }, 700);
    }

    previousSnapshotRef.current = snapshot;
    previousKeyRef.current = snapshotKey;

    return () => {
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [snapshotKey, snapshot]);

  const getDefaultBarColor = useCallback(
    (row: DataRow) => {
      const conditionKey = (row.condition ?? "").trim();
      if (conditionKey && conditionColorMap.has(conditionKey)) {
        return conditionColorMap.get(conditionKey)!;
      }
      const teamKey = (row.team ?? "").trim();
      if (teamKey && conditionColorMap.has(teamKey)) {
        return conditionColorMap.get(teamKey)!;
      }
      if (teamKey && TEAM_COLORS[teamKey]) {
        return TEAM_COLORS[teamKey];
      }
      return TEAM_COLORS.default;
    },
    [conditionColorMap]
  );

  const handleRowClick = (row: DataRow) => {
    onBarClick?.(row);
  };

  const toggleViewMode = () => {
    setViewMode((current) => (current === "all" ? "bestWorst" : "all"));
  };

  const toggleConfidence = () => {
    setShowConfidence((current) => !current);
  };

  const renderConfidenceToggle = () => (
    <button
      type="button"
      aria-pressed={showConfidence}
      onClick={toggleConfidence}
      className={clsx(
        "rounded-full border px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-wide transition-colors duration-300 ease-out",
        showConfidence
          ? "border-slate-300 bg-slate-100 text-slate-700"
          : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600"
      )}
      title={
        showConfidence
          ? "Hide confidence intervals"
          : "Show confidence intervals"
      }
    >
      Confidence
    </button>
  );

  const primaryBaseKey = useMemo(
    () => getCombinationBaseKeyFromId(highlightedCombinationId),
    [highlightedCombinationId]
  );
  const comparisonBaseKey = useMemo(
    () => getCombinationBaseKeyFromId(comparisonCombinationId),
    [comparisonCombinationId]
  );

  const renderRowButton = (
    row: DataRow,
    meta: MetricMetadata | undefined,
    axisMinValue: number,
    axisMaxValue: number,
    registerElement?: (id: string, element: HTMLButtonElement | null) => void
  ) => {
    const value = row.mean ?? 0;
    const valueClamped = Math.min(Math.max(value, axisMinValue), axisMaxValue);
    const range = axisMaxValue - axisMinValue || 1;
    const widthPercentRaw =
      range <= 0 ? 0 : ((valueClamped - axisMinValue) / range) * 100;
    const widthPercent = Math.max(Math.min(widthPercentRaw, 100), 0);
    const rowBaseKey = getCombinationBaseKeyFromRow(row);
    const isPrimarySelected =
      highlightedCombinationId === row.combinationId ||
      (primaryBaseKey !== null && rowBaseKey === primaryBaseKey);
    const isComparisonSelected =
      comparisonCombinationId === row.combinationId ||
      (comparisonBaseKey !== null && rowBaseKey === comparisonBaseKey);
    const isSelected = isPrimarySelected || isComparisonSelected;
    const highlightColor = isPrimarySelected
      ? PRIMARY_SELECTION_COLOR
      : isComparisonSelected
      ? COMPARISON_SELECTION_COLOR
      : undefined;
    const barColor = getDefaultBarColor(row);
    const displayLabel = row.displayLabel || row.model;
    const formattedValue = formatMetricValue(row.mean, {
      metadata: meta,
      digits: 1
    });
    const hasCi = row.ci !== null && row.ci !== undefined && row.ci !== 0;
    const ciLabel = hasCi
      ? `CI: ± ${formatMetricValue(row.ci, { metadata: meta, digits: 1 })}`
      : "CI: NA";
    const textColor = getTextColor(barColor);
    const activeHighlightType = isPrimarySelected
      ? "primary"
      : isComparisonSelected
      ? "comparison"
      : null;
    const isDropTarget =
      dropTargetId === row.combinationId && draggedHighlight !== null;
    const dropTargetColor =
      draggedHighlight === "comparison"
        ? COMPARISON_SELECTION_COLOR
        : PRIMARY_SELECTION_COLOR;

    const buttonStyle: CSSProperties = {};
    const boxShadows: string[] = [];
    if (highlightColor) {
      buttonStyle.borderColor = highlightColor;
      boxShadows.push(`0 0 0 2px ${highlightColor}1a`);
    }
    if (isDropTarget) {
      if (!highlightColor) {
        buttonStyle.borderColor = dropTargetColor;
      }
      boxShadows.push(`0 0 0 ${highlightColor ? 4 : 2}px ${dropTargetColor}33`);
    }
    if (boxShadows.length > 0) {
      buttonStyle.boxShadow = boxShadows.join(", ");
    }

    const renderConfidenceVisual = () => {
      if (!hasCi || range <= 0) {
        return null;
      }
      const ciHalf = row.ci ?? 0;
      const baseMean = row.mean ?? axisMinValue;
      const ciMin = baseMean - ciHalf;
      const ciMax = baseMean + ciHalf;
      const clamp = (val: number) =>
        Math.min(Math.max(val, axisMinValue), axisMaxValue);
      const percent = (val: number) =>
        Math.max(
          Math.min(((clamp(val) - axisMinValue) / range) * 100, 100),
          0
        );
      const startPercent = percent(ciMin);
      const endPercent = percent(ciMax);
      const bandWidth = Math.max(endPercent - startPercent, 0);
      if (bandWidth <= 0) {
        return null;
      }

      const isConfidenceVisible = showConfidence;

      return (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-[3px] rounded-[6px]"
          style={{
            left: `${startPercent}%`,
            width: `${bandWidth}%`,
            background: `linear-gradient(to right, ${applyAlpha(
              barColor,
              0.12
            )}, ${applyAlpha(barColor, 0.3)})`,
            opacity: isConfidenceVisible ? 1 : 0,
            transform: isConfidenceVisible ? "scaleY(1)" : "scaleY(0.6)",
            transition:
              "opacity 280ms ease, transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            transformOrigin: "center"
          }}
        />
      );
    };

    return (
      <button
        ref={
          registerElement
            ? (node) => registerElement(row.combinationId, node)
            : undefined
        }
        key={row.combinationId}
        type="button"
        data-combination-id={row.combinationId}
        aria-pressed={isSelected}
        onClick={() => handleRowClick(row)}
        onPointerDown={(event) => {
          if (!activeHighlightType) {
            return;
          }
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-highlight-handle='true']")) {
            return;
          }
          handleHighlightPointerDown(event, activeHighlightType);
        }}
        draggable={activeHighlightType ? true : undefined}
        onDragStart={(event) => {
          if (!activeHighlightType || !highlightColor) {
            return;
          }
          const target = event.target as HTMLElement | null;
          if (target?.closest("[data-highlight-handle='true']")) {
            return;
          }
          handleHighlightDragStart(event, activeHighlightType, highlightColor);
        }}
        onDragEnd={handleHighlightDragEnd}
        className={clsx(
          "relative group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-transparent bg-white/0 px-2 py-1.5 text-left transition-[background-color,border-color,box-shadow,opacity] duration-[550ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
          isSelected
            ? "border-2 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm"
            : "hover:border-slate-200 hover:bg-slate-50/70",
          isDropTarget ? "border-dashed" : undefined,
          activeHighlightType ? "cursor-grab" : undefined
        )}
        style={buttonStyle}
        onDragEnter={(event) => {
          if (!draggedHighlight) {
            return;
          }
          event.preventDefault();
          setDropTargetId(row.combinationId);
        }}
        onDragOver={(event) => {
          if (!draggedHighlight) {
            return;
          }
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDragLeave={(event) => {
          if (!draggedHighlight) {
            return;
          }
          const related = event.relatedTarget as Node | null;
          if (!related || !event.currentTarget.contains(related)) {
            setDropTargetId((current) =>
              current === row.combinationId ? null : current
            );
          }
        }}
        onDrop={(event) => {
          const type =
            draggedHighlight ??
            (event.dataTransfer?.getData("text/plain") as
              | "primary"
              | "comparison"
              | undefined);
          if (type !== "primary" && type !== "comparison") {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onHighlightAssign?.(type, row);
          setDropTargetId(null);
          handleHighlightDragEnd();
        }}
      >
        <div className="relative h-8 w-full overflow-hidden rounded-[6px]">
          <div className="absolute inset-0 rounded-[6px] bg-slate-200" />
          {renderConfidenceVisual()}
          <div
            className={clsx(
              "absolute inset-0 rounded-[6px] transition-[width,background-color,opacity,box-shadow] duration-[650ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
              isSelected
                ? "opacity-100 shadow-inner shadow-slate-900/10"
                : "opacity-95"
            )}
            style={{
              width: `${widthPercent}%`,
              backgroundColor: barColor
            }}
          />
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 truncate text-sm font-medium"
            style={{ color: textColor }}
            title={row.displayLabel || row.model}
          >
            {displayLabel}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-sm font-semibold text-slate-900">
            {formattedValue}
          </span>
          <span className="text-xs text-slate-500">{ciLabel}</span>
        </div>
        {showDragHint && activeHighlightType ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white opacity-100 shadow-lg transition-opacity duration-200"
          >
            Drag and drop
          </span>
        ) : null}
      </button>
    );
  };

  const renderRowGroup = (
    rowsToRender: DataRow[],
    emptyMessage: string,
    meta: MetricMetadata | undefined,
    axisBounds: { axisMin: number; axisMax: number },
    registerElement?: (id: string, element: HTMLButtonElement | null) => void
  ) => {
    if (!rowsToRender.length) {
      return (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 transition-all duration-500 ease-out">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-1 transition-all duration-500 ease-out">
        {rowsToRender.map((row) =>
          renderRowButton(
            row,
            meta,
            axisBounds.axisMin,
            axisBounds.axisMax,
            registerElement
          )
        )}
      </div>
    );
  };

  const renderSnapshotContent = (
    target: Snapshot,
    meta: MetricMetadata | undefined,
    registerElement?: (id: string, element: HTMLButtonElement | null) => void
  ) => {
    if (target.viewMode === "all") {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              All Models
            </h3>
            <label
              className="w-full max-w-[14rem] shrink"
              htmlFor="bar-chart-model-filter"
            >
              <span className="sr-only">Filter models</span>
              <input
                id="bar-chart-model-filter"
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                placeholder="Filter models"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                type="text"
              />
            </label>
            {renderConfidenceToggle()}
          </div>
          <div className="flex flex-col gap-2">
            {renderRowGroup(
              target.allRows,
              "No models available for the selected filters.",
              meta,
              { axisMin: target.axisMin, axisMax: target.axisMax },
              registerElement
            )}
          </div>
        </div>
      );
    }

    const selectedCombinationIds = new Set(
      target.selectedRows.map((row) => row.combinationId)
    );
    const topRowsForDisplay = target.topRows.filter(
      (row) => !selectedCombinationIds.has(row.combinationId)
    );
    const bottomRowsForDisplay = target.bottomRows.filter(
      (row) => !selectedCombinationIds.has(row.combinationId)
    );

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Best
            </h3>
            <label
              className="w-full max-w-[14rem] shrink"
              htmlFor="bar-chart-model-filter"
            >
              <span className="sr-only">Filter models</span>
              <input
                id="bar-chart-model-filter"
                value={modelFilter}
                onChange={(event) => setModelFilter(event.target.value)}
                placeholder="Filter models"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-300"
                type="text"
              />
            </label>
            {renderConfidenceToggle()}
          </div>
          {renderRowGroup(
            topRowsForDisplay,
            "No models available for the selected filters.",
            meta,
            { axisMin: target.axisMin, axisMax: target.axisMax },
            registerElement
          )}
        </div>
        {target.selectedRows.length ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Selected
            </h3>
            {renderRowGroup(
              target.selectedRows,
              "No selected models to display.",
              meta,
              { axisMin: target.axisMin, axisMax: target.axisMax },
              registerElement
            )}
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Worst
          </h3>
          {renderRowGroup(
            bottomRowsForDisplay,
            "No bottom performers to display for the selected filters.",
            meta,
            { axisMin: target.axisMin, axisMax: target.axisMax },
            registerElement
          )}
        </div>
      </div>
    );
  };

  const shouldAnimate = transitionPhase !== "idle" || isFadingOut;
  const transitionTimingClass =
    "transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const incomingClassName = clsx(
    "relative",
    transitionTimingClass,
    shouldAnimate ? "will-change-transform will-change-opacity" : undefined,
    transitionPhase === "prepare"
      ? "opacity-0 translate-y-2"
      : "opacity-100 translate-y-0"
  );
  const outgoingClassName = clsx(
    "pointer-events-none absolute inset-0",
    transitionTimingClass,
    shouldAnimate ? "will-change-transform will-change-opacity" : undefined,
    isFadingOut ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
  );

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-slate-200 transition-all duration-[600ms] ease-[cubic-bezier(0.33,1,0.68,1)]">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Performance:{" "}
              <button
                type="button"
                onClick={toggleViewMode}
                aria-pressed={isAllView}
                className={clsx(
                  "rounded px-1 font-semibold text-brand-600 underline decoration-dashed underline-offset-4 transition-colors duration-500 ease-out hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500/40",
                  isAllView ? "text-brand-700" : undefined
                )}
                title={
                  isAllView
                    ? "Show only the best and worst performers"
                    : "Show all models"
                }
              >
                {isAllView ? "All" : "Best and Worst"}
              </button>{" "}
              Models
            </h2>
            <p className="text-sm text-slate-500">
              Compare model performance on a variety of metrics
            </p>
          </div>
          <div className="flex min-w-[12rem] flex-col items-end gap-2">
            <select
              id="bar-chart-metric-select"
              value={metricId}
              onChange={(event) => onMetricChange(event.target.value)}
              aria-label="Select metric"
              className="w-full rounded-xl border-2 border-brand-300 bg-brand-50 px-4 py-2.5 text-base font-semibold text-brand-900 shadow transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400 hover:border-brand-400"
            >
              {metrics.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayLabel}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {betterDirectionLabel}
            </span>
          </div>
        </div>
        {metricDescription ? (
          <p className="text-xs text-slate-500">{metricDescription}</p>
        ) : null}
      </header>
      <div className="relative">
        {outgoingSnapshot ? (
          <div aria-hidden className={outgoingClassName}>
            {renderSnapshotContent(
              outgoingSnapshot,
              metadataMap.get(outgoingSnapshot.metricId)
            )}
          </div>
        ) : null}
        <div className={incomingClassName}>
          {renderSnapshotContent(
            snapshot,
            metadataMap.get(snapshot.metricId),
            registerRowElement
          )}
        </div>
      </div>
    </section>
  );
}
