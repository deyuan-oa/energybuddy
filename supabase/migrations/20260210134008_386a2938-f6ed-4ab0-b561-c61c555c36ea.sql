-- Audit checklist items
CREATE TABLE public.audit_checklist_items (
  id TEXT PRIMARY KEY,
  clause TEXT NOT NULL,
  requirement TEXT NOT NULL,
  description TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'medium',
  evidence TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on audit_checklist_items" ON public.audit_checklist_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert on audit_checklist_items" ON public.audit_checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on audit_checklist_items" ON public.audit_checklist_items FOR UPDATE USING (true);

-- Seed audit checklist
INSERT INTO public.audit_checklist_items (id, clause, requirement, description, checked, priority, evidence) VALUES
('c4.1','4.1','Context of the Organization','Internal/external issues affecting the EnMS identified and documented.',true,'medium','Context analysis document v2.0'),
('c4.4','4.4','Energy Management System scope','EnMS scope and boundaries defined, including all sites and zones.',true,'critical','EnMS scope statement signed by top management'),
('c5.1','5.1','Leadership and Commitment','Top management demonstrates leadership — energy policy established and communicated.',true,'critical','Energy policy v3.2 + communication records'),
('c5.2','5.2','Energy Policy','Energy policy includes commitment to continual improvement of energy performance.',true,'critical','Energy policy v3.2'),
('c6.1','6.1','Actions to address risks & opportunities','Risks and opportunities related to the EnMS identified and actions planned.',true,'high','Risk register v1.3'),
('c6.2','6.2','Objectives, targets & action plans','Measurable energy objectives and targets established at relevant functions.',false,'critical',''),
('c6.3','6.3','Energy Review','Energy review conducted: SEUs identified, EnPIs established, baselines set.',true,'critical','Energy review report v2.1'),
('c6.4','6.4','Energy Performance Indicators','EnPIs reflect energy performance and are monitored and compared with baselines.',true,'critical','EnPI register + Energy Coach dashboard'),
('c6.5','6.5','Energy Baselines','Baselines established using data from the initial energy review. Adjustment criteria documented.',true,'critical','Baseline register + adjustment criteria document'),
('c6.6','6.6','Planning for data collection','Energy data collection plan documented: what, where, when, how, metering plan.',true,'high','Metering plan v1.2'),
('c7.1','7.1','Resources','Resources for establishing, implementing, and maintaining the EnMS determined and provided.',true,'medium','Resource allocation memo'),
('c7.2','7.2','Competence','Persons affecting energy performance are competent based on education, training, or experience.',true,'high','Training records + competence matrix'),
('c7.3','7.3','Awareness','All relevant persons aware of energy policy, their contribution, and impact of nonconformity.',true,'high','Training sign-off sheets (18 attendees)'),
('c7.5','7.5','Documented information','EnMS documentation controlled: creation, review, approval, access, storage.',false,'high',''),
('c8.1','8.1','Operational planning and control','Operational criteria for SEUs established and controlled.',false,'critical',''),
('c8.2','8.2','Design','Energy performance improvement opportunities considered in design of new/modified facilities.',false,'medium',''),
('c8.3','8.3','Procurement','Energy performance criteria established for procurement of energy-using products/services.',false,'medium',''),
('c9.1','9.1','Monitoring, measurement, analysis, evaluation','Key characteristics of operations affecting energy performance monitored and measured.',true,'critical','Energy Coach monitoring active'),
('c9.2','9.2','Internal audit','Internal audits conducted at planned intervals.',false,'critical',''),
('c9.3','9.3','Management review','Top management reviews the EnMS at planned intervals.',true,'critical','Q4 2025 management review minutes'),
('c10.1','10.1','Nonconformity & corrective action','Process to address nonconformities and take corrective action established.',true,'critical','Corrective action tracker (6 actions)'),
('c10.2','10.2','Continual improvement','Energy performance and EnMS continually improved.',false,'high','');

-- PDCA items
CREATE TABLE public.pdca_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  phase TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  description TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL DEFAULT '',
  evidence TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pdca_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read on pdca_items" ON public.pdca_items FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pdca_items" ON public.pdca_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pdca_items" ON public.pdca_items FOR UPDATE USING (true);

-- Seed PDCA items
INSERT INTO public.pdca_items (id, title, phase, status, description, owner, due_date, evidence, notes) VALUES
('P1','Energy Policy review','plan','complete','Annual review and update of the energy policy statement.','Sarah Johnson','2026-01-31','{"Signed energy policy v3.2","Board minutes 25 Jan 2026"}','Policy updated to include 5% annual reduction target. Approved by top management.'),
('P2','Energy Review & SEU identification','plan','complete','Conduct energy review: identify SEUs, relevant variables, and establish EnPIs.','David Kim','2026-01-15','{"Energy review report v2.1","SEU register updated"}','5 SEUs confirmed. Compressed air identified as highest savings opportunity.'),
('P3','Objectives & Energy Targets','plan','in_progress','Set measurable energy objectives and targets for 2026.','Sarah Johnson','2026-02-28','{}','Draft targets circulated. Awaiting production forecast to finalize intensity targets.'),
('D1','Competence & Awareness training','do','complete','Deliver energy awareness training to all operators and supervisors.','James Park','2026-01-20','{"Training records (18 attendees)","Quiz results ≥80% pass rate"}','All shift operators trained. Refresher scheduled for Q3.'),
('D2','Implement operational controls','do','in_progress','Deploy control plans for each SEU: startup sequences, setpoint limits, shutdown procedures.','Alex Chen','2026-03-15','{"HVAC control SOP","Production staggered start SOP"}','3 of 5 SEU control plans documented. Lighting and compressed air pending.'),
('D3','Procurement — energy-efficient specs','do','not_started','Update procurement criteria to include energy performance requirements.','Sarah Johnson','2026-04-30','{}','Deferred to Q2. Procurement team briefed on ISO 50001 requirements.'),
('C1','Monitoring, measurement & analysis','check','in_progress','Continuous monitoring of EnPIs, anomaly detection, and data quality assurance.','David Kim','Ongoing','{"Energy Coach dashboard active","Weekly anomaly reports"}','Automated via Energy Coach. Compressed air data coverage below 90% — action raised.'),
('C2','Internal audit','check','not_started','Conduct internal audit of EnMS against ISO 50001 requirements.','James Park','2026-05-15','{}','Audit plan being drafted. Lead auditor identified (external consultant).'),
('C3','Management Review','check','in_progress','Quarterly management review of energy performance, objectives progress, and resource needs.','Sarah Johnson','2026-03-31','{"Q4 2025 review minutes"}','Q1 2026 review scheduled for 28 Mar. Monthly report pack being prepared.'),
('A1','Corrective actions for nonconformities','act','in_progress','Address nonconformities and significant deviations identified in monitoring.','James Park','Ongoing','{"CA-001 through CA-006 in Action Tracker"}','6 corrective actions tracked. 2 closed, 2 in progress, 2 open.'),
('A2','Continual improvement opportunities','act','not_started','Identify and evaluate improvement opportunities from energy review and operational data.','David Kim','2026-06-30','{}','VSD installation on compressors under evaluation. Payback analysis pending.');

-- Add update triggers
CREATE TRIGGER update_audit_checklist_items_updated_at
BEFORE UPDATE ON public.audit_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdca_items_updated_at
BEFORE UPDATE ON public.pdca_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
