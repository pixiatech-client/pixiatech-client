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
}

/**
 * Hook centralisé comptabilisant toutes les notifications non lues
 * pour l'utilisateur connecté, sans double compter.
 * 
 * Règle anti-doublon : les notifications de type 'message' sont exclues du
 * compteur global car elles sont déjà couvertes par chats.unreadCount.
 * Chaque source met à jour sa propre partie de bySource, et total est
 * déduit de la somme de bySource pour éviter toute incohérence.
 */
export function useUnreadCount(options?: UseUnreadCountOptions): UnreadCountState {
  const { role } = options || {};
  const { user, userProfile } = useUser();
  const uid = user?.uid;
  const effectiveRole = role || userProfile?.role;
  const [bySource, setBySource] = useState<UnreadCountSource>({
    notifications: 0,
    chats: 0,
    disputes: 0,
    quotes: 0,
  });
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    if (!uid) {
      setBySource({ notifications: 0, chats: 0, disputes: 0, quotes: 0 });
      setLastUpdate('');
      return;
    }

    const unsubscribers: (() => void)[] = [];

    /**
     * 1️⃣ Notifications Firestore (hors type 'message')
     * - OnSnapshot écoute userId===uid AND read===false
     * - On filtre côté client type !== 'message' pour éviter le double compte
     */
    const notifsRef = collection(db, 'notifications');
    const notifQ = query(
      notifsRef,
      where('userId', '==', uid),
      where('read', '==', false)
    );
    unsubscribers.push(
      onSnapshot(
        notifQ,
        (snap) => {
          const count = snap.docs.filter(
            (d) => (d.data() as any).type !== 'message'
          ).length;
          setBySource(prev => ({
            ...prev,
            notifications: count,
            lastUpdate: new Date().toISOString(),
          }));
        },
        (error) => {
          console.warn('[useUnreadCount] Notifications error:', error?.message);
        }
      )
    );

    /**
     * 2️⃣ Chats.unreadCount — Somme de toutes les valeurs non lues par chat
     * Requête filtrée avec where('participants', 'array-contains', uid) pour respecter
     * scrupuleusement les règles Firestore et éviter les erreurs de permissions.
     */
    const chatQ = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', uid)
    );
    unsubscribers.push(
      onSnapshot(
        chatQ,
        (chatSnap) => {
          const unreadFromChats = chatSnap.docs.reduce((acc, chatDoc) => {
            const uc = chatDoc.data().unreadCount?.[uid] || 0;
            return acc + uc;
          }, 0 as number);
          setBySource(prev => ({
            ...prev,
            chats: unreadFromChats,
            lastUpdate: new Date().toISOString(),
          }));
        },
        (error) => {
          console.warn('[useUnreadCount] Chats error:', error?.message);
        }
      )
    );

    /**
     * 3️⃣ & 4️⃣ Disputes et Quotes — Uniquement pour les profils autorisés (admin/commercial)
     * pour éviter les rejets de permission Firestore côté client.
     */
    const isStaff = effectiveRole === 'admin' || effectiveRole === 'commercial';
    if (isStaff) {
      try {
        const unsubDispute = onSnapshot(
          collection(db, 'disputes'),
          (disputeSnap) => {
            const unreadFromDisputes = disputeSnap.docs
              .filter((d) => (d.data() as any).unreadByClient === true && (d.data() as any).clientId === uid)
              .length;
            setBySource(prev => ({
              ...prev,
              disputes: unreadFromDisputes,
              lastUpdate: new Date().toISOString(),
            }));
          },
          () => {}
        );
        unsubscribers.push(unsubDispute);
      } catch {}

      try {
        const unsubQuotes = onSnapshot(
          collection(db, 'quotes'),
          (quoteSnap) => {
            const unreadFromQuotes = quoteSnap.docs
              .filter((d) => (d.data() as any).isRead === false && (d.data() as any).clientId === uid)
              .length;
            setBySource(prev => ({
              ...prev,
              quotes: unreadFromQuotes,
              lastUpdate: new Date().toISOString(),
            }));
          },
          () => {}
        );
        unsubscribers.push(unsubQuotes);
      } catch {}
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [uid, effectiveRole]);

  // total déduit de la somme de bySource pour éviter toute incohérence
  const total = useMemo(() => {
    return (
      (bySource.notifications ?? 0) +
      (bySource.chats ?? 0) +
      (bySource.disputes ?? 0) +
      (bySource.quotes ?? 0)
    );
  }, [bySource]);

  return useMemo(
    () => ({
      total,
      bySource: {
        notifications: bySource.notifications ?? 0,
        chats: bySource.chats ?? 0,
        disputes: bySource.disputes ?? 0,
        quotes: bySource.quotes ?? 0,
      },
      lastUpdate,
    }),
    [total, bySource, lastUpdate, uid, role]
  );
}