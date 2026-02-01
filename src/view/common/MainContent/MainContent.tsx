import { Route, Routes } from "react-router-dom";
import { Home } from "../../page/Home/Home.tsx";
import { Trip } from "../../page/Trip/Trip.tsx";
import { Vehicle } from "../../page/Vehicle/Vehicle.tsx";
import { Driver } from "../../page/Driver/Driver.tsx";
import { Dashboard } from "../../page/DashBoard/DashBoard.tsx";
import { MainLayout } from "../../components/layout/MainLayout.tsx";
import { User } from "../../page/User/User.tsx";
import { LiveFleetMap } from "../../page/Admin/LiveFleetMap.tsx";
import AdminChat from "../../page/Admin/AdminChat.tsx";
import { Promotions } from "../../page/Promotions/Promotions.tsx";
import { HelpCenter } from "../../page/HelpCenter/HelpCenter.tsx";
import { Documents } from "../../page/Driver/Documents.tsx";
import { AdminDocuments } from "../../page/Admin/AdminDocuments.tsx";
import { ChangePassword } from "../../page/User/ChangePassword.tsx";
import { DemandHotspots } from "../../page/Admin/DemandHotspots.tsx";

import { ProtectedRoute } from "../../components/ProtectedRoute.tsx";

export function MainContent() {
    return (
        <div className="MainContent w-full">
            <Routes>
                <Route path="/" element={<MainLayout><Home /></MainLayout>}></Route>
                <Route path="/trips/*" element={<MainLayout><Trip /></MainLayout>}></Route>
                <Route path="/vehicles" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><Vehicle /></MainLayout>
                    </ProtectedRoute>
                }></Route>
                <Route path="/driver" element={<MainLayout><Driver /></MainLayout>}></Route>
                <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>}></Route>
                <Route path="/live-map" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><LiveFleetMap /></MainLayout>
                    </ProtectedRoute>
                }></Route>
                <Route path="/admin/chat" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminChat /></MainLayout>
                    </ProtectedRoute>
                }></Route>
                <Route path="/promotions" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><Promotions /></MainLayout>
                    </ProtectedRoute>
                }></Route>
                <Route path="/help-center" element={<MainLayout><HelpCenter /></MainLayout>}></Route>
                <Route path="/user" element={<MainLayout><User /></MainLayout>}></Route>
                <Route path="/change-password" element={<MainLayout><ChangePassword /></MainLayout>}></Route>
                <Route path="/documents" element={<MainLayout><Documents /></MainLayout>}></Route>
                <Route path="/admin/approvals" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><AdminDocuments /></MainLayout>
                    </ProtectedRoute>
                }></Route>
                <Route path="/admin/hotspots" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <MainLayout><DemandHotspots /></MainLayout>
                    </ProtectedRoute>
                }></Route>
            </Routes>
        </div>

    )
}