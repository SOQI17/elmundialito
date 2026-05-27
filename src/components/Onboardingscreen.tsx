import React, { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile, League } from "../types";
import { Users, Plus, ArrowRight, Check, Loader2, Hash, Sparkles, Globe } from "lucide-react";

interface OnboardingScreenProps {
  currentUser: UserProfile;
  onComplete: (league: League | null) => void;
}

type Step = "welcome" | "choice" | "create" | "join" | "done";

export default function OnboardingScreen({ currentUser, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [leagueName, setLeagueName] = useState("");
  const [leagueCode, setLeagueCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);
  const [finalCode, setFinalCode] = useState("");

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim()) { setError("Ingresa un nombre para la liga."); return; }
    setLoading(true);
    setError("");
    const code = generateCode();
    try {
      await setDoc(doc(db, "leagues", code), { code, name: leagueName.trim(), creatorId: currentUser.id });
      await setDoc(doc(db, "leagues", code, "members", currentUser.id), {
        userId: currentUser.id, leagueCode: code, joinedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "users", currentUser.id), { onboarded: true }, { merge: true });
      const league: League = { code, name: leagueName.trim(), creatorId: currentUser.id, members: [currentUser.id] };
      setCreatedLeague(league);
      setFinalCode(code);
      setStep("done");
    } catch (err: any) {
      setError("No se pudo crear la liga. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = leagueCode.trim().toUpperCase();
    if (!codeUpper) { setError("Ingresa el código de la liga."); return; }
    setLoading(true);
    setError("");
    try {
      const snap = await getDoc(doc(db, "leagues", codeUpper));
      if (!snap.exists()) { setError("Código incorrecto. Verifica con el admin del grupo."); setLoading(false); return; }
      await setDoc(doc(db, "leagues", codeUpper, "members", currentUser.id), {
        userId: currentUser.id, leagueCode: codeUpper, joinedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, "users", currentUser.id), { onboarded: true }, { merge: true });
      const data = snap.data();
      const league: League = { code: codeUpper, name: data.name, creatorId: data.creatorId, members: [] };
      setCreatedLeague(league);
      setStep("done");
    } catch (err: any) {
      setError("Error al unirse. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try { await setDoc(doc(db, "users", currentUser.id), { onboarded: true }, { merge: true }); } catch (_) {}
    onComplete(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[16rem] opacity-[0.025]">⚽</div>
      </div>

      {/* Paso indicador */}
      <div className="relative flex items-center gap-2 mb-8">
        {["welcome", "choice", "done"].map((s, i) => {
          const currentIdx = ["create", "join"].includes(step) ? 1 : ["welcome", "choice", "done"].indexOf(step);
          return (
            <React.Fragment key={s}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < currentIdx ? "bg-indigo-500" : i === currentIdx ? "bg-white scale-125" : "bg-slate-700"
              }`} />
              {i < 2 && <div className={`w-8 h-0.5 transition-all duration-300 ${i < currentIdx ? "bg-indigo-500" : "bg-slate-700"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="relative w-full max-w-md">

        {/* STEP: WELCOME */}
        {step === "welcome" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <div className="space-y-3">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-violet-600 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl border border-indigo-400/30">
                ⚽
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">¡Bienvenido, {currentUser.name}!</h1>
                <p className="text-slate-400 text-sm mt-1">Estás a un paso de competir con tus amigos</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: "🎯", label: "Predice", sub: "cada partido" }, { icon: "🏆", label: "Compite", sub: "en tu liga" }, { icon: "⭐", label: "Gana", sub: "puntos y ranking" }].map(({ icon, label, sub }) => (
                <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs font-bold text-white">{label}</div>
                  <div className="text-[10px] text-slate-500">{sub}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep("choice")}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 group"
            >
              Comenzar <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* STEP: CHOICE */}
        {step === "choice" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white">¿Cómo quieres jugar?</h2>
              <p className="text-slate-400 text-xs">Elige una opción para competir con tu grupo</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => { setStep("create"); setError(""); }} className="w-full p-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl transition-all cursor-pointer group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center shrink-0"><Plus className="w-5 h-5 text-indigo-400" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Crear mi liga</div>
                    <div className="text-xs text-slate-400 mt-0.5">Obtén un código y invita a tus amigos</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
              </button>
              <button onClick={() => { setStep("join"); setError(""); }} className="w-full p-4 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 hover:border-violet-500/60 rounded-xl transition-all cursor-pointer group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center shrink-0"><Hash className="w-5 h-5 text-violet-400" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">Unirme con código</div>
                    <div className="text-xs text-slate-400 mt-0.5">Tengo el código de mi grupo</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </button>
              <button onClick={handleSkip} className="w-full p-4 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-xl transition-all cursor-pointer group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0"><Globe className="w-5 h-5 text-slate-400" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-300">Solo clasificación global</div>
                    <div className="text-xs text-slate-500 mt-0.5">Jugar sin liga privada por ahora</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-700" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP: CREATE */}
        {step === "create" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setStep("choice"); setError(""); }} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0">←</button>
              <div>
                <h2 className="text-lg font-black text-white">Crear nueva liga</h2>
                <p className="text-xs text-slate-400">Se generará un código único para invitar a tus amigos</p>
              </div>
            </div>
            <form onSubmit={handleCreateLeague} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre de tu liga o grupo</label>
                <input
                  type="text" value={leagueName} onChange={(e) => setLeagueName(e.target.value)}
                  placeholder='Ej: "Grupo de la Oficina"' maxLength={40}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all placeholder-slate-500"
                />
              </div>
              <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <p className="text-xs text-slate-300">Se generará un <strong className="text-indigo-300">código único</strong> al crear la liga. Compártelo con tu grupo.</p>
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-400 text-xs rounded-xl text-center">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {loading ? "Creando liga..." : "Crear mi liga"}
              </button>
            </form>
          </div>
        )}

        {/* STEP: JOIN */}
        {step === "join" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => { setStep("choice"); setError(""); }} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shrink-0">←</button>
              <div>
                <h2 className="text-lg font-black text-white">Unirme a una liga</h2>
                <p className="text-xs text-slate-400">Pídele el código al administrador de tu grupo</p>
              </div>
            </div>
            <form onSubmit={handleJoinLeague} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código de la Liga</label>
                <input
                  type="text" value={leagueCode} onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
                  placeholder="Ej: ABCD12" maxLength={8}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 rounded-xl py-3 px-4 text-lg text-white focus:outline-none transition-all font-mono tracking-widest text-center uppercase placeholder-slate-500"
                />
              </div>
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-400 text-xs rounded-xl text-center">{error}</div>}
              <button type="submit" disabled={loading} className="w-full py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                {loading ? "Uniéndome..." : "Unirme al grupo"}
              </button>
            </form>
          </div>
        )}

        {/* STEP: DONE */}
        {step === "done" && createdLeague && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 text-center space-y-6">
            <div className="space-y-3">
              <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl mx-auto flex items-center justify-center">
                <Check className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {createdLeague.creatorId === currentUser.id ? "¡Liga creada!" : "¡Te uniste!"}
                </h2>
                <p className="text-slate-400 text-sm mt-1">{createdLeague.name}</p>
              </div>
            </div>
            {createdLeague.creatorId === currentUser.id && finalCode && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código para invitar amigos</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-white font-mono tracking-widest">{finalCode}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(finalCode)}
                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
                <p className="text-xs text-slate-500">Comparte este código con tus amigos para que se unan</p>
              </div>
            )}
            <button
              onClick={() => onComplete(createdLeague)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-lg"
            >
              Ir a los pronósticos <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}