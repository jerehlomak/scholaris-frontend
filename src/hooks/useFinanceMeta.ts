import { useState, useEffect } from 'react';
import axios from 'axios';

export function useFinanceMeta() {
    const [terms, setTerms] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const [sessRes, termRes] = await Promise.all([
                    axios.get('/api/v1/sessions', { withCredentials: true }),
                    axios.get('/api/v1/terms', { withCredentials: true })
                ]);
                setSessions(sessRes.data.sessions || []);
                setTerms(termRes.data.terms || []);
            } catch (err) {
                console.error('Failed to load finance metadata', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, []);

    const uniqueTerms = Array.from(new Set(terms.map(t => t.name))) as string[];

    return { terms: uniqueTerms, sessions, loading };
}