import React, { useState, useRef, useEffect } from 'react';
import shaka from 'shaka-player/dist/shaka-player.compiled';

// Function to extract Google Drive file ID from URL
function extractDriveId(url) {
  if (!url) return '';
  
  // Remove whitespace
  url = url.trim();
  
  // Pattern 1: /file/d/{id}/view or /file/d/{id}
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  
  // Pattern 2: ?id={id}
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  
  // Pattern 3: /open?id={id}
  const match3 = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];
  
  // If no pattern matches, assume it's already an ID
  return url;
}

export default function App() {
  const [fileId, setFileId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    shaka.polyfill.installAll();
    if (!shaka.Player.isBrowserSupported()) {
      console.error('Shaka not supported');
      return;
    }
    const player = new shaka.Player(videoRef.current);
    playerRef.current = player;
    player.addEventListener('error', (e) => {
      console.error('Shaka error:', e);
      const error = e.detail;
      if (error) {
        console.error('Error code:', error.code);
        console.error('Error category:', error.category);
        console.error('Error severity:', error.severity);
        console.error('Error message:', error.message);
      }
    });

    return () => {
      player.destroy();
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    // Auto-extract ID from URL
    const extractedId = extractDriveId(value);
    setFileId(extractedId);
  };

  const loadFile = async () => {
    if (!fileId) return alert('Enter Google Drive file ID or URL');
    
    // Use relative URL - Vercel will handle routing
    const url = `/api/stream?id=${encodeURIComponent(fileId)}`;
    setStreamUrl(url);
    setStatus('loading');
    
    // First, test if the API endpoint is accessible
    try {
      console.log('Testing API endpoint:', url);
      const testRes = await fetch(url, { method: 'HEAD' });
      console.log('API test response:', {
        status: testRes.status,
        statusText: testRes.statusText,
        headers: Object.fromEntries(testRes.headers.entries())
      });
      
      if (!testRes.ok) {
        let errorText = '';
        try {
          errorText = await testRes.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        let errorMsg = `API Error (${testRes.status}): `;
        try {
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            errorMsg += errorJson.error || errorJson.details || errorText;
          } else {
            errorMsg += testRes.statusText || 'Unknown error';
          }
        } catch {
          errorMsg += errorText || testRes.statusText || 'Unknown error';
        }
        
        setStatus('error');
        alert(errorMsg);
        console.error('API test failed:', {
          status: testRes.status,
          statusText: testRes.statusText,
          errorText: errorText,
          url: url
        });
        return;
      }
    } catch (fetchError) {
      setStatus('error');
      const errorMsg = `Failed to connect to API: ${fetchError.message}\n\nURL: ${url}\n\nThis might mean:\n1. The API route is not deployed\n2. There's a CORS issue\n3. The route path is incorrect`;
      alert(errorMsg);
      console.error('API connection failed:', {
        error: fetchError,
        url: url,
        message: fetchError.message
      });
      return;
    }

    // If API is accessible, try loading with Shaka
    try {
      await playerRef.current.load(url);
      setStatus('loaded');
      // Auto play if allowed
      try { await videoRef.current.play(); } catch(e) {
        console.log('Autoplay prevented:', e);
      }
    } catch (e) {
      console.error('Shaka load failed', e);
      setStatus('error');
      const errorMsg = e.detail?.message || e.message || 'Unknown error';
      alert(`Failed to load video: ${errorMsg}\n\nMake sure:\n1. The file is shared publicly (Anyone with the link)\n2. The file is a valid video format`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-2">Stream4You</h1>
        <p className="text-sm text-gray-300 mb-4">Paste your Google Drive file ID or full URL (set file to "Anyone with the link")</p>

        <div className="mb-4 flex gap-2">
          <input 
            value={inputValue} 
            onChange={handleInputChange} 
            placeholder="Paste Google Drive URL or file ID" 
            className="flex-1 p-3 rounded bg-black/30" 
          />
          <button onClick={loadFile} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition">Load</button>
        </div>
        
        {fileId && fileId !== inputValue && (
          <div className="mb-2 text-xs text-gray-400">
            Extracted ID: <span className="text-gray-300 font-mono">{fileId}</span>
          </div>
        )}

        <div className="bg-black rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-96 bg-black" controls playsInline></video>
        </div>

        <div className="mt-4 text-sm text-gray-300">
          <p>Status: <strong className="text-white">{status}</strong></p>
          <p>Stream URL: <span className="break-all">{streamUrl || '—'}</span></p>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>How to get file id: a share URL like <em>https://drive.google.com/file/d/<strong>FILE_ID</strong>/view</em></p>
        </div>
      </div>
    </div>
  );
}
