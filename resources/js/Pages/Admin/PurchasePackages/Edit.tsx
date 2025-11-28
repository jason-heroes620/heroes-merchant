import Form from "./Form";
import { usePage } from "@inertiajs/react";
import type { PageProps } from "../../../types";

interface EditProps extends PageProps {
    pkg: any;
}

export default function Edit() {
    const { pkg } = usePage<EditProps>().props;

    return (
        <div>
            <Form package={pkg} />
        </div>
    );
}
