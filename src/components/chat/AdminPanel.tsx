'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, ChevronLeft, Shield, Check, CheckCheck, Trash2, Image, Video, Mic, AlertTriangle, Loader2, UserPlus, UserMinus, Search } from 'lucide-react';
import { useRoles } from '@/contexts/RoleContext';
import { doc, updateDoc, onSnapshot, collection, setDoc, getDoc, getDocs } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { UserProfileChat as UserProfile, AdminSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/avatar';

const firebaseConfig = {
  apiKey: "AIzaSyAW6cWb29qnlIS8Hb8RAWlv4KDxgqw-bM8",
  authDomain: "studio-9205859220-a6440.firebaseapp.com",
  projectId: "studio-9205859220-a6440",
  storageBucket: "studio-9205859220-a6440.firebasestorage.app",
  messagingSenderId: "517372546955",
  appId: "1:517372546955:web:f420d5047e9ab05184298e"
};

interface AdminPanelProps {
  onClose: () => void;
  onBack?: () => void;
  currentUser: UserProfile;
}

type MediaType = 'images' | 'videos' | 'audio';

function StorageTab() {
  const [selectedTypes, setSelectedTypes] = useState<MediaType[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({ images: 0, videos: 0, audio: 0 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const toggleMediaType = (type: MediaType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const analyzeStorage = async () => {
    setLoading(true);
    setMessage('Analyse en cours...');
    
    try {
      const { getStorage, ref, listAll } = await import('firebase/storage');
      const { getApps, initializeApp } = await import('firebase/app');
      
      let storageApp = getApps().find((a: any) => a.name === 'messages-storage');
      if (!storageApp) {
        storageApp = initializeApp(firebaseConfig, 'messages-storage');
      }
      
      const storage = getStorage(storageApp);
      
      let images = 0, videos = 0, audio = 0;
      let allItems: string[] = [];
      
      try {
        const rootRef = ref(storage);
        const result = await listAll(rootRef);
        allItems = result.items.map(i => i.fullPath);
        
        for (const item of result.items) {
          const fullPath = item.fullPath.toLowerCase();
          const name = item.name.toLowerCase();
          const ext = (name.split('.').pop() || '').toLowerCase();
          
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'avif'].includes(ext) || 
                        name.includes('image') || name.includes('img_') || name.includes('photo') ||
                        fullPath.includes('/image') || fullPath.includes('/img');
          const isVideo = ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext) || 
                        name.includes('video') || name.includes('vid_') ||
                        fullPath.includes('/video') || fullPath.includes('/vid');
          const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm'].includes(ext) || 
                        name.includes('audio') || name.includes('voice') || name.includes('_recording') ||
                        name.endsWith('.webm') || name.endsWith('.mp3');

          if (isImage) images++;
          else if (isVideo) videos++;
          else if (isAudio) audio++;
        }
        
        console.log('Storage items found:', allItems);
      } catch (err: any) {
        console.log('Storage error:', err?.message || err);
        setMessage('Erreur Storage: Vérifiez les permissions');
      }
      
      setStats({ images, videos, audio });
      setMessage(`Trouvé: ${images} images, ${videos} vidéos, ${audio} audio`);
    } catch (e: any) {
      setMessage('Erreur: ' + e.message);
    }
    
    setLoading(false);
  };
  
  const deleteSelectedMedia = async () => {
    if (selectedTypes.length === 0) return;
    
    setIsDeleting(true);
    setMessage('Suppression en cours...');
    
    try {
      const { getStorage, ref, listAll, deleteObject } = await import('firebase/storage');
      const { getApps, initializeApp } = await import('firebase/app');
      
      let storageApp = getApps().find((a: any) => a.name === 'messages-storage');
      if (!storageApp) {
        storageApp = initializeApp(firebaseConfig, 'messages-storage');
      }
      
      const storage = getStorage(storageApp);
      const chatsRef = ref(storage, 'chats');
      const result = await listAll(chatsRef);
      
      let deleted = 0;
      
      for (const item of result.items) {
        const ext = item.name.split('.').pop()?.toLowerCase();
        
        const shouldDelete = 
          (selectedTypes.includes('images') && (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || item.name.startsWith('img_'))) ||
          (selectedTypes.includes('videos') && (['mp4', 'webm', 'mov'].includes(ext) || item.name.startsWith('vid_'))) ||
          (selectedTypes.includes('audio') && (['webm', 'mp3'].includes(ext) || item.name.startsWith('audio_')));
        
        if (shouldDelete) {
          await deleteObject(item);
          deleted++;
        }
      }
      
      setMessage(`Supprimé: ${deleted} fichiers`);
      setSelectedTypes([]);
    } catch (e: any) {
      setMessage('Erreur: ' + e.message);
    }
    
    setIsDeleting(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => toggleMediaType('images')}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedTypes.includes('images')
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <Image size={24} className={selectedTypes.includes('images') ? "text-blue-400" : "text-white/40"} />
          <span className="font-bold text-xs text-white">Images</span>
          {stats.images > 0 && (
            <span className="text-[10px] text-white/40">{stats.images}</span>
          )}
        </button>
        
        <button
          onClick={() => toggleMediaType('videos')}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedTypes.includes('videos')
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <Video size={24} className={selectedTypes.includes('videos') ? "text-blue-400" : "text-white/40"} />
          <span className="font-bold text-xs text-white">Vidéos</span>
          {stats.videos > 0 && (
            <span className="text-[10px] text-white/40">{stats.videos}</span>
          )}
        </button>
        
        <button
          onClick={() => toggleMediaType('audio')}
          className={cn(
            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
            selectedTypes.includes('audio')
              ? "border-blue-500 bg-blue-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <Mic size={24} className={selectedTypes.includes('audio') ? "text-blue-400" : "text-white/40"} />
          <span className="font-bold text-xs text-white">Audio</span>
          {stats.audio > 0 && (
            <span className="text-[10px] text-white/40">{stats.audio}</span>
          )}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={analyzeStorage}
          disabled={loading}
          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Image size={16} />}
          Analyser
        </button>

        <button
          onClick={deleteSelectedMedia}
          disabled={selectedTypes.length === 0 || isDeleting}
          className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 rounded-xl font-bold text-red-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
          Supprimer
        </button>
      </div>

      {message && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-white/60">{message}</p>
        </div>
      )}
    </div>
  );
}

const defaultSettings: AdminSettings = {
  allowProviderChat: true,
  allowSalesChat: true,
  allowUserBlocking: true,
  allowNotifications: true,
  contactListWidth: 384,
};

export default function AdminPanel({ onClose, onBack, currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'storage'>('settings');
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { getRoleColor, getRoleName } = useRoles();

  // Assignment modal state
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
    searchQuery: string;
  }>({ isOpen: false, user: null, searchQuery: '' });

  useEffect(() => {
    setLoading(true);
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AdminSettings);
      }
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const u = snap.docs.map(d => d.data() as UserProfile);
      setUsers(u);
      setLoading(false);
    });

    return () => {
      unsubSettings();
      unsubUsers();
    };
  }, []);

  const updateGlobalSetting = async (key: keyof AdminSettings, value: any) => {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, defaultSettings);
    }
    await updateDoc(docRef, { [key]: value });
  };

  const updateUserField = async (userId: string, field: string, value: any) => {
    await updateDoc(doc(db, 'users', userId), { [field]: value });
  };

  const handleAssignSupplier = async (commercialUid: string, supplierUid: string) => {
    const commercial = users.find(u => u.uid === commercialUid) as any;
    if (!commercial) return;
    const current = commercial.assignedSuppliers || [];
    const updated = current.includes(supplierUid)
      ? current.filter((id: string) => id !== supplierUid)
      : [...current, supplierUid];
    await updateDoc(doc(db, 'users', commercialUid), { assignedSuppliers: updated });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#0f1113] items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0f1113] overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
        {typeof onBack === 'function' ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <ChevronLeft size={18} />
            <span className="text-sm font-medium">Retour</span>
          </button>
        ) : <div />}
        <div className={typeof onBack === 'function' ? "flex-1 ml-2" : "flex-1"}>
          <h1 className="text-lg font-bold text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r to-emerald-400 from-sky-400">
              Gestion Options
            </span>
          </h1>
          <p className="text-xs text-white/40 font-medium">Paramètres Admin</p>
        </div>
        <div className="flex items-center gap-2">
          {typeof onBack === 'function' && (
            <button 
              onClick={onBack}
              className="p-2 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/20 transition-all"
              title="Retour"
            >
              <X size={18} />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
            activeTab === 'settings' 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-white/40 hover:text-white"
          )}
        >
          Paramètres
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
            activeTab === 'users' 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-white/40 hover:text-white"
          )}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={cn(
            "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2",
            activeTab === 'storage' 
              ? "border-blue-500 text-blue-400" 
              : "border-transparent text-white/40 hover:text-white"
          )}
        >
          Stockage
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="font-bold text-white text-sm">Autoriser Chat Fournisseurs</p>
                <p className="text-[10px] text-white/40">Autoriser les fournisseurs à discuter</p>
              </div>
              <button
                onClick={() => updateGlobalSetting('allowProviderChat', !settings.allowProviderChat)}
                className={cn(
                  "w-9 h-4.5 rounded-full relative transition-colors",
                  settings.allowProviderChat ? "bg-blue-500" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                  settings.allowProviderChat ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="font-bold text-white text-sm">Autoriser Chat Commerciaux</p>
                <p className="text-[10px] text-white/40">Autoriser les commerciaux à discuter</p>
              </div>
              <button
                onClick={() => updateGlobalSetting('allowSalesChat', !settings.allowSalesChat)}
                className={cn(
                  "w-9 h-4.5 rounded-full relative transition-colors",
                  settings.allowSalesChat ? "bg-blue-500" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                  settings.allowSalesChat ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="font-bold text-white text-sm">Autoriser Blocage</p>
                <p className="text-[10px] text-white/40">Autoriser le blocage d'utilisateurs</p>
              </div>
              <button
                onClick={() => updateGlobalSetting('allowUserBlocking', !settings.allowUserBlocking)}
                className={cn(
                  "w-9 h-4.5 rounded-full relative transition-colors",
                  settings.allowUserBlocking ? "bg-blue-500" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                  settings.allowUserBlocking ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="font-bold text-white text-sm">Autoriser Notifications</p>
                <p className="text-[10px] text-white/40">Autoriser les notifications</p>
              </div>
              <button
                onClick={() => updateGlobalSetting('allowNotifications', !settings.allowNotifications)}
                className={cn(
                  "w-9 h-4.5 rounded-full relative transition-colors",
                  settings.allowNotifications ? "bg-blue-500" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all",
                  settings.allowNotifications ? "left-5" : "left-0.5"
                )} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.filter(u => u.role !== 'admin').map(user => (
              <div key={user.uid} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <img src={getAvatarUrl(user.photoURL, user.role, user.displayName || '')} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{user.displayName}</p>
                  <p className="text-xs text-white/40 truncate">{user.email}</p>
                </div>
                <span 
                  className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase"
                  style={{ 
                    backgroundColor: `${getRoleColor(user.role)}33`, 
                    color: getRoleColor(user.role) 
                  }}
                >
                  {getRoleName(user.role)}
                </span>
                {user.role === 'commercial' && (
                  <button
                    onClick={() => setAssignModal({ isOpen: true, user: user as any, searchQuery: '' })}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                    title="Assigner fournisseurs"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
                <button 
                  onClick={() => updateUserField(user.uid, 'isIsolated', !(user as any).isIsolated)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    (user as any).isIsolated ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/40"
                  )}
                >
                  {(user as any).isIsolated ? <CheckCheck size={16} /> : <Shield size={16} />}
                </button>
              </div>
            ))}

            {/* Assignment Modal */}
            {assignModal.isOpen && assignModal.user && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setAssignModal({ isOpen: false, user: null, searchQuery: '' })} />
                <div className="relative w-full max-w-lg bg-[#1a1d21] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl z-10">
                  <div className="p-6 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">
                        Assigner fournisseurs à <span className="text-blue-400">{assignModal.user.displayName}</span>
                      </h3>
                      <button onClick={() => setAssignModal({ isOpen: false, user: null, searchQuery: '' })} className="text-white/40 hover:text-white">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher fournisseur..."
                        value={assignModal.searchQuery}
                        onChange={(e) => setAssignModal(prev => ({ ...prev, searchQuery: e.target.value }))}
                        className="w-full rounded-xl py-3 px-5 pl-12 text-sm outline-none bg-white/5 border border-white/10 text-white placeholder:text-white/30"
                      />
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    </div>
                  </div>
                  <div className="p-4 max-h-72 overflow-y-auto space-y-2">
                    {users
                      .filter(u => u.role === 'prestataire' || u.role === 'fournisseur')
                      .filter(u => !assignModal.searchQuery || u.displayName.toLowerCase().includes(assignModal.searchQuery.toLowerCase()))
                      .map(supplier => {
                        const assigned = ((assignModal.user as any).assignedSuppliers || []).includes(supplier.uid);
                        return (
                          <button
                            key={supplier.uid}
                            onClick={() => handleAssignSupplier(assignModal.user!.uid, supplier.uid)}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              assigned
                                ? "bg-emerald-500/10 border-emerald-500/30"
                                : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                          >
                            <img src={getAvatarUrl(supplier.photoURL, supplier.role, supplier.displayName || '')} alt="" className="h-9 w-9 rounded-full object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white text-sm truncate">{supplier.displayName}</p>
                              <p className="text-[10px] text-white/40 truncate">{supplier.email}</p>
                            </div>
                            {assigned && <Check size={18} className="text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                  <div className="p-4 border-t border-white/5 bg-black/30">
                    <p className="text-[10px] text-white/30 text-center font-medium">
                      Cliquez pour assigner / retirer l'accès
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'storage' && <StorageTab />}
      </div>
    </div>
  );
}
