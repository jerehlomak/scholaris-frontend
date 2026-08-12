import { useState, useEffect } from 'react';
import { UserPlus, HeartPulse, Bus, Sparkles, Edit, Trash2, Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsShell } from './shared/SettingsShell';
import { SettingsHero } from './shared/SettingsHero';
import { SaveButton } from './shared/SaveButton';
import { FieldEditorModal, type FormFieldData } from './shared/FieldEditorModal';
import { GroupEditorModal, type GroupData } from './shared/GroupEditorModal';
import { cn } from '../../../lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

interface FormField {
    id: string;
    label: string;
    type: string;
    description: string;
    isRequired: boolean;
    isVisible: boolean;
    isPermanent: boolean;
    isCustom?: boolean;
    options?: string[];
}

interface FieldGroup {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    fields: FormField[];
}

const DEFAULT_GROUPS: FieldGroup[] = [
    {
        id: 'basic', title: 'Basic Identity (Required)', color: 'blue',
        icon: null,
        fields: [
            { id: 'f_fname', label: 'First Name', type: 'Text', description: "Candidate's given name.", isRequired: true, isVisible: true, isPermanent: true },
            { id: 'f_lname', label: 'Last Name', type: 'Text', description: "Candidate's family name.", isRequired: true, isVisible: true, isPermanent: true },
            { id: 'f_dob', label: 'Date of Birth', type: 'Date', description: 'Used to verify age.', isRequired: true, isVisible: true, isPermanent: true },
            { id: 'f_gender', label: 'Gender', type: 'Dropdown', description: 'Male/Female identification.', isRequired: true, isVisible: true, isPermanent: true },
        ]
    },
    {
        id: 'professional', title: 'Professional Background', color: 'purple',
        icon: null,
        fields: [
            { id: 'f_experience', label: 'Years of Experience', type: 'Number', description: 'Total years of relevant experience.', isRequired: true, isVisible: true, isPermanent: false },
            { id: 'f_education', label: 'Highest Education', type: 'Dropdown', description: 'BSc, MSc, PhD, etc.', isRequired: true, isVisible: true, isPermanent: false },
            { id: 'f_certifications', label: 'Certifications', type: 'Textarea', description: 'Relevant professional certifications.', isRequired: false, isVisible: true, isPermanent: false },
            { id: 'f_portfolio', label: 'Portfolio Link', type: 'Text', description: 'Link to previous work or projects.', isRequired: false, isVisible: false, isPermanent: false },
        ]
    },
    {
        id: 'contact', title: 'Contact Information', color: 'amber',
        icon: null,
        fields: [
            { id: 'f_email', label: 'Email Address', type: 'Text', description: 'Primary contact email.', isRequired: true, isVisible: true, isPermanent: false },
            { id: 'f_phone', label: 'Phone Number', type: 'Text', description: 'Primary phone number.', isRequired: true, isVisible: true, isPermanent: false },
            { id: 'f_address', label: 'Residential Address', type: 'Textarea', description: 'Home location.', isRequired: true, isVisible: true, isPermanent: false },
            { id: 'f_linkedin', label: 'LinkedIn Profile', type: 'Text', description: 'Link to professional profile.', isRequired: false, isVisible: false, isPermanent: false },
        ]
    },
    {
        id: 'documents', title: 'Required Documents', color: 'slate',
        icon: null,
        fields: [
            { id: 'f_passport', label: 'Passport Photograph', type: 'Image', description: 'Recent passport-sized photograph.', isRequired: true, isVisible: true, isPermanent: false, isCustom: true },
            { id: 'f_resume', label: 'Resume / CV', type: 'Image', description: 'Curriculum Vitae (PDF/Doc).', isRequired: true, isVisible: true, isPermanent: false, isCustom: true },
            { id: 'f_other_cert', label: 'Other Certificates', type: 'Image', description: 'Any other supporting documents.', isRequired: false, isVisible: true, isPermanent: false, isCustom: true },
        ]
    }
];

