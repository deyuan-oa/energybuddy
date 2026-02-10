import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun, Command, Leaf } from 'lucide-react';
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  FileText,
  Shield,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bell,
  AlertTriangle,
  TrendingUp,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { useChatContext } from '@/contexts/ChatContext';
import { useTheme } from '@/hooks/use-theme';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/kpis', label: 'KPI Panel', icon: Activity },
  { to: '/savings', label: 'Savings', icon: Zap },
  { to: '/carbon', label: 'Carbon Footprint', icon: Leaf },
  { to: '/actions', label: 'Actions', icon: ClipboardList },
  { to: '/daily-guide', label: 'Daily Guide', icon: FileText },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/compliance', label: 'ISO 50001', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { setIsOpen: setChatOpen, messages: chatMessages } = useChatContext();
  const { theme, toggleTheme } = useTheme();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 z-50',
          collapsed ? 'w-16' : 'w-60',
          'max-md:fixed max-md:inset-y-0 max-md:left-0',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <Zap className="size-6 shrink-0 text-sidebar-primary" />
          {!collapsed && (
            <span className="si-h4 text-sidebar-foreground truncate">Energy Coach</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 rounded px-3 py-2.5 si-body transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-semibold'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 sm:px-6 py-3 elevation-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            <div>
              <h1 className="si-h3 text-foreground">
                {navItems.find(n => n.to === location.pathname)?.label ?? 'Dashboard'}
              </h1>
              <p className="si-caption text-muted-foreground hidden sm:block">ISO 50001:2018 Energy Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex items-center gap-1.5 text-muted-foreground h-8 px-2"
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            >
              <Command className="size-3" />
              <span className="si-caption">K</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-5" />
                  <Badge className="absolute -top-1 -right-1 size-5 justify-center p-0 text-[10px]">3</Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b border-border">
                  <h3 className="si-h4 text-foreground">Notifications</h3>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {[
                    { icon: AlertTriangle, color: 'text-rag-red', title: 'Peak demand exceeded 800kW', time: '12 min ago', desc: 'Production line shift changeover spike.' },
                    { icon: TrendingUp, color: 'text-rag-amber', title: 'Compressed air +34% above baseline', time: '1h ago', desc: 'Zone B compressor room anomaly detected.' },
                    { icon: Info, color: 'text-primary', title: 'Daily report ready for review', time: '3h ago', desc: 'AI draft generated for 2026-02-10.' },
                  ].map((n, i) => (
                    <div key={i} className="flex gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <n.icon className={cn('size-4 shrink-0 mt-0.5', n.color)} />
                      <div className="min-w-0">
                        <p className="si-body font-medium text-foreground">{n.title}</p>
                        <p className="si-caption text-muted-foreground">{n.desc}</p>
                        <p className="si-caption text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setChatOpen(true)}>
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">Ask Coach</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar />
    </div>
  );
}
