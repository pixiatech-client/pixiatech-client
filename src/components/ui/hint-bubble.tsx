
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useI18n } from '@/lib/i18n';

interface HintBubbleProps {
  visible: boolean;
  onHide: () => void;
}

export default function HintBubble({ visible, onHide }: HintBubbleProps) {
  const { t } = useI18n();

  const desktopBottomRem = 30;
  const desktopRightRem = 24;
  const mobileBottomRem = 41;
  const mobileRightRem = 8;
  const text = t('hintBubble.text');
  
  const desktopStyle: React.CSSProperties = {
    top: 'auto', 
    left: 'auto',
    transform: 'none',
    right: `${desktopRightRem}rem`,
    bottom: `${desktopBottomRem}rem`,
  };

  const mobileStyle: React.CSSProperties = {
    top: 'auto',
    left: 'auto',
    transform: 'none',
    right: `${mobileRightRem}rem`,
    bottom: `${mobileBottomRem}rem`,
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hint-bubble"
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: 1,
            y: [0, 8, 0],
          }}
          transition={{
            opacity: { duration: 0.5, ease: "easeOut" },
            y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
          }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
          className="absolute z-50 flex flex-col items-center pointer-events-none w-max"
          style={typeof window !== 'undefined' && window.innerWidth >= 1024 ? desktopStyle : mobileStyle}
        >
          <div className="rounded-lg bg-gray-100 border px-3 py-2 text-sm shadow-xl text-center dark:bg-black dark:text-white dark:border-gray-700"
               dangerouslySetInnerHTML={{ __html: text }}
          />
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="flex justify-center mt-1"
          >
            <ArrowDown className="text-red-500 dark:text-white" size={24} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
