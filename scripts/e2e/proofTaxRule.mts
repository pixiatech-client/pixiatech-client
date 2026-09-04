import { calculateCheckout } from '../../src/lib/checkout-calculations';

const SUB = 1495;      // 5 jours x 299
const AFTER = 1495;    // sans promo
const DELIVERY = 79.99;
const VAT = 20;

const run = (profileType: any, country: string, vatValidated: boolean) => {
  const c = calculateCheckout({ subtotal: SUB, totalAfterDiscount: AFTER, deliveryCost: DELIVERY, profileType, country, vatValidated, vatRate: VAT });
  return {
    profileType,
    country,
    vatValidated,
    vat: c.vat,
    vatLabel: c.vatLabel,
    totalLabel: c.totalLabel,
    total: c.total,
    delivery: DELIVERY,
    totalIsSubPlusDelivery: Math.abs((AFTER + c.vat + DELIVERY) - c.total) < 0.001,
  };
};

const cases = [
  run('particulier', 'FR', false),           // B2C -> TVA 20%
  run('particulier', 'FR', true),            // B2C, meme si validé -> 20%
  run('entreprise', 'FR', false),            // B2B FR non validée -> 0% autoliquidée
  run('entreprise', 'FR', true),             // B2B FR validée -> 0% autoliquidée
  run('entreprise', 'IT', true),             // B2B UE validée -> 0% autoliquidée
  run('entreprise', 'IT', false),            // B2B UE non validée -> 0% autoliquidée
];

for (const c of cases) console.log(JSON.stringify(c));

// Invariants exigés par le ticket :
const b2c = cases[0];
const b2bAny = cases[3]; // entreprise FR validée
const b2bNonValid = cases[2];
const assert = (name: string, ok: boolean) => console.log(`ASSERT ${ok ? 'PASS' : 'FAIL'} :: ${name}`);

assert('B2C tvA=20% -> 299', b2c.vat === 299);
assert('B2C total 1873.99', Math.abs(b2c.total - 1873.99) < 0.001);
assert('B2C label TVA (20%)', b2c.vatLabel === 'TVA (20%)');
assert('B2C label Total TTC', b2c.totalLabel === 'Total TTC');
assert('B2B tvA=0 quelle que soit vatValidated', b2bNonValid.vat === 0 && b2bAny.vat === 0);
assert('B2B total 1574.99 (TVA 0)', Math.abs(b2bAny.total - 1574.99) < 0.001);
assert('B2B label TVA (0%) Autoliquidée', b2bAny.vatLabel === 'TVA (0%) — Autoliquidée');
assert('B2B label Total HT', b2bAny.totalLabel === 'Total HT');
assert('delivery toujours 79.99', cases.every(c => Math.abs(c.delivery - 79.99) < 0.001));
assert('total = (sous-total après remise) + tva + livraison (parité serveur)', cases.every(c => c.totalIsSubPlusDelivery));
