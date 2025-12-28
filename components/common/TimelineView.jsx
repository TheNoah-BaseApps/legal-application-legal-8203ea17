'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function TimelineView({ items }) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="relative pl-8">
          {index !== items.length - 1 && (
            <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-border" />
          )}
          <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-primary" />
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                {item.badge && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                    {item.badge}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}