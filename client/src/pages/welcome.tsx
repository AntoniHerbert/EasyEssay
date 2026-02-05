import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Compass,
  Users,
  Sparkles,
  ArrowRight,
  PenTool,
  BookOpen,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Essay AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/login")}>
              Log In
            </Button>
            <Button onClick={() => setLocation("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Writing Assistant
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Write Better Essays,{" "}
          <span className="text-primary">Together</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Get instant AI feedback, discover writing resources, and collaborate
          with a community of writers to improve your craft.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => setLocation("/")}
          >
            Start Writing
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => {
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Learn More
          </Button>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything You Need to Write</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From drafting to polishing, Essay AI supports your entire writing journey.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Essay Editor</h3>
              <p className="text-muted-foreground mb-4">
                Write your essays with a clean, distraction-free editor. Save drafts,
                organize your work, and pick up right where you left off.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Auto-save and draft management
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Personal essay library
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground mb-4">
                Get instant, detailed feedback on grammar, style, clarity, and structure.
                Understand your strengths and where to improve.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Grammar and style corrections
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Custom rubric scoring
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Explore Resources</h3>
              <p className="text-muted-foreground mb-4">
                Browse a community-driven library of topics, templates, quotes,
                and scoring rubrics to kickstart your writing.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Essay topics and prompts
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Fill-in-the-blank templates
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community & Peer Review</h3>
              <p className="text-muted-foreground mb-4">
                Share your essays with a supportive community. Give and receive
                feedback, like your favorites, and grow together.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Peer corrections and suggestions
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  Community engagement with likes
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p className="text-muted-foreground text-lg">Three simple steps to better writing</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">Write Your Essay</h3>
            <p className="text-muted-foreground text-sm">
              Use the editor or start from a template. Pick a topic from the
              Explore page to get inspired.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">Get AI Feedback</h3>
            <p className="text-muted-foreground text-sm">
              Submit your essay for analysis. Receive detailed corrections
              with scores based on your chosen rubric.
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">Share & Improve</h3>
            <p className="text-muted-foreground text-sm">
              Publish to the community, get peer reviews,
              and refine your writing with every iteration.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-10 sm:p-14 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">Ready to Write Your Best Essay?</h2>
            <p className="text-lg opacity-90 max-w-lg mx-auto mb-8">
              Join a community of writers who are improving their craft with
              AI-powered feedback and peer collaboration.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => setLocation("/")}
            >
              Get Started Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border/50 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PenTool className="w-4 h-4" />
            <span className="text-sm">Essay AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Write better. Write together.
          </p>
        </div>
      </footer>
    </div>
  );
}
