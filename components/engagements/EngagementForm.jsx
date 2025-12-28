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

const engagementTypes = ['Meeting', 'Call', 'Email', 'Consultation', 'Follow-up', 'Other'];
const engagementChannels = ['Phone', 'Email', 'In-Person', 'Video Call', 'Other'];
const outcomes = ['Successful', 'Pending', 'Follow-up Required', 'No Response'];

export default function EngagementForm({ engagement = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    client_id: engagement?.client_id || '',
    engagement_type: engagement?.engagement_type || '',
    engagement_date: engagement?.engagement_date ? new Date(engagement.engagement_date) : new Date(),
    engagement_outcome: engagement?.engagement_outcome || '',
    contact_person: engagement?.contact_person || '',
    engagement_channel: engagement?.engagement_channel || '',
    engagement_notes: engagement?.engagement_notes || '',
    case_id: engagement?.case_id || '',
    duration_minutes: engagement?.duration_minutes || '',
  });
  const [customers, setCustomers] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, casesRes] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/cases'),
        ]);

        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.data || []);
        }

        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData.data || []);
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
      const url = engagement ? `/api/engagements/${engagement.id}` : '/api/engagements';
      const method = engagement ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          engagement_date: formData.engagement_date.toISOString().split('T')[0],
          duration_minutes: parseInt(formData.duration_minutes) || null,
          case_id: formData.case_id || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save engagement');
      }

      toast.success(engagement ? 'Engagement updated successfully' : 'Engagement recorded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving engagement:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="engagement_type">Engagement Type *</Label>
          <Select
            value={formData.engagement_type}
            onValueChange={(value) => setFormData({ ...formData, engagement_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {engagementTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="engagement_channel">Channel *</Label>
          <Select
            value={formData.engagement_channel}
            onValueChange={(value) => setFormData({ ...formData, engagement_channel: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select channel" />
            </SelectTrigger>
            <SelectContent>
              {engagementChannels.map((channel) => (
                <SelectItem key={channel} value={channel}>
                  {channel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="engagement_date">Engagement Date *</Label>
          <DatePicker
            date={formData.engagement_date}
            onDateChange={(date) => setFormData({ ...formData, engagement_date: date })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_person">Contact Person *</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="engagement_outcome">Outcome *</Label>
          <Select
            value={formData.engagement_outcome}
            onValueChange={(value) => setFormData({ ...formData, engagement_outcome: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select outcome" />
            </SelectTrigger>
            <SelectContent>
              {outcomes.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {outcome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="engagement_notes">Notes</Label>
          <Textarea
            id="engagement_notes"
            value={formData.engagement_notes}
            onChange={(e) => setFormData({ ...formData, engagement_notes: e.target.value })}
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
          ) : engagement ? (
            'Update Engagement'
          ) : (
            'Record Engagement'
          )}
        </Button>
      </div>
    </form>
  );
}