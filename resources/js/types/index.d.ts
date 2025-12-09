export interface User {
    id: string;
    full_name: string;
    email: string;
    role: "admin" | "merchant" | "customer";
    contact_number?: string;
    street_name?: string;
    postcode?: number;      
    city?: string;
    state?: string;
    country?: string;
    profile_picture?: string;
    merchant?: Merchant;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>
> = T & {
    auth: {
        user: User;
    };
    customers: Customer[];
    merchants: Merchant[];
};

export type Entity = Merchant | Customer;
