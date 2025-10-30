import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../types";
import EntityList from "./EntityList";

export default function CustomerList() {
    const { customers } = usePage<PageProps>().props;

    return (
        <EntityList
            type="customer"
            data={customers}
            createRoute="admin.customers.create"
            showRoute="admin.customers.showProfile"
        />
    );
}
