import Form from "./Form";
import AuthenticatedLayout from "@/AuthenticatedLayout";

export default function Create() {
    return (
        <AuthenticatedLayout>
            <Form />
        </AuthenticatedLayout>
    );
}
