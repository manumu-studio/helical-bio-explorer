// Props for shared dashboard filter controls (model, cell type, disease activity).

export interface FilterPanelProps {
  modelName: string;
  onModelChange: (model: string) => void;
  /** When false, hides the model toggle (distance / disagreement views). Defaults to true. */
  showModel?: boolean;
  cellTypes: string[];
  selectedCellType: string;
  onCellTypeChange: (cellType: string) => void;
  showDiseaseActivity: boolean;
  diseaseActivity: string;
  onDiseaseActivityChange: (activity: string) => void;
}
