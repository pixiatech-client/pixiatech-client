'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUser } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';

interface UnreadCountSource {
  notifications: number;
  chats: number;
  disputes: number;
  quotes: number;
}

interface UnreadCountState {
  total: number;
  bySource: Record<string, number>;
  lastUpdate: string;
}

interface UseUnreadCountOptions {
  role?: string;
  includeChats?: boolean;
}

/**
 * Hook centralisé comptabilisant les notifications non lues
 * pour l'utilisateur connecté.
 * 
 * Aligné directement sur la cloche de notifications : dès que les
 * notifications sont lues (ou marquées comme lues), le total retombe à 0
 * et le favicon retrouve son apparence normale d'origine.
 */
export function useUnreadCount(options?: UseUnreadCountOptions): UnreadCountState {
  const { user } = useUser();
  const uid = user?.uid;
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (!uid) {
      setUnreadCount(0);
      setLastUpdate('');
      return;
    }

    const notifsRef = collection(db, 'notifications');
    const notifQ = query(
      notifsRef,
      where('userId', '==', uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(
      notifQ,
      (snap) => {
        setUnreadCount(snap.docs.length);
        setLastUpdate(new Date().toISOString());
      },
      (error) => {
        console.warn('[useUnreadCount] Notifications error:', error?.message);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return useMemo(
    () => ({
      total: unreadCount,
      bySource: {
        notifications: unreadCount,
        chats: 0,
        disputes: 0,
        quotes: 0,
      },
      lastUpdate,
    }),
    [unreadCount, lastUpdate]
  );
}
