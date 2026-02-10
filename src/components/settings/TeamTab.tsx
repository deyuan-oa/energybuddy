import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Trash2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'operator' | 'supervisor' | 'manager';
}

const roleColors: Record<string, string> = {
  manager: 'bg-primary/15 text-primary border-primary/30',
  supervisor: 'bg-rag-amber/15 text-rag-amber border-rag-amber/30',
  operator: 'bg-muted text-muted-foreground border-border',
};

export function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Maria Schmidt', email: 'maria.schmidt@example.com', role: 'manager' },
    { id: '2', name: 'Thomas Weber', email: 'thomas.weber@example.com', role: 'supervisor' },
    { id: '3', name: 'Anna Müller', email: 'anna.mueller@example.com', role: 'operator' },
    { id: '4', name: 'Klaus Fischer', email: 'klaus.fischer@example.com', role: 'operator' },
  ]);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'operator' | 'supervisor' | 'manager'>('operator');

  const addMember = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setMembers(prev => [...prev, {
      id: Date.now().toString(),
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
    }]);
    setNewName('');
    setNewEmail('');
    setNewRole('operator');
    toast({ title: 'Member added', description: `${newName.trim()} added to the team.` });
  };

  const removeMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const updateRole = (id: string, role: 'operator' | 'supervisor' | 'manager') => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
  };

  const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4 flex items-center gap-2">
            <Users className="size-4" /> Team Members
          </CardTitle>
          <CardDescription className="si-body">Manage team members, roles, and permissions for the EnMS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="si-caption font-semibold bg-primary/10 text-primary">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="si-body font-medium text-foreground truncate">{member.name}</p>
                <p className="si-caption text-muted-foreground truncate">{member.email}</p>
              </div>
              <Select value={member.role} onValueChange={(v) => updateRole(member.id, v as TeamMember['role'])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className={`${roleColors[member.role]} hidden sm:inline-flex`}>
                {member.role}
              </Badge>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => removeMember(member.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="elevation-1">
        <CardHeader>
          <CardTitle className="si-h4 flex items-center gap-2">
            <Plus className="size-4" /> Add Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as TeamMember['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={addMember} className="gap-1">
              <Plus className="size-4" /> Add Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
