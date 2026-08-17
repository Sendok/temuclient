import { apiError, apiSuccess } from "@/lib/api-response";
import { createSubscriptionCheckoutSchema } from "@/modules/billing/schema";
import { createSubscriptionCheckout } from "@/modules/billing/service";
import { requireOrganizationRole } from "@/server/auth/authorization";

export async function POST(request: Request) {
  try {
    const context = await requireOrganizationRole(["OWNER", "ADMIN"]);
    const checkout = createSubscriptionCheckoutSchema.parse(await request.json());
    return apiSuccess(await createSubscriptionCheckout({
      organizationId: context.organization.id,
      organizationType: context.organization.type,
      organizationName: context.organization.name,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
      checkout,
    }), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
