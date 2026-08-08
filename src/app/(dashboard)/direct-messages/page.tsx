'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DirectMessagesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/direct-messages/usr-2');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[500px] text-slate-400 text-xs">
      Loading direct messages...
    </div>
  );
}
