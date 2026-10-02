import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import type { Audience, ClassOption, IdCardConfig, SchoolInfo } from './types';
import { sampleSchool } from './IdCardView';

export const ID_CARD_API = '/api/v1/id-cards';

export const apiError = (err: any, fallback: string) =>
    err?.response?.data?.msg || err?.response?.data?.message || err?.message || fallback;

/** Design + settings for one audience, with save. The server returns defaults merged in. */
export function useIdCardConfig(audience: Audience) {
    const [config, setConfig] = useState<IdCardConfig | null>(null);
    const [school, setSchool] = useState<SchoolInfo>(sampleSchool);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setDirty(false);
        axios.get(`${ID_CARD_API}/config`, { params: { audience }, withCredentials: true })
            .then(res => {
                if (cancelled) return;
                setConfig(res.data.config);
                setSchool({ ...sampleSchool, ...res.data.school });
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [audience]);

    const update = useCallback((updater: (c: IdCardConfig) => IdCardConfig) => {
        setConfig(prev => (prev ? updater(prev) : prev));
        setDirty(true);
    }, []);

    const save = useCallback(async () => {
        if (!config) return;
        setSaving(true);
        try {
            const res = await axios.put(`${ID_CARD_API}/config`, { audience, config }, { withCredentials: true });
            setConfig(res.data.config);
            setDirty(false);
        } finally {
            setSaving(false);
        }
    }, [audience, config]);

    return { config, school, loading, saving, dirty, update, save };
}

export function useClasses() {
    const [classes, setClasses] = useState<ClassOption[]>([]);
    useEffect(() => {
        axios.get('/api/v1/classes/all', { withCredentials: true })
            .then(res => setClasses((res.data.classes || []).map((c: any) => ({ id: c.id, name: c.name }))))
            .catch(() => setClasses([]));
    }, []);
    return classes;
}
