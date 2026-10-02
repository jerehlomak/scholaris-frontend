import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { IdCardGenerate, IdCardDesigner, IdCardSettings, PublicDigitalIdCard, MyIdCard } from './pages/dashboard/id-card';

import { ThemeProvider } from './context/ThemeContext';
import { AttendanceProvider } from './context/AttendanceContext';

import { Home, Login, GetStarted, PlaceholderPage, ApplyPortal } from './pages'
import PortalLogin from './pages/auth/PortalLogin';
import PortalRecover from './pages/auth/PortalRecover';
import { DashboardHome } from './pages/dashboard'
import { RequirePlan } from './components/auth/RequirePlan';
import {
  InstituteProfile,
  AccountsFeesInvoice,
  RulesRegulations,
  MarksGrading,
  AccountSettings,
  AcademicTerms,
  AssessmentStructure,
  ReportCardBuilder,
  FeeRules,
  RolePermissions,
  AttendanceCodes,
  CommunicationTemplates,
  AdmissionFieldsConfig,
  EmploymentFieldsConfig,
  AdmissionLetterSetup,
  EmploymentLetterSetup,
  SchoolSetup,
  Sections,
  AcademicSessions,
  SubjectCategories,
  AccountRecovery,
  ResultSettings,
  ActivityDeadlines, 
  FeatureAccess,
  SmtpSetup
} from './pages/dashboard/settings';

// Students
import {
  AdmissionForm,
  PrintBasicList,
  AllStudents,
  ManageLogin,
  PromoteStudents
} from './pages/dashboard/students';

// Classes
import {
  AllClasses,
  AddClass,
  EditClass,
  ClassRoster
} from './pages/dashboard/classes';

// Subjects
import {
  AllSubjects,
  AddSubject,
  EditSubject,
  SubjectAllocation
} from './pages/dashboard/subjects';

// Parents (Admin)
import {
  AllParents,
  AddParent
} from './pages/dashboard/parents';

// Staff (Admin)
import {
  AllEmployees,
  AddEmployee
} from './pages/dashboard/employees/index';
import BulkImport from './pages/dashboard/shared/BulkImport';

import Messaging from './pages/dashboard/messaging/Messaging';

// Student Portal
import { StudentLayout } from './components/layout/StudentLayout';
import {
  StudentHome,
  Payment,
  Course,
  Result,
  Hostel
} from './pages/student';

import StudentMessaging from './pages/student/StudentMessaging';
import StudentExams from './pages/cbt/student/StudentExams';
import ExamRunner from './pages/cbt/student/ExamRunner';
import CbtHome from './pages/cbt/CbtHome';
import StudentLMS from './pages/student/StudentLMS';

// Teacher Portal
import { TeacherLayout } from './components/layout/TeacherLayout';
import {
  TeacherHome,
  TeacherClasses,
  TeacherSubjects,
  TeacherAssignments,
  TeacherResults,
  TeacherMessaging,
  TeacherPayroll,
} from './pages/teacher';

// Teacher CBT & LMS
import TeacherLMS from './pages/teacher/TeacherLMS';

// Parent Portal
import { ParentLayout } from './components/layout/ParentLayout';
import {
  ParentHome,
  ParentChildren,
  ParentAcademics,
  ParentResults,
  ParentMessaging,
  ParentFees
} from './pages/parent';
import PaymentSuccess from './pages/parent/PaymentSuccess';
import PaymentCancel from './pages/parent/PaymentCancel';
import ParentCBT from './pages/parent/ParentCBT';
import ParentLMS from './pages/parent/ParentLMS';
import ParentWallet from './pages/parent/ParentWallet';
import ParentFinanceMessages from './pages/parent/ParentFinanceMessages';

