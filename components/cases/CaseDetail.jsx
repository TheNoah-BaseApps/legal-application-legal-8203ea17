'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CaseForm from './CaseForm';
import CaseActivityFeed from './CaseActivityFeed';
import FormDialog from '@/components/common/FormDialog';
import StatusBadge from '@/components/common/StatusBadge';
import { Edit, Calendar, User, Building, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function CaseDetail({ caseData, onUpdate }) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">{caseData.case_title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Case ID: {caseData.case_id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={caseData.case_status} />
            <StatusBadge status={caseData.priority} />
            <Button onClick={() => setShowEditDialog(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="activity">Activity Feed</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Case Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Case Type</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.case_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Court Name</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.court_name || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Estimated Value</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.estimated_value
                            ? `$${parseFloat(caseData.estimated_value).toLocaleString()}`
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Filing Date</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.filing_date
                            ? format(new Date(caseData.filing_date), 'PPP')
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Hearing Date</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.hearing_date
                            ? format(new Date(caseData.hearing_date), 'PPP')
                            : 'Not scheduled'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Assigned Attorney</p>
                        <p className="text-sm text-muted-foreground">
                          {caseData.attorney_name || 'Not assigned'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 col-span-2">
                  <h3 className="font-semibold text-lg">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {caseData.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <CaseActivityFeed caseId={caseData.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <FormDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Case"
      >
        <CaseForm
          caseData={caseData}
          onSuccess={() => {
            setShowEditDialog(false);
            onUpdate();
          }}
          onCancel={() => setShowEditDialog(false)}
        />
      </FormDialog>
    </>
  );
}