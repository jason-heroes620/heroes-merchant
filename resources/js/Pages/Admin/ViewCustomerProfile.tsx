import EntityProfileForm from "./EntityProfileForm";
import { usePage } from "@inertiajs/react";

export default function ViewCustomerProfile() {
    const { customer } = usePage().props;

    return (
        <EntityProfileForm
            type="customer"
            entity={customer}
            updateRoute="admin.customers.update"
        />
    );
}
