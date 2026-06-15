'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { id: string; title: string; description: string; start_date: string; end_date: string; visible_to: string; assigned_to: string | null; status: string; created_by: string }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SHORT_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const COLORS = {
  bg: '#0B0F19', card: '#111827', border: '#1F2937',
  cyan: '#00D2FF', mint: '#00F5A0', white: '#FFFFFF', muted: '#6B7280',
  super_admin: '#FF6B6B', admin: '#00D2FF', employee: '#00F5A0', client: '#A78BFA', danger: '#FF6B6B',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', in_progress: '#00D2FF', completed: '#00F5A0'
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'admin' | 'employee'>('admin')
  const [calendarView, setCalendarView] = useState<'month'|'week'|'day'|'agenda'>('month')
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_date: '', end_date: '', visible_to: 'all', assigned_to: '', status: 'pending' })

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
      const { data: allProfiles } = await supabase.from('profiles').select('*').order('full_name')
      setProfiles(allProfiles || [])
      const { data: evts } = await supabase.from('events').select('*').order('start_date')
      setEvents(evts || [])
      setLoading(false)
    }
    getUser()
  }, [])

  const refreshEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
  }

  const addEvent = async () => {
    if (!profile || !newEvent.title) return
    await supabase.from('events').insert({ ...newEvent, created_by: profile.id, assigned_to: newEvent.assigned_to || null })
    await refreshEvents()
    setShowAddEvent(false)
    setNewEvent({ title: '', description: '', start_date: '', end_date: '', visible_to: 'all', assigned_to: '', status: 'pending' })
  }

  const saveEdit = async () => {
    if (!editingEvent) return
    await supabase.from('events').update({
      title: editingEvent.title, description: editingEvent.description,
      start_date: editingEvent.start_date, end_date: editingEvent.end_date,
      visible_to: editingEvent.visible_to, assigned_to: editingEvent.assigned_to || null,
      status: editingEvent.status,
    }).eq('id', editingEvent.id)
    await refreshEvents()
    setEditingEvent(null)
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    await refreshEvents()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('events').update({ status }).eq('id', id)
    await refreshEvents()
  }

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const getFilteredEvents = (evts: Event[]) => {
    return evts.filter(e => {
      if ((profile?.role === 'admin' || profile?.role === 'super_admin') && viewMode === 'admin') return true
      if (viewMode === 'employee' || profile?.role === 'employee') {
        if (e.visible_to === 'admin') return false
        if (e.visible_to === 'client') return false
        return e.assigned_to === profile?.id
      }
      if (profile?.role === 'client') {
        return e.assigned_to === profile?.id && e.visible_to !== 'admin' && e.visible_to !== 'employee'
      }
      return true
    }).filter(e => {
      const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === 'all' || e.status === filterStatus
      return matchSearch && matchStatus
    })
  }

  const getEventsForDay = (date: Date) => {
    return getFilteredEvents(events).filter(e => {
      const d = new Date(e.start_date)
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate()
    })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const getWeekDays = (date: Date) => {
    const day = date.getDay()
    const start = new Date(date)
    start.setDate(date.getDate() - day)
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  const navigateDate = (dir: number) => {
    const d = new Date(currentDate)
    if (calendarView === 'month') d.setMonth(d.getMonth() + dir)
    else if (calendarView === 'week') d.setDate(d.getDate() + dir * 7)
    else if (calendarView === 'day') d.setDate(d.getDate() + dir)
    else if (calendarView === 'agenda') d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const getProfileName = (id: string | null) => {
    if (!id) return null
    const p = profiles.find(p => p.id === id)
    return p ? `${p.full_name || p.email} (${p.role})` : null
  }

  const isAdminMode = (profile?.role === 'admin' || profile?.role === 'super_admin') && viewMode === 'admin'
  const isSuperAdmin = profile?.role === 'super_admin'
  const roleColor = viewMode === 'employee' ? COLORS.employee : (COLORS as any)[profile?.role || 'client'] || COLORS.client
  const today = new Date()

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Loading...</div>

  const inputStyle = { width:'100%', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', boxSizing:'border-box' as const, outline:'none' }

  const EventCard = ({ event, compact = false }: { event: Event, compact?: boolean }) => (
    <div style={{ background:COLORS.card, padding: compact ? '0.75rem 1rem' : '1.25rem', borderRadius:'12px', marginBottom:'0.5rem', border:`1px solid ${COLORS.border}`, borderLeft:`3px solid ${STATUS_COLORS[event.status]||roleColor}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
            <h3 style={{ margin:0, fontSize: compact ? '0.9rem' : '1rem', color:COLORS.white }}>{event.title}</h3>
            <span style={{ fontSize:'0.65rem', background:`${STATUS_COLORS[event.status]}22`, color:STATUS_COLORS[event.status], padding:'2px 6px', borderRadius:'20px', border:`1px solid ${STATUS_COLORS[event.status]}44`, fontWeight:600 }}>
              {event.status.replace('_',' ')}
            </span>
          </div>
          {!compact && <p style={{ margin:'0 0 0.5rem', color:COLORS.muted, fontSize:'0.9rem' }}>{event.description}</p>}
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' as const }}>
            <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.muted }}>
              {new Date(event.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} → {new Date(event.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </p>
            {event.assigned_to && <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.cyan }}>👤 {getProfileName(event.assigned_to)}</p>}
          </div>
        </div>
        {isAdminMode && (
          <div style={{ display:'flex', gap:'0.4rem', marginLeft:'0.5rem' }}>
            <button onClick={() => { setEditingEvent(event); setShowAddEvent(false) }}
              style={{ padding:'3px 8px', background:`${COLORS.cyan}22`, color:COLORS.cyan, border:`1px solid ${COLORS.cyan}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>✏️</button>
            <button onClick={() => deleteEvent(event.id)}
              style={{ padding:'3px 8px', background:`${COLORS.danger}22`, color:COLORS.danger, border:`1px solid ${COLORS.danger}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  )

  const EventForm = ({ data, onChange, onSave, onCancel, saveLabel }: any) => (
    <div style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', marginBottom:'1rem', border:`1px solid ${COLORS.cyan}44` }}>
      <input placeholder="Title*" value={data.title} onChange={e => onChange({...data, title:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <input placeholder="Description" value={data.description} onChange={e => onChange({...data, description:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
        <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Start</label><input type="datetime-local" value={data.start_date?.slice(0,16)||''} onChange={e => onChange({...data, start_date:e.target.value})} style={inputStyle} /></div>
        <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>End</label><input type="datetime-local" value={data.end_date?.slice(0,16)||''} onChange={e => onChange({...data, end_date:e.target.value})} style={inputStyle} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Assign to</label>
          <select value={data.assigned_to||''} onChange={e => onChange({...data, assigned_to:e.target.value})} style={inputStyle}>
            <option value="">Everyone</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Visibility</label>
          <select value={data.visible_to} onChange={e => onChange({...data, visible_to:e.target.value})} style={inputStyle}>
            <option value="all">Everyone</option>
            <option value="employee">Employees Only</option>
            <option value="client">Clients Only</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Status</label>
          <select value={data.status||'pending'} onChange={e => onChange({...data, status:e.target.value})} style={inputStyle}>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <button onClick={onSave} style={{ padding:'8px 24px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>{saveLabel}</button>
        <button onClick={onCancel} style={{ padding:'8px 24px', background:'transparent', color:COLORS.muted, border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )

  // MONTH VIEW
  const MonthView = () => {
    const days = getDaysInMonth(currentDate)
    return (
      <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
          {DAYS.map(d => <div key={d} style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.75rem', fontWeight:600, color:COLORS.muted, letterSpacing:'0.05em' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {days.map((day, i) => {
            const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
            const isToday = cellDate && today.toDateString() === cellDate.toDateString()
            const isSelected = cellDate && selectedDate === cellDate.toDateString()
            const dayEvents = cellDate ? getEventsForDay(cellDate) : []
            return (
              <div key={i} onClick={() => cellDate && setSelectedDate(cellDate.toDateString())}
                style={{ minHeight:'90px', padding:'8px', borderRight:`0.5px solid ${COLORS.border}`, borderBottom:`0.5px solid ${COLORS.border}`, cursor:day?'pointer':'default', background: isSelected?`${COLORS.cyan}11`: isToday?`${COLORS.mint}08`:COLORS.card }}>
                {day && (
                  <>
                    <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight: isToday?700:400, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white, marginBottom:'4px' }}>{day}</div>
                    {dayEvents.slice(0,2).map(e => (
                      <div key={e.id} style={{ fontSize:'0.7rem', background:`${STATUS_COLORS[e.status]||roleColor}22`, color:STATUS_COLORS[e.status]||roleColor, padding:'2px 6px', borderRadius:'4px', marginBottom:'2px', overflow:'hidden', whiteSpace:'nowrap' as const, textOverflow:'ellipsis', border:`1px solid ${STATUS_COLORS[e.status]||roleColor}33` }}>{e.title}</div>
                    ))}
                    {dayEvents.length > 2 && <div style={{ fontSize:'0.65rem', color:COLORS.muted }}>+{dayEvents.length-2} more</div>}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // WEEK VIEW
  const WeekView = () => {
    const weekDays = getWeekDays(currentDate)
    return (
      <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
          {weekDays.map((d, i) => {
            const isToday = d.toDateString() === today.toDateString()
            return (
              <div key={i} style={{ padding:'0.75rem', textAlign:'center', borderRight:`0.5px solid ${COLORS.border}` }}>
                <div style={{ fontSize:'0.75rem', color:COLORS.muted, fontWeight:600 }}>{SHORT_DAYS[d.getDay()]}</div>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'4px auto 0', fontSize:'0.95rem', fontWeight: isToday?700:500, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white }}>
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', minHeight:'400px' }}>
          {weekDays.map((d, i) => {
            const dayEvents = getEventsForDay(d)
            const isToday = d.toDateString() === today.toDateString()
            return (
              <div key={i} onClick={() => setSelectedDate(d.toDateString())}
                style={{ padding:'8px', borderRight:`0.5px solid ${COLORS.border}`, cursor:'pointer', background: isToday?`${COLORS.mint}05`:COLORS.card, minHeight:'400px' }}>
                {dayEvents.map(e => (
                  <div key={e.id} style={{ fontSize:'0.72rem', background:`${STATUS_COLORS[e.status]||roleColor}22`, color:STATUS_COLORS[e.status]||roleColor, padding:'4px 6px', borderRadius:'4px', marginBottom:'4px', border:`1px solid ${STATUS_COLORS[e.status]||roleColor}33`, cursor:'pointer' }}>
                    <div style={{ fontWeight:600 }}>{e.title}</div>
                    <div style={{ opacity:0.8 }}>{new Date(e.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // DAY VIEW
  const DayView = () => {
    const dayEvents = getEventsForDay(currentDate).sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    const isToday = currentDate.toDateString() === today.toDateString()
    return (
      <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
        <div style={{ padding:'1rem 1.5rem', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}`, display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:`${COLORS.border}`, color: isToday?COLORS.bg:COLORS.white, fontSize:'1.2rem', fontWeight:700 }}>
            {currentDate.getDate()}
          </div>
          <div>
            <div style={{ fontSize:'1.1rem', fontWeight:600, color:COLORS.white }}>{DAYS[currentDate.getDay()]}</div>
            <div style={{ fontSize:'0.85rem', color:COLORS.muted }}>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
          </div>
          <div style={{ marginLeft:'auto', fontSize:'0.85rem', color:COLORS.muted }}>{dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ padding:'1rem' }}>
          {dayEvents.length === 0 ? (
            <div style={{ textAlign:'center', color:COLORS.muted, padding:'3rem' }}>No events today.</div>
          ) : (
            dayEvents.map(event => (
              <div key={event.id} style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem' }}>
                <div style={{ textAlign:'right', minWidth:'60px', paddingTop:'4px' }}>
                  <div style={{ fontSize:'0.75rem', color:COLORS.cyan, fontWeight:600 }}>{new Date(event.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  <div style={{ fontSize:'0.7rem', color:COLORS.muted }}>{new Date(event.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div style={{ width:'3px', background:`${STATUS_COLORS[event.status]||roleColor}`, borderRadius:'2px', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <EventCard event={event} compact />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // AGENDA VIEW
  const AgendaView = () => {
    const filteredEvents = getFilteredEvents(events)
    // Group by date, only dates with events
    const grouped: Record<string, Event[]> = {}
    filteredEvents.forEach(e => {
      const key = new Date(e.start_date).toDateString()
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(e)
    })
    const sortedDates = Object.keys(grouped).sort((a,b) => new Date(a).getTime() - new Date(b).getTime())

    if (sortedDates.length === 0) return (
      <div style={{ background:COLORS.card, padding:'3rem', borderRadius:'16px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>
        No upcoming events.
      </div>
    )

    return (
      <div>
        {sortedDates.map(dateStr => {
          const date = new Date(dateStr)
          const isToday = dateStr === today.toDateString()
          const isPast = date < today && !isToday
          return (
            <div key={dateStr} style={{ marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`: isPast?`${COLORS.border}`:`${COLORS.cyan}22`, color: isToday?COLORS.bg: isPast?COLORS.muted:COLORS.cyan, flexShrink:0 }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:700, lineHeight:1 }}>{date.getDate()}</div>
                  <div style={{ fontSize:'0.65rem', fontWeight:600 }}>{MONTHS[date.getMonth()].slice(0,3).toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.95rem', fontWeight:600, color: isToday?COLORS.cyan: isPast?COLORS.muted:COLORS.white }}>
                    {isToday ? '📅 Today' : `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:COLORS.muted }}>{grouped[dateStr].length} event{grouped[dateStr].length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ marginLeft:'60px' }}>
                {grouped[dateStr].sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(event => (
                  <EventCard key={event.id} event={event} compact />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const getHeaderTitle = () => {
    if (calendarView === 'week') {
      const weekDays = getWeekDays(currentDate)
      return `${MONTHS[weekDays[0].getMonth()]} ${weekDays[0].getDate()} – ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
    }
    if (calendarView === 'day') return `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}`
    if (calendarView === 'agenda') return 'All Events'
    return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const selectedDateEvents = selectedDate ? getEventsForDay(new Date(selectedDate)) : []

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
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ background:`${roleColor}22`, color:roleColor, padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const, border:`1px solid ${roleColor}44` }}>
            {viewMode === 'employee' ? '👤 Employee' : profile?.role === 'super_admin' ? '⭐ Super Admin' : profile?.role}
          </span>
          <span style={{ color:COLORS.muted, fontSize:'0.85rem' }}>{profile?.email}</span>
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => { setViewMode(viewMode === 'admin' ? 'employee' : 'admin'); setSelectedDate(null) }}
              style={{ padding:'6px 14px', border:`1px solid ${COLORS.cyan}44`, borderRadius:'8px', color:COLORS.cyan, background:`${COLORS.cyan}22`, fontSize:'0.85rem', cursor:'pointer', fontWeight:600 }}>
              {viewMode === 'admin' ? '👤 Employee View' : '🛠 Admin View'}
            </button>
          )}
          {isAdminMode && (
            <a href="/users" style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>👥 Users</a>
          )}
          <a href="/approvals" style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>🔔 Approvals</a>
          <button onClick={signOut} style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'0.85rem' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'2rem auto', padding:'0 1rem' }}>
        {viewMode === 'employee' && (
          <div style={{ background:`${COLORS.mint}11`, border:`1px solid ${COLORS.mint}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:COLORS.mint, fontSize:'0.9rem' }}>👤 Employee View — showing only tasks assigned to you</span>
            <button onClick={() => { setViewMode('admin'); setSelectedDate(null) }}
              style={{ padding:'4px 14px', background:`${COLORS.mint}22`, color:COLORS.mint, border:`1px solid ${COLORS.mint}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
              Switch back to Admin
            </button>
          </div>
        )}

        {/* Nav + View switcher */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <button onClick={() => navigateDate(-1)} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>←</button>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:600 }}>{getHeaderTitle()}</h2>
            <div style={{ display:'flex', gap:'4px', background:'#1F2937', padding:'4px', borderRadius:'8px' }}>
              {(['month','week','day','agenda'] as const).map(v => (
                <button key={v} onClick={() => setCalendarView(v)}
                  style={{ padding:'4px 12px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const, background: calendarView===v?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: calendarView===v?COLORS.bg:COLORS.muted }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => navigateDate(1)} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>→</button>
        </div>

        {/* Search + Filter + Add */}
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap' as const }}>
          <input placeholder="🔍 Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex:1, minWidth:'200px', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', outline:'none' }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', outline:'none' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {isAdminMode && (
            <button onClick={() => { setShowAddEvent(!showAddEvent); setEditingEvent(null) }}
              style={{ padding:'8px 20px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.9rem' }}>
              + Add Event
            </button>
          )}
        </div>

        {/* Forms */}
        {showAddEvent && isAdminMode && <EventForm data={newEvent} onChange={setNewEvent} onSave={addEvent} onCancel={() => setShowAddEvent(false)} saveLabel="Save Event" />}
        {editingEvent && isAdminMode && <EventForm data={editingEvent} onChange={setEditingEvent} onSave={saveEdit} onCancel={() => setEditingEvent(null)} saveLabel="Save Changes" />}

        {/* Calendar Views */}
        {calendarView === 'month' && <MonthView />}
        {calendarView === 'week' && <WeekView />}
        {calendarView === 'day' && <DayView />}
        {calendarView === 'agenda' && <AgendaView />}

        {/* Selected day events (month & week view) */}
        {(calendarView === 'month' || calendarView === 'week') && selectedDate && (
          <div style={{ marginTop:'1.5rem' }}>
            <h3 style={{ color:COLORS.muted, fontSize:'0.95rem', marginBottom:'1rem' }}>
              Events on {new Date(selectedDate).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
            </h3>
            {selectedDateEvents.length === 0
              ? <div style={{ background:COLORS.card, padding:'2rem', borderRadius:'12px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>No events on this day.</div>
              : selectedDateEvents.map(event => <EventCard key={event.id} event={event} />)
            }
          </div>
        )}
      </div>
    </div>
  )
}