import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

// A single, deliberate "minimal state" layout reused for every empty/error
// screen in the app — never a bare framework default.
export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <Card variant="outlined" className="mx-auto max-w-md text-left">
      <p className="text-eyebrow font-label text-muted mb-2">{eyebrow}</p>
      <h2 className="text-h3 mb-2">{title}</h2>
      <p className="text-body text-body mb-6">{description}</p>
      {action}
    </Card>
  );
}
