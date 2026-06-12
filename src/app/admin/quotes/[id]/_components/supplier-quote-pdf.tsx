
'use client';

import type { QuoteRequest, City, Product } from '@/lib/types';
import type { ProductSpec } from '@/lib/types';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateQuoteStatus, updateQuoteClientDetails, updateProductSpecs } from '@/app/admin/actions';
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { useAdminT } from '@/hooks/useAdminT';

interface EditableFieldProps {
    value: string | number;
    onSave: (newValue: string | number) => void;
    multiline?: boolean;
    className?: string;
    placeholder?: string;
    type?: 'text' | 'number';
}

const EditableField = ({ value, onSave, multiline = false, className, placeholder, type = 'text' }: EditableFieldProps) => {
    const [currentValue, setCurrentValue] = useState(value);
    const { toast } = useToast();
    const { t } = useAdminT();

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);
    
    const debouncedSave = debounce(async (newValue: string | number) => {
        try {
            await onSave(newValue);
            toast({ title: t("Field saved"), variant: 'success', duration: 2000 });
        } catch (error) {
            toast({ title: "Error", description: t("Unable to save the field."), variant: 'destructive' });
        }
    }, 1000);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newValue = type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value;
        setCurrentValue(newValue);
    };


    const handleBlur = () => {
        if (currentValue !== value) {
            debouncedSave(currentValue);
        }
    };

    const commonProps = {
        value: currentValue,
        onChange: handleChange,
        onBlur: handleBlur,
        className: `bg-transparent border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 focus:bg-yellow-100 dark:focus:bg-yellow-900 rounded-sm px-1 -mx-1 ${className}`,
        placeholder: placeholder,
    };

    return multiline ? <Textarea {...commonProps} /> : <Input type={type} {...commonProps} />;
}


interface SupplierQuotePdfProps {
  id?: string;
  request: QuoteRequest;
  specs: Record<string, ProductSpec[]>;
  selectedCity: City | null;
  allProducts: Product[];
  onUpdateRequest: (updatedData: Partial<QuoteRequest>, updatedSpecs?: Record<string, ProductSpec[]>) => void;
}

