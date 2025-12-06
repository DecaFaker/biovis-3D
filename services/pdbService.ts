import { ProteinMetadata } from '../types';

const DATA_API_URL = 'https://data.rcsb.org/rest/v1/core/entry';
const FILE_URL = 'https://files.rcsb.org/download';

export const fetchProteinMetadata = async (pdbId: string): Promise<ProteinMetadata> => {
  const response = await fetch(`${DATA_API_URL}/${pdbId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for ${pdbId}`);
  }
  return response.json();
};

export const fetchProteinStructure = async (pdbId: string): Promise<string> => {
  // RCSB usually supports CORS for these files.
  // If strict CORS issues arise in specific environments, a proxy would be needed.
  const response = await fetch(`${FILE_URL}/${pdbId}.cif`);
  
  if (!response.ok) {
    if (response.status === 404) throw new Error("PDB ID not found.");
    throw new Error(`Failed to fetch structure for ${pdbId}. If this is a CORS error, consider using a proxy or a browser extension for development.`);
  }
  return response.text();
};
