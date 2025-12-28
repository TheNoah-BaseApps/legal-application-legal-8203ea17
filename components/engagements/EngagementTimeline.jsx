'use client';

import TimelineView from '@/components/common/TimelineView';
import { format } from 'date-fns';

export default function EngagementTimeline({ engagements }) {
  const timelineItems = engagements.map((engagement) => ({
    title: `${engagement.engagement_type} - ${engagement.engagement_channel}`,
    date: engagement.engagement_date
      ? format(new Date(engagement.engagement_date), 'PPP')
      : 'No date',
    description: engagement.engagement_notes || 'No notes provided',
    badge: engagement.engagement_outcome,
  }));

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No engagement history available
      </div>
    );
  }

  return <TimelineView items={timelineItems} />;
}