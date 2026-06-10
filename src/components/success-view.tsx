'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Download, RefreshCcw, Loader2, Mail, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuotePDF } from '@/app/admin/quote-pdf';
import type { QuoteRequest, PdfSettings, Settings, City, Product, ProductSpec } from '@/lib/types';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/lib/i18n';
import { getSettings, getQuoteRequest, getProducts, getProductSpecs } from '@/app/admin/actions';
import { getPdfSettings } from '@/app/actions/quote-actions';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase/config';
import { updateQuotePdfUrl } from '@/app/admin/actions';

// Loading component removed to prevent flashes

interface SuccessViewProps {
  quoteId: string | null;
  onNewQuote: () => void;
  initialEmail?: string;
}

function VerificationView({ email, onNewQuote }: { email: string; onNewQuote: () => void }) {
  const { t } = useI18n();
  console.log("DEBUG: VerificationView (Image 4) Rendered for email:", email);
  return (
    <div className="w-full flex min-h-screen items-center justify-center p-4 bg-[#FAFAFA] font-sans transition-none pb-8 lg:pb-[20vh]">
        <div className="w-full max-w-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border-none bg-white rounded-[32px] overflow-hidden flex flex-col mx-auto animate-none">
            <div className="p-8 md:p-10 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-[#0f766e]/10 rounded-full flex items-center justify-center mb-6">
                    <Mail className="w-6 h-6 text-[#0f766e]" />
                </div>
                
                <h1 className="text-[24px] md:text-[26px] font-black tracking-tight text-[#0f766e] mb-2 leading-tight">
                    {t('success.congratulations')}
                </h1>
                <p className="text-[#0f766e] text-sm md:text-base font-bold mb-6">
                    {t('success.sentEmail')}
                </p>
                
                <p className="text-slate-600 text-[14px] mb-4 leading-relaxed">
                    {t('success.confirmationLinkSent')}<br/>
                    <span className="font-bold text-black">{email}</span>
                </p>
                
                <p className="text-slate-500 text-[12px] mb-6 leading-relaxed max-w-[280px] mx-auto">
                    {t('success.clickLink')}
                </p>

                <p className="text-slate-500 text-[12px] mb-8 leading-relaxed font-medium italic">
                    {t('success.description')}
                </p>

                <div className="w-full bg-blue-50/60 rounded-xl p-4 mb-8 flex items-start gap-3 text-left">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-blue-800 font-medium leading-tight">
                        {t('success.checkSpam')}
                    </p>
                </div>

                <Button 
                    onClick={() => window.location.href = 'https://pixiatech.com/estimation/'} 
                    variant="outline" 
                    className="rounded-full h-11 px-8 font-bold text-[11px] tracking-widest uppercase border-slate-200 text-slate-700 hover:bg-black hover:text-white hover:border-black shadow-sm w-full group transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4 transition-colors group-hover:text-[#2563EB]" /> 
                    <span>{t('common.backToSite') || "Retour au site"}</span>
                </Button>
            </div>
        </div>
    </div>
  );
}


