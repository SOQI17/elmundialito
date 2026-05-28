import React, { useState } from 'react';
import { UserProfile, League } from '../types';
import { Users, Plus, UserPlus, KeyRound, Trophy, Check } from 'lucide-react';
import LeaguePaymentSettings from './LeaguePaymentSettings';
import VoucherScanner from './VoucherScanner';

interface LeagueSelectorProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  currentLeague: League | null;
  allLeagues: League[];
  onSelectUser: (user: UserProfile) => void;
  onSelectLeague: (league: League | null) => void;
  onAddUser: (name: string, avatar: string) => void;
  onAddLeague: (name: string, code: string) => Promise<boolean>;
  onJoinLeague: (code: string) => Promise<boolean>;
  onSavePaymentSettings?: (bankConfig: League['bankConfig'], costPerEntry: number) => Promise<void>;
  onSubmitVoucher?: (amount: number, code: string, filename: string) => Promise<void>;
  memberInfo?: { paid?: boolean; balance?: number; paymentStatus?: string; paymentCode?: string };
  onLeaveLeague?: (code: string) => Promise<void>;
}

const AVATARS = ['🦁', '🦊', '🐻', '🐼', '🐨', '🐱', '🐶', '🐯', '🐴', '🦄', '🦅', '🦉', '⚽', '🏆'];

