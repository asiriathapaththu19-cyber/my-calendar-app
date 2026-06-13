'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { id: string; title: string; description: string; start_date: string; end_date: string; visible_to: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const COLORS = {
  bg: '#0B0F19',
  card: '#111827',
  border: '#1F2937',
  cyan: '#00D2FF',
  mint: '#00F5A0',
  white: '#FFFFFF',
  muted: '#6B7280',
  adminColor: '#00D2FF',
  employeeColor: '#00F5A0',
  clientColor: '#A78BFA',
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
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
    if (!profile || !newEvent.title) return
    await supabase.from('events').insert({ ...newEvent, created_by: profile.id })
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', start_date: '', end_date: '', visible_to: 'all' })
  }

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return events.filter(e => {
      const d = new Date(e.start_date)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const roleColor = profile?.role === 'admin' ? COLORS.adminColor : profile?.role === 'employee' ? COLORS.employeeColor : COLORS.clientColor
  const today = new Date()

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Loading...</div>

  const days = getDaysInMonth(currentDate)
  const selectedEvents = selectedDate ? getEventsForDay(parseInt(selectedDate)) : []

  const inputStyle = { width:'100%', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', boxSizing:'border-box' as const, outline:'none' }

  return (
    <div style={{ minHeight:'100vh', background:COLORS.bg, fontFamily:'sans-serif', color:COLORS.white }}>
      {/* Glow */}
      <div style={{ position:'fixed', top:0, left:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.cyan}11, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:0, right:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.mint}11, transparent 70%)`, pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ background:'#0D1117', borderBottom:`1px solid ${COLORS.border}`, padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1.4rem' }}>📅</span>
          <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Agency Calendar</h1>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ background:`${roleColor}22`, color:roleColor, padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const, border:`1px solid ${roleColor}44` }}>{profile?.role}</span>
          <span style={{ color:COLORS.muted, fontSize:'0.85rem' }}>{profile?.email}</span>
          {profile?.role === 'admin' && (
            <a href="/users" style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>👥 Users</a>
          )}
          <button onClick={signOut} style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'0.85rem' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'2rem auto', padding:'0 1rem' }}>
        {/* Month nav */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1))} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>←</button>
          <h2 style={{ margin:0, fontSize:'1.3rem', fontWeight:600 }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1))} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>→</button>
        </div>

        {/* Calendar grid */}
        <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}`, marginBottom:'1.5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
            {DAYS.map(d => <div key={d} style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.75rem', fontWeight:600, color:COLORS.muted, letterSpacing:'0.05em' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const isToday = day && today.getDate()===day && today.getMonth()===currentDate.getMonth() && today.getFullYear()===currentDate.getFullYear()
              const isSelected = day && selectedDate === String(day)
              const dayEvents = day ? getEventsForDay(day) : []
              return (
                <div key={i} onClick={() => day && setSelectedDate(String(day))}
                  style={{ minHeight:'90px', padding:'8px', borderRight:`0.5px solid ${COLORS.border}`, borderBottom:`0.5px solid ${COLORS.border}`, cursor:day?'pointer':'default', background: isSelected?`${COLORS.cyan}11`: isToday?`${COLORS.mint}08`:COLORS.card, transition:'background 0.1s' }}>
                  {day && (
                    <>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight: isToday?700:400, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white, marginBottom:'4px' }}>{day}</div>
                      {dayEvents.slice(0,2).map(e => (
                        <div key={e.id} style={{ fontSize:'0.7rem', background:`${roleColor}22`, color:roleColor, padding:'2px 6px', borderRadius:'4px', marginBottom:'2px', overflow:'hidden', whiteSpace:'nowrap' as const, textOverflow:'ellipsis', border:`1px solid ${roleColor}33` }}>{e.title}</div>
                      ))}
                      {dayEvents.length > 2 && <div style={{ fontSize:'0.65rem', color:COLORS.muted }}>+{dayEvents.length-2} more</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ margin:0, color:COLORS.muted, fontSize:'0.95rem' }}>
            {selectedDate ? `Events on ${MONTHS[currentDate.getMonth()]} ${selectedDate}` : 'Click a day to see events'}
          </h3>
          {profile?.role === 'admin' && (
            <button onClick={() => { setShowAddEvent(!showAddEvent); if(selectedDate) setNewEvent(n => ({...n, start_date:`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${selectedDate.padStart(2,'0')}T09:00`, end_date:`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${selectedDate.padStart(2,'0')}T10:00`})) }}
              style={{ padding:'8px 20px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>
              + Add Event
            </button>
          )}
        </div>

        {/* Add event form */}
        {showAddEvent && (
          <div style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', marginBottom:'1rem', border:`1px solid ${COLORS.border}` }}>
            <h3 style={{ margin:'0 0 1rem', color:COLORS.white }}>New Event</h3>
            <input placeholder="Title*" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
            <input placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
              <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Start</label><input type="datetime-local" value={newEvent.start_date} onChange={e => setNewEvent({...newEvent, start_date:e.target.value})} style={inputStyle} /></div>
              <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>End</label><input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date:e.target.value})} style={inputStyle} /></div>
            </div>
            <select value={newEvent.visible_to} onChange={e => setNewEvent({...newEvent, visible_to:e.target.value})} style={{...inputStyle, marginBottom:'1rem'}}>
              <option value="all">Visible to Everyone</option>
              <option value="employee">Employees Only</option>
              <option value="client">Clients Only</option>
            </select>
            <button onClick={addEvent} style={{ padding:'8px 24px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>Save Event</button>
          </div>
        )}

        {/* Events list */}
        {selectedDate && selectedEvents.length === 0 && <div style={{ background:COLORS.card, padding:'2rem', borderRadius:'12px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>No events on this day.</div>}
        {selectedEvents.map(event => (
          <div key={event.id} style={{ background:COLORS.card, padding:'1.25rem', borderRadius:'12px', marginBottom:'0.75rem', border:`1px solid ${COLORS.border}`, borderLeft:`3px solid ${roleColor}` }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <h3 style={{ margin:'0 0 0.25rem', fontSize:'1rem', color:COLORS.white }}>{event.title}</h3>
                <p style={{ margin:'0 0 0.5rem', color:COLORS.muted, fontSize:'0.9rem' }}>{event.description}</p>
                <p style={{ margin:0, fontSize:'0.8rem', color:COLORS.muted }}>{new Date(event.start_date).toLocaleString()} → {new Date(event.end_date).toLocaleString()}</p>
              </div>
              <span style={{ fontSize:'0.75rem', background:`${roleColor}22`, padding:'3px 10px', borderRadius:'20px', color:roleColor, height:'fit-content', border:`1px solid ${roleColor}33` }}>{event.visible_to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}