export function SuccessView({ quoteId, onNewQuote, initialEmail }: SuccessViewProps) {
  const { toast } = useToast();
  const { t, locale, setLocale } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  console.log("DEBUG: SuccessView Rendered", { quoteId, initialEmail, isLoading });
  const [isPdfRendering, startPdfRender] = useTransition();

  const [data, setData] = useState<{
    request: QuoteRequest;
    pdfSettings: PdfSettings;
    generalSettings: Settings;
    selectedCity: City | null;
    allProducts: Product[];
    allProductSpecs: Record<string, ProductSpec[]>;
  } | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!quoteId || initialEmail) {
          setIsLoading(false);
          return;
      }

      try {
        const quoteSnap = await getQuoteRequest(quoteId);

        if (!quoteSnap) {
          notFound();
          return;
        }
        
        const request: QuoteRequest = quoteSnap as QuoteRequest;

        const [generalSettings, pdfSettings, productsResult, specsData, citySnap] = await Promise.all([
          getSettings(),
          getPdfSettings(true),
          getProducts({ limit: 1000 }),
          getProductSpecs(),
          request.selectedCityId && request.selectedCityId !== 'unconfigured'
            ? getDoc(doc(firestore, 'cities', request.selectedCityId))
            : Promise.resolve(null),
        ]);

        const selectedCity: City | null = citySnap?.exists() ? { id: citySnap.id, ...citySnap.data() } as City : null;
        
        setData({
            request,
            pdfSettings,
            generalSettings,
            selectedCity,
            allProducts: productsResult.products,
            allProductSpecs: specsData,
        });

        if (request?.lang) {
          setLocale(request.lang);
        }

      } catch (error: any) {
        console.error("Failed to fetch success page data:", error);
        
        const errorMsg = error?.message || "";
        if (errorMsg.includes("NEEDS_VERIFICATION")) {
            const email = errorMsg.split(":")[1];
            setVerificationEmail(email || initialEmail || "");
            return;
        }

        toast({
          variant: "destructive",
          title: t('common.errorLoading'),
          description: t('success.fetchError'),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [quoteId, setLocale, toast]);

  useEffect(() => {
    // Confetti restored for the final success screen as requested
    if (!isLoading && data && !initialEmail) {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });
    }
  }, [isLoading, data, initialEmail]);


  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isPreGenerating, setIsPreGenerating] = useState(false);

  useEffect(() => {
    if (!isLoading && data) {
      if (data.request.pdfUrl) return;
      
      const timer = setTimeout(() => {
        generatePdfInternal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  const generatePdfInternal = async (isPreGen: boolean = false) => {
    if (isPreGen) setIsPreGenerating(true);
    
    try {
        const quoteContainer = document.getElementById('quote-pdf-view-success');
        if (!quoteContainer || !data) return;
    
        // Wait a bit for the hidden component to fully render styles/images
        await new Promise(resolve => setTimeout(resolve, 500));
    
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pages = quoteContainer.querySelectorAll('.page-break-after');
    
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const canvas = await html2canvas(page, { 
                scale: 3, // High scale for crisp, premium quality
                useCORS: true,
                logging: false,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0); // Maximum JPEG quality
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
            if (i > 0) pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }
        
        if (isPreGen) {
            const blob = pdf.output('blob');
            setPdfBlob(blob);
            
            // Auto-persist the PDF to storage if it's not already there
            if (data && quoteId && !data.request.pdfUrl) {
                try {
                    const storageRef = ref(storage, `quotes/pdfs/${quoteId}.pdf`);
                    await uploadBytes(storageRef, blob);
                    const pdfUrl = await getDownloadURL(storageRef);
                    await updateQuotePdfUrl(quoteId, pdfUrl);
                    console.log("✅ PDF persisted to storage and linked to quote.");
                } catch (uploadError) {
                    console.error("Failed to persist PDF:", uploadError);
                }
            }
        } else {
            pdf.save(`estimation-${data?.request.client.companyName.replace(/\s/g, '_') || 'estimation'}.pdf`);
        }
    } catch (error) {
        console.error("PDF generation error:", error);
    } finally {
        if (isPreGen) setIsPreGenerating(false);
    }
  };

  const handleGeneratePdf = async () => {
    if (data?.request.pdfUrl) {
        window.open(data.request.pdfUrl, '_blank');
        return;
    }

    if (pdfBlob) {
        // Instant download if ready
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estimation-${data?.request.client.companyName.replace(/\s/g, '_') || 'estimation'}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        return;
    }

    startPdfRender(async () => {
        await generatePdfInternal(false);
    });
  };
  
  // We show the layout immediately to follow the user's request for an "instant" feel.
  // The data (request, products, etc.) will hydrate in the background.
  const requiresVerification = data ? (data.generalSettings.isEmailVerificationEnabled && !data.request.emailVerified) : false;

  // If we have an initialEmail, it means we just submitted the form in the Wizard.
  // In this case, we MUST show the verification view (Image 4) immediately and STAY there.
  // The backend work happens in the background.
  if (initialEmail) {
      return <VerificationView email={initialEmail} onNewQuote={onNewQuote} />;
  }

  if (isLoading && !data) {
      if (initialEmail) {
          return (
              <div className="w-full min-h-screen bg-[#FAFAFA] font-sans">
                  <VerificationView email={initialEmail} onNewQuote={onNewQuote} />
              </div>
          );
      }
      return (
          <div className="w-full min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] font-sans overflow-hidden pb-8 lg:pb-[20vh]">
              <div className="w-full max-w-md bg-white rounded-[32px] p-10 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center shadow-sm">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black text-slate-900 mb-2">{t('common.loading')}</h1>
                      <p className="text-slate-500">{t('success.preparing')}</p>
                  </div>
              </div>
          </div>
      );
  }

  // If we don't have data yet but are not showing verification, show the "Congratulations" skeleton
  // so the user sees something instantly.
  const showSkeleton = isLoading && !data;

  if (requiresVerification && data) {
      return (
          <div className="w-full min-h-screen bg-[#FAFAFA] font-sans">
              <VerificationView email={data.request.client?.email || initialEmail || ""} onNewQuote={onNewQuote} />
              {/* Pre-render PDF in background even while waiting for verification */}
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: -9999,
                }}
              >
                  <QuotePDF id="quote-pdf-view-success" request={data.request} settings={data.pdfSettings} selectedCity={data.selectedCity} globalSettings={data.generalSettings} allProducts={data.allProducts} specs={data.allProductSpecs} />
              </div>
          </div>
      );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-[#FAFAFA] font-sans pb-8 lg:pb-[20vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl lg:max-w-3xl bg-white rounded-[40px] p-10 md:p-14 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] text-center relative overflow-hidden mx-auto"
      >
        <h1 
          className="text-4xl md:text-6xl lg:text-[72px] font-black text-[#2563eb] mb-6 tracking-tight leading-tight"
        >
          {t('success.congratulations')}
        </h1>

        <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-10 font-medium">
          {t('success.description')}
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
          {requiresVerification ? (
            <div className="flex-1 w-full">
              <button 
                disabled
                className="w-full flex items-center justify-center gap-3 bg-slate-100 text-slate-400 px-8 py-5 rounded-2xl font-bold text-[11px] md:text-xs tracking-widest uppercase cursor-not-allowed border border-slate-200 whitespace-nowrap"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>{t('success.verifyEmail')}</span>
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={!showSkeleton ? { y: -2 } : {}}
              whileTap={!showSkeleton ? { scale: 0.98 } : {}}
              onClick={handleGeneratePdf}
              disabled={isPdfRendering || showSkeleton}
              className="group flex-1 flex items-center justify-center gap-3 bg-[#c3f53c] text-black px-8 py-5 rounded-2xl w-full font-bold text-[11px] md:text-xs tracking-widest uppercase transition-all duration-300 shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPdfRendering || showSkeleton ? (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
              ) : (
                <Download className="w-4 h-4 shrink-0" />
              )}
              <span>{isPdfRendering ? t('common.generating') : showSkeleton ? t('common.loading') : t('success.downloadPdf')}</span>
            </motion.button>
          )}

          <motion.button
            whileHover={!showSkeleton ? { y: -2 } : {}}
            whileTap={!showSkeleton ? { scale: 0.98 } : {}}
            onClick={onNewQuote}
            className="group flex-1 flex items-center justify-center gap-3 bg-black text-white px-8 py-5 rounded-2xl w-full font-bold text-[11px] md:text-xs tracking-widest uppercase transition-all duration-300 shadow-xl whitespace-nowrap"
          >
            <RefreshCcw className="w-4 h-4 shrink-0" />
            <span>{t('success.newEstimation')}</span>
          </motion.button>
        </div>

        {!showSkeleton && data && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                opacity: 0,
                pointerEvents: "none",
                zIndex: -9999,
              }}
            >
                <QuotePDF id="quote-pdf-view-success" request={data.request} settings={data.pdfSettings} selectedCity={data.selectedCity} globalSettings={data.generalSettings} allProducts={data.allProducts} specs={data.allProductSpecs} />
            </div>
        )}
      </motion.div>
    </div>
  );
}
