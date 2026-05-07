'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { uploadImage } from '@/lib/uploadImage';
import Image from 'next/image';

interface InputWithUploadProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function InputWithUpload({ value, onChange, placeholder }: InputWithUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const downloadURL = await uploadImage(file);
      onChange(downloadURL);
      toast({ variant: 'success', title: 'Téléversement réussi' });
    } catch (error) {
      console.error('Upload failed', error);
      toast({ variant: 'destructive', title: 'Erreur de téléversement', description: (error as Error).message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-grow">
        <div className="flex gap-2 items-center">
          <Input
            placeholder={placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Téléverser un fichier"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
          {value && (
              <Button
                type="button"
                variant="destructive-ghost"
                size="icon"
                onClick={handleRemoveImage}
                title="Supprimer l'image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
          )}
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,video/*"
      />
      {value && (
        <div className="relative w-28 h-20 shrink-0 rounded-md overflow-hidden border">
           <Image src={value} alt="Aperçu" fill className="object-cover" />
        </div>
      )}
    </div>
  );
}
