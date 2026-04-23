// Data model for the 15-checkpoint offline pipeline trace (Colab precompute → parquet artifacts).

export type PipelineEnvironment = "colab" | "storage" | "database";
export type PipelinePhase = "pbmc-reference" | "covid-projection" | "genept-disagreement";

export interface ArtifactEntry {
  readonly key: string;
  readonly value: string;
}

export interface DataPreview {
  readonly label: string;
  readonly shape: string;
  readonly sampleJson: string;
  readonly sizeNote: string;
}

export interface AdrReference {
  readonly id: string;
  readonly title: string;
  readonly relevance: string;
}

export interface DesignDecision {
  readonly title: string;
  readonly explanation: string;
}

export interface PipelineCheckpoint {
  readonly step: number;
  readonly phase: PipelinePhase;
  readonly file: string | null;
  readonly environment: PipelineEnvironment;
  readonly title: string;
  readonly description: string;
  readonly code: string;
  readonly codeLanguage: "python";
  readonly artifactAdds: readonly ArtifactEntry[];
  readonly dataPreview: DataPreview | null;
  readonly adrReferences: readonly AdrReference[];
  readonly designDecision: DesignDecision | null;
}
