import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

// Throwaway isolation route for verifying the Cordia design tokens before
// they're used across real pages. Delete once the tokens are approved.
export default function ComponentsDevPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-eyebrow font-label text-muted mb-2">Design system</p>
      <h1 className="text-h1 mb-10">Component tokens</h1>

      <section className="mb-12">
        <h2 className="text-h2 mb-4">Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Create task</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-h2 mb-4">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="positive">In review</Badge>
          <Badge variant="premium">Featured</Badge>
          <Badge variant="neutral">Open</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-h2 mb-4">Cards</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card variant="filled">
            <p className="text-eyebrow font-label text-muted mb-2">Task</p>
            <h3 className="text-h3 mb-2">Fix claim race worker</h3>
            <p className="text-body text-body">
              Filled card — used for interactive board content.
            </p>
          </Card>
          <Card variant="outlined">
            <p className="text-eyebrow font-label text-muted mb-2">Detail</p>
            <h3 className="text-h3 mb-2">Acceptance criteria</h3>
            <p className="text-body text-body">
              Outlined card — used for static, read-only content.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
