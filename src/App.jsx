import { useEffect, useMemo, useRef, useState } from 'react';

function GlassCard({ children, className='' }) {
  return (
    <div className={
      `rounded-2xl p-4 md:p-6 shadow-xl
       bg-white/8 dark:bg-white/6 backdrop-blur-xl
       ring-1 ring-white/10 ${className}`
    }>
      {children}
    </div>
  );
}

export default function App() {
  const audioRef = useRef(null);
  const [tracks, setTracks] = useState([]);          // [{name, path, url}]
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [rate, setRate] = useState(1.0);
  const [pos, setPos] = useState(0);

  // восстановление состояния
  useEffect(() => {
    const saved = localStorage.getItem('ab_state');
    if (saved) {
      const s = JSON.parse(saved);
      setTracks(s.tracks ?? []);
      setCurrent(s.current ?? 0);
      setCoverUrl(s.coverUrl ?? '');
      setRate(s.rate ?? 1.0);
      setPos(s.pos ?? 0);
    }
  }, []);

  // сохранение состояния
  useEffect(() => {
    localStorage.setItem('ab_state', JSON.stringify({ tracks, current, coverUrl, rate, pos }));
  }, [tracks, current, coverUrl, rate, pos]);

  const currentTrack = tracks[current];

  const pickFiles = async () => {
    const files = await window.electron.openFiles();
    if (!files || !files.length) return;
    const next = files.map(p => ({ name: p.split(/[\\/]/).pop(), path: p, url: window.electron.toFileUrl(p) }));
    setTracks(next);
    setCurrent(0);
    setPlaying(true);
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); }
  };

  const onEnded = () => {
    if (current + 1 < tracks.length) setCurrent(current + 1);
    else setPlaying(false);
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !currentTrack) return;
    a.playbackRate = rate;
    a.currentTime = pos || 0;
    if (playing) a.play().catch(()=>{});
  }, [currentTrack]);

  // запоминать позицию
  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setPos(a.currentTime);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[380px_1fr] gap-6">
        {/* Левая колонка: обложка + управление */}
        <GlassCard className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 rounded-3xl overflow-hidden ring-1 ring-white/15 bg-white/5">
            {coverUrl
              ? <img alt="Обложка" src={coverUrl} className="w-full h-full object-cover" />
              : <div className="w-full h-full grid place-content-center text-slate-300">
                  Обложка не задана
                </div>}
          </div>

          <div className="w-full">
            <label className="text-sm text-slate-300">Ссылка на обложку</label>
            <input
              className="mt-1 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-400/50"
              placeholder="https://..."
              value={coverUrl}
              onChange={e => setCoverUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full">
            <button onClick={pickFiles}
              className="flex-1 rounded-xl px-4 py-2 bg-indigo-500/80 hover:bg-indigo-500 transition font-medium">
              Открыть файлы
            </button>
            <button onClick={toggle}
              className="rounded-xl px-4 py-2 bg-slate-800/70 hover:bg-slate-700 transition">
              {playing ? 'Пауза' : 'Играть'}
            </button>
          </div>

          <div className="w-full">
            <label className="text-sm text-slate-300">Скорость: {rate.toFixed(2)}×</label>
            <input type="range" min="0.5" max="3" step="0.1" value={rate}
              onChange={e => {
                const v = parseFloat(e.target.value);
                setRate(v);
                if (audioRef.current) audioRef.current.playbackRate = v;
              }}
              className="w-full accent-indigo-400" />
          </div>
        </GlassCard>

        {/* Правая колонка: плеер + плейлист */}
        <div className="grid gap-6">
          <GlassCard>
            <div className="text-lg font-semibold mb-2">Сейчас играет</div>
            <div className="text-slate-300 mb-3">{currentTrack ? currentTrack.name : '—'}</div>

            <audio
              ref={audioRef}
              src={currentTrack?.url}
              onEnded={onEnded}
              onTimeUpdate={onTimeUpdate}
              controls
              className="w-full rounded-xl bg-black/20"
            />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Плейлист</div>
              <div className="text-sm text-slate-300">{tracks.length} файлов</div>
            </div>

            <ul className="divide-y divide-white/10">
              {tracks.map((t, i) => (
                <li key={t.path}
                    className={`py-2 px-2 rounded-lg hover:bg-white/5 cursor-pointer ${i===current?'bg-indigo-500/10':''}`}
                    onClick={() => { setCurrent(i); setPlaying(true); }}>
                  <div className="truncate">{t.name}</div>
                  <div className="text-xs text-slate-400 truncate">{t.path}</div>
                </li>
              ))}
              {tracks.length === 0 && (
                <li className="py-4 text-slate-400">Сначала нажмите «Открыть файлы».</li>
              )}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
