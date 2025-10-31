import { usePage } from "@inertiajs/react";
import EntityProfileForm from "./EntityProfileForm";
import type { PageProps } from "../../types";

export default function ViewCustomerProfile() {
    const { customer } = usePage<PageProps>().props;
    if (!customer) return null;

    const entity = customer as PageProps["customers"][number];

    return (
        <EntityProfileForm
            entity={entity}
            type="customer"
            updateRoute="admin.customers.update"
        />
    );
}
