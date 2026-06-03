'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string; created_at: string }

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
      if (!prof || prof.role !== 'admin') { window.location.href = '/dashboard'; return }
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

  const roleColor: Record<string, string> = { admin: '#7C3AED', employee: '#2563EB', client: '#059669' }
  const roleBg: Record<string, string> = { admin: '#F5F3FF', employee: '#EFF6FF', client: '#ECFDF5' }

  const filtered = filter === 'all' ? profiles : profiles.filter(p => p.role === filter)

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>Loading...</div>

  const counts = {
    all: profiles.length,
    admin: profiles.filter(p => p.role === 'admin').length,
    employee: profiles.filter(p => p.role === 'employee').length,
    client: profiles.filter(p => p.role === 'client').length,
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      {/* Header */}
      <div style={{ background:'white', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin:0, fontSize:'1.25rem' }}>📅 Agency Calendar</h1>
        <div style={{ display:'flex', gap:'1rem' }}>
          <a href="/dashboard" style={{ padding:'6px 16px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'white', textDecoration:'none', color:'#333', fontSize:'0.9rem' }}>← Calendar</a>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ padding:'6px 16px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'white' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'2rem auto', padding:'0 1rem' }}>
        {/* Stats cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {(['all','admin','employee','client'] as const).map(r => (
            <div key={r} onClick={() => setFilter(r)} style={{ background: filter===r ? 'white' : 'white', padding:'1rem', borderRadius:'12px', textAlign:'center', cursor:'pointer', boxShadow: filter===r ? '0 0 0 2px #4F46E5' : '0 1px 4px rgba(0,0,0,0.06)', transition:'box-shadow 0.15s' }}>
              <div style={{ fontSize:'1.75rem', fontWeight:700, color: r==='all'?'#4F46E5':roleColor[r] }}>{counts[r]}</div>
              <div style={{ fontSize:'0.8rem', color:'#666', textTransform:'capitalize', marginTop:'2px' }}>{r==='all'?'Total Users':r+'s'}</div>
            </div>
          ))}
        </div>

        {/* User list */}
        <div style={{ background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:'1rem 1.5rem', borderBottom:'0.5px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h2 style={{ margin:0, fontSize:'1rem' }}>
              {filter === 'all' ? 'All Users' : `${filter.charAt(0).toUpperCase()+filter.slice(1)}s`} ({filtered.length})
            </h2>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding:'3rem', textAlign:'center', color:'#999' }}>No users found.</div>
          )}
          {filtered.map(p => (
            <div key={p.id} style={{ padding:'1rem 1.5rem', borderBottom:'0.5px solid #f0f0f0', display:'flex', alignItems:'center', gap:'1rem' }}>
              {/* Avatar */}
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:roleBg[p.role], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem', fontWeight:600, color:roleColor[p.role], flexShrink:0 }}>
                {(p.full_name || p.email).charAt(0).toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:'0.95rem' }}>{p.full_name || '—'}</div>
                <div style={{ fontSize:'0.8rem', color:'#999' }}>{p.email}</div>
              </div>
              {/* Joined */}
              <div style={{ fontSize:'0.8rem', color:'#999', minWidth:'100px', textAlign:'right' }}>
                {new Date(p.created_at).toLocaleDateString()}
              </div>
              {/* Role selector */}
              {p.id !== currentUser?.id ? (
                <select
                  value={p.role}
                  onChange={e => changeRole(p.id, e.target.value)}
                  style={{ padding:'4px 10px', border:`1.5px solid ${roleColor[p.role]}`, borderRadius:'8px', fontSize:'0.85rem', color:roleColor[p.role], background:roleBg[p.role], cursor:'pointer', fontWeight:500 }}
                >
                  <option value="admin">Admin</option>
                  <option value="employee">Employee</option>
                  <option value="client">Client</option>
                </select>
              ) : (
                <span style={{ padding:'4px 10px', background:roleBg[p.role], color:roleColor[p.role], borderRadius:'8px', fontSize:'0.85rem', fontWeight:500 }}>You ({p.role})</span>
              )}
            </div>
          ))}
        </div>

        {/* Invite links */}
        <div style={{ background:'white', borderRadius:'12px', padding:'1.5rem', marginTop:'1.5rem', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin:'0 0 1rem', fontSize:'1rem' }}>🔗 Invite Links</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {['employee','client'].map(r => (
              <div key={r} style={{ padding:'0.75rem 1rem', background:roleBg[r], borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:roleColor[r], textTransform:'capitalize', marginBottom:'2px' }}>{r} invite</div>
                  <div style={{ fontSize:'0.75rem', color:'#666' }}>/join/{r}</div>
                </div>
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${r}`)}
                  style={{ padding:'4px 12px', background:roleColor[r], color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}