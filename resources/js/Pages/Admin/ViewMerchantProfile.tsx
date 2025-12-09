import EntityProfileForm from "./EntityProfileForm";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../types";
import AuthenticatedLayout from "@/AuthenticatedLayout";

export default function ViewMerchantProfile() {
    const { merchant } = usePage<PageProps>().props;
    if (!merchant) return null;

    const entity = merchant as PageProps["merchants"][number];

    return (
        <AuthenticatedLayout>
            <EntityProfileForm
                entity={entity}
                type="merchant"
                updateRoute="admin.merchants.update"
            />
        </AuthenticatedLayout>
    );
}
