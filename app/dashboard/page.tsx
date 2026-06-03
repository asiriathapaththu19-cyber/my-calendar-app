'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { id: string; title: string; description: string; start_date: string; end_date: string; visible_to: string }

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_date: '', end_date: '', visible_to: 'all' })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof) {
        const newProf = { id: user.id, email: user.email, role: 'client', full_name: '' }
        await supabase.from('profiles').insert(newProf)
        setProfile(newProf as Profile)
      } else { setProfile(prof) }
      const { data: evts } = await supabase.from('events').select('*').order('start_date')
      setEvents(evts || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const addEvent = async () => {
    if (!profile) return
    await supabase.from('events').insert({ ...newEvent, created_by: profile.id })
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', start_date: '', end_date: '', visible_to: 'all' })
  }

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>

  const roleColor = { admin: '#7C3AED', employee: '#2563EB', client: '#059669' }[profile?.role || 'client']

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'sans-serif' }}>
      <div style={{ background: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>📅 Agency Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ background: roleColor, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize' }}>{profile?.role}</span>
          <span style={{ color: '#666', fontSize: '0.9rem' }}>{profile?.email}</span>
          <button onClick={signOut} style={{ padding: '6px 16px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: 'white' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>
            {profile?.role === 'admin' ? '🛠 All Events' : profile?.role === 'employee' ? '👤 My Tasks' : '📋 My Appointments'}
          </h2>
          {profile?.role === 'admin' && (
            <button onClick={() => setShowAddEvent(!showAddEvent)} style={{ padding: '8px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
              + Add Event
            </button>
          )}
        </div>

        {showAddEvent && (
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 1rem' }}>New Event</h3>
            <input placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const }} />
            <input placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div><label style={{ fontSize: '0.8rem', color: '#666' }}>Start</label><input type="datetime-local" value={newEvent.start_date} onChange={e => setNewEvent({...newEvent, start_date: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const }} /></div>
              <div><label style={{ fontSize: '0.8rem', color: '#666' }}>End</label><input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date: e.target.value})} style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const }} /></div>
            </div>
            <select value={newEvent.visible_to} onChange={e => setNewEvent({...newEvent, visible_to: e.target.value})} style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' as const }}>
              <option value="all">Visible to Everyone</option>
              <option value="employee">Employees Only</option>
              <option value="client">Clients Only</option>
            </select>
            <button onClick={addEvent} style={{ padding: '8px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Save Event</button>
          </div>
        )}

        {events.length === 0 ? (
          <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#999' }}>No events yet.</div>
        ) : (
          events.map(event => (
            <div key={event.id} style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', marginBottom: '0.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${roleColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem' }}>{event.title}</h3>
                  <p style={{ margin: '0 0 0.5rem', color: '#666', fontSize: '0.9rem' }}>{event.description}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
                    {new Date(event.start_date).toLocaleString()} → {new Date(event.end_date).toLocaleString()}
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', background: '#f0f4f8', padding: '3px 10px', borderRadius: '20px', color: '#666' }}>{event.visible_to}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}