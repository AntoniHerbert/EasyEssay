import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface MobileReviewDrawerProps {
  children: React.ReactNode;
}

export function MobileReviewDrawer({ children }: MobileReviewDrawerProps) {
  const defaultSnap = "200px";
  // Adicionamos vários pontos intermediários (30%, 40%, etc.) para dar a liberdade do usuário
  // parar o drawer onde quiser, funcionando exatamente como "ímãs" em várias alturas.
  const snapPoints = [defaultSnap, 0.2, 0.4, 0.5, 0.6, 0.7, 1.0];
  
  const [snap, setSnap] = useState<string | number | null>(defaultSnap);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      // Verificamos se a PÁGINA DE FUNDO realmente rolou. 
      // Isso evita que o scroll de dentro do Drawer dispare o recolhimento.
      if (Math.abs(window.scrollY - lastScrollY) > 10) {
        if (snap !== defaultSnap) {
          setSnap(defaultSnap);
        }
        lastScrollY = window.scrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [snap]);

  const getHiddenHeight = () => {
    if (snap === defaultSnap) return `calc(100dvh - ${defaultSnap})`;
    if (typeof snap === "number") return `${100 - snap * 100}dvh`;
    return "0px";
  };

  

  return (
    <Drawer
      open={true}
      dismissible={false} 
      modal={false} // Mantém a redação atrás interativa
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      {/* O h-[85vh] é crucial: ele diz ao DrawerContent que seu tamanho máximo 
          é igual ao nosso maior snap point (0.85). Sem isso, as alturas bugam. */}
      <DrawerContent className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] h-[85vh] flex flex-col focus:outline-none">
        
        {/* ÁREA DE ARRASTE (HEADER) */}
        {/* Como desativamos o arraste no corpo para liberar o scroll, o usuário arrasta o painel por aqui */}

        <div className="h-3">
        </div>

        
        {/* ÁREA DE CONTEÚDO SCROLLÁVEL */}
        {/* O atributo data-vaul-no-drag é o segredo: ele avisa à biblioteca que se o 
            dedo estiver aqui, é para rolar a div, e NÃO para arrastar o drawer. */}
        <div 
          className="overflow-y-auto px-4 pb-4 flex-1 pointer-events-auto overscroll-none"
          data-vaul-no-drag
        >
          {children}
            <div 
            style={{ height: getHiddenHeight() }} 
            className="w-full flex-shrink-0 transition-all duration-300"
            aria-hidden="true"
          />
        </div>




        
      </DrawerContent>
    </Drawer>
  );
}