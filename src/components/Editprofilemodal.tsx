import React, { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { UserProfile } from "../types";
import { X, Check, Loader2, Pencil } from "lucide-react";

const AVATARS = ["🦁", "🦊", "🐻", "🐼", "🐨", "🐱", "🐶", "🐯", "⚽", "🏆", "🌟", "🔥", "🎯", "⚡", "🦅", "🐉"];

interface EditProfileModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}

export default function EditProfileModal({ currentUser, onClose, onSaved }: EditProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar || "⚽");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("El nombre no puede estar vacío."); return; }
    setLoading(true);
    setError("");
    try {
      // Update Firestore profile
      await setDoc(doc(db, "users", currentUser.id), {
        name: name.trim(),
        avatar: avatar,
      }, { merge: true });

      // Update Firebase Auth displayName too
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }

      setSaved(true);
      setTimeout(() => {
        onSaved({ ...currentUser, name: name.trim(), avatar });
        onClose();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setError("No se pudo guardar. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <Pencil className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Editar Perfil</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-5">
          
          {/* Avatar preview grande */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-indigo-600/10 border-2 border-indigo-500/30 rounded-2xl flex items-center justify-center text-5xl shadow-inner select-none">
              {avatar}
            </div>
          </div>

          {/* Avatar grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Elige tu Avatar
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`aspect-square flex items-center justify-center text-xl rounded-lg border transition-all cursor-pointer ${
                    avatar === emoji
                      ? "border-indigo-500 bg-indigo-600/20 scale-110 shadow-md"
                      : "border-transparent hover:bg-slate-700 hover:scale-105"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tu Nombre / Apodo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="Ej: Alexis Guerra"
              className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none transition-all font-medium placeholder-slate-500"
            />
            <div className="flex justify-end">
              <span className="text-[10px] text-slate-600">{name.length}/30</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || saved}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <><Check className="w-4 h-4" /> ¡Guardado!</>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}