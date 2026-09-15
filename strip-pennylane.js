// Suppression ONE-SHOT (supprimé du repo après exécution) : retire le mot "PennyLane"
// des SEULES valeurs visibles (admin.factures.*) des 3 locales.
// Chaque ancien tuple doit matcher EXACTEMENT 1 occurrence, sinon → skip (pas de
// remplacement partiel risqué). Tout le reste (clés, logique, serveur) est intact.
const fs = require('fs');

const repl = {
  'fr.json': [
    ['Contrôle fiscal, certification PennyLane & publication sécurisée des factures pour l\'espace client.', 'Contrôle fiscal, certification & publication sécurisée des factures pour l\'espace client.'],
    ['2. En cours (PennyLane)', '2. En cours (homologation)'],
    ['En cours d\'homologation sur PennyLane ou téléversée', 'En cours d\'homologation fiscale ou téléversée'],
    ['En cours (PennyLane)', 'En cours (homologation)'],
    ['Ouvrir le panneau d\'instruction PennyLane', 'Ouvrir le panneau d\'instruction d\'homologation'],
    ['Traitement PennyLane en cours', 'Traitement d\'homologation en cours'],
    ['Gestion Fiscale PennyLane • {number}', 'Gestion Fiscale • {number}'],
    ['Téléchargez le modèle auto-généré, certifiez-le sur votre compte PennyLane, puis téléversez-le ici pour écraser le projet et le publier.', 'Téléchargez le modèle auto-généré, certifiez-le sur votre outil de gestion fiscale, puis téléversez-le ici pour écraser le projet et le publier.'],
    ['HOMOLOGUÉE PENNYLANE', 'HOMOLOGUÉE'],
    ['Exportez le projet auto-généré contenant le SIRET client et les montants pour certification sur PennyLane.', 'Exportez le projet auto-généré contenant le SIRET client et les montants pour certification fiscale.'],
    ['Téléversez la facture officielle issue de PennyLane pour écraser le projet.', 'Téléversez la facture officielle certifiée pour écraser le projet.'],
    ['Étape 1 : Télécharger la Facture Projet (Modèle PennyLane)', 'Étape 1 : Télécharger la Facture Projet (Modèle d\'homologation)'],
    ['Ce document auto-généré reprend toutes les mentions légales et le SIRET client. Importez-le sur votre compte PennyLane pour éditer votre facture certifiée avec numéro d\'homologation fiscale.', 'Ce document auto-généré reprend toutes les mentions légales et le SIRET client. Importez-le dans votre outil de gestion fiscale pour éditer votre facture certifiée avec numéro d\'homologation fiscale.'],
    ['Étape 2 : Uploader la Facture Certifiée PennyLane', 'Étape 2 : Uploader la Facture Certifiée'],
    ['Modèle PennyLane • {number}', 'Modèle d\'homologation • {number}'],
    ['Ce document contient toutes les métadonnées pour importation sur votre compte PennyLane.', 'Ce document contient toutes les métadonnées pour importation dans votre outil de gestion fiscale.'],
    ['⚠️ PROJET DE FACTURE AUTO-GÉNÉRÉ — À HOMOLOGUER SUR PENNYLANE POUR CERTIFICATION FISCALE', '⚠️ PROJET DE FACTURE AUTO-GÉNÉRÉ — À HOMOLOGUER POUR CERTIFICATION FISCALE'],
    ['Le téléversement PennyLane sera disponible dans une prochaine étape.', 'Le téléversement de la facture certifiée sera disponible dans une prochaine étape.'],
  ],
  'en.json': [
    ['Fiscal control, PennyLane certification & secure invoice publishing for the client portal.', 'Fiscal control, certification & secure invoice publishing for the client portal.'],
    ['2. In progress (PennyLane)', '2. In progress (approval)'],
    ['Being certified on PennyLane or uploaded', 'Being fiscally certified or uploaded'],
    ['In progress (PennyLane)', 'In progress (approval)'],
    ['Open the PennyLane processing panel', 'Open the fiscal approval panel'],
    ['PennyLane processing in progress', 'Approval processing in progress'],
    ['PennyLane Fiscal Management • {number}', 'Fiscal Management • {number}'],
    ['Download the auto-generated template, certify it on your PennyLane account, then upload it here to overwrite the draft and publish it.', 'Download the auto-generated template, certify it on your fiscal software account, then upload it here to overwrite the draft and publish it.'],
    ['PENNYLANE APPROVED', 'APPROVED'],
    ['Export the auto-generated draft containing the client SIRET and amounts for PennyLane certification.', 'Export the auto-generated draft containing the client SIRET and amounts for fiscal certification.'],
    ['Upload the official PennyLane invoice to overwrite the draft.', 'Upload the certified official invoice to overwrite the draft.'],
    ['Step 1: Download the Draft Invoice (PennyLane Template)', 'Step 1: Download the Draft Invoice (Approval Template)'],
    ['This auto-generated document contains all legal mentions and the client SIRET. Import it on your PennyLane account to edit your certified invoice with fiscal approval number.', 'This auto-generated document contains all legal mentions and the client SIRET. Import it into your fiscal software account to edit your certified invoice with fiscal approval number.'],
    ['Step 2: Upload the Certified PennyLane Invoice', 'Step 2: Upload the Certified Invoice'],
    ['PennyLane Template • {number}', 'Approval Template • {number}'],
    ['This document contains all the metadata for import into your PennyLane account.', 'This document contains all the metadata for import into your fiscal software account.'],
    ['⚠️ AUTO-GENERATED INVOICE DRAFT — TO BE APPROVED ON PENNYLANE FOR FISCAL CERTIFICATION', '⚠️ AUTO-GENERATED INVOICE DRAFT — TO BE APPROVED FOR FISCAL CERTIFICATION'],
    ['PennyLane upload will be available in a future step.', 'Certified invoice upload will be available in a future step.'],
  ],
  'zh-CN.json': [
    ['税务控制、PennyLane 认证及面向客户门户的安全发票发布。', '税务控制、认证及面向客户门户的安全发票发布。'],
    ['2. 处理中（PennyLane）', '2. 处理中（认证中）'],
    ['正在 PennyLane 上认证或已上传', '正在认证中或已上传'],
    ['处理中（PennyLane）', '处理中（认证中）'],
    ['打开 PennyLane 处理面板', '打开认证处理面板'],
    ['PennyLane 处理中', '认证处理中'],
    ['PennyLane 税务管理 • {number}', '税务管理 • {number}'],
    ['下载自动生成的模板，在您的 PennyLane 账户上认证，然后在此上传以覆盖草稿并发布。', '下载自动生成的模板，在您的税务软件账户上认证，然后在此上传以覆盖草稿并发布。'],
    ['PENNYLANE 已认证', '已认证'],
    ['导出包含客户 SIRET 和金额的自动生成草稿，用于 PennyLane 认证。', '导出包含客户 SIRET 和金额的自动生成草稿，用于税务认证。'],
    ['上传 PennyLane 出具的正式发票以覆盖草稿。', '上传认证过的正式发票以覆盖草稿。'],
    ['步骤 1：下载发票草稿（PennyLane 模板）', '步骤 1：下载发票草稿（认证模板）'],
    ['此自动生成文档包含所有法律声明和客户 SIRET。将其导入您的 PennyLane 账户，以编辑带有税务认证编号的认证发票。', '此自动生成文档包含所有法律声明和客户 SIRET。将其导入您的税务软件账户，以编辑带有税务认证编号的认证发票。'],
    ['步骤 2：上传认证的 PennyLane 发票', '步骤 2：上传认证的发票'],
    ['PennyLane 模板 • {number}', '认证模板 • {number}'],
    ['此文档包含导入您的 PennyLane 账户所需的全部元数据。', '此文档包含导入您的税务软件账户所需的全部元数据。'],
    ['⚠️ 自动生成的发票草稿 — 需在 PENNYLANE 上进行税务认证', '⚠️ 自动生成的发票草稿 — 需进行税务认证'],
    ['PennyLane 上传将在后续步骤中提供。', '认证发票上传将在后续步骤中提供。'],
  ],
};

const base = 'src/lib/locales/';
let total = 0;
let failed = false;

for (const [file, pairs] of Object.entries(repl)) {
  const p = base + file;
  let s = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const [oldS, newS] of pairs) {
    const idx = s.indexOf(oldS);
    const nOcc = s.split(oldS).length - 1;
    if (nOcc !== 1) {
      console.log('SKIP [' + file + '] occ=' + nOcc + ' :: ' + JSON.stringify(oldS));
      failed = true;
      continue;
    }
    s = s.substring(0, idx) + newS + s.substring(idx + oldS.length);
    count++;
    total++;
  }
  fs.writeFileSync(p, s, 'utf8');
  console.log('[' + file + '] ' + count + '/' + pairs.length + ' remplacements appliqués');
}

console.log('TOTAL=' + total + (failed ? ' — ATTENTION: skips présents, revérifier' : ' — OK, aucun skip'));
