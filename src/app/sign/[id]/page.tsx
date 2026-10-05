'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase, Project, Template } from '@/lib/supabase'
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad'

export default function PublicSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const sigRef = useRef<SignaturePadRef>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerPhone, setSignerPhone] = useState('')
  const [signerAddress, setSignerAddress] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [agreed, setAgreed] = useState(false)

  // Determine if template needs emergency contact fields
  const showEmergencyFields =
    template?.slug === 'liability-waiver' || template?.slug === 'event-waiver'

  useEffect(() => {
    async function load() {
      const { data: proj, error: projError } = await supabase
        .from('projects')
        .select('*, templates(*)')
        .eq('id', id)
        .single()

      if (projError || !proj) {
        setError('Project not found.')
        setLoading(false)
        return
      }

      setProject(proj as Project)
      setTemplate((proj as any).templates as Template)
      setLoading(false)
    }
    load()
  }, [id])

  function clearSignature() {
    sigRef.current?.clear()
  }

  async function handleSubmit() {
    if (!signerName.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!signerEmail.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!signerPhone.trim()) {
      setError('Please enter your phone number.')
      return
    }
    if (!agreed) {
      setError('Please agree to the terms before signing.')
      return
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Please provide your signature.')
      return
    }

    setError('')
    setSubmitting(true)

    const signatureData = sigRef.current.toDataURL('image/png')

    const { error: insertError } = await supabase.from('releases').insert({
      project_id: id,
      template_id: template?.id,
      signer_name: signerName.trim(),
      signer_email: signerEmail.trim() || null,
      signer_phone: signerPhone.trim() || null,
      signer_address: signerAddress.trim() || null,
      signature_data: signatureData,
      emergency_contact_name: emergencyName.trim() || null,
      emergency_contact_relationship: emergencyRelationship.trim() || null,
      emergency_contact_phone: emergencyPhone.trim() || null,
      signed_at: new Date().toISOString(),
    })

    if (insertError) {
      setError('Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-charcoal/60">{error}</p>
      </div>
    )
  }

  // Success / Thank You screen
  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-3xl font-bold tracking-tight text-charcoal mb-2">JUMPSUIT</h1>
          <div className="bg-white rounded-2xl border border-charcoal/10 p-8 mt-6">
            <div className="text-sage text-5xl mb-4">&#10003;</div>
            <h2 className="text-xl font-semibold text-charcoal mb-2">
              Thank you, {signerName.trim().split(' ')[0]}!
            </h2>
            <p className="text-charcoal/60">
              Your release has been signed and recorded.
            </p>
            <p className="text-charcoal/40 text-sm mt-4">
              {project?.name}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Branded Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">JUMPSUIT</h1>
          <p className="text-charcoal/60 text-sm mt-1">{project?.name}</p>
        </div>

        {error && (
          <div className="bg-red/10 border border-red/30 text-red rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Signer Info */}
          <div className="bg-white rounded-2xl border border-charcoal/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-charcoal">Your Information</h2>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Full Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Your full legal name"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Email <span className="text-red">*</span>
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Phone <span className="text-red">*</span>
              </label>
              <input
                type="tel"
                value={signerPhone}
                onChange={(e) => setSignerPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Address <span className="text-charcoal/40">(optional)</span>
              </label>
              <input
                type="text"
                value={signerAddress}
                onChange={(e) => setSignerAddress(e.target.value)}
                placeholder="Street, City, State, Zip"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>
          </div>

          {/* Emergency Contact (conditional) */}
          {showEmergencyFields && (
            <div className="bg-white rounded-2xl border border-charcoal/10 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-charcoal">Emergency Contact</h2>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Emergency contact name"
                  className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">
                  Relationship
                </label>
                <input
                  type="text"
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  placeholder="e.g. Spouse, Parent, Friend"
                  className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="(555) 555-5555"
                  className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
                />
              </div>
            </div>
          )}

          {/* Legal Text */}
          {template && (
            <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-3">{template.name}</h2>
              <div className="border border-charcoal/10 rounded-xl p-4 max-h-64 overflow-y-auto bg-cream/50">
                <div className="text-sm text-charcoal/80 leading-relaxed space-y-3">
                  {template.legal_text.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-3">Signature</h2>
            <p className="text-sm text-charcoal/60 mb-3">
              Sign below using your finger or mouse.
            </p>
            <div className="border border-charcoal/20 rounded-xl overflow-hidden bg-white">
              <SignaturePad ref={sigRef} penColor="black" />
            </div>
            <button
              onClick={clearSignature}
              className="text-sm text-charcoal/60 hover:text-charcoal mt-2"
            >
              Clear signature
            </button>
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 px-1 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-charcoal/30 accent-charcoal"
            />
            <span className="text-sm text-charcoal/80">
              I have read and agree to the terms above.
            </span>
          </label>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-charcoal text-cream font-medium py-3 rounded-full hover:bg-charcoal/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Sign & Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
