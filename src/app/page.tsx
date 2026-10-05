'use client'

import { useEffect, useState } from 'react'
import { supabase, type Project, type Release } from '@/lib/supabase'
import Link from 'next/link'

export default function Home() {
  const [projects, setProjects] = useState<(Project & { release_count: number })[]>([])
  const [releases, setReleases] = useState<(Release & { projects: { name: string } })[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [projectsRes, releasesRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, releases(count)')
        .eq('status', 'active')
        .order('created_at', { ascending: false }),
      supabase
        .from('releases')
        .select('*, projects(name)')
        .order('signed_at', { ascending: false })
        .limit(50),
    ])

    if (projectsRes.data) {
      const mapped = projectsRes.data.map((p: Record<string, unknown>) => ({
        ...p,
        release_count: (p.releases as { count: number }[])?.[0]?.count || 0,
      }))
      setProjects(mapped as (Project & { release_count: number })[])
    }
    if (releasesRes.data) {
      setReleases(releasesRes.data as (Release & { projects: { name: string } })[])
    }
    setLoading(false)
  }

  const filteredReleases = releases.filter(
    (r) =>
      r.signer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.projects?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalReleases = releases.length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-xl font-bold text-charcoal">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Release Forms</h1>
            <p className="text-sm mt-0.5 text-gray-500">JUMPSUIT PRODUCTIONS</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Link
            href="/projects/new"
            className="block w-full text-center py-3.5 text-lg font-semibold rounded-full border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors"
          >
            + Create Project
          </Link>
          <Link
            href="/release/new"
            className="block w-full text-center py-3.5 text-lg font-semibold rounded-full bg-charcoal text-white hover:opacity-90 transition-opacity"
          >
            + Create Release
          </Link>
        </div>

        {/* Active Projects */}
        {projects.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-wider uppercase mb-2 text-gray-500">
              Active Projects
            </p>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="font-medium">{project.name}</span>
                  <span className="flex items-center gap-2 text-sm text-gray-400">
                    {project.release_count} release{project.release_count !== 1 ? 's' : ''}
                    <ChevronRight />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="20" height="20" fill="none" stroke="#9ca3af" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search signer or project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-base outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal"
          />
        </div>

        {/* Releases List */}
        <p className="text-xs font-semibold tracking-wider uppercase mb-2 text-gray-500">
          {totalReleases} Release{totalReleases !== 1 ? 's' : ''}
        </p>
        {filteredReleases.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            {search ? 'No matching releases found' : 'No releases yet. Create a project to get started.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filteredReleases.map((release) => (
              <Link
                key={release.id}
                href={`/release/${release.id}`}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
              >
                <div>
                  <div className="font-medium">{release.signer_name}</div>
                  <div className="text-sm text-gray-400">{release.projects?.name}</div>
                </div>
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  {new Date(release.signed_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  <ChevronRight />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
