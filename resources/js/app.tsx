import "../css/app.css";
import "./bootstrap";

import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createRoot } from "react-dom/client";
import { Toaster, toast } from "react-hot-toast";
import React, { useEffect } from "react";

const appName = import.meta.env.VITE_APP_NAME || "Heroes";

// ✅ Custom wrapper to handle flash messages globally
function AppWrapper({ App, props }: any) {
    const { flash } = props.initialPage.props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, {
                icon: '✓',
                iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                },
            });
        }
        if (flash?.error) {
            toast.error(flash.error, {
                icon: '✕',
                iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                },
            });
        }
    }, [flash]);

    return (
        <>
            <App {...props} />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 1200,
                    style: {
                        background: "#fff",
                        color: "#374151",
                        padding: "16px 20px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        border: "1px solid #E5E7EB",
                        maxWidth: "420px",
                    },
                    success: {
                        style: {
                            background: "#fff",
                            color: "#065F46",
                            border: "1px solid #D1FAE5",
                        },
                        iconTheme: {
                            primary: "#10B981",
                            secondary: "#fff",
                        },
                    },
                    error: {
                        style: {
                            background: "#fff",
                            color: "#991B1B",
                            border: "1px solid #FEE2E2",
                        },
                        iconTheme: {
                            primary: "#EF4444",
                            secondary: "#fff",
                        },
                    },
                }}
            />
        </>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob("./Pages/**/*.tsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <React.StrictMode>
                <AppWrapper App={App} props={props} />
            </React.StrictMode>
        );
    },
    progress: {
        color: "#EA580C",
    },
});