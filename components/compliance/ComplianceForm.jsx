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

const complianceTypes = [
  'Document Filing',
  'Deadline Compliance',
  'Court Appearance',
  'Regulatory Filing',
  'Client Notification',
  'Other',
];

const statuses = ['Not Started', 'In Review', 'Completed'];

export default function ComplianceForm({ item = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    case_id: item?.case_id || '',
    compliance_type: item?.compliance_type || '',
    description: item?.description || '',
    status: item?.status || 'Not Started',
    assigned_to: item?.assigned_to || '',
    due_date: item?.due_date ? new Date(item.due_date) : null,
    notes: item?.notes || '',
  });
  const [cases, setCases] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [casesRes, userRes] = await Promise.all([
          fetch('/api/cases'),
          fetch('/api/auth/me'),
        ]);

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.data || []);
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setUsers([userData.user]);
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
      const url = item ? `/api/compliance/${item.id}` : '/api/compliance';
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          due_date: formData.due_date?.toISOString().split('T')[0] || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save compliance item');
      }

      toast.success(item ? 'Compliance item updated' : 'Compliance item created');
      onSuccess();
    } catch (error) {
      console.error('Error saving compliance item:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="case_id">Case *</Label>
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
          <Label htmlFor="compliance_type">Compliance Type *</Label>
          <Select
            value={formData.compliance_type}
            onValueChange={(value) => setFormData({ ...formData, compliance_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {complianceTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Select
            value={formData.assigned_to}
            onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <DatePicker
            date={formData.due_date}
            onDateChange={(date) => setFormData({ ...formData, due_date: date })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
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
          ) : item ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </form>
  );
}