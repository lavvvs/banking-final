import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, CreditCard, TrendingUp, Building2, ArrowRight, CheckCircle2, Sparkles, Zap, Lock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">NexBank</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#security"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Security
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="font-medium">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-24 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Trusted by 50,000+ customers
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Modern Banking for the{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Digital Age</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
              Experience seamless banking with instant transfers, smart loans, and real-time insights. Your finances,
              simplified and secure.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="h-12 w-full px-8 shadow-lg shadow-primary/25 sm:w-auto">
                <Link href="/auth/sign-up">
                  Open Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 w-full px-8 sm:w-auto bg-transparent">
                <Link href="/auth/login">Sign In to Dashboard</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Bank-grade security
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Instant transfers
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                256-bit encryption
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Everything You Need to Manage Your Money
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Powerful features designed for modern banking, built with security and simplicity in mind.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform duration-300 group-hover:scale-110">
                  <CreditCard className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">Multiple Accounts</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Create and manage savings, current, and salary accounts. Track all your balances in real-time from one
                  dashboard.
                </p>
              </CardContent>
            </Card>
            <Card className="group relative overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5">
              <CardContent className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 transition-transform duration-300 group-hover:scale-110">
                  <TrendingUp className="h-7 w-7 text-accent" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">Smart Loans</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Apply for personal, home, or education loans with competitive interest rates and flexible EMI options.
                </p>
              </CardContent>
            </Card>
            <Card className="group relative overflow-hidden border-0 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transition-transform duration-300 group-hover:scale-110">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">Secure Transfers</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Transfer money instantly between your accounts or to others with enterprise-grade security protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="security" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Security</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Bank-Level Security You Can Trust
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Your money and data are protected with enterprise-grade security measures used by the world's leading
                financial institutions.
              </p>
              <ul className="mt-8 space-y-5">
                {[
                  "256-bit AES encryption for all transactions",
                  "Two-factor authentication (2FA)",
                  "Real-time fraud monitoring & alerts",
                  "Secure KYC verification process",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/15 to-primary/10 blur-2xl" />
                <Card className="relative border-0 bg-card p-8 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                      <Shield className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Protected by</p>
                      <p className="text-2xl font-bold text-card-foreground">NexBank Security</p>
                    </div>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Encryption Status</span>
                      <span className="text-sm font-medium text-accent">Active</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Fraud Protection</span>
                      <span className="text-sm font-medium text-accent">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <span className="text-sm text-muted-foreground">Last Security Scan</span>
                      <span className="text-sm font-medium text-foreground">Just now</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 bg-gradient-to-br from-primary via-primary to-accent">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground md:text-4xl">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join thousands of customers who trust NexBank for their everyday banking needs.
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8 h-12 px-8 shadow-xl">
            <Link href="/auth/sign-up">
              Create Your Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">NexBank</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 NexBank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
