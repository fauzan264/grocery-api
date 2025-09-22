
export interface IOrderResult {
  order: {
    id: string;
    totalPrice: number;
    discountTotal: number | null;
    finalPrice: number;
    paymentMethod: string | null;
    storeId: string;
    status: string;
  };
  userAddress: {
    id: string;
  };
  user: { fullName: string; phoneNumber: string };
  gopayTransaction?: {
    token: string;
    redirect_url: string;
  };
}
