'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string; created_at: string }

const COLORS = {
  bg: '#0B0F19', card: '#111827', border: '#1F2937',
  cyan: '#00D2FF', mint: '#00F5A0', white: '#FFFFFF', muted: '#6B7280',
  super_admin: '#FF6B6B', admin: '#00D2FF', creator: '#00F5A0', client: '#A78BFA',
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof || (prof.role !== 'admin' && prof.role !== 'super_admin')) { window.location.href = '/dashboard'; return }
      setCurrentUser(prof)
      const { data } = await supabase.from('profiles').select('*').order('created_at')
      setProfiles(data || [])
      setLoading(false)
    }
    getData()
  }, [])

  const changeRole = async (id: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p))
  }

  const roleColor: Record<string, string> = {
    super_admin: COLORS.super_admin,
    admin: COLORS.admin,
    creator: COLORS.creator,
    client: COLORS.client
  }

  const filtered = filter === 'all' ? profiles : profiles.filter(p => p.role === filter)
  const counts = {
    all: profiles.length,
    super_admin: profiles.filter(p=>p.role==='super_admin').length,
    admin: profiles.filter(p=>p.role==='admin').length,
    creator: profiles.filter(p=>p.role==='creator').length,
    client: profiles.filter(p=>p.role==='client').length,
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Loading...</div>

  const isSuperAdmin = currentUser?.role === 'super_admin'

  return (
    <div style={{ minHeight:'100vh', background:COLORS.bg, fontFamily:'sans-serif', color:COLORS.white }}>
      <div style={{ position:'fixed', top:0, left:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.cyan}11, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:0, right:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.mint}11, transparent 70%)`, pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ background:'#0D1117', borderBottom:`1px solid ${COLORS.border}`, padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1.4rem' }}>📅</span>
          <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Aprawebix Digital</h1>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <a href="/dashboard" style={{ padding:'6px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>← Calendar</a>
          <a href="/approvals" style={{ padding:'6px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>🔔 Approvals</a>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ padding:'6px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'0.85rem' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'2rem auto', padding:'0 1rem' }}>

        {/* Super Admin badge */}
        {isSuperAdmin && (
          <div style={{ background:`${COLORS.super_admin}11`, border:`1px solid ${COLORS.super_admin}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <span style={{ color:COLORS.super_admin, fontSize:'0.9rem' }}>⭐ You are a <strong>Super Admin</strong> — you can manage all user roles</span>
          </div>
        )}

        {!isSuperAdmin && (
          <div style={{ background:`${COLORS.cyan}11`, border:`1px solid ${COLORS.cyan}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1.5rem' }}>
            <span style={{ color:COLORS.cyan, fontSize:'0.9rem' }}>👁 You are viewing the team as an <strong>Admin</strong> — contact a Super Admin to change roles</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {(['all','super_admin','admin','creator','client'] as const).map(r => (
            <div key={r} onClick={() => setFilter(r)} style={{ background:COLORS.card, padding:'1rem', borderRadius:'12px', textAlign:'center', cursor:'pointer', border: filter===r ? `1px solid ${r==='all'?COLORS.cyan:roleColor[r]}` : `1px solid ${COLORS.border}`, transition:'border 0.15s' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:700, color: r==='all'?COLORS.cyan:roleColor[r] }}>{counts[r]}</div>
              <div style={{ fontSize:'0.7rem', color:COLORS.muted, textTransform:'capitalize', marginTop:'2px' }}>{r==='all'?'Total':r.replace('_',' ')+'s'}</div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div style={{ background:COLORS.card, borderRadius:'12px', overflow:'hidden', border:`1px solid ${COLORS.border}`, marginBottom:'1.5rem' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:`1px solid ${COLORS.border}` }}>
            <h2 style={{ margin:0, fontSize:'1rem', color:COLORS.white }}>
              {filter==='all'?'All Users':`${filter.replace('_',' ').charAt(0).toUpperCase()+filter.replace('_',' ').slice(1)}s`} ({filtered.length})
            </h2>
          </div>
          {filtered.length === 0 && <div style={{ padding:'3rem', textAlign:'center', color:COLORS.muted }}>No users found.</div>}
          {filtered.map(p => (
            <div key={p.id} style={{ padding:'1rem 1.5rem', borderBottom:`1px solid ${COLORS.border}`, display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`${roleColor[p.role]}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:700, color:roleColor[p.role], flexShrink:0, border:`1px solid ${roleColor[p.role]}44` }}>
                {(p.full_name || p.email).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:'0.95rem', color:COLORS.white }}>{p.full_name || '—'}</div>
                <div style={{ fontSize:'0.8rem', color:COLORS.muted }}>{p.email}</div>
              </div>
              <div style={{ fontSize:'0.8rem', color:COLORS.muted }}>{new Date(p.created_at).toLocaleDateString()}</div>

              {p.id !== currentUser?.id ? (
                isSuperAdmin ? (
                  // Super admin can change any role
                  <select value={p.role} onChange={e => changeRole(p.id, e.target.value)}
                    style={{ padding:'4px 10px', border:`1px solid ${roleColor[p.role]}44`, borderRadius:'8px', fontSize:'0.85rem', color:roleColor[p.role], background:`${roleColor[p.role]}22`, cursor:'pointer', fontWeight:500, outline:'none' }}>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="creator">creator</option>
                    <option value="client">Client</option>
                  </select>
                ) : (
                  // Regular admin can only view roles
                  <span style={{ padding:'4px 12px', background:`${roleColor[p.role]}22`, color:roleColor[p.role], borderRadius:'8px', fontSize:'0.85rem', fontWeight:500, border:`1px solid ${roleColor[p.role]}44`, textTransform:'capitalize' as const }}>
                    {p.role.replace('_', ' ')}
                  </span>
                )
              ) : (
                <span style={{ padding:'4px 12px', background:`${roleColor[p.role]}22`, color:roleColor[p.role], borderRadius:'8px', fontSize:'0.85rem', fontWeight:500, border:`1px solid ${roleColor[p.role]}44` }}>
                  You ({p.role.replace('_', ' ')})
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Invite links - only super admin */}
        {isSuperAdmin && (
          <div style={{ background:COLORS.card, borderRadius:'12px', padding:'1.5rem', border:`1px solid ${COLORS.border}` }}>
            <h3 style={{ margin:'0 0 1rem', fontSize:'1rem', color:COLORS.white }}>🔗 Invite Links</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {['creator','client'].map(r => (
                <div key={r} style={{ padding:'0.75rem 1rem', background:`${roleColor[r]}11`, borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${roleColor[r]}33` }}>
                  <div>
                    <div style={{ fontSize:'0.8rem', fontWeight:600, color:roleColor[r], textTransform:'capitalize' as const, marginBottom:'2px' }}>{r} invite</div>
                    <div style={{ fontSize:'0.75rem', color:COLORS.muted }}>/join/{r}</div>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${r}`)}
                    style={{ padding:'4px 14px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}