import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  FileText,
  Shield,
  Settings,
  Zap,
  Leaf,
  Search,
  Plus,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'KPI Panel', icon: Activity, path: '/kpis' },
  { label: 'Energy Savings', icon: Zap, path: '/savings' },
  { label: 'Carbon Footprint', icon: Leaf, path: '/carbon' },
  { label: 'Corrective Actions', icon: ClipboardList, path: '/actions' },
  { label: 'Daily Guide', icon: FileText, path: '/daily-guide' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'ISO 50001 Compliance', icon: Shield, path: '/compliance' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const quickActions = [
  { label: 'Create new report', icon: Plus, path: '/reports', action: 'new-report' },
  { label: 'View anomalies', icon: AlertTriangle, path: '/', action: 'anomalies' },
  { label: 'Check peak demand', icon: TrendingUp, path: '/kpis', action: 'peak' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setIsOpen: setChatOpen } = useChatContext();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback(
    (fn: () => void) => {
      setOpen(false);
      fn();
    },
    [],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map(item => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Actions">
          {quickActions.map(item => (
            <CommandItem
              key={item.label}
              onSelect={() => runCommand(() => navigate(item.path))}
            >
              <item.icon className="mr-2 size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
          <CommandItem
            onSelect={() => runCommand(() => setChatOpen(true))}
          >
            <MessageSquare className="mr-2 size-4" />
            <span>Ask Energy Coach</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
