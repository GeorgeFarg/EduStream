"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  Home,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  Settings,
  ChevronDown,
  Plus,
  GraduationCap,
  Loader2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useClassContext } from "@/contexts/ClassContext";
import { CreateJoinClassModal } from "@/components/class/create-join-class-modal";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: "Stream", href: "/stream", icon: <Home className="w-5 h-5" /> },
  { name: "Classwork", href: "/classwork", icon: <BookOpen className="w-5 h-5" /> },
  { name: "Materials", href: "/materials", icon: <FileText className="w-5 h-5" /> },
  { name: "AI Chat", href: "/chat", icon: <MessageSquare className="w-5 h-5" /> },
  { name: "Messages", href: "/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { name: "People", href: "/people", icon: <Users className="w-5 h-5" /> },
    { name: "Meeting", href: "/Meeting", icon: <Camera className="w-5 h-5" /> },
  { name: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ isCollapsed, isMobile = false }: { isCollapsed: boolean; isMobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { classes, currentClass, setCurrentClass, refreshClasses, loading } = useClassContext();
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const { contextSafe } = useGSAP();
  const hatRef = useRef<SVGSVGElement | null>(null);

  const onClickAnimation = contextSafe(() => {
    if (!hatRef.current) return;
    gsap.fromTo(
      hatRef.current,
      { y: 0, rotation: 0 },
      {
        y: -30,
        rotation: 360,
        duration: 0.5,
        ease: "power1.in",
        onComplete: () => {
          gsap.to(hatRef.current, {
            y: 0,
            rotation: 720,
            duration: 0.5,
            ease: "power2.out",
          });
        },
      },
    );
  });

  const handleSelectClass = (cls: (typeof classes)[number]) => {
    setCurrentClass(cls);
    if (pathname === "/stream") {
      router.push(`/stream?classId=${cls.id}`);
    }
  };

  return (
    <>
      <nav
        className={cn(
          "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 overflow-y-auto scrollbar-hidden",
          isMobile ? "flex" : "hidden md:flex",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-b border-sidebar-border",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <div className="w-fit bg-main p-1 rounded-md">
              <GraduationCap
                ref={hatRef}
                onClick={onClickAnimation}
                width={30}
                height={30}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
          {!isCollapsed && (
            <Link href="/stream" className="text-2xl font-bold">
              EduStream
            </Link>
          )}
        </div>

        {/* Course Selector */}
        {!isCollapsed && (
          <div className="p-4 border-b border-sidebar-border">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading classes...
              </div>
            ) : classes.length === 0 ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sm text-muted-foreground"
                onClick={() => setIsClassModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Join or create a class
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-3 py-2 h-auto text-left"
                  >
                    <div>
                    <p className="text-xs text-muted-foreground">Current</p>
                      
                      <p className="font-semibold text-sm line-clamp-1">

                        {currentClass?.name ?? "Select a class"}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>My Classes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {classes.map((cls) => (
                    <DropdownMenuItem
                      key={cls.id}
                      onClick={() => handleSelectClass(cls)}
                      className={currentClass?.id === cls.id ? "bg-primary/15" : ""}
                    >

                      <div className="flex flex-col">
                        <p className="font-semibold text-sm">{cls.name}</p>
                        {cls.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{cls.description}</p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2" onClick={() => setIsClassModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Join or Create Class
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-colors my-1",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground hover:bg-primary/10 hover:text-primary",


                    isCollapsed ? "justify-center" : "",
                  )}
                >
                  <span className={cn("flex items-center", isCollapsed ? "w-5 h-5" : "")}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="flex-1 text-left">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <CreateJoinClassModal
        open={isClassModalOpen}
        onOpenChange={setIsClassModalOpen}
        onSuccess={refreshClasses}
      />
    </>
  );
}
