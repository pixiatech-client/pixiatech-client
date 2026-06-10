'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalThemeSelector } from './_components/global-theme-selector';

const ThemesPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thème</CardTitle>
        <CardDescription>
          Choisissez un thème global pour l'application. Chaque thème définit une identité visuelle complète.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GlobalThemeSelector />
      </CardContent>
    </Card>
  );
};

ThemesPage.displayName = 'ThemesPage';
export default ThemesPage;
