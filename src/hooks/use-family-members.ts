import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { FamilyMember } from "@/lib/supabase"

export function useFamilyMembers() {
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from("family_members")
      .select("*")
      .order("created_at", { ascending: true })
    if (err) setError(err.message)
    else setMembers(data ?? [])
    setLoading(false)
  }, [])

  const createMember = useCallback(async (member: Omit<FamilyMember, "id" | "created_at" | "updated_at">) => {
    const { data, error: err } = await supabase
      .from("family_members")
      .insert(member)
      .select()
      .single()
    if (err) throw new Error(err.message)
    setMembers(prev => [...prev, data])
    return data
  }, [])

  const updateMember = useCallback(async (id: string, updates: Partial<FamilyMember>) => {
    const { data, error: err } = await supabase
      .from("family_members")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    setMembers(prev => prev.map(m => m.id === id ? data : m))
    return data
  }, [])

  const deleteMember = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("family_members")
      .delete()
      .eq("id", id)
    if (err) throw new Error(err.message)
    setMembers(prev => prev.filter(m => m.id !== id))
  }, [])

  return { members, loading, error, fetchMembers, createMember, updateMember, deleteMember }
}
