'use client';

import dynamic from 'next/dynamic';

const AvailabilityCalendarUI = dynamic(
  () => import('./AvailabilityCalendarUI'),
  { ssr: false }
);

export function ClientCalendarWrapper(props: any) {
  return <AvailabilityCalendarUI {...props} />;
}
