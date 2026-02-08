import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "@/components/essay-editor";
import { EssayLibrary } from "@/components/essay-library";
import { CommunityFeed } from "@/components/community-feed";
import { ExploreFeed } from "@/components/explore-feed";
import { UserProfile } from "@/components/user-profile";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Essay } from "@shared/schema";
import { FileText, Folder, Users, User, Compass } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("write");
  const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);
  const [editingEssayId, setEditingEssayId] = useState<string>("");
  const [, setLocation] = useLocation();

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const topicId = searchParams.get("topicId");
  const sectionParam = searchParams.get("section");
  const navTimestamp = searchParams.get("t");

useEffect(() => {
    if (topicId) {
      setActiveSection("write");
      return; 
    }

    if (sectionParam) {
      switch (sectionParam) {
        case "community":
          setActiveSection("community");
          break;
        case "explore":
          setActiveSection("explore");
          break;
        case "library":
          setActiveSection("library");
          break;
        case "profile":
          setActiveSection("profile");
          break;
        case "write":
          setEditingEssayId("");
          setActiveSection("write");
          break;
      }
    }
  }, [topicId, sectionParam, navTimestamp]);

  useEffect(() => {
    const navigateToMessages = localStorage.getItem('navigateToMessages');
    if (navigateToMessages === 'true') {
      setActiveSection('profile');
      localStorage.removeItem('navigateToMessages');
    }
  }, []);

  const navItems = [
    { id: "write", label: t('nav.write'), icon: FileText },
    { id: "library", label: t('nav.library'), icon: Folder },
    { id: "explore", label: t('nav.explore'), icon: Compass },
    { id: "community", label: t('nav.community'), icon: Users },
    { id: "profile", label: t('nav.profile'), icon: User },
  ];

  const handleEditEssay = (essayId: string) => {
    setEditingEssayId(essayId);
    setActiveSection("write");
  };

  const handleViewEssay = (essayId: string) => {
  setLocation(`/essay/${essayId}`);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "write":
        return (
          <div className="max-w-4xl mx-auto">
            <EssayEditor
              essayId={editingEssayId || undefined}
              onEssayChange={setCurrentEssay}
            />
          </div>
        );
      case "library":
        return <EssayLibrary onEditEssay={handleEditEssay} onViewEssay={handleViewEssay} />;
      case "explore":
        return <ExploreFeed />;
      case "community":
        return <CommunityFeed />;
      case "profile":
        return <UserProfile />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navigation */}
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-auto min-h-16 py-2 gap-4">
            <div className="flex items-center shrink-0">
              <h1 className="text-xl font-bold text-primary break-words leading-tight">Essay Club V1</h1>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center justify-end flex-1 gap-2">
              <ThemeToggle />
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`${
                      isActive 
                        ? "text-primary border-b-2 border-primary rounded-none pb-1" 
                        : "text-muted-foreground hover:text-foreground" 
                    }`}
                    onClick={() => setActiveSection(item.id)}
                    data-testid={`nav-desktop-${item.id}`}
                    title={item.label}
                  >
                    <Icon className="w-4 h-4 lg:mr-2" />
                    <span className="hidden lg:inline whitespace-nowrap">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {renderContent()}
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </div>
  );
}
