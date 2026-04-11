import { useEffect, useState } from 'react'
import { listApplicantDocuments, uploadApplicantDocument } from '../../services/applicantService'

function formatFileSize(value) {
  if (!value && value !== 0) return '-'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function ApplicantDocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    documentType: 'resume',
    file: null,
  })

  const loadDocuments = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await listApplicantDocuments()
      setDocuments(response.documents || [])
    } catch (requestError) {
      setError(requestError.message || 'Unable to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleFileChange = (event) => {
    setForm((previous) => ({
      ...previous,
      file: event.target.files?.[0] || null,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.file) {
      setError('Please select a file to upload.')
      return
    }

    setUploading(true)
    try {
      await uploadApplicantDocument({
        file: form.file,
        documentType: form.documentType,
      })
      setMessage('Document uploaded successfully.')
      setForm({
        documentType: 'resume',
        file: null,
      })
      await loadDocuments()
    } catch (requestError) {
      setError(requestError.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Applicant Documents</h2>
        <p className="text-sm text-slate-600">Upload your resume and supporting files for upcoming screening workflows.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 md:grid-cols-[180px,1fr]">
          <select
            value={form.documentType}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                documentType: event.target.value,
              }))
            }
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          >
            <option value="resume">Resume</option>
            <option value="supporting">Supporting Document</option>
          </select>

          <input
            type="file"
            onChange={handleFileChange}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Uploaded Documents</h3>
        </div>
        {loading ? (
          <p className="px-4 py-4 text-sm text-slate-600">Loading document list...</p>
        ) : documents.length === 0 ? (
          <p className="px-4 py-4 text-sm text-slate-600">No documents uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Filename</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{item.document_type}</td>
                    <td className="px-4 py-3">{item.original_filename}</td>
                    <td className="px-4 py-3">{formatFileSize(item.file_size)}</td>
                    <td className="px-4 py-3">{new Date(item.uploaded_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
