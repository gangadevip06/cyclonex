import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle, FileImage, Cpu } from 'lucide-react';
import apiService from '../services/api';

export default function SatelliteUploadModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.uploadSatellite(selectedFile);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to upload and analyze satellite frame.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-xl shadow-2xl max-w-lg w-full p-5 flex flex-col space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload Custom Satellite Image</h3>
              <p className="text-xs text-slate-400">CycloneCNN Feature Extraction & Pattern Analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Drop Area */}
        <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 text-center flex flex-col items-center justify-center bg-slate-950/50 transition">
          {previewUrl ? (
            <div className="space-y-2">
              <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg mx-auto border border-slate-800" />
              <p className="text-xs text-slate-400">{selectedFile?.name}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <FileImage className="h-10 w-10 text-slate-500 mx-auto" />
              <div className="text-xs text-slate-300">
                <label className="text-cyan-400 font-bold hover:underline cursor-pointer">
                  Browse file
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleFileChange} />
                </label>
                <span> or drag & drop satellite patch</span>
              </div>
              <p className="text-[10px] text-slate-500">Supports .JPG, .PNG (INSAT-3D, MODIS, VIIRS)</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-500/50 rounded-lg p-2.5 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Result Analysis */}
        {result && result.features && (
          <div className="bg-slate-950 p-3 rounded-lg border border-cyan-500/40 space-y-2 text-xs">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>CycloneCNN Extracted Features:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Dvorak T-Number:</span>
                <span className="font-mono font-bold text-white ml-1">T{result.features.dvorak_t_number?.toFixed(1) || '4.0'}</span>
              </div>
              <div>
                <span className="text-slate-400">Derived Wind:</span>
                <span className="font-mono font-bold text-sky-400 ml-1">{result.features.satellite_derived_wind_kt || 45} kt</span>
              </div>
              <div>
                <span className="text-slate-400">CDO Compactness:</span>
                <span className="font-mono font-bold text-amber-300 ml-1">{((result.features.cdo_compactness || 0.75) * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-slate-400">Spiral Curvature:</span>
                <span className="font-mono font-bold text-emerald-300 ml-1">{((result.features.spiral_organization || 0.8) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>{loading ? 'Analyzing...' : 'Run CNN Inference'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
