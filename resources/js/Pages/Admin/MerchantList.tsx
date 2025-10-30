import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../types/index";
import EntityList from "./EntityList";

export default function MerchantList() {
    const { merchants } = usePage<PageProps>().props;
    
    return (
        <EntityList
            type="merchant"
            data={merchants}
            createRoute="admin.merchants.create"
            showRoute="admin.merchants.showProfile"
        />
    );
}

