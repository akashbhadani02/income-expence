'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
type Person = {
    _id: string;
    name: string;
};
type Tx = {
    _id: string;
    personId: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    note: string;
    date: string;
};
type User = {
    name: string;
    email: string;
};
const money = (n: number) => new Intl.NumberFormat('gu-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const today = () => new Date().toISOString().slice(0, 10);
const categories = ['પગાર', 'ધંધો', 'વેચાણ', 'ખોરાક', 'મુસાફરી', 'બિલ', 'ખરીદી', 'ઘરખર્ચ', 'અન્ય'];
export default function Home() {
    const [user, setUser] = useState<User | null>(null), [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [auth, setAuth] = useState({ name: '', email: '', password: '' }), [authError, setAuthError] = useState(''), [busy, setBusy] = useState(false);
    const [people, setPeople] = useState<Person[]>([]), [txs, setTxs] = useState<Tx[]>([]), [tab, setTab] = useState('overview'), [period, setPeriod] = useState('month');
    const [personName, setPersonName] = useState(''), [selectedPerson, setSelectedPerson] = useState('');
    const [editing, setEditing] = useState<string | null>(null);
    const [form, setForm] = useState({ personId: '', type: 'expense' as 'income' | 'expense', amount: '', category: 'ખોરાક', note: '', date: today() });
    const [error, setError] = useState(''), [success, setSuccess] = useState('');
    const [showPasswordChange, setShowPasswordChange] = useState(false), [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' }), [passwordMessage, setPasswordMessage] = useState(''), [passwordBusy, setPasswordBusy] = useState(false);
    const api = useCallback(async (url: string, options?: RequestInit) => { const r = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } }); const d = await r.json(); if (!r.ok)
        throw new Error(d.error || 'કંઈક ખોટું થયું'); return d; }, []);
    const refresh = useCallback(async () => { const [p, t] = await Promise.all([api('/api/people'), api('/api/transactions')]); setPeople(p.people); setTxs(t.transactions); setForm(f => ({ ...f, personId: f.personId || p.people[0]?._id || '' })); }, [api]);
    useEffect(() => {
        let active = true;
        api('/api/auth/me')
            .then(async (d) => {
                if (!active) return;
                setUser(d.user);
                await refresh();
            })
            .catch(() => { });
        return () => { active = false; };
    }, [api, refresh]);

    // MongoDB is the shared source of truth. Refresh every 2 seconds while signed in
    // for near-real-time cross-device updates, and refresh immediately on focus/visibility.
    useEffect(() => {
        if (!user) return;
        let refreshing = false;
        const sync = async () => {
            if (refreshing || document.visibilityState === 'hidden') return;
            refreshing = true;
            try { await refresh(); } catch { /* Keep the current screen during temporary network errors. */ }
            finally { refreshing = false; }
        };
        const onVisibility = () => { if (document.visibilityState === 'visible') void sync(); };
        window.addEventListener('focus', sync);
        document.addEventListener('visibilitychange', onVisibility);
        const timer = window.setInterval(sync, 2000);
        return () => {
            window.removeEventListener('focus', sync);
            document.removeEventListener('visibilitychange', onVisibility);
            window.clearInterval(timer);
        };
    }, [user, refresh]);
    const authSubmit = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setAuthError(''); try {
        const d = await api('/api/auth/' + authMode, { method: 'POST', body: JSON.stringify(auth) });
        setUser(d.user);
        await refresh();
    }
    catch (e) {
        setAuthError((e as Error).message);
    }
    finally {
        setBusy(false);
    } };
    const addPerson = async (e: React.FormEvent) => { e.preventDefault(); setError(''); try {
        const d = await api('/api/people', { method: 'POST', body: JSON.stringify({ name: personName }) });
        setPeople(p => [...p, d.person].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedPerson(d.person._id);
        setForm(f => ({ ...f, personId: f.personId || d.person._id }));
        setPersonName('');
        setSuccess('વ્યક્તિ ઉમેરાઈ ગઈ.');
    }
    catch (e) {
        setError((e as Error).message);
    } };
    const submitTx = async (e: React.FormEvent) => { e.preventDefault(); setError(''); setSuccess(''); try {
        const body = { ...form, amount: Number(form.amount) };
        if (editing) {
            await api('/api/transactions/' + editing, { method: 'PUT', body: JSON.stringify(body) });
            setSuccess('એન્ટ્રી અપડેટ થઈ.');
        }
        else {
            await api('/api/transactions', { method: 'POST', body: JSON.stringify(body) });
            setSuccess('એન્ટ્રી સેવ થઈ ગઈ.');
        }
        setEditing(null);
        setForm(f => ({ ...f, amount: '', note: '', date: today() }));
        await refresh();
    }
    catch (e) {
        setError((e as Error).message);
    } };
    const deleteTx = async (id: string) => { if (!confirm('આ એન્ટ્રી ડિલીટ કરવી છે?'))
        return; try {
        await api('/api/transactions/' + id, { method: 'DELETE' });
        await refresh();
        setSuccess('એન્ટ્રી ડિલીટ થઈ.');
    }
    catch (e) {
        setError((e as Error).message);
    } };
    const logout = async () => { await api('/api/auth/logout', { method: 'POST' }); setUser(null); setPeople([]); setTxs([]); };
    const changePassword = async (e: React.FormEvent) => { e.preventDefault(); setPasswordMessage(''); if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordMessage('નવો પાસવર્ડ અને પુષ્ટિ મેળ ખાતા નથી.'); return; } if (passwordForm.newPassword.length < 8) { setPasswordMessage('નવો પાસવર્ડ ઓછામાં ઓછા 8 અક્ષરનો હોવો જોઈએ.'); return; } setPasswordBusy(true); try { const d = await api('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) }); setPasswordMessage(d.message || 'પાસવર્ડ બદલાઈ ગયો.'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); } catch (e) { setPasswordMessage((e as Error).message); } finally { setPasswordBusy(false); } };
    const filtered = useMemo(() => { const now = new Date(); return txs.filter(t => { const d = new Date(t.date); if (period === 'week') {
        const start = new Date(now);
        start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        start.setHours(0, 0, 0, 0);
        return d >= start && d <= now;
    } if (period === 'month')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); if (period === 'year')
        return d.getFullYear() === now.getFullYear(); return true; }); }, [txs, period]);
    const totals = useMemo(() => ({ income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) }), [filtered]);
    const perPerson = useMemo(() => people.map(p => { const a = filtered.filter(t => t.personId === p._id); const income = a.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0); const expense = a.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0); return { ...p, income, expense, balance: income - expense, count: a.length }; }).sort((a, b) => b.expense - a.expense), [people, filtered]);
    const startEdit = (t: Tx) => { setEditing(t._id); setForm({ personId: t.personId, type: t.type, amount: String(t.amount), category: t.category, note: t.note || '', date: new Date(t.date).toISOString().slice(0, 10) }); setTab('entry'); };
    const exportCsv = () => { const rows = [['તારીખ', 'વ્યક્તિ', 'પ્રકાર', 'રકમ', 'કેટેગરી', 'નોંધ'], ...filtered.map(t => [new Date(t.date).toLocaleDateString('gu-IN'), people.find(p => p._id === t.personId)?.name || 'અજ્ઞાત', t.type === 'income' ? 'આવક' : 'ખર્ચ', String(t.amount), t.category, t.note || ''])]; const csv = '\ufeff' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })); a.download = 'hisab-report.csv'; a.click(); URL.revokeObjectURL(a.href); };
    if (!user)
        return <main className="authPage"><section className="authCard"><div className="brandMark">હિ</div><p className="eyebrow">તમારો ડિજિટલ હિસાબ</p><h1>આવક અને ખર્ચ</h1><p className="muted">દરેક વ્યક્તિનો હિસાબ, એક જ જગ્યાએ.</p><div className="authSwitch"><button className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>નવું એકાઉન્ટ</button><button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>લૉગિન</button></div><form onSubmit={authSubmit} className="formStack">{authMode === 'register' && <label>તમારું નામ<input required value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="નામ લખો"/></label>}<label>ઇમેઇલ<input required type="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com"/></label><label>પાસવર્ડ<input required minLength={8} type="password" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="ઓછામાં ઓછા 8 અક્ષર"/></label>{authError && <p className="error">{authError}</p>}<button className="primary full" disabled={busy}>{busy ? 'થોડી રાહ જુઓ...' : authMode === 'register' ? 'એકાઉન્ટ બનાવો' : 'લૉગિન કરો'}</button></form><p className="tiny muted">તમારો ડેટા તમારા એકાઉન્ટ સાથે MongoDBમાં સાચવાશે.</p></section></main>;
    return <main className="appShell"><aside className="sidebar"><div className="brand"><div className="brandMark">હિ</div><div className="brandText"><strong>હિસાબ</strong><small>INCOME & EXPENSE</small></div><button className="brandLogout" onClick={logout} title="લૉગઆઉટ" aria-label="લૉગઆઉટ">↪</button></div><div className="sideLabel">મેનુ</div><nav>{[['overview', '▦', 'ડેશબોર્ડ'], ['entry', '＋', 'નવી એન્ટ્રી'], ['people', '♙', 'વ્યક્તિઓ'], ['reports', '▤', 'રિપોર્ટ'], ['password', '🔒', 'પાસવર્ડ બદલો']].map(([id, icon, label]) => <button key={id} onClick={() => { if (id === 'password') { setShowPasswordChange(true); setPasswordMessage(''); } else { setTab(id); } }} className={tab === id ? 'navActive' : ''} type="button"><span>{icon}</span>{label}</button>)}</nav><div className="sideBottom"><div className="avatar">{user.name?.slice(0, 1) || user.email.slice(0, 1).toUpperCase()}</div><div className="userMeta"><strong>{user.name || 'મારું એકાઉન્ટ'}</strong><small>{user.email}</small></div><button className="secondary smallButton" onClick={() => { setShowPasswordChange(true); setPasswordMessage(''); }} title="પાસવર્ડ બદલો">પાસવર્ડ બદલો</button><button className="logout" onClick={logout} title="લૉગઆઉટ">↪</button></div></aside>
        <section className="mainArea"><header className="topbar"><div><p className="eyebrow">તમારી નાણાકીય સ્થિતિ</p><h1>{({ overview: 'ડેશબોર્ડ', entry: editing ? 'એન્ટ્રીમાં ફેરફાર' : 'નવી એન્ટ્રી', people: 'વ્યક્તિઓનું સંચાલન', reports: 'વિગતવાર રિપોર્ટ' } as Record<string, string>)[tab]}</h1></div><div className="topActions"><span className="todayBadge">◷ {new Date().toLocaleDateString('gu-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span><button className="primary newEntryButton" onClick={() => { setEditing(null); setForm(f => ({ ...f, amount: '', note: '', date: today() })); setTab('entry'); }}>＋ નવી એન્ટ્રી</button><button className="secondary passwordTopButton" onClick={() => { setShowPasswordChange(true); setPasswordMessage(''); }} title="પાસવર્ડ બદલો">પાસવર્ડ બદલો</button><button className="topLogout" onClick={logout} title="લૉગઆઉટ" aria-label="લૉગઆઉટ"><span aria-hidden="true">↪</span><span className="topLogoutLabel">લૉગઆઉટ</span></button></div></header>
            <div className="content"><div className="notice">🔒 તમારો હિસાબ ખાનગી છે અને તમારા લૉગિન એકાઉન્ટ સાથે જોડાયેલો છે.</div>{error && <div className="alert error">{error}</div>}{success && <div className="alert success">{success}</div>}
                {tab === 'overview' && <><div className="periodRow"><div><h2>સારાંશ</h2><p className="muted">તમારી આવક અને ખર્ચ પર એક નજર</p></div><select value={period} onChange={e => setPeriod(e.target.value)}><option value="week">આ અઠવાડિયું</option><option value="month">આ મહિનો</option><option value="year">આ વર્ષ</option><option value="all">બધો સમય</option></select></div><div className="statGrid"><div className="statCard"><div className="statTop"><span>કુલ આવક</span><span className="statIcon green">↗</span></div><strong>{money(totals.income)}</strong><small className="greenText">આવકની એન્ટ્રીઓ</small></div><div className="statCard"><div className="statTop"><span>કુલ ખર્ચ</span><span className="statIcon red">↘</span></div><strong>{money(totals.expense)}</strong><small className="redText">ખર્ચની એન્ટ્રીઓ</small></div><div className="statCard balanceCard"><div className="statTop"><span>નેટ બેલેન્સ</span><span className="statIcon">₹</span></div><strong>{money(totals.income - totals.expense)}</strong><small>આવક − ખર્ચ</small></div><div className="statCard"><div className="statTop"><span>કુલ એન્ટ્રીઓ</span><span className="statIcon purple">≡</span></div><strong>{filtered.length}</strong><small>પસંદ કરેલા સમયગાળામાં</small></div></div><div className="twoCol"><section className="panel"><div className="panelHead"><div><h2>વ્યક્તિ પ્રમાણે હિસાબ</h2><p className="muted">કોણે કેટલી આવક કરી અને ખર્ચ કર્યો</p></div><button className="textButton" onClick={() => setTab('reports')}>બધા રિપોર્ટ →</button></div>{perPerson.length === 0 ? <div className="empty"><div>♙</div><strong>હજુ કોઈ વ્યક્તિ નથી</strong><p>રિપોર્ટ જોવા પહેલાં વ્યક્તિ ઉમેરો.</p><button className="primary" onClick={() => setTab('people')}>વ્યક્તિ ઉમેરો</button></div> : <div className="tableWrap"><table><thead><tr><th>વ્યક્તિ</th><th>આવક</th><th>ખર્ચ</th><th>બેલેન્સ</th></tr></thead><tbody>{perPerson.map(p => <tr key={p._id}><td><span className="personCell"><span className="miniAvatar">{p.name.slice(0, 1)}</span>{p.name}</span></td><td className="greenText">{money(p.income)}</td><td className="redText">{money(p.expense)}</td><td className={p.balance >= 0 ? 'greenText' : 'redText'}>{money(p.balance)}</td></tr>)}</tbody></table></div>}</section><section className="panel"><div className="panelHead"><div><h2>આવક સામે ખર્ચ</h2><p className="muted">પસંદ કરેલા સમયગાળાનો સરવાળો</p></div></div><div className="chartArea"><div className="chartLegend"><span><i className="dot greenBg"/> આવક</span><span><i className="dot redBg"/> ખર્ચ</span></div><div className="barGroup"><div className="barCol"><strong>{money(totals.income)}</strong><div className="bar greenBar" style={{ height: `${Math.max(5, totals.income / Math.max(totals.income, totals.expense, 1) * 150)}px` }}/><small>આવક</small></div><div className="barCol"><strong>{money(totals.expense)}</strong><div className="bar redBar" style={{ height: `${Math.max(5, totals.expense / Math.max(totals.income, totals.expense, 1) * 150)}px` }}/><small>ખર્ચ</small></div></div><div className="chartFoot"><span>બચતનું પ્રમાણ</span><strong>{totals.income ? Math.round((totals.income - totals.expense) / totals.income * 100) : 0}%</strong></div></div></section></div><section className="panel recentPanel"><div className="panelHead"><div><h2>તાજેતરની એન્ટ્રીઓ</h2><p className="muted">તમારી છેલ્લી આવક અને ખર્ચ</p></div><button className="textButton" onClick={() => setTab('reports')}>બધી એન્ટ્રીઓ →</button></div><Transactions rows={filtered.slice(0, 6)} people={people} onEdit={startEdit} onDelete={deleteTx}/></section></>}
                {tab === 'entry' && <div className="formLayout"><section className="panel entryPanel"><div className="panelHead"><div><h2>{editing ? 'એન્ટ્રી અપડેટ કરો' : 'નવી એન્ટ્રી ઉમેરો'}</h2><p className="muted">હિસાબની વિગતો ભરો</p></div><span className="formIcon">＋</span></div>{people.length === 0 && <div className="notice">પહેલાં વ્યક્તિ ઉમેરો, પછી એન્ટ્રી કરી શકશો.</div>}<form className="entryForm" onSubmit={submitTx}><div className="typeToggle"><button type="button" className={form.type === 'income' ? 'incomeSelected' : ''} onClick={() => setForm({ ...form, type: 'income' })}>↗ આવક</button><button type="button" className={form.type === 'expense' ? 'expenseSelected' : ''} onClick={() => setForm({ ...form, type: 'expense' })}>↘ ખર્ચ</button></div><label>વ્યક્તિ પસંદ કરો<select required value={form.personId} onChange={e => setForm({ ...form, personId: e.target.value })}><option value="">વ્યક્તિ પસંદ કરો</option>{people.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label><label>રકમ (₹)<input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00"/></label><div className="fieldRow"><label>કેટેગરી<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>તારીખ<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}/></label></div><label>નોંધ (વૈકલ્પિક)<textarea rows={3} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="આવક અથવા ખર્ચની વિગત લખો..."/></label><div className="formButtons"><button type="button" className="secondary" onClick={() => { setEditing(null); setForm(f => ({ ...f, amount: '', note: '', date: today() })); }}>રીસેટ</button><button className="primary" disabled={!people.length}>{editing ? 'ફેરફાર સેવ કરો' : 'એન્ટ્રી સેવ કરો'}</button></div></form></section><section className="panel sideTip"><div className="tipIcon">✦</div><h2>સચોટ હિસાબ માટે</h2><p>દરેક એન્ટ્રી માટે યોગ્ય વ્યક્તિ પસંદ કરો. પછી વ્યક્તિ પ્રમાણેના રિપોર્ટમાં તેમની આવક, ખર્ચ અને બેલેન્સ આપમેળે ગણાશે.</p><ul><li>આવક અને ખર્ચ અલગથી નોંધો</li><li>તારીખ સાચી પસંદ કરો</li><li>નોંધમાં જરૂરી માહિતી લખો</li></ul></section></div>}
                {tab === 'people' && <div className="twoCol peopleLayout"><section className="panel"><div className="panelHead"><div><h2>નવી વ્યક્તિ ઉમેરો</h2><p className="muted">પરિવાર, સ્ટાફ અથવા ભાગીદારો</p></div></div><form className="formStack" onSubmit={addPerson}><label>વ્યક્તિનું નામ<input required value={personName} onChange={e => setPersonName(e.target.value)} placeholder="જેમ કે મનોજભાઈ"/></label><button className="primary">＋ વ્યક્તિ ઉમેરો</button></form></section><section className="panel"><div className="panelHead"><div><h2>તમારી વ્યક્તિઓ</h2><p className="muted">કુલ {people.length} વ્યક્તિ</p></div></div>{people.length === 0 ? <div className="empty"><div>♙</div><p>હજુ કોઈ વ્યક્તિ ઉમેરેલી નથી.</p></div> : <div className="peopleList">{people.map(p => <div className="peopleItem" key={p._id}><span className="miniAvatar">{p.name.slice(0, 1)}</span><div className="peopleName"><strong>{p.name}</strong><small>{txs.filter(t => t.personId === p._id).length} એન્ટ્રીઓ</small></div><button className="secondary smallButton" onClick={() => { setSelectedPerson(p._id); setTab('reports'); }}>રિપોર્ટ જુઓ →</button></div>)}</div>}</section></div>}
                {tab === 'reports' && <><div className="periodRow"><div><h2>વિગતવાર રિપોર્ટ</h2><p className="muted">વ્યક્તિ અને સમયગાળા પ્રમાણે હિસાબ</p></div><div className="reportActions"><select value={period} onChange={e => setPeriod(e.target.value)}><option value="week">આ અઠવાડિયું</option><option value="month">આ મહિનો</option><option value="year">આ વર્ષ</option><option value="all">બધો સમય</option></select><button className="secondary" onClick={exportCsv}>↓ CSV / Excel</button><button className="secondary" onClick={() => window.print()}>⎙ PDF / પ્રિન્ટ</button></div></div><div className="statGrid compactStats"><div className="statCard"><span>કુલ આવક</span><strong className="greenText">{money(totals.income)}</strong></div><div className="statCard"><span>કુલ ખર્ચ</span><strong className="redText">{money(totals.expense)}</strong></div><div className="statCard"><span>બેલેન્સ</span><strong>{money(totals.income - totals.expense)}</strong></div></div><section className="panel"><div className="panelHead"><div><h2>વ્યક્તિ પ્રમાણે સારાંશ</h2><p className="muted">દરેક વ્યક્તિનો અલગ હિસાબ</p></div><select value={selectedPerson} onChange={e => setSelectedPerson(e.target.value)}><option value="">બધી વ્યક્તિઓ</option>{people.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div><div className="tableWrap"><table><thead><tr><th>વ્યક્તિ</th><th>એન્ટ્રીઓ</th><th>કુલ આવક</th><th>કુલ ખર્ચ</th><th>બેલેન્સ</th></tr></thead><tbody>{perPerson.filter(p => !selectedPerson || p._id === selectedPerson).map(p => <tr key={p._id}><td><span className="personCell"><span className="miniAvatar">{p.name.slice(0, 1)}</span>{p.name}</span></td><td>{p.count}</td><td className="greenText">{money(p.income)}</td><td className="redText">{money(p.expense)}</td><td className={p.balance >= 0 ? 'greenText' : 'redText'}>{money(p.balance)}</td></tr>)}</tbody></table></div></section><section className="panel recentPanel"><div className="panelHead"><div><h2>એન્ટ્રીની વિગતો</h2><p className="muted">પસંદ કરેલા સમયગાળાની તમામ એન્ટ્રીઓ</p></div></div><Transactions rows={filtered.filter(t => !selectedPerson || t.personId === selectedPerson)} people={people} onEdit={startEdit} onDelete={deleteTx}/></section></>}
            </div>{showPasswordChange && <div className="modalBackdrop" role="presentation" onClick={e => { if (e.target === e.currentTarget) setShowPasswordChange(false); }}><section className="panel passwordModal" role="dialog" aria-modal="true" aria-labelledby="passwordChangeTitle"><div className="panelHead"><div><h2 id="passwordChangeTitle">પાસવર્ડ બદલો</h2><p className="muted">સુરક્ષા માટે પહેલાં જૂનો પાસવર્ડ દાખલ કરો.</p></div><button className="secondary smallButton" type="button" onClick={() => setShowPasswordChange(false)}>બંધ કરો</button></div><form className="formStack" onSubmit={changePassword}><label>જૂનો પાસવર્ડ<input required type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}/></label><label>નવો પાસવર્ડ<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="ઓછામાં ઓછા 8 અક્ષર"/></label><label>નવો પાસવર્ડ ફરી લખો<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}/></label>{passwordMessage && <p className={passwordMessage.includes('સફળતાપૂર્વક') ? 'success' : 'error'}>{passwordMessage}</p>}<button className="primary full" disabled={passwordBusy}>{passwordBusy ? 'બદલી રહ્યા છીએ...' : 'પાસવર્ડ બદલો'}</button></form></section></div>}</section></main>;
}
function Transactions({ rows, people, onEdit, onDelete }: {
    rows: Tx[];
    people: Person[];
    onEdit: (t: Tx) => void;
    onDelete: (id: string) => void;
}) { if (!rows.length)
    return <div className="empty"><div>▤</div><strong>હજુ કોઈ એન્ટ્રી નથી</strong><p>નવી એન્ટ્રી ઉમેરતાં અહીં દેખાશે.</p></div>; return <div className="tableWrap"><table><thead><tr><th>વિગત</th><th>વ્યક્તિ</th><th>તારીખ</th><th>રકમ</th><th>ક્રિયા</th></tr></thead><tbody>{rows.map(t => <tr key={t._id}><td><span className="transactionName">{t.category}</span><small className="tableNote">{t.note || (t.type === 'income' ? 'આવક' : 'ખર્ચ')}</small></td><td>{people.find(p => p._id === t.personId)?.name || '—'}</td><td>{new Date(t.date).toLocaleDateString('gu-IN')}</td><td className={t.type === 'income' ? 'greenText' : 'redText'}>{t.type === 'income' ? '+' : '−'}{money(t.amount)}</td><td><div className="rowActions"><button onClick={() => onEdit(t)} title="એડિટ">✎</button><button onClick={() => onDelete(t._id)} title="ડિલીટ">×</button></div></td></tr>)}</tbody></table></div>; }
