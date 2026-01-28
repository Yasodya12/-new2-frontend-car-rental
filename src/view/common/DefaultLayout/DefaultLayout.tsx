import { Footer } from "../Footer/Footer.tsx";
import { MainContent } from "../MainContent/MainContent.tsx";
import { Navbar } from "../Navbar/Navbar.tsx";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../store/store.ts";
import { fetchConversations } from "../../../slices/chatSlice.ts";
import ChatFloatingButton from "../../component/ChatFloatingButton.tsx";
import ChatWindow from "../../component/ChatWindow.tsx";

export function DefaultLayout() {
    const dispatch = useDispatch<AppDispatch>();
    const { role, token, user } = useSelector((state: RootState) => state.auth);
    const { totalUnreadCount } = useSelector((state: RootState) => state.chat);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        if (token && role !== 'admin') {
            dispatch(fetchConversations());

            // Poll for unread counts every minute
            const interval = setInterval(() => {
                dispatch(fetchConversations());
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [dispatch, token, role]);

    return (
        <div className="flex flex-col min-h-screen bg-bg-dark relative">
            <Navbar />

            <main className="flex-grow">
                <MainContent />
            </main>

            <Footer />

            {/* Global Chat for Users and Drivers (Admin uses a dedicated page) */}
            {token && role !== 'admin' && (
                <>
                    {!isChatOpen && (
                        <ChatFloatingButton
                            onClick={() => setIsChatOpen(true)}
                            unreadCount={totalUnreadCount}
                        />
                    )}

                    {user && (user as any)._id && (
                        <ChatWindow
                            isOpen={isChatOpen}
                            onClose={() => setIsChatOpen(false)}
                            currentUserId={(user as any)._id}
                            token={token}
                        />
                    )}
                </>
            )}
        </div>
    )
}