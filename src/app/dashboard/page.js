'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(error);
        router.push('/login');
      } else {
        setRole(data.role);
      }
    };

    fetchUserAndRole();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto' }}>
      <h2>Welcome!</h2>
      <p>Your role is: <strong>{role}</strong></p>
    </div>
  );
}
