import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileImage,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
  ExternalLink,
} from 'lucide-react';

interface EvidenceFile {
  id: string;
  report_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface EvidenceAttachmentsProps {
  reportId: string;
  readonly?: boolean;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  image: FileImage,
  application: FileText,
  text: FileText,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string): React.ElementType {
  const category = type.split('/')[0];
  return FILE_ICONS[category] || FileText;
}

export function EvidenceAttachments({ reportId, readonly = false }: EvidenceAttachmentsProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('report_evidence')
      .select('*')
      .eq('report_id', reportId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Failed to load evidence:', error);
    } else {
      setFiles((data as EvidenceFile[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, [reportId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(selectedFiles)) {
      const filePath = `${reportId}/${Date.now()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('report-evidence')
        .upload(filePath, file);

      if (storageError) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(storageError);
        continue;
      }

      const { error: dbError } = await supabase
        .from('report_evidence')
        .insert({
          report_id: reportId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
        });

      if (dbError) {
        toast.error(`Failed to save record for ${file.name}`);
        console.error(dbError);
      } else {
        uploaded++;
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded`);
      fetchFiles();
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDelete = async (file: EvidenceFile) => {
    const { error: storageError } = await supabase.storage
      .from('report-evidence')
      .remove([file.file_path]);

    if (storageError) {
      toast.error('Failed to delete file from storage');
      return;
    }

    const { error: dbError } = await supabase
      .from('report_evidence')
      .delete()
      .eq('id', file.id);

    if (dbError) {
      toast.error('Failed to delete file record');
    } else {
      toast.success(`${file.file_name} deleted`);
      setFiles(prev => prev.filter(f => f.id !== file.id));
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('report-evidence')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  return (
    <Card className="elevation-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="si-h4 flex items-center gap-2">
            <Paperclip className="size-4" /> Evidence Attachments
          </CardTitle>
          <Badge variant="outline">{files.length} file{files.length !== 1 ? 's' : ''}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Upload area */}
        {!readonly && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              onChange={handleUpload}
              className="hidden"
            />
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="si-body">Uploading…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="size-6" />
                <p className="si-body">Click to upload or drag files here</p>
                <p className="si-caption">Photos, PDFs, maintenance tickets, meter screenshots</p>
              </div>
            )}
          </div>
        )}

        {/* File list */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="si-caption text-muted-foreground text-center py-2">No evidence attached yet.</p>
        ) : (
          <div className="space-y-2">
            {files.map(file => {
              const Icon = getFileIcon(file.file_type);
              const isImage = file.file_type.startsWith('image/');
              const url = getPublicUrl(file.file_path);

              return (
                <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  {isImage ? (
                    <img
                      src={url}
                      alt={file.file_name}
                      className="size-10 rounded object-cover shrink-0"
                    />
                  ) : (
                    <Icon className="size-5 text-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="si-body font-medium text-foreground truncate">{file.file_name}</p>
                    <p className="si-caption text-muted-foreground">
                      {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                    {!readonly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
