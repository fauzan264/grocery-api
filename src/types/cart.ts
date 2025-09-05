export interface IAddtoCart {
    userId: string;
    productId: string;
    quantity: number;
}

export interface IUpdateCart {
    userId: string;
    id: string;
    action: "increment" | "decrement";
}