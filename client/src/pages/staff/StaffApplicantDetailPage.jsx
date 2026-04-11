import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getStaffApplicantDetail } from '../../services/staffService'

export function StaffApplicantDetailPage() {
  const { applicantId } = useParams()
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadApplicant = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getStaffApplicantDetail(applicantId)
      setPayload(response)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load applicant detail')
    } finally {
      setLoading(false)
    }
  }, [applicantId])

  useEffect(() => {
    loadApplicant()
  }, [loadApplicant])

  const applicant = payload?.applicant
  const documents = payload?.documents || []
  const applications = payload?.applications || []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Applicant Detail</h2>
          <p className="text-sm text-slate-600">Review profile, uploaded documents, and recruitment history.</p>
        </div>
        <Link to="/dashboard/staff/applicants" className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
          Back to Applicants
        </Link>
      </div>

      {loading && <p className="text-sm text-slate-600">Loading applicant detail...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {!loading && !error && applicant && (
        <>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">
              {applicant.first_name} {applicant.last_name}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{applicant.email}</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <p>Phone: {applicant.phone || 'N/A'}</p>
              <p>Profile Status: {applicant.profile_status || 'incomplete'}</p>
              <p>Preferred Category: {applicant.preferred_job_category || 'N/A'}</p>
              <p>Date of Birth: {applicant.date_of_birth ? new Date(applicant.date_of_birth).toLocaleDateString() : 'N/A'}</p>
            </div>
            {applicant.skills_summary && <p className="mt-3 text-sm text-slate-700">Skills: {applicant.skills_summary}</p>}
          </article>

          <article className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Document Metadata</h3>
            {documents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No uploaded documents for this applicant.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {documents.map((document) => (
                  <li key={document.id} className="rounded-md bg-slate-50 p-3">
                    <p className="font-medium text-slate-800">{document.original_filename}</p>
                    <p className="text-xs text-slate-500">
                      Type: {document.document_type} • {(document.file_size || 0) / 1024 >= 1 ? `${Math.round(document.file_size / 1024)} KB` : `${document.file_size || 0} B`} • Uploaded{' '}
                      {new Date(document.uploaded_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-lg border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Applications</h3>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No applications yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {applications.map((application) => (
                  <li key={application.application_id} className="rounded-md bg-slate-50 p-3">
                    <p className="font-medium text-slate-900">
                      {application.job_title} ({application.company_name || 'No company'})
                    </p>
                    <p className="text-xs text-slate-500">
                      Status: {application.status} • Applied {new Date(application.applied_at).toLocaleString()}
                    </p>
                    {application.endorsement_id && (
                      <p className="mt-1 text-xs font-medium text-emerald-700">Endorsed: {new Date(application.endorsed_at).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </>
      )}
    </section>
  )
}
