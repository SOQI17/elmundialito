import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { Mail, Lock, User, LogIn, UserPlus, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AVATARS = ["🦁", "🦊", "🐻", "🐼", "🐨", "🐱", "🐶", "🐯", "⚽", "🏆", "🌟", "🔥"];

const friendlyError = (code: string): string => {
  const map: Record<string, string> = {
    "auth/operation-not-allowed":
      "El ingreso con Correo/Contraseña no está habilitado. Ve a Firebase Console > Authentication > Sign-in method y actívalo.",
    "auth/user-not-found":
      "No existe una cuenta con ese correo. ¿Quieres registrarte?",
    "auth/wrong-password":
      "Contraseña incorrecta. Verifica tus datos o usa '¿Olvidaste tu contraseña?'.",
    "auth/invalid-credential":
      "Correo o contraseña incorrectos. Verifica tus datos.",
    "auth/invalid-email":
      "El formato de correo ingresado no es válido.",
    "auth/email-already-in-use":
      "Este correo ya está registrado. Cambia a 'Ingresar' para iniciar sesión.",
    "auth/weak-password":
      "La contraseña es muy débil. Usa al menos 6 caracteres.",
    "auth/too-many-requests":
      "Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.",
    "auth/network-request-failed":
      "Sin conexión a internet. Verifica tu red.",
    "auth/popup-closed-by-user":
      "Cerraste la ventana de Google antes de completar el ingreso.",
    "auth/cancelled-popup-request":
      "Se canceló el inicio de sesión con Google. Por favor, intenta de nuevo.",
    "auth/popup-blocked":
      "Tu navegador bloqueó la ventana emergente de Google. Estamos intentando redirigirte automáticamente para completar el ingreso, o por favor permite las ventanas emergentes.",
    "auth/unauthorized-domain":
      "Este dominio (o dirección IP local) no está autorizado para usar Google Auth en Firebase. Agrégalo en Firebase Console > Authentication > Settings > Authorized domains.",
    "auth/account-exists-with-different-credential":
      "Ya existe una cuenta con este mismo correo usando otro método (ej: Contraseña). Por favor, ingresa con tu contraseña.",
    "auth/internal-error":
      "Error interno de comunicación con los servidores de Google. Por favor, intenta de nuevo.",
  };
  return map[code] || `Error inesperado (${code}). Intenta de nuevo.`;
};

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(""); setSuccessMsg(""); };

  const switchTab = (tab: "login" | "register" | "forgot") => {
    setActiveTab(tab);
    clearMessages();
  };

  // ── Sign In ──────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(friendlyError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!name.trim()) { setError("Por favor ingresa un nombre."); return; }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar displayName en Firebase Auth para que App.tsx lo lea correctamente
      await updateProfile(user, { displayName: name.trim() });

      // Guardar perfil público en Firestore con el nombre que el usuario escribió
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: name.trim(),
        avatar: avatar,
        isAdmin: false,
      });

      await setDoc(doc(db, "users", user.uid, "private", "info"), {
        email: email,
        joinedAt: new Date().toISOString(),
      });

      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(friendlyError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    clearMessages();
    setLoading(true);
    const provider = new GoogleAuthProvider();
    // Forzar la selección de cuenta para evitar logins automáticos no deseados
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      // Intentar primero con la ventana emergente (popup)
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // merge: true para NO sobreescribir el nombre si el perfil ya existe
      await setDoc(doc(db, "users", user.uid), {
        id: user.uid,
        name: user.displayName || "Invitado",
        avatar: "⚽",
        isAdmin: false,
      }, { merge: true });

      await setDoc(doc(db, "users", user.uid, "private", "info"), {
        email: user.email || "",
        joinedAt: new Date().toISOString(),
      }, { merge: true });

      onAuthSuccess();
    } catch (err: any) {
      console.error("Google Popup Auth Error:", err);
      
      // Si la ventana fue bloqueada por el navegador, o el usuario está en móvil/navegadores in-app 
      // (ej: WhatsApp/Instagram donde los popups fallan al 100%), hacemos fallback automático a redirección.
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (
        err.code === "auth/popup-blocked" || 
        err.code === "auth/cancelled-popup-request" ||
        isMobile
      ) {
        try {
          console.warn("Popup bloqueado o entorno móvil detectado. Intentando con redirección...");
          await signInWithRedirect(auth, provider);
          // Nota: La página se redirigirá. Al regresar, onAuthStateChanged en App.tsx detectará el inicio de sesión.
          return;
        } catch (redirectErr: any) {
          console.error("Google Redirect Auth Error:", redirectErr);
          setError(friendlyError(redirectErr.code) || redirectErr.message);
        }
      } else {
        setError(friendlyError(err.code) || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot Password ───────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!email.trim()) { setError("Ingresa tu correo electrónico."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(
        `¡Listo! Te enviamos un enlace de recuperación a ${email}. Revisa tu bandeja de entrada (y la carpeta de spam).`
      );
    } catch (err: any) {
      console.error(err);
      setError(friendlyError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
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
            <p className="text-xs text-slate-400">Predice y compite con tus amigos en el próximo Mundial USA-México-Canadá</p>
          </div>
        </div>

        {/* Tab Selector — se oculta en la vista de recuperación */}
        {activeTab !== "forgot" && (
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "login" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Ingresar
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "register" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Crear Perfil
            </button>
          </div>
        )}

        {/* Mensajes de error / éxito */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-rose-400 text-xs font-medium rounded-xl text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ════ FORM: LOGIN ════ */}
        {activeTab === "login" && (
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

            {/* Enlace ¿Olvidaste tu contraseña? */}
            <button
              type="button"
              onClick={() => switchTab("forgot")}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer pt-1"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        )}

        {/* ════ FORM: REGISTER ════ */}
        {activeTab === "register" && (
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

            {/* Avatar picker */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escoge tu Avatar ({avatar})</label>
              <div className="flex gap-2 p-2 bg-slate-850 border border-slate-800 rounded-xl overflow-x-auto select-none no-scrollbar">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setAvatar(emoji)}
                    className={`text-xl p-2 rounded-lg border shrink-0 transition-all cursor-pointer ${
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
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

        {/* ════ FORM: FORGOT PASSWORD ════ */}
        {activeTab === "forgot" && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center space-y-2 pb-1">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-2xl mx-auto">
                🔑
              </div>
              <p className="text-sm text-white font-bold">Recuperar contraseña</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
              </p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <button
              type="button"
              onClick={() => switchTab("login")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 pt-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* Divider + Google (oculto en forgot) */}
        {activeTab !== "forgot" && (
          <>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">O CONTINÚA CON</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Google Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}