-- Create storage bucket for report evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('report-evidence', 'report-evidence', true);

-- Allow anyone to read evidence files (public bucket)
CREATE POLICY "Public read access for report evidence"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-evidence');

-- Allow anyone to upload evidence files
CREATE POLICY "Allow upload to report evidence"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-evidence');

-- Allow anyone to delete evidence files
CREATE POLICY "Allow delete from report evidence"
ON storage.objects FOR DELETE
USING (bucket_id = 'report-evidence');

-- Create table to track evidence attachments per report
CREATE TABLE public.report_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_evidence ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth in this app yet)
CREATE POLICY "Allow all read on report_evidence"
ON public.report_evidence FOR SELECT
USING (true);

CREATE POLICY "Allow all insert on report_evidence"
ON public.report_evidence FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all delete on report_evidence"
ON public.report_evidence FOR DELETE
USING (true);
