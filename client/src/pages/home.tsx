import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EssayEditor } from "@/components/essay-editor";
import { EssayLibrary } from "@/components/essay-library";
import { CommunityFeed } from "@/components/community-feed";
import { InspirationsFeed } from "@/components/inspirations-feed";
import { UserProfile } from "@/components/user-profile";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Essay } from "@shared/schema";
import { FileText, Folder, Users, User, Lightbulb } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [activeSection, setActiveSection] = useState("write");
  const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);
  const [editingEssayId, setEditingEssayId] = useState<string>("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    const navigateToMessages = localStorage.getItem('navigateToMessages');
    if (navigateToMessages === 'true') {
      setActiveSection('profile');
      localStorage.removeItem('navigateToMessages');
    }
  }, []);

  const navItems = [
    { id: "write", label: "Write", icon: FileText },
    { id: "library", label: "Library", icon: Folder },
    { id: "inspirations", label: "Inspirations", icon: Lightbulb },
    { id: "community", label: "Community", icon: Users },
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
      case "inspirations":
        return <InspirationsFeed />;
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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">Easy Essay</h1>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-6">
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
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
              <Button 
                variant="ghost"
                className={`${
                  activeSection === "profile"
                    ? "text-primary border-b-2 border-primary rounded-none pb-1" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveSection("profile")}
                data-testid="nav-desktop-profile"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
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
