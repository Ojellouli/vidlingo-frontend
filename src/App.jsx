import React, { useState } from 'react';
import { Download, Video, Music, Trash2, Play, CheckCircle } from 'lucide-react';

const API_URL = 'https://api.vidlingo.site';

function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [qualityFormats, setQualityFormats] = useState({});
  const [audioFormats, setAudioFormats] = useState({});
  const [selectedQuality, setSelectedQuality] = useState('Analyze video first');
  const [selectedAudio, setSelectedAudio] = useState('Analyze video first');
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [statusDetail, setStatusDetail] = useState('Enter a YouTube URL to begin');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    setStatus('Analyzing...');
    setStatusDetail('Please wait...');

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyzed(true);
        const quals = Object.keys(result.data.video_formats);
        const langs = Object.keys(result.data.audio_formats);
        setQualities(quals);
        setLanguages(langs);
        setQualityFormats(result.data.video_formats);
        setAudioFormats(result.data.audio_formats);
        setSelectedQuality(quals[0]);
        setSelectedAudio(langs[0]);
        setStatus('Ready');
        setStatusDetail(`Found ${quals.length} quality options`);
      } else {
        setStatus('Error');
        setStatusDetail('Failed to analyze: ' + result.error);
      }
    } catch (error) {
      setStatus('Error');
      setStatusDetail('Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddToQueue = () => {
    if (!analyzed) {
      alert('Please analyze a video first');
      return;
    }

    const newItem = {
      id: Date.now(),
      url,
      quality: selectedQuality,
      language: selectedAudio,
      videoFormatId: qualityFormats[selectedQuality],
      audioFormatId: audioFormats[selectedAudio],
      status: 'Queued',
      title: url
    };

    setDownloadQueue([...downloadQueue, newItem]);
    setUrl('');
    setAnalyzed(false);
    setSelectedQuality('Analyze video first');
    setSelectedAudio('Analyze video first');
  };

  const handleStartQueue = async () => {
    if (downloadQueue.length === 0) {
      alert('Queue is empty!');
      return;
    }

    setIsDownloading(true);
    
    for (let i = 0; i < downloadQueue.length; i++) {
      const item = downloadQueue[i];
      
      setDownloadQueue(prev => prev.map((q, idx) => 
        idx === i ? { ...q, status: 'Downloading...' } : q
      ));
      
      setStatus('Downloading...');
      setStatusDetail(`Processing ${i + 1} of ${downloadQueue.length}`);

      try {
        const response = await fetch(`${API_URL}/api/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            video_format_id: item.videoFormatId,
            audio_format_id: item.audioFormatId
          })
        });

        const result = await response.json();

        if (result.success) {
          setDownloadQueue(prev => prev.map((q, idx) => 
            idx === i ? { ...q, status: 'Completed', downloadUrl: result.download_url } : q
          ));
          
          window.open(result.download_url, '_blank');
        } else {
          setDownloadQueue(prev => prev.map((q, idx) => 
            idx === i ? { ...q, status: 'Failed' } : q
          ));
        }
      } catch (error) {
        setDownloadQueue(prev => prev.map((q, idx) => 
          idx === i ? { ...q, status: 'Failed' } : q
        ));
      }
    }

    setStatus('Completed');
    setStatusDetail('All downloads processed!');
    setIsDownloading(false);
  };

  const handleClearQueue = () => {
    setDownloadQueue([]);
  };

  const handleClear = () => {
    setUrl('');
  };

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText();
    setUrl(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white">
      <div className="flex h-screen">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-10 h-10 text-cyan-400" />
              <h1 className="text-4xl font-bold text-cyan-400">Vidlingo</h1>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video URL
              </h2>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white placeholder-gray-400 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handlePaste}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Paste
                </button>
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : '🔍 Analyze Video'}
                </button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Quality
              </h2>
              <label className="block text-sm text-gray-400 mb-2">Select video quality:</label>
              <select
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                disabled={!analyzed}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white disabled:opacity-50"
              >
                <option>{selectedQuality}</option>
                {analyzed && qualities.filter(q => q !== selectedQuality).map((quality) => (
                  <option key={quality} value={quality}>{quality}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5" />
                Audio Language
              </h2>
              <label className="block text-sm text-gray-400 mb-2">Select audio language:</label>
              <select
                value={selectedAudio}
                onChange={(e) => setSelectedAudio(e.target.value)}
                disabled={!analyzed}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:border-cyan-400 focus:outline-none text-white disabled:opacity-50"
              >
                <option>{selectedAudio}</option>
                {analyzed && languages.filter(l => l !== selectedAudio).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download
              </h2>
              <button
                onClick={handleAddToQueue}
                disabled={!analyzed}
                className="w-full px-6 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                + Add to Queue
              </button>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">📊 Progress</h2>
              <p className="text-lg font-semibold">{status}</p>
              <p className="text-sm text-gray-400">{statusDetail}</p>
            </div>
          </div>
        </div>

        <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📋 Download Queue
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {downloadQueue.length === 0 ? 'Queue is empty' : `${downloadQueue.length} item(s)`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {downloadQueue.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <Download className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No downloads in queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {downloadQueue.map((item) => (
                  <div key={item.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm font-semibold truncate mb-2">{item.url}</p>
                    <p className="text-xs text-gray-400">Quality: {item.quality}</p>
                    <p className="text-xs text-gray-400">Language: {item.language}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {item.status === 'Completed' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      <p className={`text-xs ${item.status === 'Completed' ? 'text-green-400' : item.status === 'Failed' ? 'text-red-400' : 'text-cyan-400'}`}>
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-700 space-y-2">
            <button 
              onClick={handleStartQueue}
              disabled={downloadQueue.length === 0 || isDownloading}
              className="w-full px-4 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {isDownloading ? 'Processing...' : 'Start Queue'}
            </button>
            <button
              onClick={handleClearQueue}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;