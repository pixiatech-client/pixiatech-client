'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeEditor } from './_components/theme-editor';
import type { Theme, Settings as AppSettings } from '@/lib/types';
import { getThemes, getSettings } from '@/app/admin/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const ThemesPage = () => {
  const { toast } = useToast();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedThemes, fetchedSettings] = await Promise.all([getThemes(), getSettings()]);
      setThemes(fetchedThemes);
      setSettings(fetchedSettings);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les données des thèmes.' });
    } finally {
       setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !settings) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-40 w-full" />
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Thèmes</CardTitle>
        <CardDescription>
          Personnalisez l'apparence de l'application d'estimation en temps réel.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ThemeEditor themes={themes} settings={settings} onDataChange={fetchData} />
      </CardContent>
    </Card>
  );
};

ThemesPage.displayName = 'ThemesPage';
export default ThemesPage;
