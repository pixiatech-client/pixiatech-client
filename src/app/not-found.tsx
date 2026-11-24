import { cookies } from 'next/headers';
import { Arvo } from 'next/font/google';
import fr from '@/lib/locales/fr.json';
import en from '@/lib/locales/en.json';
import NotFoundRocketButton from '@/components/not-found-rocket-button';
import styles from './not-found.module.css';

const arvo = Arvo({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-arvo',
});

export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('admin-locale')?.value === 'en' ? 'en' : 'fr';
  const copy = (locale === 'en' ? en : fr).notFound;

  return (
    <section className={`${styles.page404} ${arvo.variable}`}>
      <div className={styles.container}>
        <div className={styles.textCenter}>
          <div className={styles.fourZeroFourBg}>
            <h1 className={styles.textCenter}>404</h1>
          </div>

          <div className={styles.contentBox}>
            <h3>{copy.heading}</h3>
            <p>{copy.message}</p>
            <NotFoundRocketButton locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
