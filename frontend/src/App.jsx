import React, { useState, useRef, useEffect } from 'react';
import shaka from 'shaka-player/dist/shaka-player.compiled';

export default function App() {
  const [fileId, setFileId] = useState('');
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
    player.addEventListener('error', (e) => console.error('Shaka error', e));

    return () => {
      player.destroy();
    };
  }, []);

  const loadFile = async () => {
    if (!fileId) return alert('Enter file id');
    const url = `/api/stream?id=${encodeURIComponent(fileId)}`;
    setStreamUrl(url);
    setStatus('loading');
    try {
      await playerRef.current.load(url);
      setStatus('loaded');
      // Auto play if allowed
      try { await videoRef.current.play(); } catch(e) {}
    } catch (e) {
      console.error('Load failed', e);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl mb-2">Stream4You</h1>
        <p className="text-sm text-gray-300 mb-4">Paste your Google Drive file ID (set file to "Anyone with the link")</p>

        <div className="mb-4 flex gap-2">
          <input value={fileId} onChange={(e)=>setFileId(e.target.value)} placeholder="Google Drive file id" className="flex-1 p-3 rounded bg-black/30" />
          <button onClick={loadFile} className="px-4 py-2 bg-red-600 rounded">Load</button>
        </div>

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
