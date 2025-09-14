import { Prisma, DiscountType } from "../generated/prisma";

export async function validateAndCalculateDiscounts(
  tx: Prisma.TransactionClient,
  couponCodes: string[] | undefined,
  userId: string,
  totalPrice: number,
  storeId: string,
  cartItems: Array<{ productId: string; quantity: number; price: number; subTotal: number }>
): Promise<{
  discountAmount: number;
  appliedDiscountIds: string[];
  extraItems: Array<{ productId: string; quantity: number; price: number; subTotal: number }>;
}> {
  if (!couponCodes || couponCodes.length === 0) {
    return { discountAmount: 0, appliedDiscountIds: [], extraItems: [] };
  }

  let totalDiscount = 0;
  const appliedDiscountIds: string[] = [];
  let extraItems: Array<{ productId: string; quantity: number; price: number; subTotal: number }> = [];

  for (const code of couponCodes) {
    const discountRecord = await tx.discount.findFirst({
      where: {
        code,
        startsAt: { lte: new Date() },
        OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        isActive: true,
      },
    });

    if (!discountRecord) {
      throw { message: `Kode kupon ${code} tidak valid atau sudah kadaluarsa`, isExpose: true };
    }

    // ✅ Validasi perUserLimit
    if (discountRecord.maxUsesPerUser !== null) {
      const userRedemptions = await tx.discountRedemption.count({
        where: { discountId: discountRecord.id, userId },
      });

      if (userRedemptions >= discountRecord.maxUsesPerUser) {
        throw { message: `Anda sudah mencapai batas penggunaan kupon ${code}`, isExpose: true };
      }
    }

    // ✅ Cek batas global
    const maxUses = discountRecord.maxUses;
    const usesCount = discountRecord.usesCount ?? 0;
    if (maxUses !== null && usesCount >= maxUses) {
      throw { message: `Kupon ${code} sudah mencapai batas penggunaan`, isExpose: true };
    }

    // ✅ Cek minimum order
    if (discountRecord.minSpend !== null && totalPrice < Number(discountRecord.minSpend)) {
      throw { message: `Minimal pembelian untuk kupon ${code} adalah ${discountRecord.minSpend}`, isExpose: true };
    }

    // ✅ Hitung diskon
    const dType: DiscountType = discountRecord.discountType;
    let discountAmount = 0;
    const itemsToAdd: Array<{ productId: string; quantity: number; price: number; subTotal: number }> = [];

    if (dType === "MANUAL" || dType === "SEASONAL") {
      if (discountRecord.isPercentage) {
        const percent = Number(discountRecord.value) || 0;
        discountAmount = Number(((totalPrice * percent) / 100).toFixed(2));
      } else {
        const fixedValue = Number(discountRecord.value) || 0;
        discountAmount = fixedValue > totalPrice ? totalPrice : fixedValue;
      }
    } else if (dType === "MIN_SPEND") {
      if (discountRecord.minSpend && totalPrice >= Number(discountRecord.minSpend)) {
        const fixedValue = Number(discountRecord.value) || 0;
        discountAmount = fixedValue > totalPrice ? totalPrice : fixedValue;
      }
    } else if (dType === "BUNDLE") {
      if (discountRecord.buyQuantity && discountRecord.value) {
        discountAmount = Number(discountRecord.value) || 0;
      }
    } else if (dType === "BUY_X_GET_Y") {
      if (discountRecord.buyQuantity && discountRecord.getQuantity) {
        let targetItems = cartItems;

        if (discountRecord.productId) {
          targetItems = cartItems.filter((item) => item.productId === discountRecord.productId);
        }

        for (const item of targetItems) {
          if (item.quantity >= discountRecord.buyQuantity) {
            const bonusCount =
              Math.floor(item.quantity / discountRecord.buyQuantity) * discountRecord.getQuantity;

            itemsToAdd.push({
              productId: item.productId,
              quantity: bonusCount,
              price: 0,
              subTotal: 0,
            });
          }
        }

        discountAmount = 0; // BUY_X_GET_Y hanya kasih produk gratis
      }
    } else {
      throw { message: `Tipe kupon ${dType} tidak didukung`, isExpose: true };
    }

    // ✅ Akumulasi hasil
    totalDiscount += discountAmount;
    appliedDiscountIds.push(discountRecord.id);
    extraItems = [...extraItems, ...itemsToAdd];
  }

  return {
    discountAmount: totalDiscount,
    appliedDiscountIds,
    extraItems,
  };
}
