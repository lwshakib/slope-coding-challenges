export default function MainLayout({children}: {children: React.ReactNode}) {
    return (
        <div className="relative min-h-screen flex flex-col">
            <main className="flex-1 pt-24 pb-12">
                {children}
            </main>
        </div>
    );
}
