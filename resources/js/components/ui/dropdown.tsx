import { Menu } from "@headlessui/react";
import type { ReactNode } from "react";

export default function Dropdown({ children }: { children: ReactNode }) {
    return (
        <Menu as="div" className="relative">
            {children}
        </Menu>
    );
}

Dropdown.Trigger = Menu.Button;
Dropdown.Content = Menu.Items;
Dropdown.Link = Menu.Item;
