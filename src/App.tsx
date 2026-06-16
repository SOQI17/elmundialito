import React, { useState, useEffect } from 'react';
import { INITIAL_MATCHES, INITIAL_LEAGUES } from './data';
import { Match, Forecast, UserProfile, League, UserStats, LeagueMemberInfo, MatchPhase } from './types';
import { calculateScore } from './utils/scoring';

import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

import { Trophy, Calendar, Settings, Lightbulb, BookOpen, Users, LogOut, Pencil } from 'lucide-react';

import LeagueSelector from './components/LeagueSelector';
import MatchesList from './components/MatchesList';
import Leaderboard from './components/Leaderboard';
import InteractiveSandbox from './components/InteractiveSandbox';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';
import EditProfileModal from './components/Editprofilemodal';
import OnboardingScreen from './components/Onboardingscreen';
import ForceBootstrap from './components/Forcebootstrap';



const ADMIN_EMAIL = 'alexisguerra9577@gmail.com';

const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower === 'alexisguerra9577@gmail.com' || lower === 'alexis.guerra@orimec.com.ec';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'leagues' | 'calendar' | 'leaderboard' | 'sandbox' | 'admin'>('calendar');
  const [showForceBootstrap, setShowForceBootstrap] = useState(false);

  // Auth
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [offlineModeActive, setOfflineModeActive] = useState(false);

  // UI modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Core state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(() => {
    try {
      const saved = localStorage.getItem('selected_league_info');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [matches, setMatches] = useState<Match[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [leaguesMembersMap, setLeaguesMembersMap] = useState<Record<string, string[]>>({});
  const [currentMemberInfo, setCurrentMemberInfo] = useState<LeagueMemberInfo | null>(null);
  const [currentLeagueMembersData, setCurrentLeagueMembersData] = useState<LeagueMemberInfo[]>([]);
  const [pendingPayments, setPendingPayments] = useState<LeagueMemberInfo[]>([]);
  const [activePhase, setActivePhase] = useState<MatchPhase>('group');
  const [hasInitializedPhase, setHasInitializedPhase] = useState(false);

  // Automatically select the active phase based on current/upcoming matches when matches are loaded
  useEffect(() => {
    if (matches.length > 0 && !hasInitializedPhase) {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const getLocalDateStr = (dateStr: string) => {
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const dayVal = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayVal}`;
      };

      // 1. Check if there are matches today
      const todayMatch = matches.find(m => getLocalDateStr(m.dateTime) === todayStr);
      if (todayMatch) {
        setActivePhase(todayMatch.phase);
        setHasInitializedPhase(true);
        return;
      }

      // 2. Check if there are upcoming matches
      const upcomingMatch = matches.find(m => getLocalDateStr(m.dateTime) > todayStr);
      if (upcomingMatch) {
        setActivePhase(upcomingMatch.phase);
        setHasInitializedPhase(true);
        return;
      }

      // 3. Otherwise, select the last match's phase
      const lastMatch = matches[matches.length - 1];
      if (lastMatch) {
        setActivePhase(lastMatch.phase);
        setHasInitializedPhase(true);
      }
    }
  }, [matches, hasInitializedPhase]);

  const isRealAdmin = !!(currentUser?.isAdmin || isAdminEmail(authUser?.email));
  const currentUserWithAdminFlag = currentUser ? { ...currentUser, isAdmin: isRealAdmin } : null;

  const enrichedLeagues = leagues.map(l => ({ ...l, members: leaguesMembersMap[l.code] || [] }));

  // ── 1. Auth listener ──────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        setProfileError(null);
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          let profile: UserProfile;

          if (!docSnap.exists()) {
            profile = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'Jugador',
              avatar: '⚽',
              isAdmin: isAdminEmail(user.email),
              onboarded: false,
              email: user.email || '',
            };
            try {
              await setDoc(userDocRef, profile);
              await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
                email: user.email || '',
                joinedAt: new Date().toISOString(),
              });
            } catch (writeErr) {
              console.warn('Could not write initial profile (offline):', writeErr);
            }
          } else {
            const data = docSnap.data() as UserProfile;
            profile = { id: docSnap.id, ...data };
            
            let needsUpdate = false;
            const updateFields: any = {};

            if (isAdminEmail(user.email) && !profile.isAdmin) {
              profile.isAdmin = true;
              updateFields.isAdmin = true;
              needsUpdate = true;
            }
            if (user.email && !profile.email) {
              profile.email = user.email;
              updateFields.email = user.email;
              needsUpdate = true;
            }

            if (needsUpdate) {
              try { await setDoc(userDocRef, updateFields, { merge: true }); } catch (_) {}
            }
          }

          setCurrentUser(profile);
          // Show onboarding if first time
          if (!profile.onboarded) setShowOnboarding(true);
          setOfflineModeActive(false);
        } catch (err: any) {
          console.warn('Offline fallback profile:', err);
          const fallbackProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Jugador',
            avatar: '⚽',
            isAdmin: isAdminEmail(user.email),
            isOfflineFallback: true,
            onboarded: true, // skip onboarding in offline mode
            email: user.email || '',
          };
          setCurrentUser(fallbackProfile);
          setOfflineModeActive(true);
        }
      } else {
        setCurrentUser(null);
        setShowOnboarding(false);
        setOfflineModeActive(false);
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [retryTrigger]);

  // ── 2. Users sync ─────────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uData: UserProfile[] = [];
      snapshot.forEach((doc) => uData.push({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(uData);
      // Sync currentUser name/avatar live from Firestore
      const myProfile = uData.find(u => u.id === authUser.uid);
      if (myProfile) {
        setCurrentUser(prev => prev ? { ...prev, name: myProfile.name, avatar: myProfile.avatar } : myProfile);
      }
    }, (err) => {
      console.warn('Users sync offline:', err);
      setOfflineModeActive(true);
      if (currentUser) setUsers(prev => prev.length === 0 ? [currentUser] : prev);
    });
    return () => unsubscribe();
  }, [authUser]);

  // ── 2.5 Admin backfill of missing user emails ────────────────
  useEffect(() => {
    if (!isRealAdmin || users.length === 0 || offlineModeActive) return;

    const backfillEmails = async () => {
      // Find all users who don't have an email in their public profile
      const usersToBackfill = users.filter(u => !u.email && !u.isOfflineFallback);
      if (usersToBackfill.length === 0) return;

      for (const targetUser of usersToBackfill) {
        try {
          const infoSnap = await getDoc(doc(db, 'users', targetUser.id, 'private', 'info'));
          if (infoSnap.exists()) {
            const infoData = infoSnap.data();
            if (infoData && infoData.email) {
              await setDoc(doc(db, 'users', targetUser.id), {
                email: infoData.email
              }, { merge: true });
              console.log(`Backfilled email for user ${targetUser.id}: ${infoData.email}`);
            }
          }
        } catch (err) {
          console.warn(`Admin failed to backfill email for user ${targetUser.id}:`, err);
        }
      }
    };

    backfillEmails();
  }, [isRealAdmin, users, offlineModeActive]);



  // Migración automática para México vs Sudáfrica (M1) y Corea del Sur vs República Checa (M2) con datos reales
  useEffect(() => {
    if (!db || matches.length === 0) return;
    
    // M_1 México vs Sudáfrica
    const targetMatch1 = matches.find(m => m.id === 'M_1');
    if (targetMatch1 && (!targetMatch1.incidents || targetMatch1.incidents.length < 7 || targetMatch1.status !== 'finished')) {
      const realIncidents1 = [
        { minute: 0, type: 'start', title: 'Inicio del partido', description: '¡Rueda el balón en el Estadio Azteca! Comienza el partido de apertura de la Copa Mundial 2026.', timestamp: Date.now() },
        { minute: 9, type: 'goal_home', title: '¡GOL DE MÉXICO!', description: 'Julián Andrés Quiñones abre el marcador con un remate de cabeza tras un gran centro de Luis Chávez.', timestamp: Date.now() },
        { minute: 50, type: 'yellow_away', title: 'Tarjeta Amarilla', description: 'Sphephelo Sithole (Sudáfrica) es amonestado por una falta fuerte sobre Edson Álvarez.', timestamp: Date.now() },
        { minute: 67, type: 'goal_home', title: '¡GOL DE MÉXICO!', description: 'Raúl Jiménez define con categoría mano a mano con el portero rival para poner el 2-0.', timestamp: Date.now() },
        { minute: 84, type: 'yellow_away', title: 'Tarjeta Amarilla', description: 'Themba Zwane (Sudáfrica) recibe tarjeta de amonestación por reclamar airadamente al árbitro.', timestamp: Date.now() },
        { minute: 90, type: 'red_home', title: 'Tarjeta Roja Directa', description: 'César Montes es expulsado tras una entrada tardía en el minuto 90+2.', timestamp: Date.now() },
        { minute: 94, type: 'end', title: 'Fin del partido', description: '¡Termina el partido inaugural! México vence 2-0 a Sudáfrica y obtiene sus primeros 3 puntos.', timestamp: Date.now() }
      ];

      setDoc(doc(db, 'matches', 'M_1'), {
        homeScore: 2,
        awayScore: 0,
        status: 'finished',
        incidents: realIncidents1
      }, { merge: true })
      .then(() => console.log('✅ Migración: Partido M_1 actualizado con goles e incidentes reales.'))
      .catch(err => console.error('Error al migrar M_1:', err));
    }

    // M_2 Corea del Sur vs República Checa
    const targetMatch2 = matches.find(m => m.id === 'M_2');
    if (targetMatch2 && (!targetMatch2.incidents || targetMatch2.incidents.length < 5 || targetMatch2.status !== 'finished')) {
      const realIncidents2 = [
        { minute: 0, type: 'start', title: 'Inicio del partido', description: '¡Comienza el partido en el Estadio Akron! Corea del Sur y República Checa debutan en el Mundial 2026.', timestamp: Date.now() },
        { minute: 59, type: 'goal_away', title: '¡GOL DE REPÚBLICA CHECA!', description: 'Ladislav Krejčí conecta un soberbio cabezazo tras un tiro de esquina para abrir el marcador 0-1.', timestamp: Date.now() },
        { minute: 67, type: 'goal_home', title: '¡GOL DE COREA DEL SUR!', description: 'Hwang In-beom empata el partido 1-1 con un remate cruzado inalcanzable para el arquero.', timestamp: Date.now() },
        { minute: 80, type: 'goal_home', title: '¡GOL DE COREA DEL SUR!', description: 'Oh Hyeon-gyu remata tras un gran pase filtrado y completa la remontada 2-1.', timestamp: Date.now() },
        { minute: 94, type: 'end', title: 'Fin del partido', description: '¡Termina el encuentro! Corea del Sur vence 2-1 a República Checa en un emocionante partido en Guadalajara.', timestamp: Date.now() }
      ];

      setDoc(doc(db, 'matches', 'M_2'), {
        homeScore: 2,
        awayScore: 1,
        status: 'finished',
        incidents: realIncidents2
      }, { merge: true })
      .then(() => console.log('✅ Migración: Partido M_2 actualizado con goles e incidentes reales.'))
      .catch(err => console.error('Error al migrar M_2:', err));
    }
  }, [db, matches]);

  // ── 3. Matches sync ───────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'matches'), async (snapshot) => {
      if (snapshot.empty || snapshot.size < INITIAL_MATCHES.length) {
        const existingIds = new Set(snapshot.docs.map(d => d.id));
        for (const match of INITIAL_MATCHES) {
          if (!existingIds.has(match.id)) {
            try { await setDoc(doc(db, 'matches', match.id), match); } catch (e) { console.error(e); }
          }
        }
        if (snapshot.empty) return;
      }
      const mData: Match[] = [];
      snapshot.forEach((d) => mData.push({ id: d.id, ...d.data() } as Match));
      mData.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setMatches(mData);
    }, (err) => {
      console.warn('Matches sync offline:', err);
      setOfflineModeActive(true);
      setMatches(prev => prev.length === 0 ? INITIAL_MATCHES : prev);
    });
    return () => unsubscribe();
  }, [authUser]);

  // ── 4. Forecasts sync ─────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'forecasts'), (snapshot) => {
      const fData: Forecast[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let updatedAtStr = '';
        if (data.updatedAt) {
          updatedAtStr = typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : String(data.updatedAt);
        }
        fData.push({ 
          matchId: data.matchId, 
          userId: data.userId, 
          homeScore: Number(data.homeScore), 
          awayScore: Number(data.awayScore), 
          updatedAt: updatedAtStr,
          leagueCode: data.leagueCode || undefined
        });
      });

      if (currentUser) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`offline_forecast_${currentUser.id}_`)) {
              const val = localStorage.getItem(key);
              if (val) {
                const parsed = JSON.parse(val);
                const matchId = parsed.matchId || key.replace(`offline_forecast_${currentUser.id}_`, '');
                const leagueCode = parsed.leagueCode || undefined;
                const idx = fData.findIndex(f => f.matchId === matchId && f.userId === currentUser.id && f.leagueCode === leagueCode);
                if (idx > -1) {
                  const st = fData[idx].updatedAt ? new Date(fData[idx].updatedAt).getTime() : 0;
                  const lt = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
                  if (lt > st) {
                    fData[idx] = { matchId, userId: currentUser.id, homeScore: Number(parsed.homeScore), awayScore: Number(parsed.awayScore), updatedAt: parsed.updatedAt, leagueCode };
                  }
                } else {
                  fData.push({ matchId, userId: currentUser.id, homeScore: Number(parsed.homeScore), awayScore: Number(parsed.awayScore), updatedAt: parsed.updatedAt, leagueCode });
                }
              }
            }
          }
        } catch (e) { console.warn('Error merging offline forecasts:', e); }
      }
      setForecasts(fData);
    }, (err) => {
      console.warn('Forecasts observer offline:', err);
      setOfflineModeActive(true);
    });
    return () => unsubscribe();
  }, [authUser, currentUser]);

  // Migrate legacy undefined-userId forecasts
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 'undefined') return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith('offline_forecast_undefined_')) keys.push(k);
      }
      keys.forEach(async (oldKey) => {
        const matchId = oldKey.replace('offline_forecast_undefined_', '');
        const val = localStorage.getItem(oldKey);
        if (val) {
          const newKey = `offline_forecast_${currentUser.id}_${matchId}`;
          localStorage.setItem(newKey, val);
          localStorage.removeItem(oldKey);
          const parsed = JSON.parse(val);
          try {
            await setDoc(doc(db, 'forecasts', `${matchId}_${currentUser.id}`), {
              matchId, userId: currentUser.id,
              homeScore: Number(parsed.homeScore), awayScore: Number(parsed.awayScore),
              updatedAt: serverTimestamp(),
            });
          } catch (_) {}
        }
      });
    } catch (e) { console.warn('Migration error:', e); }
  }, [currentUser]);

  // Load localStorage forecasts
  useEffect(() => {
    if (!currentUser) return;
    const offline: Forecast[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`offline_forecast_${currentUser.id}_`)) {
          const val = localStorage.getItem(key);
          if (val) {
            const p = JSON.parse(val);
            const matchId = p.matchId || key.replace(`offline_forecast_${currentUser.id}_`, '');
            const leagueCode = p.leagueCode || undefined;
            offline.push({ matchId, userId: currentUser.id, homeScore: Number(p.homeScore), awayScore: Number(p.awayScore), updatedAt: p.updatedAt, leagueCode });
          }
        }
      }
    } catch (e) { console.error(e); }
    if (offline.length > 0) {
      setForecasts(prev => {
        const merged = [...prev];
        offline.forEach(o => { if (!prev.some(f => f.matchId === o.matchId && f.userId === o.userId && f.leagueCode === o.leagueCode)) merged.push(o); });
        return merged;
      });
    }
  }, [currentUser, forecasts.length === 0]);

  // ── 5. Leagues sync ───────────────────────────────────────
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'leagues'), async (snapshot) => {
      if (snapshot.empty) {
        for (const l of INITIAL_LEAGUES) {
          try {
            await setDoc(doc(db, 'leagues', l.code), { code: l.code, name: l.name, creatorId: l.creatorId });
            for (const memberId of l.members)
              await setDoc(doc(db, 'leagues', l.code, 'members', memberId), { userId: memberId, leagueCode: l.code, joinedAt: new Date().toISOString() });
          } catch (e) { console.error(e); }
        }
        return;
      }
      const lData: League[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        lData.push({ 
          code: data.code, 
          name: data.name, 
          creatorId: data.creatorId, 
          members: [], 
          bankConfig: data.bankConfig, 
          costPerEntry: data.costPerEntry,
          gameMode: data.gameMode || 'total',
          customGroups: data.customGroups || [],
          poolDistributionMode: data.poolDistributionMode || 'proportional'
        });
      });
      setLeagues(lData);
    }, (err) => {
      console.warn('Leagues offline:', err);
      setOfflineModeActive(true);
      if (leagues.length === 0) setLeagues(INITIAL_LEAGUES.map(l => ({ code: l.code, name: l.name, creatorId: l.creatorId, members: l.members })));
    });
    return () => unsubscribe();
  }, [authUser]);

  // ── 6. League members ─────────────────────────────────────
  useEffect(() => {
    if (leagues.length === 0) return;
    const unsubs = leagues.map(league =>
      onSnapshot(collection(db, 'leagues', league.code, 'members'), (snapshot) => {
        setLeaguesMembersMap(prev => ({ ...prev, [league.code]: snapshot.docs.map(d => d.id) }));
      }, (err) => console.warn(`League members offline ${league.code}:`, err))
    );
    return () => unsubs.forEach(fn => fn());
  }, [leagues]);

  // ── 7. Active member info (payment / balance) ────────────────
  useEffect(() => {
    if (!currentUser || !currentLeague) {
      setCurrentMemberInfo(null);
      return;
    }
    const unsubscribe = onSnapshot(doc(db, 'leagues', currentLeague.code, 'members', currentUser.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentMemberInfo({
          userId: currentUser.id,
          leagueCode: currentLeague.code,
          joinedAt: data.joinedAt || '',
          paid: data.paid || false,
          balance: data.balance || 0,
          paymentStatus: data.paymentStatus || 'unpaid',
          paymentVoucherUrl: data.paymentVoucherUrl,
          paymentVoucherAmount: data.paymentVoucherAmount,
          paymentCode: data.paymentCode,
          paymentMethod: data.paymentMethod
        });
      } else {
        setCurrentMemberInfo(null);
      }
    }, (err) => console.error('Active member info sync offline:', err));
    return () => unsubscribe();
  }, [currentUser, currentLeague]);

  // ── 7.5 All members payment data sync ───────────────────────
  useEffect(() => {
    if (!currentLeague) {
      setCurrentLeagueMembersData([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'leagues', currentLeague.code, 'members'), (snapshot) => {
      const data: LeagueMemberInfo[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        data.push({
          userId: docSnap.id,
          leagueCode: currentLeague.code,
          joinedAt: d.joinedAt || '',
          paid: d.paid || false,
          balance: d.balance || 0,
          paymentStatus: d.paymentStatus || 'unpaid',
          paymentVoucherUrl: d.paymentVoucherUrl,
          paymentVoucherAmount: d.paymentVoucherAmount,
          paymentCode: d.paymentCode,
          paymentMethod: d.paymentMethod
        });
      });
      setCurrentLeagueMembersData(data);
    }, (err) => console.error('League members data sync offline:', err));
    return () => unsubscribe();
  }, [currentLeague]);

  // ── 8. Pending payments for the creator ──────────────────────
  useEffect(() => {
    if (!currentUser || !currentLeague || currentLeague.creatorId !== currentUser.id) {
      setPendingPayments([]);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, 'leagues', currentLeague.code, 'members'), (snapshot) => {
      const pending: LeagueMemberInfo[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        if (data.paymentStatus === 'pending') {
          pending.push({
            userId: d.id,
            leagueCode: currentLeague.code,
            joinedAt: data.joinedAt || '',
            paid: data.paid || false,
            balance: data.balance || 0,
            paymentStatus: data.paymentStatus,
            paymentVoucherUrl: data.paymentVoucherUrl,
            paymentVoucherAmount: data.paymentVoucherAmount,
            paymentCode: data.paymentCode
          });
        }
      });
      setPendingPayments(pending);
    }, (err) => console.error('Pending payments sync offline:', err));
    return () => unsubscribe();
  }, [currentUser, currentLeague]);

  // Sync selected league to localStorage
  useEffect(() => {
    try {
      if (currentLeague) {
        localStorage.setItem('selected_league_info', JSON.stringify(currentLeague));
      } else {
        localStorage.removeItem('selected_league_info');
      }
    } catch (_) {}
  }, [currentLeague]);

  // Auto-select the first joined league if none is selected
  useEffect(() => {
    if (!currentUser || currentLeague) return;
    if (enrichedLeagues.length === 0) return;
    
    const myLeagues = enrichedLeagues.filter(l => (l.members || []).includes(currentUser.id));
    if (myLeagues.length > 0) {
      try {
        const saved = localStorage.getItem('selected_league_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          const found = myLeagues.find(l => l.code === parsed.code);
          if (found) {
            setCurrentLeague(found);
            return;
          }
        }
      } catch (_) {}
      
      setCurrentLeague(myLeagues[0]);
    }
  }, [currentUser, enrichedLeagues, currentLeague]);

  // ── Event handlers ────────────────────────────────────────
  const handleSelectSimulatedProfile = (profile: UserProfile) => setCurrentUser(profile);

  const handleAddUser = async (name: string, avatar: string) => {
    const fakeId = `U_${Date.now()}`;
    const newProfile: UserProfile = { id: fakeId, name, avatar, isAdmin: false };
    try {
      await setDoc(doc(db, 'users', fakeId), newProfile);
      setCurrentUser(newProfile);
      if (currentLeague)
        await setDoc(doc(db, 'leagues', currentLeague.code, 'members', fakeId), { userId: fakeId, leagueCode: currentLeague.code, joinedAt: new Date().toISOString() });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `users/${fakeId}`); }
  };

  const handleAddLeague = async (name: string, code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const codeUpper = code.toUpperCase();
    try {
      const snap = await getDoc(doc(db, 'leagues', codeUpper));
      if (snap.exists()) return false;
      await setDoc(doc(db, 'leagues', codeUpper), { code: codeUpper, name, creatorId: currentUser.id });
      await setDoc(doc(db, 'leagues', codeUpper, 'members', currentUser.id), { userId: currentUser.id, leagueCode: codeUpper, joinedAt: new Date().toISOString() });
      setCurrentLeague({ code: codeUpper, name, creatorId: currentUser.id, members: [currentUser.id] });
      return true;
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `leagues/${codeUpper}`); return false; }
  };

  const handleJoinLeague = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const codeUpper = code.toUpperCase();
    try {
      const snap = await getDoc(doc(db, 'leagues', codeUpper));
      if (!snap.exists()) return false;
      await setDoc(doc(db, 'leagues', codeUpper, 'members', currentUser.id), { userId: currentUser.id, leagueCode: codeUpper, joinedAt: new Date().toISOString() });
      const data = snap.data();
      setCurrentLeague({ code: codeUpper, name: data.name, creatorId: data.creatorId, members: [] });
      return true;
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `leagues/${codeUpper}/members`); return false; }
  };

  const handleSaveForecast = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!currentUser || currentUser.isAdmin) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isLocked = match.status === 'live' || match.status === 'finished' || new Date().getTime() >= new Date(match.dateTime).getTime();
    if (isLocked) {
      alert("Error: El partido ya ha comenzado. No se pueden registrar ni modificar pronósticos.");
      return;
    }

    const leagueCode = currentLeague?.code;
    const forecastId = leagueCode ? `${matchId}_${currentUser.id}_${leagueCode}` : `${matchId}_${currentUser.id}`;
    const nowIso = new Date().toISOString();
    const localForecast: Forecast = { matchId, userId: currentUser.id, homeScore: Number(homeScore), awayScore: Number(awayScore), updatedAt: nowIso, leagueCode };
    setForecasts(prev => {
      const idx = prev.findIndex(f => f.matchId === matchId && f.userId === currentUser.id && f.leagueCode === leagueCode);
      if (idx > -1) { const next = [...prev]; next[idx] = localForecast; return next; }
      return [...prev, localForecast];
    });

    const localKey = leagueCode 
      ? `offline_forecast_${currentUser.id}_${leagueCode}_${matchId}` 
      : `offline_forecast_${currentUser.id}_${matchId}`;

    try { 
      localStorage.setItem(localKey, JSON.stringify({ 
        matchId,
        leagueCode,
        homeScore: Number(homeScore), 
        awayScore: Number(awayScore), 
        updatedAt: nowIso 
      })); 
    } catch (_) {}

    try {
      await setDoc(doc(db, 'forecasts', forecastId), { 
        matchId, 
        userId: currentUser.id, 
        homeScore: Number(homeScore), 
        awayScore: Number(awayScore), 
        updatedAt: serverTimestamp(),
        leagueCode: leagueCode || null
      });
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, `forecasts/${forecastId}`); 
      throw err;
    }
  };

  const handleSaveUserForecast = async (userId: string, matchId: string, homeScore: number, awayScore: number, leagueCode?: string) => {
    const forecastId = leagueCode ? `${matchId}_${userId}_${leagueCode}` : `${matchId}_${userId}`;
    const nowIso = new Date().toISOString();
    
    // update local state
    setForecasts(prev => {
      const idx = prev.findIndex(f => f.matchId === matchId && f.userId === userId && f.leagueCode === (leagueCode || undefined));
      const updated = { matchId, userId, homeScore: Number(homeScore), awayScore: Number(awayScore), updatedAt: nowIso, leagueCode: leagueCode || undefined };
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });

    try {
      await setDoc(doc(db, 'forecasts', forecastId), { 
        matchId, 
        userId, 
        homeScore: Number(homeScore), 
        awayScore: Number(awayScore), 
        updatedAt: serverTimestamp(),
        leagueCode: leagueCode || null
      });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `forecasts/${forecastId}`); throw err; }
  };

  const handleSyncMatchesFromAPI = async () => {
    try {
      const syncMatchesCallable = httpsCallable<any, { success: boolean; message: string; updatedCount: number }>(functions, 'syncMatches');
      const result = await syncMatchesCallable();
      return result.data;
    } catch (err: any) {
      console.error("Error invoking syncMatches Cloud Function:", err);
      throw new Error(err.message || "Error al invocar la función de sincronización.");
    }
  };

  const handleUpdateMatchResult = async (matchId: string, homeScore: number | undefined, awayScore: number | undefined, status: Match['status'], mode?: Match['mode'], liveStartTimestamp?: number | null, incidents?: Match['incidents']) => {
    try {
      const updateData: any = { homeScore: homeScore !== undefined ? Number(homeScore) : undefined, awayScore: awayScore !== undefined ? Number(awayScore) : undefined, status };
      if (mode !== undefined) updateData.mode = mode;
      if (liveStartTimestamp !== undefined) updateData.liveStartTimestamp = liveStartTimestamp;
      if (incidents !== undefined) updateData.incidents = incidents;
      await setDoc(doc(db, 'matches', matchId), updateData, { merge: true });
    } catch (err) { 
      handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`); 
      throw err;
    }
  };

  const handleResetData = async () => {
    try {
      for (const m of matches) await setDoc(doc(db, 'matches', m.id), { homeScore: undefined, awayScore: undefined, status: 'scheduled' }, { merge: true });
      for (const f of forecasts) {
        const id = f.leagueCode ? `${f.matchId}_${f.userId}_${f.leagueCode}` : `${f.matchId}_${f.userId}`;
        await deleteDoc(doc(db, 'forecasts', id));
      }
      try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('offline_forecast_')) keys.push(k); }
        keys.forEach(k => localStorage.removeItem(k));
      } catch (_) {}
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, 'bulk-reset'); }
  };

  const handleDeleteLeague = async (code: string) => {
    try {
      const membersRef = collection(db, 'leagues', code, 'members');
      const membersSnap = await getDocs(membersRef);
      for (const d of membersSnap.docs) {
        await deleteDoc(doc(db, 'leagues', code, 'members', d.id));
      }
      await deleteDoc(doc(db, 'leagues', code));
      if (currentLeague?.code === code) {
        setCurrentLeague(null);
      }
    } catch (err) {
      console.error('Error deleting league:', err);
    }
  };

  const handleUpdateLeagueName = async (code: string, newName: string) => {
    try {
      await setDoc(doc(db, 'leagues', code), { name: newName }, { merge: true });
    } catch (err) {
      console.error('Error updating league name:', err);
    }
  };

  const handleSavePaymentSettings = async (
    bankConfig: League['bankConfig'], 
    costPerEntry: number,
    gameMode?: League['gameMode'],
    customGroups?: League['customGroups'],
    poolDistributionMode?: League['poolDistributionMode']
  ) => {
    if (!currentLeague) return;
    try {
      await setDoc(doc(db, 'leagues', currentLeague.code), { 
        bankConfig, 
        costPerEntry,
        gameMode: gameMode || 'total',
        customGroups: customGroups || [],
        poolDistributionMode: poolDistributionMode || 'proportional'
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${currentLeague.code}`);
    }
  };

  const handleSubmitVoucher = async (amount: number, code: string, filename: string) => {
    if (!currentUser || !currentLeague) return;
    const targetUserId = authUser?.uid || currentUser.id;
    try {
      await setDoc(doc(db, 'leagues', currentLeague.code, 'members', targetUserId), {
        paymentStatus: 'pending',
        paymentVoucherAmount: amount,
        paymentCode: code,
        paymentVoucherUrl: filename,
        paid: false
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${currentLeague.code}/members/${targetUserId}`);
    }
  };

  const handleApprovePayment = async (leagueCode: string, userId: string, amount: number) => {
    try {
      const docRef = doc(db, 'leagues', leagueCode, 'members', userId);
      const snap = await getDoc(docRef);
      const currentBalance = snap.exists() ? (snap.data().balance || 0) : 0;
      
      await setDoc(docRef, {
        paid: true,
        paymentStatus: 'approved',
        balance: currentBalance + amount
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${leagueCode}/members/${userId}`);
    }
  };

  const handleRejectPayment = async (leagueCode: string, userId: string) => {
    try {
      await setDoc(doc(db, 'leagues', leagueCode, 'members', userId), {
        paymentStatus: 'rejected',
        paid: false
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${leagueCode}/members/${userId}`);
    }
  };

  const handleUpdateMemberPayment = async (
    leagueCode: string,
    userId: string,
    paid: boolean,
    paymentStatus: LeagueMemberInfo['paymentStatus'],
    paymentMethod?: LeagueMemberInfo['paymentMethod'],
    amount?: number
  ) => {
    try {
      await setDoc(doc(db, 'leagues', leagueCode, 'members', userId), {
        paid,
        paymentStatus,
        paymentMethod: paymentMethod || null,
        balance: amount ?? 0
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${leagueCode}/members/${userId}`);
    }
  };


  const handleLeaveLeague = async (leagueCode: string, newCreatorId?: string) => {
    if (!currentUser) return;
    const targetUserId = authUser?.uid || currentUser.id;
    try {
      const leagueRef = doc(db, 'leagues', leagueCode);
      const leagueSnap = await getDoc(leagueRef);
      
      if (leagueSnap.exists()) {
        const leagueData = leagueSnap.data();
        const isCreator = leagueData.creatorId === targetUserId;
        
        if (isCreator) {
          if (newCreatorId) {
            // Transferir propiedad al nuevo creador
            await setDoc(leagueRef, { creatorId: newCreatorId }, { merge: true });
          } else {
            // Si somos el único miembro (o si el grupo queda vacío), eliminar por completo la liga
            const membersRef = collection(db, 'leagues', leagueCode, 'members');
            const membersSnap = await getDocs(membersRef);
            for (const d of membersSnap.docs) {
              await deleteDoc(doc(db, 'leagues', leagueCode, 'members', d.id));
            }
            await deleteDoc(leagueRef);
            setCurrentLeague(null);
            return;
          }
        }
      }
      
      // Remover nuestro registro de miembro de la liga
      await deleteDoc(doc(db, 'leagues', leagueCode, 'members', targetUserId));
      setCurrentLeague(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leagues/${leagueCode}/members/${targetUserId}`);
    }
  };

  const handleRemoveMember = async (leagueCode: string, userId: string) => {
    try {
      await deleteDoc(doc(db, 'leagues', leagueCode, 'members', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `leagues/${leagueCode}/members/${userId}`);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setCurrentUser(null); } catch (err) { console.error(err); }
  };

  // ── Profile edit handler ───────────────────────────────────
  const handleProfileSaved = (updated: UserProfile) => {
    setCurrentUser(updated);
    setShowEditProfile(false);
  };

  // ── Onboarding complete ───────────────────────────────────
  const handleOnboardingComplete = (league: League | null) => {
    if (league) setCurrentLeague(league);
    setShowOnboarding(false);
  };

  const latestLeagueData = currentLeague ? leagues.find(l => l.code === currentLeague.code) : null;
  const enrichedCurrentLeague = latestLeagueData 
    ? { ...latestLeagueData, members: leaguesMembersMap[latestLeagueData.code] || [] } 
    : null;

  // ── Leaderboard calc ──────────────────────────────────────
  const calculateLeaderboardStats = (): UserStats[] => {
    if (!currentUser) return [];
    const map = new Map<string, UserProfile>();
    users.forEach(u => { if (u?.id) map.set(u.id, u); });
    if (currentUser?.id) map.set(currentUser.id, currentUser);

    // Filter forecasts and matches based on game mode and active phase/pool
    let poolMatches = matches;
    if (enrichedCurrentLeague && enrichedCurrentLeague.gameMode && enrichedCurrentLeague.gameMode !== 'total') {
      if (enrichedCurrentLeague.gameMode === 'sectional') {
        poolMatches = matches.filter(m => m.phase === activePhase);
      } else if (enrichedCurrentLeague.gameMode === 'custom') {
        const group = enrichedCurrentLeague.customGroups?.find(g => g.phases.includes(activePhase));
        if (group) {
          poolMatches = matches.filter(m => group.phases.includes(m.phase));
        }
      }
    }

    // Filter forecasts by active league or global fallback
    const activeForecasts = forecasts.filter(f => !enrichedCurrentLeague || f.leagueCode === enrichedCurrentLeague.code || !f.leagueCode);

    activeForecasts.forEach(f => {
      if (f?.userId && f.userId !== 'undefined' && !map.has(f.userId)) {
        map.set(f.userId, { id: f.userId, name: f.userId === currentUser?.id ? currentUser.name : `Participante (${f.userId.substring(0,5)})`, avatar: f.userId === currentUser?.id ? currentUser.avatar : '👤' });
      }
    });
    let participants = Array.from(map.values()).filter(u => !u.isAdmin);
    if (enrichedCurrentLeague) {
      const memberIds = leaguesMembersMap[enrichedCurrentLeague.code] || [];
      participants = participants.filter(u => memberIds.includes(u.id));
    }
    return participants.map(user => {
      let exact = 0, trend = 0, simple = 0, none = 0, total = 0, pending = 0;
      poolMatches.forEach(match => {
        // Preference: league-specific first, then global fallback
        const f = forecasts.find(f => f.matchId === match.id && f.userId === user.id && enrichedCurrentLeague && f.leagueCode === enrichedCurrentLeague.code)
               || forecasts.find(f => f.matchId === match.id && f.userId === user.id && !f.leagueCode);
        
        if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {
          if (f) {
            const r = calculateScore(match.homeScore, match.awayScore, f.homeScore, f.awayScore);
            total += r.score;
            if (r.category === 'perfect') exact++;
            else if (r.category === 'trend') trend++;
            else if (r.category === 'simple') simple++;
            else none++;
          } else { none++; }
        } else {
          if (f) pending++;
        }
      });
      return { userId: user.id, userName: user.name, userAvatar: user.avatar, exactMatchesCount: exact, trendMatchesCount: trend, simpleMatchesCount: simple, noMatchesCount: none, totalPoints: total, pendingMatchesCount: pending };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.exactMatchesCount - a.exactMatchesCount || b.trendMatchesCount - a.trendMatchesCount);
  };
  
  // Calculate total matches and predictions dynamically based on phase/pool
  const poolMatchesForHeader = React.useMemo(() => {
    if (!enrichedCurrentLeague || !enrichedCurrentLeague.gameMode || enrichedCurrentLeague.gameMode === 'total') {
      return matches;
    }
    if (enrichedCurrentLeague.gameMode === 'sectional') {
      return matches.filter(m => m.phase === activePhase);
    }
    if (enrichedCurrentLeague.gameMode === 'custom') {
      const group = enrichedCurrentLeague.customGroups?.find(g => g.phases.includes(activePhase));
      if (group) {
        return matches.filter(m => group.phases.includes(m.phase));
      }
    }
    return matches;
  }, [matches, enrichedCurrentLeague, activePhase]);

  // Premium game mode theme coloring
  const modeTheme = React.useMemo(() => {
    const mode = enrichedCurrentLeague?.gameMode || 'total';
    if (mode === 'sectional') {
      return {
        bg: 'bg-emerald-600/50',
        border: 'border-emerald-500/40',
        text: 'text-emerald-200',
        accentText: 'text-emerald-300'
      };
    }
    if (mode === 'custom') {
      return {
        bg: 'bg-purple-600/50',
        border: 'border-purple-500/40',
        text: 'text-purple-200',
        accentText: 'text-purple-300'
      };
    }
    return {
      bg: 'bg-indigo-600/55',
      border: 'border-indigo-500/30',
      text: 'text-indigo-200',
      accentText: 'text-indigo-300'
    };
  }, [enrichedCurrentLeague]);

  const currentStats = calculateLeaderboardStats();
  const myRank = currentStats.findIndex(s => s.userId === currentUser?.id) + 1;
  const totalMatchesLoaded = poolMatchesForHeader.length;
  const totalPredictionMade = poolMatchesForHeader.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser?.id && (!enrichedCurrentLeague || f.leagueCode === enrichedCurrentLeague.code))).length;

  // ── Render guards ─────────────────────────────────────────
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-xs mt-4 font-bold tracking-wider uppercase animate-pulse">Iniciando Mundialito...</span>
      </div>
    );
  }

  if (profileError && authUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-rose-400 rounded-2xl flex items-center justify-center text-3xl mb-4">📶</div>
        <h2 className="text-xl font-bold text-white mb-2">Conexión Interrumpida</h2>
        <p className="text-sm text-slate-400 max-w-md mb-4 leading-relaxed">No pudimos cargar tu perfil. Verifica tu conexión.</p>
        <div className="text-xs text-rose-400 font-mono mb-6 bg-slate-900 border border-slate-800 rounded p-3 max-w-sm">Error: {profileError}</div>
        <div className="flex justify-center gap-3">
          <button onClick={() => setRetryTrigger(p => p + 1)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">Reintentar</button>
          <button onClick={handleLogout} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer">Cerrar Sesión</button>
        </div>
      </div>
    );
  }

  if (!authUser || !currentUser) return <AuthScreen onAuthSuccess={() => {}} />;

  // ── Onboarding: show before main app ─────────────────────
  if (showOnboarding) {
    return <OnboardingScreen currentUser={currentUser} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">

      {/* Force Bootstrap Modal */}
      {showForceBootstrap && (
        <ForceBootstrap onDone={() => { setShowForceBootstrap(false); window.location.reload(); }} />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          currentUser={currentUser}
          onClose={() => setShowEditProfile(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-xl border-b border-indigo-950/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md border border-indigo-400">⚽</div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              MUNDIALITO
              <span className="text-[10px] bg-indigo-500 font-bold px-1.5 py-0.5 rounded tracking-widest text-indigo-100 font-mono">2026</span>
            </h1>
          </div>

          <nav className="flex flex-wrap gap-1 bg-slate-850 p-1.5 rounded-xl border border-slate-800">
            {[
              { id: 'calendar', label: 'Partidos', icon: <Calendar className="w-4 h-4" /> },
              { id: 'leaderboard', label: 'Clasificación', icon: <Trophy className="w-4 h-4" /> },
              { id: 'leagues', label: 'Mi Cuenta / Ligas', icon: <Users className="w-4 h-4" /> },
              { id: 'sandbox', label: 'Reglas de Puntos', icon: <BookOpen className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
            {isRealAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin' ? 'bg-rose-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />Admin Resultados
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800/80 cursor-pointer ml-1" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="bg-indigo-700 text-white py-6 shadow-inner relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 select-none text-9xl">⚽</div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

            {/* User info + edit button */}
            <div className="flex items-center gap-3.5">
              <span className="text-4xl filter drop-shadow-md">{currentUser.avatar}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">¡Hola, {currentUser.name}!</h2>
                  {/* ✅ Botón editar perfil */}
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer group"
                    title="Editar perfil"
                  >
                    <Pencil className="w-3 h-3 text-indigo-200 group-hover:text-white" />
                  </button>
                  {currentUser?.isAdmin && false && (
                    <button
                      onClick={() => setShowForceBootstrap(true)}
                      className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 text-[10px] font-bold transition-all cursor-pointer border border-amber-500/30"
                    >
                      🔧 Cargar DB
                    </button>
                  )}
                </div>
                <span className="text-xs text-indigo-200 mt-0.5 block">
                  Jugando en: <strong className="text-white underline animate-pulse">
                    {enrichedCurrentLeague ? enrichedCurrentLeague.name : '⚠️ Sin Liga Activa'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
              {isRealAdmin ? (
                <>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border}`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Participantes</span>
                    <span className="text-xl font-black font-mono text-white">
                      {currentStats.length}
                      <span className={`text-xs font-normal ${modeTheme.accentText} ml-1`}>miembros</span>
                    </span>
                  </div>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border}`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Pozo Recaudado</span>
                    <span className="text-xl font-black font-mono text-emerald-355 text-emerald-400">
                      ${currentLeague ? currentLeague.members.length * (currentLeague.costPerEntry || 0) : 0}
                      <span className={`text-xs font-normal ${modeTheme.accentText} ml-0.5`}> USD</span>
                    </span>
                  </div>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border} col-span-2 sm:col-span-1`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Partidos Jugados</span>
                    <span className="text-xl font-black font-mono text-amber-300">
                      {matches.filter(m => m.status === 'finished').length}
                      <span className={`text-xs font-normal ${modeTheme.accentText} ml-1`}>/ {totalMatchesLoaded}</span>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border}`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Puesto en Liga</span>
                    <span className="text-xl font-black font-mono">
                      {myRank > 0 ? `#${myRank}` : 'S/C'}
                      <span className={`text-xs font-normal ${modeTheme.accentText} ml-1`}>de {currentStats.length}</span>
                    </span>
                  </div>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border}`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Tus Pronósticos</span>
                    <span className="text-xl font-black font-mono">
                      {totalPredictionMade}
                      <span className={`text-xs font-normal ${modeTheme.accentText}`}> / {totalMatchesLoaded}</span>
                    </span>
                  </div>
                  <div className={`p-3 ${modeTheme.bg} rounded-xl border ${modeTheme.border} col-span-2 sm:col-span-1`}>
                    <span className={`text-[10px] ${modeTheme.text} uppercase font-bold tracking-wider block`}>Puntos Acumulados</span>
                    <span className="text-xl font-black font-mono text-amber-300">
                      {currentStats.find(s => s.userId === currentUser?.id)?.totalPoints ?? 0}
                      <span className={`text-xs font-normal ${modeTheme.accentText} ml-0.5`}> Pts</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-8">
          {activeTab === 'calendar' && (
            currentLeague ? (
              <MatchesList
                matches={matches}
                forecasts={forecasts}
                currentUser={currentUserWithAdminFlag!}
                allUsers={users}
                onSaveForecast={handleSaveForecast}
                onUpdateMatchResult={handleUpdateMatchResult}
                currentLeague={enrichedCurrentLeague}
                allLeagues={leagues}
                activePhase={activePhase}
                onChangePhase={setActivePhase}
                leagueMembersData={currentLeagueMembersData}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center max-w-xl mx-auto space-y-4 my-8 animate-fadeIn">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-3xl select-none animate-bounce">
                  ⚠️
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-sans">No tienes ligas activas</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-md mx-auto">
                  Para poder registrar tus pronósticos y competir con tus amigos, necesitas ser miembro de al menos una liga activa.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('leagues')}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Ir a Mi Cuenta / Ligas
                  </button>
                </div>
              </div>
            )
          )}
          {activeTab === 'leaderboard' && (
            currentLeague ? (
              <Leaderboard stats={currentStats} currentUser={currentUserWithAdminFlag!} matches={matches} forecasts={forecasts} users={users} currentLeague={enrichedCurrentLeague} activePhase={activePhase} onChangePhase={setActivePhase} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center max-w-xl mx-auto space-y-4 my-8 animate-fadeIn">
                <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-3xl select-none animate-bounce">
                  ⚠️
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-sans">No tienes ligas activas</h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-md mx-auto">
                  Para poder visualizar la tabla de posiciones y la distribución del pozo de premios, necesitas pertenecer a una liga.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('leagues')}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Ir a Mi Cuenta / Ligas
                  </button>
                </div>
              </div>
            )
          )}
          {activeTab === 'leagues' && (
            <LeagueSelector
              currentUser={currentUserWithAdminFlag!}
              allUsers={users}
              currentLeague={enrichedCurrentLeague}
              allLeagues={enrichedLeagues}
              onSelectUser={handleSelectSimulatedProfile}
              onSelectLeague={l => setCurrentLeague(l)}
              onAddUser={handleAddUser}
              onAddLeague={handleAddLeague}
              onJoinLeague={handleJoinLeague}
              onSavePaymentSettings={handleSavePaymentSettings}
              onSubmitVoucher={handleSubmitVoucher}
              memberInfo={currentMemberInfo || undefined}
              onLeaveLeague={handleLeaveLeague}
              leagueMembersData={currentLeagueMembersData}
              realUserId={authUser?.uid}
              realUserEmail={authUser?.email || ''}
              onUpdateMemberPayment={handleUpdateMemberPayment}
              onRemoveMember={handleRemoveMember}
            />
          )}
          {activeTab === 'sandbox' && <InteractiveSandbox />}
          {activeTab === 'admin' && isRealAdmin && (
            <AdminPanel
              matches={matches}
              onUpdateMatchResult={handleUpdateMatchResult}
              onResetAllData={handleResetData}
              onTriggerBootstrap={() => setShowForceBootstrap(true)}
              leagues={enrichedLeagues}
              onDeleteLeague={handleDeleteLeague}
              onUpdateLeagueName={handleUpdateLeagueName}
              pendingPayments={pendingPayments}
              allUsers={users}
              onApprovePayment={handleApprovePayment}
              onRejectPayment={handleRejectPayment}
              currentLeague={enrichedCurrentLeague}
              onSaveUserForecast={handleSaveUserForecast}
              onSyncMatchesFromAPI={handleSyncMatchesFromAPI}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <div className="bg-slate-100 border-t border-slate-200/60 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 flex-wrap">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Mundial 2026: Pronósticos sincronizados en tiempo real con Firestore.</span>
          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-bold font-mono text-[10px]">
            Sesión: {authUser?.email || 'Desconectado'} ({isRealAdmin ? 'Admin 👑' : 'Usuario 👤'})
          </span>
        </span>
        <span className="text-[10px] text-slate-400 font-mono uppercase">© Mundialito 2026 · Firebase</span>
      </div>
    </div>
  );
}