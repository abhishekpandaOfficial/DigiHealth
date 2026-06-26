import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

export function useSupabaseData<T extends { id: string }>(tableName: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (memberId?: string) => {
    setLoading(true)
    setError(null)
    let query = supabase.from(tableName).select("*").order("created_at", { ascending: false })
    if (memberId) query = query.eq("member_id", memberId)
    const { data: result, error: err } = await query
    if (err) setError(err.message)
    else setData(result ?? [])
    setLoading(false)
    return result ?? []
  }, [tableName])

  const create = useCallback(async (record: Omit<T, "id" | "created_at">) => {
    const { data: result, error: err } = await supabase
      .from(tableName)
      .insert(record as any)
      .select()
      .single()
    if (err) throw new Error(err.message)
    setData(prev => [result, ...prev])
    return result as T
  }, [tableName])

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    const { data: result, error: err } = await supabase
      .from(tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    if (err) throw new Error(err.message)
    setData(prev => prev.map(d => d.id === id ? result : d))
    return result as T
  }, [tableName])

  const remove = useCallback(async (id: string) => {
    const { error: err } = await supabase.from(tableName).delete().eq("id", id)
    if (err) throw new Error(err.message)
    setData(prev => prev.filter(d => d.id !== id))
  }, [tableName])

  return { data, loading, error, fetch, create, update, remove }
}
