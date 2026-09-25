'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  X,
  Star,
  ShieldCheck,
  Truck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { STORE_CATALOG } from '../../mockData';
import type { OrderItem } from '../../types';

interface BoutiqueModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  selectedProduct?: OrderItem | null;
  onOrderProduct: (item: OrderItem) => void;
  onPurchased?: () => void;
  showToast?: (type: 'success' | 'error', message: string) => void;
}

export const BoutiqueModal: React.FC<BoutiqueModalProps> = ({
  isOpen,
  open,
  onClose,
  selectedProduct = null,
  onOrderProduct,
  onPurchased,
  showToast
}) => {
  const visible = isOpen ?? open ?? false;
  const [activeProduct, setActiveProduct] = useState<OrderItem>(
    selectedProduct || STORE_CATALOG[0]
  );
  const [isOrdering, setIsOrdering] = useState<boolean>(false);
  const [orderedSuccess, setOrderedSuccess] = useState<boolean>(false);

  // Sync if selectedProduct changes
  React.useEffect(() => {
    if (selectedProduct) {
      setActiveProduct(selectedProduct);
    }
  }, [selectedProduct]);

  if (!visible) return null;

  const handleSimulatePurchase = (product: OrderItem) => {
    setIsOrdering(true);
    setTimeout(() => {
      onOrderProduct(product);
      onPurchased?.();
      showToast?.('success', 'Commande passée avec succès !');
      setIsOrdering(false);
      setOrderedSuccess(true);
      setTimeout(() => {
        setOrderedSuccess(false);
        onClose();
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-6 border border-neutral-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0A0D0E] text-white">
              <ShoppingBag className="w-5 h-5 text-[#38E044]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900">
                  Solutions & Murs LED PIXIATECH
                </h2>
                <span className="text-[10px] font-bold bg-[#38E044] text-black px-2 py-0.5 rounded-full shadow-xs">
                  CATALOGUE LED OFFICIEL
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Spécialiste français : écrans LED, murs LED, affichage dynamique & solutions événementielles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighted Product Details Sheet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-neutral-50 border border-neutral-200">
          <div className="relative">
            <img
              src={activeProduct.productImage}
              alt={activeProduct.productName}
              className="w-full h-56 object-cover rounded-2xl border border-neutral-200 shadow-xs"
            />
            <span className="absolute top-2.5 left-2.5 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
              {activeProduct.category}
            </span>
          </div>

          <div className="flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1 text-amber-500 text-xs mb-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-neutral-400 text-[11px] ml-1">(4.9/5 - 84 avis)</span>
              </div>
              <h3 className="font-extrabold text-base text-neutral-900 leading-snug">
                {activeProduct.productName}
              </h3>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                {activeProduct.productDescription ||
                  'Équipement informatique haute performance certifié conforme aux normes européennes CE et garanti 3 ans par le constructeur.'}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-200/80">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-neutral-900 font-mono">
                    {activeProduct.unitPriceTTC.toFixed(2)} €
                  </span>
                  <span className="text-xs text-neutral-500 ml-1.5">TTC</span>
                </div>
                <div className="text-xs text-neutral-500 text-right">
                  <span>HT : {activeProduct.unitPriceHT.toFixed(2)} €</span>
                  <span className="block text-[10px] text-neutral-400">TVA 20% incluse</span>
                </div>
              </div>

              {orderedSuccess ? (
                <div className="mt-3 p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Commande validée et ajoutée à votre espace client !</span>
                </div>
              ) : (
                <button
                  id="btn-order-product-store"
                  type="button"
                  disabled={isOrdering}
                  onClick={() => handleSimulatePurchase(activeProduct)}
                  className="w-full mt-3 py-3 px-5 rounded-xl bg-black hover:bg-neutral-900 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4 text-[#38E044]" />
                  <span>{isOrdering ? 'Traitement de la commande...' : 'Commander ce produit'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Other Products in Catalog */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            Autres modules & écrans LED du catalogue PIXIATECH
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STORE_CATALOG.map((prod) => {
              const isSelected = activeProduct.productId === prod.productId;
              return (
                <div
                  key={prod.productId}
                  onClick={() => setActiveProduct(prod)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer bg-white space-y-2.5 ${
                    isSelected
                      ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-400 hover:shadow-xs'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={prod.productImage}
                      alt={prod.productName}
                      className="w-full h-24 object-cover rounded-xl border border-neutral-100"
                    />
                    {isSelected && (
                      <span className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38E044]" />
                        Sélectionné
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-neutral-900 line-clamp-1">
                    {prod.productName}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                    <span className="font-mono font-bold text-neutral-900">
                      {prod.unitPriceTTC.toFixed(2)} €
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveProduct(prod);
                      }}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {isSelected ? 'Actif' : 'Sélectionner'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Paiement 100% sécurisé
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-sky-600" />
              Livraison Express 24/48h
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black cursor-pointer"
          >
            Fermer la boutique
          </button>
        </div>
      </div>
    </div>
  );
};
