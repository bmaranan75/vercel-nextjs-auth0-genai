'use client';

import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Upload, Plus } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DocumentUploadFormProps {
  onUploadSuccess: () => void; // Callback to refresh document list, etc.
}

export default function DocumentUploadForm({ onUploadSuccess }: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      // Basic validation for file type (can be more robust)
      const allowedTypes = ['text/plain', 'application/pdf', 'text/markdown'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Invalid File Type: Please upload a TXT, PDF, or Markdown file for your shopping list.');
        setFile(null);
        event.target.value = ''; // Reset file input
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error('No File Selected: Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success(`Shopping list "${file.name}" has been created successfully!`);
        setFile(null); // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        onUploadSuccess(); // Trigger refresh or other actions
      } else {
        const errorResult = await response.json().catch(() => ({ message: 'An error occurred during upload.' }));
        toast.error(`Upload Failed: ${errorResult.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload Error: An unexpected error occurred. Please try again.');
    }
    setIsUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="file-upload" className="block text-sm font-medium text-safeway-dark-gray">
          Upload Shopping List
        </label>
        <div className="relative">
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.md,text/plain,application/pdf,text/markdown"
            className="border-safeway-medium-gray focus:border-safeway-red focus:ring-safeway-red"
          />
          <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-safeway-dark-gray/50 pointer-events-none" />
        </div>
        {file && (
          <div className="flex items-center gap-2 text-sm text-safeway-green">
            <Plus className="h-3 w-3" />
            <span>Selected: {file.name}</span>
          </div>
        )}
        <p className="text-xs text-safeway-dark-gray/70">Supported formats: TXT, PDF, or Markdown files</p>
      </div>
      <Button type="submit" disabled={isUploading || !file} className="safeway-button-primary w-full sm:w-auto">
        {isUploading ? (
          <>
            <Upload className="h-4 w-4 mr-2 animate-spin" />
            Creating List...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create Shopping List
          </>
        )}
      </Button>
    </form>
  );
}
