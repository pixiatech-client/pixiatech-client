import fs from 'fs';

const content = fs.readFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', 'utf8');

const selfClosingTags = ['CustomSelect', 'NumericControl', 'TransmitModal', 'QuotePDF', 'ChevronLeft', 'ChevronRight', 'ChevronDown', 'Search', 'Filter', 'MoreVertical', 'X', 'Pencil', 'Check', 'Loader2', 'Sparkles', 'MapPin', 'Building2', 'StickyNote', 'MessageCircle', 'SendHorizontal', 'Share2', 'Download', 'FileSpreadsheet', 'Printer', 'PlusCircle', 'ImageIcon', 'ChevronRightSquare', 'HistoryIcon', 'Maximize2', 'Info', 'Minus', 'Lock', 'Package', 'Zap', 'Sun', 'LayoutGrid', 'Eye', 'Monitor', 'Cpu', 'Plus', 'Trash2', 'Send', 'Languages', 'FileText', 'Calculator', 'Truck', 'Eraser', 'Wrench', 'CheckCircle2', 'AlertCircle', 'TrendingDown', 'ArrowRight', 'LayoutDashboard', 'Box', 'MessageSquare', 'Bell', 'LogOut'];

let newContent = content;

selfClosingTags.forEach(tag => {
    // Match <Tag ... > but NOT <Tag ... />
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'g');
    newContent = newContent.replace(regex, `<${tag}$1 />`);
});

fs.writeFileSync('f:/PIXIATECH/new d/Estimation V3/src/app/admin/quote-requests/_components/estimation/details/App.tsx', newContent);
console.log('Fixed component self-closing tag issues.');
