import { useTranslation } from "react-i18next"; 
import { Button } from "@/components/ui/button";
import { FileText, Folder, Users, User, Compass } from "lucide-react";

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MobileNavigation({ activeSection, onSectionChange }: MobileNavigationProps) {
  const { t } = useTranslation(); 
  const navItems = [
    { id: "write", label: t('nav.write'), icon: FileText },
    { id: "library", label: t('nav.library'), icon: Folder },
    { id: "explore", label: t('nav.explore'), icon: Compass },
    { id: "community", label: t('nav.community'), icon: Users },
    { id: "profile", label: t('nav.profile'), icon: User },
  ];

  return (
<div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-40 safe-area-bottom">
      {/* 1. justify-between: Espalha os itens usando o espaço disponível.
        2. gap-1: Garante um espacinho mínimo entre eles.
      */}
      <div className="flex items-center justify-between h-16 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`
                flex-initial shrink min-w-0 flex flex-col items-center justify-center h-full py-1 px-1 rounded-none 
                ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}
              `}
              onClick={() => onSectionChange(item.id)}
              data-testid={`nav-mobile-${item.id}`}
            >
              <Icon className="w-5 h-5 mb-1 shrink-0" />
              
              <span 
                className="leading-none whitespace-nowrap overflow-hidden text-ellipsis w-full text-center"
                style={{ fontSize: 'clamp(9px, 3.5vw, 0.75rem)' }}
              >
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
