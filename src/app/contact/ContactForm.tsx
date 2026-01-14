'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>({ status: 'idle', message: '' });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    if (!name || !email || !message) {
      setFormState({ status: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    startTransition(() => {
      const mailtoSubject = encodeURIComponent(subject || 'Contact from OpenAthlete');
      const mailtoBody = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
      );
      
      window.location.href = `mailto:renard.tom35@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
      
      setFormState({
        status: 'success',
        message: 'Your email client should open. If not, please email us directly at renard.tom35@gmail.com',
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Your name"
          required
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          placeholder="What is this about?"
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Your message..."
          required
          className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {formState.status !== 'idle' && (
        <div
          className={`rounded-md p-3 text-sm ${
            formState.status === 'success'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {formState.message}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Opening email...' : 'Send Message'}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        This will open your default email client
      </p>
    </form>
  );
}
