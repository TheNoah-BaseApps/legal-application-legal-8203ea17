'use client';

export default function TabPanel({ value, activeValue, children }) {
  if (value !== activeValue) return null;

  return <div className="py-4">{children}</div>;
}