import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Settings2, Save, EyeOff, Eye, GripVertical, AlertCircle, Plus, Trash2, Sidebar, SlidersHorizontal, Zap, Minus, Send, ClipboardList, BookOpen, User, Palette, FileText, Menu, X, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { DUMMY_REPORT_DATA } from './dummyData';
import SchoolHeaderBlock from './SchoolHeaderBlock';
import StudentInfoBlock from './StudentInfoBlock';
import AcademicSummaryBlock from './AcademicSummaryBlock';
import SubjectResultsBlock from './SubjectResultsBlock';
import AttendanceBlock from './AttendanceBlock';
import TraitRatingsBlock from './TraitRatingsBlock';
import NarrativeCommentsBlock from './NarrativeCommentsBlock';
import RemarksBlock from './RemarksBlock';
import SignaturesBlock from './SignaturesBlock';

import CommentHeaderBlock from './CommentHeaderBlock';
import CommentStudentInfoBlock from './CommentStudentInfoBlock';
import CommentSkillsGridBlock from './CommentSkillsGridBlock';
import CommentNarrativeBlock from './CommentNarrativeBlock';
import CommentSignaturesBlock from './CommentSignaturesBlock';

const COLORS = [
  {hex:'#185FA5',light:'#E6F1FB',init:'SP'},
  {hex:'#1a7a40',light:'#e6f9ef',init:'SP'},
  {hex:'#7F77DD',light:'#EEEDFE',init:'SP'},
  {hex:'#993556',light:'#FBEAF0',init:'SP'},
  {hex:'#D85A30',light:'#FAECE7',init:'SP'},
  {hex:'#0F6E56',light:'#E1F5EE',init:'SP'},
];

const BLOCK_REGISTRY: Record<string, { label: string; component: React.FC<any> }> = {
    SchoolHeaderBlock: { label: 'School Header', component: SchoolHeaderBlock },
    StudentInfoBlock: { label: 'Student Info', component: StudentInfoBlock },
    AcademicSummaryBlock: { label: 'Academic Summary', component: AcademicSummaryBlock },
    SubjectResultsBlock: { label: 'Subject Results', component: SubjectResultsBlock },
    AttendanceBlock: { label: 'Attendance', component: AttendanceBlock },
    TraitRatingsBlock: { label: 'Trait Ratings', component: TraitRatingsBlock },
    NarrativeCommentsBlock: { label: 'Narrative Reports', component: NarrativeCommentsBlock },
    RemarksBlock: { label: 'Remarks', component: RemarksBlock },
    SignaturesBlock: { label: 'Signatures', component: SignaturesBlock },
    
    CommentHeaderBlock: { label: 'Comment Header', component: CommentHeaderBlock },
    CommentStudentInfoBlock: { label: 'Comment Student Info', component: CommentStudentInfoBlock },
    CommentSkillsGridBlock: { label: 'Comment Skills Grid', component: CommentSkillsGridBlock },
    CommentNarrativeBlock: { label: 'Remarks & Comments', component: CommentNarrativeBlock },
    CommentSignaturesBlock: { label: 'Comment Signatures', component: CommentSignaturesBlock },
};

export interface BlockConfig {
    id: string;
    type: string;
    isVisible: boolean;
    props?: any;
}

interface SortableBlockProps {
    block: BlockConfig;
    isActive: boolean;
    onSelect: () => void;
    prevMode: boolean;
    design: any;
    data: any;
    globalSettings?: any;
}

function SortableField({ field, onRemove }: { field: string; onRemove: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `field-${field}` });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded text-xs text-gray-700 shadow-sm relative group">
            <div className="cursor-grab p-1 hover:bg-gray-100 rounded text-gray-400" {...attributes} {...listeners}>
                <GripVertical className="w-3 h-3" />
            </div>
            <span className="flex-1 font-medium truncate">{field}</span>
            <button onClick={onRemove} className="p-1 hover:bg-red-50 hover:text-red-600 rounded text-gray-400 transition-colors">
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    );
}

function SortableCanvasBlock({ block, isActive, onSelect, prevMode, design, data, globalSettings }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const BlockComponent = BLOCK_REGISTRY[block.type]?.component;

    if (!BlockComponent) return null;

    if (prevMode && !block.isVisible) return null;

    const baseClass = prevMode 
        ? `mb-4` 
        : `relative group mb-4 border-2 rounded-xl transition-colors cursor-pointer bg-white ${isActive ? 'shadow-md' : 'border-transparent hover:border-gray-200'} ${!block.isVisible ? 'opacity-50 grayscale' : ''}`;
    
    // Apply custom border color if active and not in preview
    const customStyle = {
        ...style,
        borderColor: (!prevMode && isActive) ? design.accentColor : undefined
    };

    return (
        <div ref={setNodeRef} style={customStyle} onClick={onSelect} className={baseClass}>
            {!prevMode && (
                <div className="absolute top-2 left-2 p-1 bg-white shadow rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10" {...attributes} {...listeners}>
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
            )}
            {(!prevMode && !block.isVisible) && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 pointer-events-none">
                    <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2"><EyeOff className="w-3 h-3"/> Hidden Block</span>
                </div>
            )}
            <div className={`p-6 ${prevMode ? '' : 'pointer-events-none'}`}>
                <BlockComponent data={data} config={{...design, ...block.props}} globalSettings={globalSettings} />
            </div>
        </div>
    );
}

