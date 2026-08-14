import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ManageSubjects() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 max-w-6xl mx-auto">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-semibold text-dash-dark">Subjects</span>
                    <span>/</span>
                    <span>Manage Subjects</span>
                </div>

                {/* Top Action Buttons */}
                <div className="flex gap-3">
                    <Button onClick={() => navigate(-1)} variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-100 rounded-full px-6 h-9 transition-colors flex items-center gap-2 font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </div>
            </div>

            {/* Title Section */}
            <div className="w-full text-center mt-4 mb-4">
                <h1 className="text-3xl font-heading text-dash-dark mb-2">Manage Class Subjects</h1>
                <div className="flex items-center justify-center gap-5 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-1.5 rounded bg-[#1E4DA6]"></div>
                        <span className="text-[#1E4DA6] font-semibold">Required*</span>
                    </div>
                </div>
            </div>

            <form className="bg-transparent flex flex-col gap-10" onSubmit={(e) => e.preventDefault()}>

                {/* 1. Class Selection */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 rounded-full bg-dash-dark text-white flex items-center justify-center text-sm font-bold">1</div>
                        <h2 className="text-lg font-bold text-dash-dark">Select Class</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-7 border-b border-gray-200 pb-12">
                        <div className="space-y-1.5 border border-transparent">
                            <Label className="text-dash-dark font-semibold">Target Class <span className="text-[#1E4DA6]">*</span></Label>
                            <Select defaultValue="jss1a">
                                <SelectTrigger className="bg-white border-brand-teal/20 h-11 shadow-sm">
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="jss1a">JSS1A</SelectItem>
                                    <SelectItem value="jss2b">JSS2B</SelectItem>
                                    <SelectItem value="jss3c">JSS3C</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* 2. Core Subjects */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-dash-dark text-white flex items-center justify-center text-sm font-bold">2</div>
                            <h2 className="text-lg font-bold text-dash-dark">Core Subjects for JSS1A</h2>
                        </div>
                        <Button type="button" variant="outline" className="text-[#1E4DA6] border-[#1E4DA6] hover:bg-[#1E4DA6]/10 rounded-full h-8 px-4 text-xs font-bold gap-2">
                            <Copy className="w-3 h-3" /> Copy from another class
                        </Button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8 pb-12 border-b-gray-200 mb-12">

                        {/* List of existing core subjects */}
                        <div className="space-y-3">
                            {['English', 'Social Studies', 'Basic Tech', 'Civic', 'Home Economics', 'Computer Science', 'Business Studies', 'Mathematics'].map((subject) => (
                                <div key={subject} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 -mx-2 rounded transition-colors">
                                    <span className="text-gray-700 font-medium text-sm">{subject}</span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:text-red-700 rounded-md px-3">
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Add new core subject */}
                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-1.5 flex-1 w-full">
                                <Label className="text-gray-700 font-semibold text-xs">Add New Core Subject</Label>
                                <Select>
                                    <SelectTrigger className="bg-white border-gray-200 h-10 shadow-sm">
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="physics">Physics</SelectItem>
                                        <SelectItem value="chemistry">Chemistry</SelectItem>
                                        <SelectItem value="biology">Biology</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" className="h-10 px-6 rounded-md bg-[#1E4DA6] hover:bg-[#7b8dee] text-white font-bold whitespace-nowrap w-full md:w-auto">
                                Add Core Subject
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 3. Optional Subjects */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 rounded-full bg-dash-dark text-white flex items-center justify-center text-sm font-bold">3</div>
                        <h2 className="text-lg font-bold text-dash-dark">Optional Subjects for JSS1A</h2>
                    </div>

                    <div className="bg-[#1E4DA6]/8 border border-[#1E4DA6]/10 rounded-xl p-6 md:p-8 mb-12">

                        <div className="bg-white rounded-lg p-6 border border-[#1E4DA6]/10 shadow-sm mb-6 relative">
                            <div className="absolute right-4 top-4">
                                <Button variant="outline" size="sm" className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white border-none rounded-md px-3 font-semibold shadow-sm transition-colors">
                                    Remove Group
                                </Button>
                            </div>

                            <div className="space-y-3 mt-8 mb-8">
                                <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-gray-700 font-medium text-sm">French</span>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-600 hover:bg-transparent rounded-md px-0 font-medium">
                                        Remove
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 items-end border-t border-[#1E4DA6]/5 pt-5 mt-2">
                                <div className="space-y-1.5 flex-1 w-full">
                                    <Label className="text-gray-700 font-semibold text-xs text-[#122F69]">Add Subject to Group</Label>
                                    <Select>
                                        <SelectTrigger className="bg-white border-[#1E4DA6]/50 h-10 shadow-sm">
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="german">German</SelectItem>
                                            <SelectItem value="spanish">Spanish</SelectItem>
                                            <SelectItem value="art">Art & Design</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" className="h-10 px-6 rounded-md bg-[#8ceeb3] hover:bg-[#78e3a2] text-green-900 font-bold whitespace-nowrap w-full md:w-auto transition-colors">
                                    Add Subject
                                </Button>
                            </div>
                        </div>

                        {/* Add new optional group */}
                        <div className="flex flex-col md:flex-row items-end gap-4 bg-white/60 p-5 rounded-lg border border-[#1E4DA6]/10 mt-8">
                            <div className="space-y-1.5 flex-1 w-full">
                                <Label className="text-[#122F69] font-semibold text-xs">New Optional Subject Group Name</Label>
                                <Input className="bg-white border-[#1E4DA6]/10 h-10 shadow-sm" placeholder="e.g. Electives, Arts & Crafts" />
                            </div>
                            <Button type="button" className="h-10 px-6 rounded-md bg-[#67b8e8] hover:bg-[#818CF8] text-indigo-900 font-bold whitespace-nowrap w-full md:w-auto transition-colors">
                                Add New Group
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-center gap-4 pt-4 border-t border-gray-100 mt-4 py-8">
                    <Button type="button" variant="outline" className="h-12 px-8 rounded-full border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-all w-full md:w-48">
                        Cancel
                    </Button>
                    <Button type="submit" className="h-12 px-8 rounded-full bg-[#1E4DA6] hover:bg-[#3d5be8] text-white font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all w-full md:w-64">
                        Save All Subjects
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center ml-2 shrink-0">
                            <Check className="w-4 h-4" />
                        </div>
                    </Button>
                </div>

            </form>
        </div>
    );
}
