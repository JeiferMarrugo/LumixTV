import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements, userAc } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

export const userRole = ac.newRole({
  ...userAc.statements,
});

export const superAdminRole = ac.newRole({
  ...adminAc.statements,
});

export const roles = {
  user: userRole,
  super_admin: superAdminRole,
} as const;
