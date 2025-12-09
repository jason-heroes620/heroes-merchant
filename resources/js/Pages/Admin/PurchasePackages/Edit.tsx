import Form from "./Form";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../../types";
import AuthenticatedLayout from "@/AuthenticatedLayout";

interface EditProps extends PageProps {
    pkg: any;
}

export default function Edit() {
    const { pkg } = usePage<EditProps>().props;

    return (
        <AuthenticatedLayout>
            <Form package={pkg} />
        </AuthenticatedLayout>
    );
}
