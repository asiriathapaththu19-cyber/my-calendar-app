'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase embeds the tokens in the URL hash after the user clicks the email link.
  // We listen for the PASSWORD_RECOVERY event to know the session is active.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    setMessage('')
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in both fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setIsSuccess(true)
      setMessage('Password updated successfully! Redirecting to login…')
      setTimeout(() => {
        window.location.href = '/'
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B0F19',
        fontFamily: 'sans-serif',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #00D2FF22, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, #00F5A022, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: '#111827',
          border: '1px solid #1F2937',
          padding: '2rem 1.5rem',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          boxSizing: 'border-box',
          boxShadow: '0 0 40px rgba(0,210,255,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
          <h1
            style={{
              margin: '0 0 0.25rem',
              fontSize: '1.5rem',
              color: '#FFFFFF',
              fontWeight: 700,
            }}
          >
            Reset Password
          </h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>
            Enter your new password below
          </p>
        </div>

        {!sessionReady ? (
          /* Waiting for Supabase to process the token from the URL hash */
          <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
            Verifying reset link…
          </p>
        ) : (
          <>
            <input
              id="new-password"
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginBottom: '0.75rem',
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                fontSize: '0.95rem',
                color: '#FFFFFF',
                boxSizing: 'border-box' as const,
                outline: 'none',
              }}
            />
            <input
              id="confirm-password"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReset()}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                background: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '10px',
                fontSize: '0.95rem',
                color: '#FFFFFF',
                boxSizing: 'border-box' as const,
                outline: 'none',
              }}
            />

            {message && (
              <p
                style={{
                  color: isSuccess ? '#00F5A0' : '#FF6B6B',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                {message}
              </p>
            )}

            <button
              id="reset-password-btn"
              onClick={handleReset}
              disabled={loading || isSuccess}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #00D2FF, #00F5A0)',
                color: '#0B0F19',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading || isSuccess ? 'not-allowed' : 'pointer',
                opacity: loading || isSuccess ? 0.7 : 1,
              }}
            >
              {loading ? 'Updating…' : isSuccess ? 'Done ✓' : 'Update Password'}
            </button>
          </>
        )}

        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#6B7280', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: '#00D2FF', textDecoration: 'none' }}>
            ← Back to Login
          </a>
        </p>
      </div>
    </div>
  )
}
