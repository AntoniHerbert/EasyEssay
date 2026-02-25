import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface DesktopReviewDrawerProps {
  reviewForm: React.ReactNode;
  communityReviews: React.ReactNode;
}

export function DesktopReviewDrawer({ reviewForm, communityReviews }: DesktopReviewDrawerProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    // 1. CONTAINER PAI (Wrapper Sticky)
    // Sem "overflow" aqui! Isso garante que a seta (-left-10) não seja cortada.
    <div className="sticky top-6 relative w-[320px] lg:w-[400px]">

      {/* BOTÃO DE ABRIR/FECHAR */}
      {/* Preso na borda esquerda e fixo no topo. Não vai rolar junto com o conteúdo! */}
      <Button
        variant="outline"
        size="icon"
        className="absolute -left-10 top-0 z-20 rounded-r-none border-r-0 shadow-sm bg-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>

      {/* 2. CONTAINER DE SCROLL */}
      {/* O scrollbar fica APENAS aqui dentro, movendo o formulário e a comunidade */}
      <div className="max-h-[calc(100vh-48px)] overflow-y-auto overflow-x-hidden scrollbar-thin p-1">
        
        {/* PAINEL DE REVISÃO (Animação de sumir pra lateral) */}
        <div
          className={`grid transition-all duration-500 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100 mb-6" : "grid-rows-[0fr] opacity-0 mb-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className={`transition-transform duration-500 ease-in-out ${
              isOpen ? "translate-x-0" : "translate-x-12"
            }`}>
              {reviewForm}
            </div>
          </div>
        </div>

        {/* LISTA DA COMUNIDADE */}
        <div className="w-full">
          {communityReviews}
        </div>
        
      </div>
    </div>
  );
}