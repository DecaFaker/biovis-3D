export interface ProteinMetadata {
  rcsb_id: string;
  struct: {
    title: string;
  };
  rcsb_accession_info: {
    initial_release_date: string;
  };
  rcsb_entry_info: {
    resolution_combined?: number[];
    molecular_weight?: number;
    polymer_entity_count_protein?: number;
  };
  exptl?: {
    method: string;
  }[];
}

export interface MutationSite {
  residue_number: number;
  chain_id?: string; // Optional, if inferred or specific
  wild_type?: string;
  mutated_to?: string;
  description: string;
}

// 3Dmol.js Types (Partial definition for TS since we load via CDN)
export interface GLViewer {
  zoomTo: () => void;
  render: () => void;
  clear: () => void;
  addModel: (data: string, format: string) => void;
  setStyle: (selection: any, style: any) => void;
  addLabel: (text: string, options: any) => void;
  removeAllLabels: () => void;
  zoomToSelection: (selection: any) => void;
}

export interface StyleCommand {
  selection: Record<string, any>;
  style: Record<string, any>;
}
