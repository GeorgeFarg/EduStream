'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Users, 
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Stream', href: '/stream', icon: <Home className="w-6 h-6" /> },
  { name: 'Classwork', href: '/classwork', icon: <BookOpen className="w-6 h-6" /> },
  { name: 'Materials', href: '/materials', icon: <FileText className="w-6 h-6" /> },
  { name: 'Chat', href: '/chat', icon: <MessageSquare className="w-6 h-6" /> },
  { name: 'Messages', href: '/messages', icon: <MessageSquare className="w-6 h-6" /> },
  { name: 'People', href: '/people', icon: <Users className="w-6 h-6" /> },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border h-16">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}>
                {item.icon}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
