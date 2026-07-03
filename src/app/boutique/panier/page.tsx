'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Minus, Plus, Heart, Truck, ArrowRight, ArrowLeft, Tag, ChevronDown, CreditCard, Landmark, Shield, Info, User, Building2, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, fetchUpsellProducts } from '@/lib/boutique-data';
import type { Product } from '@/lib/boutique-data';
import { toast } from 'sonner';
import { useProfile } from '@/contexts/ProfileContext';

function QtySelector({ value, onMinus, onPlus }: { value: number; onMinus: () => void; onPlus: () => void }) {
  const [anim, setAnim] = useState(false);

  const handleMinus = () => {
    onMinus();
    setAnim(true);
    setTimeout(() => setAnim(false), 200);
  };

  const handlePlus = () => {
    onPlus();
    setAnim(true);
    setTimeout(() => setAnim(false), 200);
  };

  return (
    <div className="flex items-center border border-gray-200/70 rounded-lg overflow-hidden w-fit bg-white">
      <button onClick={handleMinus} className="px-3 py-2 hover:bg-gray-50 transition-colors active:scale-90">
        <Minus size={16} className="text-gray-500" />
      </button>
      <span className={`px-4 py-2 text-sm font-semibold text-gray-900 border-x border-gray-200/70 min-w-[48px] text-center transition-all duration-200 ${anim ? 'scale-110' : ''}`}>
        {value}
      </span>
      <button onClick={handlePlus} className="px-3 py-2 hover:bg-gray-50 transition-colors active:scale-90">
        <Plus size={16} className="text-gray-500" />
      </button>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, savedItems, addItem, removeItem, updateQuantity, itemCount, subtotal, promo, promoError, applyPromo, removePromo, totalAfterDiscount, clearCart, saveItem, unsaveItem, moveToCart, isSaved } = useCart();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const { profileType, setProfileType, showHT, showTTC, priceLabel, isB2B, forceB2B } = useProfile();

  useEffect(() => {
    const cartIds = items.map(i => i.productId);
    console.log('[upsell] cartIds:', cartIds);
    if (cartIds.length > 0) {
      fetchUpsellProducts(cartIds).then(prods => {
        console.log('[upsell] fetched products:', prods.map(p => p.name));
        setUpsellProducts(prods);
      });
    } else {
      setUpsellProducts([]);
    }
  }, [items]);

  const tva = isB2B ? 0 : Math.round(totalAfterDiscount * 0.2);
  const total = totalAfterDiscount + tva;
  const discount = promo ? subtotal - totalAfterDiscount : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>


      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-8">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Votre panier est vide</h2>
            <p className="text-gray-400 text-sm mb-6">Découvrez nos produits dans la boutique</p>
            <button onClick={() => router.push('/boutique')} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all">
              Découvrir la boutique
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const lastItem = items[items.length - 1];
                      if (lastItem) router.push(`/boutique/produit/${lastItem.productId}`);
                      else router.push('/boutique');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-900 text-white border border-white/20 text-xs font-semibold hover:bg-gray-800 hover:shadow-md transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    Retour
                  </button>
                  <p className="text-sm text-gray-500">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                  <button
                    onClick={() => { clearCart(); toast.success('Panier vidé'); }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                    Vider le panier
                  </button>
                </div>
                {items.map((item) => (
                  <div key={item.productId + '-' + item.type + '-' + (item.variantName || '')} className="bg-white rounded-2xl border border-gray-200/70 p-5 flex gap-6 transition-all duration-300 hover:shadow-md group">
                    <div className="w-24 h-24 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      {(item.variantImage || item.image) ? (
                        <img src={item.variantImage || item.image!} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag size={24} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                    </div>
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="font-bold text-gray-900 text-base mb-1">{item.name}</h2>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm text-gray-400">{item.category}</p>
                            {item.variantName && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-900 text-white">
                                {item.variantName}
                              </span>
                            )}
                            {item.variantReference && (
                              <span className="text-[10px] text-gray-400 font-mono">Réf: {item.variantReference}</span>
                            )}
                            {item.type === 'rental' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                Location
                              </span>
                            )}
                          </div>
                          {item.type === 'rental' && item.rentalStartDate && (
                            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                              <p>Du {item.rentalStartDate} au {item.rentalEndDate}</p>
                              <p>De {item.rentalStartTime} à {item.rentalEndTime}</p>
                            </div>
                          )}
                          {item.variantPrice && item.variantPrice !== item.price && (
                            <div className="mt-1 text-xs text-gray-400">
                              Prix unitaire: {formatPrice(item.price)}
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-gray-900 text-base ml-2 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quantité</label>
                          <QtySelector
                            value={item.quantity}
                            onMinus={() => updateQuantity(item.productId, item.quantity - 1, item.type, item.variantName)}
                            onPlus={() => updateQuantity(item.productId, item.quantity + 1, item.type, item.variantName)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => saveItem(item)} className={`flex items-center gap-1.5 text-xs transition-colors ${isSaved(item.productId, item.variantName) ? 'text-red-500' : 'text-gray-400 hover:text-gray-700'}`}>
                            <Heart size={15} className={isSaved(item.productId, item.variantName) ? 'fill-red-500' : ''} />
                            {isSaved(item.productId, item.variantName) ? 'Sauvegardé' : 'Sauvegarder'}
                          </button>
                          <button onClick={() => removeItem(item.productId, item.type, item.variantName)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-amber-50 rounded-2xl p-5 flex items-center gap-4 border border-amber-200/60">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Truck size={20} className="text-amber-600" />
                  </div>
                  <p className="text-sm text-amber-800">
                    <strong>Livraison Express</strong> — le montant sera calculé lors du paiement selon votre adresse.
                  </p>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
                <div className="bg-white rounded-2xl border border-gray-200/70 p-6">
                  <h3 className="font-bold text-gray-900 text-base mb-5">Récapitulatif</h3>
                    <div className="space-y-3 pb-5 border-b border-gray-200/40">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Sous-total HT</span>
                        <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-600">Code promo ({promo?.code})</span>
                          <span className="font-semibold text-emerald-600">-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Livraison Express</span>
                        <span className="text-xs text-gray-400">Calculée lors du paiement</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">TVA {isB2B ? '(0%)' : '(20%)'}</span>
                        <span className="font-semibold text-gray-900">{formatPrice(tva)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-5 mb-6">
                      <span className="font-bold text-gray-900 text-base">{isB2B ? 'Total HT' : 'Total TTC'}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-lg">{formatPrice(total)}</span>
                        {!forceB2B && (
                        <div className="relative">
                          <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="relative flex items-center justify-center w-5 h-5 group"
                          >
                            <Info size={14} className="relative z-10 text-blue-600" />
                            <span className="absolute inset-0 z-0 animate-ping rounded-full bg-blue-400/40 group-hover:bg-blue-400/60" style={{ animationDuration: '2.5s' }} />
                          </button>
                          {showInfo && (
                            <div className="absolute z-20 right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl p-4">
                              <p className="text-xs text-gray-500 leading-relaxed">Nos produits sont principalement destinés aux professionnels, entreprises, collectivités et revendeurs. Les particuliers peuvent également commander directement depuis notre boutique.</p>
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-800 mb-3">Vous êtes ?</p>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => { setProfileType('particulier'); setShowInfo(false); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'particulier' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    <User size={16} />
                                    Je suis un particulier
                                  </button>
                                  <button
                                    onClick={() => { setProfileType('entreprise'); setShowInfo(false); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${profileType === 'entreprise' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                  >
                                    <Building2 size={16} />
                                    Je suis une entreprise
                                  </button>
                                </div>
                              </div>
                              <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors">
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    </div>
                  <button
                    onClick={() => router.push('/boutique/paiement')}
                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    Passer à la caisse
                    <ArrowRight size={18} />
                  </button>
                  <div className="flex justify-center gap-4 mt-5 opacity-40">
                    <CreditCard size={22} className="text-gray-500" />
                    <Landmark size={22} className="text-gray-500" />
                    <Shield size={22} className="text-gray-500" />
                  </div>
                </div>

                <div className="mt-4 bg-white rounded-2xl border border-gray-200/70 overflow-hidden">
                  {promo ? (
                    <div className="p-4 flex items-center justify-between bg-emerald-50">
                      <div className="flex items-center gap-2">
                        <Tag size={15} className="text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">{promo.code}</span>
                        <span className="text-xs text-emerald-500">(-{formatPrice(discount)})</span>
                      </div>
                      <button onClick={removePromo} className="text-xs text-red-500 hover:text-red-700 font-semibold">Retirer</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => setPromoOpen(!promoOpen)} className="w-full flex items-center justify-between p-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        <span className="flex items-center gap-2">
                          <Tag size={15} />
                          Ajouter un code promotionnel
                        </span>
                        <ChevronDown size={16} className={`transition-transform duration-200 ${promoOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {promoOpen && (
                        <div className="px-4 pb-4 overflow-hidden">
                          <div className="flex gap-2 w-full">
                            <input
                              type="text"
                              placeholder="Code promo"
                              value={promoInput}
                              onChange={e => setPromoInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') applyPromo(promoInput); }}
                              className="min-w-0 flex-1 bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"
                            />
                            <button onClick={() => applyPromo(promoInput)} className="shrink-0 bg-gray-900 text-white px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors">Appliquer</button>
                          </div>
                          {promoError && <p className="text-xs text-red-500 mt-2">{promoError}</p>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {savedItems.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Heart size={16} className="text-red-500 fill-red-500" />
                  <h2 className="font-bold text-gray-900 text-lg">Articles sauvegardés ({savedItems.length})</h2>
                </div>
                <div className="space-y-3">
                  {savedItems.map((item) => (
                    <div key={item.productId + '-' + item.type + '-' + (item.variantName || '')} className="bg-white rounded-2xl border border-gray-200/70 p-4 flex items-center gap-4 transition-all hover:shadow-sm">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        {(item.variantImage || item.image) ? (
                          <img src={item.variantImage || item.image!} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-400">{item.category}</p>
                        {item.variantName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-gray-100 text-gray-600 mt-1">
                            {item.variantName}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.price)}</div>
                      <button
                        onClick={() => moveToCart(item)}
                        className="shrink-0 flex items-center gap-1.5 bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingBag size={13} />
                        Remettre au panier
                      </button>
                      <button onClick={() => unsaveItem(item.productId, item.type, item.variantName)} className="shrink-0 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upsellProducts.length > 0 && (
              <section className="mt-16">
                <h2 className="font-bold text-gray-900 text-lg mb-5">Complétez votre installation</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {upsellProducts.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-200/70 p-4 group hover:shadow-md transition-all duration-300">
                      <div onClick={() => router.push(`/boutique/produit/${p.id}`)} className="aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 cursor-pointer">
                        <div className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${p.image})` }} />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{p.name}</h3>
                      <p className="text-sm font-bold text-gray-900 mb-3">{formatPrice(p.price)}</p>
                      <button onClick={() => { addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category, type: 'purchase' }); toast.success(`${p.name} ajouté au panier`); }} className="w-full border border-gray-200/70 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

    </div>
  );
}
