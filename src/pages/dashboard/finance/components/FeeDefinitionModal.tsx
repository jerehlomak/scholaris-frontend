import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useFinanceMeta } from "../../../../hooks/useFinanceMeta";

interface FeeDefinitionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editData?: any;
    onSuccess: () => void;
}

export default function FeeDefinitionModal({ open, onOpenChange, editData, onSuccess }: FeeDefinitionModalProps) {
  const { terms: metaTerms, sessions: metaSessions } = useFinanceMeta();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        category: "TUITION",
        amount: "",
        scope: "WHOLE_SCHOOL",
        termScope: "ANNUAL",
        studentType: "BOTH",
        isCompulsory: true
    });

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name,
                category: editData.category,
                amount: editData.amount.toString(),
                scope: editData.scope,
                termScope: editData.termScope,
                studentType: editData.studentType,
                isCompulsory: editData.isCompulsory
            });
        } else {
            setFormData({
                name: "", category: "TUITION", amount: "", scope: "WHOLE_SCHOOL", termScope: "ANNUAL", studentType: "BOTH", isCompulsory: true
            });
        }
    }, [editData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData, amount: Number(formData.amount) };

        try {
            if (editData) {
                await axios.put(`/api/v1/finance-v2/fees/${editData.id}`, payload, { withCredentials: true });
                toast.success("Fee updated successfully");
            } else {
                await axios.post(`/api/v1/finance-v2/fees`, payload, { withCredentials: true });
                toast.success("Fee created successfully");
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.response?.data?.msg || "Failed to save fee definition");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editData ? "Edit Fee" : "Add New Fee"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Fee Name</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. 1st Term Tuition" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount (₦)</Label>
                            <Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TUITION">Tuition</SelectItem>
                                    <SelectItem value="EXAM">Exam</SelectItem>
                                    <SelectItem value="UNIFORM">Uniform</SelectItem>
                                    <SelectItem value="DEVELOPMENT">Development</SelectItem>
                                    <SelectItem value="CUSTOM">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Term Scope</Label>
                            <Select value={formData.termScope} onValueChange={v => setFormData({ ...formData, termScope: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ANNUAL">Annual</SelectItem>
                                    {metaTerms.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Target Students</Label>
                            <Select value={formData.studentType} onValueChange={v => setFormData({ ...formData, studentType: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BOTH">All Students</SelectItem>
                                    <SelectItem value="NEW_INTAKE">New Intakes Only</SelectItem>
                                    <SelectItem value="RETURNING">Returning Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editData ? "Save Changes" : "Create Fee"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
