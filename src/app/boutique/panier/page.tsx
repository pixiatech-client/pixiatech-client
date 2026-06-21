'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus, Heart, Truck, ArrowRight, Tag, ChevronDown, CreditCard, Shield, Landmark } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, products } from '@/lib/boutique-data';
import { toast } from 'sonner';

const upsellProducts = products.slice(0, 4);

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
  const { items, addItem, removeItem, updateQuantity, itemCount, subtotal } = useCart();
  const [promoOpen, setPromoOpen] = useState(false);

  const total = subtotal;
  const tva = Math.round(total * 0.2);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 h-16 border-b border-gray-200/60">
        <button onClick={() => router.push('/boutique')} className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors">
          <ArrowLeft size={18} />
          Retour à la boutique
        </button>
        <h1 className="font-bold text-lg text-gray-900 absolute left-1/2 -translate-x-1/2">Votre Panier</h1>
        <div className="w-24" />
      </header>

      <main className="max-w-6xl mx-auto px-6 md:px-12 lg:px-16 py-8">
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
            <div className="grid grid-cols-12 gap-8 items-start">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.productId} className="bg-white rounded-2xl border border-gray-200/70 p-5 flex gap-6 transition-all duration-300 hover:shadow-md group">
                    <div className="w-44 h-44 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                    </div>
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="font-bold text-gray-900 text-base mb-1">{item.name}</h2>
                          <p className="text-sm text-gray-400">{item.category}</p>
                        </div>
                        <span className="font-bold text-gray-900 text-base whitespace-nowrap ml-2">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <div className="mt-auto flex items-end justify-between">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quantité</label>
                          <QtySelector
                            value={item.quantity}
                            onMinus={() => updateQuantity(item.productId, item.quantity - 1)}
                            onPlus={() => updateQuantity(item.productId, item.quantity + 1)}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                            <Heart size={15} />
                            Sauvegarder
                          </button>
                          <button onClick={() => removeItem(item.productId)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-emerald-50 rounded-2xl p-5 flex items-center gap-4 border border-emerald-200/60">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Truck size={20} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-800">
                    Félicitations ! Vous bénéficiez de la <strong>Livraison Express OFFERTE</strong> sur cette commande.
                  </p>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 lg:sticky lg:top-8">
                <div className="bg-white rounded-2xl border border-gray-200/70 p-6">
                  <h3 className="font-bold text-gray-900 text-base mb-5">Récapitulatif</h3>
                  <div className="space-y-3 pb-5 border-b border-gray-200/40">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sous-total</span>
                      <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Livraison Express</span>
                      <span className="font-semibold text-emerald-600 text-xs uppercase tracking-wider">Offert</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">TVA (20%)</span>
                      <span className="font-semibold text-gray-900">{formatPrice(tva)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-5 mb-6">
                    <span className="font-bold text-gray-900 text-base">Total à payer</span>
                    <span className="font-bold text-gray-900 text-lg">{formatPrice(total)}</span>
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
                  <button onClick={() => setPromoOpen(!promoOpen)} className="w-full flex items-center justify-between p-4 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <span className="flex items-center gap-2">
                      <Tag size={15} />
                      Ajouter un code promotionnel
                    </span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${promoOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {promoOpen && (
                    <div className="px-4 pb-4">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Code promo" className="flex-1 bg-gray-50 border border-gray-200/70 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors" />
                        <button className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">Appliquer</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
                    <button onClick={() => { addItem({ productId: p.id, name: p.name, price: p.price, image: p.image, category: p.category }); toast.success(`${p.name} ajouté au panier`); }} className="w-full border border-gray-200/70 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all">
                      Ajouter
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
