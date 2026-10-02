import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/** After logging in from a wall-code scan, take the person back to the sign-in page they came for. */
export function usePendingScan() {
    const nav = useNavigate();
    useEffect(() => {
        try {
            const path = sessionStorage.getItem('attendance_scan_return');
            if (path && path.startsWith('/attendance/scan')) { sessionStorage.removeItem('attendance_scan_return'); nav(path, { replace: true }); }
        } catch { /* storage unavailable */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
