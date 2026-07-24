import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Student, ClassRow, Subject, AppUser } from '@/types';

interface SchoolData {
  students: Student[];
  teachers: AppUser[];
  parents: AppUser[];
  classes: ClassRow[];
  subjects: Subject[];
  loading: boolean;
  refresh: () => void;
}

export function useSchoolData(): SchoolData {
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<AppUser[]>([]);
  const [parents, setParents] = useState<AppUser[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!profile?.school_id) {
      setLoading(false);
      return;
    }
    const sid = profile.school_id;
    setLoading(true);
    Promise.all([
      supabase.from('students').select('*').eq('school_id', sid).order('full_name'),
      supabase.from('app_users').select('*').eq('school_id', sid).eq('role', 'teacher').order('full_name'),
      supabase.from('app_users').select('*').eq('school_id', sid).eq('role', 'parent').order('full_name'),
      supabase.from('classes').select('*').eq('school_id', sid).order('name'),
      supabase.from('subjects').select('*').eq('school_id', sid).order('name'),
    ]).then(([s, t, p, c, sub]) => {
      setStudents((s.data as Student[]) ?? []);
      setTeachers((t.data as AppUser[]) ?? []);
      setParents((p.data as AppUser[]) ?? []);
      setClasses((c.data as ClassRow[]) ?? []);
      setSubjects((sub.data as Subject[]) ?? []);
      setLoading(false);
    });
  };

  useEffect(load, [profile?.school_id]);

  return { students, teachers, parents, classes, subjects, loading, refresh: load };
}
