import React from 'react';
import {
    Home, Settings, Users, ShieldOff, Briefcase, DollarSign,
    CheckSquare, Calendar, BookOpen, Activity, KeyRound,
    Receipt, MessageSquare, ClipboardList, Wallet
} from 'lucide-react';


export type MenuItem = {
    title: string;
    icon: React.ElementType | React.ReactNode;
    path?: string;
    featureKey?: string;
    isActiveForced?: boolean; // Used to override active state for messaging demo
    roles?: string[]; // Optional role restriction
    permissions?: string[]; // Granular permission requirement
    formTeacherOnly?: boolean; // Restrict to form teachers and admins
    children?: {
        title: string;
        path?: string;
        featureKey?: string;
        roles?: string[];
        permissions?: string[];
        formTeacherOnly?: boolean;
        children?: { title: string; path: string; featureKey?: string; roles?: string[]; permissions?: string[]; formTeacherOnly?: boolean; }[];
    }[];
};

export const menuItems: MenuItem[] = [
    { title: 'Dashboard', icon: Home, path: '/dashboard', featureKey: 'Dashboard' },
    { title: 'My Payroll', icon: Wallet, path: '/dashboard/my-payroll' },
    {
        title: 'General Settings',
        icon: Settings,
        featureKey: 'General Settings',
        roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'], // Hidden from branch users
        children: [
            { title: 'School Profile', path: '/dashboard/settings/profile' },
            // { title: 'School Setup', path: '/dashboard/settings/school-setup' },
            { title: 'Academic Sections', path: '/dashboard/settings/sections' },
            { title: 'Academic Sessions', path: '/dashboard/settings/academic-sessions' },
            { title: 'Rules & Regulations', path: '/dashboard/settings/rules-regulations' },
            { title: 'Theme & Language', path: '/dashboard/settings/theme-language' },
            { title: 'Account Settings', path: '/dashboard/settings/account-settings' },
            { title: 'Email Setup (SMTP)', path: '/dashboard/settings/smtp-setup' },
            { title: 'Account Recovery', path: '/dashboard/settings/account-recovery' }
        ]
    },
    {
        title: 'Restrictions & Security',
        icon: ShieldOff,
        featureKey: 'Restrictions & Security',
        roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'],
        children: [
            { title: 'Roles & Permissions', path: '/dashboard/settings/role-permissions', permissions: ['adm_roles'] },
            { title: 'Activity Deadlines', path: '/dashboard/settings/activity-deadlines' },
            { title: 'Feature Access', path: '/dashboard/settings/feature-access' }
        ]
    },
    {
        title: 'Admission',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>,
        featureKey: 'Admission',
        permissions: ['std_add'],
        children: [
            { title: 'Admission Applications', path: '/dashboard/admission/applications' },
            { title: 'Admission Form', path: '/dashboard/settings/admission-form' },
            { title: 'Admission Letter', path: '/dashboard/settings/admission-letter' }
        ]
    },
    {
        title: 'Cards & PINs',
        icon: <KeyRound className="w-5 h-5" />,
        path: '/dashboard/pins',
        featureKey: 'Cards & PINs',
        roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN']
    },
    {
        title: 'ID Card',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>,
        path: '/dashboard/settings/id-card-setup',
        featureKey: 'ID Card'
    },
    {
        title: 'Result Management',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></div>,
        featureKey: 'Result Management',
        permissions: ['acd_view', 'acd_manage', 'cbt_grade'],
        children: [
            { title: 'Score Entry', path: '/dashboard/results/record', permissions: ['acd_manage'] },
            { title: 'Broadsheet & Print', path: '/dashboard/results/admin', permissions: ['acd_view'], formTeacherOnly: true },
            { title: 'Export ZIPs', path: '/dashboard/results/export', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
            { title: 'Legacy Results', path: '/dashboard/results/legacy', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
            { title: 'Result Settings', path: '/dashboard/results/settings', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN'] },
        ]
    },
    {
        title: 'Classes',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>,
        featureKey: 'Classes',
        permissions: ['acd_view'],
        children: [
            { title: 'All Classes', path: '/dashboard/classes/all' },
            { title: 'Add Class', path: '/dashboard/classes/add-class', permissions: ['acd_manage'] }
        ]
    },
    {
        title: 'Subjects',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg></div>,
        featureKey: 'Subjects',
        permissions: ['acd_view'],
        children: [
            { title: 'Add Subject', path: '/dashboard/subjects/add', permissions: ['acd_manage'] },
            { title: 'All Subjects', path: '/dashboard/subjects/all' },
            { title: 'Subject Categories', path: '/dashboard/settings/subject-categories' },
        ]
    },
    {
        title: 'Academics (AI)',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a2 2 0 0 1-.01 2.83l-7.1 7.1a2 2 0 0 1-2.83 0l-7.1-7.1a2 2 0 0 1-.01-2.83l7.1-7.1a2 2 0 0 1 2.83 0l7.1 7.1Z" /><path d="m16.5 21.5 4.5-4.5" /><path d="m3 7 4.5-4.5" /></svg></div>,
        featureKey: 'Academics (AI)',
        children: [
            { title: 'Curriculum & Scheme', path: '/dashboard/academics/curriculum' },
            { title: 'Lesson Notes', path: '/dashboard/academics/lesson-notes' },
            { title: 'CBT Assessments', path: '/teacher/cbt' },
            { title: 'CBT Dashboard', path: '/dashboard/academics/cbt' },
            { title: 'CBT Policies', path: '/dashboard/settings/cbt-policies' }
        ]
    },
    {
        title: 'Students',
        icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>,
        featureKey: 'Students',
        permissions: ['std_view'],
        children: [
            { title: 'Add New', path: '/dashboard/students/add', permissions: ['std_add'] },
            { title: 'All Students', path: '/dashboard/students/all' },
            { title: 'Bulk Import', path: '/dashboard/bulk-import/students', permissions: ['std_add'] },
            { title: 'Student ID Cards', path: '/dashboard/students/id-cards' },
            // { title: 'Manage Login', path: '/dashboard/students/manage-login', permissions: ['std_edit'] },
            { title: 'Promote Students', path: '/dashboard/students/promote', permissions: ['std_edit'] },
        ]
    },
    {
        title: 'Parents',
        icon: Users,
        featureKey: 'Parents',
        children: [
            { title: 'Add Parent', path: '/dashboard/parents/add' },
            { title: 'All Parents', path: '/dashboard/parents/all' },
            { title: 'Bulk Import', path: '/dashboard/bulk-import/parents' }
        ]
    },
    {
        title: 'Staff',
        icon: Briefcase,
        featureKey: 'Staff',
        permissions: ['adm_staff'],
        children: [
            { title: 'Add Staff', path: '/dashboard/employees/add' },
            { title: 'All Staff', path: '/dashboard/employees/all' },
            { title: 'Bulk Import', path: '/dashboard/bulk-import/staff' },
            { title: 'Teacher Assignments', path: '/dashboard/academics/assignments' },
            { title: 'Employment Applications', path: '/dashboard/staff/applications' },
            { title: 'Employment Form', path: '/dashboard/settings/employment-form' },
            { title: 'Employment Letter', path: '/dashboard/settings/employment-letter' }
        ]
    },
    {
        title: 'Platform Billing',
        icon: Receipt,
        featureKey: 'Platform Billing',
        roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'],
        children: [
            { title: 'Invoice Inbox', path: '/dashboard/billing/invoices' },
            { title: 'My Wallet', path: '/dashboard/billing/wallet' },
        ]
    },
    {
        title: 'Platform Messages',
        icon: MessageSquare,
        featureKey: 'Platform Messages',
        roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'],
        children: [
            { title: 'Messages', path: '/dashboard/platform/messages' },
            { title: 'Communication Templates', path: '/dashboard/messaging/communication-templates' }
        ]
    },
    {
        title: 'Finance',
        icon: DollarSign,
        featureKey: 'Finance',
        permissions: ['fin_view'],
        children: [
            { title: 'Finance Dashboard', path: '/dashboard/finance/dashboard' },
            { title: 'Virtual Wallets', path: '/dashboard/finance/wallet' },
            { title: 'Finance Messages', path: '/dashboard/finance/messages' },
            {
                title: 'School Fees',
                children: [
                    { title: 'School Fees Summaries', path: '/dashboard/finance/fees' },
                    { title: 'All Student Payments', path: '/dashboard/finance/all-payments' },
                    { title: 'Single Billing', path: '/dashboard/finance/single-billing', permissions: ['fin_collect'] },
                    { title: 'Family Billing', path: '/dashboard/finance/family-billing', permissions: ['fin_collect'] },
                    { title: 'Pay Invoice', path: '/dashboard/finance/payment-management' },
                    { title: 'Scholarships & Discounts', path: '/dashboard/finance/scholarships', permissions: ['fin_collect'] },
                    { title: 'Fees Setup', path: '/dashboard/finance/fees-setup' }
                ]
            },
            {
                title: 'Income & Expenses',
                children: [
                    { title: 'Income', path: '/dashboard/finance/income-expenses/income' },
                    { title: 'Expenses', path: '/dashboard/finance/income-expenses/expenses' },
                    { title: 'Profit & Loss', path: '/dashboard/finance/income-expenses/profit-loss' },
                    { title: 'Ledger Reports', path: '/dashboard/finance/income-expenses/ledger-reports' },
                    { title: 'Ledger Settings', path: '/dashboard/finance/income-expenses/ledger-settings' },
                ]
            },
            {
                title: 'Payroll',
                children: [
                    { title: 'Payroll Run', path: '/dashboard/finance/payroll/run' },
                    { title: 'Payroll Settings', path: '/dashboard/finance/payroll/settings' },
                    { title: 'Loan Management', path: '/dashboard/finance/payroll/loans' },
                    { title: 'Pension Tracker', path: '/dashboard/finance/payroll/pension' },
                    { title: 'Payslip Generator', path: '/dashboard/finance/payroll/payslip' },
                ]
            },
            { title: 'Inventory', path: '/dashboard/finance/inventory' },
            { title: 'Assets Management', path: '/dashboard/finance/assets' },
            { title: 'Point of Sale', path: '/dashboard/finance/pos' },
            { title: 'General Reports', path: '/dashboard/finance/reports' },
            { title: 'General Settings', path: '/dashboard/finance/settings' },
        ]
    },
    {
        title: 'Attendance',
        icon: CheckSquare,
        featureKey: 'Attendance',
        children: [
            { title: 'Dashboard', path: '/dashboard/attendance' },
            { title: 'Student Attendance', path: '/dashboard/attendance/students' },
            { title: 'Staff Attendance', path: '/dashboard/attendance/staff' },
            { title: 'Custom Attendance', path: '/dashboard/attendance/codes', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
            { title: 'QR Management', path: '/dashboard/attendance/qr', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
            { title: 'Scanner Terminal', path: '/dashboard/attendance/scanner', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
            { title: 'Reports', path: '/dashboard/attendance/reports' },
            { title: 'Settings', path: '/dashboard/attendance/settings', roles: ['ADMIN', 'SCHOOL_SUPER_ADMIN', 'SCHOOL_ADMIN'] },
        ]
    },
    { title: 'Timetable', icon: Calendar, path: '/dashboard/timetable', featureKey: 'Timetable' },
    { title: 'Homework', icon: BookOpen, path: '/dashboard/homework', featureKey: 'Homework' },
    { title: 'Behaviour & Skills', icon: Activity, path: '/dashboard/behaviour', featureKey: 'Behaviour & Skills' },
    { title: 'Online Store & POS', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg></div>, path: '/dashboard/store', featureKey: 'Online Store & POS' },
    { title: 'WhatsApp', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg></div>, path: '#', featureKey: 'WhatsApp' },
    { title: 'Messaging', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>, path: '/dashboard/messaging', isActiveForced: true, featureKey: 'Messaging' },
    { title: 'SMS Services', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg></div>, path: '/dashboard/sms', featureKey: 'SMS Services' },
    { title: 'Live Class', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.6 11.6L22 7v10l-6.4-4.5v-1z" /><circle cx="6" cy="12" r="3" /><path d="M2 19h8v-2a4 4 0 0 0-8 0z" /></svg></div>, path: '/dashboard/live-class', featureKey: 'Live Class' },
    { title: 'Question Paper', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg></div>, path: '/dashboard/question-paper', featureKey: 'Question Paper' },
    { title: 'Exams', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div>, path: '/dashboard/exams', featureKey: 'Exams' },
    { title: 'Log out', icon: <div className="w-5 h-5 flex items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg></div>, path: '/' }
];


