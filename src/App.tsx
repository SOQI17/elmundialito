import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MATCHES, 
  INITIAL_LEAGUES 
} from './data';
import { Match, Forecast, UserProfile, League, UserStats } from './types';
import { calculateScore } from './utils/scoring';

// Firebase core imports
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp, 
  deleteDoc 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

// Icon imports
import { 
  Trophy, 
  Calendar, 
  Settings, 
  Lightbulb, 
  Code2, 
  Users, 
  TrendingUp, 
  LogOut,
  Sparkles
} from 'lucide-react';

// Subcomponents imports
import LeagueSelector from './components/LeagueSelector';
import MatchesList from './components/MatchesList';
import Leaderboard from './components/Leaderboard';
import InteractiveSandbox from './components/InteractiveSandbox';
import SchemaAndArchitecture from './components/SchemaAndArchitecture';
import AdminPanel from './components/AdminPanel';
import AuthScreen from './components/AuthScreen';

export default function App() {
  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<'leagues' | 'calendar' | 'leaderboard' | 'sandbox' | 'docs' | 'admin'>('calendar');

  // Authentication State
  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [offlineModeActive, setOfflineModeActive] = useState(false);

  // Core App States (synchronized with Firestore)
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);

  // Track map of members for each league to calculate counts / memberships
  const [leaguesMembersMap, setLeaguesMembersMap] = useState<Record<string, string[]>>({});

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        setProfileError(null);
        // Fetch or create public user profile document in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          let profile: UserProfile;

          if (!docSnap.exists()) {
            profile = {
              id: user.uid,
              name: user.displayName || 'Invitado Mundialista',
              avatar: '⚽',
              isAdmin: user.email === 'alexisguerra9577@gmail.com' // Custom admin bootstrap
            };
            try {
              await setDoc(userDocRef, profile);
              
              // Set up private PII info
              await setDoc(doc(db, 'users', user.uid, 'private', 'info'), {
                email: user.email || '',
                joinedAt: new Date().toISOString()
              });
            } catch (writeErr) {
              console.warn("Could not write initial profile under offline conditions:", writeErr);
            }
          } else {
            profile = { id: docSnap.id, ...(docSnap.data() as UserProfile) };
            // Force admin if they have the configured admin email
            if (user.email === 'alexisguerra95775@gmail.com' || user.email === 'alexisguerra9577@gmail.com') {
              if (!profile.isAdmin) {
                profile.isAdmin = true;
                try {
                  await setDoc(userDocRef, { isAdmin: true }, { merge: true });
                } catch (writeErr) {
                  console.warn("Could not write admin update under offline conditions:", writeErr);
                }
              }
            }
          }
          setCurrentUser(profile);
          setProfileError(null);
          setOfflineModeActive(false);
        } catch (err: any) {
          console.warn('Error loading profile - falling back to offline mode profile:', err);
          // If Firestore is offline or permission is denied, use a smart local fallback profile from Auth data!
          const fallbackProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Invitado Mundialista',
            avatar: '⚽',
            isAdmin: user.email === 'alexisguerra9577@gmail.com' || user.email === 'alexisguerra95775@gmail.com',
            isOfflineFallback: true
          };
          setCurrentUser(fallbackProfile);
          setOfflineModeActive(true);
          setProfileError(null); // Clear blocking error since we fall back gracefully!
        }
      } else {
        setCurrentUser(null);
        setProfileError(null);
        setOfflineModeActive(false);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [retryTrigger]);

  // 2. Real-time Users Profile Sync
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        uData.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(uData);
    }, (err) => {
      console.warn('Real-time Users Profile Sync is offline:', err);
      setOfflineModeActive(true);
      // Fallback: Populate users array with at least the current logged-in user
      if (currentUser) {
        setUsers((prev) => prev.length === 0 ? [currentUser] : prev);
      }
    });

    return () => unsubscribe();
  }, [authUser, currentUser]);

  // 3. Real-time Matches Sync & Self-Healing Bootstrapper
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'matches'), async (snapshot) => {
      if (snapshot.empty || snapshot.size < INITIAL_MATCHES.length) {
        // If matches DB is fresh or incomplete, automatically bootstrap/repair missing matches
        console.log('Bootstrapping/repairing real World Cup 2026 matches in Firestore...');
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        for (const match of INITIAL_MATCHES) {
          if (!existingIds.has(match.id)) {
            try {
              await setDoc(doc(db, 'matches', match.id), match);
            } catch (e) {
              console.error('Bootstrapping error:', e);
            }
          }
        }
        if (snapshot.empty) return;
      }

      const mData: Match[] = [];
      snapshot.forEach((doc) => {
        mData.push({ id: doc.id, ...doc.data() } as Match);
      });
      
      // Sort matches chronologically
      mData.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      setMatches(mData);
    }, (err) => {
      console.warn('Real-time Matches Sync is offline, falling back to INITIAL_MATCHES:', err);
      setOfflineModeActive(true);
      setMatches((prev) => prev.length === 0 ? INITIAL_MATCHES : prev);
    });

    return () => unsubscribe();
  }, [authUser]);

  // 4. Real-time Forecasts Sync
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'forecasts'), (snapshot) => {
      const fData: Forecast[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let updatedAtStr = '';
        if (data.updatedAt) {
          if (typeof data.updatedAt.toDate === 'function') {
            updatedAtStr = data.updatedAt.toDate().toISOString();
          } else {
            updatedAtStr = String(data.updatedAt);
          }
        }
        fData.push({
          matchId: data.matchId,
          userId: data.userId,
          homeScore: Number(data.homeScore),
          awayScore: Number(data.awayScore),
          updatedAt: updatedAtStr
        });
      });

      // Merge with localStorage backups so we never lose/overwrite unsynced local data on refresh
      if (currentUser) {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`offline_forecast_${currentUser.id}_`)) {
              const matchId = key.replace(`offline_forecast_${currentUser.id}_`, '');
              const val = localStorage.getItem(key);
              if (val) {
                const parsed = JSON.parse(val);
                const idx = fData.findIndex(f => f.matchId === matchId && f.userId === currentUser.id);
                if (idx > -1) {
                  const serverF = fData[idx];
                  const serverTime = serverF.updatedAt ? new Date(serverF.updatedAt).getTime() : 0;
                  const localTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : 0;
                  if (localTime > serverTime) {
                    fData[idx] = {
                      matchId,
                      userId: currentUser.id,
                      homeScore: Number(parsed.homeScore),
                      awayScore: Number(parsed.awayScore),
                      updatedAt: parsed.updatedAt
                    };
                  }
                } else {
                  fData.push({
                    matchId,
                    userId: currentUser.id,
                    homeScore: Number(parsed.homeScore),
                    awayScore: Number(parsed.awayScore),
                    updatedAt: parsed.updatedAt
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn('Error merging with local offline forecasts:', e);
        }
      }

      setForecasts(fData);
    }, (err) => {
      console.warn('Real-time Forecasts observer is offline. Using local states.', err);
      setOfflineModeActive(true);
    });

    return () => unsubscribe();
  }, [authUser, currentUser]);

  // Migrate any legacy forecasts written with undefined userId in localStorage to the actual user ID
  useEffect(() => {
    if (!currentUser || !currentUser.id || currentUser.id === 'undefined') return;
    try {
      const keysToMigrate: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('offline_forecast_undefined_')) {
          keysToMigrate.push(key);
        }
      }
      keysToMigrate.forEach(async (oldKey) => {
        const matchId = oldKey.replace('offline_forecast_undefined_', '');
        const val = localStorage.getItem(oldKey);
        if (val) {
          const newKey = `offline_forecast_${currentUser.id}_${matchId}`;
          localStorage.setItem(newKey, val);
          localStorage.removeItem(oldKey);
          
          // Also try to push to Firestore asynchronously
          const parsed = JSON.parse(val);
          const forecastId = `${matchId}_${currentUser.id}`;
          try {
            await setDoc(doc(db, 'forecasts', forecastId), {
              matchId,
              userId: currentUser.id,
              homeScore: Number(parsed.homeScore),
              awayScore: Number(parsed.awayScore),
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.warn(`Migration database sync warning for ${forecastId}:`, err);
          }
        }
      });
    } catch (e) {
      console.warn("Error running local forecast migration:", e);
    }
  }, [currentUser]);

  // Synchronize localStorage backup forecasts as a secondary local cache
  useEffect(() => {
    if (!currentUser) return;
    const loadedOfflineForecasts: Forecast[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`offline_forecast_${currentUser.id}_`)) {
          const matchId = key.replace(`offline_forecast_${currentUser.id}_`, '');
          const val = localStorage.getItem(key);
          if (val) {
            const parsed = JSON.parse(val);
            loadedOfflineForecasts.push({
              matchId,
              userId: currentUser.id,
              homeScore: Number(parsed.homeScore),
              awayScore: Number(parsed.awayScore),
              updatedAt: parsed.updatedAt
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading offline local storage forecasts:', e);
    }

    if (loadedOfflineForecasts.length > 0) {
      setForecasts((prev) => {
        const merged = [...prev];
        loadedOfflineForecasts.forEach((offlineF) => {
          const exists = prev.some(f => f.matchId === offlineF.matchId && f.userId === offlineF.userId);
          if (!exists) {
            merged.push(offlineF);
          }
        });
        return merged;
      });
    }
  }, [currentUser, forecasts.length === 0]);

  // 5. Real-time Leagues & Bootstrap if empty
  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = onSnapshot(collection(db, 'leagues'), async (snapshot) => {
      if (snapshot.empty) {
        // Bootstrap standard demo leagues
        for (const l of INITIAL_LEAGUES) {
          try {
            await setDoc(doc(db, 'leagues', l.code), {
              code: l.code,
              name: l.name,
              creatorId: l.creatorId
            });
            // Populate memberships too
            for (const memberId of l.members) {
              await setDoc(doc(db, 'leagues', l.code, 'members', memberId), {
                userId: memberId,
                leagueCode: l.code,
                joinedAt: new Date().toISOString()
              });
            }
          } catch (e) {
            console.error('Leagues bootstrapping error:', e);
          }
        }
        return;
      }

      const lData: League[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        lData.push({
          code: data.code,
          name: data.name,
          creatorId: data.creatorId,
          members: [] // Filled dynamically by members state map
        });
      });
      setLeagues(lData);
    }, (err) => {
      console.warn('Real-time Leagues observer is offline, falling back to INITIAL_LEAGUES:', err);
      setOfflineModeActive(true);
      if (leagues.length === 0) {
        const enriched = INITIAL_LEAGUES.map(l => ({
          code: l.code,
          name: l.name,
          creatorId: l.creatorId,
          members: l.members
        }));
        setLeagues(enriched);
      }
    });

    return () => unsubscribe();
  }, [authUser]);

  // 6. Monitor membership lists for ALL loaded leagues recursively
  useEffect(() => {
    if (leagues.length === 0) return;

    const unsubs = leagues.map((league) => {
      return onSnapshot(collection(db, 'leagues', league.code, 'members'), (snapshot) => {
        const memberIds = snapshot.docs.map(doc => doc.id);
        setLeaguesMembersMap((prev) => ({
          ...prev,
          [league.code]: memberIds
        }));
      }, (err) => {
        console.warn(`Leagues permissions or connectivity failed for league ${league.code}:`, err);
      });
    });

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [leagues]);


  // --- Event Handlers directly writing into Firestore ---

  // Triggered from Profile Selector simulator
  const handleSelectSimulatedProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
  };

  // Agregar nuevo usuario (local / simulación rápida, en firestore escribe perfil)
  const handleAddUser = async (name: string, avatar: string) => {
    const fakeId = `U_${Date.now()}`;
    const newProfile: UserProfile = {
      id: fakeId,
      name,
      avatar,
      isAdmin: false
    };

    try {
      await setDoc(doc(db, 'users', fakeId), newProfile);
      setCurrentUser(newProfile);

      // Auto-join current selected league for testing convenience
      if (currentLeague) {
        await setDoc(doc(db, 'leagues', currentLeague.code, 'members', fakeId), {
          userId: fakeId,
          leagueCode: currentLeague.code,
          joinedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fakeId}`);
    }
  };

  // Crear nueva liga
  const handleAddLeague = async (name: string, code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const codeUpper = code.toUpperCase();

    try {
      const docRef = doc(db, 'leagues', codeUpper);
      const snap = await getDoc(docRef);
      if (snap.exists()) return false; // Code taken

      await setDoc(docRef, {
        code: codeUpper,
        name,
        creatorId: currentUser.id
      });

      // Join creator instantly
      await setDoc(doc(db, 'leagues', codeUpper, 'members', currentUser.id), {
        userId: currentUser.id,
        leagueCode: codeUpper,
        joinedAt: new Date().toISOString()
      });

      setCurrentLeague({
        code: codeUpper,
        name,
        creatorId: currentUser.id,
        members: [currentUser.id]
      });

      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${codeUpper}`);
      return false;
    }
  };

  // Unirse a una liga existente con código
  const handleJoinLeague = async (code: string): Promise<boolean> => {
    if (!currentUser) return false;
    const codeUpper = code.toUpperCase();

    try {
      const leagueRef = doc(db, 'leagues', codeUpper);
      const leagueSnap = await getDoc(leagueRef);
      if (!leagueSnap.exists()) return false;

      // Join participant inside subcollection
      await setDoc(doc(db, 'leagues', codeUpper, 'members', currentUser.id), {
        userId: currentUser.id,
        leagueCode: codeUpper,
        joinedAt: new Date().toISOString()
      });

      const data = leagueSnap.data();
      const loaded: League = {
        code: codeUpper,
        name: data.name,
        creatorId: data.creatorId,
        members: [] // populated list on the run
      };
      
      setCurrentLeague(loaded);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `leagues/${codeUpper}/members/${currentUser.id}`);
      return false;
    }
  };

  // Guardar/actualizar pronóstico del usuario actual
  const handleSaveForecast = async (matchId: string, homeScore: number, awayScore: number) => {
    if (!currentUser) return;
    const forecastId = `${matchId}_${currentUser.id}`;
    const nowIso = new Date().toISOString();

    const localForecast: Forecast = {
      matchId,
      userId: currentUser.id,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      updatedAt: nowIso
    };

    // 1. Instantly update reactive state so there's zero delay for the user
    setForecasts((prev) => {
      const idx = prev.findIndex(f => f.matchId === matchId && f.userId === currentUser.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = localForecast;
        return next;
      }
      return [...prev, localForecast];
    });

    // 2. Instantly persist in localStorage under the user account key
    try {
      localStorage.setItem(
        `offline_forecast_${currentUser.id}_${matchId}`,
        JSON.stringify({
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          updatedAt: nowIso
        })
      );
    } catch (e) {
      console.warn("Could not save backup forecast to localStorage:", e);
    }

    // 3. Write asynchronously to Firestore for sharing it with group members
    try {
      await setDoc(doc(db, 'forecasts', forecastId), {
        matchId,
        userId: currentUser.id,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        updatedAt: serverTimestamp() // Synced with server
      });
    } catch (err) {
      console.warn("Could not write forecast to Firestore, relying on local backup:", err);
      handleFirestoreError(err, OperationType.WRITE, `forecasts/${forecastId}`);
    }
  };

  // Actualizar marcador de la consola de administración o simulador en vivo
  const handleUpdateMatchResult = async (
    matchId: string, 
    homeScore: number | undefined, 
    awayScore: number | undefined, 
    status: Match['status'],
    mode?: Match['mode'],
    liveStartTimestamp?: number,
    incidents?: Match['incidents']
  ) => {
    try {
      const updateData: any = {
        homeScore: homeScore !== undefined ? Number(homeScore) : undefined,
        awayScore: awayScore !== undefined ? Number(awayScore) : undefined,
        status
      };
      if (mode !== undefined) updateData.mode = mode;
      if (liveStartTimestamp !== undefined) updateData.liveStartTimestamp = liveStartTimestamp;
      if (incidents !== undefined) updateData.incidents = incidents;

      await setDoc(doc(db, 'matches', matchId), updateData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `matches/${matchId}`);
    }
  };

  // Resetear o repoblar base de datos de simulación
  const handleResetData = async () => {
    // Delete and bootstrap back with original games
    try {
      // Loop through matches and reset scores
      for (const m of matches) {
        await setDoc(doc(db, 'matches', m.id), {
          homeScore: undefined,
          awayScore: undefined,
          status: 'scheduled'
        }, { merge: true });
      }

      // Clear forecasts
      for (const f of forecasts) {
        await deleteDoc(doc(db, 'forecasts', `${f.matchId}_${f.userId}`));
      }

      // Clear local offline fallback cache as well
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('offline_forecast_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (localErr) {
        console.warn('Error clearing offline local matches cache:', localErr);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bulk-reset');
    }
  };

  // Log out of the application
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };


  // --- COMPUTATIONS FOR THE LEADERBOARD ---

  const calculateLeaderboardStats = (): UserStats[] => {
    if (!currentUser) return [];

    // Ensure active participants is initialized as a copy of users
    const activeParticipantsMap = new Map<string, UserProfile>();
    
    // Add all registered users
    if (users && users.length > 0) {
      users.forEach(u => {
        if (u && u.id) activeParticipantsMap.set(u.id, u);
      });
    }

    // Make sure currentUser is always included
    if (currentUser && currentUser.id) {
      activeParticipantsMap.set(currentUser.id, currentUser);
    }

    // Identify all unique userIds that have submitted forecasts
    if (forecasts && forecasts.length > 0) {
      forecasts.forEach((f) => {
        if (f && f.userId && f.userId !== 'undefined' && !activeParticipantsMap.has(f.userId)) {
          // Find if this is a known user from our static data or construct a placeholder
          const placeholderName = f.userId === currentUser?.id 
            ? currentUser.name 
            : `Participante (${f.userId.substring(0, 5)})`;
          const placeholderAvatar = f.userId === currentUser?.id
            ? currentUser.avatar
            : '👤';
            
          activeParticipantsMap.set(f.userId, {
            id: f.userId,
            name: placeholderName,
            avatar: placeholderAvatar
          });
        }
      });
    }

    let activeParticipants = Array.from(activeParticipantsMap.values());

    // Filter active users based on the selected league
    if (currentLeague) {
      const activeMemberIds = leaguesMembersMap[currentLeague.code] || [];
      // Always keep the currentUser even if the member list hasn't fully loaded
      activeParticipants = activeParticipants.filter(u => 
        activeMemberIds.includes(u.id) || u.id === currentUser.id
      );
    }

    // Map each participant calculations based on matches scores
    const leaderboard: UserStats[] = activeParticipants.map((user) => {
      let exactMatchesCount = 0;
      let trendMatchesCount = 0;
      let simpleMatchesCount = 0;
      let noMatchesCount = 0;
      let totalPoints = 0;
      let pendingMatchesCount = 0;

      matches.forEach((match) => {
        if (match.status === 'finished' && match.homeScore !== undefined && match.awayScore !== undefined) {
          const forecast = forecasts.find(f => f.matchId === match.id && f.userId === user.id);
          
          if (forecast) {
            const result = calculateScore(match.homeScore, match.awayScore, forecast.homeScore, forecast.awayScore);
            totalPoints += result.score;
            
            if (result.category === 'perfect') exactMatchesCount++;
            else if (result.category === 'trend') trendMatchesCount++;
            else if (result.category === 'simple') simpleMatchesCount++;
            else if (result.category === 'none') noMatchesCount++;
          } else {
            noMatchesCount++;
          }
        } else {
          const forecast = forecasts.find(f => f.matchId === match.id && f.userId === user.id);
          if (forecast) {
            pendingMatchesCount++;
          }
        }
      });

      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        exactMatchesCount,
        trendMatchesCount,
        simpleMatchesCount,
        noMatchesCount,
        totalPoints,
        pendingMatchesCount
      };
    });

    // Sort: total points descending, then exact, then trends
    return leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactMatchesCount !== a.exactMatchesCount) {
        return b.exactMatchesCount - a.exactMatchesCount;
      }
      return b.trendMatchesCount - a.trendMatchesCount;
    });
  };

  // Enrich Leagues object arrays with resolved members lists
  const enrichedLeagues = leagues.map(l => ({
    ...l,
    members: leaguesMembersMap[l.code] || []
  }));

  const enrichedCurrentLeague = currentLeague
    ? { ...currentLeague, members: leaguesMembersMap[currentLeague.code] || [] }
    : null;

  const currentStats = calculateLeaderboardStats();
  const myRank = currentStats.findIndex(s => s.userId === currentUser?.id) + 1;
  const totalMatchesLoaded = matches.length;
  const totalPredictionMade = matches.filter(m => forecasts.some(f => f.matchId === m.id && f.userId === currentUser?.id)).length;

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 text-xs mt-4 font-bold tracking-wider uppercase animate-pulse">
          Iniciando Mundialito...
        </span>
      </div>
    );
  }

  // Display connection offline / database handshake errors with retry triggers
  if (profileError && authUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-rose-450 text-rose-400 rounded-2xl flex items-center justify-center text-3xl mb-4">
          📶
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Conexión con Firebase Interrumpida</h2>
        <p className="text-sm text-slate-400 max-w-md mb-4 leading-relaxed">
          No pudimos cargar la información de tu perfil debido a un problema de conexión a internet o de base de datos.
        </p>
        <div className="text-xs text-rose-400 font-mono mb-6 bg-slate-900 border border-slate-800 rounded p-3 text-left overflow-x-auto max-w-sm mx-auto select-all">
          Error: {profileError}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setRetryTrigger(prev => prev + 1)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
          >
            Reintentar Conexión
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  // If no active authenticated profile session exists, show sign in / registration landing
  if (!authUser || !currentUser) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased">
      
      {/* Top Header */}
      <header className="bg-slate-900 text-white shadow-xl border-b border-indigo-950/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md border border-indigo-400">
              ⚽
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-sans flex items-center gap-2">
                MUNDIALITO 
                <span className="text-[10px] bg-indigo-500 font-bold px-1.5 py-0.5 rounded-xs tracking-widest text-indigo-100 font-mono">2026</span>
              </h1>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex flex-wrap gap-1 bg-slate-850 p-1.5 rounded-xl border border-slate-800">
            <button
              id="top-nav-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Partidos
            </button>
            <button
              id="top-nav-leaderboard"
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Clasificación
            </button>
            <button
              id="top-nav-leagues"
              onClick={() => setActiveTab('leagues')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'leagues' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Mi Cuenta / Ligas
            </button>
            <button
              id="top-nav-sandbox"
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'sandbox' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Simular Puntos
            </button>
            <button
              id="top-nav-docs"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'docs' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Esquema / Lógica
            </button>
            {currentUser?.isAdmin && (
              <button
                id="top-nav-admin"
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'admin' ? 'bg-rose-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Admin Resultados
              </button>
            )}
            
            {/* Real Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-lg text-rose-455 text-rose-400 hover:text-rose-300 hover:bg-slate-800/80 cursor-pointer ml-1"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Stats Panel */}
      <section className="bg-indigo-700 text-white py-6 shadow-inner relative overflow-hidden" id="hero-statistics-banner">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12 select-none text-9xl">⚽</div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div className="flex items-center gap-3.5">
              <span className="text-4xl filter drop-shadow-md">{currentUser.avatar}</span>
              <div>
                <h2 className="text-lg font-bold font-sans flex items-center gap-1.5">
                  ¡Hola, {currentUser.name}!
                </h2>
                <span className="text-xs text-indigo-200 mt-1 block">
                  Jugando en: <strong className="text-white underline">{enrichedCurrentLeague ? enrichedCurrentLeague.name : 'Clasificación Global 🌍'}</strong>
                </span>
              </div>
            </div>

            {/* Dyn stats */}
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
                  {(() => {
                    const myStats = currentStats.find(s => s.userId === currentUser.id);
                    return myStats ? myStats.totalPoints : 0;
                  })()}
                  <span className="text-xs font-normal text-indigo-300 ml-0.5"> Pts</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-8" id="tab-outlet-container">
          {activeTab === 'calendar' && (
            <MatchesList 
              matches={matches}
              forecasts={forecasts}
              currentUser={currentUser}
              allUsers={users}
              onSaveForecast={handleSaveForecast}
              onUpdateMatchResult={handleUpdateMatchResult}
            />
          )}

          {activeTab === 'leaderboard' && (
            <Leaderboard 
              stats={currentStats}
              currentUser={currentUser}
              matches={matches}
              forecasts={forecasts}
              users={users}
              currentLeague={enrichedCurrentLeague}
            />
          )}

          {activeTab === 'leagues' && (
            <LeagueSelector 
              currentUser={currentUser}
              allUsers={users}
              currentLeague={enrichedCurrentLeague}
              allLeagues={enrichedLeagues}
              onSelectUser={handleSelectSimulatedProfile}
              onSelectLeague={(l) => setCurrentLeague(l)}
              onAddUser={handleAddUser}
              onAddLeague={handleAddLeague}
              onJoinLeague={handleJoinLeague}
            />
          )}

          {activeTab === 'sandbox' && (
            <InteractiveSandbox />
          )}

          {activeTab === 'docs' && (
            <SchemaAndArchitecture />
          )}

          {activeTab === 'admin' && currentUser?.isAdmin && (
            <AdminPanel 
              matches={matches}
              onUpdateMatchResult={handleUpdateMatchResult}
              onResetAllData={handleResetData}
            />
          )}
        </div>
      </main>

      {/* Footer info banner */}
      <div className="bg-slate-100 border-t border-slate-200/60 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-emerald-600 inline shrink-0" />
          <span>Mundial 2026: Jugando con la base de datos real de Firestore. ¡Goles y posiciones se sincronizan al instante!</span>
        </span>
        <span className="text-[10px] text-slate-400 font-mono uppercase">© Mundialito 2026 - Conexión Firebase Estable</span>
      </div>

    </div>
  );
}
