import { Home, MessageSquare, Grid2X2, Percent, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Shop All", icon: Grid2X2, path: "/" },
  { label: "AI Assistant", icon: MessageSquare, path: "/chat" },
  { label: "Deals", icon: Percent, path: "/" },
  { label: "Account", icon: User, path: "/" },
] as const;

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab, i) => {
          const isActive =
            tab.path === "/chat"
              ? location.pathname === "/chat"
              : i === 0 && location.pathname === "/";
          return (
            <button
              key={tab.label}
              onClick={() => navigate(tab.path)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-10 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
