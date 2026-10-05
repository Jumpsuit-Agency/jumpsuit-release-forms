'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, Template, Project } from '@/lib/supabase'
import SignaturePad, { type SignaturePadRef } from '@/components/SignaturePad'

export default function NewReleasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream flex items-center justify-center"><p className="text-charcoal/60">Loading...</p></div>}>
      <NewReleaseForm />
    </Suspense>
  )
}

function NewReleaseForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sigRef = useRef<SignaturePadRef>(null)

  // Step 1: form info, Step 2: sign
  const [step, setStep] = useState(1)

  // Data
  const [templates, setTemplates] = useState<Template[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [templateId, setTemplateId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerPhone, setSignerPhone] = useState('')

  // Selected template for step 2
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: p }] = await Promise.all([
        supabase.from('templates').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
      ])
      setTemplates(t || [])
      setProjects(p || [])

      const preselectedProject = searchParams.get('project')
      if (preselectedProject) {
        setProjectId(preselectedProject)
      }

      setLoading(false)
    }
    load()
  }, [searchParams])

  function handleContinue() {
    if (!templateId || !projectId || !signerName.trim() || !signerEmail.trim() || !signerPhone.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setError('')
    const tmpl = templates.find((t) => t.id === templateId)
    setSelectedTemplate(tmpl || null)
    setStep(2)
  }

  function clearSignature() {
    sigRef.current?.clear()
  }

  async function handleSubmit() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Please provide a signature.')
      return
    }

    setError('')
    setSubmitting(true)

    const signatureData = sigRef.current.toDataURL('image/png')

    const { data, error: insertError } = await supabase
      .from('releases')
      .insert({
        project_id: projectId,
        template_id: templateId,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim() || null,
        signer_phone: signerPhone.trim() || null,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      setError('Failed to save release. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/release/${data.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => (step === 2 ? setStep(1) : router.push('/'))}
            className="text-charcoal/60 hover:text-charcoal text-sm mb-4 inline-block"
          >
            &larr; {step === 2 ? 'Back to form' : 'Home'}
          </button>
          <h1 className="text-2xl font-bold text-charcoal">Create New Release</h1>
          <p className="text-charcoal/60 text-sm mt-1">
            Step {step} of 2 &mdash; {step === 1 ? 'Signer Information' : 'Review & Sign'}
          </p>
        </div>

        {error && (
          <div className="bg-red/10 border border-red/30 text-red rounded-xl px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl border border-charcoal/10 p-6 space-y-5">
            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Release Template <span className="text-red">*</span>
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              >
                <option value="">Select a template...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Project <span className="text-red">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              >
                <option value="">Select a project...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Signer Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Signer Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Full legal name"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            {/* Signer Email */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Signer Email <span className="text-red">*</span>
              </label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            {/* Signer Phone */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                Signer Phone <span className="text-red">*</span>
              </label>
              <input
                type="tel"
                value={signerPhone}
                onChange={(e) => setSignerPhone(e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full border border-charcoal/20 rounded-xl px-4 py-2.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-charcoal/20"
              />
            </div>

            {/* Continue */}
            <button
              onClick={handleContinue}
              className="w-full bg-charcoal text-cream font-medium py-3 rounded-full hover:bg-charcoal/90 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && selectedTemplate && (
          <div className="space-y-6">
            {/* Legal Text */}
            <div className="bg-white rounded-2xl border border-charcoal/10 p-6">
              <h2 className="text-lg font-semibold text-charcoal mb-3">
                {selectedTemplate.name}
              </h2>
              <div className="border border-charcoal/10 rounded-xl p-4 max-h-64 overflow-y-auto bg-cream/50">
                <div className="text-sm text-charcoal/80 leading-relaxed space-y-3">
                  {selectedTemplate.legal_text.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

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

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-charcoal text-cream font-medium py-3 rounded-full hover:bg-charcoal/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Sign & Submit'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
