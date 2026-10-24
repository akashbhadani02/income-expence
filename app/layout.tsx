import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'હિસાબ | આવક અને ખર્ચ', description: 'ગુજરાતી આવક અને ખર્ચ વ્યવસ્થાપન એપ' };
export default function RootLayout({ children }: {
    children: React.ReactNode;
}) { return <html lang="gu"><body>{children}</body></html>; }
