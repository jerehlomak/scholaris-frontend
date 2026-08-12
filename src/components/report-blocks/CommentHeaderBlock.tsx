import React from 'react';

export default function CommentHeaderBlock({ data, config }: { data: any, config?: any }) {
    const textColor = config?.textColor || '#166534'; // default green-800
    
    // Dynamic school info (support both template builder preview and AdminResults real data)
    const s = config?.globalSettings?.schoolSettings || data?.schoolSettings || data?.school || {};
    const arabicName = config?.arabicSchoolName || '';
    const schoolName = config?.schoolName || s.schoolName || s.name || 'School Name';
    const address = config?.address || s.address || 'Address not provided';
    const phone = config?.phone || s.phone || 'N/A';
    const website = config?.website || s.email || s.website || 'N/A';
    const logoUrl = config?.logoUrl || s.logoUrl || '/skooly-logo.png';
    const title = config?.title || 'PROGRESS REPORT CARD';

    // Highlight functionality
    const highlightWord = config?.highlightWord || 'BASIC';
    const highlightColorsStr = config?.highlightColors || '#185FA5,#E32636,#800080,#4169E1,#E32636';
    const highlightColors = highlightColorsStr.split(',').map((c: string) => c.trim());

    // Helper to render school name with highlight
    const renderSchoolName = () => {
        if (!highlightWord || !schoolName.toLowerCase().includes(highlightWord.toLowerCase())) {
            return <div className="font-extrabold text-2xl uppercase tracking-widest text-black whitespace-pre-wrap">{schoolName}</div>;
        }

        const parts = schoolName.split(new RegExp(`(${highlightWord})`, 'i'));
        return (
            <div className="font-extrabold text-2xl uppercase tracking-widest text-black flex items-center justify-center whitespace-pre-wrap">
                {parts.map((part: string, i: number) => {
                    if (part.toLowerCase() === highlightWord.toLowerCase()) {
                        return (
                            <span key={i} className="mx-2">
                                {part.split('').map((char, charIdx) => (
                                    <span key={charIdx} style={{ color: highlightColors[charIdx % highlightColors.length] }}>
                                        {char}
                                    </span>
                                ))}
                            </span>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        );
    };

    return (
        <div className="mb-2 mt-4 px-2 relative">
            {/* Arabic Name */}
            <div 
                className="text-center font-bold text-xl leading-tight whitespace-pre-line"
                style={{ color: textColor }}
            >
                {arabicName}
            </div>

            {/* Logo */}
            <div className="absolute right-6 top-0 w-24 h-24">
                {logoUrl ? (
                    <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain" />
                ) : (
                    <div className="w-20 h-20 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[10px] text-center rounded-lg">
                        School<br/>Logo
                    </div>
                )}
            </div>

            {/* School Name in English */}
            <div className="text-center mt-2">
                {renderSchoolName()}
            </div>

            {/* Contact Info */}
            <div className="text-center text-[10px] font-bold mt-1 uppercase">
                {address}
            </div>
            <div className="text-center text-[10px] font-bold uppercase">
                {phone} {website && `| ${website}`}
            </div>

            {/* Title Badge */}
            <div className="mt-4 flex justify-center">
                <div className="font-bold text-[14px] uppercase border-[3px] border-black px-8 py-2 inline-block shadow-sm tracking-wider">
                    {title}
                </div>
            </div>
        </div>
    );
}
