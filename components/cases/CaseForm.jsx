'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DatePicker from '@/components/common/DatePicker';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const caseTypes = [
  'Civil Litigation',
  'Criminal Defense',
  'Corporate Law',
  'Family Law',
  'Real Estate',
  'Intellectual Property',
  'Employment Law',
  'Other',
];

const caseStatuses = ['New', 'Open', 'In Progress', 'Pending', 'Closed'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];

export default function CaseForm({ caseData = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    case_title: caseData?.case_title || '',
    client_id: caseData?.client_id || '',
    case_type: caseData?.case_type || '',
    case_status: caseData?.case_status || 'New',
    assigned_attorney: caseData?.assigned_attorney || '',
    filing_date: caseData?.filing_date ? new Date(caseData.filing_date) : new Date(),
    court_name: caseData?.court_name || '',
    hearing_date: caseData?.hearing_date ? new Date(caseData.hearing_date) : null,
    description: caseData?.description || '',
    priority: caseData?.priority || 'Medium',
    estimated_value: caseData?.estimated_value || '',
  });
  const [customers, setCustomers] = useState([]);
  const [attorneys, setAttorneys] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, attorneysRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/auth/me'),
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.data || []);
        }

        // In production, you'd have a /api/users endpoint filtered by role
        if (attorneysRes.ok) {
          const userData = await attorneysRes.json();
          setAttorneys([userData.user]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = caseData ? `/api/cases/${caseData.id}` : '/api/cases';
      const method = caseData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          filing_date: formData.filing_date.toISOString().split('T')[0],
          hearing_date: formData.hearing_date?.toISOString().split('T')[0] || null,
          estimated_value: parseFloat(formData.estimated_value) || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save case');
      }

      toast.success(caseData ? 'Case updated successfully' : 'Case created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="case_title">Case Title *</Label>
          <Input
            id="case_title"
            value={formData.case_title}
            onChange={(e) => setFormData({ ...formData, case_title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Client *</Label>
          <Select
            value={formData.client_id}
            onValueChange={(value) => setFormData({ ...formData, client_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select client" />
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
          <Label htmlFor="case_type">Case Type *</Label>
          <Select
            value={formData.case_type}
            onValueChange={(value) => setFormData({ ...formData, case_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {caseTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="case_status">Status *</Label>
          <Select
            value={formData.case_status}
            onValueChange={(value) => setFormData({ ...formData, case_status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {caseStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_attorney">Assigned Attorney</Label>
          <Select
            value={formData.assigned_attorney}
            onValueChange={(value) => setFormData({ ...formData, assigned_attorney: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select attorney" />
            </SelectTrigger>
            <SelectContent>
              {attorneys.map((attorney) => (
                <SelectItem key={attorney.id} value={attorney.id}>
                  {attorney.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="court_name">Court Name</Label>
          <Input
            id="court_name"
            value={formData.court_name}
            onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filing_date">Filing Date *</Label>
          <DatePicker
            date={formData.filing_date}
            onDateChange={(date) => setFormData({ ...formData, filing_date: date })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hearing_date">Hearing Date</Label>
          <DatePicker
            date={formData.hearing_date}
            onDateChange={(date) => setFormData({ ...formData, hearing_date: date })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimated_value">Estimated Value</Label>
          <Input
            id="estimated_value"
            type="number"
            step="0.01"
            value={formData.estimated_value}
            onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : caseData ? (
            'Update Case'
          ) : (
            'Create Case'
          )}
        </Button>
      </div>
    </form>
  );
}