export type MessageStyle = "collaborative_trust" | "ultra_secure_2026" | "classic_refinement";

export type PreviewTheme = "auto_adaptive" | "glass_frosted" | "light_premium" | "dark_luxury";

export type EmailVerificationConfig = {
  companyName: string;
  companySlogan: string;
  documentLabel: string;
  code: string;
  validityMinutes: number;
  messageStyle: MessageStyle;
};

export type LogAction = {
  id: string;
  time: string;
  text: string;
  type: "success" | "info" | "warning";
};
