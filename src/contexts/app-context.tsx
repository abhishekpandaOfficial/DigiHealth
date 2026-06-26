import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { FamilyMember } from "@/lib/supabase"
import { useFamilyMembers } from "@/hooks/use-family-members"

interface MemberTab {
  id: string
  member: FamilyMember
  openedAt: number
}

export interface UserProfile {
  email: string
  name: string
  phone?: string
  uniqueId?: string
  avatarUrl?: string
  specialization?: string
  licenseId?: string
  hospitalName?: string
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
  // Auth state
  user: UserProfile | null
  role: "individual" | "doctor" | null
  isOnboarded: boolean
  loginWithGmail: (email: string, name: string) => void
  loginWithIdentifier: (identifier: string, name?: string) => { success: boolean; user?: UserProfile; isNew: boolean; uniqueId?: string }
  onboardUser: (role: "individual" | "doctor", name: string, details?: Partial<UserProfile>) => void
  logout: () => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { members, loading, error, fetchMembers, createMember, updateMember, deleteMember } = useFamilyMembers()
  const [tabs, setTabs] = useState<MemberTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)

  // Auth States with localStorage persistence
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("digihealth_user")
    return saved ? JSON.parse(saved) : null
  })
  const [role, setRole] = useState<"individual" | "doctor" | null>(() => {
    return localStorage.getItem("digihealth_role") as any ?? null
  })
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("digihealth_onboarded") === "true"
  })

  // Local storage profile database for multitenancy
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem("digihealth_all_users")
    return saved ? JSON.parse(saved) : []
  })

  const loginWithIdentifier = useCallback((identifier: string, name?: string) => {
    const cleanId = identifier.trim().toLowerCase()
    
    // Look up in allUsers list
    const existing = allUsers.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.phone && u.phone.replace(/[\s-]/g, "") === cleanId.replace(/[\s-]/g, "")) ||
      u.uniqueId === cleanId
    )
    
    if (existing) {
      const savedRole = localStorage.getItem(`digihealth_role_${existing.uniqueId}`) as any || (existing.specialization ? "doctor" : "individual")
      const savedOnboarded = localStorage.getItem(`digihealth_onboarded_${existing.uniqueId}`) === "true" || !!existing.specialization
      
      setUser(existing)
      setRole(savedRole)
      setIsOnboarded(savedOnboarded)
      
      localStorage.setItem("digihealth_user", JSON.stringify(existing))
      localStorage.setItem("digihealth_role", savedRole)
      localStorage.setItem("digihealth_onboarded", String(savedOnboarded))
      
      return { success: true, user: existing, isNew: false, uniqueId: existing.uniqueId }
    } else {
      // New user registration. Create 9-digit Unique ID
      const uniqueId = Math.floor(100000000 + Math.random() * 900000000).toString()
      const isEmail = cleanId.includes("@")
      const isNumber = /^\+?[0-9\s-]{8,20}$/.test(cleanId)
      
      const newUser: UserProfile = {
        email: isEmail ? cleanId : "",
        phone: isNumber ? cleanId : "",
        uniqueId,
        name: name || "New User",
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${uniqueId}`
      }
      
      if (!name) {
        return { success: false, isNew: true, uniqueId }
      }
      
      const updatedUsers = [...allUsers, newUser]
      setAllUsers(updatedUsers)
      localStorage.setItem("digihealth_all_users", JSON.stringify(updatedUsers))
      
      setUser(newUser)
      setRole(null)
      setIsOnboarded(false)
      
      localStorage.setItem("digihealth_user", JSON.stringify(newUser))
      localStorage.setItem("digihealth_role", "")
      localStorage.setItem("digihealth_onboarded", "false")
      
      return { success: true, user: newUser, isNew: true, uniqueId }
    }
  }, [allUsers])

  const loginWithGmail = useCallback((email: string, name: string) => {
    loginWithIdentifier(email, name)
  }, [loginWithIdentifier])

  const onboardUser = useCallback((selectedRole: "individual" | "doctor", fullName: string, details?: Partial<UserProfile>) => {
    setRole(selectedRole)
    setIsOnboarded(true)
    setUser(prev => {
      if (!prev) return null
      const uniqueId = prev.uniqueId || Math.floor(100000000 + Math.random() * 900000000).toString()
      const updated = { ...prev, name: fullName, uniqueId, ...details }
      
      setAllUsers(users => {
        const index = users.findIndex(u => u.uniqueId === uniqueId || (prev.email && u.email === prev.email))
        let newUsersList = [...users]
        if (index >= 0) {
          newUsersList[index] = updated
        } else {
          newUsersList.push(updated)
        }
        localStorage.setItem("digihealth_all_users", JSON.stringify(newUsersList))
        return newUsersList
      })

      localStorage.setItem("digihealth_user", JSON.stringify(updated))
      localStorage.setItem("digihealth_role", selectedRole)
      localStorage.setItem("digihealth_onboarded", "true")
      
      localStorage.setItem(`digihealth_role_${uniqueId}`, selectedRole)
      localStorage.setItem(`digihealth_onboarded_${uniqueId}`, "true")
      
      return updated
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setRole(null)
    setIsOnboarded(false)
    localStorage.removeItem("digihealth_user")
    localStorage.removeItem("digihealth_role")
    localStorage.removeItem("digihealth_onboarded")
    setTabs([])
    setActiveTabId(null)
  }, [])

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

  // SaaS Tenant Isolation filter
  const filteredMembers = React.useMemo(() => {
    if (!user) return []
    const userUniqueId = user.uniqueId
    return members.filter(m => {
      const hasDoctor = m.notes?.includes("[doctor:");
      const hasOwner = m.notes?.includes("[owner:");
      
      if (role === "doctor") {
        return m.notes?.includes(`[doctor:${userUniqueId}]`) || m.uhid === userUniqueId;
      } else {
        if (hasDoctor) return false;
        if (hasOwner) {
          return m.notes?.includes(`[owner:${userUniqueId}]`);
        }
        return true;
      }
    })
  }, [members, user, role])

  return (
    <AppContext.Provider value={{
      members: filteredMembers, tabs, activeTabId, activeMember,
      loading, error, refetchMembers: fetchMembers,
      createMember, updateMember, deleteMember,
      openMemberTab, closeTab, setActiveTab, getMemberById,
      user, role, isOnboarded, loginWithGmail, loginWithIdentifier, onboardUser, logout
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
