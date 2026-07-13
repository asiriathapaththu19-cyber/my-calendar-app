'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { 
  id: string; title: string; description: string; 
  start_date: string; end_date: string; 
  post_date: string | null; deadline_date: string | null;
  visible_to: string; assigned_to: string | null; 
  assigned_to_post: string | null; assigned_to_create: string | null;
  client_id: string | null; status: string; created_by: string; is_client_request: boolean 
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const COLORS = {
  bg: '#0B0F19', card: '#111827', border: '#1F2937',
  cyan: '#00D2FF', mint: '#00F5A0', white: '#FFFFFF', muted: '#6B7280',
  super_admin: '#FF6B6B', admin: '#00D2FF', creator: '#00F5A0', client: '#A78BFA', danger: '#FF6B6B',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B', in_progress: '#00D2FF', completed: '#00F5A0'
}

const addDays = (date: string, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 16)
}

function ClientEventForm({ newEvent, setNewEvent, onSave, onCancel }: any) {
  const inputStyle = { width:'100%', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', boxSizing:'border-box' as const, outline:'none' }
  return (
    <div style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', border:`1px solid ${COLORS.client}44` }}>
      <h3 style={{ margin:'0 0 0.5rem', color:COLORS.client }}>📅 Request New Event</h3>
      <p style={{ margin:'0 0 1rem', fontSize:'0.85rem', color:COLORS.muted }}>Add your event date — our team will handle the rest!</p>
      <input placeholder="Event Title*" value={newEvent.title} onChange={e => setNewEvent((p: any) => ({...p, title:e.target.value}))} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <input placeholder="Description" value={newEvent.description} onChange={e => setNewEvent((p: any) => ({...p, description:e.target.value}))} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>📅 Event Start</label>
          <input type="datetime-local" value={newEvent.start_date} onChange={e => setNewEvent((p: any) => ({...p, start_date:e.target.value}))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>📅 Event End</label>
          <input type="datetime-local" value={newEvent.end_date} onChange={e => setNewEvent((p: any) => ({...p, end_date:e.target.value}))} style={inputStyle} />
        </div>
      </div>
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <button onClick={onSave} style={{ padding:'8px 24px', background:`linear-gradient(135deg, ${COLORS.client}, #7C5CBF)`, color:COLORS.white, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>Submit Request</button>
        <button onClick={onCancel} style={{ padding:'8px 24px', background:'transparent', color:COLORS.muted, border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

function AdminEventForm({ data, setData, profiles, onSave, onCancel, saveLabel, isApproving }: any) {
  const inputStyle = { width:'100%', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', boxSizing:'border-box' as const, outline:'none' }
  const handleEventDateChange = (val: string) => {
    const postDate = addDays(val, -2)
    const deadlineDate = addDays(postDate, -2)
    setData((p: any) => ({ ...p, start_date: val, post_date: postDate, deadline_date: deadlineDate }))
  }
  const creators = profiles.filter((p: any) => ['creator', 'admin', 'super_admin'].includes(p.role))
  return (
    <div style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', border:`1px solid ${isApproving ? COLORS.mint : COLORS.cyan}44` }}>
      {isApproving && <div style={{ fontSize:'0.85rem', color:COLORS.mint, marginBottom:'1rem', fontWeight:600 }}>✅ Approving client request — set dates and assign team</div>}
      <input placeholder="Title*" value={data.title} onChange={e => setData((p: any) => ({...p, title:e.target.value}))} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <input placeholder="Description" value={data.description} onChange={e => setData((p: any) => ({...p, description:e.target.value}))} style={{...inputStyle, marginBottom:'0.75rem'}} />
      <div style={{ background:'#0B0F19', padding:'1rem', borderRadius:'10px', marginBottom:'0.75rem' }}>
        <div style={{ fontSize:'0.8rem', color:COLORS.muted, marginBottom:'0.75rem', fontWeight:600 }}>📅 EVENT DATES</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem', marginBottom:'0.75rem' }}>
          <div>
            <label style={{ fontSize:'0.8rem', color:COLORS.cyan, display:'block', marginBottom:'4px' }}>📅 Event Start*</label>
            <input type="datetime-local" value={data.start_date?.slice(0,16)||''} onChange={e => handleEventDateChange(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', color:COLORS.cyan, display:'block', marginBottom:'4px' }}>📅 Event End</label>
            <input type="datetime-local" value={data.end_date?.slice(0,16)||''} onChange={e => setData((p: any) => ({...p, end_date:e.target.value}))} style={inputStyle} />
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem' }}>
          <div>
            <label style={{ fontSize:'0.8rem', color:'#F59E0B', display:'block', marginBottom:'4px' }}>🎨 Deadline Date (auto)</label>
            <input type="datetime-local" value={data.deadline_date?.slice(0,16)||''} onChange={e => setData((p: any) => ({...p, deadline_date:e.target.value}))} style={{...inputStyle, border:`1px solid #F59E0B44`}} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', color:COLORS.mint, display:'block', marginBottom:'4px' }}>📢 Post Date (auto)</label>
            <input type="datetime-local" value={data.post_date?.slice(0,16)||''} onChange={e => setData((p: any) => ({...p, post_date:e.target.value}))} style={{...inputStyle, border:`1px solid ${COLORS.mint}44`}} />
          </div>
        </div>
      </div>
      <div style={{ background:'#0B0F19', padding:'1rem', borderRadius:'10px', marginBottom:'0.75rem' }}>
        <div style={{ fontSize:'0.8rem', color:COLORS.muted, marginBottom:'0.75rem', fontWeight:600 }}>👥 ASSIGN TEAM</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.75rem' }}>
          <div>
            <label style={{ fontSize:'0.8rem', color:'#F59E0B', display:'block', marginBottom:'4px' }}>🎨 Assign Creator</label>
            <select value={data.assigned_to_create||''} onChange={e => setData((p: any) => ({...p, assigned_to_create:e.target.value}))} style={inputStyle}>
              <option value="">No one</option>
              {creators.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', color:COLORS.mint, display:'block', marginBottom:'4px' }}>📢 Assign Poster</label>
            <select value={data.assigned_to_post||''} onChange={e => setData((p: any) => ({...p, assigned_to_post:e.target.value}))} style={inputStyle}>
              <option value="">No one</option>
              {creators.map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:'0.75rem', marginBottom:'1rem' }}>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Linked Client</label>
          <select value={data.client_id||''} onChange={e => setData((p: any) => ({...p, client_id:e.target.value}))} style={inputStyle}>
            <option value="">No client</option>
            {profiles.filter((p: any) => p.role === 'client').map((p: any) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Visibility</label>
          <select value={data.visible_to} onChange={e => setData((p: any) => ({...p, visible_to:e.target.value}))} style={inputStyle}>
            <option value="all">Everyone</option>
            <option value="creator">Creators Only</option>
            <option value="client">Clients Only</option>
            <option value="admin">Admin Only</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Status</label>
          <select value={data.status||'pending'} onChange={e => setData((p: any) => ({...p, status:e.target.value}))} style={inputStyle}>
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
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [approvingEvent, setApprovingEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'admin' | 'creator'>('admin')
  const [calendarView, setCalendarView] = useState<'month'|'week'|'day'|'agenda'>('month')
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [showPeopleFilter, setShowPeopleFilter] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({ title:'', description:'', start_date:'', end_date:'', post_date:'', deadline_date:'', visible_to:'all', assigned_to:'', assigned_to_post:'', assigned_to_create:'', client_id:'', status:'pending' })
  const filterRef = useRef<HTMLDivElement>(null)

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

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowPeopleFilter(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const refreshEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('start_date')
    setEvents(data || [])
  }

  const addEvent = async () => {
    if (!profile || !newEvent.title) return
    const isClient = profile.role === 'client'
    await supabase.from('events').insert({
      title: newEvent.title, description: newEvent.description,
      start_date: newEvent.start_date, end_date: newEvent.end_date || newEvent.start_date,
      post_date: newEvent.post_date || null, deadline_date: newEvent.deadline_date || null,
      created_by: profile.id,
      assigned_to: newEvent.assigned_to || null,
      assigned_to_post: newEvent.assigned_to_post || null,
      assigned_to_create: newEvent.assigned_to_create || null,
      client_id: isClient ? profile.id : (newEvent.client_id || null),
      is_client_request: isClient,
      visible_to: isClient ? 'all' : newEvent.visible_to,
      status: 'pending'
    })
    await refreshEvents()
    setShowAddEvent(false)
    setNewEvent({ title:'', description:'', start_date:'', end_date:'', post_date:'', deadline_date:'', visible_to:'all', assigned_to:'', assigned_to_post:'', assigned_to_create:'', client_id:'', status:'pending' })
  }

  const saveEdit = async () => {
    if (!editingEvent) return
    await supabase.from('events').update({
      title: editingEvent.title, description: editingEvent.description,
      start_date: editingEvent.start_date, end_date: editingEvent.end_date,
      post_date: editingEvent.post_date, deadline_date: editingEvent.deadline_date,
      visible_to: editingEvent.visible_to,
      assigned_to: editingEvent.assigned_to || null,
      assigned_to_post: editingEvent.assigned_to_post || null,
      assigned_to_create: editingEvent.assigned_to_create || null,
      client_id: editingEvent.client_id || null,
      status: editingEvent.status, is_client_request: false,
    }).eq('id', editingEvent.id)
    await refreshEvents()
    setEditingEvent(null)
  }

  const approveEvent = async () => {
    if (!approvingEvent) return
    await supabase.from('events').update({
      title: approvingEvent.title, description: approvingEvent.description,
      start_date: approvingEvent.start_date, end_date: approvingEvent.end_date,
      post_date: approvingEvent.post_date, deadline_date: approvingEvent.deadline_date,
      visible_to: approvingEvent.visible_to,
      assigned_to: approvingEvent.assigned_to || null,
      assigned_to_post: approvingEvent.assigned_to_post || null,
      assigned_to_create: approvingEvent.assigned_to_create || null,
      client_id: approvingEvent.client_id || null,
      status: approvingEvent.status, is_client_request: false,
    }).eq('id', approvingEvent.id)
    await refreshEvents()
    setApprovingEvent(null)
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

  // Determine filter mode based on selected people
  const getFilterMode = () => {
    if (selectedPeople.length === 0) return 'admin'
    const selectedProfiles = profiles.filter(p => selectedPeople.includes(p.id))
    const hasCreators = selectedProfiles.some(p => p.role === 'creator' || p.role === 'admin' || p.role === 'super_admin')
    const hasClients = selectedProfiles.some(p => p.role === 'client')
    if (hasCreators && !hasClients) return 'creator'
    if (hasClients && !hasCreators) return 'client'
    return 'mixed'
  }

  const getFilteredEvents = (evts: Event[]) => {
    const filterMode = getFilterMode()

    return evts.filter(e => {
      // People filter for admins
      if (isAdminMode && selectedPeople.length > 0) {
        const selectedProfiles = profiles.filter(p => selectedPeople.includes(p.id))
        const creatorIds = selectedProfiles.filter(p => ['creator','admin','super_admin'].includes(p.role)).map(p => p.id)
        const clientIds = selectedProfiles.filter(p => p.role === 'client').map(p => p.id)

        const matchesCreator = creatorIds.length > 0 && (
          creatorIds.includes(e.assigned_to_create || '') ||
          creatorIds.includes(e.assigned_to_post || '')
        )
        const matchesClient = clientIds.length > 0 && (
          clientIds.includes(e.client_id || '') ||
          clientIds.includes(e.created_by)
        )

        if (!matchesCreator && !matchesClient) return false
        return true
      }

      // Normal role-based filtering
      if (isAdminMode) return true
      if (viewMode === 'creator' || profile?.role === 'creator') {
        if (e.visible_to === 'admin') return false
        if (e.visible_to === 'client') return false
        return e.assigned_to_create === profile?.id || e.assigned_to_post === profile?.id
      }
      if (profile?.role === 'client') {
        return (e.assigned_to === profile?.id || e.client_id === profile?.id || e.created_by === profile?.id) && e.visible_to !== 'admin' && e.visible_to !== 'creator'
      }
      return true
    }).filter(e => {
      const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchStatus = filterStatus === 'all' || e.status === filterStatus
      return matchSearch && matchStatus
    })
  }

  const getEventsForDay = (date: Date) => {
    const filtered = getFilteredEvents(events)
    const dateStr = date.toDateString()
    const filterMode = getFilterMode()

    return filtered.filter(e => {
      // Creator filter mode - show on deadline or post date
      if (isAdminMode && selectedPeople.length > 0) {
        const selectedProfiles = profiles.filter(p => selectedPeople.includes(p.id))
        const creatorIds = selectedProfiles.filter(p => ['creator','admin','super_admin'].includes(p.role)).map(p => p.id)
        const clientIds = selectedProfiles.filter(p => p.role === 'client').map(p => p.id)

        let matches = false

        // Creator perspective
        if (creatorIds.length > 0) {
          if (creatorIds.includes(e.assigned_to_create || '') && e.deadline_date && new Date(e.deadline_date).toDateString() === dateStr) matches = true
          if (creatorIds.includes(e.assigned_to_post || '') && e.post_date && new Date(e.post_date).toDateString() === dateStr) matches = true
        }

        // Client perspective
        if (clientIds.length > 0) {
          if (new Date(e.start_date).toDateString() === dateStr) matches = true
          if (e.post_date && new Date(e.post_date).toDateString() === dateStr) matches = true
        }

        return matches
      }

      // Creator mode
      if (viewMode === 'creator' || profile?.role === 'creator') {
        if (e.assigned_to_create === profile?.id && e.deadline_date) return new Date(e.deadline_date).toDateString() === dateStr
        if (e.assigned_to_post === profile?.id && e.post_date) return new Date(e.post_date).toDateString() === dateStr
        return false
      }

      // Client mode
      if (profile?.role === 'client') {
        return new Date(e.start_date).toDateString() === dateStr || (e.post_date && new Date(e.post_date).toDateString() === dateStr)
      }

      // Admin mode - show on all dates
      if (e.deadline_date && new Date(e.deadline_date).toDateString() === dateStr) return true
      if (e.post_date && new Date(e.post_date).toDateString() === dateStr) return true
      return new Date(e.start_date).toDateString() === dateStr
    })
  }

  const getEventDateType = (event: Event, date: Date) => {
    const dateStr = date.toDateString()
    if (event.deadline_date && new Date(event.deadline_date).toDateString() === dateStr) return 'deadline'
    if (event.post_date && new Date(event.post_date).toDateString() === dateStr) return 'post'
    return 'event'
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
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const getProfileName = (id: string | null) => {
    if (!id) return null
    const p = profiles.find(p => p.id === id)
    return p ? `${p.full_name || p.email}` : null
  }

  const isAdminMode = (profile?.role === 'admin' || profile?.role === 'super_admin') && viewMode === 'admin'
  const isClient = profile?.role === 'client'
  const roleColor = viewMode === 'creator' ? COLORS.creator : (COLORS as any)[profile?.role || 'client'] || COLORS.client
  const today = new Date()

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Loading...</div>

  const EventCard = ({ event, date, compact = false }: { event: Event, date?: Date, compact?: boolean }) => {
    const isPending = event.is_client_request
    const dateType = date ? getEventDateType(event, date) : 'event'
    const dateTypeColor = dateType === 'deadline' ? '#F59E0B' : dateType === 'post' ? COLORS.mint : COLORS.cyan
    const dateTypeLabel = dateType === 'deadline' ? '🎨 Create by' : dateType === 'post' ? '📢 Publish on' : '📅 Event'

    // Determine what tags to show based on filter/view mode
    const filterMode = getFilterMode()
    const showCreatorTags = isAdminMode && (selectedPeople.length === 0 || filterMode === 'creator' || filterMode === 'mixed')
    const showClientInfo = isAdminMode

    return (
      <div style={{ background: isPending ? '#1a0a0a' : COLORS.card, padding: compact ? '0.75rem 1rem' : '1.25rem', borderRadius:'12px', marginBottom:'0.5rem', border: isPending ? `1px solid ${COLORS.danger}44` : `1px solid ${COLORS.border}`, borderLeft:`3px solid ${isPending ? COLORS.danger : dateTypeColor}`, opacity: isPending ? 0.9 : 1 }}>
        {isPending && <div style={{ fontSize:'0.72rem', color:COLORS.danger, marginBottom:'0.4rem', fontWeight:600 }}>⏳ Pending Admin Approval</div>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem', flexWrap:'wrap' as const }}>
              <h3 style={{ margin:0, fontSize: compact ? '0.9rem' : '1rem', color: isPending ? '#ffaaaa' : COLORS.white }}>{event.title}</h3>
              {date && <span style={{ fontSize:'0.65rem', background:`${dateTypeColor}22`, color:dateTypeColor, padding:'2px 8px', borderRadius:'20px', border:`1px solid ${dateTypeColor}44`, fontWeight:600 }}>{dateTypeLabel}</span>}
              {!isPending && <span style={{ fontSize:'0.65rem', background:`${STATUS_COLORS[event.status]}22`, color:STATUS_COLORS[event.status], padding:'2px 6px', borderRadius:'20px', border:`1px solid ${STATUS_COLORS[event.status]}44`, fontWeight:600 }}>{event.status.replace('_',' ')}</span>}
            </div>
            {!compact && <p style={{ margin:'0 0 0.5rem', color:COLORS.muted, fontSize:'0.9rem' }}>{event.description}</p>}
            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' as const, marginBottom:'0.25rem' }}>
              <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.cyan }}>📅 {new Date(event.start_date).toLocaleDateString()}</p>
              {event.post_date && <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.mint }}>📢 {new Date(event.post_date).toLocaleDateString()}</p>}
              {event.deadline_date && isAdminMode && selectedPeople.length === 0 && <p style={{ margin:0, fontSize:'0.75rem', color:'#F59E0B' }}>🎨 {new Date(event.deadline_date).toLocaleDateString()}</p>}
            </div>
            {showCreatorTags && (
              <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' as const }}>
                {event.assigned_to_create && <p style={{ margin:0, fontSize:'0.75rem', color:'#F59E0B' }}>🎨 {getProfileName(event.assigned_to_create)}</p>}
                {event.assigned_to_post && <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.mint }}>📢 {getProfileName(event.assigned_to_post)}</p>}
                {showClientInfo && event.client_id && <p style={{ margin:0, fontSize:'0.75rem', color:COLORS.client }}>🏢 {getProfileName(event.client_id)}</p>}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:'0.4rem', marginLeft:'0.5rem', flexWrap:'wrap' as const, justifyContent:'flex-end' }}>
            {isAdminMode && isPending && (
              <button onClick={() => { setApprovingEvent({...event, post_date: event.start_date ? addDays(event.start_date, -2) : null, deadline_date: event.start_date ? addDays(addDays(event.start_date, -2), -2) : null } as any); setShowAddEvent(false); setEditingEvent(null) }}
                style={{ padding:'3px 10px', background:`${COLORS.mint}22`, color:COLORS.mint, border:`1px solid ${COLORS.mint}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>✅ Approve</button>
            )}
            {isAdminMode && !isPending && (
              <>
                <select value={event.status} onChange={e => updateStatus(event.id, e.target.value)} style={{ padding:'3px 8px', background:`${STATUS_COLORS[event.status]}22`, border:`1px solid ${STATUS_COLORS[event.status]}44`, borderRadius:'6px', color:STATUS_COLORS[event.status], fontSize:'0.75rem', cursor:'pointer', outline:'none' }}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={() => { setEditingEvent(event); setShowAddEvent(false); setApprovingEvent(null) }} style={{ padding:'3px 8px', background:`${COLORS.cyan}22`, color:COLORS.cyan, border:`1px solid ${COLORS.cyan}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>✏️</button>
                <button onClick={() => deleteEvent(event.id)} style={{ padding:'3px 8px', background:`${COLORS.danger}22`, color:COLORS.danger, border:`1px solid ${COLORS.danger}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.75rem' }}>🗑️</button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  const MonthView = () => {
    const days = getDaysInMonth(currentDate)
    return (
      <>
        {/* Desktop Month View */}
        <div className="desktop-calendar-view" style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
            {DAYS.map(d => <div key={d} style={{ padding:'0.75rem', textAlign:'center', fontSize:'0.75rem', fontWeight:600, color:COLORS.muted, letterSpacing:'0.05em' }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
              const isToday = cellDate && today.toDateString() === cellDate.toDateString()
              const isSelected = cellDate && selectedDate === cellDate.toDateString()
              const dayEvents = cellDate ? getEventsForDay(cellDate) : []
              const hasPending = dayEvents.some(e => e.is_client_request)
              return (
                <div key={i} onClick={() => cellDate && setSelectedDate(cellDate.toDateString())}
                  style={{ minHeight:'90px', padding:'8px', borderRight:`0.5px solid ${COLORS.border}`, borderBottom:`0.5px solid ${COLORS.border}`, cursor:day?'pointer':'default', background: isSelected?`${COLORS.cyan}11`: isToday?`${COLORS.mint}08`:COLORS.card }}>
                  {day && (
                    <>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'4px' }}>
                        <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight: isToday?700:400, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white }}>{day}</div>
                        {hasPending && <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:COLORS.danger }} />}
                      </div>
                      {dayEvents.slice(0,2).map((e, idx) => {
                        const dateType = getEventDateType(e, cellDate!)
                        const color = e.is_client_request ? COLORS.danger : dateType === 'deadline' ? '#F59E0B' : dateType === 'post' ? COLORS.mint : COLORS.cyan
                        return (
                          <div key={`${e.id}-${idx}`} style={{ fontSize:'0.7rem', background:`${color}22`, color, padding:'2px 6px', borderRadius:'4px', marginBottom:'2px', overflow:'hidden', whiteSpace:'nowrap' as const, textOverflow:'ellipsis', border:`1px solid ${color}33` }}>
                            {dateType === 'deadline' ? '🎨' : dateType === 'post' ? '📢' : '📅'} {e.title}
                          </div>
                        )
                      })}
                      {dayEvents.length > 2 && <div style={{ fontSize:'0.65rem', color:COLORS.muted }}>+{dayEvents.length-2} more</div>}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile Month View */}
        <div className="mobile-calendar-view" style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
            {DAYS.map(d => <div key={d} style={{ padding:'0.5rem 0', textAlign:'center', fontSize:'0.7rem', fontWeight:600, color:COLORS.muted }}>{d.slice(0,2)}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {days.map((day, i) => {
              const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null
              const isToday = cellDate && today.toDateString() === cellDate.toDateString()
              const isSelected = cellDate && selectedDate === cellDate.toDateString()
              const dayEvents = cellDate ? getEventsForDay(cellDate) : []
              return (
                <div key={i} onClick={() => cellDate && setSelectedDate(cellDate.toDateString())}
                  style={{ minHeight:'48px', padding:'4px 2px', borderRight:`0.5px solid ${COLORS.border}`, borderBottom:`0.5px solid ${COLORS.border}`, cursor:day?'pointer':'default', background: isSelected?`${COLORS.cyan}11`: isToday?`${COLORS.mint}08`:COLORS.card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box' }}>
                  {day && (
                    <>
                      <div style={{ width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight: isToday?700:400, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white }}>
                        {day}
                      </div>
                      <div style={{ display:'flex', gap:'2px', justifyContent:'center', height:'6px', marginBottom:'2px', flexWrap:'wrap' }}>
                        {dayEvents.slice(0,3).map((e, idx) => {
                          const dateType = getEventDateType(e, cellDate!)
                          const color = e.is_client_request ? COLORS.danger : dateType === 'deadline' ? '#F59E0B' : dateType === 'post' ? COLORS.mint : COLORS.cyan
                          return (
                            <span key={`${e.id}-${idx}-dot`} style={{ width:'4px', height:'4px', borderRadius:'50%', background:color }} />
                          )
                        })}
                        {dayEvents.length > 3 && (
                          <span style={{ width:'3px', height:'3px', borderRadius:'50%', background:COLORS.muted }} />
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  const WeekView = () => {
    const weekDays = getWeekDays(currentDate)
    return (
      <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
        <div className="mobile-scroll-container" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
          {weekDays.map((d, i) => {
            const dayEvents = getEventsForDay(d)
            const isToday = d.toDateString() === today.toDateString()
            const isSelected = d.toDateString() === selectedDate
            return (
              <div key={i} className="mobile-scroll-item" style={{ borderRight: i < 6 ? `0.5px solid ${COLORS.border}` : 'none', display:'flex', flexDirection:'column', boxSizing:'border-box' }}>
                {/* Day Header */}
                <div style={{ padding:'0.75rem', textAlign:'center', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize:'0.75rem', color:COLORS.muted, fontWeight:600 }}>{DAYS[d.getDay()]}</div>
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'4px auto 0', fontSize:'0.95rem', fontWeight: isToday?700:500, background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: isToday?COLORS.bg:COLORS.white }}>{d.getDate()}</div>
                </div>
                {/* Day Events Column */}
                <div onClick={() => setSelectedDate(d.toDateString())} style={{ padding:'8px', cursor:'pointer', background: isSelected ? `${COLORS.cyan}11` : isToday ? `${COLORS.mint}05` : COLORS.card, minHeight:'360px', flex:1, display:'flex', flexDirection:'column' }}>
                  {dayEvents.map((e, idx) => {
                    const dateType = getEventDateType(e, d)
                    const color = e.is_client_request ? COLORS.danger : dateType === 'deadline' ? '#F59E0B' : dateType === 'post' ? COLORS.mint : COLORS.cyan
                    return (
                      <div key={`${e.id}-${idx}`} style={{ fontSize:'0.72rem', background:`${color}22`, color, padding:'4px 6px', borderRadius:'4px', marginBottom:'4px', border:`1px solid ${color}33` }}>
                        <div style={{ fontWeight:600 }}>{dateType === 'deadline' ? '🎨' : dateType === 'post' ? '📢' : '📅'} {e.title}</div>
                        <div style={{ opacity:0.8 }}>{new Date(e.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      </div>
                    )
                  })}
                  {dayEvents.length === 0 && (
                    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60px' }}>
                      <span className="show-on-mobile" style={{ fontSize:'0.7rem', color:COLORS.muted, fontStyle:'italic' }}>No events</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const DayView = () => {
    const dayEvents = getEventsForDay(currentDate).sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    const isToday = currentDate.toDateString() === today.toDateString()
    return (
      <div style={{ background:COLORS.card, borderRadius:'16px', overflow:'hidden', border:`1px solid ${COLORS.border}` }}>
        <div style={{ padding:'1rem 1.5rem', background:'#0D1117', borderBottom:`1px solid ${COLORS.border}`, display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:`${COLORS.border}`, color: isToday?COLORS.bg:COLORS.white, fontSize:'1.2rem', fontWeight:700 }}>{currentDate.getDate()}</div>
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
            dayEvents.map((event, idx) => {
              const dateType = getEventDateType(event, currentDate)
              const color = event.is_client_request ? COLORS.danger : dateType === 'deadline' ? '#F59E0B' : dateType === 'post' ? COLORS.mint : COLORS.cyan
              return (
                <div key={`${event.id}-${idx}`} style={{ display:'flex', gap:'1rem', marginBottom:'0.75rem' }}>
                  <div style={{ textAlign:'right', minWidth:'60px', paddingTop:'4px' }}>
                    <div style={{ fontSize:'0.75rem', color, fontWeight:600 }}>{new Date(event.start_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    <div style={{ fontSize:'0.7rem', color:COLORS.muted }}>{new Date(event.end_date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div style={{ width:'3px', background:color, borderRadius:'2px', flexShrink:0 }} />
                  <div style={{ flex:1 }}><EventCard event={event} date={currentDate} compact /></div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  const AgendaView = () => {
    const filteredEvents = getFilteredEvents(events)
    const grouped: Record<string, {event: Event, dateType: string}[]> = {}

    filteredEvents.forEach(e => {
      const addToGroup = (dateStr: string, dateType: string) => {
        if (!grouped[dateStr]) grouped[dateStr] = []
        if (!grouped[dateStr].find(item => item.event.id === e.id && item.dateType === dateType)) {
          grouped[dateStr].push({ event: e, dateType })
        }
      }

      if (isAdminMode && selectedPeople.length > 0) {
        const selectedProfiles = profiles.filter(p => selectedPeople.includes(p.id))
        const creatorIds = selectedProfiles.filter(p => ['creator','admin','super_admin'].includes(p.role)).map(p => p.id)
        const clientIds = selectedProfiles.filter(p => p.role === 'client').map(p => p.id)

        if (creatorIds.includes(e.assigned_to_create || '') && e.deadline_date) addToGroup(new Date(e.deadline_date).toDateString(), 'deadline')
        if (creatorIds.includes(e.assigned_to_post || '') && e.post_date) addToGroup(new Date(e.post_date).toDateString(), 'post')
        if (clientIds.includes(e.client_id || '') || clientIds.includes(e.created_by)) {
          addToGroup(new Date(e.start_date).toDateString(), 'event')
          if (e.post_date) addToGroup(new Date(e.post_date).toDateString(), 'post')
        }
      } else if (viewMode === 'creator' || profile?.role === 'creator') {
        if (e.assigned_to_create === profile?.id && e.deadline_date) addToGroup(new Date(e.deadline_date).toDateString(), 'deadline')
        if (e.assigned_to_post === profile?.id && e.post_date) addToGroup(new Date(e.post_date).toDateString(), 'post')
      } else if (profile?.role === 'client') {
        addToGroup(new Date(e.start_date).toDateString(), 'event')
        if (e.post_date) addToGroup(new Date(e.post_date).toDateString(), 'post')
      } else {
        if (e.deadline_date) addToGroup(new Date(e.deadline_date).toDateString(), 'deadline')
        if (e.post_date) addToGroup(new Date(e.post_date).toDateString(), 'post')
        addToGroup(new Date(e.start_date).toDateString(), 'event')
      }
    })

    const sortedDates = Object.keys(grouped).sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
    if (sortedDates.length === 0) return <div style={{ background:COLORS.card, padding:'3rem', borderRadius:'16px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>No events yet.</div>

    return (
      <div>
        {sortedDates.map(dateStr => {
          const date = new Date(dateStr)
          const isToday = dateStr === today.toDateString()
          const isPast = date < today && !isToday
          const hasPending = grouped[dateStr].some(({event}) => event.is_client_request)
          return (
            <div key={dateStr} style={{ marginBottom:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.75rem' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', background: isToday?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`: isPast?`${COLORS.border}`:`${COLORS.cyan}22`, color: isToday?COLORS.bg: isPast?COLORS.muted:COLORS.cyan, flexShrink:0 }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:700, lineHeight:1 }}>{date.getDate()}</div>
                  <div style={{ fontSize:'0.65rem', fontWeight:600 }}>{MONTHS[date.getMonth()].slice(0,3).toUpperCase()}</div>
                </div>
                <div>
                  <div style={{ fontSize:'0.95rem', fontWeight:600, color: isToday?COLORS.cyan: isPast?COLORS.muted:COLORS.white, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    {isToday ? '📅 Today' : `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`}
                    {hasPending && <span style={{ fontSize:'0.7rem', color:COLORS.danger, background:`${COLORS.danger}22`, padding:'2px 8px', borderRadius:'10px' }}>⏳ Pending</span>}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:COLORS.muted }}>{grouped[dateStr].length} item{grouped[dateStr].length !== 1 ? 's' : ''}</div>
                </div>
              </div>
              <div style={{ marginLeft:'clamp(12px, 8vw, 60px)' }}>
                {grouped[dateStr].map(({event, dateType}, idx) => (
                  <EventCard key={`${event.id}-${dateType}-${idx}`} event={event} date={date} compact />
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
  const pendingClientRequests = events.filter(e => e.is_client_request)

  // People filter dropdown
  const PeopleFilterDropdown = () => (
    <div ref={filterRef} style={{ position:'relative' as const }}>
      <button onClick={() => setShowPeopleFilter(!showPeopleFilter)}
        style={{ padding:'0.6rem 1rem', background: selectedPeople.length > 0 ? `${COLORS.cyan}22` : '#1F2937', border:`1px solid ${selectedPeople.length > 0 ? COLORS.cyan : COLORS.border}`, borderRadius:'8px', color: selectedPeople.length > 0 ? COLORS.cyan : COLORS.white, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.5rem', whiteSpace:'nowrap' as const }}>
        👁 View As {selectedPeople.length > 0 ? `(${selectedPeople.length})` : ''} ▾
      </button>

      {showPeopleFilter && (
        <div style={{ position:'absolute' as const, top:'110%', left:0, background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:'12px', padding:'0.75rem', minWidth:'260px', zIndex:100, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          
          {/* All option */}
          <div onClick={() => setSelectedPeople([])}
            style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:'8px', cursor:'pointer', background: selectedPeople.length === 0 ? `${COLORS.cyan}22` : 'transparent', marginBottom:'0.5rem' }}>
            <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:`2px solid ${selectedPeople.length === 0 ? COLORS.cyan : COLORS.border}`, background: selectedPeople.length === 0 ? COLORS.cyan : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {selectedPeople.length === 0 && <span style={{ color:COLORS.bg, fontSize:'0.7rem', fontWeight:700 }}>✓</span>}
            </div>
            <span style={{ fontSize:'0.9rem', color: selectedPeople.length === 0 ? COLORS.cyan : COLORS.white, fontWeight:500 }}>All (Admin View)</span>
          </div>

          {/* Creators section */}
          {profiles.filter(p => p.role === 'creator').length > 0 && (
            <>
              <div style={{ fontSize:'0.7rem', color:COLORS.creator, padding:'0 0.75rem', fontWeight:700, marginBottom:'0.25rem', marginTop:'0.25rem' }}>🎨 CREATORS</div>
              {profiles.filter(p => p.role === 'creator').map(p => {
                const selected = selectedPeople.includes(p.id)
                return (
                  <div key={p.id} onClick={() => setSelectedPeople(prev => selected ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:'8px', cursor:'pointer', background: selected ? `${COLORS.creator}22` : 'transparent', marginBottom:'0.2rem' }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:`2px solid ${selected ? COLORS.creator : COLORS.border}`, background: selected ? COLORS.creator : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {selected && <span style={{ color:COLORS.bg, fontSize:'0.7rem', fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'0.9rem', color: selected ? COLORS.creator : COLORS.white }}>{p.full_name || p.email}</span>
                  </div>
                )
              })}
            </>
          )}

          {/* Clients section */}
          {profiles.filter(p => p.role === 'client').length > 0 && (
            <>
              <div style={{ fontSize:'0.7rem', color:COLORS.client, padding:'0 0.75rem', fontWeight:700, marginBottom:'0.25rem', marginTop:'0.5rem' }}>🏢 CLIENTS</div>
              {profiles.filter(p => p.role === 'client').map(p => {
                const selected = selectedPeople.includes(p.id)
                return (
                  <div key={p.id} onClick={() => setSelectedPeople(prev => selected ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.5rem 0.75rem', borderRadius:'8px', cursor:'pointer', background: selected ? `${COLORS.client}22` : 'transparent', marginBottom:'0.2rem' }}>
                    <div style={{ width:'16px', height:'16px', borderRadius:'4px', border:`2px solid ${selected ? COLORS.client : COLORS.border}`, background: selected ? COLORS.client : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {selected && <span style={{ color:COLORS.bg, fontSize:'0.7rem', fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'0.9rem', color: selected ? COLORS.client : COLORS.white }}>{p.full_name || p.email}</span>
                  </div>
                )
              })}
            </>
          )}

          {selectedPeople.length > 0 && (
            <div style={{ borderTop:`1px solid ${COLORS.border}`, marginTop:'0.5rem', paddingTop:'0.5rem' }}>
              <button onClick={() => setSelectedPeople([])}
                style={{ width:'100%', padding:'6px', background:`${COLORS.danger}22`, color:COLORS.danger, border:`1px solid ${COLORS.danger}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.8rem' }}>
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:COLORS.bg, fontFamily:'sans-serif', color:COLORS.white, paddingBottom:'2rem' }}>
      <div style={{ position:'fixed', top:0, left:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.cyan}11, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:0, right:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.mint}11, transparent 70%)`, pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ background:'#0D1117', borderBottom:`1px solid ${COLORS.border}`, padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ fontSize:'1.4rem' }}>📅</span>
          <h1 style={{ margin:0, fontSize:'1.1rem', fontWeight:700, background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Aprawebix Digital</h1>
        </div>
        
        {/* Desktop Header */}
        <div className="hide-on-mobile" style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ background:`${roleColor}22`, color:roleColor, padding:'4px 12px', borderRadius:'20px', fontSize:'0.85rem', fontWeight:600, textTransform:'capitalize' as const, border:`1px solid ${roleColor}44` }}>
            {viewMode === 'creator' ? '🎨 Creator View' : profile?.role === 'super_admin' ? '⭐ Super Admin' : profile?.role}
          </span>
          <span style={{ color:COLORS.muted, fontSize:'0.85rem' }}>{profile?.email}</span>
          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => { setViewMode(viewMode === 'admin' ? 'creator' : 'admin'); setSelectedDate(null); setSelectedPeople([]) }}
              style={{ padding:'6px 14px', border:`1px solid ${COLORS.cyan}44`, borderRadius:'8px', color:COLORS.cyan, background:`${COLORS.cyan}22`, fontSize:'0.85rem', cursor:'pointer', fontWeight:600 }}>
              {viewMode === 'admin' ? '🎨 Creator View' : '🛠 Admin View'}
            </button>
          )}
          {isAdminMode && (
            <a href="/users" style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>👥 Users</a>
          )}
          <a href="/approvals" style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937', position:'relative' as const }}>
            🔔 Approvals
            {isAdminMode && pendingClientRequests.length > 0 && (
              <span style={{ position:'absolute' as const, top:'-6px', right:'-6px', background:COLORS.danger, color:COLORS.white, borderRadius:'50%', width:'16px', height:'16px', fontSize:'0.65rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{pendingClientRequests.length}</span>
            )}
          </a>
          <button onClick={signOut} style={{ padding:'6px 14px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'0.85rem' }}>Sign Out</button>
        </div>

        {/* Mobile Hamburger menu trigger */}
        <div className="show-on-mobile">
          <button onClick={() => setIsDrawerOpen(true)} style={{ background:'transparent', border:'none', color:COLORS.white, fontSize:'1.5rem', cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center' }}>
            ☰
            {isAdminMode && pendingClientRequests.length > 0 && (
              <span style={{ display:'inline-block', marginLeft:'4px', background:COLORS.danger, width:'8px', height:'8px', borderRadius:'50%' }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer Backdrop */}
      {isDrawerOpen && <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)} />}

      {/* Mobile Navigation Drawer Panel */}
      <div className={`mobile-nav-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', borderBottom:`1px solid ${COLORS.border}`, paddingBottom:'1rem' }}>
          <div>
            <div style={{ fontSize:'0.85rem', color:COLORS.muted }}>Signed in as</div>
            <div style={{ fontSize:'0.9rem', fontWeight:600, color:COLORS.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>{profile?.email}</div>
          </div>
          <button onClick={() => setIsDrawerOpen(false)} style={{ background:'transparent', border:'none', color:COLORS.muted, fontSize:'1.5rem', cursor:'pointer' }}>×</button>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem', flex:1 }}>
          <div style={{ marginBottom:'0.5rem' }}>
            <span style={{ background:`${roleColor}22`, color:roleColor, padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const, border:`1px solid ${roleColor}44`, display:'inline-block' }}>
              {viewMode === 'creator' ? '🎨 Creator View' : profile?.role === 'super_admin' ? '⭐ Super Admin' : profile?.role}
            </span>
          </div>

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <button onClick={() => { setViewMode(viewMode === 'admin' ? 'creator' : 'admin'); setSelectedDate(null); setSelectedPeople([]); setIsDrawerOpen(false) }}
              style={{ width:'100%', padding:'10px', border:`1px solid ${COLORS.cyan}44`, borderRadius:'8px', color:COLORS.cyan, background:`${COLORS.cyan}22`, fontSize:'0.9rem', cursor:'pointer', fontWeight:600, textAlign:'center' }}>
              {viewMode === 'admin' ? '🎨 Switch to Creator View' : '🛠 Switch to Admin View'}
            </button>
          )}

          {isAdminMode && (
            <a href="/users" style={{ width:'100%', padding:'10px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.9rem', background:'#1F2937', textAlign:'center', boxSizing:'border-box' }}>
              👥 Manage Users
            </a>
          )}

          <a href="/approvals" style={{ width:'100%', padding:'10px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.9rem', background:'#1F2937', textAlign:'center', position:'relative' as const, boxSizing:'border-box' }}>
            🔔 Approval Requests
            {isAdminMode && pendingClientRequests.length > 0 && (
              <span style={{ position:'absolute', top:'-6px', right:'-6px', background:COLORS.danger, color:COLORS.white, borderRadius:'50%', width:'18px', height:'18px', fontSize:'0.7rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{pendingClientRequests.length}</span>
            )}
          </a>

          <div style={{ marginTop:'auto', borderTop:`1px solid ${COLORS.border}`, paddingTop:'1rem' }}>
            <button onClick={signOut} style={{ width:'100%', padding:'10px', border:`1px solid ${COLORS.danger}44`, borderRadius:'8px', cursor:'pointer', background:`${COLORS.danger}11`, color:COLORS.danger, fontSize:'0.9rem', fontWeight:600 }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'2rem auto', padding:'0 1rem' }}>
        {viewMode === 'creator' && (
          <div style={{ background:`${COLORS.creator}11`, border:`1px solid ${COLORS.creator}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:COLORS.creator, fontSize:'0.9rem' }}>🎨 Creator View — showing your assigned tasks on their due dates</span>
            <button onClick={() => { setViewMode('admin'); setSelectedDate(null) }} style={{ padding:'4px 14px', background:`${COLORS.creator}22`, color:COLORS.creator, border:`1px solid ${COLORS.creator}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>Switch back to Admin</button>
          </div>
        )}

        {isAdminMode && selectedPeople.length > 0 && (
          <div style={{ background:`${COLORS.cyan}11`, border:`1px solid ${COLORS.cyan}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:COLORS.cyan, fontSize:'0.9rem' }}>
              👁 Viewing as: {profiles.filter(p => selectedPeople.includes(p.id)).map(p => p.full_name || p.email).join(', ')}
            </span>
            <button onClick={() => setSelectedPeople([])} style={{ padding:'4px 14px', background:`${COLORS.cyan}22`, color:COLORS.cyan, border:`1px solid ${COLORS.cyan}44`, borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>Clear Filter</button>
          </div>
        )}

        {isClient && (
          <div style={{ background:`${COLORS.client}11`, border:`1px solid ${COLORS.client}44`, borderRadius:'10px', padding:'0.75rem 1rem', marginBottom:'1rem' }}>
            <span style={{ color:COLORS.client, fontSize:'0.9rem' }}>🏢 Your calendar — request new events and track your scheduled posts</span>
          </div>
        )}

        {/* Nav + View switcher */}
        <div className="mobile-stack-col" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', gap:'1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', justifyContent:'space-between', width:'100%', maxWidth:'400px' }}>
            <button onClick={() => navigateDate(-1)} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>←</button>
            <h2 style={{ margin:0, fontSize:'1.1rem', fontWeight:600, textAlign:'center' }}>{getHeaderTitle()}</h2>
            <button onClick={() => navigateDate(1)} style={{ padding:'8px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'1rem' }}>→</button>
          </div>
          <div className="mobile-full-width" style={{ display:'flex', gap:'4px', background:'#1F2937', padding:'4px', borderRadius:'8px', boxSizing:'border-box', justifyContent:'space-evenly' }}>
            {(['month','week','day','agenda'] as const).map(v => (
              <button key={v} onClick={() => setCalendarView(v)}
                style={{ flex:1, padding:'6px 8px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize' as const, background: calendarView===v?`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`:'transparent', color: calendarView===v?COLORS.bg:COLORS.muted }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filter + Add */}
        <div className="mobile-stack-col" style={{ display:'flex', gap:'0.75rem', alignItems:'center', marginBottom:'1rem' }}>
          <input className="mobile-full-width" placeholder="🔍 Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ flex:1, minWidth:'200px', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
          <select className="mobile-full-width" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {isAdminMode && <div className="mobile-full-width" style={{ width:'auto' }}><PeopleFilterDropdown /></div>}
          {(isAdminMode || isClient) && (
            <button className="mobile-full-width" onClick={() => { setShowAddEvent(!showAddEvent); setEditingEvent(null); setApprovingEvent(null) }}
              style={{ padding:'8px 20px', background: isClient?`linear-gradient(135deg, ${COLORS.client}, #7C5CBF)`:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color: isClient?COLORS.white:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.9rem', boxSizing:'border-box' }}>
              {isClient ? '+ Request Event' : '+ Add Event'}
            </button>
          )}
        </div>

        {/* Forms Overlay Modals (Slide-up bottom sheets on mobile) */}
        {showAddEvent && isClient && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowAddEvent(false)}>
            <div className="modal-content-container">
              <ClientEventForm newEvent={newEvent} setNewEvent={setNewEvent} onSave={addEvent} onCancel={() => setShowAddEvent(false)} />
            </div>
          </div>
        )}
        {showAddEvent && isAdminMode && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowAddEvent(false)}>
            <div className="modal-content-container">
              <AdminEventForm data={newEvent} setData={setNewEvent} profiles={profiles} onSave={addEvent} onCancel={() => setShowAddEvent(false)} saveLabel="Save Event" />
            </div>
          </div>
        )}
        {editingEvent && isAdminMode && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setEditingEvent(null)}>
            <div className="modal-content-container">
              <AdminEventForm data={editingEvent} setData={setEditingEvent} profiles={profiles} onSave={saveEdit} onCancel={() => setEditingEvent(null)} saveLabel="Save Changes" />
            </div>
          </div>
        )}
        {approvingEvent && isAdminMode && (
          <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setApprovingEvent(null)}>
            <div className="modal-content-container">
              <AdminEventForm data={approvingEvent} setData={setApprovingEvent} profiles={profiles} onSave={approveEvent} onCancel={() => setApprovingEvent(null)} saveLabel="✅ Approve & Save" isApproving />
            </div>
          </div>
        )}

        {calendarView === 'month' && <MonthView />}
        {calendarView === 'week' && <WeekView />}
        {calendarView === 'day' && <DayView />}
        {calendarView === 'agenda' && <AgendaView />}

        {(calendarView === 'month' || calendarView === 'week') && selectedDate && (
          <div style={{ marginTop:'1.5rem' }}>
            <h3 style={{ color:COLORS.muted, fontSize:'0.95rem', marginBottom:'1rem' }}>
              Events on {new Date(selectedDate).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
            </h3>
            {selectedDateEvents.length === 0
              ? <div style={{ background:COLORS.card, padding:'2rem', borderRadius:'12px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>No events on this day.</div>
              : selectedDateEvents.map((event, idx) => <EventCard key={`${event.id}-${idx}`} event={event} date={new Date(selectedDate)} />)
            }
          </div>
        )}
      </div>
    </div>
  )
}