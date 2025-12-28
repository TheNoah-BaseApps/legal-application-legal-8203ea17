'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FileUpload from '@/components/common/FileUpload';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const documentTypes = ['Contract', 'Evidence', 'Pleading', 'Motion', 'Brief', 'Correspondence', 'Other'];

export default function DocumentUpload({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    document_type: '',
    case_id: '',
    customer_id: '',
    tags: '',
  });
  const [cases, setCases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, customersRes] = await Promise.all([
          fetch('/api/cases'),
          fetch('/api/customers'),
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.data || []);
        }

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleUpload = async (uploadFormData) => {
    setLoading(true);

    try {
      // Add metadata to form data
      uploadFormData.append('document_type', formData.document_type);
      if (formData.case_id) uploadFormData.append('case_id', formData.case_id);
      if (formData.customer_id) uploadFormData.append('customer_id', formData.customer_id);
      if (formData.tags) uploadFormData.append('tags', formData.tags);

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      toast.success('Document uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="document_type">Document Type *</Label>
          <Select
            value={formData.document_type}
            onValueChange={(value) => setFormData({ ...formData, document_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="case_id">Related Case (Optional)</Label>
          <Select
            value={formData.case_id}
            onValueChange={(value) => setFormData({ ...formData, case_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.case_title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_id">Related Customer (Optional)</Label>
          <Select
            value={formData.customer_id}
            onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.customer_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="e.g., contract, signed, final"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>
      </div>

      <FileUpload
        onUpload={handleUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.msg,.eml"
        maxSize={50 * 1024 * 1024}
        multiple={false}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}