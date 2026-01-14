import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </nav>

        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </header>

        <article className="space-y-6 text-foreground [&>p]:text-muted-foreground [&>p]:leading-7 [&>p]:text-base [&>p:first-child]:text-foreground [&>p:first-child]:text-lg [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:mt-12 [&>h2]:mb-6 [&>h2]:text-foreground [&>h2:first-of-type]:mt-0 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-foreground [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:space-y-2 [&>ul]:text-muted-foreground [&>ul]:my-4 [&>li]:leading-7 [&>li]:pl-1 [&>strong]:font-semibold [&>strong]:text-foreground [&>a]:text-primary [&>a]:no-underline [&>a:hover]:underline [&>a]:transition-colors">
          {children}
        </article>

        <footer className="mt-16 border-t border-border pt-8">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} OpenAthlete. Operated by Tom Renard.
          </p>
        </footer>
      </div>
    </div>
  );
}
