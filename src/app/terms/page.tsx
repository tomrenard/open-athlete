import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service - OpenAthlete',
  description: 'Terms of Service for OpenAthlete fitness tracking platform',
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="January 14, 2026">
      <p>
        Welcome to OpenAthlete. These Terms of Service (&quot;Terms&quot;) govern your use of the 
        OpenAthlete platform operated by Tom Renard. By using OpenAthlete, you agree to these Terms.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or using OpenAthlete, you agree to be bound by these Terms and our{' '}
        <a href="/privacy">Privacy Policy</a>. If you do not agree to these Terms, please do not 
        use our service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        OpenAthlete is an open-source fitness tracking platform that allows you to:
      </p>
      <ul>
        <li>Upload and store fitness activity data (runs, rides, swims)</li>
        <li>Track performance metrics and personal records</li>
        <li>Connect with third-party fitness services (Garmin, Strava)</li>
        <li>Share activities with followers and the community</li>
        <li>Visualize routes and analyze performance data</li>
      </ul>

      <h2>3. Account Registration</h2>
      <p>To use OpenAthlete, you must:</p>
      <ul>
        <li>Be at least 16 years of age</li>
        <li>Provide accurate and complete registration information</li>
        <li>Maintain the security of your account credentials</li>
        <li>Notify us immediately of any unauthorized account access</li>
      </ul>
      <p>
        You are responsible for all activities that occur under your account.
      </p>

      <h2>4. User Content</h2>
      <p>
        You retain ownership of the activity data and content you upload to OpenAthlete 
        (&quot;User Content&quot;). By uploading content, you grant us a license to store, display, 
        and process your data to provide the service.
      </p>
      <p>You agree not to upload content that:</p>
      <ul>
        <li>Infringes on intellectual property rights</li>
        <li>Contains malware or malicious code</li>
        <li>Is false, misleading, or fraudulent</li>
        <li>Violates any applicable law or regulation</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>When using OpenAthlete, you agree not to:</p>
      <ul>
        <li>Violate any laws or regulations</li>
        <li>Impersonate others or create fake accounts</li>
        <li>Attempt to gain unauthorized access to our systems</li>
        <li>Interfere with or disrupt the service</li>
        <li>Scrape or collect data without permission</li>
        <li>Use the service for commercial purposes without authorization</li>
        <li>Harass, abuse, or harm other users</li>
      </ul>

      <h2>6. Third-Party Integrations</h2>
      <p>
        OpenAthlete may integrate with third-party services such as Garmin Connect and Strava. 
        Your use of these integrations is subject to the respective third-party terms of service. 
        We are not responsible for the availability or accuracy of third-party services.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        OpenAthlete is open-source software. The source code is available under its respective 
        license. The OpenAthlete name, logo, and branding are the property of Tom Renard.
      </p>
      <p>
        You may not use our branding in a way that suggests endorsement or affiliation without 
        prior written permission.
      </p>

      <h2>8. Disclaimer of Warranties</h2>
      <p>
        OpenAthlete is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, 
        either express or implied. We do not warrant that:
      </p>
      <ul>
        <li>The service will be uninterrupted or error-free</li>
        <li>Data will be accurately recorded or preserved</li>
        <li>The service will meet your specific requirements</li>
      </ul>
      <p>
        <strong>Health Disclaimer:</strong> OpenAthlete is not a medical device. Activity data 
        and metrics are for informational purposes only and should not be used for medical 
        decisions. Consult a healthcare professional before starting any exercise program.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Tom Renard and OpenAthlete shall not be liable 
        for any indirect, incidental, special, consequential, or punitive damages, including 
        loss of data, profits, or goodwill, arising from your use of the service.
      </p>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Tom Renard and OpenAthlete from any claims, 
        damages, or expenses arising from your use of the service or violation of these Terms.
      </p>

      <h2>11. Account Termination</h2>
      <p>
        You may delete your account at any time through your account settings. We may suspend 
        or terminate your account if you violate these Terms or engage in harmful behavior.
      </p>
      <p>
        Upon termination, your right to use the service ceases immediately. We may retain 
        certain data as required by law.
      </p>

      <h2>12. Changes to Terms</h2>
      <p>
        We may modify these Terms at any time. We will notify you of material changes by 
        posting the updated Terms and changing the &quot;Last updated&quot; date. Continued use after 
        changes constitutes acceptance of the new Terms.
      </p>

      <h2>13. Governing Law</h2>
      <p>
        These Terms are governed by applicable law. Any disputes shall be resolved through 
        good-faith negotiation or, if necessary, through appropriate legal channels.
      </p>

      <h2>14. Severability</h2>
      <p>
        If any provision of these Terms is found unenforceable, the remaining provisions 
        will continue in effect.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions about these Terms, please contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> renard.tom35@gmail.com</li>
        <li><strong>Contact Page:</strong> <a href="/contact">/contact</a></li>
      </ul>
    </LegalPageLayout>
  );
}
