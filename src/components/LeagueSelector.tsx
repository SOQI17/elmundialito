import React, { useState } from 'react';
import { UserProfile, League, LeagueMemberInfo } from '../types';
import { Users, Plus, UserPlus, KeyRound, Trophy, Check, AlertCircle } from 'lucide-react';
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
  onLeaveLeague?: (code: string, newCreatorId?: string) => Promise<void>;
  leagueMembersData?: LeagueMemberInfo[];
  realUserId?: string;
  realUserEmail?: string;
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
  onLeaveLeague,
  leagueMembersData,
  realUserId,
  realUserEmail
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

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewCreatorId, setSelectedNewCreatorId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showExtraBankDetails, setShowExtraBankDetails] = useState(false);

  const handleCreatorLeaveClick = () => {
    if (!currentLeague) return;
    
    // Si somos el único miembro de la liga, se borra el grupo completo
    if (currentLeague.members.length <= 1) {
      const msg = 'Como eres el único integrante, si abandonas la liga el grupo completo se eliminará permanentemente de forma inmediata. ¿Deseas continuar?';
      if (window.confirm(msg)) {
        if (onLeaveLeague) {
          onLeaveLeague(currentLeague.code);
        }
      }
    } else {
      setShowTransferModal(true);
      setSelectedNewCreatorId('');
    }
  };

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

  const otherMembers = currentLeague
    ? currentLeague.members
        .filter(memberId => memberId !== currentUser.id)
        .map(memberId => {
          const userProf = allUsers.find(u => u.id === memberId);
          return {
            id: memberId,
            name: userProf?.name || `Participante (${memberId.substring(0, 5)})`,
            avatar: userProf?.avatar || '👤'
          };
        })
    : [];

  const enrichedMembers = currentLeague
    ? currentLeague.members.map(memberId => {
        const userProf = allUsers.find(u => u.id === memberId);
        const mData = leagueMembersData?.find(m => m.userId === memberId);
        return {
          id: memberId,
          name: userProf?.name || `Participante (${memberId.substring(0, 5)})`,
          avatar: userProf?.avatar || '👤',
          paid: mData?.paid || false,
          balance: mData?.balance || 0,
          paymentStatus: mData?.paymentStatus || 'unpaid',
          paymentCode: mData?.paymentCode,
          isCreator: currentLeague.creatorId === memberId
        };
      })
    : [];

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
      <div className={`grid gap-6 ${currentUser.isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* User profile selection (Only visible to Admins) */}
        {currentUser.isAdmin && (
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
        )}

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

      {/* Panel de Control de Ligas (Solo Visible para Administradores) */}
      {currentUser.isAdmin && (
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex flex-col space-y-1.5 animate-fadeIn">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 select-none">
              <Trophy className="w-4 h-4 text-indigo-500" />
              Panel de Administración de Ligas (Global):
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold select-none">
              Como administrador, aquí puedes monitorear todas las ligas del sistema, ver sus configuraciones y seleccionar una para auditar sus integrantes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allLeagues.map((league) => {
              const isSelected = currentLeague?.code === league.code;
              const creatorUser = allUsers.find(u => u.id === league.creatorId);
              return (
                <div
                  key={league.code}
                  onClick={() => onSelectLeague(league)}
                  className={`border rounded-2xl p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50/5 ring-4 ring-indigo-500/5 shadow-md'
                      : 'border-slate-150 bg-white hover:border-slate-350 hover:shadow-xs'
                  }`}
                >
                  {/* Active Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider animate-fadeIn">
                      Activa
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl select-none">🏆</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-800 font-sans leading-tight">{league.name}</h5>
                        <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wider">Código: {league.code}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-500 font-semibold">
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-bold">Integrantes</span>
                        <span className="text-slate-700 font-bold font-mono">{(league.members || []).length} miembros</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-bold">Inscripción</span>
                        <span className="text-slate-700 font-bold font-mono">${league.costPerEntry || 0}.00 USD</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[9px] text-slate-550 text-slate-500">
                    <span className="truncate">
                      👑 <strong className="text-slate-700 font-bold">{creatorUser?.name || 'Sistema'}</strong>
                    </span>
                    <button
                      type="button"
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-800 cursor-default'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Ver Miembros' : 'Seleccionar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sección de Pagos y Saldo de la Liga */}
      {currentLeague && (
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <div className="flex flex-col space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 select-none">
              <Users className="w-4 h-4 text-slate-400" />
              Estado de Suscripciones en esta Liga:
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold select-none">
              Aquí puedes ver a cada integrante del grupo y su respectivo estado de pago. Las acciones de pago y abandono se activan solo en tu perfil actual.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {enrichedMembers.map(member => {
              const isRealUserCard = realUserId ? member.id === realUserId : member.id === currentUser.id;
              const isActiveSimulated = member.id === currentUser.id;
              return (
                <div 
                  key={member.id} 
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                    isRealUserCard 
                      ? 'border-indigo-300 ring-4 ring-indigo-500/5 bg-indigo-50/5' 
                      : isActiveSimulated
                      ? 'border-slate-300 bg-slate-50/30'
                      : 'border-slate-150 hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center text-xl select-none shrink-0">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-800 font-sans">{member.name}</span>
                          {isRealUserCard && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[8px] font-black uppercase rounded tracking-wider select-none animate-fadeIn">
                              Tú (Mi Cuenta)
                            </span>
                          )}
                          {!isRealUserCard && isActiveSimulated && (
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 text-[8px] font-bold uppercase rounded tracking-wider select-none animate-fadeIn">
                              Simulando
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5 select-none">
                          {member.isCreator ? '👑 Organizador' : '⚽ Integrante'}
                        </span>
                        {isRealUserCard && realUserEmail && (
                          <div className="mt-1.5 select-none">
                            <span className="text-[9px] text-indigo-650 font-bold bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60 inline-block font-sans select-all">
                              ✉️ {realUserEmail}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Estado del miembro en la liga */}
                    <div className="select-none shrink-0">
                      {member.isCreator ? (
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black uppercase rounded-lg tracking-wider">
                          👑 Organizador de la Liga
                        </span>
                      ) : member.paid ? (
                        <div className="text-left sm:text-right space-y-0.5">
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-lg tracking-wider inline-block">
                            ✓ Activo y Pagado
                          </span>
                          <span className="text-[9px] text-emerald-600 font-mono font-bold block">
                            Saldo: ${member.balance || 0}.00 USD
                          </span>
                        </div>
                      ) : member.paymentStatus === 'pending' ? (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-black uppercase rounded-lg tracking-wider inline-block animate-pulse">
                          ⏳ Verificación Pendiente
                        </span>
                      ) : member.paymentStatus === 'rejected' ? (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-black uppercase rounded-lg tracking-wider inline-block" title={`Ref: ${member.paymentCode || 'N/A'}`}>
                          ❌ Rechazado / Impago
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-black uppercase rounded-lg tracking-wider inline-block">
                          ⚠️ Falta de Pago
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones exclusivas de la cuenta real del usuario logueado */}
                  {isRealUserCard && (
                    <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-4">
                      
                      {member.isCreator ? (
                        <div className="space-y-4">
                          {onSavePaymentSettings && (
                            <LeaguePaymentSettings
                              league={currentLeague}
                              onSaveSettings={onSavePaymentSettings}
                            />
                          )}
                          <div className="flex justify-end select-none">
                            <button
                              type="button"
                              onClick={handleCreatorLeaveClick}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-105 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-2xs"
                            >
                              Abandonar Liga
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="select-none">
                            <span className="text-[10px] text-slate-500 font-bold block">
                              {member.paid 
                                ? '¡Excelente! Tu participación en esta liga está activa y completamente pagada.' 
                                : member.paymentStatus === 'pending'
                                ? 'El organizador tiene tu comprobante en su bandeja de verificación.'
                                : 'Tu cuenta se encuentra pendiente de suscripción.'}
                            </span>
                            {!member.paid && member.paymentStatus !== 'pending' && currentLeague.bankConfig && (
                              <div className="space-y-1.5 mt-1 select-none">
                                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                                  <span className="text-[9px] text-indigo-650 font-black uppercase tracking-wider block">
                                    👉 Banco Destino: {currentLeague.bankConfig.bankName} (Cta: {currentLeague.bankConfig.accountNumber})
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowExtraBankDetails(!showExtraBankDetails)}
                                    className="text-[9px] text-indigo-600 hover:text-indigo-700 hover:underline font-extrabold cursor-pointer focus:outline-none shrink-0"
                                  >
                                    {showExtraBankDetails ? '(Ocultar datos ▴)' : '(Ver más datos ▾)'}
                                  </button>
                                </div>
                                
                                {showExtraBankDetails && (
                                  <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 text-[9.5px] text-slate-600 font-semibold space-y-1 animate-fadeIn max-w-sm">
                                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                      <span>Titular de la Cuenta:</span>
                                      <span className="text-slate-800 font-bold">{currentLeague.bankConfig.ownerName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                      <span>Cédula o RUC:</span>
                                      <span className="text-slate-800 font-mono font-bold">{currentLeague.bankConfig.ownerId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                                      <span>Tipo de Cuenta:</span>
                                      <span className="text-slate-800 font-bold capitalize">{currentLeague.bankConfig.accountType}</span>
                                    </div>
                                    {currentLeague.bankConfig.ownerEmail && (
                                      <div className="flex justify-between">
                                        <span>Correo del Titular:</span>
                                        <span className="text-slate-805 text-slate-800 font-bold">{currentLeague.bankConfig.ownerEmail}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto justify-end select-none shrink-0">
                            {(!member.paid || member.paymentStatus === 'rejected') && (
                              <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              >
                                💸 Pagar Inscripción / Cargar Saldo
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                const msg = member.paid 
                                  ? '¿Seguro que deseas abandonar esta liga? Perderás tu saldo acreditado y todas tus apuestas registradas en este grupo.'
                                  : '¿Seguro que deseas salir de esta liga de amigos?';
                                if (window.confirm(msg)) {
                                  if (onLeaveLeague) {
                                    await onLeaveLeague(currentLeague.code);
                                  }
                                }
                              }}
                              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              Abandonar Liga
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
          {/* Modal de Transferencia de Propiedad */}
          {showTransferModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-md w-full shadow-2xl animate-fadeIn relative">
                
                {/* Header */}
                <div className="text-center space-y-1.5 select-none">
                  <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-xs">
                    👑
                  </div>
                  <h3 className="text-lg font-black text-white tracking-tight font-sans">
                    Transferir Administración
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Antes de salir de la liga, debes delegar el grupo a otro integrante para evitar que quede huérfano.
                  </p>
                </div>

                {/* Info alert */}
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-xl flex items-start gap-2 text-[10.5px] leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-amber-450 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold uppercase block select-none tracking-wider text-[9px] text-amber-400">⚠️ Acción Requerida</span>
                    El miembro seleccionado asumirá el control de los datos de cobro y la aprobación de inscripciones del grupo de inmediato.
                  </div>
                </div>

                {/* List of members */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {otherMembers.length === 0 ? (
                    <span className="text-xs text-slate-400 block text-center py-4 select-none">No hay otros miembros en este grupo para transferirles.</span>
                  ) : (
                    otherMembers.map(m => {
                      const isSelected = selectedNewCreatorId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedNewCreatorId(m.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                              : 'bg-slate-950/40 border-slate-800 text-slate-350 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg select-none">{m.avatar}</span>
                            <span className="text-xs font-bold text-left">{m.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2 select-none">
                  <button
                    type="button"
                    disabled={transferring}
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 py-2.5 bg-slate-805 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedNewCreatorId || transferring}
                    onClick={async () => {
                      if (!selectedNewCreatorId || !currentLeague) return;
                      const nextOwner = otherMembers.find(m => m.id === selectedNewCreatorId);
                      const msg = `¿Estás seguro de que deseas transferir la propiedad del grupo a "${nextOwner?.name || 'este integrante'}" y salir de la liga? Perderás tu saldo y tus apuestas en este grupo.`;
                      if (window.confirm(msg)) {
                        setTransferring(true);
                        try {
                          if (onLeaveLeague) {
                            await onLeaveLeague(currentLeague.code, selectedNewCreatorId);
                          }
                          setShowTransferModal(false);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setTransferring(false);
                        }
                      }
                    }}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-rose-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer text-center shadow-lg"
                  >
                    {transferring ? 'Transfiriendo...' : 'Confirmar y Salir'}
                  </button>
                </div>

                {/* Close absolute button */}
                <button
                  type="button"
                  disabled={transferring}
                  onClick={() => setShowTransferModal(false)}
                  className="absolute top-2 right-2.5 w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
