// Preview stories for sciter-devtools (CSF-style named exports).
// Story content mirrors the SSIM reference: icon open-40.svg + label "Open PDF".
import { QuickActionCard } from "./QuickActionCard.js";

export const Default = () => <QuickActionCard icon="open-40.svg" label="Open PDF" />;

// Label-only card (no icon prop) — the "Customize" case; label centers alone.
export const NoIcon = () => <QuickActionCard label="Customize" />;
