import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const code = params.code;

  if (code && typeof code === "string") {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryString.set(key, Array.isArray(value) ? value[0] : value);
      }
    });
    redirect(`/auth/callback?${queryString.toString()}`);
  }

  return (
    <div className="min-h-screen gradient-slate flex flex-col">
      <header className="container max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-electric flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="font-bold text-xl text-white">OpenAthlete</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 btn-touch"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="glass-button">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Track Your Journey.
                <span className="text-gradient block">No Paywall.</span>
              </h1>
              <p className="text-lg text-slate-300 max-w-lg">
                OpenAthlete is the free fitness platform with all features
                included. Track runs, rides, and swims with beautiful analytics
                and a social feed to connect with fellow athletes. No
                subscription required.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/signup">
                  <Button size="lg" className="glass-button text-lg px-8">
                    Get Started Free
                    <svg
                      className="ml-2 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <p className="text-3xl font-bold text-white">All</p>
                  <p className="text-sm text-slate-400">Features Free</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">No</p>
                  <p className="text-sm text-slate-400">Premium Tier</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">No</p>
                  <p className="text-sm text-slate-400">Paywall</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-electric-blue-500/20 to-transparent rounded-3xl blur-3xl" />
                <div className="relative glass-card p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electric-blue-400 to-electric-blue-600" />
                    <div>
                      <p className="font-medium text-white">Morning Run</p>
                      <p className="text-sm text-slate-400">Today at 6:30 AM</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-gradient">10.5km</p>
                      <p className="text-xs text-slate-400 uppercase">
                        Distance
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-white">52:30</p>
                      <p className="text-xs text-slate-400 uppercase">Time</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <p className="text-2xl font-bold text-white">5:00/km</p>
                      <p className="text-xs text-slate-400 uppercase">Pace</p>
                    </div>
                  </div>
                  <div className="h-32 rounded-lg bg-gradient-to-br from-deep-slate-700 to-deep-slate-800 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-electric-blue-400/50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="container max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} OpenAthlete. All features free,
            forever.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