const SidebarDroppable = ({ children, isOver, className }: any) => {
    const { setNodeRef } = useDroppable({ id: 'sidebar-trash' });
    return (
        <div ref={setNodeRef} className={`${className} relative transition-colors ${isOver ? 'bg-red-50 border-red-300' : ''}`}>
            {isOver && <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-50/90 text-red-600 font-bold text-lg border-2 border-dashed border-red-400 m-2 rounded-lg">Drop to Delete</div>}
            {children}
        </div>
    );
};

export default function TemplateBuilder({ API, initialTemplateId, isCommentTemplateInitial, onClose }: { API: string, initialTemplateId?: string, isCommentTemplateInitial?: boolean, onClose?: () => void }) {
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [blocks, setBlocks] = useState<BlockConfig[]>(isCommentTemplateInitial ? [
        { id: 'b-1', type: 'CommentHeaderBlock', isVisible: true, props: {} },
        { id: 'b-2', type: 'CommentStudentInfoBlock', isVisible: true, props: {} },
        { id: 'b-3', type: 'CommentSkillsGridBlock', isVisible: true, props: {} },
        { id: 'b-4', type: 'CommentNarrativeBlock', isVisible: true, props: {} },
        { id: 'b-5', type: 'CommentSignaturesBlock', isVisible: true, props: {} },
    ] : [
        { id: 'b-1', type: 'SchoolHeaderBlock', isVisible: true, props: {} },
        { id: 'b-2', type: 'StudentInfoBlock', isVisible: true, props: {} },
        { id: 'b-3', type: 'AcademicSummaryBlock', isVisible: true, props: {} },
        { id: 'b-4', type: 'SubjectResultsBlock', isVisible: true, props: {} },
        { id: 'b-5', type: 'AttendanceBlock', isVisible: true, props: {} },
        { id: 'b-6', type: 'TraitRatingsBlock', isVisible: true, props: {} },
        { id: 'b-7', type: 'NarrativeCommentsBlock', isVisible: true, props: {} },
        { id: 'b-7-5', type: 'RemarksBlock', isVisible: true, props: {} },
        { id: 'b-8', type: 'SignaturesBlock', isVisible: true, props: {} },
    ]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [globalSettings, setGlobalSettings] = useState<any>(null);

    const getInitialZoom = () => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 768) return 40;
        }
        return 100;
    };

    // New V2 States
    const [ltabSel, setLtabSel] = useState<'sections' | 'layout' | 'branding'>('sections');
    const [rtabSel, setRtabSel] = useState<'block' | 'grade' | 'fields'>('block');
    const [zoomLvl, setZoomLvl] = useState<number>(getInitialZoom());
    const [prevMode, setPrevMode] = useState<boolean>(false);
    const [mobileTab, setMobileTab] = useState<'left' | 'canvas' | 'right'>('canvas');
    const [templateName, setTemplateName] = useState<string>('New Template');
    const [templateType, setTemplateType] = useState<string>('SCORE_BASED');
    
    const [design, setDesign] = useState({
        accentColor: '#1a7a40',
        fontFamily: 'inter',
        layoutCols: 3,
        showCols: { score: true, grade: true, gpa: false, progress: true, remark: true },
        schoolName: '',
        schoolAddress: '',
        reportBadge: '',
        logoText: 'SP',
        resultBorder: true
    });

    const [gradeScale, setGradeScale] = useState([
        { label: 'A+', min: 90, max: 100, bg: '#e6f9ef', fg: '#1a7a40' },
        { label: 'A', min: 80, max: 89, bg: '#e8f2fd', fg: '#185FA5' },
        { label: 'B', min: 70, max: 79, bg: '#e8f2fd', fg: '#185FA5' },
        { label: 'C', min: 60, max: 69, bg: '#fff8e1', fg: '#a06000' },
        { label: 'D', min: 50, max: 59, bg: '#fff8e1', fg: '#a06000' },
        { label: 'F', min: 0, max: 49, bg: '#fdecea', fg: '#c0392b' },
    ]);

    const [studentFields, setStudentFields] = useState(['Student Name', 'Class', 'Academic Year', 'Student ID', 'Term', 'Date Issued', 'Next Term Begins', 'Term Ends', 'Age', 'Gender', 'Club & Society']);

    // Derived pools
    const toggles = globalSettings?.schoolSettings?.resultConfig?.display || {};
    
    // Toggled-on Student Fields that are NOT in active list
    const poolFields = [
        toggles.showStudentName !== false ? 'Student Name' : null,
        toggles.showClass !== false ? 'Class' : null,
        toggles.showAcademicYear !== false ? 'Academic Year' : null,
        toggles.showStudentId !== false ? 'Student ID' : null,
        toggles.showTerm !== false ? 'Term' : null,
        toggles.showDateIssued !== false ? 'Date Issued' : null,
        toggles.showGender ? 'Gender' : null,
        toggles.showAge ? 'Age' : null,
        toggles.showClub ? 'Club & Society' : null,
        toggles.showNextTermBegins ? 'Next Term Begins' : null,
        toggles.showTermEnds ? 'Term Ends' : null
    ].filter(Boolean) as string[];
    const availableFields = poolFields.filter(f => !studentFields.includes(f));

    // Toggled-on Blocks that are NOT in active list
    const poolBlocks = [
        'SchoolHeaderBlock', 'StudentInfoBlock', 'SubjectResultsBlock', 'SignaturesBlock', // Always available
        toggles.showTraitRatings ?? true ? 'TraitRatingsBlock' : null,
        toggles.showAttendance ?? true ? 'AttendanceBlock' : null,
        toggles.showNarrative ?? true ? 'NarrativeCommentsBlock' : null,
        'RemarksBlock',
        toggles.showAcademicSummaryCards ?? true ? 'AcademicSummaryBlock' : null,
        'CommentHeaderBlock', 'CommentStudentInfoBlock', 'CommentSkillsGridBlock', 'CommentNarrativeBlock', 'CommentSignaturesBlock'
    ].filter(Boolean) as string[];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        axios.get(`${API}/school-settings/result-config/unified`, { withCredentials: true })
            .then(res => setGlobalSettings(res.data))
            .catch(console.error);

        axios.get(`${API}/results/templates`, { withCredentials: true })
            .then(res => {
                if (res.data.templates) {
                    setTemplates(res.data.templates);
                    if (initialTemplateId) {
                        const target = res.data.templates.find((t: any) => t.id === initialTemplateId);
                        if (target) loadTemplate(target);
                    }
                }
            })
            .catch(console.error);
    }, [API, initialTemplateId]);

    const loadTemplate = (tmpl: any) => {
        setSelectedTemplate(tmpl);
        setTemplateName(tmpl.name || 'Untitled Template');
        setTemplateType(tmpl.resultType || 'SCORE_BASED');
        setBlocks(tmpl.config?.blocks || []);
        if (tmpl.config?.design) {
            setDesign({ ...design, ...tmpl.config.design });
        }
        if (tmpl.config?.gradeScale) {
            setGradeScale(tmpl.config.gradeScale);
        }
        if (tmpl.config?.studentFields) {
            setStudentFields(tmpl.config.studentFields);
        }
        setActiveBlockId(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && over.id === 'sidebar-trash') {
            setBlocks((items) => items.filter(i => i.id !== active.id));
            if (activeBlockId === active.id) setActiveBlockId(null);
            return;
        }

        if (over && active.id !== over.id) {
            if (String(active.id).startsWith('field-') && String(over.id).startsWith('field-')) {
                setStudentFields((items) => {
                    const oldIndex = items.findIndex((i) => `field-${i}` === active.id);
                    const newIndex = items.findIndex((i) => `field-${i}` === over.id);
                    return arrayMove(items, oldIndex, newIndex);
                });
                return;
            }

            setBlocks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const deleteBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
        if (activeBlockId === id) setActiveBlockId(null);
    };

    const toggleVisibility = (id: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, isVisible: !b.isVisible } : b));
    };

    const handleSave = async () => {
        if (!templateName.trim()) { alert("Please enter a template name."); return; }
        setSaving(true);
        try {
            if (selectedTemplate) {
                await axios.put(`${API}/results/template/${selectedTemplate.id}`, {
                    name: templateName,
                    resultType: templateType,
                    config: { ...selectedTemplate.config, blocks, design, gradeScale, studentFields }
                }, { withCredentials: true });
            } else {
                const res = await axios.post(`${API}/results/template`, {
                    name: templateName,
                    resultType: templateType,
                    config: { blocks, design, gradeScale, studentFields }
                }, { withCredentials: true });
                setSelectedTemplate(res.data.template);
            }
            alert("Template saved successfully!");
        } catch (err: any) {
            console.error(err);
            alert(`Failed to save template: ${err.response?.data?.msg || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAsNew = async () => {
        const newName = prompt("Enter a name for the new template:", templateName + " Copy");
        if (!newName || !newName.trim()) return;
        setSaving(true);
        try {
            const res = await axios.post(`${API}/results/template`, {
                name: newName,
                resultType: templateType,
                config: { blocks, design, gradeScale, studentFields }
            }, { withCredentials: true });
            setSelectedTemplate(res.data.template);
            setTemplateName(newName);
            alert("New template saved successfully!");
        } catch (err: any) {
            console.error(err);
            alert(`Failed to save template: ${err.response?.data?.msg || err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const addBlock = (type: string) => {
        const newBlock = { id: `b-${Date.now()}`, type, isVisible: true, props: {} };
        setBlocks([...blocks, newBlock]);
        setMobileTab('canvas');
    };

    const updateBlockProps = (id: string, props: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, props: { ...b.props, ...props } } : b));
    };

    const activeBlock = blocks.find(b => b.id === activeBlockId);

    const handleZoom = (dir: number) => {
        const steps = [40, 50, 60, 75, 90, 100, 115, 130];
        let i = steps.indexOf(zoomLvl);
        if (i === -1) i = 3;
        i = Math.max(0, Math.min(steps.length - 1, i + dir));
        setZoomLvl(steps[i]);
    };

    const previewData = {
        ...DUMMY_REPORT_DATA,
        school: {
            ...DUMMY_REPORT_DATA.school,
            name: design.schoolName || globalSettings?.schoolSettings?.schoolName || DUMMY_REPORT_DATA.school.name,
            address: design.schoolAddress || globalSettings?.schoolSettings?.address || DUMMY_REPORT_DATA.school.address,
            logoText: design.logoText
        },
        commentBasedSettings: globalSettings?.schoolSettings?.resultConfig?.commentBasedSettings,
        gradeScale,
        studentFields
    };

    if (!globalSettings) {
        return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Loading editor...</div>;
    }

    return (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden bg-white text-gray-800" style={{ fontFamily: 'Inter, sans-serif' }}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            
            <SidebarDroppable className={`${mobileTab === 'left' ? 'flex fixed inset-y-0 left-0 z-50 w-64 shadow-2xl' : 'hidden'} md:flex md:static md:z-auto flex-1 md:flex-none w-full md:w-64 bg-white border-r border-gray-200 flex-col shrink-0`}>
                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sidebar className="w-4 h-4 text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Template Sections</span>
                    </div>
                    <button onClick={() => setMobileTab('canvas')} className="md:hidden p-1 hover:bg-gray-100 rounded text-gray-500"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="flex p-2 gap-1 border-b border-gray-200">
                    <button onClick={() => setLtabSel('sections')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${ltabSel==='sections'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Sections</button>
                    <button onClick={() => setLtabSel('layout')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${ltabSel==='layout'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Layout</button>
                    <button onClick={() => setLtabSel('branding')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${ltabSel==='branding'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Branding</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {ltabSel === 'sections' && (
                        <>
                            <div className="space-y-1">
                                {blocks.map((b, i) => (
                                    <div key={b.id} onClick={() => { setActiveBlockId(b.id); setRtabSel('block'); }} className={`flex items-center justify-between p-2 rounded cursor-pointer text-xs transition-colors ${activeBlockId === b.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="w-3 h-3 text-gray-300" />
                                            {BLOCK_REGISTRY[b.type]?.label || b.type}
                                        </div>
                                        <Switch checked={b.isVisible} onCheckedChange={() => toggleVisibility(b.id)} className="scale-75" />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Available Blocks</p>
                                
                                {Object.entries(BLOCK_REGISTRY).filter(([type]) => !type.startsWith('Comment') && poolBlocks.includes(type)).length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded inline-block uppercase mb-2">Score-Based</p>
                                        <div className="space-y-1">
                                            {Object.entries(BLOCK_REGISTRY).filter(([type]) => !type.startsWith('Comment') && poolBlocks.includes(type)).map(([type, {label}]) => (
                                                <button key={type} onClick={() => addBlock(type)} className="flex items-center justify-between w-full p-2 text-[11px] font-medium text-gray-500 bg-white border border-gray-200 border-dashed rounded hover:border-blue-300 hover:text-blue-600 transition-colors">
                                                    {label} <Plus className="w-3 h-3" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {Object.entries(BLOCK_REGISTRY).filter(([type]) => type.startsWith('Comment') && poolBlocks.includes(type)).length > 0 && (
                                    <div>
                                        <p className="text-[9px] font-bold text-purple-500 bg-purple-50 px-2 py-1 rounded inline-block uppercase mb-2">Comment-Based</p>
                                        <div className="space-y-1">
                                            {Object.entries(BLOCK_REGISTRY).filter(([type]) => type.startsWith('Comment') && poolBlocks.includes(type)).map(([type, {label}]) => (
                                                <button key={type} onClick={() => addBlock(type)} className="flex items-center justify-between w-full p-2 text-[11px] font-medium text-gray-500 bg-white border border-gray-200 border-dashed rounded hover:border-purple-300 hover:text-purple-600 transition-colors">
                                                    {label.replace('Comment ', '')} <Plus className="w-3 h-3" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {ltabSel === 'layout' && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-[11px] text-gray-500 mb-2">Overall Template Layout</p>
                                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                    <span className="text-xs text-gray-700">Result Border</span>
                                    <Switch checked={design.resultBorder} onCheckedChange={(val) => setDesign({...design, resultBorder: val})} className="scale-75" />
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-[11px] text-gray-500 mb-2">Student info band columns</p>
                                <div className="flex gap-2">
                                    {[2,3,4].map(cols => (
                                        <button key={cols} onClick={() => setDesign({...design, layoutCols: cols})} className={`flex-1 flex flex-col items-center gap-1 p-2 rounded border text-[11px] transition-colors ${design.layoutCols === cols ? 'border-gray-800 bg-gray-100 text-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                            {cols} col
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-[11px] text-gray-500 mb-3">Show/hide columns in grades table</p>
                                {Object.entries({score:'Score', grade:'Grade',  progress:'Progress bar', remark:'Remarks'}).map(([k,v]) => (
                                    <div key={k} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                                        <span className="text-xs text-gray-700">{v}</span>
                                        <Switch checked={(design.showCols as any)[k]} onCheckedChange={(val) => setDesign({...design, showCols: {...design.showCols, [k]: val}})} className="scale-75" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {ltabSel === 'branding' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-medium text-gray-600 mb-1 block">School name override</label>
                                <input type="text" value={design.schoolName} onChange={e => setDesign({...design, schoolName: e.target.value})} placeholder="Use default" className="w-full text-xs p-2 border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-gray-600 mb-1 block">Address / contact line</label>
                                <input type="text" value={design.schoolAddress} onChange={e => setDesign({...design, schoolAddress: e.target.value})} placeholder="Use default" className="w-full text-xs p-2 border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-gray-600 mb-1 block">Report type label</label>
                                <input type="text" value={design.reportBadge} onChange={e => setDesign({...design, reportBadge: e.target.value})} placeholder="ACADEMIC PROGRESS REPORT" className="w-full text-xs p-2 border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-gray-600 mb-1 block">Logo initials</label>
                                <input type="text" value={design.logoText} onChange={e => setDesign({...design, logoText: e.target.value})} maxLength={3} className="w-full text-xs p-2 border border-gray-200 rounded w-16" />
                            </div>
                            <div>
                                <label className="text-[11px] font-medium text-gray-600 mb-2 block">Accent color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c, i) => (
                                        <div key={i} onClick={() => setDesign({...design, accentColor: c.hex})} className={`w-6 h-6 rounded cursor-pointer border-2 transition-all ${design.accentColor === c.hex ? 'border-gray-900 scale-110' : 'border-transparent'}`} style={{background: c.hex}}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </SidebarDroppable>

            <div className={`flex flex-col flex-1 bg-gray-100 min-w-0 relative h-full`}>
                <div className="min-h-[56px] py-2 bg-white border-b border-gray-200 flex flex-wrap items-center px-2 md:px-4 justify-between shrink-0 gap-y-2">
                    <div className="flex items-center gap-1 md:gap-2 font-semibold text-[13px] text-gray-800 w-full sm:w-auto flex-1">
                        <button onClick={() => setMobileTab('left')} className="md:hidden p-1 hover:bg-gray-100 rounded text-gray-600 shrink-0">
                            <Menu className="w-5 h-5" />
                        </button>
                        <Zap className="w-4 h-4 text-gray-400 shrink-0 hidden sm:block" /> 
                        <input 
                            value={templateName}
                            onChange={e => setTemplateName(e.target.value)}
                            className="bg-transparent border-none outline-none font-semibold text-[13px] text-gray-800 focus:ring-0 p-0 hover:bg-gray-50 rounded min-w-0 flex-1 max-w-[200px]"
                            placeholder="Template Name"
                        />
                        <select 
                            value={templateType} 
                            onChange={e => setTemplateType(e.target.value)}
                            className="text-[11px] font-medium border border-gray-200 rounded p-1 bg-white outline-none"
                        >
                            <option value="SCORE_BASED">Score Based</option>
                            <option value="COMMENT_BASED">Comment Based</option>
                            <option value="TRANSCRIPT">Transcript</option>
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                        <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-0.5 shrink-0">
                            <button onClick={() => handleZoom(-1)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Minus className="w-3 h-3" /></button>
                            <span className="text-[11px] w-8 md:w-10 text-center font-medium text-gray-600">{zoomLvl}%</span>
                            <button onClick={() => handleZoom(1)} className="p-1 hover:bg-gray-200 rounded text-gray-500"><Plus className="w-3 h-3" /></button>
                        </div>
                        
                        <div className="w-px h-4 bg-gray-300 hidden sm:block shrink-0"></div>
                        
                        <div className="hidden md:flex gap-2">
                            <Button variant={prevMode ? 'default' : 'outline'} size="sm" onClick={() => {setPrevMode(!prevMode); setActiveBlockId(null);}} className={`h-8 text-xs px-2 md:px-3 shrink-0 ${prevMode ? 'bg-[#0036a1] text-white' : ''}`}>
                                <Eye className="w-3 h-3 mr-2" /> <span>Preview</span>
                            </Button>
                            <Button onClick={handleSave} disabled={saving} size="sm" className="h-8 text-xs px-3 md:px-4 shrink-0 bg-[#0036a1] hover:bg-[#001761]">
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto pb-16 md:pb-0" onClick={() => !prevMode && setActiveBlockId(null)}>
                    <div className="p-4 md:p-8 flex justify-center min-w-full">
                        <div style={{ width: 794 * (zoomLvl / 100), minHeight: 1123 * (zoomLvl / 100) }} className="relative shrink-0 mx-auto">
                            <div 
                                className="bg-white shadow-lg overflow-hidden transition-transform duration-200 origin-top-left absolute top-0 left-0" 
                                style={{ width: '794px', minHeight: '1123px', transform: `scale(${zoomLvl / 100})` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                        <div className="p-8">
                            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                {blocks.map((block) => (
                                    <SortableCanvasBlock 
                                        key={block.id} 
                                        block={block} 
                                        isActive={activeBlockId === block.id} 
                                        onSelect={() => { if(!prevMode) { setActiveBlockId(block.id); setRtabSel('block'); if (window.innerWidth < 768) setMobileTab('right'); } }} 
                                        prevMode={prevMode}
                                        design={design}
                                        data={previewData}
                                        globalSettings={globalSettings}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </div>
                </div>
            </div>
            </div>
                
                {!prevMode && mobileTab !== 'right' && (
                    <button onClick={() => setMobileTab('right')} className="md:hidden absolute bottom-20 right-4 w-12 h-12 bg-[#0036a1] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#001761] transition-colors z-30">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Button variant={prevMode ? 'default' : 'outline'} size="sm" onClick={() => {setPrevMode(!prevMode); setActiveBlockId(null);}} className={`flex-1 h-10 ${prevMode ? 'bg-[#0036a1] text-white' : ''}`}>
                    <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1 h-10 bg-[#0036a1] hover:bg-[#001761]">
                    <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
                </Button>
                {activeBlockId && !prevMode && (
                    <Button variant="outline" onClick={() => { deleteBlock(activeBlockId); setActiveBlockId(null); setMobileTab('canvas'); }} className="flex-none w-10 p-0 text-red-600 hover:text-red-700 border-red-200">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {mobileTab === 'right' && <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setMobileTab('canvas')}></div>}
            {mobileTab === 'left' && <div className="md:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setMobileTab('canvas')}></div>}

            <div className={`${mobileTab === 'right' ? 'flex fixed inset-y-0 right-0 z-50 w-full sm:w-80 shadow-2xl' : 'hidden'} md:flex md:static md:z-auto flex-col flex-1 md:flex-none w-full md:w-60 bg-white border-l border-gray-200 h-full shrink-0 overflow-y-auto`}>
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Properties</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setMobileTab('canvas')} className="md:hidden p-1 hover:bg-gray-200 rounded text-gray-500 mr-1"><X className="w-4 h-4" /></button>
                        {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="h-6 text-[10px] px-2">Close</Button>}
                        <Button onClick={handleSave} disabled={saving} size="sm" className="h-6 text-[10px] px-2 bg-[#0036a1] hover:bg-[#001761]">
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                <div className="flex p-2 gap-1 border-b border-gray-200">
                    <button onClick={() => setRtabSel('block')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${rtabSel==='block'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Block</button>
                    <button onClick={() => setRtabSel('grade')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${rtabSel==='grade'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Grades</button>
                    <button onClick={() => setRtabSel('fields')} className={`flex-1 py-1.5 text-[11px] rounded transition-colors ${rtabSel==='fields'?'bg-gray-100 text-gray-900 font-medium':'text-gray-500 hover:bg-gray-50'}`}>Fields</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {rtabSel === 'grade' && (
                        <div className="space-y-4">
                            <p className="text-[11px] text-gray-500 mb-2">Define grade boundaries, labels, and colors.</p>
                            
                            <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                <span>Label</span>
                                <span>Min %</span>
                                <span>Max %</span>
                                <span>Color</span>
                            </div>

                            <div className="space-y-2">
                                {gradeScale.map((g, i) => (
                                    <div key={i} className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center">
                                        <input type="text" value={g.label} onChange={e => {const n=[...gradeScale];n[i].label=e.target.value;setGradeScale(n);}} className="w-full text-xs p-1.5 border border-gray-200 rounded text-center font-bold" />
                                        <input type="number" value={g.min} onChange={e => {const n=[...gradeScale];n[i].min=+e.target.value;setGradeScale(n);}} className="w-full text-xs p-1.5 border border-gray-200 rounded" />
                                        <input type="number" value={g.max} onChange={e => {const n=[...gradeScale];n[i].max=+e.target.value;setGradeScale(n);}} className="w-full text-xs p-1.5 border border-gray-200 rounded" />
                                        <div className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px]" style={{background: g.bg, color: g.fg}}>{g.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {rtabSel === 'fields' && (
                        <div className="space-y-6">
                            <div>
                                <p className="text-[11px] text-gray-500 mb-3">Selected Fields (Drag to reorder)</p>
                                <div className="space-y-2">
                                    <SortableContext items={studentFields.map(f => `field-${f}`)} strategy={verticalListSortingStrategy}>
                                        {studentFields.map((f) => (
                                            <SortableField key={`field-${f}`} field={f} onRemove={() => setStudentFields(studentFields.filter(x => x !== f))} />
                                        ))}
                                    </SortableContext>
                                </div>
                            </div>
                            
                            {availableFields.length > 0 && (
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Fields</p>
                                    <div className="space-y-2">
                                        {availableFields.map(f => (
                                            <button key={f} onClick={() => setStudentFields([...studentFields, f])} className="flex items-center justify-between w-full p-2 text-[11px] font-medium text-gray-500 bg-white border border-gray-200 border-dashed rounded hover:border-blue-300 hover:text-blue-600 transition-colors">
                                                {f} <Plus className="w-3 h-3" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {rtabSel === 'block' && (
                        activeBlock ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                                    <Settings2 className="w-4 h-4" style={{color: design.accentColor}} />
                                    <h4 className="font-bold text-sm text-gray-900">{BLOCK_REGISTRY[activeBlock.type]?.label}</h4>
                                </div>
                                
                                <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                    <span className="text-xs font-medium text-gray-700">Block Visible</span>
                                    <Switch checked={activeBlock.isVisible} onCheckedChange={() => toggleVisibility(activeBlock.id)} className="scale-75" />
                                </label>

                                <div className="space-y-3 pt-2 border-b border-gray-100 pb-4">
                                    <label className="text-[11px] font-medium text-gray-600 mb-1 block">Custom Title</label>
                                    <input type="text" value={activeBlock.props?.title || ''} onChange={e => updateBlockProps(activeBlock.id, {title: e.target.value})} placeholder="Default" className="w-full text-xs p-2 border border-gray-200 rounded" />
                                </div>
                                
                                <div className="space-y-3 pt-2">
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Block Styling</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-600 mb-1 block">Border Color</label>
                                            <div className="flex gap-1 items-center border border-gray-200 rounded p-1">
                                                <input type="color" value={activeBlock.props?.borderColor || '#000000'} onChange={e => updateBlockProps(activeBlock.id, {borderColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                <input type="text" value={activeBlock.props?.borderColor || '#000000'} onChange={e => updateBlockProps(activeBlock.id, {borderColor: e.target.value})} className="w-full text-[10px] p-1 border-none outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-600 mb-1 block">Text Color</label>
                                            <div className="flex gap-1 items-center border border-gray-200 rounded p-1">
                                                <input type="color" value={activeBlock.props?.textColor || '#000000'} onChange={e => updateBlockProps(activeBlock.id, {textColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                                                <input type="text" value={activeBlock.props?.textColor || '#000000'} onChange={e => updateBlockProps(activeBlock.id, {textColor: e.target.value})} className="w-full text-[10px] p-1 border-none outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {activeBlock.type === 'SchoolHeaderBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <div>
                                            <label className="text-[10px] font-medium text-gray-600 mb-1 block">Header Alignment</label>
                                            <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
                                                <button 
                                                    onClick={() => updateBlockProps(activeBlock.id, {headerLayoutMode: 'LEFT'})} 
                                                    className={`p-1.5 rounded-md transition-colors ${(activeBlock.props?.headerLayoutMode || toggles.headerLayoutMode || 'LEFT') === 'LEFT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                                                    title="Align Left"
                                                >
                                                    <AlignLeft className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => updateBlockProps(activeBlock.id, {headerLayoutMode: 'CENTER'})} 
                                                    className={`p-1.5 rounded-md transition-colors ${(activeBlock.props?.headerLayoutMode || toggles.headerLayoutMode) === 'CENTER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                                                    title="Align Center"
                                                >
                                                    <AlignCenter className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => updateBlockProps(activeBlock.id, {headerLayoutMode: 'RIGHT'})} 
                                                    className={`p-1.5 rounded-md transition-colors ${(activeBlock.props?.headerLayoutMode || toggles.headerLayoutMode) === 'RIGHT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                                                    title="Align Right"
                                                >
                                                    <AlignRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Arabic School Name</span>
                                            <Switch checked={activeBlock.props?.arabicSchoolName ?? toggles.showArabicName ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {arabicSchoolName: val})} className="scale-75" />
                                        </label>
                                    </div>
                                )}

                                {activeBlock.type === 'CommentHeaderBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Highlight Word</label>
                                            <input 
                                                type="text" 
                                                className="w-full text-xs p-2 border border-gray-200 rounded" 
                                                value={activeBlock.props?.highlightWord || 'BASIC'} 
                                                onChange={(e) => updateBlockProps(activeBlock.id, {highlightWord: e.target.value})}
                                                placeholder="e.g. BASIC"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Highlight Colors (Comma separated)</label>
                                            <input 
                                                type="text" 
                                                className="w-full text-xs p-2 border border-gray-200 rounded" 
                                                value={activeBlock.props?.highlightColors || '#185FA5,#E32636,#800080,#4169E1,#E32636'} 
                                                onChange={(e) => updateBlockProps(activeBlock.id, {highlightColors: e.target.value})}
                                                placeholder="e.g. red,blue,green"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Arabic Header Text</label>
                                            <textarea 
                                                className="w-full text-xs p-2 border border-gray-200 rounded text-right font-arabic" 
                                                rows={2}
                                                value={activeBlock.props?.arabicSchoolName || 'مدرسة البينة الأساسية وتحفيظ\nالقرآن'} 
                                                onChange={(e) => updateBlockProps(activeBlock.id, {arabicSchoolName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(activeBlock.type === 'NarrativeCommentsBlock' || activeBlock.type === 'CommentNarrativeBlock') && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <p className="text-xs text-gray-500 italic px-2">This block displays narrative reports.</p>
                                    </div>
                                )}

                                {activeBlock.type === 'RemarksBlock' && (() => {
                                    const rawSigs = globalSettings?.schoolSettings?.resultConfig?.signatures || {};
                                    let dynamicSigs: any[] = [];
                                    if (rawSigs && !Array.isArray(rawSigs) && (rawSigs['ALL'] || Object.values(rawSigs).some(Array.isArray))) {
                                        dynamicSigs = rawSigs['ALL'] || Object.values(rawSigs).find(Array.isArray) || [];
                                    } else if (Array.isArray(rawSigs) && rawSigs.length > 0) {
                                        dynamicSigs = rawSigs;
                                    } else if (rawSigs && typeof rawSigs === 'object') {
                                        if (rawSigs.showSignature1) dynamicSigs.push({ roleName: rawSigs.signature1Label || 'Class Teacher' });
                                        if (rawSigs.showSignature2) dynamicSigs.push({ roleName: rawSigs.signature2Label || 'Principal' });
                                        if (rawSigs.showSignature3) dynamicSigs.push({ roleName: rawSigs.signature3Label || 'Director' });
                                    }
                                    if (dynamicSigs.length === 0) {
                                        dynamicSigs = [{ roleName: 'Class Teacher' }, { roleName: 'Principal' }];
                                    }

                                    return (
                                        <div className="pt-2 border-t border-gray-100 space-y-3">
                                            <div className="px-2">
                                                <span className="text-xs font-medium text-gray-700 block mb-2">Remarks Layout</span>
                                                <div className="flex bg-gray-100 p-1 rounded-md">
                                                    <button
                                                        className={`flex-1 text-xs py-1.5 rounded transition-all ${activeBlock.props?.remarkLayoutMode === 'ROW' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                                                        onClick={() => updateBlockProps(activeBlock.id, { remarkLayoutMode: 'ROW' })}
                                                    >
                                                        Row
                                                    </button>
                                                    <button
                                                        className={`flex-1 text-xs py-1.5 rounded transition-all ${activeBlock.props?.remarkLayoutMode !== 'ROW' ? 'bg-white shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                                                        onClick={() => updateBlockProps(activeBlock.id, { remarkLayoutMode: 'COLUMN' })}
                                                    >
                                                        Column
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {dynamicSigs.map((sig, idx) => {
                                                    const role = sig.roleName || sig.role || sig.label;
                                                    return (
                                                        <label key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                                            <span className="text-xs font-medium text-gray-700">{role} Remark</span>
                                                            <Switch checked={activeBlock.props?.[`hideRemark_${role}`] !== true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, { [`hideRemark_${role}`]: !val })} className="scale-75" />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {activeBlock.type === 'StudentInfoBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Student Picture</span>
                                            <Switch checked={activeBlock.props?.studentPicture ?? toggles.showStudentPicture ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {studentPicture: val})} className="scale-75" />
                                        </label>
                                    </div>
                                )}

                                {activeBlock.type === 'TraitRatingsBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Trait Ratings Scale</span>
                                            <Switch checked={activeBlock.props?.traitRatingsScale ?? toggles.showTraitScale ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {traitRatingsScale: val})} className="scale-75" />
                                        </label>
                                    </div>
                                )}

                                {activeBlock.type === 'SubjectResultsBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <p className="text-[11px] text-gray-500 mb-2">Subject Columns</p>
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Highest Average</span>
                                            <Switch checked={activeBlock.props?.highestAverageInSubject ?? toggles.showHighestAvgSubj ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {highestAverageInSubject: val})} className="scale-75" />
                                        </label>
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Lowest Average</span>
                                            <Switch checked={activeBlock.props?.lowestAverageInSubject ?? toggles.showLowestAvgSubj ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {lowestAverageInSubject: val})} className="scale-75" />
                                        </label>
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Class Average</span>
                                            <Switch checked={activeBlock.props?.classAverage ?? toggles.showClassAverage ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {classAverage: val})} className="scale-75" />
                                        </label>
                                        <label className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                            <span className="text-xs font-medium text-gray-700">Subject Position</span>
                                            <Switch checked={activeBlock.props?.subjectPosition ?? toggles.showSubjectPosition ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {subjectPosition: val})} className="scale-75" />
                                        </label>
                                    </div>
                                )}

                                {activeBlock.type === 'AcademicSummaryBlock' && (
                                    <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <p className="text-[11px] text-gray-500 mb-2">Summary Stats Cards</p>
                                        {[
                                            { key: 'finalAverage', label: 'Final Average' },
                                            { key: 'finalGrade', label: 'Final Grade' },
                                            { key: 'outOf', label: 'Out of (Max Score)' },
                                            { key: 'highestAverageInClass', label: 'Highest Average' },
                                            { key: 'lowestAverageInClass', label: 'Lowest Average' },
                                            { key: 'totalStudentsInClass', label: 'Total Students' },
                                            { key: 'coreSubjectsPassed', label: 'Core Passed' },
                                            { key: 'coreSubjectsFailed', label: 'Core Failed' },
                                            { key: 'electiveSubjectsPassed', label: 'Elective Passed' },
                                            { key: 'electiveSubjectsFailed', label: 'Elective Failed' },
                                            { key: 'totalSubjectsOffered', label: 'Total Subjects' }
                                        ].map(stat => (
                                            <label key={stat.key} className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                                <span className="text-xs font-medium text-gray-700">{stat.label}</span>
                                                <Switch checked={activeBlock.props?.[stat.key] ?? true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, {[stat.key]: val})} className="scale-75" />
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {activeBlock.type === 'SignaturesBlock' && (() => {
                                    const rawSigs = globalSettings?.schoolSettings?.resultConfig?.signatures || {};
                                    let dynamicSigs: any[] = [];
                                    if (rawSigs && !Array.isArray(rawSigs) && (rawSigs['ALL'] || Object.values(rawSigs).some(Array.isArray))) {
                                        dynamicSigs = rawSigs['ALL'] || Object.values(rawSigs).find(Array.isArray) || [];
                                    } else if (Array.isArray(rawSigs) && rawSigs.length > 0) {
                                        dynamicSigs = rawSigs;
                                    } else if (rawSigs && typeof rawSigs === 'object') {
                                        if (rawSigs.showSignature1) dynamicSigs.push({ roleName: rawSigs.signature1Label || 'Class Teacher' });
                                        if (rawSigs.showSignature2) dynamicSigs.push({ roleName: rawSigs.signature2Label || 'Principal' });
                                        if (rawSigs.showSignature3) dynamicSigs.push({ roleName: rawSigs.signature3Label || 'Director' });
                                    }
                                    if (dynamicSigs.length === 0) {
                                        dynamicSigs = [{ roleName: 'Principal' }];
                                    }

                                    return (
                                        <div className="pt-2 border-t border-gray-100 space-y-3">
                                            <div>
                                                <label className="text-[11px] font-medium text-gray-600 mb-1 block">Footer Note</label>
                                                <input type="text" value={activeBlock.props?.footNote || ''} onChange={e => updateBlockProps(activeBlock.id, {footNote: e.target.value})} placeholder="Computer-generated result. Valid without a stamp." className="w-full text-xs p-2 border border-gray-200 rounded" />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {dynamicSigs.map((sig, idx) => {
                                                    const role = sig.roleName || sig.role || sig.label;
                                                    return (
                                                        <label key={idx} className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50">
                                                            <span className="text-xs font-medium text-gray-700">{role} Signature</span>
                                                            <Switch checked={activeBlock.props?.[`hideSignature_${role}`] !== true} onCheckedChange={(val) => updateBlockProps(activeBlock.id, { [`hideSignature_${role}`]: !val })} className="scale-75" />
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <Button variant="outline" onClick={() => deleteBlock(activeBlock.id)} className="w-full mt-4 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8">
                                    <Trash2 className="w-3 h-3 mr-2" /> Delete Block
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2">
                                <Settings2 className="w-8 h-8 opacity-20" />
                                <p className="text-xs font-semibold">No Block Selected</p>
                                <p className="text-[10px]">Click a block on the canvas to view its properties.</p>
                            </div>
                        )
                    )}
                </div>

                {selectedTemplate && (
                    <div className="p-3 border-t border-gray-200 bg-gray-50 shrink-0">
                        <Button onClick={handleSaveAsNew} disabled={saving} variant="outline" className="w-full h-8 text-[11px] font-semibold bg-white">
                            <Plus className="w-3 h-3 mr-2" /> Save as New Template
                        </Button>
                    </div>
                )}
            </div>
            
            </DndContext>
        </div>
    );
}
