
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateQuoteStatus } from '@/app/admin/actions';
import type { QuoteRequest } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilePen } from 'lucide-react';
import { useAdminT } from '@/hooks/useAdminT';

interface EditTrackingNumberDialogProps {
  quote: QuoteRequest;
  onUpdate: (updatedQuoteData: Partial<QuoteRequest>) => void;
  children?: React.ReactNode;
}

export function EditTrackingNumberDialog({ quote, onUpdate, children }: EditTrackingNumberDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { t } = useAdminT();
  const [trackingNumber, setTrackingNumber] = useState(quote.trackingNumber || '');

  useEffect(() => {
    if (isOpen) {
      setTrackingNumber(quote.trackingNumber || '');
    }
  }, [isOpen, quote.trackingNumber]);

  const handleSave = () => {
    startTransition(async () => {
      const updatedData: Partial<QuoteRequest> = { trackingNumber };
      try {
        await updateQuoteStatus(quote.id, updatedData);
        onUpdate(updatedData);
        setIsOpen(false);
        toast({ title: t("Tracking number updated"), variant: 'success' });
      } catch (e) {
        toast({ title: t("Error"), description: t("Unable to save tracking number."), variant: 'destructive' });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
           <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600">
             <FilePen className="h-4 w-4" />
           </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Edit tracking number")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label htmlFor="trackingNumber">{t("Tracking number")}</Label>
          <Input
            id="trackingNumber"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder={t("Enter the new number...")}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>{t("Cancel")}</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