export function SupplierQuotePdf({ id, request: initialRequest, specs: initialSpecs, selectedCity, allProducts, onUpdateRequest }: SupplierQuotePdfProps) {
  const [request, setRequest] = useState(initialRequest);
  const [specs, setSpecs] = useState(initialSpecs);
  
  useEffect(() => {
    setRequest(initialRequest);
  }, [initialRequest]);

  useEffect(() => {
    setSpecs(initialSpecs);
  }, [initialSpecs]);

  const [editableContent, setEditableContent] = useState({
    title: "Supplier Technical Sheet",
    subtitle: "Equipment Request",
    destinationTitle: "Destination",
    productsTitle: "List of required products",
    notesTitle: "Notes for the supplier",
    qtyHeader: "Quantity",
    dimHeader: "Dimensions (W x H)",
    transHeader: "Transaction",
    specsTitle: "Technical Specifications",
    specKeyHeader: "Characteristic",
    specValueHeader: "Value",
  });

  const handleContentSave = (field: keyof typeof editableContent) => async (value: string | number) => {
    setEditableContent(prev => ({ ...prev, [field]: String(value) }));
  };

  const handleFieldSave = (field: keyof QuoteRequest) => async (value: string | number) => {
    const updatedData = { [field]: value };
    await updateQuoteStatus(request.id, updatedData);
    onUpdateRequest(updatedData);
  };
  
  const handleClientFieldSave = (field: keyof QuoteRequest['client']) => async (value: string | number) => {
    const updatedClientData = { ...request.client, [field]: value };
    await updateQuoteClientDetails(request.id, updatedClientData);
    onUpdateRequest({ client: updatedClientData });
  };
  
  const handleProductFieldSave = (productId: string, field: keyof QuoteRequest['products'][0]) => async (value: string | number) => {
    const products = request.products || [];
    const updatedProducts = products.map(p => {
        if (p.id === productId) {
            return { ...p, [field]: value };
        }
        return p;
    });
    await updateQuoteStatus(request.id, { products: updatedProducts });
    onUpdateRequest({ products: updatedProducts });
  }

  const handleSpecFieldSave = (productId: string, specId: string, field: 'key' | 'value') => async (value: string | number) => {
      const updatedSpecs = { ...specs };
      const productSpecs = updatedSpecs[productId].map(spec => {
          if (spec.id === specId) {
              return { ...spec, [field]: String(value) };
          }
          return spec;
      });
      updatedSpecs[productId] = productSpecs;
      await updateProductSpecs({ productId, specs: productSpecs });
      onUpdateRequest({}, updatedSpecs); // Pass updated specs to parent
  }

  const createdAtDate =
    request && typeof request.createdAt === 'string'
      ? new Date(request.createdAt)
      : new Date();

  return (
    <div
      id={id || 'supplier-sheet-content'}
      className="bg-white font-sans text-gray-800 w-[210mm] h-auto min-h-[297mm] p-12 text-sm page-break-after"
    >
      <header className="flex justify-between items-start pb-8 border-b">
        <div>
          <h1 className="text-2xl font-bold">
              <EditableField value={editableContent.title} onSave={handleContentSave('title')} placeholder="Main title"/>
          </h1>
          <p className="text-muted-foreground">
             <EditableField value={editableContent.subtitle} onSave={handleContentSave('subtitle')} placeholder="Subtitle"/>
          </p>
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="font-bold">Estimation #:</span> {request.id.substring(0, 6).toUpperCase()}
          </p>
          <p>
            <span className="font-bold">Date:</span> {createdAtDate.toLocaleDateString('fr-FR')}
          </p>
           <p className='flex items-center gap-1 justify-end'>
            <span className="font-bold">Client:</span>
            <EditableField value={request.client.companyName} onSave={handleClientFieldSave('companyName')} placeholder="Client name"/>
          </p>
        </div>
      </header>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">
          <EditableField value={editableContent.destinationTitle} onSave={handleContentSave('destinationTitle')} />
        </h2>
         {selectedCity ? (
            <p><strong>City:</strong> {selectedCity.name} ({selectedCity.postalCode})</p>
          ) : request.unconfiguredCityQuery ? (
            <p className='flex items-center gap-1'><strong>Requested destination:</strong> <EditableField value={request.unconfiguredCityQuery} onSave={handleFieldSave('unconfiguredCityQuery')} placeholder="Destination"/> (Not configured)</p>
          ) : (
            <p className="text-muted-foreground">No delivery destination specified.</p>
          )}
      </div>

      <main className="mt-8">
        <h2 className="text-lg font-semibold mb-4">
            <EditableField value={editableContent.productsTitle} onSave={handleContentSave('productsTitle')} />
        </h2>
        {(request.products || []).map((p, index) => {
            const productSpecs = specs[p.productId] || [];
            const productInfo = allProducts.find(prod => prod.id === p.productId);
            const area = p.width * p.height;
            const tileArea = (p.tileWidth && p.tileHeight) ? (p.tileWidth / 100) * (p.tileHeight / 100) : 0;
            const tilesNeeded = tileArea > 0 ? Math.ceil(area / tileArea) : 0;

            const transactionText = p.transactionType === 'sale' ? 'Sale' : (p.rentalUnit === 'day' ? `Rental ${p.rentalDuration} day(s)` : `Rental ${p.rentalDuration} hour(s)`);
            const productsLength = (request.products || []).length;

            return (
              <div key={p.id} className={`py-4 ${index < productsLength - 1 ? 'border-b' : ''}`}>
                <h3 className="text-md font-semibold text-gray-800">
                    <EditableField value={p.productName} onSave={handleProductFieldSave(p.id, 'productName')} placeholder="Product name" />
                </h3>
                <table className="w-full text-left mt-2">
                  <thead className="border-b bg-gray-50">
                    <tr className="border-b">
                      <th className="p-2 font-semibold text-center w-1/4">
                          <EditableField value={editableContent.qtyHeader} onSave={handleContentSave('qtyHeader')} className="text-center font-semibold" />
                      </th>
                      <th className="p-2 font-semibold text-center w-1/4">
                          <EditableField value={editableContent.dimHeader} onSave={handleContentSave('dimHeader')} className="text-center font-semibold" />
                      </th>
                      <th className="p-2 font-semibold text-center w-1/2">
                          <EditableField value={editableContent.transHeader} onSave={handleContentSave('transHeader')} className="text-center font-semibold" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b last:border-b-0">
                      <td className="p-2 text-center align-top"><EditableField type="number" value={p.quantity} onSave={handleProductFieldSave(p.id, 'quantity')} placeholder="Qty" className="text-center" /></td>
                      <td className="p-2 text-center align-top flex gap-1 items-center justify-center">
                          <EditableField type="number" value={p.width} onSave={handleProductFieldSave(p.id, 'width')} placeholder="W" className="text-center" />
                           x 
                          <EditableField type="number" value={p.height} onSave={handleProductFieldSave(p.id, 'height')} placeholder="H" className="text-center" />
                          m
                      </td>
                      <td className="p-2 text-center align-top capitalize">
                         <EditableField value={transactionText} onSave={() => {}} placeholder="Transaction" className="text-center" />
                      </td>
                    </tr>
                     {tilesNeeded > 0 && (
                        <tr className="border-b last:border-b-0 bg-gray-50">
                            <td colSpan={3} className="p-2 text-xs">
                                <span className="font-semibold">Technical details:</span> Surface area <strong>{area.toFixed(2)} m²</strong>,
                                requiring <strong>{tilesNeeded} tiles</strong> of {p.tileWidth}cm x {p.tileHeight}cm.
                            </td>
                        </tr>
                     )}
                  </tbody>
                </table>
                
                {productSpecs.length > 0 && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-gray-600">
                           <EditableField value={editableContent.specsTitle} onSave={handleContentSave('specsTitle')} />
                        </h4>
                        <table className="w-full text-left mt-1">
                             <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="p-2 font-semibold w-1/2">
                                       <EditableField value={editableContent.specKeyHeader} onSave={handleContentSave('specKeyHeader')} className="font-semibold" />
                                    </th>
                                    <th className="p-2 font-semibold w-1/2">
                                       <EditableField value={editableContent.specValueHeader} onSave={handleContentSave('specValueHeader')} className="font-semibold" />
                                    </th>
                                </tr>
                             </thead>
                             <tbody>
                                {productSpecs.map(spec => (
                                    <tr key={spec.id} className="border-b last:border-b-0">
                                        <td className="p-2"><EditableField value={spec.key} onSave={handleSpecFieldSave(p.productId, spec.id, 'key')} /></td>
                                        <td className="p-2"><EditableField value={spec.value} onSave={handleSpecFieldSave(p.productId, spec.id, 'value')} /></td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                )}
              </div>
            );
        })}
      </main>

        {request.client.sitePhoto && (
            <div className="mt-8 border-t pt-8">
                <h3 className="text-md font-semibold mb-4">Installation photo</h3>
                <div className="w-full h-auto max-h-[100mm] rounded-lg overflow-hidden border">
                    <img src={request.client.sitePhoto} alt="Site" className="w-full h-full object-contain bg-gray-50" />
                </div>
            </div>
        )}

        <footer className="mt-12 pt-8 border-t">
            <h3 className="text-md font-semibold mb-2">
                <EditableField value={editableContent.notesTitle} onSave={handleContentSave('notesTitle')} />
            </h3>
            <EditableField 
                value={request.supplierNotes || ''} 
                onSave={handleFieldSave('supplierNotes')}
                placeholder="Add a note for the supplier..."
                multiline
                className="w-full border p-2 rounded-md h-24 focus:bg-yellow-100"
            />
        </footer>
    </div>
  );
}
