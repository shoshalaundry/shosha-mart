"use client";

import { useActionState, useEffect } from "react";
import { login, ActionState } from "@/app/actions/auth";
import { toast } from "sonner";

const initialState: ActionState = {
    error: undefined,
    success: undefined,
};

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, initialState);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
    }, [state?.error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50 flex-col py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm border border-neutral-200">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-neutral-900 tracking-tight">Login ShoshaMart</h2>
                    <p className="mt-2 text-center text-sm text-neutral-600">
                        Masuk dengan username atau nomor telepon
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={formAction}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="identifier" className="block text-sm font-medium text-neutral-700">
                                Username atau Telepon
                            </label>
                            <input
                                id="identifier"
                                name="identifier"
                                type="text"
                                autoComplete="username"
                                required
                                className="block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm transition-colors"
                                placeholder="Misal: admin, 0812..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full px-3 py-2 border border-neutral-300 placeholder-neutral-400 text-neutral-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className={`w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-colors ${isPending ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {isPending ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Proses Login...
                                </span>
                            ) : (
                                "Masuk Sekarang"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
