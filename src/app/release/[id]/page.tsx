'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Release } from '@/lib/supabase'
import jsPDF from 'jspdf'

export default function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const router = useRouter()

  const [release, setRelease] = useState<Release | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('releases')
        .select('*, projects(name), templates(name, legal_text)')
        .eq('id', id)
        .single()

      if (fetchError || !data) {
        setError('Release not found.')
        setLoading(false)
        return
      }

      setRelease(data as Release)
      setLoading(false)
    }
    load()
  }, [id])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function downloadPDF() {
    if (!release) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('JUMPSUIT', margin, y)
    y += 10

    doc.setFontSize(14)
    doc.text(release.templates?.name || 'Release Form', margin, y)
    y += 10

    // Divider
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Signer info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const info = [
      ['Signer', release.signer_name],
      ['Project', release.projects?.name || ''],
      ['Date Signed', formatDate(release.signed_at)],
      ...(release.signer_email ? [['Email', release.signer_email]] : []),
      ...(release.signer_phone ? [['Phone', release.signer_phone]] : []),
      ...(release.signer_address ? [['Address', release.signer_address]] : []),
    ]

    for (const [label, value] of info) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${label}:`, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(value as string, margin + 30, y)
      y += 6
    }

    y += 6

    // Legal text
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const legalText = release.templates?.legal_text || ''
    const lines = doc.splitTextToSize(legalText, maxWidth)

    for (const line of lines) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      doc.text(line, margin, y)
      y += 5
    }

    y += 10

    // Signature
    if (y > 230) {
      doc.addPage()
      y = 20
    }

    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.text('Signature:', margin, y)
    y += 6

    if (release.signature_data) {
      try {
        doc.addImage(release.signature_data, 'PNG', margin, y, 80, 30)
        y += 35
      } catch {
        doc.text('[Signature on file]', margin, y)
        y += 6
      }
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Signed: ${formatDate(release.signed_at)}`, margin, y)

    const projectName = release.projects?.name || 'release'
    const safeName = projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    doc.save(`${safeName}-${release.signer_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-charcoal/60">Loading...</p>
      </div>
    )
  }

  if (error || !release) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-charcoal/60 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-charcoal underline text-sm"
          >
            Go home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-charcoal/60 hover:text-charcoal text-sm mb-4 inline-block"
          >
            &larr; Home
          </button>
          <h1 className="text-2xl font-bold text-charcoal">Release Signed</h1>
          <p className="text-charcoal/60 text-sm mt-1">
            This release has been successfully recorded.
          </p>
        </div>

        {/* Release Card */}
        <div className="bg-white rounded-2xl border border-charcoal/10 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-charcoal/50 uppercase tracking-wide">Signer</p>
              <p className="text-charcoal font-medium">{release.signer_name}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 uppercase tracking-wide">Project</p>
              <p className="text-charcoal font-medium">{release.projects?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 uppercase tracking-wide">Template</p>
              <p className="text-charcoal font-medium">{release.templates?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-charcoal/50 uppercase tracking-wide">Date Signed</p>
              <p className="text-charcoal font-medium">{formatDate(release.signed_at)}</p>
            </div>
            {release.signer_email && (
              <div>
                <p className="text-xs text-charcoal/50 uppercase tracking-wide">Email</p>
                <p className="text-charcoal font-medium">{release.signer_email}</p>
              </div>
            )}
            {release.signer_phone && (
              <div>
                <p className="text-xs text-charcoal/50 uppercase tracking-wide">Phone</p>
                <p className="text-charcoal font-medium">{release.signer_phone}</p>
              </div>
            )}
            {release.signer_address && (
              <div className="col-span-2">
                <p className="text-xs text-charcoal/50 uppercase tracking-wide">Address</p>
                <p className="text-charcoal font-medium">{release.signer_address}</p>
              </div>
            )}
          </div>

          {/* Signature Image */}
          {release.signature_data && (
            <div>
              <p className="text-xs text-charcoal/50 uppercase tracking-wide mb-2">Signature</p>
              <div className="border border-charcoal/10 rounded-xl p-3 bg-cream/50">
                <img
                  src={release.signature_data}
                  alt={`Signature of ${release.signer_name}`}
                  className="max-h-24 mx-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={downloadPDF}
            className="w-full bg-charcoal text-cream font-medium py-3 rounded-full hover:bg-charcoal/90 transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full border border-charcoal/20 text-charcoal font-medium py-3 rounded-full hover:bg-charcoal/5 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
