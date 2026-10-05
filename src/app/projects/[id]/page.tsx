'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, type Project, type Release } from '@/lib/supabase'

export default function ProjectDetailPage(props: PageProps<'/projects/[id]'>) {
  const { id } = React.use(props.params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [releases, setReleases] = useState<Release[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadData = useCallback(async () => {
    const [projectRes, releasesRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase
        .from('releases')
        .select('*')
        .eq('project_id', id)
        .order('signed_at', { ascending: false }),
    ])

    if (projectRes.data) setProject(projectRes.data)
    if (releasesRes.data) setReleases(releasesRes.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredReleases = releases.filter((r) =>
    r.signer_name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleMarkWrapped() {
    if (!project) return
    const { error } = await supabase
      .from('projects')
      .update({ status: 'wrapped' })
      .eq('id', project.id)

    if (error) {
      alert('Error updating project: ' + error.message)
      return
    }
    setProject({ ...project, status: 'wrapped' })
  }

  function handleExportContacts() {
    if (releases.length === 0) {
      alert('No releases to export')
      return
    }

    const headers = ['Name', 'Email', 'Phone']
    const rows = releases.map((r) => [
      r.signer_name,
      r.signer_email || '',
      r.signer_phone || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project?.name || 'contacts'}-contacts.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!project) return
    const confirmed = window.confirm(
      `Delete "${project.name}" and all its releases? This cannot be undone.`
    )
    if (!confirmed) return

    // Delete releases first, then project
    await supabase.from('releases').delete().eq('project_id', project.id)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    if (error) {
      alert('Error deleting project: ' + error.message)
      return
    }
    router.push('/')
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/sign/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-xl font-bold text-charcoal">Loading...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-xl text-charcoal">Project not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
            {project.name}
          </Link>
          {project.status === 'wrapped' && (
            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-200 text-gray-500">
              Wrapped
            </span>
          )}
        </div>

        {/* New Release Button */}
        <Link
          href={`/release/new?project=${id}`}
          className="block w-full text-center py-3.5 text-lg font-semibold rounded-full bg-charcoal text-white hover:opacity-90 transition-opacity mb-4"
        >
          + New Release
        </Link>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href={`/projects/${id}/edit`}
            className="text-center py-2.5 text-sm font-semibold rounded-full border border-gray-300 text-charcoal hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleMarkWrapped}
            disabled={project.status === 'wrapped'}
            className="py-2.5 text-sm font-semibold rounded-full border border-gray-300 text-charcoal hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {project.status === 'wrapped' ? 'Wrapped' : 'Mark Wrapped'}
          </button>
          <button
            onClick={handleExportContacts}
            className="py-2.5 text-sm font-semibold rounded-full border border-gray-300 text-charcoal hover:bg-gray-50 transition-colors"
          >
            Export Contacts
          </button>
          <button
            onClick={handleDelete}
            className="py-2.5 text-sm font-semibold rounded-full border border-red-300 text-red hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>

        {/* Share Link */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-xs font-semibold tracking-wider uppercase mb-2 text-gray-500">
            Share Signing Link
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={
                typeof window !== 'undefined'
                  ? `${window.location.origin}/sign/${id}`
                  : `/sign/${id}`
              }
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600 outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-charcoal text-white hover:opacity-90 transition-opacity"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="20"
            height="20"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search releases"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
          />
        </div>

        {/* Releases List */}
        <p className="text-xs font-semibold tracking-wider uppercase mb-2 text-gray-500">
          {releases.length} Release{releases.length !== 1 ? 's' : ''}
        </p>
        {filteredReleases.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            {search
              ? 'No matching releases found'
              : 'No releases yet. Share the signing link to collect releases.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filteredReleases.map((release) => (
              <Link
                key={release.id}
                href={`/release/${release.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="font-medium">{release.signer_name}</span>
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  {new Date(release.signed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
