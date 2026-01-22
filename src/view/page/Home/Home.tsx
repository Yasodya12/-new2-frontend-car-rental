import {useEffect} from "react";
import {getUserFromToken} from "../../../auth/auth.ts";
import {useDispatch, useSelector} from "react-redux";
import {logout} from "../../../slices/authSlice.ts";
import {useNavigate} from "react-router-dom";
import type {RootState} from "../../../store/store.ts";
import {setCredentials} from "../../../slices/authSlice.ts";

export function Home() {
    const user = useSelector((state: RootState) => state.auth.user);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');

        if (accessToken) {
            const userData = getUserFromToken(accessToken);
            dispatch(setCredentials({
                user: userData,
                role: userData.role,
                token: accessToken
            }));
        }
    }, [dispatch]);





    return (
        <>
            <div className="bg-white shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-between py-20">
                    <div className="text-center md:text-left pl-8 md:w-1/2">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
                            Streamline Your Transport Operations
                        </h1>
                        <p className="text-gray-600 mb-6 text-lg">
                            From trip assignments to real-time management, your transport solution starts here.
                        </p>
                        <div className="space-x-4">
                            {!user ? (
                                <>
                                    <a
                                        href="/login"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow transition"
                                    >
                                        Login
                                    </a>
                                    <a
                                        href="/register"
                                        className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-50 transition"
                                    >
                                        Register
                                    </a>
                                </>
                            ) : (
                                <a
                                    href="/home"
                                    className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-50 transition"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const confirmed = window.confirm("Are you sure you want to logout?");
                                        if (confirmed) {
                                            dispatch(logout());
                                            navigate('/');
                                            window.location.reload();
                                        }
                                    }}
                                >
                                    Logout
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="mt-10 md:mt-0 md:w-1/2 text-center">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/1995/1995529.png"
                            alt="Transport Illustration"
                            className="w-72 mx-auto"
                        />
                    </div>
                </div>
            </div>

            <div className="py-16">
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-12">
                    What You Can Manage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-blue-600 text-4xl mb-2">🚐</div>
                        <h3 className="font-semibold text-lg">Trips</h3>
                        <p className="text-gray-600">Assign and monitor trip progress easily.</p>
                    </div>
                    <div>
                        <div className="text-blue-600 text-4xl mb-2">🧍‍♂️</div>
                        <h3 className="font-semibold text-lg">Drivers</h3>
                        <p className="text-gray-600">Manage driver accounts and track their activities.</p>
                    </div>
                    <div>
                        <div className="text-blue-600 text-4xl mb-2">🚛</div>
                        <h3 className="font-semibold text-lg">Vehicles</h3>
                        <p className="text-gray-600">Add, update, and track vehicle availability.</p>
                    </div>
                    <div>
                        <div className="text-blue-600 text-4xl mb-2">📆</div>
                        <h3 className="font-semibold text-lg">Bookings</h3>
                        <p className="text-gray-600">Customer transport requests made simple.</p>
                    </div>
                </div>
            </div>
        </>

    )
}