export default function LeagueSelector({
  currentUser,
  allUsers,
  currentLeague,
  allLeagues,
  onSelectUser,
  onSelectLeague,
  onAddUser,
  onAddLeague,
  onJoinLeague,
  onSavePaymentSettings,
  onSubmitVoucher,
  memberInfo,
  onLeaveLeague
}: LeagueSelectorProps) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState(AVATARS[0]);

  const [showAddLeague, setShowAddLeague] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueCode, setNewLeagueCode] = useState('');

  const [showJoinLeague, setShowJoinLeague] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const [joinError, setJoinError] = useState('');
  const [leagueError, setLeagueError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const [formingLeague, setFormingLeague] = useState(false);
  const [joiningLeague, setJoiningLeague] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserName.trim()) {
      onAddUser(newUserName.trim(), newUserAvatar);
      setNewUserName('');
      setShowAddUser(false);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newLeagueName.trim() && newLeagueCode.trim() && !formingLeague) {
      setFormingLeague(true);
      setLeagueError('');
      const codeUpper = newLeagueCode.trim().toUpperCase();
      try {
        const success = await onAddLeague(newLeagueName.trim(), codeUpper);
        if (success) {
          setNewLeagueName('');
          setNewLeagueCode('');
          setLeagueError('');
          setShowAddLeague(false);
        } else {
          setLeagueError('El código ya está en uso por otra liga.');
        }
      } catch (err) {
        setLeagueError('Error al crear el grupo.');
      } finally {
        setFormingLeague(false);
      }
    }
  };

  const handleJoinLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim() && !joiningLeague) {
      setJoiningLeague(true);
      setJoinError('');
      const codeUpper = joinCode.trim().toUpperCase();
      try {
        const success = await onJoinLeague(codeUpper);
        if (success) {
          setJoinCode('');
          setJoinError('');
          setShowJoinLeague(false);
        } else {
          setJoinError('Código de liga no encontrado o ya eres miembro de ella.');
        }
      } catch (err) {
        setJoinError('Error al ingresar al grupo.');
      } finally {
        setJoiningLeague(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6" id="league-selector-root">
      {/* Active Selection Overview */}
      <div className="flex flex-col md:flex-row justify-between gap-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
            {currentUser.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 font-sans">{currentUser.name}</h3>
              {currentUser.isAdmin && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Identidad activa para pronósticos</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl text-indigo-600">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">
              {currentLeague ? currentLeague.name : 'Todas las Ligas / Global'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentLeague ? (
                <span className="flex items-center gap-1">
                  Código: <strong className="font-mono text-indigo-600 select-all">{currentLeague.code}</strong>
                  <span className="text-[10px] text-slate-400">({currentLeague.members.length} miembros)</span>
                </span>
              ) : (
                'Filtro de clasificación activa'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of switchers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User profile selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              Simular como Participante:
            </h4>
            <button
              id="btn-show-add-user"
              onClick={() => setShowAddUser(!showAddUser)}
              className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              Crear Perfil
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Registrar nuevo amigo</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del amigo..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 grow"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  Agregar
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1.5">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewUserAvatar(emoji)}
                    className={`text-xl p-1.5 rounded-lg border transition-all ${
                      newUserAvatar === emoji ? 'border-indigo-500 bg-white scale-110 shadow-xs' : 'border-transparent hover:bg-white'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            {allUsers.map((user) => {
              const isSelected = currentUser.id === user.id;
              return (
                <button
                  key={user.id}
                  id={`select-user-${user.id}`}
                  onClick={() => onSelectUser(user)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{user.avatar}</span>
                  <span>{user.name.split(' ')[0]}</span>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leagues / Pools Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-slate-400" />
              Filtrar por Liga / Clan:
            </h4>
            <div className="flex gap-3">
              <button
                id="btn-show-join-league"
                onClick={() => {
                  setShowJoinLeague(!showJoinLeague);
                  setShowAddLeague(false);
                }}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-0.5"
              >
                <KeyRound className="w-3 w-3 mr-0.5" />
                Unirse
              </button>
              <button
                id="btn-show-add-league"
                onClick={() => {
                  setShowAddLeague(!showAddLeague);
                  setShowJoinLeague(false);
                }}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                Crear Liga
              </button>
            </div>
          </div>

          {showJoinLeague && (
            <form onSubmit={handleJoinLeagueSubmit} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Unirse a Liga Privada mediante Código</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: MUNDIAL2026..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder:tracking-normal text-slate-800 focus:outline-none focus:border-indigo-500 grow uppercase"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  Unirse
                </button>
              </div>
              {joinError && <p className="text-[10px] font-semibold text-rose-600">{joinError}</p>}
            </form>
          )}

          {showAddLeague && (
            <form onSubmit={handleCreateLeague} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Crear un Grupo o Liga de amigos</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la Liga (ej: Familia)..."
                  value={newLeagueName}
                  onChange={(e) => setNewLeagueName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Código único (ej: FAMILIAFC)..."
                  value={newLeagueCode}
                  onChange={(e) => setNewLeagueCode(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold tracking-wider text-slate-800 focus:outline-none focus:border-indigo-500 uppercase"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                Crear Grupo
              </button>
              {leagueError && <p className="text-[10px] font-semibold text-rose-600">{leagueError}</p>}
            </form>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              id="select-league-global"
              onClick={() => onSelectLeague(null)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                currentLeague === null
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>🌍</span>
              <span>Global</span>
            </button>
            
            {allLeagues.map((league) => {
              const isSelected = currentLeague?.code === league.code;
              return (
                <button
                  key={league.code}
                  id={`select-league-${league.code}`}
                  onClick={() => onSelectLeague(league)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>⚽</span>
                  <span>{league.name}</span>
                  <span className="text-[10px] opacity-75">({league.code})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sección de Pagos y Saldo de la Liga */}
      {currentLeague && (
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            
            {/* Si el usuario actual es el CREADOR de la liga, puede configurar o editar datos bancarios */}
            {currentLeague.creatorId === currentUser.id ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm font-sans select-none">
                      Eres el Creador y Administrador de este Grupo
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Configura o edita los datos bancarios donde los miembros te transferirán el dinero de la inscripción.
                    </p>
                  </div>
                </div>
                
                {onSavePaymentSettings && (
                  <LeaguePaymentSettings
                    league={currentLeague}
                    onSaveSettings={onSavePaymentSettings}
                  />
                )}
              </div>
            ) : (
              /* Si el usuario actual es un MIEMBRO (no creador), ve su saldo y paga si es necesario */
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider block select-none">
                    Tu Cuenta en esta Liga
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-900 font-sans">{currentUser.name}</span>
                    {memberInfo?.paid ? (
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[9px] font-black uppercase rounded-md tracking-wider flex items-center gap-1">
                        ✓ Activo y Pagado
                      </span>
                    ) : memberInfo?.paymentStatus === 'pending' ? (
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-black uppercase rounded-md tracking-wider animate-pulse">
                        ⏳ Verificación Pendiente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 border border-rose-250 border-rose-200 text-rose-800 text-[9px] font-black uppercase rounded-md tracking-wider">
                        ⚠️ Pendiente de Pago
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-505 text-slate-500 font-semibold">
                    Saldo Apostado Acreditado: <strong className="text-emerald-600 font-mono text-xs">${memberInfo?.balance || 0}.00 USD</strong>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0 select-none">
                  {/* Botón para abrir el escáner de pagos si está impago */}
                  {(!memberInfo?.paid || memberInfo?.paymentStatus === 'rejected') && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer select-none"
                    >
                      💸 Pagar Inscripción / Cargar Saldo
                    </button>
                  )}

                  {/* Botón para abandonar la liga */}
                  <button
                    onClick={async () => {
                      const msg = memberInfo?.paid 
                        ? '¿Seguro que deseas abandonar esta liga? Perderás tu saldo acreditado y todas tus apuestas registradas en este grupo.'
                        : '¿Seguro que deseas salir de esta liga de amigos?';
                      if (window.confirm(msg)) {
                        if (onLeaveLeague) {
                          await onLeaveLeague(currentLeague.code);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer select-none"
                  >
                    Abandonar Liga
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal del Escáner de Comprobante OCR */}
          {showScanner && onSubmitVoucher && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <VoucherScanner
                league={currentLeague}
                onSubmitVoucher={async (amount, code, filename) => {
                  await onSubmitVoucher(amount, code, filename);
                  setShowScanner(false);
                }}
                onClose={() => setShowScanner(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
