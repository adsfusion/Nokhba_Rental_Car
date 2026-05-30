'use client';

import React from 'react';
import { Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

export function DeleteButton({
  onDelete,
  entityName = 'this item',
}: {
  onDelete: () => Promise<any> | void;
  entityName?: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  return (
    <button
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${entityName}? This action cannot be undone.`)) {
          startTransition(async () => {
            try {
              const res = await onDelete();
              if (res && res.error) {
                alert(`Failed to delete ${entityName}: ${res.error}`);
                console.error("Deletion error:", res.error);
              }
            } catch (err: any) {
              alert(`An unexpected error occurred: ${err.message}`);
              console.error("Unexpected deletion error:", err);
            }
          });
        }
      }}
      className={`p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={`Delete ${entityName}`}
    >
      <Trash2 size={18} className={isPending ? 'animate-pulse' : ''} />
    </button>
  );
}

export function EditButton({
  href,
  entityName = 'this item',
}: {
  href: string;
  entityName?: string;
}) {
  return (
    <Link
      href={href}
      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
      title={`Edit ${entityName}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Edit size={18} />
    </Link>
  );
}
