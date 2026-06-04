'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripHorizontal, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloatingCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type CalcButton = {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'action' | 'equals';
  wide?: boolean;
};

const BUTTONS: CalcButton[][] = [
  [
    { label: 'C',   value: 'C',   type: 'action' },
    { label: '+/-', value: '+/-', type: 'action' },
    { label: '%',   value: '%',   type: 'action' },
    { label: '÷',   value: '/',   type: 'operator' },
  ],
  [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
  ],
  [
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '-', value: '-', type: 'operator' },
  ],
  [
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator' },
  ],
  [
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: '=', type: 'equals', wide: true },
  ],
];

export function FloatingCalculator({ isOpen, onClose }: FloatingCalculatorProps) {
  const [display, setDisplay]       = useState('0');
  const [expression, setExpression] = useState('');
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [operator, setOperator]     = useState<string | null>(null);
  const [prevValue, setPrevValue]   = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const handleNumber = useCallback((val: string) => {
    if (waitingForOperand || justEvaluated) {
      setDisplay(val);
      setWaitingForOperand(false);
      setJustEvaluated(false);
    } else {
      if (val === '.' && display.includes('.')) return;
      setDisplay(display === '0' ? val : display + val);
    }
  }, [display, waitingForOperand, justEvaluated]);

  const handleOperator = useCallback((op: string) => {
    setJustEvaluated(false);
    if (operator && !waitingForOperand) {
      // Chain operations
      const result = String(evaluate(prevValue!, display, operator));
      setDisplay(result);
      setPrevValue(result);
    } else {
      setPrevValue(display);
    }
    setOperator(op);
    setExpression(display + ' ' + opLabel(op));
    setWaitingForOperand(true);
  }, [display, operator, prevValue, waitingForOperand]);

  const handleEquals = useCallback(() => {
    if (!operator || prevValue === null) return;
    const result = String(evaluate(prevValue, display, operator));
    setExpression(prevValue + ' ' + opLabel(operator) + ' ' + display + ' =');
    setDisplay(result);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setJustEvaluated(true);
  }, [display, operator, prevValue]);

  const handleAction = useCallback((action: string) => {
    if (action === 'C') {
      setDisplay('0');
      setExpression('');
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(false);
      setJustEvaluated(false);
    } else if (action === '+/-') {
      setDisplay(String(parseFloat(display) * -1));
    } else if (action === '%') {
      setDisplay(String(parseFloat(display) / 100));
    }
  }, [display]);

  const handleButton = useCallback((btn: CalcButton) => {
    if (btn.type === 'number')   handleNumber(btn.value);
    else if (btn.type === 'operator') handleOperator(btn.value);
    else if (btn.type === 'equals')   handleEquals();
    else if (btn.type === 'action')   handleAction(btn.value);
  }, [handleNumber, handleOperator, handleEquals, handleAction]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if ('0123456789.'.includes(e.key)) handleNumber(e.key);
      else if (['+', '-', '*', '/'].includes(e.key)) handleOperator(e.key);
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Escape') onClose();
      else if (e.key === 'Backspace') {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleNumber, handleOperator, handleEquals, onClose]);

  const displayFormatted = (() => {
    const n = parseFloat(display);
    if (isNaN(n)) return display;
    if (Math.abs(n) > 1e12) return n.toExponential(4);
    return display.length > 12 ? display.slice(0, 12) : display;
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          style={{ position: 'fixed', bottom: 100, right: 28, zIndex: 9999, touchAction: 'none' }}
          className={cn(
            'w-[280px] rounded-2xl shadow-2xl overflow-hidden select-none bg-white border border-gray-200'
          )}
        >
          {/* ── Header / drag handle ── */}
          <div className={cn(
            'flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing',
            'bg-gray-50'
          )}>
            <div className="flex items-center gap-2">
              <Calculator className={cn('w-4 h-4', 'text-indigo-600')} />
              <span className={cn('text-xs font-black uppercase tracking-widest', 'text-gray-600')}>
                Calculatrice
              </span>
            </div>
            <div className="flex items-center gap-2">
              <GripHorizontal className={cn('w-4 h-4', 'text-gray-300')} />
              <button
                onClick={onClose}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                  'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
                )}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Display ── */}
          <div className={cn(
            'px-5 pt-4 pb-3 text-right',
            'bg-gradient-to-b from-gray-800 to-gray-700'
          )}>
            <p className="text-[10px] text-gray-400 h-4 mb-1 truncate">{expression}&nbsp;</p>
            <p className={cn(
              'font-thin transition-all leading-none',
              displayFormatted.length > 9 ? 'text-3xl' : 'text-5xl',
              'text-white'
            )}>
              {displayFormatted}
            </p>
          </div>

          {/* ── Buttons ── */}
          <div className="bg-gradient-to-b from-indigo-500 to-indigo-600">
            {BUTTONS.map((row, ri) => (
              <div key={ri} className="flex w-full">
                {row.map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => handleButton(btn)}
                    className={cn(
                      'flex-1 h-14 text-xl font-light transition-all duration-100',
                      'border-r border-b border-indigo-400/50',
                      'outline-none focus:outline-none active:scale-95',
                      btn.wide && 'flex-[2]',
                      btn.type === 'operator'
                        ? 'bg-indigo-700/20 hover:bg-indigo-700/40 text-white'
                        : btn.type === 'equals'
                          ? 'bg-indigo-700/40 hover:bg-indigo-700/60 text-white font-bold text-2xl'
                          : btn.type === 'action'
                            ? 'text-white/70 hover:bg-indigo-700/20'
                            : 'text-white hover:bg-indigo-700/20'
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function opLabel(op: string): string {
  return { '/': '÷', '*': '×', '+': '+', '-': '-' }[op] ?? op;
}

function evaluate(a: string, b: string, op: string): number {
  const fa = parseFloat(a);
  const fb = parseFloat(b);
  switch (op) {
    case '+': return fa + fb;
    case '-': return fa - fb;
    case '*': return fa * fb;
    case '/': return fb === 0 ? 0 : fa / fb;
    default:  return fb;
  }
}
