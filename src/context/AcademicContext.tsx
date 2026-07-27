import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Term {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface AcademicContextValue {
  years: AcademicYear[];
  terms: Term[];
  selectedYearId: string;
  selectedTermId: string;
  setYear: (id: string) => void;
  setTerm: (id: string) => void;
  loading: boolean;
}

import { createContext, useContext } from 'react';

const AcademicContext = createContext<AcademicContextValue | undefined>(undefined);

export function AcademicProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.school_id) { setLoading(false); return; }
    Promise.all([
      supabase.from('academic_years').select('*').eq('school_id', profile.school_id).order('name'),
      supabase.from('terms').select('*').eq('school_id', profile.school_id).order('name'),
    ]).then(([y, t]) => {
      const yrs = (y.data as AcademicYear[]) ?? [];
      const tms = (t.data as Term[]) ?? [];
      setYears(yrs);
      setTerms(tms);
      const activeYr = yrs.find((y) => y.is_active) ?? yrs[0];
      if (activeYr) {
        setSelectedYearId(activeYr.id);
        const activeTm = tms.find((t) => t.academic_year_id === activeYr.id && t.is_active) ?? tms.find((t) => t.academic_year_id === activeYr.id);
        if (activeTm) setSelectedTermId(activeTm.id);
      }
      setLoading(false);
    });
  }, [profile?.school_id]);

  const setYear = (id: string) => {
    setSelectedYearId(id);
    const yrTerms = terms.filter((t) => t.academic_year_id === id);
    const active = yrTerms.find((t) => t.is_active) ?? yrTerms[0];
    setSelectedTermId(active?.id ?? '');
  };

  return (
    <AcademicContext.Provider value={{ years, terms, selectedYearId, selectedTermId, setYear, setTerm: setSelectedTermId, loading }}>
      {children}
    </AcademicContext.Provider>
  );
}

export function useAcademic(): AcademicContextValue {
  const ctx = useContext(AcademicContext);
  if (!ctx) throw new Error('useAcademic must be used within AcademicProvider');
  return ctx;
}
