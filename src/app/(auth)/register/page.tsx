'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const newErrors: Record<string, string> = {}

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters, letters, numbers, _ or -'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({ general: data.error || 'Registration failed' })
        }
        return
      }

      setSuccess(true)
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto card text-center">
          <h1 className="font-display text-2xl mb-4">Check Your Email</h1>
          <p className="text-text-secondary mb-4">
            We&apos;ve sent a verification link to <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-text-muted">
            Click the link in the email to verify your account and start using SideProject.deals.
          </p>
          <Link href="/login" className="btn mt-6 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="max-w-md mx-auto">
        <div className="card">
          <h1 className="font-display text-2xl text-center mb-6">Create Account</h1>

          {errors.general && (
            <div className="alert alert-error mb-4">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              error={errors.username}
              hint="3-30 characters, letters, numbers, _ or -"
              required
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={errors.password}
              hint="At least 8 characters"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <div className="text-sm text-text-muted">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-link">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-link">Privacy Policy</Link>.
            </div>

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-light text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-link font-medium">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
