import assert from 'node:assert';
import {
  ALLOWED_EXTENSIONS,
  FORBIDDEN_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_MESSAGE,
  MAX_TOTAL_SIZE_BYTES,
  getFileExtension,
  getAttachmentCategory,
  formatFileSize,
  sanitizeAttachmentFileName,
  verifyBufferMagicBytes,
} from '../src/lib/chat-attachments.ts';

console.log('🧪 Début des tests unitaires pour la gestion des pièces jointes...\n');

// 1. Tests des limites
assert.strictEqual(MAX_FILE_SIZE_BYTES, 25 * 1024 * 1024, 'Limite max par fichier doit être 25 Mo');
assert.strictEqual(MAX_FILES_PER_MESSAGE, 5, 'Limite max de fichiers par message doit être 5');
assert.strictEqual(MAX_TOTAL_SIZE_BYTES, 50 * 1024 * 1024, 'Limite totale cumulée doit être 50 Mo');
console.log('✅ Limites validées : 25 Mo / fichier, 5 fichiers / message, 50 Mo cumulés');

// 2. Tests de formatFileSize
assert.strictEqual(formatFileSize(500), '500 o');
assert.strictEqual(formatFileSize(1024), '1.0 Ko');
assert.strictEqual(formatFileSize(25 * 1024 * 1024), '25.0 Mo');
console.log('✅ formatFileSize validé');

// 3. Tests des extensions autorisées et interdites
const testAllowed = ['jpg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'txt', 'csv'];
for (const ext of testAllowed) {
  assert.ok(ALLOWED_EXTENSIONS.includes(ext), `L'extension .${ext} doit être autorisée`);
}
console.log(`✅ Whitelist validée pour les formats demandés (${testAllowed.length} extensions testées)`);

const testForbidden = ['exe', 'bat', 'cmd', 'msi', 'scr', 'js', 'vbs', 'ps1', 'sh', 'dll'];
for (const ext of testForbidden) {
  assert.ok(FORBIDDEN_EXTENSIONS.has(ext), `L'extension .${ext} doit être interdite`);
}
console.log(`✅ Blacklist d'exécutables validée (${testForbidden.length} extensions dangereuses testées)`);

// 4. Tests d'extraction d'extension
assert.strictEqual(getFileExtension('rapport.DOCX'), 'docx');
assert.strictEqual(getFileExtension('archive.tar.gz'), 'gz');
assert.strictEqual(getFileExtension('fichier_sans_extension'), '');
console.log('✅ getFileExtension validé');

// 5. Tests des catégories
assert.strictEqual(getAttachmentCategory('docx'), 'word');
assert.strictEqual(getAttachmentCategory('xlsx'), 'excel');
assert.strictEqual(getAttachmentCategory('pptx'), 'powerpoint');
assert.strictEqual(getAttachmentCategory('pdf'), 'pdf');
assert.strictEqual(getAttachmentCategory('zip'), 'archive');
assert.strictEqual(getAttachmentCategory('png'), 'image');
assert.strictEqual(getAttachmentCategory('mp4'), 'video');
console.log('✅ Catégorisation visuelle validée pour tous les types');

// 6. Tests d'assainissement de nom de fichier
const sanitized = sanitizeAttachmentFileName('PROMPT FINAL AVEC LE GABARIT.docx');
assert.strictEqual(sanitized, 'PROMPT_FINAL_AVEC_LE_GABARIT.docx');
const sanitizedMalicious = sanitizeAttachmentFileName('../../../etc/passwd.docx');
assert.strictEqual(sanitizedMalicious, 'passwd.docx');
console.log('✅ Assainissement sécurisé des noms de fichiers validé');

// 7. Tests de signature magique binaire (Magic Bytes)
// 7a. Rejet d'un binaire exécutable Windows (MZ header 0x4D, 0x5A) renommé en .pdf
const fakePdfBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]);
const checkFakePdf = verifyBufferMagicBytes(fakePdfBytes, 'malware.pdf');
assert.strictEqual(checkFakePdf.safe, false, 'Doit rejeter un exécutable MZ déguisé en PDF');
console.log('✅ Détection et blocage d’un binaire MZ Windows déguisé en PDF validés');

// 7b. Rejet d'un binaire Linux ELF (0x7F, 0x45, 0x4C, 0x46) renommé en .docx
const fakeDocxBytes = new Uint8Array([0x7F, 0x45, 0x4C, 0x46]);
const checkFakeDocx = verifyBufferMagicBytes(fakeDocxBytes, 'malware.docx');
assert.strictEqual(checkFakeDocx.safe, false, 'Doit rejeter un binaire ELF déguisé en DOCX');
console.log('✅ Détection et blocage d’un binaire ELF déguisé en DOCX validés');

// 7c. Validation d'un vrai PDF (%PDF-)
const realPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]);
const checkRealPdf = verifyBufferMagicBytes(realPdfBytes, 'rapport.pdf');
assert.strictEqual(checkRealPdf.safe, true, 'Doit accepter un vrai PDF');
console.log('✅ Validation d’un vrai document PDF validée');

// 7d. Validation d'un vrai DOCX / XLSX / ZIP (signature PK 0x50, 0x4B)
const realZipBytes = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
const checkRealDocx = verifyBufferMagicBytes(realZipBytes, 'document.docx');
assert.strictEqual(checkRealDocx.safe, true, 'Doit accepter un vrai document DOCX');
const checkRealZip = verifyBufferMagicBytes(realZipBytes, 'archive.zip');
assert.strictEqual(checkRealZip.safe, true, 'Doit accepter une vraie archive ZIP');
console.log('✅ Validation de vrais documents DOCX et archives ZIP validée');

// 7e. Validation d'une image PNG (0x89, 0x50, 0x4E, 0x47)
const realPngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const checkRealPng = verifyBufferMagicBytes(realPngBytes, 'photo.png');
assert.strictEqual(checkRealPng.safe, true, 'Doit accepter un vrai PNG');
console.log('✅ Validation d’une vraie image PNG validée');

console.log('\n🎉 TOUS LES TESTS UNITAIRES SONT VALIDÉS AVEC SUCCÈS !');

