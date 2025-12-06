import React from 'react';
import { ProteinMetadata, MutationSite } from '../types';

interface SidebarProps {
  metadata: ProteinMetadata | null;
  mutations: MutationSite[];
}

const Sidebar: React.FC<SidebarProps> = ({ metadata, mutations }) => {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Metadata Section */}
      <section>
        <h2 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2">
            Structure Info
        </h2>
        
        {metadata ? (
            <div className="space-y-3 text-sm">
                <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">PDB ID</span>
                    <span className="text-white font-mono text-lg">{metadata.rcsb_id}</span>
                </div>
                <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Title</span>
                    <p className="text-slate-200 leading-relaxed">{metadata.struct.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <span className="text-slate-400 block text-xs uppercase tracking-wider">Method</span>
                        <span className="text-slate-200">{metadata.exptl?.[0]?.method || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="text-slate-400 block text-xs uppercase tracking-wider">Resolution</span>
                        <span className="text-slate-200">
                            {metadata.rcsb_entry_info.resolution_combined?.[0] 
                                ? `${metadata.rcsb_entry_info.resolution_combined[0]} Å` 
                                : 'N/A'}
                        </span>
                    </div>
                </div>
                <div>
                    <span className="text-slate-400 block text-xs uppercase tracking-wider">Release Date</span>
                    <span className="text-slate-200">
                        {new Date(metadata.rcsb_accession_info.initial_release_date).toLocaleDateString()}
                    </span>
                </div>
            </div>
        ) : (
            <div className="text-slate-500 italic">No structure loaded.</div>
        )}
      </section>

      {/* Mutations / Analysis Section */}
      <section>
        <h2 className="text-xl font-bold text-pink-400 mb-4 border-b border-slate-700 pb-2">
            Literature Analysis
        </h2>
        {mutations.length > 0 ? (
            <div className="space-y-3">
                {mutations.map((mut, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded border-l-2 border-pink-500 hover:bg-slate-800 transition">
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="font-mono font-bold text-pink-300">
                                {mut.wild_type || '?'}{mut.residue_number}{mut.mutated_to || '?'}
                            </span>
                            {mut.chain_id && <span className="text-xs text-slate-500">Chain {mut.chain_id}</span>}
                        </div>
                        <p className="text-xs text-slate-300 leading-tight">{mut.description}</p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-slate-500 text-sm">
                Upload a PDF to extract relevant mutation sites automatically using AI.
            </div>
        )}
      </section>
    </div>
  );
};

export default Sidebar;
