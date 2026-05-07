
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { QuoteRequest, Product, ProductSpec } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface SupplierQuoteDetailsProps {
  quote: QuoteRequest;
  allProducts: Product[];
  specs: Record<string, ProductSpec[]>;
}

export function SupplierQuoteDetails({ quote, allProducts, specs }: SupplierQuoteDetailsProps) {
  const router = useRouter();

  const isVideoUrl = (url: string | undefined): url is string => {
    if (!url) return false;
    const cleanUrl = url.split('?')[0];
    return /\.(mp4|webm|mov)/i.test(cleanUrl);
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Fiche Technique pour Fournisseur</CardTitle>
              <CardDescription>
                Détails de la demande de matériel pour l'estimation EST-
                {quote.id.substring(0, 6).toUpperCase()}
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
                <p>Client: {quote.client.companyName}</p>
                <p>Date: {new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quote.products.map(p => {
              const productInfo = allProducts.find(prod => prod.id === p.productId);
              const productSpecs = specs[p.productId] || [];
              const area = p.width * p.height;
              const tileArea = (p.tileWidth && p.tileHeight) ? (p.tileWidth / 100) * (p.tileHeight / 100) : 0;
              const tilesNeeded = tileArea > 0 ? Math.ceil(area / tileArea) : 0;

              return (
                <div key={p.id} className="border-t pt-6 first:border-t-0">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">{p.productName}
                            <Badge variant={p.transactionType === 'sale' ? 'default' : 'secondary'} className="text-xs">
                                {p.transactionType === 'sale' ? 'Vente' : 'Location'}
                            </Badge>
                        </h3>

                        <table className="w-full text-sm">
                            <tbody>
                                <tr className='border-b'><td className='py-2 font-medium text-muted-foreground'>Quantité</td><td className='py-2 text-right font-semibold'>{p.quantity}</td></tr>
                                {productInfo?.hasDimensions !== false && <tr className='border-b'><td className='py-2 font-medium text-muted-foreground'>Dimensions</td><td className='py-2 text-right font-semibold'>{p.width}m × {p.height}m</td></tr>}
                                {tilesNeeded > 0 && <tr className='border-b'><td className='py-2 font-medium text-muted-foreground'>Surface / Dalles</td><td className='py-2 text-right font-semibold'>{area.toFixed(2)} m² ({tilesNeeded} dalles)</td></tr>}
                            </tbody>
                        </table>
                        
                        {productSpecs.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-muted-foreground mb-2">Spécifications</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    {productSpecs.map(spec => (
                                        <React.Fragment key={spec.id}>
                                            <div className="text-muted-foreground">{spec.key}</div>
                                            <div className="font-semibold">{spec.value}</div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                     {productInfo?.videoUrl && (
                        <div className="w-full md:w-64 h-48 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
                           {isVideoUrl(productInfo.videoUrl) ? (
                                <video src={productInfo.videoUrl} muted loop autoPlay playsInline className="object-cover w-full h-full" />
                            ) : (
                                <Image src={productInfo.videoUrl} alt={productInfo.name} width={256} height={192} className="object-cover w-full h-full"/>
                            )}
                        </div>
                     )}
                  </div>
                </div>
              )
            })}
             {quote.client.notes && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Notes additionnelles du client</h3>
                    <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{quote.client.notes}</p>
                </div>
            )}
            
            {quote.client.sitePhoto && (
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800">Photo de l'installation</h3>
                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                        <img 
                          src={quote.client.sitePhoto} 
                          alt="Lieu de l'installation" 
                          className="w-full h-auto max-h-[500px] object-contain"
                        />
                    </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
