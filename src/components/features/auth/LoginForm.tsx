import { useRouter } from 'next/navigation';
"use client";

import: React, { useState  } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function LoginForm() { const router = useRouter();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const quickLogin = (name: string) => {  try {
      setUser({ id: 'demo',
  username, name  } as unknown);
      router.push('/dashboard');
    } catch (e) {
      setError('Login failed');
    }
  }
  return (
    <div className ="space-y-4">
      <h2 className="text-xl font-semibold">Quick Login</h2>
      {error && <div className="text-red-600 text-sm">{error }</div>}
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => quickLogin('Demo User')}>Login as Demo</button>
        <button className="px-4 py-2 border rounded" onClick={() => router.push('/auth/register')}>Go to Register</button>
      </div>
    </div>
  );
}

