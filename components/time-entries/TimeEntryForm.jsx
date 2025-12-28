'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function TimeEntryForm({ entry = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    case_id: entry?.case_id || '',
    activity_description: entry?.activity_description || '',
    hours: entry?.hours || '',
    billable: entry?.billable ?? true,
    rate: entry?.rate || '',
    date: entry?.date ? new Date(entry.date) : new Date(),
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases');
        if (response.ok) {
          const data = await response.json();
          setCases(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching cases:', error);
      }
    };

    fetchCases();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          date: formData.date.toISOString().split('T')[0],
          hours: parseFloat(formData.hours),
          rate: parseFloat(formData.rate) || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save time entry');
      }

      toast.success('Time entry logged successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving time entry:', error);
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
          <Label htmlFor="date">Date *</Label>
          <DatePicker
            date={formData.date}
            onDateChange={(date) => setFormData({ ...formData, date })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Hours *</Label>
          <Input
            id="hours"
            type="number"
            step="0.25"
            min="0"
            max="24"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Hourly Rate</Label>
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2 col-span-2">
          <Checkbox
            id="billable"
            checked={formData.billable}
            onCheckedChange={(checked) => setFormData({ ...formData, billable: checked })}
          />
          <Label htmlFor="billable" className="cursor-pointer">
            Billable
          </Label>
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="activity_description">Activity Description *</Label>
          <Textarea
            id="activity_description"
            value={formData.activity_description}
            onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
            rows={4}
            required
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
          ) : (
            'Log Time'
          )}
        </Button>
      </div>
    </form>
  );
}