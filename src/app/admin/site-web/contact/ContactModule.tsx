'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ContactHero } from './_components/ContactHero';
import { ContactInfoCard } from './_components/ContactInfoCard';
import { ContactForm } from './_components/ContactForm';
import { FaqSection } from './_components/FaqSection';
import { Footer } from './_components/Footer';
import { SmtpSettingsModal } from './_components/SmtpSettingsModal';
import { AdminToolbar } from './_components/AdminToolbar';
import { DEFAULT_PAGE_CONTENT } from '@/lib/site-web/defaultPageContent';
import type { ContactInfo, PageContentConfig } from '@/lib/site-web/types';

interface ContactModuleProps {
  isAdminPage?: boolean;
}

export function ContactModule({ isAdminPage = true }: ContactModuleProps) {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(isAdminPage);

  const [pageContent, setPageContent] = useState<PageContentConfig>(DEFAULT_PAGE_CONTENT);
  const [savedPageContent, setSavedPageContent] = useState<PageContentConfig>(DEFAULT_PAGE_CONTENT);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(pageContent) !== JSON.stringify(savedPageContent);
  }, [pageContent, savedPageContent]);

  const hiddenCount = useMemo(() => {
    let count = 0;
    const v = pageContent.visibility;
    Object.values(v).forEach((isVisible) => {
      if (!isVisible) count++;
    });
    if (pageContent.form?.categories) {
      pageContent.form.categories.forEach((c) => {
        if (!c.visible) count++;
      });
    }
    if (pageContent.faq?.items) {
      pageContent.faq.items.forEach((f) => {
        if (!f.visible) count++;
      });
    }
    if (pageContent.footer?.tags) {
      pageContent.footer.tags.forEach((t) => {
        if (!t.visible) count++;
      });
    }
    if (pageContent.footer?.links) {
      pageContent.footer.links.forEach((l) => {
        if (!l.visible) count++;
      });
    }
    if (pageContent.footer?.socials) {
      pageContent.footer.socials.forEach((s) => {
        if (!s.visible) count++;
      });
    }
    return count;
  }, [pageContent]);

  const loadData = async () => {
    try {
      const infoRes = await fetch('/api/site-web/contact/info');
      const infoJson = await infoRes.json();
      if (infoJson.success && infoJson.data) {
        setContactInfo(infoJson.data);
      }

      const msgRes = await fetch('/api/site-web/contact/messages');
      const msgJson = await msgRes.json();
      if (msgJson.success && typeof msgJson.unreadCount === 'number') {
        setUnreadCount(msgJson.unreadCount);
      }

      const contentRes = await fetch('/api/site-web/contact/page-content');
      const contentJson = await contentRes.json();
      if (contentJson.success && contentJson.data) {
        setPageContent(contentJson.data);
        setSavedPageContent(contentJson.data);
      }
    } catch (err) {
      console.error('[siteWeb] Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateHero = (patch: Partial<PageContentConfig['hero']>) => {
    setPageContent(prev => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  };

  const handleUpdateForm = (patch: Partial<PageContentConfig['form']>) => {
    setPageContent(prev => ({
      ...prev,
      form: {
        ...prev.form,
        ...patch,
        categories: 'categories' in patch ? (patch.categories ?? prev.form.categories) : prev.form.categories,
      },
    }));
  };

  const handleUpdateInfo = (patch: Partial<PageContentConfig['info']>) => {
    setPageContent(prev => ({ ...prev, info: { ...prev.info, ...patch } }));
  };

  const handleUpdateFaq = (patch: Partial<PageContentConfig['faq']>) => {
    setPageContent(prev => ({
      ...prev,
      faq: {
        ...prev.faq,
        ...patch,
        items: 'items' in patch ? (patch.items ?? prev.faq.items) : prev.faq.items,
      },
    }));
  };

  const handleUpdateFooter = (patch: Partial<PageContentConfig['footer']>) => {
    setPageContent(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        ...patch,
        tags: 'tags' in patch ? (patch.tags ?? prev.footer.tags) : prev.footer.tags,
        links: 'links' in patch ? (patch.links ?? prev.footer.links) : prev.footer.links,
        socials: 'socials' in patch ? (patch.socials ?? prev.footer.socials) : prev.footer.socials,
      },
    }));
  };

  const handleUpdateVisibility = (patch: Partial<PageContentConfig['visibility']>) => {
    setPageContent(prev => ({ ...prev, visibility: { ...prev.visibility, ...patch } }));
  };

  const handleSavePageContent = async () => {
    setIsSaving(true);
    setStatusNotification(null);
    try {
      const res = await fetch('/api/site-web/contact/page-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageContent),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPageContent(data.data);
        setSavedPageContent(data.data);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        setLastSavedTime(timeStr);
        setStatusNotification({
          type: 'success',
          message: 'Toutes les modifications et états des switches ont été enregistrés avec succès !',
        });
        loadData();
      } else {
        setStatusNotification({ type: 'error', message: data.message || "Erreur lors de l'enregistrement." });
      }
    } catch (err: any) {
      console.error('[siteWeb] Error saving page content:', err);
      setStatusNotification({ type: 'error', message: err.message || "Impossible de joindre le serveur pour enregistrer." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const handleResetPageContent = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser tout le contenu de la page et afficher toutes les cartes par défaut ?")) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/site-web/contact/page-content/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setPageContent(data.data);
        setSavedPageContent(data.data);
        setStatusNotification({ type: 'success', message: 'Contenu réinitialisé aux valeurs par défaut de PixiaTech.' });
        loadData();
      }
    } catch (err: any) {
      console.error('[siteWeb] Error resetting page content:', err);
      setStatusNotification({ type: 'error', message: "Erreur lors de la réinitialisation." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusNotification(null), 5000);
    }
  };

  const handleScrollToForm = () => {
    const el = document.getElementById('contact-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900 flex flex-col font-sans selection:bg-[#c6ff00] selection:text-black">
      {isAdminPage && (
        <AdminToolbar
        isAdminMode={isAdminMode}
        onToggleAdminMode={() => setIsAdminMode(prev => !prev)}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSavePageContent}
        onReset={handleResetPageContent}
        onOpenSmtpModal={() => setIsSettingsOpen(true)}
        saveSuccessMessage={lastSavedTime ? `Enregistré à ${lastSavedTime}` : null}
        hiddenCount={hiddenCount}
        />
      )}

      {statusNotification && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-5 duration-200 ${
          statusNotification.type === 'success'
            ? 'bg-gray-900 text-[#c6ff00] border-[#c6ff00]/40'
            : 'bg-rose-950 text-rose-200 border-rose-500/40'
        }`}>
          <span>{statusNotification.message}</span>
        </div>
      )}

      <main className="flex-1">
        <ContactHero
          content={pageContent.hero}
          visibility={pageContent.visibility}
          isAdmin={isAdminMode}
          onUpdateHero={handleUpdateHero}
          onUpdateVisibility={handleUpdateVisibility}
          onScrollToForm={handleScrollToForm}
        />

        <div id="contact" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-24">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5 space-y-6">
              <ContactInfoCard
                content={pageContent.info}
                visibility={pageContent.visibility}
                isAdmin={isAdminMode}
                onUpdateInfo={handleUpdateInfo}
                onUpdateVisibility={handleUpdateVisibility}
              />
            </div>

            <div className="lg:col-span-7">
              <ContactForm
                content={pageContent.form}
                visibility={pageContent.visibility}
                isAdmin={isAdminMode}
                onUpdateForm={handleUpdateForm}
                onUpdateVisibility={handleUpdateVisibility}
                onSuccessSubmission={loadData}
              />
            </div>
          </div>
        </div>

        <FaqSection
          content={pageContent.faq}
          visibility={pageContent.visibility}
          isAdmin={isAdminMode}
          onUpdateFaq={handleUpdateFaq}
          onUpdateVisibility={handleUpdateVisibility}
        />
      </main>

      <Footer
        content={pageContent.footer}
        visibility={pageContent.visibility}
        isAdmin={isAdminMode}
        onUpdateFooter={handleUpdateFooter}
        onUpdateVisibility={handleUpdateVisibility}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {isAdminPage && (
        <SmtpSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRefreshParent={loadData}
        onOpenVisualEditor={() => setIsAdminMode(true)}
        />
      )}
    </div>
  );
}