function FieldCard({ field, groupId, onToggle, onEdit, onDelete }: { field: FormField; groupId: string; onToggle: (gId: string, fId: string, prop: 'isVisible' | 'isRequired') => void; onEdit: (field: FormField) => void; onDelete: (gId: string, fId: string) => void }) {
    return (
        <div className={cn(
            'flex flex-col justify-between rounded-2xl border-2 p-5 transition-all',
            !field.isVisible ? 'opacity-50 grayscale bg-slate-50 border-slate-100' : 'border-slate-200 bg-white hover:border-blue-100 shadow-sm hover:shadow-md'
        )}>
            <div>
                <div className="mb-1 flex items-start justify-between gap-2">
                    <h4 className={cn('font-bold text-sm', field.isVisible ? 'text-slate-800' : 'text-slate-500 line-through')}>{field.label}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">{field.type}</span>
                        <button onClick={() => onEdit(field)} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="Edit Field">
                            <Edit className="w-3.5 h-3.5" />
                        </button>
                        {field.isCustom && (
                            <button onClick={() => onDelete(groupId, field.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete Field">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">{field.description}</p>
            </div>
            <div className="flex items-center gap-4 border-t border-slate-100 pt-4">
                {/* Visible toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(groupId, field.id, 'isVisible')}
                        disabled={field.isPermanent}
                        className={cn('relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors', field.isPermanent ? 'cursor-not-allowed' : '', field.isVisible ? 'bg-blue-600' : 'bg-slate-200')}
                    >
                        <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', field.isVisible ? 'translate-x-4' : 'translate-x-0')} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">{field.isPermanent ? 'Permanent' : field.isVisible ? 'Visible' : 'Hidden'}</span>
                </div>

                {(field.isVisible || field.isPermanent) && (
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <button
                            onClick={() => onToggle(groupId, field.id, 'isRequired')}
                            disabled={field.isPermanent || !field.isVisible}
                            className={cn('relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors', (field.isPermanent || !field.isVisible) ? 'cursor-not-allowed' : '', field.isRequired ? 'bg-emerald-500' : 'bg-slate-200')}
                        >
                            <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', field.isRequired ? 'translate-x-4' : 'translate-x-0')} />
                        </button>
                        <span className={cn('text-[10px] font-bold', field.isRequired ? 'text-emerald-600' : 'text-slate-400')}>{field.isRequired ? 'Required *' : 'Optional'}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function EmploymentFieldsConfig() {
    const [groups, setGroups] = useState<FieldGroup[]>(DEFAULT_GROUPS);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingField, setEditingField] = useState<FormFieldData | null>(null);
    const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);

    useEffect(() => {
        axios.get(`${API_BASE}/api/v1/school-settings`, { withCredentials: true })
            .then(res => {
                const config = res.data?.settings?.employmentFormConfig;
                if (config && Array.isArray(config)) setGroups(config);
            })
            .catch(err => toast.error('Failed to load form config'))
            .finally(() => setLoading(false));
    }, []);

    const toggleField = (groupId: string, fieldId: string, property: 'isVisible' | 'isRequired') => {
        setSaved(false);
        setGroups(prev => prev.map(group => {
            if (group.id !== groupId) return group;
            return {
                ...group,
                fields: group.fields.map(field => {
                    if (field.id !== fieldId || field.isPermanent) return field;
                    const newField = { ...field, [property]: !field[property] };
                    if (property === 'isRequired' && newField.isRequired) newField.isVisible = true;
                    if (property === 'isVisible' && !newField.isVisible) newField.isRequired = false;
                    return newField;
                })
            };
        }));
    };

    const handleAddField = (groupId: string) => {
        setActiveGroupId(groupId);
        setEditingField(null);
        setIsModalOpen(true);
    };

    const handleEditField = (groupId: string, field: FormField) => {
        setActiveGroupId(groupId);
        setEditingField(field as FormFieldData);
        setIsModalOpen(true);
    };

    const handleDeleteField = (groupId: string, fieldId: string) => {
        if (!confirm('Are you sure you want to delete this field?')) return;
        setSaved(false);
        setGroups(prev => prev.map(group => {
            if (group.id !== groupId) return group;
            return {
                ...group,
                fields: group.fields.filter(f => f.id !== fieldId)
            };
        }));
    };

    const handleSaveField = (fieldData: FormFieldData) => {
        setSaved(false);
        setGroups(prev => prev.map(group => {
            if (group.id !== activeGroupId) return group;
            const existingFieldIndex = group.fields.findIndex(f => f.id === fieldData.id);
            if (existingFieldIndex >= 0) {
                // Update existing
                const newFields = [...group.fields];
                newFields[existingFieldIndex] = { ...newFields[existingFieldIndex], ...fieldData };
                return { ...group, fields: newFields };
            } else {
                // Add new
                return { ...group, fields: [...group.fields, fieldData as FormField] };
            }
        }));
        setIsModalOpen(false);
    };

    const handleAddGroup = () => {
        setEditingGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleEditGroup = (group: FieldGroup) => {
        setEditingGroup({ id: group.id, title: group.title });
        setIsGroupModalOpen(true);
    };

    const handleDeleteGroup = (groupId: string) => {
        if (!confirm('Are you sure you want to delete this entire category and all its fields?')) return;
        setSaved(false);
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const handleSaveGroup = (groupData: GroupData) => {
        setSaved(false);
        setGroups(prev => {
            const existingIndex = prev.findIndex(g => g.id === groupData.id);
            if (existingIndex >= 0) {
                const newGroups = [...prev];
                newGroups[existingIndex] = { ...newGroups[existingIndex], title: groupData.title };
                return newGroups;
            } else {
                return [...prev, {
                    id: groupData.id,
                    title: groupData.title,
                    icon: <Plus className="h-4 w-4 text-slate-500" />,
                    color: 'slate',
                    fields: []
                }];
            }
        });
        setIsGroupModalOpen(false);
    };

    const handleSave = async () => { 
        setSaving(true);
        try {
            await axios.patch(`${API_BASE}/api/v1/school-settings`, { employmentFormConfig: groups }, { withCredentials: true });
            setSaved(true); 
            setTimeout(() => setSaved(false), 3000); 
            toast.success('Form configuration saved!');
        } catch (err) {
            toast.error('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsShell breadcrumbParent="Employment" breadcrumbCurrent="Employment Form Options" tabLabel="Form Builder" tabIcon={<UserPlus className="h-3.5 w-3.5" />}>
            <SettingsHero
                icon={<UserPlus className="h-7 w-7" />}
                title="Employment Data Collection"
                subtitle="Configure exactly what information is collected when a candidate applies for employment."
            />

            <AnimatePresence>
                {loading ? (
                    <div className="flex items-center justify-center p-16">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groups.map(group => (
                            <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                                            {/* Icons are dropped during serialization, map back locally */}
                                            {group.id === 'basic' ? <UserPlus className="h-4 w-4 text-blue-500" /> :
                                            group.id === 'professional' ? <Sparkles className="h-4 w-4 text-purple-500" /> :
                                            group.id === 'contact' ? <Bus className="h-4 w-4 text-amber-500" /> :
                                            group.id === 'documents' ? <FileText className="h-4 w-4 text-slate-500" /> :
                                            <Plus className="h-4 w-4 text-slate-500" />}
                                        </div>
                                        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => handleEditGroup(group)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors" title="Edit Section">
                                            <Edit className="h-3.5 w-3.5" />
                                        </button>
                                        {group.id !== 'basic' && (
                                            <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Delete Section">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {group.fields.map(field => (
                                        <FieldCard key={field.id} field={field} groupId={group.id} onToggle={toggleField} onEdit={(f) => handleEditField(group.id, f)} onDelete={handleDeleteField} />
                                    ))}
                                    <div 
                                        onClick={() => handleAddField(group.id)}
                                        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-slate-400 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500 cursor-pointer min-h-[140px]"
                                    >
                                        <Plus className="w-8 h-8 mb-2" />
                                        <span className="font-semibold text-sm">Add Field to {group.title.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={handleAddGroup} className="border-dashed border-2 border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Category
                            </Button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <div className="mt-10 border-t border-slate-100 pt-8">
                <SaveButton onClick={handleSave} saved={saved} saving={saving} saveLabel="Save Form Configuration" savedLabel="Configuration Saved!" />
            </div>

            <FieldEditorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveField}
                initialField={editingField}
            />

            <GroupEditorModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSave={handleSaveGroup}
                initialGroup={editingGroup}
            />
        </SettingsShell>
    );
}
