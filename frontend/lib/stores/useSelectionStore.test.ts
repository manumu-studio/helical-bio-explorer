// Unit tests for selection store setters and visibility helpers.

import { beforeEach, describe, expect, it } from "vitest";

import {
  isCellTypeVisible,
  isConditionVisible,
  useSelectionStore,
} from "@/lib/stores/useSelectionStore";

describe("useSelectionStore", () => {
  beforeEach(() => {
    useSelectionStore.setState({
      selectedCellIds: [],
      hoveredCellId: null,
      activeCellTypes: [],
      activeConditions: [],
      divergenceRange: [0, 1],
    });
  });

  it("sets selected cell ids", () => {
    useSelectionStore.getState().setSelectedCellIds(["a", "b"]);
    expect(useSelectionStore.getState().selectedCellIds).toEqual(["a", "b"]);
    useSelectionStore.getState().clearSelection();
    expect(useSelectionStore.getState().selectedCellIds).toEqual([]);
  });

  it("sets hovered cell id", () => {
    useSelectionStore.getState().setHoveredCellId("x");
    expect(useSelectionStore.getState().hoveredCellId).toBe("x");
    useSelectionStore.getState().setHoveredCellId(null);
    expect(useSelectionStore.getState().hoveredCellId).toBeNull();
  });

  it("sets active cell types", () => {
    useSelectionStore.getState().setActiveCellTypes(["CD4 T"]);
    expect(useSelectionStore.getState().activeCellTypes).toEqual(["CD4 T"]);
    useSelectionStore.getState().setActiveCellTypes([]);
  });

  it("sets active conditions", () => {
    useSelectionStore.getState().setActiveConditions(["healthy", "severe"]);
    expect(useSelectionStore.getState().activeConditions).toEqual(["healthy", "severe"]);
    useSelectionStore.getState().setActiveConditions([]);
  });

  it("sets divergence range", () => {
    useSelectionStore.getState().setDivergenceRange([0.1, 0.9]);
    expect(useSelectionStore.getState().divergenceRange).toEqual([0.1, 0.9]);
    useSelectionStore.getState().setDivergenceRange([0, 1]);
  });
});

describe("isCellTypeVisible", () => {
  it("treats empty active list as all visible", () => {
    expect(isCellTypeVisible("CD4 T", [])).toBe(true);
  });

  it("filters to included types when active is non-empty", () => {
    expect(isCellTypeVisible("CD4 T", ["CD4 T"])).toBe(true);
    expect(isCellTypeVisible("B", ["CD4 T"])).toBe(false);
  });
});

describe("isConditionVisible", () => {
  it("treats empty active list as all visible", () => {
    expect(isConditionVisible("mild", [])).toBe(true);
  });

  it("maps low/high to mild/severe filters", () => {
    expect(isConditionVisible("low", ["mild"])).toBe(true);
    expect(isConditionVisible("high", ["severe"])).toBe(true);
  });
});
