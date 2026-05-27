import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Trophy, Mail, Lock, User, Sparkles, LogIn, UserPlus } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AVATARS = ["🦁", "🦊", "🐻", "🐼", "🐨", "🐱", "🐶", "🐯", "⚽", "🏆", "🌟", "🔥"];

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setError("El ingreso con Correo/Contraseña no está habilitado en Firebase. Por favor, ve a la consola de Firebase > Authentication > Sign-in method y habilita 'Correo electrónico/contraseña'.");
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos. Verifica tus datos.");
      } else if (err.code === "auth/invalid-email") {
        setError("El formato de correo ingresado es inválido.");
      } else {
        setError(err.message || "Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Por favor ingresa un nombre.");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user profile public data
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: name.trim(),
        avatar: avatar,
        isAdmin: false
      });

      // Save private data split collection
      await setDoc(doc(db, "users", user.uid, "private", "info"), {
        email: email,
        joinedAt: new Date().toISOString()
      });

      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed") {
        setError("El registro de usuarios con Correo/Contraseña no está habilitado. Por favor, ve a Firebase Console > Authentication > Sign-in method y habilita la opción de 'Correo electrónico/contraseña'.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está registrado. Por favor, cambia a la pestaña de 'Ingresar' arriba para iniciar sesión.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña proporcionada es muy débil (debe tener un mínimo de 6 caracteres).");
      } else {
        setError(err.message || "Error al registrar cuenta.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile already exists, if not write it
      // Note: We can try writing it or checking, we will simply set it with default values on creation
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: user.displayName || "Invitado",
        avatar: "⚽",
        isAdmin: false
      }, { merge: true });

      await setDoc(doc(db, "users", user.uid, "private", "info"), {
        email: user.email || "",
        joinedAt: new Date().toISOString()
      }, { merge: true });

      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Error al ingresar con Google. Puedes intentar registro con correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-505 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-500"></div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* App Greeting Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg border border-indigo-400">
            ⚽
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5 uppercase">
              MUNDIALITO 
              <span className="text-xs bg-indigo-500 font-bold px-1.5 py-0.5 rounded tracking-widest text-indigo-100 font-mono">2026</span>
            </h1>
            <p className="text-xs text-slate-400">Predice y apuesta con tus amigos en el próximo Mundial USA-México-Canadá</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("login");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" />
            Ingresar
          </button>
          <button
            onClick={() => {
              setActiveTab("register");
              setError("");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "register" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Crear Perfil
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-505/30 border-red-500/20 text-rose-400 text-xs font-medium rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form Container */}
        {activeTab === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-white focus:outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-white focus:outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] shadow-lg cursor-pointer"
            >
              {loading ? "Cargando..." : "Ingresar"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre Completo / Apodo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ej: Alexis Guerra"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-white focus:outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Avatar picker scroll */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escoge tu Avatar ({avatar})</label>
              <div className="flex gap-2 p-2 bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto select-none no-scrollbar">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-xl p-2 rounded-lg border shrink-0 transition-all ${
                      avatar === emoji ? "border-indigo-500 bg-slate-800 scale-110 shadow" : "border-transparent hover:bg-slate-800"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-white focus:outline-none transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-405 text-slate-400 uppercase tracking-wider block">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Mínimo 6 carácteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-10 text-xs text-white focus:outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] shadow-lg cursor-pointer"
            >
              {loading ? "Creando perfil..." : "Crear Perfil Mundial"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">O CONTINÚA CON</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22s.81-.63.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Login
        </button>

      </div>
    </div>
  );
}
