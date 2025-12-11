'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { courseFeedback, type CourseFeedback } from '@/lib/data';
import { Star, User } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface FeedbackGroup {
  courseId: string;
  courseTitle: string;
  instructorName: string;
  feedbacks: CourseFeedback[];
  avgRating: number;
  ratingDistribution: { rating: number; count: number }[];
}

export function FeedbackPage() {
  const groupedFeedback = React.useMemo(() => {
    const groups: { [key: string]: FeedbackGroup } = {};
    courseFeedback.forEach((fb) => {
      if (!groups[fb.courseId]) {
        groups[fb.courseId] = {
          courseId: fb.courseId,
          courseTitle: fb.courseTitle,
          instructorName: fb.instructorName,
          feedbacks: [],
          avgRating: 0,
          ratingDistribution: [
            { rating: 1, count: 0 },
            { rating: 2, count: 0 },
            { rating: 3, count: 0 },
            { rating: 4, count: 0 },
            { rating: 5, count: 0 },
          ],
        };
      }
      groups[fb.courseId].feedbacks.push(fb);
    });

    Object.values(groups).forEach((group) => {
      const totalRating = group.feedbacks.reduce(
        (sum, fb) => sum + fb.rating,
        0
      );
      group.avgRating = totalRating / group.feedbacks.length;
      group.feedbacks.forEach((fb) => {
        const ratingIndex = group.ratingDistribution.findIndex(
          (d) => d.rating === fb.rating
        );
        if (ratingIndex !== -1) {
          group.ratingDistribution[ratingIndex].count++;
        }
      });
    });

    return Object.values(groups);
  }, []);

  const chartConfig = {
    count: {
      label: '人數',
      color: 'hsl(var(--primary))',
    },
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-muted-foreground/50'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">課程評鑑</h1>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {groupedFeedback.map((group) => (
          <Card key={group.courseId}>
            <CardHeader>
              <CardTitle>{group.courseTitle}</CardTitle>
              <CardDescription>
                <div className="flex items-center justify-between">
                  <span>講師: {group.instructorName}</span>
                  <div className="flex items-center gap-1">
                    <StarRating rating={group.avgRating} />
                    <span className="text-sm font-medium">
                      ({group.avgRating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 mb-4">
                <ChartContainer
                  config={chartConfig}
                  className="w-full h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={group.ratingDistribution}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                      aria-label="Rating distribution chart"
                    >
                      <XAxis
                        dataKey="rating"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => `${value}星`}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>查看詳細回饋</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                      {group.feedbacks.map((fb) => (
                        <div key={fb.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {fb.attendeeName}
                            </div>
                            <StarRating rating={fb.rating} />
                          </div>
                          <p className="pl-6 text-muted-foreground">
                            {fb.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
