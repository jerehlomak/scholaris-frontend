import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface EditInvoiceModalProps {
    invoice: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditInvoiceModal({ invoice, onClose, onSuccess }: EditInvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [dueDate, setDueDate] = useState("");
    const [items, setItems] = useState<{ id: string; label: string; quantity: number; unitPrice: number }[]>([]);

    useEffect(() => {
        if (invoice) {
            setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "");
            if (invoice.items) {
                setItems(invoice.items.map((it: any) => ({
                    id: Math.random().toString(),
                    label: it.label,
                    quantity: it.quantity || 1,
                    unitPrice: it.unitPrice || it.amount
                })));
            }
        }
    }, [invoice]);

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), label: "New Item", quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length <= 1) {
            toast.error("Invoice must have at least one item.");
            return;
        }
        setItems(items.filter(it => it.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`/api/v1/finance-v2/invoices/${invoice.id}`, { items, dueDate }, { withCredentials: true });
            toast.success("Invoice updated successfully");
            onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.msg || "Failed to update invoice");
        } finally {
            setLoading(false);
        }
    };

    const subTotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice)), 0);
    const discount = invoice?.discountTotal || 0;
    const total = Math.max(0, subTotal - discount);

    return (
        <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Invoice {invoice?.invoiceNumber}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Due Date</label>
                            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-semibold text-slate-500 block">Line Items</label>
                        {items.map((it, idx) => (
                            <div key={it.id} className="flex items-center gap-2">
                                <Input className="flex-1 text-sm" value={it.label} onChange={e => updateItem(it.id, "label", e.target.value)} required placeholder="Item description" />
                                <Input className="w-20 text-sm text-right" type="number" min="1" step="1" value={it.quantity} onChange={e => updateItem(it.id, "quantity", e.target.value)} required placeholder="Qty" />
                                <Input className="w-32 text-sm text-right" type="number" min="0" step="any" value={it.unitPrice} onChange={e => updateItem(it.id, "unitPrice", e.target.value)} required placeholder="Unit Price" />
                                <button type="button" onClick={() => removeItem(it.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2 text-xs h-8">
                            <Plus className="h-3 w-3 mr-1" /> Add Item
                        </Button>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 mt-6">
                        <div className="flex justify-between text-sm mb-1 text-slate-500">
                            <span>Subtotal:</span>
                            <span>₦{subTotal.toLocaleString()}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm mb-1 text-emerald-600">
                                <span>Discount/Scholarship:</span>
                                <span>-₦{discount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-slate-900 mt-2 pt-2 border-t border-slate-200">
                            <span>Total Due:</span>
                            <span>₦{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}