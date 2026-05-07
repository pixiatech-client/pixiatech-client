'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, Send, ArrowRight, MapPin, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, MessageOption, WizardSettings, Product, Settings, LaborSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/firebase/config';
import { ConfigState, INITIAL_STATE } from '@/lib/configurator-wizard-types';
import { StepDimensions, StepSummary, StepFinal } from '@/components/configurator-wizard';
import { QuoteForm, QuoteFormHandle } from '@/components/quote-form';
import { SuccessView } from '@/components/success-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuoteDetails } from '@/lib/types';

interface WizardBotFlowProps {
  onClose: () => void;
  allProducts: Product[];
  settings: Settings;
  laborSettings: LaborSettings;
}

// Step constants
const STEP = {
  PROJECT_TYPE: 1,
  ENVIRONMENT: 2,
  DIMENSIONS: 3,
  DISTANCE: 4,
  PITCH: 5,
  SUMMARY: 6,
  PRODUCTS: 7,
  DELIVERY: 8,
  INSTALLATION: 9,
  QUOTE_FORM: 10,
  SUCCESS: 11,
} as const;

export function WizardBotFlow({ onClose, allProducts, settings, laborSettings }: WizardBotFlowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [botStatus, setBotStatus] = useState<'thinking' | 'smiling' | 'solution' | 'angry' | 'default'>('default');
  const [wizardSettings, setWizardSettings] = useState<WizardSettings | null>(null);

  const initialized = useRef(false);
  const [step, setStep] = useState<number>(STEP.PROJECT_TYPE);
  const [configState, setConfigState] = useState<ConfigState>(INITIAL_STATE);

  // Quote form state
  const quoteFormRef = useRef<QuoteFormHandle>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteId, setQuoteId] = useState<string>('');
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Delivery/Installation local state
  const [deliveryCity, setDeliveryCity] = useState('');
  const [includeInstallation, setIncludeInstallation] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'wizard'));
        if (snap.exists()) setWizardSettings(snap.data() as WizardSettings);
      } catch (error) {
        console.error('Failed to load wizard settings', error);
      }
    };
    fetchSettings();
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, step, scrollToBottom]);

  const pushBotMessage = useCallback((content: string, options?: MessageOption[], delay = 1200) => {
    setIsTyping(true);
    setBotStatus('thinking');
    setTimeout(() => {
      setIsTyping(false);
      setBotStatus(options ? 'thinking' : 'smiling');
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}-${Math.random()}`,
        chatId: 'wizard-bot',
        senderId: 'bot',
        senderName: 'Assistant Estimation',
        senderRole: 'admin',
        content,
        type: 'text',
        status: 'sent',
        createdAt: new Date(),
        options,
      }]);
    }, delay);
  }, []);

  const pushUserMessage = (content: string, imageUrl?: string) => {
    setMessages(prev => {
      // Remove options from last bot msg so they disappear after user selects
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].senderId === 'bot' && updated[i].options) {
          updated[i] = { ...updated[i], options: undefined };
          break;
        }
      }
      return [...updated, {
        id: `user-${Date.now()}`,
        chatId: 'wizard-bot',
        senderId: 'user',
        content,
        type: imageUrl ? 'image' : 'text',
        fileUrl: imageUrl,
        status: 'seen',
        createdAt: new Date(),
      }];
    });
  };

  // Initial greeting — fires once when wizardSettings loads
  useEffect(() => {
    if (!wizardSettings || initialized.current) return;
    initialized.current = true;

    setBotStatus('smiling');
    pushBotMessage('Bonjour ! 👋 Je suis votre assistant pour votre projet d\'écran LED.', undefined, 400);

    setTimeout(() => {
      const types: MessageOption[] = [];
      if (wizardSettings.projectTypes?.location?.enabled !== false)
        types.push({ label: 'Location', value: 'location', imageUrl: wizardSettings.projectTypes?.location?.imageUrl });
      if (wizardSettings.projectTypes?.vente?.enabled !== false)
        types.push({ label: 'Achat définitif', value: 'vente', imageUrl: wizardSettings.projectTypes?.vente?.imageUrl });
      pushBotMessage('Commençons ! S\'agit-il d\'un projet de **location** ou d\'un **achat définitif** ?', types, 1000);
    }, 2000);
  }, [wizardSettings, pushBotMessage]);

  const handleOptionSelect = (value: string, label: string, imageUrl?: string) => {
    pushUserMessage(label, imageUrl);

    if (step === STEP.PROJECT_TYPE) {
      setConfigState(prev => ({ ...prev, projectType: value as any }));
      setStep(STEP.ENVIRONMENT);
      setBotStatus('smiling');
      pushBotMessage(`Parfait, un projet de ${label.toLowerCase()} !`);
      setTimeout(() => {
        const envs: MessageOption[] = [];
        if (wizardSettings?.environments?.interieur) envs.push({ label: 'Intérieur', value: 'interieur', imageUrl: wizardSettings.environments.interieur.imageUrl });
        if (wizardSettings?.environments?.['semi-exterieur']) envs.push({ label: 'Semi-extérieur', value: 'semi-exterieur', imageUrl: wizardSettings.environments['semi-exterieur'].imageUrl });
        if (wizardSettings?.environments?.exterieur) envs.push({ label: 'Extérieur', value: 'exterieur', imageUrl: wizardSettings.environments.exterieur.imageUrl });
        pushBotMessage('Quel sera l\'environnement d\'installation de l\'écran ?', envs.length ? envs : [
          { label: 'Intérieur', value: 'interieur' },
          { label: 'Semi-extérieur', value: 'semi-exterieur' },
          { label: 'Extérieur', value: 'exterieur' },
        ]);
      }, 1500);
    }
    else if (step === STEP.ENVIRONMENT) {
      setConfigState(prev => ({ ...prev, environment: value as any }));
      setStep(STEP.DIMENSIONS);
      setBotStatus('smiling');
      pushBotMessage(`Bien noté — écran ${label.toLowerCase()}.`);
      setTimeout(() => pushBotMessage('Quelles dimensions souhaitez-vous pour votre écran ? Utilisez le formulaire ci-dessous.'), 1500);
    }
    else if (step === STEP.DISTANCE) {
      setConfigState(prev => ({ ...prev, distance: value as any }));
      setStep(STEP.PITCH);
      pushBotMessage('Noté !');
      setTimeout(() => {
        const pitches: MessageOption[] = (wizardSettings?.pixelPitches ?? []).map(p => ({ label: p.value, value: p.value, imageUrl: p.imageUrl }));
        if (!pitches.find(p => p.value === 'Je ne sais pas')) pitches.push({ label: 'Je ne sais pas', value: 'Je ne sais pas' });
        pushBotMessage('Avez-vous une préférence pour le pitch (résolution) ?', pitches);
      }, 1500);
    }
    else if (step === STEP.PITCH) {
      setConfigState(prev => ({ ...prev, pixelPitch: value }));
      setStep(STEP.SUMMARY);
      setBotStatus('solution');
      pushBotMessage('Excellent choix ! Voici le résumé de votre configuration :');
    }
  };

  const handleDimensionsSubmit = () => {
    if (!configState.width || !configState.height) return;
    pushUserMessage(`${configState.width}m × ${configState.height}m`);
    setStep(STEP.DISTANCE);
    pushBotMessage('Super dimensions !');
    setTimeout(() => {
      const dists: MessageOption[] = (wizardSettings?.viewingDistances ?? []).map(d => ({ label: d.value, value: d.value, imageUrl: d.imageUrl }));
      if (!dists.length) dists.push(
        { label: '0.5–2m', value: '0.5-2m' },
        { label: '2–5m', value: '2-5m' },
        { label: '5–10m', value: '5-10m' },
        { label: '+10m', value: '+10m' },
      );
      pushBotMessage('À quelle distance votre audience regardera-t-elle principalement l\'écran ?', dists);
    }, 1500);
  };

  const handleProceedToProducts = () => {
    setStep(STEP.PRODUCTS);
    setBotStatus('thinking');
    pushBotMessage('Je recherche les meilleurs produits pour vous... 🔍');
    setTimeout(() => {
      setBotStatus('solution');
      pushBotMessage('Voici les produits recommandés selon vos besoins !');
    }, 2000);
  };

  const handleProductSelected = () => {
    if (!configState.selectedProduct) return;
    setStep(STEP.DELIVERY);
    setBotStatus('smiling');
    pushBotMessage('Excellent choix ! Pour la livraison, dans quelle ville souhaitez-vous être livré ?');
  };

  const handleDeliverySubmit = () => {
    if (!deliveryCity.trim()) return;
    pushUserMessage(`Livraison à : ${deliveryCity}`);
    setStep(STEP.INSTALLATION);
    pushBotMessage(`Livraison notée à ${deliveryCity}.`);
    setTimeout(() => pushBotMessage('Souhaitez-vous inclure l\'installation professionnelle ?', [
      { label: '✅ Oui, inclure l\'installation', value: 'yes' },
      { label: '❌ Non merci', value: 'no' },
    ]), 1500);
  };

  const handleInstallationChoice = (value: string, label: string) => {
    pushUserMessage(label);
    const include = value === 'yes';
    setIncludeInstallation(include);
    setConfigState(prev => ({ ...prev, includeInstallation: include }));
    // Remove options from last bot message
    setMessages(prev => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].senderId === 'bot' && updated[i].options) {
          updated[i] = { ...updated[i], options: undefined };
          break;
        }
      }
      return updated;
    });
    setStep(STEP.QUOTE_FORM);
    setBotStatus('smiling');
    pushBotMessage(include ? 'Installation incluse 👷. Dernière étape : vos coordonnées pour générer le devis !' : 'Pas de souci. Dernière étape : vos coordonnées pour générer le devis !');
  };

  const handleQuoteSubmit = () => {
    setIsSubmittingQuote(true);
    if (quoteFormRef.current) quoteFormRef.current.submit();
  };

  const getBotImage = () => {
    switch (botStatus) {
      case 'thinking': return '/bot-thinking.png';
      case 'smiling': return '/bot-smiling.png';
      case 'solution': return '/bot-solution.png';
      case 'angry': return '/bot-angry.png';
      default: return '/robot-avatar.png';
    }
  };

  const selectedProduct = allProducts.find(p => String(p.id) === String(configState.selectedProduct));
  const area = configState.width * configState.height;
  const pitchValue = parseFloat(configState.pixelPitch.replace('P', '')) || 2.5;
  const applicableRule = laborSettings?.rules
    ?.slice()
    .sort((a, b) => b.minSqM - a.minSqM)
    .find(rule => area >= rule.minSqM);
  const techniciansRequired = applicableRule?.technicians ?? 0;
  const installationCost = includeInstallation ? (applicableRule?.price ?? 0) : 0;
  const envMap: Record<string, 'indoor' | 'outdoor' | 'showcase'> = { interieur: 'indoor', exterieur: 'outdoor', 'semi-exterieur': 'showcase' };

  const quoteDetails: QuoteDetails = {
    products: selectedProduct ? [{
      id: `config_${Date.now()}`,
      productId: String(configState.selectedProduct),
      productType: envMap[configState.environment] || 'indoor',
      width: configState.width,
      height: configState.height,
      quantity: 1,
      transactionType: configState.projectType === 'vente' ? 'sale' : 'rental',
      rentalDuration: 1,
      rentalUnit: 'day',
      productName: selectedProduct.name,
      lineTotal: 0,
    }] : [],
    screenType: envMap[configState.environment] || 'indoor',
    transactionType: configState.projectType === 'vente' ? 'sale' : 'rental',
    includeInstallation: !!includeInstallation,
    installationCost,
    techniciansRequired,
    includeDelivery: !!deliveryCity,
    deliveryCost: 0,
    selectedCityId: deliveryCity || null,
    totalQuote: 0,
    width: configState.width,
    height: configState.height,
    productName: selectedProduct?.name ?? '',
    lang: 'fr',
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
      />
      <motion.div
        initial={{ x: '100%', y: '-50%', opacity: 0 }}
        animate={{ x: 0, y: '-50%', opacity: 1 }}
        exit={{ x: '100%', y: '-50%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        onClick={(e) => e.stopPropagation()}
        className="fixed right-0 md:right-4 top-1/2 md:top-[calc(50%-4vh)] w-full md:w-[600px] h-[100dvh] md:h-[90vh] bg-[#f8f9fb] shadow-2xl z-[210] border border-slate-200 md:rounded-[48px] overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header */}
        <div className="h-16 md:h-20 bg-[#0f766e] flex items-center px-4 md:px-6 z-10 shrink-0 shadow-md gap-3">
          <button onClick={onClose} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 shrink-0 shadow-lg">
              <img src={getBotImage()} alt="Bot" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/robot-avatar.png'; }} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base leading-tight">Assistant Estimation</span>
              <span className="text-[11px] text-[#86efac] font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
                En ligne
              </span>
            </div>
          </div>
          {/* Step indicator */}
          <div className="ml-auto flex items-center gap-1">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all duration-500', i < step ? 'w-3 bg-[#86efac]' : 'w-1.5 bg-white/20')} />
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar relative min-h-0 bg-[#efeae2]"
        >
          {quoteSuccess ? (
            <SuccessView quoteId={quoteId} onNewQuote={() => window.location.reload()} />
          ) : (
            <>
              {/* Chat messages */}
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <MessageItem
                    msg={msg}
                    isMine={msg.senderId === 'user'}
                    isMiniChat={false}
                    currentUserPhotoURL=""
                    otherUserPhotoURL={getBotImage()}
                  />

                  {/* Options under last bot message */}
                  {idx === messages.length - 1 && msg.options && !isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-2 justify-end pt-2 pr-2"
                    >
                      {msg.options.map((option, i) => {
                        const label = typeof option === 'string' ? option : option.label;
                        const value = typeof option === 'string' ? option : option.value;
                        const imageUrl = typeof option === 'string' ? undefined : option.imageUrl;
                        const isInstallOpt = step === STEP.INSTALLATION;
                        return (
                          <button
                            key={value || i}
                            onClick={() => {
                              if (isInstallOpt) handleInstallationChoice(value, label);
                              else handleOptionSelect(value, label, imageUrl);
                            }}
                            className="px-5 py-2.5 rounded-2xl font-semibold text-sm bg-white text-[#0f766e] border border-[#0f766e]/30 shadow active:scale-95 transition-transform"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              ))}

              {/* ── Step 3: Dimensions ── */}
              {step === STEP.DIMENSIONS && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                  <StepDimensions state={configState} updateState={(u) => setConfigState(prev => ({ ...prev, ...u }))} settings={settings} />
                  <div className="px-6 pb-6">
                    <Button onClick={handleDimensionsSubmit} disabled={!configState.width || !configState.height} className="w-full h-11 font-bold rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white">
                      Confirmer les dimensions <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 6: Summary ── */}
              {step === STEP.SUMMARY && !isTyping && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                  <StepSummary state={configState} />
                  <div className="p-4 bg-slate-50 border-t">
                    <Button onClick={handleProceedToProducts} className="w-full h-11 font-bold rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white">
                      Rechercher les produits recommandés 🔍
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 7: Product Selection ── */}
              {step === STEP.PRODUCTS && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                    <StepFinal state={configState} updateState={(u) => setConfigState(prev => ({ ...prev, ...u }))} products={allProducts} settings={settings} />
                  </div>
                  <Button onClick={handleProductSelected} disabled={!configState.selectedProduct} className="w-full h-11 font-bold rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white">
                    Confirmer ce produit <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 8: Delivery ── */}
              {step === STEP.DELIVERY && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold">
                    <MapPin size={18} className="text-[#0f766e]" /> Ville de livraison
                  </div>
                  <Input
                    placeholder="Ex: Paris, Lyon, Marseille..."
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleDeliverySubmit(); }}
                    className="h-11 rounded-xl border-slate-200 focus:ring-[#0f766e]"
                  />
                  <Button onClick={handleDeliverySubmit} disabled={!deliveryCity.trim()} className="w-full h-11 font-bold rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white">
                    Confirmer la ville <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* ── Step 10: Quote Form ── */}
              {step === STEP.QUOTE_FORM && !isTyping && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100">
                    <QuoteForm
                      ref={quoteFormRef}
                      quoteDetails={quoteDetails}
                      settings={settings}
                      allProducts={allProducts}
                      onBack={() => setStep(STEP.INSTALLATION)}
                      onSubmitted={(id) => { setQuoteId(id); setQuoteSuccess(true); }}
                      onError={() => setIsSubmittingQuote(false)}
                      hideFooter={true}
                    />
                  </div>
                  <Button
                    onClick={handleQuoteSubmit}
                    disabled={isSubmittingQuote}
                    className="w-full h-14 text-lg font-bold rounded-xl bg-black hover:bg-slate-900 text-[#c6ff00]"
                  >
                    {isSubmittingQuote ? 'Génération en cours...' : '📄 Générer mon devis PDF'}
                  </Button>
                </motion.div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 shadow-sm bg-white shrink-0">
                    <img src={getBotImage()} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/robot-avatar.png'; }} />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1.5 shadow-sm">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </>
          )}

          <AnimatePresence>
            {showScrollButton && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
                onClick={scrollToBottom}
                className="fixed bottom-6 right-6 md:right-12 h-10 w-10 rounded-full bg-white text-[#0f766e] shadow-lg flex items-center justify-center active:scale-90 transition-all z-40 border border-slate-100"
              >
                <ChevronDown size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
