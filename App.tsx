import React, { useState } from 'react';
import { fetchProteinMetadata, fetchProteinStructure } from './services/pdbService';
import { generate3DStyle, analyzePaperForMutations } from './services/geminiService';
import { extractTextFromPdf } from './services/pdfService';
import Viewer from './components/Viewer';
import Sidebar from './components/Sidebar';
import { ProteinMetadata, MutationSite, StyleCommand } from './types';

// Icons
const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);
const SendIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
);
const UploadIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
);

export default function App() {
  // State
  const [pdbId, setPdbId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pdbData, setPdbData] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ProteinMetadata | null>(null);
  const [styles, setStyles] = useState<StyleCommand[]>([]);
  const [mutations, setMutations] = useState<MutationSite[]>([]);
  
  const [nlpInput, setNlpInput] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  
  const [analyzingPdf, setAnalyzingPdf] = useState(false);

  // Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdbId || pdbId.length !== 4) {
        setError('Please enter a valid 4-character PDB ID.');
        return;
    }
    
    setLoading(true);
    setError(null);
    setMutations([]); // Clear previous analysis
    setStyles([]); // Clear previous styles

    try {
        const [meta, struct] = await Promise.all([
            fetchProteinMetadata(pdbId),
            fetchProteinStructure(pdbId)
        ]);
        setMetadata(meta);
        setPdbData(struct);
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch PDB data.');
    } finally {
        setLoading(false);
    }
  };

  const handleNlpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpInput.trim()) return;

    setNlpLoading(true);
    try {
        const commands = await generate3DStyle(nlpInput);
        setStyles(commands);
    } catch (err) {
        console.error("NLP Error", err);
        setError("Failed to interpret style command.");
    } finally {
        setNlpLoading(false);
        setNlpInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdbId) {
        if(!pdbId) setError("Please load a PDB structure before analyzing a paper.");
        return;
    }

    setAnalyzingPdf(true);
    try {
        const text = await extractTextFromPdf(file);
        const sites = await analyzePaperForMutations(text, pdbId);
        setMutations(sites);
    } catch (err) {
        console.error("PDF Analysis Error", err);
        setError("Failed to analyze PDF file. Ensure it is text-readable.");
    } finally {
        setAnalyzingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
                BV
            </div>
            <h1 className="text-xl font-bold tracking-tight">BioVis <span className="text-cyan-400 font-light">3D</span></h1>
        </div>

        <form onSubmit={handleSearch} className="flex items-center bg-slate-800 rounded-md overflow-hidden border border-slate-700 focus-within:border-cyan-500 transition-colors w-96">
            <span className="pl-3 text-slate-400">
                <SearchIcon />
            </span>
            <input 
                type="text" 
                value={pdbId}
                onChange={(e) => setPdbId(e.target.value.toUpperCase())}
                placeholder="Enter PDB ID (e.g., 4HHB)" 
                className="bg-transparent border-none outline-none px-3 py-2 text-sm w-full font-mono placeholder-slate-500"
                maxLength={4}
            />
            <button type="submit" disabled={loading} className="px-4 py-2 bg-slate-700 hover:bg-cyan-600 text-sm font-medium transition-colors">
                {loading ? '...' : 'Load'}
            </button>
        </form>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left/Center Canvas */}
        <div className="flex-1 flex flex-col relative">
            <div className="flex-1 p-4">
                <Viewer 
                    pdbData={pdbData} 
                    format="cif"
                    commands={styles}
                    mutations={mutations}
                    isLoading={loading}
                />
            </div>

            {/* Bottom Controls / NLP Overlay */}
            <div className="h-20 border-t border-slate-800 bg-slate-900 px-6 flex items-center gap-4">
                <form onSubmit={handleNlpSubmit} className="flex-1 flex gap-2">
                    <input 
                        type="text"
                        value={nlpInput}
                        onChange={(e) => setNlpInput(e.target.value)}
                        disabled={!pdbData || nlpLoading}
                        placeholder={!pdbData ? "Load a structure first..." : "Ask AI to style: e.g., 'Show chain A as blue cartoon and hide others'"}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={!pdbData || nlpLoading}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {nlpLoading ? <span className="animate-spin">↻</span> : <SendIcon />}
                        <span>Apply Style</span>
                    </button>
                </form>
            </div>
            
            {/* Error Toast */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500 text-red-200 px-4 py-2 rounded shadow-lg backdrop-blur text-sm">
                    {error}
                    <button onClick={() => setError(null)} className="ml-4 font-bold hover:text-white">×</button>
                </div>
            )}
        </div>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
            <div className="flex-1 overflow-hidden">
                <Sidebar metadata={metadata} mutations={mutations} />
            </div>
            
            {/* Upload Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
                <label className={`block w-full border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-pink-500 hover:bg-slate-800/50 group ${analyzingPdf ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={analyzingPdf || !pdbData} />
                    <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-pink-400">
                        {analyzingPdf ? (
                            <>
                                <div className="animate-spin h-6 w-6 border-2 border-pink-500 rounded-full border-t-transparent"></div>
                                <span className="text-xs">Reasoning on paper...</span>
                            </>
                        ) : (
                            <>
                                <UploadIcon />
                                <span className="text-sm font-medium">Upload Paper (PDF)</span>
                                <span className="text-xs text-slate-500">Auto-detect mutation sites</span>
                            </>
                        )}
                    </div>
                </label>
            </div>
        </aside>
      </main>
    </div>
  );
}
