import React, { useState, useRef, useEffect } from 'react';

const App = () => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const audioRef = useRef(null);

  const handleFileInput = async () => {
    try {
      const files = await window.electron?.openFiles?.();
      if (files && files.length > 0) {
        const newTracks = files.map(file => ({
          id: Date.now() + Math.random(),
          title: file.name,
          src: file.path.startsWith('file://') ? file.path : `file://${file.path}`,
          cover: null,
        }));
        setPlaylist(prev => [...prev, ...newTracks]);
        if (currentTrackIndex === null) setCurrentTrackIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddURL = () => {
    const src = prompt('Enter audio URL:');
    if (!src) return;
    const cover = prompt('Enter cover URL (optional):');
    const title = src.split('/').pop();
    setPlaylist(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        title,
        src,
        cover: cover || null,
      },
    ]);
    if (currentTrackIndex === null) setCurrentTrackIndex(0);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    audio.volume = volume;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex, speed, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      setProgress(audio.currentTime / audio.duration || 0);
    };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('ended', () => {
      setCurrentTrackIndex(i => {
        if (playlist.length === 0) return null;
        const next = (i ?? -1) + 1;
        return next < playlist.length ? next : 0;
      });
    });
    return () => {
      audio.removeEventListener('timeupdate', update);
    };
  }, [playlist]);

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = newTime;
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const nextTrack = () => {
    setCurrentTrackIndex(i => {
      if (playlist.length === 0) return null;
      const next = (i ?? -1) + 1;
      return next < playlist.length ? next : 0;
    });
  };

  const prevTrack = () => {
    setCurrentTrackIndex(i => {
      if (playlist.length === 0) return null;
      const prev = (i ?? playlist.length) - 1;
      return prev >= 0 ? prev : playlist.length - 1;
    });
  };

  const currentTrack = currentTrackIndex !== null ? playlist[currentTrackIndex] : null;

  return (
    <div className="min-h-screen p-4 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold mb-4">Audiobooks Glass</h1>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-2/3 p-4 bg-white/30 dark:bg-gray-700/50 backdrop-blur-md rounded-xl shadow-lg">
          {currentTrack ? (
            <div>
              {currentTrack.cover ? (
                <img src={currentTrack.cover} alt="cover" className="w-full h-48 object-cover rounded-lg mb-4" />
              ) : (
                <div className="w-full h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                  <span>No Cover</span>
                </div>
              )}
              <h2 className="text-xl font-semibold mb-2">{currentTrack.title}</h2>
              <audio ref={audioRef} src={currentTrack.src} onLoadedMetadata={() => setProgress(0)} />
              <div className="flex items-center gap-4 mb-2">
                <button onClick={prevTrack} className="px-3 py-2 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">Prev</button>
                <button onClick={togglePlay} className="px-4 py-2 bg-blue-500 text-white rounded-lg">{isPlaying ? 'Pause' : 'Play'}</button>
                <button onClick={nextTrack} className="px-3 py-2 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg">Next</button>
              </div>
              <input type="range" min="0" max="100" value={(progress * 100) || 0} onChange={handleSeek} className="w-full mb-2" />
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-1">
                  Speed:
                  <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
                </label>
                <label className="flex items-center gap-1">
                  Volume:
                  <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
                </label>
              </div>
            </div>
          ) : (
            <p>No track selected</p>
          )}
        </div>
        <div className="w-full lg:w-1/3 p-4 bg-white/30 dark:bg-gray-700/50 backdrop-blur-md rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Playlist</h3>
          <ul className="space-y-2 overflow-y-auto max-h-96">
            {playlist.map((track, index) => (
              <li
                key={track.id}
                onClick={() => setCurrentTrackIndex(index)}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${
                  index === currentTrackIndex ? 'bg-blue-500/20' : 'hover:bg-gray-200/20'
                }`}
              >
                {track.cover ? (
                  <img src={track.cover} alt="cover-thumb" className="w-12 h-12 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center">🎧</div>
                )}
                <span className="flex-1 truncate">{track.title}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <button onClick={handleFileInput} className="px-4 py-2 bg-green-500 text-white rounded-lg">Add Files</button>
            <button onClick={handleAddURL} className="px-4 py-2 bg-indigo-500 text-white rounded-lg">Add URL</button>
            {currentTrack && (
              <button
                onClick={() => {
                  const newCover = prompt('Enter new cover URL:');
                  if (!newCover) return;
                  setPlaylist(prev =>
                    prev.map((t, i) => (i === currentTrackIndex ? { ...t, cover: newCover } : t))
                  );
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
              >
                Set Cover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
