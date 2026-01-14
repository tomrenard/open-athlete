import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Shield } from 'lucide-react';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact - OpenAthlete',
  description: 'Get in touch with the OpenAthlete team',
};

export default function ContactPage() {
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
            Contact Us
          </h1>
          <p className="mt-3 text-muted-foreground">
            Have a question, feedback, or need support? We&apos;d love to hear from you.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For general inquiries and support
                  </p>
                  <a
                    href="mailto:renard.tom35@gmail.com"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    renard.tom35@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Privacy Inquiries</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For data access, deletion, or privacy questions
                  </p>
                  <a
                    href="mailto:renard.tom35@gmail.com?subject=Privacy%20Inquiry"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    renard.tom35@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Feedback</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Suggestions, feature requests, or bug reports
                  </p>
                  <a
                    href="mailto:renard.tom35@gmail.com?subject=Feedback"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                  >
                    Send feedback
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Send a Message</h2>
            <ContactForm />
          </div>
        </div>

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
