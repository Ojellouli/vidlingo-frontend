import React, { useState } from 'react';
import { Download, Video, Music, FileText, CheckCircle, Loader } from 'lucide-react';

// Remplacez par votre IP DigitalOcean ou domaine
const API_URL = 'http://159.65.164.52';

function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [videoInfo, setVideoInfo] = useState({ title: '', duration: '' });
  const [qualities, setQualities] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedAudio, setSelectedAudio] = useState('');
  const [includeSubtitles, setIncludeSubtitles] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [detailsMessage, setDetailsMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    if (!url) {
      alert('Please enter a YouTube URL');
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage('Analyzing video...');
    setDetailsMessage('Please wait...');
    setProgress(30);

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyzed(true);
        setVideoInfo({
          title: result.data.title,
          duration: result.data.duration
        });
        setQualities(Object.keys(result.data.video_formats));
        setLanguages(Object.keys(result.data.audio_formats));
        setSelectedQuality(Object.keys(result.data.video_formats)[0]);
        setSelectedAudio(Object.keys(result.data.audio_formats)[0]);
        setStatusMessage(`✓ Found ${Object.keys(result.data.video_formats).length} quality options`);
        setDetailsMessage(`Title: ${result.data.title}`);
        setProgress(100);
      } else {
        alert('Failed to analyze: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    setStatusMessage('Starting download...');
    setDetailsMessage('Preparing your file...');
    setProgress(0);

    try {
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          video_quality: selectedQuality,
          audio_language: selectedAudio,
          include_subtitles: includeSubtitles
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatusMessage('✓ Download ready!');
        setDetailsMessage('Opening download link...');
        setProgress(100);
        window.open(result.download_url, '_blank');
      } else {
        alert('Download failed: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-12 h-12 text-white" />
            <h1 className="text-5xl font-bold text-white">Vidlingo</h1>
          </div>
          <p className="text-xl text-white/90">Download YouTube videos with custom quality and language</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* URL Input */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">YouTube URL</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={isAnalyzing}
              />
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {isAnalyzing ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div class