// Admin modules
import Income from './pages/dashboard/finance/Income';
import Expenses from './pages/dashboard/finance/Expenses';
import ProfitLoss from './pages/dashboard/finance/ProfitLoss';
import LedgerReports from './pages/dashboard/finance/LedgerReports';
import LedgerSettings from './pages/dashboard/finance/LedgerSettings';
import Payroll from './pages/dashboard/finance/Payroll';
import PayrollSettings from './pages/dashboard/finance/payroll/PayrollSettings';
import LoanManagement from './pages/dashboard/finance/payroll/LoanManagement';
import PensionTracker from './pages/dashboard/finance/payroll/PensionTracker';
import PayrollRun from './pages/dashboard/finance/payroll/PayrollRun';
import PayslipGenerator from './pages/dashboard/finance/payroll/PayslipGenerator';
import AttendanceOverview from './pages/attendance/Overview';
import { StudentRegister } from './pages/attendance/StudentRegister';
import { StaffRegister } from './pages/attendance/StaffRegister';
import QrHub from './pages/attendance/QrHub';
import AttendanceLogs from './pages/attendance/LogsPage';
import AttendanceSettings from './pages/attendance/SettingsPage';
import AttendanceReports from './pages/attendance/ReportsPage';
import ScanPage from './pages/attendance/ScanPage';
import TeacherAttendancePage from './pages/attendance/TeacherAttendancePage';
import ParentAttendancePage from './pages/attendance/ParentAttendancePage';
import { MyStudentAttendance } from './pages/attendance/MyAttendance';
import Timetable from './pages/dashboard/Timetable';
import MyTimetable from './pages/dashboard/timetable/MyTimetable';
import LessonNotes from './pages/dashboard/lesson-notes/LessonNotes';
import Homework from './pages/dashboard/Homework';
import { TeacherAssignments as AdminTeacherAssignments } from './pages/dashboard/academics';
// Admin Results
import AdminResults from './pages/dashboard/results/AdminResults';
import RecordScores from './pages/dashboard/results/RecordScores';
import { LegacyResults } from './pages/dashboard/results/LegacyResults';
import ExportResults from './pages/dashboard/results/ExportResults';

import NotFound from './pages/NotFound';

// Phase 4: Print Route
import PrintBatch from './pages/print/PrintBatch';

// Phase 4: PIN Management
import PinManager from './pages/dashboard/pins/PinManager';

// Phase 6 & 10: Wallet + Invoice Inbox
import InvoiceInbox from './pages/dashboard/billing/InvoiceInbox';
import WalletPage from './pages/dashboard/billing/WalletPage';
import PlatformMessages from './pages/dashboard/platform/Messages'; // Phase 7: Messaging

// Finance Phase 1 Base
import FinanceDashboard from './pages/dashboard/finance/FinanceDashboard';
import FinanceSettings from './pages/dashboard/finance/FinanceSettings';
import FeesSetup from './pages/dashboard/finance/FeesSetup';
import SchoolFees from './pages/dashboard/finance/SchoolFees';
import AllStudentPayments from './pages/dashboard/finance/AllStudentPayments';
import WalletLedger from './pages/dashboard/finance/WalletLedger';
import Placeholders from './pages/dashboard/finance/Placeholders';
import FinanceMessages from './pages/dashboard/finance/FinanceMessages';
// Finance Phase 2
import InvoiceManager from './pages/dashboard/finance/InvoiceManager';
import PaymentRecords from './pages/dashboard/finance/PaymentRecords';
import TransferVerifications from './pages/dashboard/finance/TransferVerifications';
import PaymentSettings from './pages/dashboard/finance/PaymentSettings';
import PaymentManagement from './pages/dashboard/finance/PaymentManagement';
import ScholarshipManager from './pages/dashboard/finance/ScholarshipManager';
import SingleBilling from './pages/dashboard/finance/SingleBilling';
import FamilyBilling from './pages/dashboard/finance/FamilyBilling';
import FinanceReports from './pages/dashboard/finance/FinanceReports';
import InventoryManagement from './pages/dashboard/finance/InventoryManagement';
import ApplicationList from './pages/dashboard/applications/ApplicationList';
import ManualApplicationForm from './pages/dashboard/applications/ManualApplicationForm';
import ParentApply from './pages/parent/ParentApply';

import { DashboardLayout } from './components/layout/DashboardLayout'

// Group Admin Portal
import GroupAdminLogin from './pages/auth/GroupAdminLogin';
import { GroupAdminLayout } from './components/layout/GroupAdminLayout';
import GroupDashboard from './pages/group-admin/GroupDashboard';
import BranchesManagement from './pages/group-admin/BranchesManagement';
import GroupAdmins from './pages/group-admin/GroupAdmins';

import './App.css'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { BranchProvider } from './context/BranchContext'
import { TermProvider } from './context/TermContext'
import { SchoolTypeProvider } from './context/SchoolTypeContext'

