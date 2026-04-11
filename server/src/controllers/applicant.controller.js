const fs = require('fs')
const {
  getApplicantProfile,
  updateApplicantProfile,
  addApplicantDocument,
  listApplicantDocuments,
} = require('../services/applicant.service')
const { listApplicantApplications, withdrawApplicantApplication } = require('../services/application.service')
const { applicantDocumentMetadataSchema } = require('../validation/applicant.validation')
const { parsePositiveInt } = require('../utils/parse')

async function getApplicantProfileController(req, res) {
  const profile = await getApplicantProfile(req.auth.userId)
  return res.status(200).json({ profile })
}

async function updateApplicantProfileController(req, res) {
  const profile = await updateApplicantProfile(req.auth.userId, req.validatedBody)
  return res.status(200).json({
    message: 'Applicant profile updated successfully',
    profile,
  })
}

async function uploadApplicantDocumentController(req, res) {
  const parsedMetadata = applicantDocumentMetadataSchema.safeParse(req.body || {})
  if (!parsedMetadata.success) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    return res.status(400).json({
      message: parsedMetadata.error.issues[0].message,
    })
  }

  const document = await addApplicantDocument(req.auth.userId, req.file, parsedMetadata.data.documentType)

  return res.status(201).json({
    message: 'Document uploaded successfully',
    document,
  })
}

async function listApplicantDocumentsController(req, res) {
  const documents = await listApplicantDocuments(req.auth.userId)
  return res.status(200).json({
    documents,
    count: documents.length,
  })
}

async function listApplicantApplicationsController(req, res) {
  const applications = await listApplicantApplications(req.auth.userId)
  return res.status(200).json({
    applications,
    count: applications.length,
  })
}

async function withdrawApplicantApplicationController(req, res) {
  const application = await withdrawApplicantApplication(
    req.auth.userId,
    parsePositiveInt(req.params.applicationId, 'applicationId'),
    req.validatedBody,
  )

  return res.status(200).json({
    message: 'Application withdrawn successfully',
    application,
  })
}

module.exports = {
  getApplicantProfileController,
  updateApplicantProfileController,
  uploadApplicantDocumentController,
  listApplicantDocumentsController,
  listApplicantApplicationsController,
  withdrawApplicantApplicationController,
}
