import React, { useState, useEffect } from 'react';
import { INITIAL_MATCHES, INITIAL_LEAGUES } from './data';
import { Match, Forecast, UserProfile, League, UserStats, LeagueMemberInfo } from './types';
import { calculateScore } from './utils/scoring';

import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

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
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [leaguesMembersMap, setLeaguesMembersMap] = useState<Record<string, string[]>>({});
  const [currentMemberInfo, setCurrentMemberInfo] = useState<LeagueMemberInfo | null>(null);
  const [currentLeagueMembersData, setCurrentLeagueMembersData] = useState<LeagueMemberInfo[]>([]);
  const [pendingPayments, setPendingPayments] = useState<LeagueMemberInfo[]>([]);

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
              isAdmin: user.email === ADMIN_EMAIL,
              onboarded: false,
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
            if (user.email === ADMIN_EMAIL && !profile.isAdmin) {
              profile.isAdmin = true;
              try { await setDoc(userDocRef, { isAdmin: true }, { merge: true }); } catch (_) {}
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
            isAdmin: user.email === ADMIN_EMAIL,
            isOfflineFallback: true,
            onboarded: true, // skip onboarding in offline mode
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
        fData.push({ matchId: data.matchId, userId: data.userId, homeScore: Number(data.homeScore), awayScore: Number(data.awayScore), updatedAt: updatedAtStr });
      });

      if (currentUser) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`offline_forecast_${currentUser.id}_`)) {
              const matchId = key.replace(`offline_forecast_${currentUser.id}_`, '');
              const val = localStorage.getItem(key);
              if (val) {
                const parsed = JSON.parse(val);
                const idx = fData.findIndex(f => f.matchId === matchId && f.userId === currentUser.id);
                if (idx > -1) {
                  const st = fData[idx].updatedAt ? new Date(fData[idx].updatedAt).getTime() : 0;
                  const lt = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
                  if (lt > st) fData[idx] = { matchId, userId: currentUser.id, homeScore: Number(parsed.homeScore), awayScore: Number(parsed.awayScore), updatedAt: parsed.updatedAt };
                } else {
                  fData.push({ matchId, userId: currentUser.id, homeScore: Number(parsed.homeScore), awayScore: Number(parsed.awayScore), updatedAt: parsed.updatedAt });
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
          const matchId = key.replace(`offline_forecast_${currentUser.id}_`, '');
          const val = localStorage.getItem(key);
          if (val) {
            const p = JSON.parse(val);
            offline.push({ matchId, userId: currentUser.id, homeScore: Number(p.homeScore), awayScore: Number(p.awayScore), updatedAt: p.updatedAt });
          }
        }
      }
    } catch (e) { console.error(e); }
    if (offline.length > 0) {
      setForecasts(prev => {
        const merged = [...prev];
        offline.forEach(o => { if (!prev.some(f => f.matchId === o.matchId && f.userId === o.userId)) merged.push(o); });
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
        lData.push({ code: data.code, name: data.name, creatorId: data.creatorId, members: [], bankConfig: data.bankConfig, costPerEntry: data.costPerEntry });
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
          paymentCode: data.paymentCode
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
          paymentCode: d.paymentCode
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
    if (!currentUser) return;
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const isLocked = match.status === 'live' || match.status === 'finished' || new Date().getTime() >= new Date(match.dateTime).getTime();
    if (isLocked) {
      alert("Error: El partido ya ha comenzado. No se pueden registrar ni modificar pronósticos.");
      return;
    }

    const forecastId = `${matchId}_${currentUser.id}`;
    const nowIso = new Date().toISOString();
    const localForecast: Forecast = { matchId, userId: currentUser.id, homeScore: Number(homeScore), awayScore: Number(awayScore), updatedAt: nowIso };
    setForecasts(prev => {
      const idx = prev.findIndex(f => f.matchId === matchId && f.userId === currentUser.id);
      if (idx > -1) { const next = [...prev]; next[idx] = localForecast; return next; }
      return [...prev, localForecast];
    });
    try { localStorage.setItem(`offline_forecast_${currentUser.id}_${matchId}`, JSON.stringify({ homeScore: Number(homeScore), awayScore: Number(awayScore), updatedAt: nowIso })); } catch (_) {}
    try {
      await setDoc(doc(db, 'forecasts', forecastId), { matchId, userId: currentUser.id, homeScore: Number(homeScore), awayScore: Number(awayScore), updatedAt: serverTimestamp() });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `forecasts/${forecastId}`); }
  };

  const handleUpdateMatchResult = async (matchId: string, homeScore: number | undefined, awayScore: number | undefined, status: Match['status'], mode?: Match['mode'], liveStartTimestamp?: number, incidents?: Match['incidents']) => {
    try {
      const updateData: any = { homeScore: homeScore !== undefined ? Number(homeScore) : undefined, awayScore: awayScore !== undefined ? Number(awayScore) : undefined, status };
      if (mode !== undefined) updateData.mode = mode;
      if (liveStartTimestamp !== undefined) updateData.liveStartTimestamp = liveStartTimestamp;
      if (incidents !== undefined) updateData.incidents = incidents;
      await setDoc(doc(db, 'matches', matchId), updateData, { merge: true });
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`); }
  };

  const handleResetData = async () => {
    try {
      for (const m of matches) await setDoc(doc(db, 'matches', m.id), { homeScore: undefined, awayScore: undefined, status: 'scheduled' }, { merge: true });
      for (const f of forecasts) await deleteDoc(doc(db, 'forecasts', `${f.matchId}_${f.userId}`));
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

  const handleSavePaymentSettings = async (bankConfig: League['bankConfig'], costPerEntry: number) => {
    if (!currentLeague) return;
    try {
      await setDoc(doc(db, 'leagues', currentLeague.code), { bankConfig, costPerEntry }, { merge: true });
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

  // ── Leaderboard calc ──────────────────────────────────────
  const calculateLeaderboardStats = (): UserStats[] => {
    if (!currentUser) return [];
    const map = new Map<string, UserProfile>();
    users.forEach(u => { if (u?.id) map.set(u.id, u); });
    if (currentUser?.id) map.set(currentUser.id, currentUser);
    forecasts.forEach(f => {
      if (f?.userId && f.userId !== 'undefined' && !map.has(f.userId)) {
        map.set(f.userId, { id: f.userId, name: f.userId === currentUser?.id ? currentUser.name : `Participante (${f.userId.substring(0,5)})`, avatar: f.userId === currentUser?.id ? currentUser.avatar : '👤' });
      }
    });
    let participants = Array.from(map.values());
    if (currentLeague) {
      const memberIds = leaguesMembersMap[currentLeague.code] || [];
      participants = participants.filter(u => memberIds.includes(u.id));
    }
    return participants.map(user => {
      let exact = 0, trend = 0, simple = 0, none = 0, total = 0, pending = 0;
      matches.forEach(match => {
        if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {
          const f = forecasts.find(f => f.matchId === match.id && f.userId === user.id);
          if (f) {
            const r = calculateScore(match.homeScore, match.awayScore, f.homeScore, f.awayScore);
            total += r.score;
            if (r.category === 'perfect') exact++;
            else if (r.category === 'trend') trend++;
            else if (r.category === 'simple') simple++;
            else none++;
          } else { none++; }
        } else {
          if (forecasts.find(f => f.matchId === match.id && f.userId === user.id)) pending++;
        }
      });
      return { userId: user.id, userName: user.name, userAvatar: user.avatar, exactMatchesCount: exact, trendMatchesCount: trend, simpleMatchesCount: simple, noMatchesCount: none, totalPoints: total, pendingMatchesCount: pending };
    }).sort((a, b) => b.totalPoints - a.totalPoints || b.exactMatchesCount - a.exactMatchesCount || b.trendMatchesCount - a.trendMatchesCount);
  };

  const enrichedLeagues = leagues.map(l => ({ ...l, members: leaguesMembersMap[l.code] || [] }));
  const latestLeagueData = currentLeague ? leagues.find(l => l.code === currentLeague.code) : null;
  const enrichedCurrentLeague = latestLeagueData 
    ? { ...latestLeagueData, members: leaguesMembersMap[latestLeagueData.code] || [] } 
    : null;
  const currentStats = calculateLeaderboardStats();
  const myRank = currentStats.findIndex(s => s.userId === currentUser?.id) + 1;
  const totalMatchesLoaded = matches.length;
  const totalPredictionMade = matches.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser?.id)).length;

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
            {currentUser?.isAdmin && (
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
                  Jugando en: <strong className="text-white underline">
                    {enrichedCurrentLeague ? enrichedCurrentLeague.name : 'Clasificación Global 🌍'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto">
              <div className="p-3 bg-indigo-600/55 rounded-xl border border-indigo-500/30">
                <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider block">Puesto en Liga</span>
                <span className="text-xl font-black font-mono">
                  {myRank > 0 ? `#${myRank}` : 'S/C'}
                  <span className="text-xs font-normal text-indigo-300 ml-1">de {currentStats.length}</span>
                </span>
              </div>
              <div className="p-3 bg-indigo-600/55 rounded-xl border border-indigo-500/30">
                <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider block">Tus Pronósticos</span>
                <span className="text-xl font-black font-mono">
                  {totalPredictionMade}
                  <span className="text-xs font-normal text-indigo-300"> / {totalMatchesLoaded}</span>
                </span>
              </div>
              <div className="p-3 bg-indigo-600/55 rounded-xl border border-indigo-500/30 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider block">Puntos Acumulados</span>
                <span className="text-xl font-black font-mono text-amber-300">
                  {currentStats.find(s => s.userId === currentUser.id)?.totalPoints ?? 0}
                  <span className="text-xs font-normal text-indigo-300 ml-0.5"> Pts</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-8">
          {activeTab === 'calendar' && <MatchesList matches={matches} forecasts={forecasts} currentUser={currentUser} allUsers={users} onSaveForecast={handleSaveForecast} onUpdateMatchResult={handleUpdateMatchResult} />}
          {activeTab === 'leaderboard' && <Leaderboard stats={currentStats} currentUser={currentUser} matches={matches} forecasts={forecasts} users={users} currentLeague={enrichedCurrentLeague} />}
          {activeTab === 'leagues' && (
            <LeagueSelector
              currentUser={currentUser}
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
            />
          )}
          {activeTab === 'sandbox' && <InteractiveSandbox />}
          {activeTab === 'admin' && currentUser?.isAdmin && (
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
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <div className="bg-slate-100 border-t border-slate-200/60 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
          Mundial 2026: Pronósticos sincronizados en tiempo real con Firestore.
        </span>
        <span className="text-[10px] text-slate-400 font-mono uppercase">© Mundialito 2026 · Firebase</span>
      </div>
    </div>
  );
}