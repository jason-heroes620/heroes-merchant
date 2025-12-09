import { Link } from "@inertiajs/react";
import type { ReactNode } from "react";

interface Props {
    href: string;
    method?: string;
    as?: "a" | "button";
    children: ReactNode;
}

export default function ResponsiveNavLink({
    href,
    as,
    children,
}: Props) {
    return (
        <Link
            href={href}
            as={as || "a"}
            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
        >
            {children}
        </Link>
    );
}
