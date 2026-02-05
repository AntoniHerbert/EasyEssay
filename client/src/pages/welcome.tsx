import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
  CheckCircle2,
} from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

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
              {t('welcome.header.login')}
            </Button>
            <Button onClick={() => setLocation("/signup")}>
              {t('welcome.header.get_started')}
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          {t('welcome.hero.badge')}
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
          {t('welcome.hero.title')}{" "}
          <span className="text-primary">{t('welcome.hero.title_highlight')}</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          {t('welcome.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => setLocation("/")}
          >
            {t('welcome.hero.cta_primary')}
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
            {t('welcome.hero.cta_secondary')}
          </Button>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">{t('welcome.features.title')}</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t('welcome.features.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('welcome.features.editor.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('welcome.features.editor.desc')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.editor.check1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.editor.check2')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('welcome.features.ai.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('welcome.features.ai.desc')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.ai.check1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.ai.check2')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('welcome.features.explore.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('welcome.features.explore.desc')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.explore.check1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.explore.check2')}
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-8">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-5">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t('welcome.features.community.title')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('welcome.features.community.desc')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.community.check1')}
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  {t('welcome.features.community.check2')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{t('welcome.how_it_works.title')}</h2>
          <p className="text-muted-foreground text-lg">{t('welcome.how_it_works.subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('welcome.how_it_works.step1_title')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('welcome.how_it_works.step1_desc')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('welcome.how_it_works.step2_title')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('welcome.how_it_works.step2_desc')}
            </p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('welcome.how_it_works.step3_title')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('welcome.how_it_works.step3_desc')}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <Card className="bg-primary text-primary-foreground border-0">
          <CardContent className="p-10 sm:p-14 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl font-bold mb-4">{t('welcome.cta_section.title')}</h2>
            <p className="text-lg opacity-90 max-w-lg mx-auto mb-8">
              {t('welcome.cta_section.desc')}
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={() => setLocation("/")}
            >
              {t('welcome.cta_section.btn')}
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
            {t('welcome.footer.tagline')}
          </p>
        </div>
      </footer>
    </div>
  );
}