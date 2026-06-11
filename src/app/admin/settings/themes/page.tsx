'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlobalThemeSelector } from './_components/global-theme-selector';
import { useAdminT } from '@/hooks/useAdminT';

const ThemesPage = () => {
  const { t } = useAdminT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Theme')}</CardTitle>
        <CardDescription>
          {t('Choose a global theme for the application. Each theme defines a complete visual identity.')}
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
