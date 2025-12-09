import { usePage } from "@inertiajs/react";
import EntityProfileForm from "./EntityProfileForm";
import type { PageProps } from "../../types";
import AuthenticatedLayout from "@/AuthenticatedLayout";

export default function ViewCustomerProfile() {
    const { customer } = usePage<PageProps>().props;
    if (!customer) return null;

    const entity = customer as PageProps["customers"][number];

    return (
        <AuthenticatedLayout>
            <EntityProfileForm
                entity={entity}
                type="customer"
                updateRoute="admin.customers.update"
            />
        </AuthenticatedLayout>
    );
}
