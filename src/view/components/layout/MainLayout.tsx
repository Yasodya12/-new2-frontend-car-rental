type Props = {
    children: React.ReactNode;
};

export function MainLayout({ children }: Props) {
    return (
        <div className="flex flex-col min-h-screen bg-bg-dark">
            <main className="flex-grow">
                {children}
            </main>
        </div>
    );
}
