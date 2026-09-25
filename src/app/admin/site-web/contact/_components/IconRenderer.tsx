'use client';
import React from 'react';
import {
  MapPin, Navigation, Compass, Phone, PhoneCall, Mail, Send, MessageSquare, 
  Clock, Sparkles, Sliders, ExternalLink, Shield, ShieldCheck, CheckCircle2, 
  Award, Zap, Monitor, Tv, Layers, Globe, Building, ShoppingBag, FileText, 
  HelpCircle, Heart, Star, Flame, Cpu, Wrench, Linkedin, Instagram, Facebook, 
  Twitter, Youtube, Share2, AtSign, MessageCircle, QrCode, ArrowRight, Check, 
  Hash, Tag, Truck, Headphones, Lock, LucideProps
} from 'lucide-react';

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  MapPin,
  Navigation,
  Compass,
  Phone,
  PhoneCall,
  Mail,
  Send,
  MessageSquare,
  Clock,
  Sparkles,
  Sliders,
  ExternalLink,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Award,
  Zap,
  Monitor,
  Tv,
  Layers,
  Globe,
  Building,
  ShoppingBag,
  FileText,
  HelpCircle,
  Heart,
  Star,
  Flame,
  Cpu,
  Wrench,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Share2,
  AtSign,
  MessageCircle,
  QrCode,
  ArrowRight,
  Check,
  Hash,
  Tag,
  Truck,
  Headphones,
  Lock,
};

export const AVAILABLE_ICONS = [
  // Contact & Coordonnées
  { name: 'MapPin', label: 'Localisation / Adresse', category: 'Contact' },
  { name: 'Navigation', label: 'Itinéraire / GPS', category: 'Contact' },
  { name: 'Phone', label: 'Téléphone', category: 'Contact' },
  { name: 'PhoneCall', label: 'Appel direct', category: 'Contact' },
  { name: 'Mail', label: 'Email', category: 'Contact' },
  { name: 'Send', label: 'Envoi / Message', category: 'Contact' },
  { name: 'MessageSquare', label: 'Discussion', category: 'Contact' },
  { name: 'MessageCircle', label: 'Messagerie instantanée', category: 'Contact' },
  { name: 'Clock', label: 'Horaires', category: 'Contact' },
  { name: 'Building', label: 'Siège social / Agence', category: 'Contact' },
  { name: 'Globe', label: 'Site web / International', category: 'Contact' },
  { name: 'Headphones', label: 'Support technique', category: 'Contact' },

  // Réseaux Sociaux & Partage
  { name: 'Linkedin', label: 'LinkedIn', category: 'Social' },
  { name: 'Instagram', label: 'Instagram', category: 'Social' },
  { name: 'Facebook', label: 'Facebook', category: 'Social' },
  { name: 'Twitter', label: 'X / Twitter', category: 'Social' },
  { name: 'Youtube', label: 'YouTube', category: 'Social' },
  { name: 'Share2', label: 'Partager', category: 'Social' },
  { name: 'AtSign', label: 'Arobase / Réseau', category: 'Social' },
  { name: 'QrCode', label: 'QR Code', category: 'Social' },

  // Affichage & Technologie LED
  { name: 'Monitor', label: 'Écran / Moniteur', category: 'Tech' },
  { name: 'Tv', label: 'Télévision / Mur d\'images', category: 'Tech' },
  { name: 'Cpu', label: 'Processeur / Contrôleur', category: 'Tech' },
  { name: 'Layers', label: 'Modules / Dalles LED', category: 'Tech' },
  { name: 'Zap', label: 'Alimentation / Énergie', category: 'Tech' },
  { name: 'Flame', label: 'Performance / Chaleur basse', category: 'Tech' },
  { name: 'Sparkles', label: 'Haute luminosité', category: 'Tech' },
  { name: 'Sliders', label: 'Paramétrage / Console', category: 'Tech' },
  { name: 'Wrench', label: 'Installation & SAV', category: 'Tech' },

  // Liens, Confiance & Général
  { name: 'Shield', label: 'Garantie / Sécurité', category: 'Confiance' },
  { name: 'ShieldCheck', label: 'Conformité certifiée', category: 'Confiance' },
  { name: 'Award', label: 'Qualité constructeur', category: 'Confiance' },
  { name: 'CheckCircle2', label: 'Validation', category: 'Confiance' },
  { name: 'ShoppingBag', label: 'Boutique en ligne', category: 'Général' },
  { name: 'ExternalLink', label: 'Lien externe', category: 'Général' },
  { name: 'FileText', label: 'Catalogue / Devis', category: 'Général' },
  { name: 'HelpCircle', label: 'Aide / FAQ', category: 'Général' },
  { name: 'Star', label: 'Favori / Premium', category: 'Général' },
  { name: 'Tag', label: 'Offre / Gamme', category: 'Général' },
  { name: 'Truck', label: 'Livraison sur site', category: 'Général' },
  { name: 'ArrowRight', label: 'Flèche vers la droite', category: 'Général' },
];

interface IconRendererProps extends LucideProps {
  name?: string;
  fallback?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  fallback = 'Sparkles',
  ...props
}) => {
  const IconComponent = (name && ICON_MAP[name]) || ICON_MAP[fallback] || Sparkles;
  return <IconComponent {...props} />;
};
