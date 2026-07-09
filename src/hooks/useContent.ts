'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

async function fetchFree(file: string) {
  const res = await fetch(`/data/${file}`);
  if (!res.ok) throw new Error(`Failed to fetch static data: ${file}`);
  return res.json();
}

async function fetchPaid(table: string) {
  // PostgREST queries automatically check the RLS policies
  const { data, error } = await supabase.from(table).select('data');
  if (error) {
    console.error(`Error querying paid content from ${table}:`, error);
    return [];
  }
  return (data || []).map((row: any) => row.data);
}

export function usePrelims() {
  const entitled = useStore((state) => state.entitled);
  return useQuery({
    queryKey: ['prelims', entitled],
    queryFn: async () => {
      const free = await fetchFree('prelims_structured.json');
      if (!entitled) return free;
      try {
        const paid = await fetchPaid('paid_prelims');
        const map = new Map();
        free.forEach((item: any) => map.set(item.id, item));
        paid.forEach((item: any) => map.set(item.id, item));
        return Array.from(map.values());
      } catch (err) {
        console.error('Error merging paid prelims:', err);
        return free;
      }
    },
  });
}

export function useMains() {
  const entitled = useStore((state) => state.entitled);
  return useQuery({
    queryKey: ['mains', entitled],
    queryFn: async () => {
      const free = await fetchFree('mains.json');
      if (!entitled) return free;
      try {
        const paid = await fetchPaid('paid_mains');
        const map = new Map();
        free.forEach((item: any) => map.set(item.id, item));
        paid.forEach((item: any) => map.set(item.id, item));
        return Array.from(map.values());
      } catch (err) {
        console.error('Error merging paid mains:', err);
        return free;
      }
    },
  });
}

export function useOptional() {
  const entitled = useStore((state) => state.entitled);
  return useQuery({
    queryKey: ['optional', entitled],
    queryFn: async () => {
      const free = await fetchFree('optional.json');
      if (!entitled) return free;
      try {
        const paid = await fetchPaid('paid_optional');
        const map = new Map();
        free.forEach((item: any) => map.set(item.id, item));
        paid.forEach((item: any) => map.set(item.id, item));
        return Array.from(map.values());
      } catch (err) {
        console.error('Error merging paid optional:', err);
        return free;
      }
    },
  });
}

export function useFrameworks() {
  const entitled = useStore((state) => state.entitled);
  return useQuery({
    queryKey: ['frameworks', entitled],
    queryFn: async () => {
      const free = await fetchFree('frameworks.json');
      if (!entitled) return free;
      try {
        const paid = await fetchPaid('paid_frameworks');
        const map = new Map();
        free.forEach((item: any) => map.set(item.id, item));
        paid.forEach((item: any) => map.set(item.id, item));
        return Array.from(map.values());
      } catch (err) {
        console.error('Error merging paid frameworks:', err);
        return free;
      }
    },
  });
}
