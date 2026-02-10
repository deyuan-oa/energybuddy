
-- Team roles enum
CREATE TYPE public.team_role AS ENUM ('operator', 'supervisor', 'manager');

-- Team members table (mock users, no auth link for now)
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role team_role NOT NULL DEFAULT 'operator',
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth)
CREATE POLICY "Allow all read on team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow all insert on team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on team_members" ON public.team_members FOR UPDATE USING (true);

-- Action status & priority enums
CREATE TYPE public.action_status AS ENUM ('open', 'in_progress', 'closed', 'verified');
CREATE TYPE public.action_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Corrective Actions table
CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT NOT NULL UNIQUE, -- e.g. CA-001
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  linked_kpi TEXT,
  linked_seu TEXT,
  priority action_priority NOT NULL DEFAULT 'medium',
  status action_status NOT NULL DEFAULT 'open',
  owner_id UUID REFERENCES public.team_members(id),
  created_by_id UUID REFERENCES public.team_members(id),
  due_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  outcome_notes TEXT,
  required_evidence TEXT,
  ai_suggested BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on corrective_actions" ON public.corrective_actions FOR SELECT USING (true);
CREATE POLICY "Allow all insert on corrective_actions" ON public.corrective_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on corrective_actions" ON public.corrective_actions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on corrective_actions" ON public.corrective_actions FOR DELETE USING (true);

-- Daily logs table
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id UUID REFERENCES public.team_members(id),
  summary TEXT,
  notes TEXT,
  guide_steps_completed INTEGER NOT NULL DEFAULT 0,
  total_guide_steps INTEGER NOT NULL DEFAULT 7,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  ai_draft TEXT,
  finalized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on daily_logs" ON public.daily_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert on daily_logs" ON public.daily_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on daily_logs" ON public.daily_logs FOR UPDATE USING (true);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  report_date DATE NOT NULL,
  title TEXT NOT NULL,
  author_id UUID REFERENCES public.team_members(id),
  ai_draft TEXT,
  final_content TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'finalized')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow all insert on reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on reports" ON public.reports FOR UPDATE USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corrective_actions_updated_at BEFORE UPDATE ON public.corrective_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequence for action codes
CREATE SEQUENCE public.action_code_seq START WITH 7;
