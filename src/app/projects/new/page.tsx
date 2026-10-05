'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Template } from '@/lib/supabase'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadTemplates() {
      const { data } = await supabase
        .from('templates')
        .select('*')
        .order('name')
      if (data) {
        setTemplates(data)
        if (data.length > 0) setTemplateId(data[0].id)
      }
      setLoading(false)
    }
    loadTemplates()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !templateId) return

    setSubmitting(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: name.trim(),
        default_template_id: templateId,
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      alert('Error creating project: ' + error.message)
      setSubmitting(false)
      return
    }

    router.push(`/projects/${data.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-xl font-bold text-charcoal">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex items-center gap-1 text-charcoal font-bold text-2xl"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            New Project
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Project Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Campaign 2026"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
              />
            </div>

            <div>
              <label
                htmlFor="template"
                className="block text-sm font-medium text-charcoal mb-1.5"
              >
                Default Release Template
              </label>
              <select
                id="template"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal appearance-none"
              >
                {templates.length === 0 && (
                  <option value="">No templates available</option>
                )}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !name.trim() || !templateId}
            className="mt-6 w-full py-3.5 text-lg font-semibold rounded-full bg-charcoal text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  )
}
