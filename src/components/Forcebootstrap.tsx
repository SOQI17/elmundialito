import React, { useState } from 'react';
import { doc, setDoc, writeBatch, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_MATCHES, INITIAL_LEAGUES } from '../data';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

interface ForceBootstrapProps {
  onDone: () => void;
}

export default function ForceBootstrap({ onDone }: ForceBootstrapProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const handleForce = async () => {
    setStatus('running');
    setLog([]);
    setProgress(0);

    try {
      // PASO 1: Borrar partidos viejos dinámicamente
      addLog('🔍 Consultando partidos actuales en base de datos...');
      const matchesSnap = await getDocs(collection(db, 'matches'));
      addLog(`🗑️ Eliminando ${matchesSnap.size} partidos viejos...`);
      
      const docs = matchesSnap.docs;
      const batchSize = 20;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        docs.slice(i, i + batchSize).forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
      addLog(`✅ Datos viejos eliminados`);
      setProgress(15);

      // PASO 2: Escribir nuevos en batches de 20
      addLog(`📋 Escribiendo ${INITIAL_MATCHES.length} partidos...`);
      for (let i = 0; i < INITIAL_MATCHES.length; i += batchSize) {
        const batch = writeBatch(db);
        INITIAL_MATCHES.slice(i, i + batchSize).forEach(match => {
          batch.set(doc(db, 'matches', match.id), {
            id: match.id,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            dateTime: match.dateTime,
            phase: match.phase,
            status: match.status,
          });
        });
        await batch.commit();
        setProgress(15 + Math.round(((i + batchSize) / INITIAL_MATCHES.length) * 80));
      }
      addLog(`✅ ${INITIAL_MATCHES.length} partidos guardados`);
      setProgress(100);
      addLog('🎉 ¡Fixture oficial cargado correctamente!');
      setStatus('done');
    } catch (err: any) {
      addLog(`❌ Error: ${err?.message || String(err)}`);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Recargar Fixture Oficial</h2>
            <p className="text-xs text-slate-400">Elimina datos viejos y carga el Mundial 2026 real</p>
          </div>
        </div>

        {status === 'running' && (
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
            {log.map((line, i) => <p key={i} className="text-xs text-slate-300 font-mono">{line}</p>)}
          </div>
        )}

        <div className="flex gap-2">
          {status === 'idle' && (
            <button onClick={handleForce} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
              <Database className="w-4 h-4" /> Cargar fixture oficial
            </button>
          )}
          {status === 'running' && (
            <div className="flex-1 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Procesando... {progress}%
            </div>
          )}
          {status === 'done' && (
            <button onClick={onDone} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> ¡Listo! Cerrar y recargar
            </button>
          )}
          {status === 'error' && (
            <>
              <button onClick={handleForce} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> Reintentar
              </button>
              <button onClick={onDone} className="flex-1 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer">Cerrar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}