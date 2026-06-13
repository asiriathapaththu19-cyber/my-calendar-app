'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else window.location.href = '/dashboard'
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Account created! You can now log in.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B0F19', fontFamily:'sans-serif' }}>
      {/* Glow effects */}
      <div style={{ position:'fixed', top:'-20%', left:'-10%', width:'500px', height:'500px', background:'radial-gradient(circle, #00D2FF22, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'fixed', bottom:'-20%', right:'-10%', width:'500px', height:'500px', background:'radial-gradient(circle, #00F5A022, transparent 70%)', pointerEvents:'none' }} />

      <div style={{ background:'#111827', border:'1px solid #1F2937', padding:'2.5rem', borderRadius:'16px', width:'100%', maxWidth:'420px', boxShadow:'0 0 40px rgba(0,210,255,0.08)' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📅</div>
          <h1 style={{ margin:'0 0 0.25rem', fontSize:'1.5rem', color:'#FFFFFF', fontWeight:700 }}>Agency Calendar</h1>
          <p style={{ margin:0, color:'#6B7280', fontSize:'0.9rem' }}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width:'100%', padding:'0.75rem 1rem', marginBottom:'0.75rem', background:'#1F2937', border:'1px solid #374151', borderRadius:'10px', fontSize:'0.95rem', color:'#FFFFFF', boxSizing:'border-box' as const, outline:'none' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAuth()}
          style={{ width:'100%', padding:'0.75rem 1rem', marginBottom:'1rem', background:'#1F2937', border:'1px solid #374151', borderRadius:'10px', fontSize:'0.95rem', color:'#FFFFFF', boxSizing:'border-box' as const, outline:'none' }}
        />
        {message && <p style={{ color: message.includes('created') ? '#00F5A0' : '#FF6B6B', marginBottom:'1rem', fontSize:'0.9rem' }}>{message}</p>}
        <button
          onClick={handleAuth}
          disabled={loading}
          style={{ width:'100%', padding:'0.75rem', background:'linear-gradient(135deg, #00D2FF, #00F5A0)', color:'#0B0F19', border:'none', borderRadius:'10px', fontSize:'1rem', fontWeight:700, cursor:'pointer' }}
        >
          {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
        <p style={{ textAlign:'center', marginTop:'1rem', color:'#6B7280', fontSize:'0.9rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color:'#00D2FF', cursor:'pointer', fontWeight:500 }}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </p>
      </div>
    </div>
  )
}