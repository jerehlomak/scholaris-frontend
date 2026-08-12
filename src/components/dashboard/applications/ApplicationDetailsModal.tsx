import { X, ExternalLink, Check, XCircle, Calendar, Clock, MapPin } from 'lucide-react';
import { Button } from '../../ui/button';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../ui/dialog";

interface ApplicationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: any;
    onUpdateStatus: (id: string, status: string, interviewDetails?: any) => void;
    onPrintApp: () => void;
    onPrintLetter: () => void;
}

export function ApplicationDetailsModal({ isOpen, onClose, application, onUpdateStatus, onPrintApp, onPrintLetter }: ApplicationDetailsModalProps) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [interviewDate, setInterviewDate] = useState('');
    const [interviewTime, setInterviewTime] = useState('');
    const [interviewLocation, setInterviewLocation] = useState('');

    const handleUpdate = async (status: string, details?: any) => {
        setIsSubmitting(true);
        try {
            await onUpdateStatus(application.id, status, details);
            setIsScheduling(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset state when modal opens/closes
    if (!application) return null;

    const formatKey = (key: string) => {
        let formatted = key.startsWith('f_') ? key.slice(2) : key;
        formatted = formatted.replace(/_/g, ' ');
        return formatted.replace(/\b\w/g, l => l.toUpperCase());
    };

    const isCloudinaryUrl = (value: any) => {
        return typeof value === 'string' && value.includes('res.cloudinary.com');
    };



    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-medium leading-6 text-gray-900 font-heading border-b pb-4">
                        Application Review
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Applicant Details</h4>
                        <dl className="mt-2 space-y-2">
                            <div>
                                <dt className="text-xs text-gray-500">Full Name</dt>
                                <dd className="text-sm font-medium text-gray-900">{application.applicantName}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Email Address</dt>
                                <dd className="text-sm font-medium text-gray-900">{application.applicantEmail || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Phone Number</dt>
                                <dd className="text-sm font-medium text-gray-900">{application.applicantPhone || 'N/A'}</dd>
                            </div>
                            <div>
                                <dt className="text-xs text-gray-500">Application Type</dt>
                                <dd className="text-sm font-medium text-gray-900">{application.applicationType === 'ADMISSION_APPLICATION' ? 'Student Admission' : 'Staff Employment'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Form Data</h4>
                        <dl className="mt-2 space-y-2">
                            {Object.entries(application.formData || {}).map(([key, value]) => (
                                <div key={key}>
                                    <dt className="text-xs text-gray-500">{formatKey(key)}</dt>
                                    <dd className="text-sm font-medium text-gray-900">
                                        {isCloudinaryUrl(value) ? (
                                            <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-[#1a2fa0] hover:underline flex items-center gap-1 mt-1">
                                                <ExternalLink className="w-3.5 h-3.5" /> View Document
                                            </a>
                                        ) : (
                                            String(value) || 'N/A'
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>

                {isScheduling && (
                    <div className="border-t pt-4 mt-4 bg-slate-50 -mx-6 px-6 pb-4">
                        <h4 className="text-sm font-bold text-slate-800 mb-3">Schedule Interview</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="date" 
                                        value={interviewDate}
                                        onChange={(e) => setInterviewDate(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="time" 
                                        value={interviewTime}
                                        onChange={(e) => setInterviewTime(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1">Location / Details</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Main Campus, Online Zoom, etc."
                                        value={interviewLocation}
                                        onChange={(e) => setInterviewLocation(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-8 sm:flex sm:flex-row-reverse border-t pt-4">
                    {application.status === 'PENDING' && !isScheduling && (
                        <>
                            <Button type="button" variant="success" onClick={() => setIsScheduling(true)} className="w-full sm:ml-3 sm:w-auto" disabled={isSubmitting}>
                                <Check className="w-4 h-4 mr-2"/> Approve & Schedule
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => handleUpdate('REJECTED')} className="mt-3 w-full sm:mt-0 sm:w-auto" disabled={isSubmitting}>
                                <XCircle className="w-4 h-4 mr-2"/> Reject
                            </Button>
                        </>
                    )}
                    {application.status === 'PENDING' && isScheduling && (
                        <>
                            <Button 
                                type="button" 
                                variant="success" 
                                onClick={() => handleUpdate('APPROVED', { interviewDate, interviewTime, interviewLocation })} 
                                className="w-full sm:ml-3 sm:w-auto"
                                disabled={isSubmitting}
                            >
                                <Check className="w-4 h-4 mr-2"/> {isSubmitting ? 'Approving...' : 'Confirm Approval'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsScheduling(false)} className="mt-3 w-full sm:mt-0 sm:w-auto" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </>
                    )}
                    <Button type="button" variant="outline" onClick={() => {
                        onClose();
                        setIsScheduling(false);
                    }} className="mt-3 w-full sm:mt-0 sm:w-auto sm:mr-auto" disabled={isSubmitting}>
                        Close
                    </Button>
                    
                    {application.status === 'APPROVED' && application.applicationType === 'ADMISSION_APPLICATION' && (
                        <Button type="button" onClick={onPrintLetter} className="mt-3 w-full sm:mt-0 sm:w-auto bg-[#1a2fa0] hover:bg-[#121f6e] text-white">
                            Print Admission Letter
                        </Button>
                    )}
                    
                    <Button type="button" onClick={onPrintApp} variant="outline" className="mt-3 w-full sm:mt-0 sm:w-auto">
                        Print Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
