import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { FamilyMember } from "@/lib/supabase"
import { useFamilyMembers } from "@/hooks/use-family-members"

interface MemberTab {
  id: string
  member: FamilyMember
  openedAt: number
}

interface AppContextType {
  members: FamilyMember[]
  tabs: MemberTab[]
  activeTabId: string | null
  activeMember: FamilyMember | null
  loading: boolean
  error: string | null
  refetchMembers: () => void
  createMember: (m: Omit<FamilyMember, "id" | "created_at" | "updated_at">) => Promise<FamilyMember>
  updateMember: (id: string, updates: Partial<FamilyMember>) => Promise<FamilyMember>
  deleteMember: (id: string) => Promise<void>
  openMemberTab: (member: FamilyMember) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  getMemberById: (id: string) => FamilyMember | undefined
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { members, loading, error, fetchMembers, createMember, updateMember, deleteMember } = useFamilyMembers()
  const [tabs, setTabs] = useState<MemberTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const openMemberTab = useCallback((member: FamilyMember) => {
    setTabs(prev => {
      const existing = prev.find(t => t.member.id === member.id)
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: MemberTab = {
        id: `tab-${member.id}-${Date.now()}`,
        member,
        openedAt: Date.now()
      }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const idx = prev.findIndex(t => t.id === tabId)
        const newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? (newTabs[0]?.id ?? null)
        setActiveTabId(newActive)
      }
      return newTabs
    })
  }, [activeTabId])

  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId)
  }, [])

  const activeMember = tabs.find(t => t.id === activeTabId)?.member ?? null

  const getMemberById = useCallback((id: string) => {
    return members.find(m => m.id === id)
  }, [members])

  // Auto-open first member when members are loaded and no tab is open
  useEffect(() => {
    if (!loading && members.length > 0 && tabs.length === 0) {
      openMemberTab(members[0])
    }
  }, [loading, members, tabs.length, openMemberTab])

  // Keep tab member data in sync with member list updates
  useEffect(() => {
    setTabs(prev => prev.map(tab => {
      const updatedMember = members.find(m => m.id === tab.member.id)
      return updatedMember ? { ...tab, member: updatedMember } : tab
    }))
  }, [members])

  return (
    <AppContext.Provider value={{
      members, tabs, activeTabId, activeMember,
      loading, error, refetchMembers: fetchMembers,
      createMember, updateMember, deleteMember,
      openMemberTab, closeTab, setActiveTab, getMemberById
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
