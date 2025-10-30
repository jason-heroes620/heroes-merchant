import EntityProfileForm from "./EntityProfileForm";
import { usePage } from "@inertiajs/react";

export default function ViewMerchantProfile() {
    const { merchant } = usePage().props;
    
    return (
        <EntityProfileForm
            type="merchant"
            entity={merchant}
            updateRoute="admin.merchants.update"
        />
    );
}
