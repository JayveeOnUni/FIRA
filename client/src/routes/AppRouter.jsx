import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { HomePage } from '../pages/public/HomePage'
import { AboutPage } from '../pages/public/AboutPage'
import { FAQPage } from '../pages/public/FAQPage'
import { NewsPage } from '../pages/public/NewsPage'
import { ContactPage } from '../pages/public/ContactPage'
import { JobSearchPage } from '../pages/public/JobSearchPage'
import { JobDetailPage } from '../pages/public/JobDetailPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { ApplicantRegisterPage } from '../pages/auth/ApplicantRegisterPage'
import { EmployerRegisterPage } from '../pages/auth/EmployerRegisterPage'
import { ApplicantDashboardPage } from '../pages/applicant/ApplicantDashboardPage'
import { ApplicantProfilePage } from '../pages/applicant/ApplicantProfilePage'
import { ApplicantDocumentsPage } from '../pages/applicant/ApplicantDocumentsPage'
import { ApplicantApplicationsPage } from '../pages/applicant/ApplicantApplicationsPage'
import { ApplicantRecommendedJobsPage } from '../pages/applicant/ApplicantRecommendedJobsPage'
import { EmployerDashboardPage } from '../pages/employer/EmployerDashboardPage'
import { EmployerCompanyProfilePage } from '../pages/employer/EmployerCompanyProfilePage'
import { EmployerJobsPage } from '../pages/employer/EmployerJobsPage'
import { CreateJobPage } from '../pages/employer/CreateJobPage'
import { EditJobPage } from '../pages/employer/EditJobPage'
import { EmployerJobApplicantsPage } from '../pages/employer/EmployerJobApplicantsPage'
import { EmployerEndorsedCandidatesPage } from '../pages/employer/EmployerEndorsedCandidatesPage'
import { StaffDashboardPage } from '../pages/staff/StaffDashboardPage'
import { StaffApplicantsPage } from '../pages/staff/StaffApplicantsPage'
import { StaffApplicantDetailPage } from '../pages/staff/StaffApplicantDetailPage'
import { StaffJobsPage } from '../pages/staff/StaffJobsPage'
import { StaffJobApplicationsPage } from '../pages/staff/StaffJobApplicationsPage'
import { StaffApplicationsPage } from '../pages/staff/StaffApplicationsPage'
import { StaffEndorsementsPage } from '../pages/staff/StaffEndorsementsPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RoleProtectedRoute } from './RoleProtectedRoute'
import { DashboardIndexRedirect } from './DashboardIndexRedirect'

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'news', element: <NewsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'jobs', element: <JobSearchPage /> },
      { path: 'jobs/:jobId', element: <JobDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register/applicant', element: <ApplicantRegisterPage /> },
      { path: 'register/employer', element: <EmployerRegisterPage /> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardIndexRedirect /> },
          {
            path: 'applicant',
            element: <RoleProtectedRoute allowedRoles={['applicant']} />,
            children: [
              { index: true, element: <ApplicantDashboardPage /> },
              { path: 'profile', element: <ApplicantProfilePage /> },
              { path: 'documents', element: <ApplicantDocumentsPage /> },
              { path: 'applications', element: <ApplicantApplicationsPage /> },
              { path: 'recommendations', element: <ApplicantRecommendedJobsPage /> },
            ],
          },
          {
            path: 'employer',
            element: <RoleProtectedRoute allowedRoles={['employer']} />,
            children: [
              { index: true, element: <EmployerDashboardPage /> },
              { path: 'company', element: <EmployerCompanyProfilePage /> },
              { path: 'jobs', element: <EmployerJobsPage /> },
              { path: 'jobs/new', element: <CreateJobPage /> },
              { path: 'jobs/:jobId/edit', element: <EditJobPage /> },
              { path: 'jobs/:jobId/applicants', element: <EmployerJobApplicantsPage /> },
              { path: 'jobs/:jobId/endorsed', element: <EmployerEndorsedCandidatesPage /> },
            ],
          },
          {
            path: 'staff',
            element: <RoleProtectedRoute allowedRoles={['agency_staff']} />,
            children: [
              { index: true, element: <StaffDashboardPage /> },
              { path: 'applications', element: <StaffApplicationsPage /> },
              { path: 'applicants', element: <StaffApplicantsPage /> },
              { path: 'applicants/:applicantId', element: <StaffApplicantDetailPage /> },
              { path: 'jobs', element: <StaffJobsPage /> },
              { path: 'jobs/:jobId/applications', element: <StaffJobApplicationsPage /> },
              { path: 'endorsements', element: <StaffEndorsementsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
