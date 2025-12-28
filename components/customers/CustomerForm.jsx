'use client';

import { useState } from 'react';
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

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Education',
  'Other',
];

const statuses = ['Active', 'Inactive', 'Prospect', 'Former Client'];

export default function CustomerForm({ customer = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    customer_name: customer?.customer_name || '',
    contact_person: customer?.contact_person || '',
    contact_number: customer?.contact_number || '',
    email_address: customer?.email_address || '',
    industry_type: customer?.industry_type || '',
    registration_date: customer?.registration_date ? new Date(customer.registration_date) : new Date(),
    customer_status: customer?.customer_status || 'Prospect',
    address_line: customer?.address_line || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers';
      const method = customer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          registration_date: formData.registration_date.toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save customer');
      }

      toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer Name *</Label>
          <Input
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            required
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
          <Label htmlFor="email_address">Email *</Label>
          <Input
            id="email_address"
            type="email"
            value={formData.email_address}
            onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_number">Phone Number *</Label>
          <Input
            id="contact_number"
            type="tel"
            value={formData.contact_number}
            onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry_type">Industry</Label>
          <Select
            value={formData.industry_type}
            onValueChange={(value) => setFormData({ ...formData, industry_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_status">Status *</Label>
          <Select
            value={formData.customer_status}
            onValueChange={(value) => setFormData({ ...formData, customer_status: value })}
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

        <div className="space-y-2 col-span-2">
          <Label htmlFor="registration_date">Registration Date</Label>
          <DatePicker
            date={formData.registration_date}
            onDateChange={(date) => setFormData({ ...formData, registration_date: date })}
          />
        </div>

        <div className="space-y-2 col-span-2">
          <Label htmlFor="address_line">Address</Label>
          <Textarea
            id="address_line"
            value={formData.address_line}
            onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
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
          ) : customer ? (
            'Update Customer'
          ) : (
            'Create Customer'
          )}
        </Button>
      </div>
    </form>
  );
}