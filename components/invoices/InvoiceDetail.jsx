'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import StatusBadge from '@/components/common/StatusBadge';
import { Download, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceDetail({ invoice }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In production, implement PDF generation
    alert('PDF download feature - implement with jsPDF or similar');
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between print:flex-col print:items-start">
        <div>
          <CardTitle className="text-2xl">Invoice {invoice.invoice_number}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Issued: {invoice.issue_date ? format(new Date(invoice.issue_date), 'PPP') : 'N/A'}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <StatusBadge status={invoice.status} />
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Bill To:</h3>
            <p className="text-sm">{invoice.customer_name}</p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer_email}
            </p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold mb-2">Invoice Details:</h3>
            <p className="text-sm">Invoice #: {invoice.invoice_number}</p>
            <p className="text-sm">
              Due Date: {invoice.due_date ? format(new Date(invoice.due_date), 'PPP') : 'N/A'}
            </p>
            {invoice.paid_date && (
              <p className="text-sm">
                Paid Date: {format(new Date(invoice.paid_date), 'PPP')}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-4">Invoice Summary</h3>
          {invoice.case_title && (
            <div className="text-sm mb-2">
              <span className="font-medium">Case: </span>
              {invoice.case_title}
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount:</span>
            <span>
              ${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}