'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const COLORS = {
  bg: '#0B0F19', card: '#111827', border: '#1F2937',
  cyan: '#00D2FF', mint: '#00F5A0', white: '#FFFFFF', muted: '#6B7280',
  creator: '#00F5A0', client: '#A78BFA',
}

export default function JoinPage() {
  const params = useParams()
  const role = params.role as string
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validRoles = ['creator', 'client']
  if (!validRoles.includes(role)) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, color:COLORS.white }}>Invalid invite link.</div>
  )

  const roleColor = role === 'creator' ? COLORS.creator : COLORS.client
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  const handleSignUp = async () => {
    if (!email || !password || !fullName) { setMessage('Please fill in all fields.'); return }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, email, role, full_name: fullName })
      setDone(true)
    }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'0.75rem 1rem', background:'#1F2937', border:`1px solid ${COLORS.border}`, borderRadius:'10px', fontSize:'0.95rem', color:COLORS.white, boxSizing:'border-box' as const, outline:'none', marginBottom:'0.75rem' }

  if (done) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, fontFamily:'sans-serif' }}>
      <div style={{ position:'fixed', top:0, left:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${roleColor}22, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ background:COLORS.card, padding:'2.5rem', borderRadius:'16px', maxWidth:'400px', width:'100%', textAlign:'center', border:`1px solid ${COLORS.border}`, boxShadow:`0 0 40px ${roleColor}22` }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎉</div>
        <h2 style={{ marginBottom:'0.5rem', color:COLORS.white }}>Account Created!</h2>
        <p style={{ color:COLORS.muted, marginBottom:'1.5rem' }}>Your {roleLabel} account is ready.</p>
        <a href="/" style={{ display:'block', padding:'0.75rem', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, borderRadius:'10px', textDecoration:'none', fontWeight:700 }}>Go to Login</a>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:COLORS.bg, fontFamily:'sans-serif' }}>
      <div style={{ position:'fixed', top:0, right:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${COLORS.cyan}11, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:0, left:0, width:'400px', height:'400px', background:`radial-gradient(circle, ${roleColor}11, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ background:COLORS.card, padding:'2.5rem', borderRadius:'16px', maxWidth:'420px', width:'100%', border:`1px solid ${COLORS.border}`, boxShadow:`0 0 40px ${roleColor}11` }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.5rem' }}>
          <span style={{ background:`${roleColor}22`, color:roleColor, padding:'4px 14px', borderRadius:'20px', fontSize:'0.85rem', fontWeight:600, border:`1px solid ${roleColor}44` }}>{roleLabel}</span>
          <h1 style={{ margin:0, fontSize:'1.3rem', color:COLORS.white }}>Create your account</h1>
        </div>
        <p style={{ color:COLORS.muted, marginBottom:'1.5rem', fontSize:'0.9rem' }}>You've been invited to join Agency Calendar as a {roleLabel}.</p>

        <input placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{...inputStyle, marginBottom:'1rem'}} />

        {message && <p style={{ color:'#FF6B6B', marginBottom:'1rem', fontSize:'0.9rem' }}>{message}</p>}

        <button onClick={handleSignUp} disabled={loading}
          style={{ width:'100%', padding:'0.75rem', background:`linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.mint})`, color:COLORS.bg, border:'none', borderRadius:'10px', fontSize:'1rem', fontWeight:700, cursor:'pointer' }}>
          {loading ? 'Creating account...' : `Join as ${roleLabel}`}
        </button>
      </div>
    </div>
  )
}