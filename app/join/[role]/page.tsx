'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function JoinPage() {
  const params = useParams()
  const role = params.role as string
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validRoles = ['employee', 'client']
  if (!validRoles.includes(role)) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>Invalid invite link.</div>
  }

  const roleColor = role === 'employee' ? '#2563EB' : '#059669'
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

  const handleSignUp = async () => {
    if (!email || !password || !fullName) { setMessage('Please fill in all fields.'); return }
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        role,
        full_name: fullName
      })
      setDone(true)
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      <div style={{ background:'white', padding:'2rem', borderRadius:'12px', maxWidth:'400px', width:'100%', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🎉</div>
        <h2 style={{ marginBottom:'0.5rem' }}>Account Created!</h2>
        <p style={{ color:'#666', marginBottom:'1.5rem' }}>Your {roleLabel} account is ready.</p>
        <a href="/" style={{ display:'block', padding:'0.75rem', background:roleColor, color:'white', borderRadius:'8px', textDecoration:'none', fontWeight:500 }}>Go to Login</a>
      </div>
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      <div style={{ background:'white', padding:'2rem', borderRadius:'12px', maxWidth:'400px', width:'100%', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
          <span style={{ background:roleColor, color:'white', padding:'4px 14px', borderRadius:'20px', fontSize:'0.85rem', fontWeight:600 }}>{roleLabel}</span>
          <h1 style={{ margin:0, fontSize:'1.3rem' }}>Create your account</h1>
        </div>
        <p style={{ color:'#666', marginBottom:'1.5rem', fontSize:'0.9rem' }}>You've been invited to join Agency Calendar as a {roleLabel}.</p>
        <input
          placeholder="Full name"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          style={{ width:'100%', padding:'0.75rem', marginBottom:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', boxSizing:'border-box' as const }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width:'100%', padding:'0.75rem', marginBottom:'0.75rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', boxSizing:'border-box' as const }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width:'100%', padding:'0.75rem', marginBottom:'1rem', border:'1px solid #ddd', borderRadius:'8px', fontSize:'1rem', boxSizing:'border-box' as const }}
        />
        {message && <p style={{ color:'red', marginBottom:'1rem', fontSize:'0.9rem' }}>{message}</p>}
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{ width:'100%', padding:'0.75rem', background:roleColor, color:'white', border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer', fontWeight:500 }}
        >
          {loading ? 'Creating account...' : `Join as ${roleLabel}`}
        </button>
      </div>
    </div>
  )
}