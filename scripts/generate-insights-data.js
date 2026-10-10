const fs = require('fs');
const path = require('path');

const processed = JSON.parse(fs.readFileSync(path.join(__dirname, '../scratch/processed-articles.json'), 'utf8'));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseArticle(art) {
  const lines = art.content.split('\n');
  const toc = [];
  const faqs = [];
  
  let inFaq = false;
  let currentFaqQ = null;
  let currentFaqA = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) {
      const heading = line.replace(/^##\s+/, '').trim();
      const id = slugify(heading);
      toc.push({ id, title: heading });
      if (heading.toLowerCase().includes('frequently asked questions') || heading.toLowerCase().includes('faq')) {
        inFaq = true;
      } else {
        if (inFaq && currentFaqQ) {
          faqs.push({ question: currentFaqQ, answer: currentFaqA.join(' ').trim() });
          currentFaqQ = null;
          currentFaqA = [];
        }
        inFaq = false;
      }
    } else if (inFaq) {
      if (line.endsWith('?') || (line.length > 5 && line.length < 120 && !line.startsWith('>') && !line.startsWith('1.') && !line.startsWith('2.') && !line.startsWith('3.') && lines[i+1] && lines[i+1].length > 0 && !lines[i+1].endsWith('?'))) {
        if (currentFaqQ) {
          faqs.push({ question: currentFaqQ, answer: currentFaqA.join(' ').trim() });
          currentFaqA = [];
        }
        currentFaqQ = line;
      } else if (line.length > 0) {
        currentFaqA.push(line);
      }
    }
  }

  if (inFaq && currentFaqQ) {
    faqs.push({ question: currentFaqQ, answer: currentFaqA.join(' ').trim() });
  }

  return {
    ...art,
    toc,
    faqs
  };
}

const parsedArticles = processed.map(parseArticle);

const tsContent = `export interface InsightFaqItem {
  question: string;
  answer: string;
}

export interface InsightTocItem {
  id: string;
  title: string;
}

export interface InsightArticle {
  slug: string;
  img: string;
  category: string;
  chip: string;
  tag?: string;
  title: string;
  titleFr?: string;
  desc?: string;
  descFr?: string;
  read: string;
  date: string;
  dateFr?: string;
  featured?: boolean;
  publishedTimeIso?: string;
  content: string;
  faqs: InsightFaqItem[];
  toc: InsightTocItem[];
}

export const INSIGHTS_ARTICLES: InsightArticle[] = ${JSON.stringify(parsedArticles, null, 2)};

export function getInsightArticle(slug: string): InsightArticle | undefined {
  return INSIGHTS_ARTICLES.find((a) => a.slug === slug);
}

export function getAllInsightArticles(): InsightArticle[] {
  return INSIGHTS_ARTICLES;
}
`;

const destPath = path.join(__dirname, '../src/web/data/insights-articles-content.ts');
fs.writeFileSync(destPath, tsContent, 'utf8');
console.log('Successfully wrote', destPath, '(' + fs.statSync(destPath).size + ' bytes)');
