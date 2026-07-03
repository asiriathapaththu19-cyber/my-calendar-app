'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Profile = { id: string; email: string; role: string; full_name: string }
type Event = { id: string; title: string; description: string; start_date: string; end_date: string }
type Approval = {
  id: string; event_id: string; requested_by: string; request_type: string;
  proposed_title: string; proposed_description: string;
  proposed_start_date: string; proposed_end_date: string;
  status: string; admin_note: string; created_at: string;
  event?: Event; requester?: Profile;
}

const COLORS = {
  bg: '#0B0F19', card: '#111827', border: '#1F2937',
  cyan: '#00D2FF', mint: '#00F5A0', white: '#FFFFFF', muted: '#6B7280',
  danger: '#FF6B6B', warning: '#F59E0B',
}

export default function ApprovalsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [requestType, setRequestType] = useState('edit')
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [newRequest, setNewRequest] = useState({ proposed_title: '', proposed_description: '', proposed_start_date: '', proposed_end_date: '' })

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/'; return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!prof) { window.location.href = '/'; return }
      setProfile(prof)

      if (prof.role === 'admin') {
        const { data: approvalsData } = await supabase.from('approvals').select('*').order('created_at', { ascending: false })
        if (approvalsData) {
          const enriched = await Promise.all(approvalsData.map(async a => {
            const { data: event } = await supabase.from('events').select('*').eq('id', a.event_id).single()
            const { data: requester } = await supabase.from('profiles').select('*').eq('id', a.requested_by).single()
            return { ...a, event, requester }
          }))
          setApprovals(enriched)
        }
      } else {
        const { data: approvalsData } = await supabase.from('approvals').select('*').eq('requested_by', user.id).order('created_at', { ascending: false })
        if (approvalsData) {
          const enriched = await Promise.all(approvalsData.map(async a => {
            const { data: event } = await supabase.from('events').select('*').eq('id', a.event_id).single()
            return { ...a, event }
          }))
          setApprovals(enriched)
        }
        const { data: events } = await supabase.from('events').select('*')
          .or(`assigned_to.eq.${user.id},visible_to.eq.all,visible_to.eq.${prof.role}`)
          .neq('visible_to', 'admin')
        setMyEvents(events || [])
      }
      setLoading(false)
    }
    getData()
  }, [])

  const submitRequest = async () => {
    if (!profile || !selectedEvent) return
    await supabase.from('approvals').insert({
      event_id: selectedEvent.id,
      requested_by: profile.id,
      request_type: requestType,
      proposed_title: newRequest.proposed_title || selectedEvent.title,
      proposed_description: newRequest.proposed_description || selectedEvent.description,
      proposed_start_date: newRequest.proposed_start_date || selectedEvent.start_date,
      proposed_end_date: newRequest.proposed_end_date || selectedEvent.end_date,
      status: 'pending',
    })
    setShowRequestForm(false)
    setSelectedEvent(null)
    setNewRequest({ proposed_title: '', proposed_description: '', proposed_start_date: '', proposed_end_date: '' })
    window.location.reload()
  }

  const handleApproval = async (approval: Approval, action: 'approved' | 'rejected') => {
    if (action === 'approved' && approval.request_type === 'edit') {
      await supabase.from('events').update({
        title: approval.proposed_title,
        description: approval.proposed_description,
        start_date: approval.proposed_start_date,
        end_date: approval.proposed_end_date,
      }).eq('id', approval.event_id)
    }
    if (action === 'approved' && approval.request_type === 'delete') {
      await supabase.from('events').delete().eq('id', approval.event_id)
    }
    await supabase.from('approvals').update({ status: action, admin_note: adminNote[approval.id] || '' }).eq('id', approval.id)
    window.location.reload()
  }

  const statusColor: Record<string, string> = { pending: COLORS.warning, approved: COLORS.mint, rejected: COLORS.danger }
  const inputStyle = { width:'100%', padding:'0.6rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.9rem', boxSizing:'border-box' as const, outline:'none' }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Loading...</div>

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
          {profile?.role === 'admin' && <a href="/users" style={{ padding:'6px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, textDecoration:'none', fontSize:'0.85rem', background:'#1F2937' }}>👥 Users</a>}
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }} style={{ padding:'6px 16px', border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer', background:'#1F2937', color:COLORS.white, fontSize:'0.85rem' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:'900px', margin:'2rem auto', padding:'0 1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <h2 style={{ margin:0 }}>
            {profile?.role === 'admin' ? '🔔 Approval Requests' : '📝 My Requests'}
          </h2>
          {profile?.role !== 'admin' && (
            <button onClick={() => setShowRequestForm(!showRequestForm)}
              style={{ padding:'8px 20px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>
              + New Request
            </button>
          )}
        </div>

        {/* Request form for creators/clients */}
        {showRequestForm && profile?.role !== 'admin' && (
          <div style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', marginBottom:'1.5rem', border:`1px solid ${COLORS.cyan}44` }}>
            <h3 style={{ margin:'0 0 1rem', color:COLORS.cyan }}>New Change Request</h3>
            <div style={{ marginBottom:'0.75rem' }}>
              <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Select Event</label>
              <select onChange={e => setSelectedEvent(myEvents.find(ev => ev.id === e.target.value) || null)} style={inputStyle}>
                <option value="">-- Choose an event --</option>
                {myEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:'0.75rem' }}>
              <label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>Request Type</label>
              <select value={requestType} onChange={e => setRequestType(e.target.value)} style={inputStyle}>
                <option value="edit">Request Edit</option>
                <option value="delete">Request Delete</option>
              </select>
            </div>
            {requestType === 'edit' && (
              <>
                <input placeholder={`New title (current: ${selectedEvent?.title || ''})`} value={newRequest.proposed_title} onChange={e => setNewRequest({...newRequest, proposed_title:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
                <input placeholder="New description" value={newRequest.proposed_description} onChange={e => setNewRequest({...newRequest, proposed_description:e.target.value})} style={{...inputStyle, marginBottom:'0.75rem'}} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>New Start</label><input type="datetime-local" value={newRequest.proposed_start_date} onChange={e => setNewRequest({...newRequest, proposed_start_date:e.target.value})} style={inputStyle} /></div>
                  <div><label style={{ fontSize:'0.8rem', color:COLORS.muted, display:'block', marginBottom:'4px' }}>New End</label><input type="datetime-local" value={newRequest.proposed_end_date} onChange={e => setNewRequest({...newRequest, proposed_end_date:e.target.value})} style={inputStyle} /></div>
                </div>
              </>
            )}
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
              <button onClick={submitRequest} style={{ padding:'8px 24px', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700 }}>Submit Request</button>
              <button onClick={() => setShowRequestForm(false)} style={{ padding:'8px 24px', background:'transparent', color:COLORS.muted, border:`1px solid ${COLORS.border}`, borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Approvals list */}
        {approvals.length === 0 && (
          <div style={{ background:COLORS.card, padding:'3rem', borderRadius:'12px', textAlign:'center', color:COLORS.muted, border:`1px solid ${COLORS.border}` }}>
            No requests yet.
          </div>
        )}

        {approvals.map(approval => (
          <div key={approval.id} style={{ background:COLORS.card, padding:'1.5rem', borderRadius:'12px', marginBottom:'0.75rem', border:`1px solid ${COLORS.border}`, borderLeft:`3px solid ${statusColor[approval.status]}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                  <span style={{ fontSize:'0.8rem', background:`${approval.request_type==='delete'?COLORS.danger:COLORS.cyan}22`, color:approval.request_type==='delete'?COLORS.danger:COLORS.cyan, padding:'2px 10px', borderRadius:'20px', border:`1px solid ${approval.request_type==='delete'?COLORS.danger:COLORS.cyan}44`, fontWeight:600 }}>
                    {approval.request_type === 'delete' ? '🗑️ Delete Request' : '✏️ Edit Request'}
                  </span>
                  <span style={{ fontSize:'0.8rem', background:`${statusColor[approval.status]}22`, color:statusColor[approval.status], padding:'2px 10px', borderRadius:'20px', border:`1px solid ${statusColor[approval.status]}44`, fontWeight:600, textTransform:'capitalize' as const }}>
                    {approval.status}
                  </span>
                </div>
                <h3 style={{ margin:'0.5rem 0 0.25rem', color:COLORS.white }}>Event: {approval.event?.title || 'Deleted event'}</h3>
                {profile?.role === 'admin' && <p style={{ margin:0, fontSize:'0.85rem', color:COLORS.muted }}>Requested by: {approval.requester?.full_name || approval.requester?.email}</p>}
                <p style={{ margin:'0.25rem 0 0', fontSize:'0.8rem', color:COLORS.muted }}>{new Date(approval.created_at).toLocaleString()}</p>
              </div>
            </div>

            {approval.request_type === 'edit' && (
              <div style={{ background:'#0B0F19', padding:'1rem', borderRadius:'8px', marginBottom:'1rem' }}>
                <p style={{ margin:'0 0 0.5rem', fontSize:'0.85rem', color:COLORS.muted }}>Proposed changes:</p>
                {approval.proposed_title !== approval.event?.title && <p style={{ margin:'0 0 0.25rem', fontSize:'0.9rem' }}><span style={{ color:COLORS.muted }}>Title:</span> <span style={{ color:COLORS.cyan }}>{approval.proposed_title}</span></p>}
                {approval.proposed_description !== approval.event?.description && <p style={{ margin:'0 0 0.25rem', fontSize:'0.9rem' }}><span style={{ color:COLORS.muted }}>Description:</span> <span style={{ color:COLORS.cyan }}>{approval.proposed_description}</span></p>}
                {approval.proposed_start_date !== approval.event?.start_date && <p style={{ margin:'0 0 0.25rem', fontSize:'0.9rem' }}><span style={{ color:COLORS.muted }}>Start:</span> <span style={{ color:COLORS.cyan }}>{new Date(approval.proposed_start_date).toLocaleString()}</span></p>}
                {approval.proposed_end_date !== approval.event?.end_date && <p style={{ margin:0, fontSize:'0.9rem' }}><span style={{ color:COLORS.muted }}>End:</span> <span style={{ color:COLORS.cyan }}>{new Date(approval.proposed_end_date).toLocaleString()}</span></p>}
              </div>
            )}

            {approval.status !== 'pending' && approval.admin_note && (
              <p style={{ fontSize:'0.85rem', color:COLORS.muted, fontStyle:'italic' }}>Admin note: {approval.admin_note}</p>
            )}

            {profile?.role === 'admin' && approval.status === 'pending' && (
              <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' as const }}>
                <input placeholder="Add a note (optional)" value={adminNote[approval.id]||''} onChange={e => setAdminNote({...adminNote, [approval.id]:e.target.value})}
                  style={{ flex:1, minWidth:'200px', padding:'0.5rem 0.9rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'8px', color:COLORS.white, fontSize:'0.85rem', outline:'none' }} />
                <button onClick={() => handleApproval(approval, 'approved')}
                  style={{ padding:'6px 20px', background:`${COLORS.mint}22`, color:COLORS.mint, border:`1px solid ${COLORS.mint}44`, borderRadius:'8px', cursor:'pointer', fontWeight:600 }}>✅ Approve</button>
                <button onClick={() => handleApproval(approval, 'rejected')}
                  style={{ padding:'6px 20px', background:`${COLORS.danger}22`, color:COLORS.danger, border:`1px solid ${COLORS.danger}44`, borderRadius:'8px', cursor:'pointer', fontWeight:600 }}>❌ Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}