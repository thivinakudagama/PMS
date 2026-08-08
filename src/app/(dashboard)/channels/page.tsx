'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChannelsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/channels/chan-1');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[500px] text-slate-400 text-xs">
      Loading channel workspace...
    </div>
  );
}
