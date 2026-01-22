type Props = {
    children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <main className="flex-grow">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
