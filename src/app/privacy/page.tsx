import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy - OpenAthlete',
  description: 'Privacy Policy for OpenAthlete fitness tracking platform',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="January 14, 2026">
      <p>
        OpenAthlete (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Tom Renard. This Privacy Policy 
        explains how we collect, use, disclose, and safeguard your information when you use our 
        fitness tracking platform.
      </p>

      <h2>1. Information We Collect</h2>
      
      <h3>Account Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address</li>
        <li>Username and display name</li>
        <li>Profile picture (optional)</li>
      </ul>

      <h3>Activity Data</h3>
      <p>
        When you upload or sync activities, we collect fitness and health-related data including:
      </p>
      <ul>
        <li>GPS location data and route information</li>
        <li>Activity metrics (distance, pace, speed, duration, elevation)</li>
        <li>Heart rate data</li>
        <li>Cadence and power data (for cycling)</li>
        <li>Calories burned</li>
        <li>Activity timestamps and dates</li>
      </ul>

      <h3>Device and Usage Information</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>Browser type and version</li>
        <li>Device type</li>
        <li>IP address</li>
        <li>Pages visited and features used</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide and maintain the OpenAthlete service</li>
        <li>Display your activities and calculate performance metrics</li>
        <li>Generate personal records and statistics</li>
        <li>Enable social features (sharing activities with followers)</li>
        <li>Improve and optimize our platform</li>
        <li>Communicate with you about service updates</li>
        <li>Ensure security and prevent fraud</li>
      </ul>

      <h2>3. Third-Party Integrations</h2>
      
      <h3>Garmin Connect</h3>
      <p>
        If you connect your Garmin account, we receive activity data from Garmin Connect including 
        GPS tracks, heart rate, and performance metrics. We use this data solely to display your 
        activities within OpenAthlete. You can disconnect your Garmin account at any time through 
        your account settings.
      </p>

      <h3>Strava</h3>
      <p>
        If you connect your Strava account, we receive activity data including GPS tracks and 
        performance metrics. This data is used to display your activities within OpenAthlete.
      </p>

      <h3>Map Services</h3>
      <p>
        We use mapping services to display your activity routes. Your GPS data may be processed 
        by these services to render maps.
      </p>

      <h2>4. Data Storage and Security</h2>
      <p>
        Your data is stored securely using Supabase, which provides enterprise-grade security 
        including encryption at rest and in transit. We implement appropriate technical and 
        organizational measures to protect your personal information.
      </p>

      <h2>5. Data Sharing and Disclosure</h2>
      <p>We do not sell your personal information. We may share your data:</p>
      <ul>
        <li>With other users according to your privacy settings (public, followers only, or private)</li>
        <li>With service providers who assist in operating our platform</li>
        <li>When required by law or to protect our rights</li>
        <li>In connection with a merger or acquisition (with notice to you)</li>
      </ul>

      <h2>6. Your Rights and Choices</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal data</li>
        <li><strong>Correction:</strong> Update or correct inaccurate information</li>
        <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
        <li><strong>Export:</strong> Download your activity data</li>
        <li><strong>Disconnect:</strong> Remove third-party integrations (Garmin, Strava)</li>
        <li><strong>Privacy Controls:</strong> Set activity visibility (public, followers, private)</li>
      </ul>

      <h2>7. Data Retention</h2>
      <p>
        We retain your data for as long as your account is active. When you delete your account, 
        we will delete your personal information within 30 days, except where we are required to 
        retain it for legal purposes.
      </p>

      <h2>8. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than your own. 
        We ensure appropriate safeguards are in place to protect your data in accordance with 
        this Privacy Policy.
      </p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        OpenAthlete is not intended for children under 16 years of age. We do not knowingly 
        collect personal information from children under 16.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any material 
        changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or wish to exercise your rights, 
        please contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> renard.tom35@gmail.com</li>
        <li><strong>Contact Page:</strong> <a href="/contact">/contact</a></li>
      </ul>
    </LegalPageLayout>
  );
}
