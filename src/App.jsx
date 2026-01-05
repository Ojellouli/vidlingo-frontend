import { useState } from 'react';
import './App.css';

const API_URL = 'http://159.65.164.52:8080';
function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [processingQueue, setProcessingQueue] = useState(false);

  const analyzeVideo = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setVideoInfo(null);

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setVideoInfo(data);
        setSelectedQuality(data.qualities[0] || '720p');
        setSelectedLanguage(Object.keys(data.languages)[0] || 'en');
        setError('');
      } else {
        setError(data.error || 'Failed to analyze video');
      }
    } catch (err) {
      setError('Failed to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToQueue = () => {
    if (!videoInfo) return;

    const queueItem = {
      id: Date.now(),
      url,
      title: videoInfo.title,
      quality: selectedQuality,
      language: selectedLanguage,
      thumbnail: videoInfo.thumbnail,
    };

    setQueue([...queue, queueItem]);
    setUrl('');
    setVideoInfo(null);
    setError('');
  };

  const removeFromQueue = (id) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const downloadVideo = async (item) => {
    setDownloading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: item.url,
          quality: item.quality,
          lang_code: item.language,
          title: item.title,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${item.title}_${item.language}_${item.quality}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Download failed');
        return false;
      }
    } catch (err) {
      setError('Download failed: ' + err.message);
      return false;
    } finally {
      setDownloading(false);
    }
  };

  const processQueue = async () => {
    if (queue.length === 0 || processingQueue) return;

    setProcessingQueue(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const success = await downloadVideo(item);
      
      if (success) {
        setQueue(prev => prev.filter(q => q.id !== item.id));
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setProcessingQueue(false);
  };

  return (
    <div className="app">
      <div className="main-container">
        <div className="left-panel">
          <header className="header">
            <div className="logo">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#8a2be2" />
                  </linearGradient>
                </defs>
                <circle cx="25" cy="25" r="22" fill="url(#logoGrad)" opacity="0.2"/>
                <path d="M20 15 L35 25 L20 35 Z" fill="url(#logoGrad)" />
              </svg>
              <div>
                <h1>Vidlingo</h1>
                <p className="tagline">Multi-language video downloader</p>
              </div>
            </div>
          </header>

          <div className="card">
            <div className="card-header">
              <h2>🔗 Video URL</h2>
            </div>
            <input
              type="text"
              className="input"
              placeholder="Paste YouTube URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeVideo()}
            />
            <button
              className="button button-primary"
              onClick={analyzeVideo}
              disabled={loading}
            >
              {loading ? '⏳ Analyzing...' : '🔍 Analyze Video'}
            </button>
          </div>

          {error && (
            <div className="error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {videoInfo && (
            <>
              <div className="card">
                <div className="card-header">
                  <h2>📹 Video Information</h2>
                </div>
                <div className="video-info">
                  {videoInfo.thumbnail && (
                    <img src={videoInfo.thumbnail} alt="Thumbnail" className="thumbnail" />
                  )}
                  <div className="info-details">
                    <p className="video-title">{videoInfo.title}</p>
                    <p className="duration">
                      ⏱️ Duration: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h2>⚙️ Download Options</h2>
                </div>
                
                <div className="options-grid">
                  <div className="option-group">
                    <label>📊 Video Quality</label>
                    <select
                      className="select"
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                    >
                      {videoInfo.qualities.map((quality) => (
                        <option key={quality} value={quality}>
                          {quality}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="option-group">
                    <label>🎵 Audio Language</label>
                    <select
                      className="select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      {Object.entries(videoInfo.languages).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  className="button button-add-queue"
                  onClick={addToQueue}
                >
                  ➕ Add to Queue
                </button>
              </div>
            </>
          )}
        </div>

        <div className="right-panel">
          <div className="queue-header">
            <h2>📋 Download Queue</h2>
            <span className="queue-count">{queue.length} item(s)</span>
          </div>

          <div className="queue-list">
            {queue.length === 0 ? (
              <div className="empty-queue">
                <p>Queue is empty</p>
                <p className="empty-subtitle">Add videos to start downloading</p>
              </div>
            ) : (
              queue.map((item) => (
                <div key={item.id} className="queue-item">
                  <img src={item.thumbnail} alt="" className="queue-thumb" />
                  <div className="queue-info">
                    <p className="queue-title">{item.title.substring(0, 40)}...</p>
                    <p className="queue-details">
                      {item.quality} • {item.language.toUpperCase()}
                    </p>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromQueue(item.id)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {queue.length > 0 && (
            <div className="queue-actions">
              <button
                className="button button-process"
                onClick={processQueue}
                disabled={processingQueue || downloading}
              >
                {processingQueue ? '⏬ Processing...' : '▶️ Start Queue'}
              </button>
              <button
                className="button button-clear"
                onClick={clearQueue}
                disabled={processingQueue}
              >
                🗑️ Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="footer">
        <p>Made with ❤️ by Vidlingo • Download YouTube videos with multiple audio tracks</p>
      </footer>
    </div>
  );
}

export default App;