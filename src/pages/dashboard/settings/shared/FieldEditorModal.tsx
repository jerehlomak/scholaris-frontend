import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../../../components/ui/dialog";

const FIELD_TYPES = ['Text', 'Textarea', 'Number', 'Date', 'Dropdown', 'Image'];

export interface FormFieldData {
    id: string;
    label: string;
    type: 'Text' | 'Textarea' | 'Number' | 'Date' | 'Dropdown' | 'Image';
    description: string;
    isRequired: boolean;
    isVisible: boolean;
    isPermanent: boolean;
    isCustom?: boolean;
    options?: string[];
}

interface FieldEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (field: FormFieldData) => void;
    initialField?: FormFieldData | null;
}

export function FieldEditorModal({ isOpen, onClose, onSave, initialField }: FieldEditorModalProps) {
    const [label, setLabel] = useState('');
    const [type, setType] = useState('Text');
    const [description, setDescription] = useState('');
    const [isRequired, setIsRequired] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialField) {
                setLabel(initialField.label || '');
                setType(initialField.type || 'Text');
                setDescription(initialField.description || '');
                setIsRequired(initialField.isRequired || false);
                setOptions(initialField.options || []);
            } else {
                setLabel('');
                setType('Text');
                setDescription('');
                setIsRequired(false);
                setOptions([]);
            }
            setNewOption('');
        }
    }, [isOpen, initialField]);

    const handleAddOption = () => {
        if (newOption.trim() && !options.includes(newOption.trim())) {
            setOptions([...options, newOption.trim()]);
            setNewOption('');
        }
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!label.trim()) return;
        
        const fieldData: FormFieldData = {
            id: initialField?.id || `f_custom_${Date.now()}`,
            label: label.trim(),
            type: type as any,
            description: description.trim(),
            isRequired,
            isVisible: initialField ? initialField.isVisible : true,
            isPermanent: initialField ? initialField.isPermanent : false,
            isCustom: initialField ? initialField.isCustom : true,
        };

        if (type === 'Dropdown') {
            fieldData.options = options;
        }

        onSave(fieldData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Label *</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g. T-Shirt Size"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                        <select 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            disabled={initialField?.isPermanent}
                        >
                            <option value="Text">Short Text</option>
                            <option value="Textarea">Long Text (Textarea)</option>
                            <option value="Number">Number</option>
                            <option value="Date">Date</option>
                            <option value="Dropdown">Dropdown (Select)</option>
                            <option value="Image">File / Image Upload</option>
                        </select>
                        {initialField?.isPermanent && <p className="text-xs text-amber-600 mt-1">Cannot change the type of a core field.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description / Helper Text</label>
                        <textarea 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Hint shown under the field..."
                            rows={2}
                        />
                    </div>

                    {type === 'Dropdown' && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Dropdown Options</label>
                            
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-[#1a2fa0] focus:border-[#1a2fa0] sm:text-sm"
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                                    placeholder="Add an option..."
                                />
                                <Button type="button" onClick={handleAddOption} variant="secondary" size="sm">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            {options.length > 0 ? (
                                <ul className="space-y-2 mt-3">
                                    {options.map((opt, i) => (
                                        <li key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-sm">
                                            <span>{opt}</span>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveOption(i)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-slate-500 italic">No options added yet. Type and press Enter or + to add.</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center pt-2">
                        <input 
                            id="field-required"
                            type="checkbox" 
                            className="h-4 w-4 text-[#1a2fa0] focus:ring-[#1a2fa0] border-gray-300 rounded"
                            checked={isRequired}
                            onChange={(e) => setIsRequired(e.target.checked)}
                        />
                        <label htmlFor="field-required" className="ml-2 block text-sm text-gray-900">
                            Required Field
                        </label>
                    </div>
                </div>

                <DialogFooter className="mt-4 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSave} disabled={!label.trim() || (type === 'Dropdown' && options.length === 0)} className="bg-[#1a2fa0] hover:bg-[#121f6e]">
                        {initialField ? 'Save Changes' : 'Add Field'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
