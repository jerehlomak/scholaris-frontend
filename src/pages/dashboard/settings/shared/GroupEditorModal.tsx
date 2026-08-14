import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";

export interface GroupData {
    id: string;
    title: string;
}

interface GroupEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: GroupData) => void;
    initialGroup: GroupData | null;
}

export function GroupEditorModal({ isOpen, onClose, onSave, initialGroup }: GroupEditorModalProps) {
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle(initialGroup?.title || '');
        }
    }, [isOpen, initialGroup]);

    const handleSave = () => {
        if (!title.trim()) return;
        
        const groupData: GroupData = {
            id: initialGroup?.id || `g_custom_${Date.now()}`,
            title: title.trim(),
        };

        onSave(groupData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{initialGroup ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Professional Background"
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} className="bg-[#1E4DA6] hover:bg-[#13227a]">Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
