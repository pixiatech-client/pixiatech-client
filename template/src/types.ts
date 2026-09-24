export interface SpecValue {
  v: string;
  calc?: boolean;
}

export interface SpecModel {
  name: string;
  tag: string;
  specs: Record<string, SpecValue>;
}

export interface SpecGroupRow {
  key: string;
  label: string;
}

export interface SpecGroup {
  label: string;
  rows: SpecGroupRow[];
}

export interface SpecsData {
  models: SpecModel[];
  groups: SpecGroup[];
}

export interface FeatureItem {
  id: string;
  title: string;
  desc: string;
  img: string;
  alt: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  locationYear: string;
  img: string;
}

export interface ConsultationFormData {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  model: string;
  surfaceM2: string;
  application: string;
  message: string;
}