function App() {

  return (
    <ThemeProvider>
      <AttendanceProvider>
          <AuthProvider>
            <BranchProvider>
              <SubscriptionProvider>
                <TermProvider>
                  <SchoolTypeProvider>
                    <Toaster position="top-right" richColors toastOptions={{ style: { fontFamily: "'Poppins', sans-serif" } }} />
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/get-started" element={<GetStarted />} />
                      <Route path="/apply" element={<ApplyPortal />} />
                      <Route path="/id/:token" element={<PublicDigitalIdCard />} />
                      <Route path="/attendance/scan" element={<ScanPage />} />
                      <Route path="/schools" element={<PlaceholderPage title="For Schools" />} />
                      <Route path="/teachers" element={<PlaceholderPage title="For Teachers" />} />
                      <Route path="/students" element={<PlaceholderPage title="For Students" />} />
                      <Route path="/parents" element={<PlaceholderPage title="For Parents" />} />
                      <Route path="/pricing" element={<PlaceholderPage title="Pricing Plans" />} />
                      <Route path="/portal/login" element={<PortalLogin />} />
                      <Route path="/portal/recover" element={<PortalRecover />} />

                      {/* Group Admin Portal */}
                      <Route path="/group-admin/login" element={<GroupAdminLogin />} />
                      <Route path="/group-admin" element={<GroupAdminLayout />}>
                        <Route index element={<GroupDashboard />} />
                        <Route path="branches" element={<BranchesManagement />} />
                        <Route path="admins" element={<GroupAdmins />} />
                      </Route>

                      {/* Student Portal */}
                      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                        <Route path="/student" element={<StudentLayout />}>
                          <Route index element={<StudentHome />} />
                          <Route path="attendance" element={<MyStudentAttendance />} />
                          <Route path="payment" element={<Payment />} />
                          <Route path="course" element={<Course />} />
                          <Route path="result" element={<Result />} />
                          <Route path="hostel" element={<Hostel />} />
                          <Route path="cbt" element={<StudentExams />} />
                          <Route path="cbt/take/:id" element={<ExamRunner />} />
                          <Route path="lms" element={<StudentLMS />} />
                          <Route path="messaging" element={<StudentMessaging />} />
                          <Route path="id-card" element={<MyIdCard />} />
                          <Route path="timetable" element={<MyTimetable />} />
                        </Route>
                      </Route>

                      {/* Teacher Portal */}
                      <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                        <Route path="/teacher" element={<TeacherLayout />}>
                          <Route index element={<TeacherHome />} />
                          <Route path="classes" element={<TeacherClasses />} />
                          <Route path="subjects" element={<TeacherSubjects />} />
                          <Route path="assignments" element={<TeacherAssignments />} />
                          <Route path="attendance" element={<TeacherAttendancePage />} />
                          <Route path="results" element={<TeacherResults />} />
                          <Route path="messaging" element={<TeacherMessaging />} />
                          <Route path="id-card" element={<MyIdCard />} />
                          <Route path="timetable" element={<MyTimetable />} />
                          <Route path="lesson-notes" element={<RequirePlan featureKey="Lesson Notes"><LessonNotes /></RequirePlan>} />
                          <Route path="cbt" element={<CbtHome />} />
                          <Route path="lms" element={<TeacherLMS />} />
                          <Route path="payroll" element={<TeacherPayroll />} />
                        </Route>
                      </Route>

                      {/* Parent Portal */}
                      <Route element={<ProtectedRoute allowedRoles={['PARENT']} />}>
                        <Route path="/parent" element={<ParentLayout />}>
                          <Route index element={<ParentHome />} />
                          <Route path="children" element={<ParentChildren />} />
                          <Route path="academics" element={<ParentAcademics />} />
                          <Route path="timetable" element={<MyTimetable />} />
                          <Route path="apply" element={<ParentApply />} />
                          <Route path="fees" element={<ParentFees />} />
                          <Route path="fees/success" element={<PaymentSuccess />} />
                          <Route path="fees/cancel" element={<PaymentCancel />} />
                          <Route path="results" element={<ParentResults />} />
                          <Route path="attendance" element={<ParentAttendancePage />} />
                          <Route path="cbt" element={<ParentCBT />} />
                          <Route path="lms" element={<ParentLMS />} />
                          <Route path="wallet" element={<ParentWallet />} />
                          <Route path="finance-messages" element={<ParentFinanceMessages />} />
                          <Route path="messaging" element={<ParentMessaging />} />
                        </Route>
                      </Route>

                      {/* Admin Dashboard - Protected */}
                      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN', 'BRANCH_ADMIN', 'BRANCH_STAFF']} />}>
                        <Route element={<DashboardLayout />}>
                          <Route index element={<DashboardHome />} />
                          <Route path="my-payroll" element={<TeacherPayroll />} />
                          {/* Admission Module */}
                          <Route path="admission">
                            <Route path="applications" element={<RequirePlan plan="Pro" featureKey="Admission"><ApplicationList fixedType="ADMISSION_APPLICATION" /></RequirePlan>} />
                            <Route path="applications/new" element={<RequirePlan plan="Pro" featureKey="Admission"><ManualApplicationForm fixedType="ADMISSION_APPLICATION" /></RequirePlan>} />
                          </Route>
                          <Route path="staff">
                            <Route path="applications" element={<RequirePlan plan="Pro" featureKey="Staff"><ApplicationList fixedType="EMPLOYMENT" /></RequirePlan>} />
                            <Route path="applications/new" element={<RequirePlan plan="Pro" featureKey="Staff"><ManualApplicationForm fixedType="EMPLOYMENT" /></RequirePlan>} />
                          </Route>
                          <Route path="settings">
                            <Route path="profile" element={<InstituteProfile />} />
                            <Route path="academic-sessions" element={<AcademicSessions />} />
                            <Route path="subject-categories" element={<SubjectCategories />} />
                            <Route path="school-setup" element={<SchoolSetup />} />
                            <Route path="sections" element={<Sections />} />
                            <Route path="rules-regulations" element={<RulesRegulations />} />
                            <Route path="account-settings" element={<AccountSettings />} />
                            <Route path="smtp-setup" element={<SmtpSetup />} />

                            {/* Standalone Settings Menus */}
                            <Route path="role-permissions" element={<RequirePlan plan="Pro" featureKey="Restrictions & Security"><RolePermissions /></RequirePlan>} />
                            <Route path="activity-deadlines" element={<RequirePlan plan="Pro" featureKey="Restrictions & Security"><ActivityDeadlines /></RequirePlan>} />
                            <Route path="feature-access" element={<RequirePlan plan="Pro" featureKey="Restrictions & Security"><FeatureAccess /></RequirePlan>} />
                            <Route path="id-card-setup" element={<Navigate to="/dashboard/id-card/settings" replace />} />
                            <Route path="admission-form" element={<RequirePlan plan="Premium" featureKey="Admission"><AdmissionFieldsConfig /></RequirePlan>} />
                            <Route path="admission-letter" element={<RequirePlan plan="Premium" featureKey="Admission"><AdmissionLetterSetup /></RequirePlan>} />
                            <Route path="employment-form" element={<RequirePlan plan="Premium" featureKey="Staff"><EmploymentFieldsConfig /></RequirePlan>} />
                            <Route path="employment-letter" element={<RequirePlan plan="Premium" featureKey="Staff"><EmploymentLetterSetup /></RequirePlan>} />
                            <Route path="account-recovery" element={<RequirePlan plan="Pro" featureKey="Restrictions & Security"><AccountRecovery /></RequirePlan>} />
                          </Route>
                          {/* ID Card module: generate/print, designer and settings for students and staff */}
                          <Route path="id-card" element={<RequirePlan plan="Premium" featureKey="ID Card"><Outlet /></RequirePlan>}>
                            <Route index element={<Navigate to="generate" replace />} />
                            <Route path="generate" element={<IdCardGenerate />} />
                            <Route path="design" element={<IdCardDesigner />} />
                            <Route path="settings" element={<IdCardSettings />} />
                          </Route>
                          {/* Students */}
                          <Route element={<RequirePlan featureKey="Students"><Outlet /></RequirePlan>}>
                            <Route path="students">
                              <Route path="all" element={<AllStudents />} />
                              <Route path="manage-login" element={<ManageLogin />} />
                              <Route path="promote" element={<PromoteStudents />} />
                              <Route path="add" element={<AdmissionForm />} />
                              <Route path="edit/:id" element={<AdmissionForm />} />
                              <Route path="view/:id" element={<AdmissionForm />} />
                              <Route path="id-cards" element={<Navigate to="/dashboard/id-card/generate" replace />} />
                              <Route path="print-list" element={<PrintBasicList />} />
                            </Route>
                          </Route>

                          {/* Classes */}
                          <Route element={<RequirePlan featureKey="Classes"><Outlet /></RequirePlan>}>
                            <Route path="classes">
                              <Route path="all" element={<AllClasses />} />
                              <Route path="add-class" element={<AddClass />} />
                              <Route path="roster/:classId" element={<ClassRoster />} />
                            </Route>
                          </Route>

                          {/* Subjects */}
                          <Route element={<RequirePlan featureKey="Subjects"><Outlet /></RequirePlan>}>
                            <Route path="subjects">
                              <Route path="all" element={<AllSubjects />} />
                              <Route path="allocation" element={<SubjectAllocation />} />
                              <Route path="add" element={<AddSubject />} />
                            </Route>
                          </Route>

                          {/* Messaging */}
                          <Route element={<RequirePlan featureKey="Messaging"><Outlet /></RequirePlan>}>
                            <Route path="messaging">
                              <Route index element={<Messaging />} />
                              <Route path="communication-templates" element={<RequirePlan plan="Premium" featureKey="General Settings"><CommunicationTemplates /></RequirePlan>} />
                            </Route>
                          </Route>

                          {/* Results & Reports */}
                          <Route element={<RequirePlan featureKey="Result Management"><Outlet /></RequirePlan>}>
                            <Route path="results">
                              <Route path="admin" element={<AdminResults />} />
                              <Route path="record" element={<RecordScores />} />
                              <Route path="legacy" element={<LegacyResults />} />
                              <Route path="settings" element={<RequirePlan plan="Pro" featureKey="Result Management"><ResultSettings /></RequirePlan>} />
                              <Route path="export" element={<ExportResults />} />
                              {/* Legacy routes kept for backward compatibility */}
                              <Route path="report-card-builder" element={<RequirePlan plan="Pro" featureKey="Result Management"><ReportCardBuilder /></RequirePlan>} />
                              <Route path="marks-grading" element={<MarksGrading />} />
                              <Route path="assessment-structure" element={<AssessmentStructure />} />
                              <Route path="academic-terms" element={<AcademicTerms />} />
                            </Route>
                          </Route>

                          {/* Academics (Core) */}
                          <Route path="academics">
                            <Route path="lesson-notes" element={<RequirePlan featureKey="Lesson Notes"><LessonNotes /></RequirePlan>} />
                            <Route path="assignments" element={<AdminTeacherAssignments />} />
                          </Route>

                          {/* Parents */}
                          <Route element={<RequirePlan featureKey="Parents"><Outlet /></RequirePlan>}>
                            <Route path="parents">
                              <Route path="all" element={<AllParents />} />
                              <Route path="add" element={<AddParent />} />
                              <Route path="edit/:id" element={<AddParent />} />
                            </Route>
                          </Route>

                          {/* Staff */}
                          <Route element={<RequirePlan featureKey="Staff"><Outlet /></RequirePlan>}>
                            <Route path="employees">
                              <Route path="all" element={<AllEmployees />} />
                              <Route path="add" element={<AddEmployee />} />
                              <Route path="edit/:id" element={<AddEmployee />} />
                            </Route>
                          </Route>

                          {/* Bulk Import – Staff & Students */}
                          <Route path="bulk-import" element={<BulkImport />} />
                          <Route path="bulk-import/:type" element={<BulkImport />} />

                          {/* Finance Application – Phase 1 + 2 */}
                          <Route element={<RequirePlan featureKey="Finance"><Outlet /></RequirePlan>}>
                            <Route path="finance">
                              {/* New Main Finance Dashboard */}
                              <Route path="main-dashboard" element={<Placeholders title="Finance Dashboard" desc="Comprehensive dashboard summarizing all finance modules" />} />
                              <Route path="dashboard" element={<FinanceDashboard />} />
                              <Route path="settings" element={<FinanceSettings />} />
                              <Route path="fees-setup" element={<FeesSetup />} />
                              <Route path="custom-fee-rules" element={<RequirePlan plan="Pro" featureKey="Finance"><FeeRules /></RequirePlan>} />
                              <Route path="accounts-fees" element={<AccountsFeesInvoice />} />
                              <Route path="scholarships" element={<ScholarshipManager />} />
                              <Route path="single-billing" element={<SingleBilling />} />
                              <Route path="family-billing" element={<FamilyBilling />} />
                              <Route path="fees" element={<SchoolFees />} />
                              <Route path="all-payments" element={<AllStudentPayments />} />
                              <Route path="wallet" element={<WalletLedger />} />
                              <Route path="invoices" element={<InvoiceManager />} />
                              <Route path="payments" element={<PaymentRecords />} />
                              <Route path="messages" element={<FinanceMessages />} />
                              <Route path="transfers" element={<TransferVerifications />} />
                              <Route path="payment-settings" element={<PaymentSettings />} />
                              <Route path="payment-management" element={<PaymentManagement />} />
                              <Route path="income-expenses/income" element={<Income />} />
                              <Route path="income-expenses/expenses" element={<Expenses />} />
                              <Route path="income-expenses/profit-loss" element={<ProfitLoss />} />
                              <Route path="income-expenses/ledger-reports" element={<LedgerReports />} />
                              <Route path="income-expenses/ledger-settings" element={<LedgerSettings />} />
                              <Route path="payroll/run" element={<PayrollRun />} />
                              <Route path="payroll/settings" element={<PayrollSettings />} />
                              <Route path="payroll/loans" element={<LoanManagement />} />
                              <Route path="payroll/pension" element={<PensionTracker />} />
                              <Route path="payroll/payslip" element={<PayslipGenerator />} />
                              <Route path="inventory" element={<InventoryManagement />} />
                              <Route path="reports" element={<FinanceReports />} />
                            </Route>
                          </Route>

                          {/* Other Sidebar Placeholder Modules */}
                          <Route path="pins" element={<RequirePlan plan="Pro" featureKey="Cards & PINs"><PinManager /></RequirePlan>} />
                          <Route path="billing/invoices" element={<RequirePlan featureKey="Platform Billing"><InvoiceInbox /></RequirePlan>} />
                          <Route path="billing/wallet" element={<RequirePlan featureKey="Platform Billing"><WalletPage /></RequirePlan>} />
                          <Route path="platform/messages" element={<RequirePlan featureKey="Platform Messages"><PlatformMessages /></RequirePlan>} />

                          {/* Attendance */}
                          <Route element={<RequirePlan featureKey="Attendance"><Outlet /></RequirePlan>}>
                            <Route path="attendance">
                              <Route index element={<AttendanceOverview />} />
                              <Route path="students" element={<div className="mx-auto max-w-6xl p-4 md:p-6"><StudentRegister /></div>} />
                              <Route path="staff" element={<div className="mx-auto max-w-6xl p-4 md:p-6"><StaffRegister /></div>} />
                              <Route path="qr" element={<RequirePlan plan="Pro" featureKey="Attendance"><QrHub /></RequirePlan>} />
                              <Route path="reports" element={<AttendanceReports />} />
                              <Route path="logs" element={<AttendanceLogs />} />
                              <Route path="settings" element={<RequirePlan plan="Pro" featureKey="Attendance"><AttendanceSettings /></RequirePlan>} />
                              <Route path="codes" element={<RequirePlan plan="Pro" featureKey="Attendance"><AttendanceCodes /></RequirePlan>} />
                            </Route>
                          </Route>

                          {/* CBT */}
                          <Route element={<RequirePlan featureKey="Exams"><Outlet /></RequirePlan>}>
                            <Route path="cbt">
                              <Route index element={<CbtHome />} />
                              <Route path="policies" element={<RequirePlan plan="Premium" featureKey="Exams"><CbtHome initialTab="settings" /></RequirePlan>} />
                            </Route>
                          </Route>
                          <Route path="timetable" element={<RequirePlan plan="Pro" featureKey="Timetable"><Timetable /></RequirePlan>} />
                          <Route path="homework" element={<RequirePlan plan="Pro" featureKey="Homework"><Homework /></RequirePlan>} />
                        </Route>
                      </Route>

                      {/* Print Batch Route for Puppeteer */}
                      <Route path="/print-batch" element={<PrintBatch />} />

                      {/* 404 catch-all */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SchoolTypeProvider>
                </TermProvider>
              </SubscriptionProvider>
            </BranchProvider>
          </AuthProvider>
      </AttendanceProvider>
    </ThemeProvider >
  )
}

export default App
