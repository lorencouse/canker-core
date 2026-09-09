import { Link } from '@tanstack/react-router';
import { Button } from '@canker/ui';

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 p-6 pt-24">
      <h1 className="text-2xl font-bold">That page doesn't exist</h1>
      <p className="text-secondary-foreground">
        The link may be old, or the sore it pointed at was deleted.
      </p>
      <Button asChild>
        <Link to="/today" search={{}}>
          Back to Today
        </Link>
      </Button>
    </div>
  );
}
