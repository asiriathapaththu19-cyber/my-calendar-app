'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { id: string; title: string; description: string; start_date: string; end_date: string; visible_to: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

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

  const roleColor = { admin: '#7C3AED', employee: '#2563EB', client: '#059669' }[profile?.role || 'client']
  const today = new Date()

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>Loading...</div>

  const days = getDaysInMonth(currentDate)
  const selectedEvents = selectedDate ? getEventsForDay(parseInt(selectedDate)) : []

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      {/* Header */}
      <div style={{ background:'white', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin:0, fontSize:'1.25rem' }}>📅 Agency Calendar</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ background:roleColor, color:'white', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const }}>{profile?.role}</span>
          <span style={{ color:'#666', fontSize:'0.9rem' }}>{profile?.email}</span>
          <button onClick={signOut} style={{ padding:'6px 16px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'white' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'1000px', margin:'2rem auto', padding:'0 1rem' }}>
        {/* Month navigation */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1))} style={{ padding:'8px 16px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'white', fontSize:'1rem' }}>←</button>
          <h2 style={{ margin:0, fontSize:'1.4rem' }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1))} style={{ padding:'8px 16px', border:'1px solid #ddd', borderRadius:'8px', cursor:'pointer', background:'white', fontSize:'1rem' }}>→</button>
        </div>

        {/* Calendar grid */}
        <div style={{ background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:'1.5rem' }}>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#f8f9fa' }}>
            {DAYS.map(d => <div key={d} style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.8rem', fontWeight:600, color:'#666' }}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const isToday = day && today.getDate()===day && today.getMonth()===currentDate.getMonth() && today.getFullYear()===currentDate.getFullYear()
              const isSelected = day && selectedDate === String(day)
              const dayEvents = day ? getEventsForDay(day) : []
              return (
                <div key={i} onClick={() => day && setSelectedDate(String(day))}
                  style={{ minHeight:'90px', padding:'8px', borderRight:'0.5px solid #f0f0f0', borderBottom:'0.5px solid #f0f0f0', cursor:day?'pointer':'default', background: isSelected?'#EEF2FF': isToday?'#FFF7ED':'white', transition:'background 0.1s' }}>
                  {day && (
                    <>
                      <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight: isToday?700:400, background: isToday?roleColor:'transparent', color: isToday?'white':'#333', marginBottom:'4px' }}>{day}</div>
                      {dayEvents.slice(0,2).map(e => (
                        <div key={e.id} style={{ fontSize:'0.7rem', background:roleColor+'22', color:roleColor, padding:'2px 6px', borderRadius:'4px', marginBottom:'2px', overflow:'hidden', whiteSpace:'nowrap' as const, textOverflow:'ellipsis' }}>{e.title}</div>
                      ))}
                      {dayEvents.length > 2 && <div style={{ fontSize:'0.65rem', color:'#999' }}>+{dayEvents.length-2} more</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected day events + Add button */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ margin:0, color:'#444' }}>
            {selectedDate ? `Events on ${MONTHS[currentDate.getMonth()]} ${selectedDate}` : 'Click a day to see events'}
          </h3>
          {profile?.role === 'admin' && (
            <button onClick={() => { setShowAddEvent(!showAddEvent); if(selectedDate) setNewEvent(n => ({...n, start_date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${selectedDate.padStart(2,'0')}T09:00`, end_date: `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${selectedDate.padStart(2,'0')}T10:00`})) }}
              style={{ padding:'8px 20px', background:'#4F46E5', color:'white', border:'none', borderRadius:'8px', cursor:'pointer' }}>
              + Add Event
            </button>
          )}
        </div>

        {/* Add event form */}
        {showAddEvent && (
          <div style={{ background:'white', padding:'1.5rem', borderRadius:'12px', marginBottom:'1rem', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 1rem' }}>New Event</h3>
            <input placeholder="Title*" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title:e.target.value})} style={{ width:'100%', padding:'0.6rem', marginBottom:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', boxSizing:'border-box' as const }} />
            <input placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description:e.target.value})} style={{ width:'100%', padding:'0.6rem', marginBottom:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', boxSizing:'border-box' as const }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
              <div><label style={{ fontSize:'0.8rem', color:'#666' }}>Start</label><input type="datetime-local" value={newEvent.start_date} onChange={e => setNewEvent({...newEvent, start_date:e.target.value})} style={{ width:'100%', padding:'0.6rem', border:'1px solid #ddd', borderRadius:'8px', boxSizing:'border-box' as const }} /></div>
              <div><label style={{ fontSize:'0.8rem', color:'#666' }}>End</label><input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent({...newEvent, end_date:e.target.value})} style={{ width:'100%', padding:'0.6rem', border:'1px solid #ddd', borderRadius:'8px', boxSizing:'border-box' as const }} /></div>
            </div>
            <select value={newEvent.visible_to} onChange={e => setNewEvent({...newEvent, visible_to:e.target.value})} style={{ width:'100%', padding:'0.6rem', marginBottom:'1rem', border:'1px solid #ddd', borderRadius:'8px', boxSizing:'border-box' as const }}>
              <option value="all">Visible to Everyone</option>
              <option value="employee">Employees Only</option>
              <option value="client">Clients Only</option>
            </select>
            <button onClick={addEvent} style={{ padding:'8px 24px', background:'#4F46E5', color:'white', border:'none', borderRadius:'8px', cursor:'pointer' }}>Save Event</button>
          </div>
        )}

        {/* Events for selected day */}
        {selectedDate && selectedEvents.length === 0 && <div style={{ background:'white', padding:'2rem', borderRadius:'12px', textAlign:'center', color:'#999' }}>No events on this day.</div>}
        {selectedEvents.map(event => (
          <div key={event.id} style={{ background:'white', padding:'1.25rem', borderRadius:'12px', marginBottom:'0.75rem', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', borderLeft:`4px solid ${roleColor}` }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <div>
                <h3 style={{ margin:'0 0 0.25rem', fontSize:'1rem' }}>{event.title}</h3>
                <p style={{ margin:'0 0 0.5rem', color:'#666', fontSize:'0.9rem' }}>{event.description}</p>
                <p style={{ margin:0, fontSize:'0.8rem', color:'#999' }}>{new Date(event.start_date).toLocaleString()} → {new Date(event.end_date).toLocaleString()}</p>
              </div>
              <span style={{ fontSize:'0.75rem', background:'#f0f4f8', padding:'3px 10px', borderRadius:'20px', color:'#666', height:'fit-content' }}>{event.visible_to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}