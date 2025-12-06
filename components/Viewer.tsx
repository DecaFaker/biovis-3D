import React, { useEffect, useRef, useState } from 'react';
import { GLViewer, StyleCommand, MutationSite } from '../types';

interface ViewerProps {
  pdbData: string | null;
  format: 'pdb' | 'cif';
  commands: StyleCommand[];
  mutations: MutationSite[];
  isLoading: boolean;
}

declare global {
  interface Window {
    $3Dmol: any;
  }
}

const Viewer: React.FC<ViewerProps> = ({ pdbData, format, commands, mutations, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GLViewer | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize Viewer
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const element = containerRef.current;
    const config = { backgroundColor: '#0f172a' }; // match slate-900
    
    if (window.$3Dmol) {
        const viewer = window.$3Dmol.createViewer(element, config);
        viewerRef.current = viewer;
        setIsReady(true);
    }
  }, []);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
        if(viewerRef.current) viewerRef.current.render();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load Model Data
  useEffect(() => {
    if (!viewerRef.current || !pdbData) return;

    const viewer = viewerRef.current;
    viewer.clear();
    viewer.addModel(pdbData, format);
    
    // Default Style
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    viewer.zoomTo();
    viewer.render();
  }, [pdbData, format, isReady]);

  // Apply NLP Styling Commands
  useEffect(() => {
    if (!viewerRef.current || commands.length === 0) return;
    
    const viewer = viewerRef.current;
    commands.forEach(cmd => {
      viewer.setStyle(cmd.selection, cmd.style);
    });
    viewer.render();
  }, [commands]);

  // Apply Mutation Highlights
  useEffect(() => {
    if (!viewerRef.current || mutations.length === 0) return;

    const viewer = viewerRef.current;
    
    // Reset labels first (optional strategy, or keep accumulating)
    viewer.removeAllLabels();

    mutations.forEach(mut => {
        const selection: any = { resi: mut.residue_number };
        if (mut.chain_id) selection.chain = mut.chain_id;

        // Highlight style
        viewer.setStyle(selection, { 
            stick: { colorscheme: 'redCarbon', radius: 0.4 }, 
            sphere: { color: 'red', scale: 0.5, hidden: false } 
        });

        // Label
        viewer.addLabel(`${mut.wild_type || ''}${mut.residue_number}${mut.mutated_to || ''}: ${mut.description}`, {
            position: selection,
            backgroundColor: 'rgba(0,0,0,0.8)',
            fontColor: 'white',
            fontSize: 12,
            borderThickness: 1,
            borderColor: 'red'
        });
    });

    viewer.render();
  }, [mutations]);

  return (
    <div className="relative w-full h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-inner">
        <div ref={containerRef} className="w-full h-full" />
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            </div>
        )}
        {!isReady && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                Initializing 3D Engine...
            </div>
        )}
    </div>
  );
};

export default Viewer;
